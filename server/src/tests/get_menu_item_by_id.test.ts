import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, menuItemsTable } from '../db/schema';
import { type GetEntityByIdInput } from '../schema';
import { getMenuItemById } from '../handlers/get_menu_item_by_id';

describe('getMenuItemById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return menu item when it exists', async () => {
    // Create prerequisite category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A category for testing',
        display_order: 1,
        is_active: true
      })
      .returning()
      .execute();

    const category = categoryResult[0];

    // Create test menu item
    const menuItemResult = await db.insert(menuItemsTable)
      .values({
        name: 'Test Burger',
        description: 'A delicious test burger',
        price: '15.99', // Store as string
        ingredients: 'Beef, lettuce, tomato, cheese',
        image_url: 'https://example.com/burger.jpg',
        dietary_labels: ['gluten-free', 'dairy-free'],
        is_available: true,
        display_order: 1,
        category_id: category.id
      })
      .returning()
      .execute();

    const createdMenuItem = menuItemResult[0];

    // Test the handler
    const input: GetEntityByIdInput = {
      id: createdMenuItem.id
    };

    const result = await getMenuItemById(input);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdMenuItem.id);
    expect(result!.name).toEqual('Test Burger');
    expect(result!.description).toEqual('A delicious test burger');
    expect(result!.price).toEqual(15.99);
    expect(typeof result!.price).toBe('number'); // Verify numeric conversion
    expect(result!.ingredients).toEqual('Beef, lettuce, tomato, cheese');
    expect(result!.image_url).toEqual('https://example.com/burger.jpg');
    expect(result!.dietary_labels).toEqual(['gluten-free', 'dairy-free']);
    expect(result!.is_available).toBe(true);
    expect(result!.display_order).toEqual(1);
    expect(result!.category_id).toEqual(category.id);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when menu item does not exist', async () => {
    const input: GetEntityByIdInput = {
      id: 999 // Non-existent ID
    };

    const result = await getMenuItemById(input);

    expect(result).toBeNull();
  });

  it('should handle menu item with minimal data', async () => {
    // Create prerequisite category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Minimal Category',
        display_order: 1,
        is_active: true
      })
      .returning()
      .execute();

    const category = categoryResult[0];

    // Create menu item with minimal required fields
    const menuItemResult = await db.insert(menuItemsTable)
      .values({
        name: 'Simple Item',
        price: '9.99',
        category_id: category.id
      })
      .returning()
      .execute();

    const createdMenuItem = menuItemResult[0];

    // Test the handler
    const input: GetEntityByIdInput = {
      id: createdMenuItem.id
    };

    const result = await getMenuItemById(input);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdMenuItem.id);
    expect(result!.name).toEqual('Simple Item');
    expect(result!.description).toBeNull();
    expect(result!.price).toEqual(9.99);
    expect(typeof result!.price).toBe('number');
    expect(result!.ingredients).toBeNull();
    expect(result!.image_url).toBeNull();
    expect(result!.dietary_labels).toEqual([]); // Ensure empty array when null
    expect(result!.is_available).toBe(true); // Default value
    expect(result!.display_order).toEqual(0); // Default value
    expect(result!.category_id).toEqual(category.id);
  });

  it('should handle menu item with various dietary labels', async () => {
    // Create prerequisite category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Dietary Category',
        display_order: 1,
        is_active: true
      })
      .returning()
      .execute();

    const category = categoryResult[0];

    // Create menu item with multiple dietary labels
    const menuItemResult = await db.insert(menuItemsTable)
      .values({
        name: 'Health Bowl',
        description: 'A nutritious bowl',
        price: '12.50',
        dietary_labels: ['vegan', 'gluten-free', 'organic', 'keto'],
        category_id: category.id
      })
      .returning()
      .execute();

    const createdMenuItem = menuItemResult[0];

    // Test the handler
    const input: GetEntityByIdInput = {
      id: createdMenuItem.id
    };

    const result = await getMenuItemById(input);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.dietary_labels).toEqual(['vegan', 'gluten-free', 'organic', 'keto']);
    expect(Array.isArray(result!.dietary_labels)).toBe(true);
  });

  it('should handle different price formats correctly', async () => {
    // Create prerequisite category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Price Test Category',
        display_order: 1,
        is_active: true
      })
      .returning()
      .execute();

    const category = categoryResult[0];

    // Create menu item with decimal price
    const menuItemResult = await db.insert(menuItemsTable)
      .values({
        name: 'Expensive Item',
        price: '99.95',
        category_id: category.id
      })
      .returning()
      .execute();

    const createdMenuItem = menuItemResult[0];

    // Test the handler
    const input: GetEntityByIdInput = {
      id: createdMenuItem.id
    };

    const result = await getMenuItemById(input);

    // Verify numeric conversion works correctly
    expect(result).not.toBeNull();
    expect(result!.price).toEqual(99.95);
    expect(typeof result!.price).toBe('number');
  });
});