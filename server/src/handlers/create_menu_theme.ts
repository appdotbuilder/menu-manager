import { db } from '../db';
import { menuThemesTable } from '../db/schema';
import { type CreateMenuThemeInput, type MenuTheme } from '../schema';
import { eq } from 'drizzle-orm';

export const createMenuTheme = async (input: CreateMenuThemeInput): Promise<MenuTheme> => {
  try {
    // If this theme is set as active, deactivate all other themes first
    const isActive = input.is_active ?? true;
    if (isActive) {
      await db.update(menuThemesTable)
        .set({ is_active: false })
        .where(eq(menuThemesTable.is_active, true))
        .execute();
    }

    // Insert the new menu theme
    const result = await db.insert(menuThemesTable)
      .values({
        restaurant_name: input.restaurant_name,
        button_color: input.button_color,
        button_shape: input.button_shape,
        background_type: input.background_type,
        background_value: input.background_value,
        border_radius: input.border_radius,
        primary_color: input.primary_color,
        text_color: input.text_color,
        is_active: isActive
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Menu theme creation failed:', error);
    throw error;
  }
};