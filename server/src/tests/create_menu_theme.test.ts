import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { menuThemesTable } from '../db/schema';
import { type CreateMenuThemeInput } from '../schema';
import { createMenuTheme } from '../handlers/create_menu_theme';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateMenuThemeInput = {
  restaurant_name: 'Test Restaurant',
  button_color: '#FF5733',
  button_shape: 'rounded',
  background_type: 'color',
  background_value: '#F8F9FA',
  border_radius: 15,
  primary_color: '#007BFF',
  text_color: '#000000',
  is_active: true
};

describe('createMenuTheme', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a menu theme with all fields', async () => {
    const result = await createMenuTheme(testInput);

    // Verify all fields are correctly set
    expect(result.restaurant_name).toEqual('Test Restaurant');
    expect(result.button_color).toEqual('#FF5733');
    expect(result.button_shape).toEqual('rounded');
    expect(result.background_type).toEqual('color');
    expect(result.background_value).toEqual('#F8F9FA');
    expect(result.border_radius).toEqual(15);
    expect(result.primary_color).toEqual('#007BFF');
    expect(result.text_color).toEqual('#000000');
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save menu theme to database', async () => {
    const result = await createMenuTheme(testInput);

    // Verify theme was saved to database
    const themes = await db.select()
      .from(menuThemesTable)
      .where(eq(menuThemesTable.id, result.id))
      .execute();

    expect(themes).toHaveLength(1);
    expect(themes[0].restaurant_name).toEqual('Test Restaurant');
    expect(themes[0].button_color).toEqual('#FF5733');
    expect(themes[0].button_shape).toEqual('rounded');
    expect(themes[0].background_type).toEqual('color');
    expect(themes[0].background_value).toEqual('#F8F9FA');
    expect(themes[0].border_radius).toEqual(15);
    expect(themes[0].primary_color).toEqual('#007BFF');
    expect(themes[0].text_color).toEqual('#000000');
    expect(themes[0].is_active).toEqual(true);
  });

  it('should default is_active to true when not specified', async () => {
    const inputWithoutActive = {
      ...testInput
    };
    delete (inputWithoutActive as any).is_active;

    const result = await createMenuTheme(inputWithoutActive);

    expect(result.is_active).toEqual(true);
  });

  it('should create inactive theme when explicitly set', async () => {
    const inactiveInput: CreateMenuThemeInput = {
      ...testInput,
      is_active: false
    };

    const result = await createMenuTheme(inactiveInput);

    expect(result.is_active).toEqual(false);
  });

  it('should deactivate existing active themes when creating new active theme', async () => {
    // Create first active theme
    const firstTheme = await createMenuTheme({
      ...testInput,
      restaurant_name: 'First Restaurant'
    });

    expect(firstTheme.is_active).toEqual(true);

    // Create second active theme
    const secondTheme = await createMenuTheme({
      ...testInput,
      restaurant_name: 'Second Restaurant'
    });

    expect(secondTheme.is_active).toEqual(true);

    // Verify first theme was deactivated
    const updatedFirstTheme = await db.select()
      .from(menuThemesTable)
      .where(eq(menuThemesTable.id, firstTheme.id))
      .execute();

    expect(updatedFirstTheme[0].is_active).toEqual(false);

    // Verify second theme is still active
    const updatedSecondTheme = await db.select()
      .from(menuThemesTable)
      .where(eq(menuThemesTable.id, secondTheme.id))
      .execute();

    expect(updatedSecondTheme[0].is_active).toEqual(true);
  });

  it('should not deactivate existing themes when creating inactive theme', async () => {
    // Create first active theme
    const firstTheme = await createMenuTheme({
      ...testInput,
      restaurant_name: 'First Restaurant'
    });

    expect(firstTheme.is_active).toEqual(true);

    // Create second inactive theme
    const secondTheme = await createMenuTheme({
      ...testInput,
      restaurant_name: 'Second Restaurant',
      is_active: false
    });

    expect(secondTheme.is_active).toEqual(false);

    // Verify first theme is still active
    const updatedFirstTheme = await db.select()
      .from(menuThemesTable)
      .where(eq(menuThemesTable.id, firstTheme.id))
      .execute();

    expect(updatedFirstTheme[0].is_active).toEqual(true);
  });

  it('should work with different button shapes', async () => {
    const shapes = ['rounded', 'square', 'pill'] as const;

    for (const shape of shapes) {
      const result = await createMenuTheme({
        ...testInput,
        restaurant_name: `Restaurant ${shape}`,
        button_shape: shape
      });

      expect(result.button_shape).toEqual(shape);
    }
  });

  it('should work with different background types', async () => {
    // Test with color background
    const colorTheme = await createMenuTheme({
      ...testInput,
      restaurant_name: 'Color Restaurant',
      background_type: 'color',
      background_value: '#FFFFFF'
    });

    expect(colorTheme.background_type).toEqual('color');
    expect(colorTheme.background_value).toEqual('#FFFFFF');

    // Test with image background
    const imageTheme = await createMenuTheme({
      ...testInput,
      restaurant_name: 'Image Restaurant',
      background_type: 'image',
      background_value: 'https://example.com/bg.jpg',
      is_active: false // Set to false to avoid deactivating previous theme
    });

    expect(imageTheme.background_type).toEqual('image');
    expect(imageTheme.background_value).toEqual('https://example.com/bg.jpg');
  });

  it('should handle edge case border radius values', async () => {
    // Test minimum border radius
    const minTheme = await createMenuTheme({
      ...testInput,
      restaurant_name: 'Min Border Restaurant',
      border_radius: 0
    });

    expect(minTheme.border_radius).toEqual(0);

    // Test maximum border radius
    const maxTheme = await createMenuTheme({
      ...testInput,
      restaurant_name: 'Max Border Restaurant',
      border_radius: 50,
      is_active: false
    });

    expect(maxTheme.border_radius).toEqual(50);
  });

  it('should handle multiple theme creation and activation correctly', async () => {
    // Create three themes, with the middle one being inactive
    const theme1 = await createMenuTheme({
      ...testInput,
      restaurant_name: 'Theme 1'
    });

    const theme2 = await createMenuTheme({
      ...testInput,
      restaurant_name: 'Theme 2',
      is_active: false
    });

    const theme3 = await createMenuTheme({
      ...testInput,
      restaurant_name: 'Theme 3'
    });

    // Verify final state: only theme3 should be active
    const allThemes = await db.select()
      .from(menuThemesTable)
      .execute();

    expect(allThemes).toHaveLength(3);

    const theme1Final = allThemes.find(t => t.id === theme1.id);
    const theme2Final = allThemes.find(t => t.id === theme2.id);
    const theme3Final = allThemes.find(t => t.id === theme3.id);

    expect(theme1Final?.is_active).toEqual(false);
    expect(theme2Final?.is_active).toEqual(false);
    expect(theme3Final?.is_active).toEqual(true);
  });
});