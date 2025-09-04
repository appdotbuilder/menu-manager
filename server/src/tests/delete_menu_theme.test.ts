import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { menuThemesTable } from '../db/schema';
import { type DeleteEntityInput, type CreateMenuThemeInput } from '../schema';
import { deleteMenuTheme } from '../handlers/delete_menu_theme';
import { eq } from 'drizzle-orm';

// Test input for creating a menu theme to delete
const testMenuThemeInput: CreateMenuThemeInput = {
  restaurant_name: 'Test Restaurant',
  button_color: '#FF5733',
  button_shape: 'rounded',
  background_type: 'color',
  background_value: '#FFFFFF',
  border_radius: 15,
  primary_color: '#333333',
  text_color: '#000000',
  is_active: true
};

describe('deleteMenuTheme', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing menu theme', async () => {
    // Create a menu theme first
    const createResult = await db.insert(menuThemesTable)
      .values({
        restaurant_name: testMenuThemeInput.restaurant_name,
        button_color: testMenuThemeInput.button_color,
        button_shape: testMenuThemeInput.button_shape,
        background_type: testMenuThemeInput.background_type,
        background_value: testMenuThemeInput.background_value,
        border_radius: testMenuThemeInput.border_radius,
        primary_color: testMenuThemeInput.primary_color,
        text_color: testMenuThemeInput.text_color,
        is_active: testMenuThemeInput.is_active || true
      })
      .returning()
      .execute();

    const menuThemeId = createResult[0].id;

    // Test deletion
    const deleteInput: DeleteEntityInput = { id: menuThemeId };
    const result = await deleteMenuTheme(deleteInput);

    expect(result).toBe(true);

    // Verify the menu theme is actually deleted from database
    const menuThemes = await db.select()
      .from(menuThemesTable)
      .where(eq(menuThemesTable.id, menuThemeId))
      .execute();

    expect(menuThemes).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent menu theme', async () => {
    const deleteInput: DeleteEntityInput = { id: 99999 };
    const result = await deleteMenuTheme(deleteInput);

    expect(result).toBe(false);
  });

  it('should delete active menu theme successfully', async () => {
    // Create an active menu theme
    const createResult = await db.insert(menuThemesTable)
      .values({
        restaurant_name: 'Active Restaurant',
        button_color: '#00FF00',
        button_shape: 'pill',
        background_type: 'image',
        background_value: 'https://example.com/bg.jpg',
        border_radius: 25,
        primary_color: '#FF0000',
        text_color: '#FFFFFF',
        is_active: true
      })
      .returning()
      .execute();

    const menuThemeId = createResult[0].id;

    // Delete the active menu theme
    const deleteInput: DeleteEntityInput = { id: menuThemeId };
    const result = await deleteMenuTheme(deleteInput);

    expect(result).toBe(true);

    // Verify deletion
    const menuThemes = await db.select()
      .from(menuThemesTable)
      .where(eq(menuThemesTable.id, menuThemeId))
      .execute();

    expect(menuThemes).toHaveLength(0);
  });

  it('should delete inactive menu theme successfully', async () => {
    // Create an inactive menu theme
    const createResult = await db.insert(menuThemesTable)
      .values({
        restaurant_name: 'Inactive Restaurant',
        button_color: '#0000FF',
        button_shape: 'square',
        background_type: 'color',
        background_value: '#F0F0F0',
        border_radius: 5,
        primary_color: '#CCCCCC',
        text_color: '#666666',
        is_active: false
      })
      .returning()
      .execute();

    const menuThemeId = createResult[0].id;

    // Delete the inactive menu theme
    const deleteInput: DeleteEntityInput = { id: menuThemeId };
    const result = await deleteMenuTheme(deleteInput);

    expect(result).toBe(true);

    // Verify deletion
    const menuThemes = await db.select()
      .from(menuThemesTable)
      .where(eq(menuThemesTable.id, menuThemeId))
      .execute();

    expect(menuThemes).toHaveLength(0);
  });

  it('should handle multiple deletions correctly', async () => {
    // Create multiple menu themes
    const theme1 = await db.insert(menuThemesTable)
      .values({
        restaurant_name: 'Restaurant 1',
        button_color: '#FF0000',
        button_shape: 'rounded',
        background_type: 'color',
        background_value: '#FFFFFF',
        border_radius: 10,
        primary_color: '#000000',
        text_color: '#FFFFFF'
      })
      .returning()
      .execute();

    const theme2 = await db.insert(menuThemesTable)
      .values({
        restaurant_name: 'Restaurant 2',
        button_color: '#00FF00',
        button_shape: 'square',
        background_type: 'color',
        background_value: '#000000',
        border_radius: 20,
        primary_color: '#FFFFFF',
        text_color: '#000000'
      })
      .returning()
      .execute();

    // Delete first theme
    const result1 = await deleteMenuTheme({ id: theme1[0].id });
    expect(result1).toBe(true);

    // Delete second theme
    const result2 = await deleteMenuTheme({ id: theme2[0].id });
    expect(result2).toBe(true);

    // Try to delete first theme again
    const result3 = await deleteMenuTheme({ id: theme1[0].id });
    expect(result3).toBe(false);

    // Verify both themes are deleted
    const remainingThemes = await db.select()
      .from(menuThemesTable)
      .execute();

    expect(remainingThemes).toHaveLength(0);
  });
});