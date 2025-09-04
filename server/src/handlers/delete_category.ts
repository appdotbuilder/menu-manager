import { db } from '../db';
import { categoriesTable, menuItemsTable } from '../db/schema';
import { type DeleteEntityInput } from '../schema';
import { eq, count } from 'drizzle-orm';

export const deleteCategory = async (input: DeleteEntityInput): Promise<boolean> => {
  try {
    // First check if category exists
    const category = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, input.id))
      .execute();

    if (category.length === 0) {
      return false;
    }

    // Check if category has any menu items
    const menuItemsCount = await db.select({ count: count() })
      .from(menuItemsTable)
      .where(eq(menuItemsTable.category_id, input.id))
      .execute();

    // If category has menu items, we cannot delete it (foreign key constraint)
    if (menuItemsCount[0].count > 0) {
      throw new Error(`Cannot delete category with id ${input.id} because it has ${menuItemsCount[0].count} menu items. Delete the menu items first.`);
    }

    // Delete the category
    const result = await db.delete(categoriesTable)
      .where(eq(categoriesTable.id, input.id))
      .execute();

    return true;
  } catch (error) {
    console.error('Category deletion failed:', error);
    throw error;
  }
};