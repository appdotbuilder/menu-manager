import { db } from '../db';
import { menuItemsTable, categoriesTable } from '../db/schema';
import { type CreateMenuItemInput, type MenuItem, type DietaryLabel } from '../schema';
import { eq } from 'drizzle-orm';

export const createMenuItem = async (input: CreateMenuItemInput): Promise<MenuItem> => {
  try {
    // First, validate that the category exists
    const categoryExists = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, input.category_id))
      .limit(1)
      .execute();

    if (categoryExists.length === 0) {
      throw new Error(`Category with id ${input.category_id} does not exist`);
    }

    // Insert menu item record
    const result = await db.insert(menuItemsTable)
      .values({
        name: input.name,
        description: input.description,
        price: input.price.toString(), // Convert number to string for numeric column
        ingredients: input.ingredients,
        image_url: input.image_url,
        dietary_labels: input.dietary_labels || [],
        is_available: input.is_available ?? true,
        display_order: input.display_order ?? 0,
        category_id: input.category_id
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers and handle dietary_labels
    const menuItem = result[0];
    return {
      ...menuItem,
      price: parseFloat(menuItem.price), // Convert string back to number
      dietary_labels: (menuItem.dietary_labels || []) as DietaryLabel[] // Cast to proper type
    };
  } catch (error) {
    console.error('Menu item creation failed:', error);
    throw error;
  }
};