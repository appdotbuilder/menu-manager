import { db } from '../db';
import { menuThemesTable } from '../db/schema';
import { type DeleteEntityInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteMenuTheme = async (input: DeleteEntityInput): Promise<boolean> => {
  try {
    // Delete the menu theme record
    const result = await db.delete(menuThemesTable)
      .where(eq(menuThemesTable.id, input.id))
      .returning({ id: menuThemesTable.id })
      .execute();

    // Return true if a record was deleted, false if no record was found
    return result.length > 0;
  } catch (error) {
    console.error('Menu theme deletion failed:', error);
    throw error;
  }
};