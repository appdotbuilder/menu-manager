import { db } from '../db';
import { menuItemsTable } from '../db/schema';
import { type GetEntityByIdInput, type MenuItem, type DietaryLabel } from '../schema';
import { eq, asc } from 'drizzle-orm';

export const getMenuItemsByCategory = async (input: GetEntityByIdInput): Promise<MenuItem[]> => {
  try {
    // Fetch menu items for the specified category, ordered by display_order
    const results = await db.select()
      .from(menuItemsTable)
      .where(eq(menuItemsTable.category_id, input.id))
      .orderBy(asc(menuItemsTable.display_order))
      .execute();

    // Convert numeric fields back to numbers and ensure proper type conversion
    return results.map(item => ({
      ...item,
      price: parseFloat(item.price), // Convert numeric string back to number
      dietary_labels: (item.dietary_labels || []) as DietaryLabel[] // Ensure array is never null and properly typed
    }));
  } catch (error) {
    console.error('Failed to get menu items by category:', error);
    throw error;
  }
};