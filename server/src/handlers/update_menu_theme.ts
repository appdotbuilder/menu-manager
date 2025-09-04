import { db } from '../db';
import { menuThemesTable } from '../db/schema';
import { type UpdateMenuThemeInput, type MenuTheme } from '../schema';
import { eq } from 'drizzle-orm';

export const updateMenuTheme = async (input: UpdateMenuThemeInput): Promise<MenuTheme | null> => {
  try {
    // First check if the menu theme exists
    const existing = await db.select()
      .from(menuThemesTable)
      .where(eq(menuThemesTable.id, input.id))
      .execute();

    if (existing.length === 0) {
      return null;
    }

    // If setting this theme as active, deactivate all other themes first
    if (input.is_active === true) {
      await db.update(menuThemesTable)
        .set({ 
          is_active: false,
          updated_at: new Date()
        })
        .execute();
    }

    // Prepare update values, filtering out undefined fields
    const updateValues: any = {
      updated_at: new Date()
    };

    if (input.restaurant_name !== undefined) {
      updateValues['restaurant_name'] = input.restaurant_name;
    }
    if (input.button_color !== undefined) {
      updateValues['button_color'] = input.button_color;
    }
    if (input.button_shape !== undefined) {
      updateValues['button_shape'] = input.button_shape;
    }
    if (input.background_type !== undefined) {
      updateValues['background_type'] = input.background_type;
    }
    if (input.background_value !== undefined) {
      updateValues['background_value'] = input.background_value;
    }
    if (input.border_radius !== undefined) {
      updateValues['border_radius'] = input.border_radius;
    }
    if (input.primary_color !== undefined) {
      updateValues['primary_color'] = input.primary_color;
    }
    if (input.text_color !== undefined) {
      updateValues['text_color'] = input.text_color;
    }
    if (input.is_active !== undefined) {
      updateValues['is_active'] = input.is_active;
    }

    // Update the menu theme
    const result = await db.update(menuThemesTable)
      .set(updateValues)
      .where(eq(menuThemesTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Menu theme update failed:', error);
    throw error;
  }
};