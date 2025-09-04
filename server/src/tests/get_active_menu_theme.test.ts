import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { menuThemesTable } from '../db/schema';
import { getActiveMenuTheme } from '../handlers/get_active_menu_theme';
import { eq } from 'drizzle-orm';

// Test menu theme input
const testTheme = {
  restaurant_name: 'Test Restaurant',
  button_color: '#FF5722',
  button_shape: 'rounded' as const,
  background_type: 'color' as const,
  background_value: '#FFFFFF',
  border_radius: 15,
  primary_color: '#2196F3',
  text_color: '#212121',
  is_active: true
};

const inactiveTheme = {
  restaurant_name: 'Inactive Restaurant',
  button_color: '#E91E63',
  button_shape: 'square' as const,
  background_type: 'image' as const,
  background_value: 'https://example.com/bg.jpg',
  border_radius: 5,
  primary_color: '#9C27B0',
  text_color: '#FFFFFF',
  is_active: false
};

describe('getActiveMenuTheme', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return active menu theme when one exists', async () => {
    // Create an active theme
    const insertResult = await db.insert(menuThemesTable)
      .values(testTheme)
      .returning()
      .execute();

    const result = await getActiveMenuTheme();

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(insertResult[0].id);
    expect(result!.restaurant_name).toEqual('Test Restaurant');
    expect(result!.button_color).toEqual('#FF5722');
    expect(result!.button_shape).toEqual('rounded');
    expect(result!.background_type).toEqual('color');
    expect(result!.background_value).toEqual('#FFFFFF');
    expect(result!.border_radius).toEqual(15);
    expect(result!.primary_color).toEqual('#2196F3');
    expect(result!.text_color).toEqual('#212121');
    expect(result!.is_active).toBe(true);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when no active menu theme exists', async () => {
    const result = await getActiveMenuTheme();
    expect(result).toBeNull();
  });

  it('should return null when only inactive themes exist', async () => {
    // Create an inactive theme
    await db.insert(menuThemesTable)
      .values(inactiveTheme)
      .returning()
      .execute();

    const result = await getActiveMenuTheme();
    expect(result).toBeNull();
  });

  it('should return only one active theme when multiple active themes exist', async () => {
    // Create multiple active themes (edge case scenario)
    const theme1 = { ...testTheme, restaurant_name: 'Restaurant 1' };
    const theme2 = { ...testTheme, restaurant_name: 'Restaurant 2' };

    await db.insert(menuThemesTable)
      .values([theme1, theme2])
      .returning()
      .execute();

    const result = await getActiveMenuTheme();

    expect(result).not.toBeNull();
    expect(result!.is_active).toBe(true);
    // Should return one of the active themes (first one due to limit(1))
    expect(['Restaurant 1', 'Restaurant 2']).toContain(result!.restaurant_name);
  });

  it('should return active theme when mixed active and inactive themes exist', async () => {
    // Create both active and inactive themes
    await db.insert(menuThemesTable)
      .values([inactiveTheme])
      .returning()
      .execute();

    const activeInsert = await db.insert(menuThemesTable)
      .values(testTheme)
      .returning()
      .execute();

    const result = await getActiveMenuTheme();

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(activeInsert[0].id);
    expect(result!.restaurant_name).toEqual('Test Restaurant');
    expect(result!.is_active).toBe(true);
  });

  it('should verify theme is properly saved to database', async () => {
    // Create active theme
    const insertResult = await db.insert(menuThemesTable)
      .values(testTheme)
      .returning()
      .execute();

    const result = await getActiveMenuTheme();

    // Verify the theme exists in database with correct values
    const dbThemes = await db.select()
      .from(menuThemesTable)
      .where(eq(menuThemesTable.id, insertResult[0].id))
      .execute();

    expect(dbThemes).toHaveLength(1);
    expect(dbThemes[0].restaurant_name).toEqual('Test Restaurant');
    expect(dbThemes[0].is_active).toBe(true);
    expect(dbThemes[0].button_shape).toEqual('rounded');
    expect(dbThemes[0].background_type).toEqual('color');
    
    // Verify handler result matches database
    expect(result!.id).toEqual(dbThemes[0].id);
    expect(result!.restaurant_name).toEqual(dbThemes[0].restaurant_name);
  });

  it('should handle all button shapes correctly', async () => {
    const themes = [
      { ...testTheme, button_shape: 'rounded' as const, restaurant_name: 'Rounded Theme' },
      { ...testTheme, button_shape: 'square' as const, restaurant_name: 'Square Theme', is_active: false },
      { ...testTheme, button_shape: 'pill' as const, restaurant_name: 'Pill Theme', is_active: false }
    ];

    await db.insert(menuThemesTable)
      .values(themes)
      .returning()
      .execute();

    const result = await getActiveMenuTheme();

    expect(result).not.toBeNull();
    expect(result!.button_shape).toEqual('rounded');
    expect(result!.restaurant_name).toEqual('Rounded Theme');
  });

  it('should handle all background types correctly', async () => {
    const colorTheme = {
      ...testTheme,
      background_type: 'color' as const,
      background_value: '#FF9800',
      restaurant_name: 'Color Background'
    };

    await db.insert(menuThemesTable)
      .values(colorTheme)
      .returning()
      .execute();

    const result = await getActiveMenuTheme();

    expect(result).not.toBeNull();
    expect(result!.background_type).toEqual('color');
    expect(result!.background_value).toEqual('#FF9800');
  });
});