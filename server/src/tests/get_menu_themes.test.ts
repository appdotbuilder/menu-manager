import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { menuThemesTable } from '../db/schema';
import { getMenuThemes } from '../handlers/get_menu_themes';

describe('getMenuThemes', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no themes exist', async () => {
    const result = await getMenuThemes();
    expect(result).toEqual([]);
  });

  it('should return all menu themes ordered by created_at descending', async () => {
    // Create test themes with different timestamps
    const theme1 = await db.insert(menuThemesTable)
      .values({
        restaurant_name: 'Test Restaurant 1',
        button_color: '#FF5733',
        button_shape: 'rounded',
        background_type: 'color',
        background_value: '#FFFFFF',
        border_radius: 15,
        primary_color: '#000000',
        text_color: '#333333',
        is_active: true
      })
      .returning()
      .execute();

    // Wait a bit to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const theme2 = await db.insert(menuThemesTable)
      .values({
        restaurant_name: 'Test Restaurant 2',
        button_color: '#33FF57',
        button_shape: 'square',
        background_type: 'image',
        background_value: 'https://example.com/bg.jpg',
        border_radius: 25,
        primary_color: '#111111',
        text_color: '#444444',
        is_active: false
      })
      .returning()
      .execute();

    const result = await getMenuThemes();

    // Should return themes in descending order by created_at
    expect(result).toHaveLength(2);
    expect(result[0].restaurant_name).toEqual('Test Restaurant 2');
    expect(result[1].restaurant_name).toEqual('Test Restaurant 1');

    // Verify first theme (most recent)
    expect(result[0].button_color).toEqual('#33FF57');
    expect(result[0].button_shape).toEqual('square');
    expect(result[0].background_type).toEqual('image');
    expect(result[0].background_value).toEqual('https://example.com/bg.jpg');
    expect(result[0].border_radius).toEqual(25);
    expect(result[0].primary_color).toEqual('#111111');
    expect(result[0].text_color).toEqual('#444444');
    expect(result[0].is_active).toEqual(false);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    // Verify second theme (older)
    expect(result[1].button_color).toEqual('#FF5733');
    expect(result[1].button_shape).toEqual('rounded');
    expect(result[1].background_type).toEqual('color');
    expect(result[1].background_value).toEqual('#FFFFFF');
    expect(result[1].border_radius).toEqual(15);
    expect(result[1].primary_color).toEqual('#000000');
    expect(result[1].text_color).toEqual('#333333');
    expect(result[1].is_active).toEqual(true);
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
    expect(result[1].updated_at).toBeInstanceOf(Date);
  });

  it('should handle all button shapes correctly', async () => {
    await db.insert(menuThemesTable)
      .values([
        {
          restaurant_name: 'Rounded Restaurant',
          button_color: '#FF5733',
          button_shape: 'rounded',
          background_type: 'color',
          background_value: '#FFFFFF',
          border_radius: 10,
          primary_color: '#000000',
          text_color: '#333333',
          is_active: true
        },
        {
          restaurant_name: 'Square Restaurant',
          button_color: '#33FF57',
          button_shape: 'square',
          background_type: 'color',
          background_value: '#FFFFFF',
          border_radius: 0,
          primary_color: '#000000',
          text_color: '#333333',
          is_active: true
        },
        {
          restaurant_name: 'Pill Restaurant',
          button_color: '#3357FF',
          button_shape: 'pill',
          background_type: 'color',
          background_value: '#FFFFFF',
          border_radius: 50,
          primary_color: '#000000',
          text_color: '#333333',
          is_active: true
        }
      ])
      .execute();

    const result = await getMenuThemes();

    expect(result).toHaveLength(3);
    
    const buttonShapes = result.map(theme => theme.button_shape);
    expect(buttonShapes).toContain('rounded');
    expect(buttonShapes).toContain('square');
    expect(buttonShapes).toContain('pill');
  });

  it('should handle both background types correctly', async () => {
    await db.insert(menuThemesTable)
      .values([
        {
          restaurant_name: 'Color Background Restaurant',
          button_color: '#FF5733',
          button_shape: 'rounded',
          background_type: 'color',
          background_value: '#F0F0F0',
          border_radius: 15,
          primary_color: '#000000',
          text_color: '#333333',
          is_active: true
        },
        {
          restaurant_name: 'Image Background Restaurant',
          button_color: '#33FF57',
          button_shape: 'square',
          background_type: 'image',
          background_value: 'https://example.com/background.jpg',
          border_radius: 25,
          primary_color: '#111111',
          text_color: '#444444',
          is_active: false
        }
      ])
      .execute();

    const result = await getMenuThemes();

    expect(result).toHaveLength(2);

    const colorTheme = result.find(theme => theme.background_type === 'color');
    const imageTheme = result.find(theme => theme.background_type === 'image');

    expect(colorTheme).toBeDefined();
    expect(colorTheme!.background_value).toEqual('#F0F0F0');
    expect(colorTheme!.restaurant_name).toEqual('Color Background Restaurant');

    expect(imageTheme).toBeDefined();
    expect(imageTheme!.background_value).toEqual('https://example.com/background.jpg');
    expect(imageTheme!.restaurant_name).toEqual('Image Background Restaurant');
  });

  it('should handle border radius values correctly', async () => {
    await db.insert(menuThemesTable)
      .values([
        {
          restaurant_name: 'Min Border Restaurant',
          button_color: '#FF5733',
          button_shape: 'rounded',
          background_type: 'color',
          background_value: '#FFFFFF',
          border_radius: 0, // Minimum value
          primary_color: '#000000',
          text_color: '#333333',
          is_active: true
        },
        {
          restaurant_name: 'Max Border Restaurant',
          button_color: '#33FF57',
          button_shape: 'pill',
          background_type: 'color',
          background_value: '#FFFFFF',
          border_radius: 50, // Maximum value
          primary_color: '#000000',
          text_color: '#333333',
          is_active: true
        }
      ])
      .execute();

    const result = await getMenuThemes();

    expect(result).toHaveLength(2);

    const minBorderTheme = result.find(theme => theme.border_radius === 0);
    const maxBorderTheme = result.find(theme => theme.border_radius === 50);

    expect(minBorderTheme).toBeDefined();
    expect(typeof minBorderTheme!.border_radius).toBe('number');
    expect(minBorderTheme!.border_radius).toEqual(0);

    expect(maxBorderTheme).toBeDefined();
    expect(typeof maxBorderTheme!.border_radius).toBe('number');
    expect(maxBorderTheme!.border_radius).toEqual(50);
  });

  it('should return themes with correct active status', async () => {
    await db.insert(menuThemesTable)
      .values([
        {
          restaurant_name: 'Active Restaurant',
          button_color: '#FF5733',
          button_shape: 'rounded',
          background_type: 'color',
          background_value: '#FFFFFF',
          border_radius: 15,
          primary_color: '#000000',
          text_color: '#333333',
          is_active: true
        },
        {
          restaurant_name: 'Inactive Restaurant',
          button_color: '#33FF57',
          button_shape: 'square',
          background_type: 'color',
          background_value: '#FFFFFF',
          border_radius: 25,
          primary_color: '#111111',
          text_color: '#444444',
          is_active: false
        }
      ])
      .execute();

    const result = await getMenuThemes();

    expect(result).toHaveLength(2);

    const activeTheme = result.find(theme => theme.is_active === true);
    const inactiveTheme = result.find(theme => theme.is_active === false);

    expect(activeTheme).toBeDefined();
    expect(activeTheme!.restaurant_name).toEqual('Active Restaurant');
    expect(typeof activeTheme!.is_active).toBe('boolean');

    expect(inactiveTheme).toBeDefined();
    expect(inactiveTheme!.restaurant_name).toEqual('Inactive Restaurant');
    expect(typeof inactiveTheme!.is_active).toBe('boolean');
  });
});