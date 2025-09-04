import { db } from '../db';
import { menuItemsTable } from '../db/schema';
import { type GetEntityByIdInput, type MenuItem, type DietaryLabel } from '../schema';
import { eq } from 'drizzle-orm';

export const getMenuItemById = async (input: GetEntityByIdInput): Promise<MenuItem | null> => {
  try {
    const results = await db.select()
      .from(menuItemsTable)
      .where(eq(menuItemsTable.id, input.id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const menuItem = results[0];
    
    // Convert numeric price field back to number and handle array fields
    return {
      ...menuItem,
      price: parseFloat(menuItem.price), // Convert string back to number
      dietary_labels: (menuItem.dietary_labels || []) as DietaryLabel[] // Ensure array is never null and properly typed
    };
  } catch (error) {
    console.error('Menu item retrieval failed:', error);
    throw error;
  }
};