import { db } from '../db';
import { menuThemesTable } from '../db/schema';
import { type MenuTheme } from '../schema';
import { desc } from 'drizzle-orm';

export const getMenuThemes = async (): Promise<MenuTheme[]> => {
  try {
    // Fetch all menu themes ordered by created_at descending
    const results = await db.select()
      .from(menuThemesTable)
      .orderBy(desc(menuThemesTable.created_at))
      .execute();

    // Convert numeric fields back to numbers (border_radius is integer so no conversion needed)
    return results.map(theme => ({
      ...theme,
      // All other fields are already in correct format from the database
      // border_radius is integer type, so no conversion needed
      // All other fields are text, boolean, enum, or timestamp which are handled correctly
    }));
  } catch (error) {
    console.error('Failed to fetch menu themes:', error);
    throw error;
  }
};