import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { menuThemesTable } from '../db/schema';
import { type UpdateMenuThemeInput, type CreateMenuThemeInput } from '../schema';
import { updateMenuTheme } from '../handlers/update_menu_theme';
import { eq } from 'drizzle-orm';

// Helper to create a test menu theme
const createTestTheme = async (overrides?: Partial<CreateMenuThemeInput>) => {
  const defaultTheme: CreateMenuThemeInput = {
    restaurant_name: 'Test Restaurant',
    button_color: '#FF5733',
    button_shape: 'rounded',
    background_type: 'color',
    background_value: '#FFFFFF',
    border_radius: 10,
    primary_color: '#333333',
    text_color: '#000000',
    is_active: false,
    ...overrides
  };

  const result = await db.insert(menuThemesTable)
    .values({
      ...defaultTheme,
      created_at: new Date(),
      updated_at: new Date()
    })
    .returning()
    .execute();

  return result[0];
};

describe('updateMenuTheme', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a menu theme with all fields', async () => {
    // Create test theme
    const theme = await createTestTheme();

    const updateInput: UpdateMenuThemeInput = {
      id: theme.id,
      restaurant_name: 'Updated Restaurant',
      button_color: '#00FF00',
      button_shape: 'pill',
      background_type: 'image',
      background_value: 'https://example.com/bg.jpg',
      border_radius: 25,
      primary_color: '#FF0000',
      text_color: '#FFFFFF',
      is_active: true
    };

    const result = await updateMenuTheme(updateInput);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(theme.id);
    expect(result!.restaurant_name).toEqual('Updated Restaurant');
    expect(result!.button_color).toEqual('#00FF00');
    expect(result!.button_shape).toEqual('pill');
    expect(result!.background_type).toEqual('image');
    expect(result!.background_value).toEqual('https://example.com/bg.jpg');
    expect(result!.border_radius).toEqual(25);
    expect(result!.primary_color).toEqual('#FF0000');
    expect(result!.text_color).toEqual('#FFFFFF');
    expect(result!.is_active).toEqual(true);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at > theme.updated_at).toBe(true);
  });

  it('should update only specified fields', async () => {
    // Create test theme
    const theme = await createTestTheme({
      restaurant_name: 'Original Name',
      button_color: '#FF0000',
      is_active: false
    });

    const updateInput: UpdateMenuThemeInput = {
      id: theme.id,
      restaurant_name: 'Updated Name Only'
    };

    const result = await updateMenuTheme(updateInput);

    expect(result).toBeDefined();
    expect(result!.restaurant_name).toEqual('Updated Name Only');
    expect(result!.button_color).toEqual('#FF0000'); // Should remain unchanged
    expect(result!.is_active).toEqual(false); // Should remain unchanged
  });

  it('should return null for non-existent menu theme', async () => {
    const updateInput: UpdateMenuThemeInput = {
      id: 999,
      restaurant_name: 'Non-existent Theme'
    };

    const result = await updateMenuTheme(updateInput);

    expect(result).toBeNull();
  });

  it('should deactivate other themes when setting one as active', async () => {
    // Create multiple test themes
    const theme1 = await createTestTheme({
      restaurant_name: 'Theme 1',
      is_active: true
    });
    const theme2 = await createTestTheme({
      restaurant_name: 'Theme 2',
      is_active: true
    });
    const theme3 = await createTestTheme({
      restaurant_name: 'Theme 3',
      is_active: false
    });

    // Set theme3 as active
    const updateInput: UpdateMenuThemeInput = {
      id: theme3.id,
      is_active: true
    };

    const result = await updateMenuTheme(updateInput);

    expect(result).toBeDefined();
    expect(result!.is_active).toEqual(true);

    // Check that other themes are deactivated
    const allThemes = await db.select()
      .from(menuThemesTable)
      .execute();

    const activeThemes = allThemes.filter(theme => theme.is_active);
    expect(activeThemes).toHaveLength(1);
    expect(activeThemes[0].id).toEqual(theme3.id);

    const deactivatedThemes = allThemes.filter(theme => !theme.is_active);
    expect(deactivatedThemes).toHaveLength(2);
    expect(deactivatedThemes.map(t => t.id)).toContain(theme1.id);
    expect(deactivatedThemes.map(t => t.id)).toContain(theme2.id);
  });

  it('should not affect other themes when setting theme as inactive', async () => {
    // Create multiple test themes
    const theme1 = await createTestTheme({
      restaurant_name: 'Theme 1',
      is_active: true
    });
    const theme2 = await createTestTheme({
      restaurant_name: 'Theme 2',
      is_active: true
    });

    // Set theme1 as inactive (should not affect theme2)
    const updateInput: UpdateMenuThemeInput = {
      id: theme1.id,
      is_active: false
    };

    const result = await updateMenuTheme(updateInput);

    expect(result).toBeDefined();
    expect(result!.is_active).toEqual(false);

    // Check that theme2 remains active
    const theme2Updated = await db.select()
      .from(menuThemesTable)
      .where(eq(menuThemesTable.id, theme2.id))
      .execute();

    expect(theme2Updated[0].is_active).toEqual(true);
  });

  it('should save changes to database', async () => {
    // Create test theme
    const theme = await createTestTheme({
      restaurant_name: 'Original',
      button_color: '#000000'
    });

    const updateInput: UpdateMenuThemeInput = {
      id: theme.id,
      restaurant_name: 'Database Test',
      button_color: '#FFFFFF'
    };

    await updateMenuTheme(updateInput);

    // Verify changes in database
    const themeFromDB = await db.select()
      .from(menuThemesTable)
      .where(eq(menuThemesTable.id, theme.id))
      .execute();

    expect(themeFromDB).toHaveLength(1);
    expect(themeFromDB[0].restaurant_name).toEqual('Database Test');
    expect(themeFromDB[0].button_color).toEqual('#FFFFFF');
    expect(themeFromDB[0].updated_at).toBeInstanceOf(Date);
    expect(themeFromDB[0].updated_at > theme.updated_at).toBe(true);
  });

  it('should handle updating all enum fields correctly', async () => {
    // Create test theme
    const theme = await createTestTheme({
      button_shape: 'rounded',
      background_type: 'color'
    });

    const updateInput: UpdateMenuThemeInput = {
      id: theme.id,
      button_shape: 'square',
      background_type: 'image'
    };

    const result = await updateMenuTheme(updateInput);

    expect(result).toBeDefined();
    expect(result!.button_shape).toEqual('square');
    expect(result!.background_type).toEqual('image');
  });

  it('should handle border radius edge cases', async () => {
    // Create test theme
    const theme = await createTestTheme({
      border_radius: 10
    });

    // Test minimum value
    let updateInput: UpdateMenuThemeInput = {
      id: theme.id,
      border_radius: 0
    };

    let result = await updateMenuTheme(updateInput);
    expect(result!.border_radius).toEqual(0);

    // Test maximum value
    updateInput = {
      id: theme.id,
      border_radius: 50
    };

    result = await updateMenuTheme(updateInput);
    expect(result!.border_radius).toEqual(50);
  });
});