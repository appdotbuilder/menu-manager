import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { menuItemsTable, categoriesTable } from '../db/schema';
import { type CreateMenuItemInput, type DietaryLabel } from '../schema';
import { createMenuItem } from '../handlers/create_menu_item';
import { eq } from 'drizzle-orm';

describe('createMenuItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test category
  const createTestCategory = async () => {
    const result = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A category for testing',
        display_order: 1,
        is_active: true
      })
      .returning()
      .execute();
    return result[0];
  };

  const testInput: CreateMenuItemInput = {
    name: 'Test Menu Item',
    description: 'A delicious test item',
    price: 12.99,
    ingredients: 'flour, sugar, eggs',
    image_url: 'https://example.com/image.jpg',
    dietary_labels: ['vegetarian', 'gluten-free'] as DietaryLabel[],
    is_available: true,
    display_order: 1,
    category_id: 1 // Will be set to actual category ID in tests
  };

  it('should create a menu item with all fields', async () => {
    const category = await createTestCategory();
    const input = { ...testInput, category_id: category.id };

    const result = await createMenuItem(input);

    expect(result.name).toEqual('Test Menu Item');
    expect(result.description).toEqual('A delicious test item');
    expect(result.price).toEqual(12.99);
    expect(typeof result.price).toEqual('number');
    expect(result.ingredients).toEqual('flour, sugar, eggs');
    expect(result.image_url).toEqual('https://example.com/image.jpg');
    expect(result.dietary_labels).toEqual(['vegetarian', 'gluten-free']);
    expect(result.is_available).toEqual(true);
    expect(result.display_order).toEqual(1);
    expect(result.category_id).toEqual(category.id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a menu item with minimal fields', async () => {
    const category = await createTestCategory();
    const minimalInput: CreateMenuItemInput = {
      name: 'Simple Item',
      description: null,
      price: 5.50,
      ingredients: null,
      image_url: null,
      category_id: category.id
    };

    const result = await createMenuItem(minimalInput);

    expect(result.name).toEqual('Simple Item');
    expect(result.description).toBeNull();
    expect(result.price).toEqual(5.50);
    expect(result.ingredients).toBeNull();
    expect(result.image_url).toBeNull();
    expect(result.dietary_labels).toEqual([]);
    expect(result.is_available).toEqual(true); // Default value
    expect(result.display_order).toEqual(0); // Default value
    expect(result.category_id).toEqual(category.id);
  });

  it('should apply default values correctly', async () => {
    const category = await createTestCategory();
    const inputWithoutDefaults: CreateMenuItemInput = {
      name: 'Default Test Item',
      description: null,
      price: 8.00,
      ingredients: null,
      image_url: null,
      category_id: category.id
      // Omitting dietary_labels, is_available, display_order to test defaults
    };

    const result = await createMenuItem(inputWithoutDefaults);

    expect(result.dietary_labels).toEqual([]);
    expect(result.is_available).toEqual(true);
    expect(result.display_order).toEqual(0);
  });

  it('should save menu item to database', async () => {
    const category = await createTestCategory();
    const input = { ...testInput, category_id: category.id };

    const result = await createMenuItem(input);

    // Query the database to verify the item was saved
    const menuItems = await db.select()
      .from(menuItemsTable)
      .where(eq(menuItemsTable.id, result.id))
      .execute();

    expect(menuItems).toHaveLength(1);
    const savedItem = menuItems[0];
    expect(savedItem.name).toEqual('Test Menu Item');
    expect(savedItem.description).toEqual('A delicious test item');
    expect(parseFloat(savedItem.price)).toEqual(12.99); // Convert back from string
    expect(savedItem.ingredients).toEqual('flour, sugar, eggs');
    expect(savedItem.image_url).toEqual('https://example.com/image.jpg');
    expect(savedItem.dietary_labels).toEqual(['vegetarian', 'gluten-free']);
    expect(savedItem.is_available).toEqual(true);
    expect(savedItem.display_order).toEqual(1);
    expect(savedItem.category_id).toEqual(category.id);
    expect(savedItem.created_at).toBeInstanceOf(Date);
    expect(savedItem.updated_at).toBeInstanceOf(Date);
  });

  it('should handle empty dietary labels array', async () => {
    const category = await createTestCategory();
    const input = { 
      ...testInput, 
      category_id: category.id,
      dietary_labels: [] 
    };

    const result = await createMenuItem(input);

    expect(result.dietary_labels).toEqual([]);
  });

  it('should handle single dietary label', async () => {
    const category = await createTestCategory();
    const input = { 
      ...testInput, 
      category_id: category.id,
      dietary_labels: ['vegan'] as DietaryLabel[]
    };

    const result = await createMenuItem(input);

    expect(result.dietary_labels).toEqual(['vegan']);
  });

  it('should throw error when category does not exist', async () => {
    const input = { ...testInput, category_id: 99999 }; // Non-existent category

    await expect(createMenuItem(input)).rejects.toThrow(/Category with id 99999 does not exist/i);
  });

  it('should handle decimal prices correctly', async () => {
    const category = await createTestCategory();
    const input = { 
      ...testInput, 
      category_id: category.id,
      price: 15.75 
    };

    const result = await createMenuItem(input);

    expect(result.price).toEqual(15.75);
    expect(typeof result.price).toEqual('number');

    // Verify in database
    const menuItems = await db.select()
      .from(menuItemsTable)
      .where(eq(menuItemsTable.id, result.id))
      .execute();

    expect(parseFloat(menuItems[0].price)).toEqual(15.75);
  });
});