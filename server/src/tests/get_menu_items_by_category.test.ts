import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, menuItemsTable } from '../db/schema';
import { type GetEntityByIdInput } from '../schema';
import { getMenuItemsByCategory } from '../handlers/get_menu_items_by_category';

describe('getMenuItemsByCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return menu items for a specific category ordered by display_order', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Appetizers',
        description: 'Start your meal right',
        display_order: 1,
        is_active: true
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create test menu items with different display orders
    await db.insert(menuItemsTable)
      .values([
        {
          name: 'Caesar Salad',
          description: 'Fresh romaine lettuce with caesar dressing',
          price: '12.99',
          ingredients: 'Romaine lettuce, parmesan cheese, croutons',
          image_url: 'https://example.com/caesar.jpg',
          dietary_labels: ['vegetarian'],
          is_available: true,
          display_order: 2,
          category_id: categoryId
        },
        {
          name: 'Garlic Bread',
          description: 'Toasted bread with garlic butter',
          price: '8.50',
          ingredients: 'Bread, garlic, butter, herbs',
          image_url: null,
          dietary_labels: ['vegetarian'],
          is_available: true,
          display_order: 1,
          category_id: categoryId
        },
        {
          name: 'Chicken Wings',
          description: 'Spicy buffalo wings',
          price: '15.99',
          ingredients: 'Chicken wings, buffalo sauce, celery',
          image_url: 'https://example.com/wings.jpg',
          dietary_labels: ['spicy'],
          is_available: true,
          display_order: 3,
          category_id: categoryId
        }
      ])
      .execute();

    // Test the handler
    const input: GetEntityByIdInput = { id: categoryId };
    const result = await getMenuItemsByCategory(input);

    // Should return 3 items
    expect(result).toHaveLength(3);

    // Should be ordered by display_order (1, 2, 3)
    expect(result[0].name).toEqual('Garlic Bread');
    expect(result[0].display_order).toEqual(1);
    expect(result[1].name).toEqual('Caesar Salad');
    expect(result[1].display_order).toEqual(2);
    expect(result[2].name).toEqual('Chicken Wings');
    expect(result[2].display_order).toEqual(3);

    // Verify data types and conversions
    result.forEach(item => {
      expect(typeof item.price).toBe('number');
      expect(Array.isArray(item.dietary_labels)).toBe(true);
      expect(item.id).toBeDefined();
      expect(item.created_at).toBeInstanceOf(Date);
      expect(item.updated_at).toBeInstanceOf(Date);
    });

    // Verify specific price conversions
    expect(result[0].price).toEqual(8.50);
    expect(result[1].price).toEqual(12.99);
    expect(result[2].price).toEqual(15.99);
  });

  it('should return empty array for category with no menu items', async () => {
    // Create test category without any menu items
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Empty Category',
        description: 'A category with no items',
        display_order: 1,
        is_active: true
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    const input: GetEntityByIdInput = { id: categoryId };
    const result = await getMenuItemsByCategory(input);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return empty array for non-existent category', async () => {
    const input: GetEntityByIdInput = { id: 99999 };
    const result = await getMenuItemsByCategory(input);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle menu items with null dietary_labels', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'Testing null dietary labels',
        display_order: 1,
        is_active: true
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create menu item with null dietary_labels
    await db.insert(menuItemsTable)
      .values({
        name: 'Basic Item',
        description: 'Item with no dietary labels',
        price: '10.00',
        ingredients: null,
        image_url: null,
        dietary_labels: null,
        is_available: true,
        display_order: 1,
        category_id: categoryId
      })
      .execute();

    const input: GetEntityByIdInput = { id: categoryId };
    const result = await getMenuItemsByCategory(input);

    expect(result).toHaveLength(1);
    expect(result[0].dietary_labels).toEqual([]);
    expect(Array.isArray(result[0].dietary_labels)).toBe(true);
  });

  it('should include both available and unavailable items', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Mixed Availability',
        description: 'Items with different availability',
        display_order: 1,
        is_active: true
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create menu items with different availability
    await db.insert(menuItemsTable)
      .values([
        {
          name: 'Available Item',
          description: 'This item is available',
          price: '12.99',
          ingredients: null,
          image_url: null,
          dietary_labels: [],
          is_available: true,
          display_order: 1,
          category_id: categoryId
        },
        {
          name: 'Unavailable Item',
          description: 'This item is not available',
          price: '15.99',
          ingredients: null,
          image_url: null,
          dietary_labels: [],
          is_available: false,
          display_order: 2,
          category_id: categoryId
        }
      ])
      .execute();

    const input: GetEntityByIdInput = { id: categoryId };
    const result = await getMenuItemsByCategory(input);

    expect(result).toHaveLength(2);
    expect(result[0].is_available).toBe(true);
    expect(result[1].is_available).toBe(false);
  });

  it('should handle items with complex dietary_labels array', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Dietary Options',
        description: 'Items with multiple dietary labels',
        display_order: 1,
        is_active: true
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create menu item with multiple dietary labels
    await db.insert(menuItemsTable)
      .values({
        name: 'Vegan Gluten-Free Bowl',
        description: 'Healthy bowl with multiple dietary accommodations',
        price: '18.99',
        ingredients: 'Quinoa, vegetables, tahini dressing',
        image_url: null,
        dietary_labels: ['vegan', 'gluten-free', 'organic'],
        is_available: true,
        display_order: 1,
        category_id: categoryId
      })
      .execute();

    const input: GetEntityByIdInput = { id: categoryId };
    const result = await getMenuItemsByCategory(input);

    expect(result).toHaveLength(1);
    expect(result[0].dietary_labels).toEqual(['vegan', 'gluten-free', 'organic']);
    expect(result[0].dietary_labels).toHaveLength(3);
  });
});