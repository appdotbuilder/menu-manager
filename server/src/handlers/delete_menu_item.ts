import { db } from '../db';
import { menuItemsTable } from '../db/schema';
import { type DeleteEntityInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteMenuItem = async (input: DeleteEntityInput): Promise<boolean> => {
  try {
    // Delete the menu item by ID
    const result = await db.delete(menuItemsTable)
      .where(eq(menuItemsTable.id, input.id))
      .execute();

    // Check if any rows were affected (deleted)
    return result.rowCount !== null && result.rowCount > 0;
  } catch (error) {
    console.error('Menu item deletion failed:', error);
    throw error;
  }
};