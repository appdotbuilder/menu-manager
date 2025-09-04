import { db } from '../db';
import { menuThemesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type MenuTheme } from '../schema';

export const getActiveMenuTheme = async (): Promise<MenuTheme | null> => {
  try {
    const result = await db.select()
      .from(menuThemesTable)
      .where(eq(menuThemesTable.is_active, true))
      .limit(1)
      .execute();

    if (result.length === 0) {
      return null;
    }

    // Convert numeric fields back to numbers before returning
    const theme = result[0];
    return {
      ...theme,
      // No numeric conversions needed for this schema - all fields are already proper types
    };
  } catch (error) {
    console.error('Failed to fetch active menu theme:', error);
    throw error;
  }
};