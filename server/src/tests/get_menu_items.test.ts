import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, menuItemsTable } from '../db/schema';
import { getMenuItems } from '../handlers/get_menu_items';

describe('getMenuItems', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no menu items exist', async () => {
    const result = await getMenuItems();
    expect(result).toEqual([]);
  });

  it('should return menu items with proper field types', async () => {
    // Create a category first
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A test category',
        display_order: 1,
        is_active: true
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create a menu item
    await db.insert(menuItemsTable)
      .values({
        name: 'Test Item',
        description: 'A test menu item',
        price: '19.99', // Insert as string for numeric column
        ingredients: 'Test ingredients',
        image_url: 'https://example.com/image.jpg',
        dietary_labels: ['vegetarian', 'gluten-free'],
        is_available: true,
        display_order: 1,
        category_id: categoryId
      })
      .execute();

    const result = await getMenuItems();

    expect(result).toHaveLength(1);
    
    const menuItem = result[0];
    expect(menuItem.name).toBe('Test Item');
    expect(menuItem.description).toBe('A test menu item');
    expect(typeof menuItem.price).toBe('number'); // Verify numeric conversion
    expect(menuItem.price).toBe(19.99);
    expect(menuItem.ingredients).toBe('Test ingredients');
    expect(menuItem.image_url).toBe('https://example.com/image.jpg');
    expect(menuItem.dietary_labels).toEqual(['vegetarian', 'gluten-free']);
    expect(menuItem.is_available).toBe(true);
    expect(menuItem.display_order).toBe(1);
    expect(menuItem.category_id).toBe(categoryId);
    expect(menuItem.id).toBeDefined();
    expect(menuItem.created_at).toBeInstanceOf(Date);
    expect(menuItem.updated_at).toBeInstanceOf(Date);
  });

  it('should handle null fields correctly', async () => {
    // Create a category first
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: null,
        display_order: 1,
        is_active: true
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create a menu item with null optional fields
    await db.insert(menuItemsTable)
      .values({
        name: 'Minimal Item',
        description: null,
        price: '15.50',
        ingredients: null,
        image_url: null,
        dietary_labels: null,
        is_available: false,
        display_order: 2,
        category_id: categoryId
      })
      .execute();

    const result = await getMenuItems();

    expect(result).toHaveLength(1);
    
    const menuItem = result[0];
    expect(menuItem.name).toBe('Minimal Item');
    expect(menuItem.description).toBeNull();
    expect(menuItem.price).toBe(15.50);
    expect(menuItem.ingredients).toBeNull();
    expect(menuItem.image_url).toBeNull();
    expect(menuItem.dietary_labels).toEqual([]); // Null arrays should become empty arrays
    expect(menuItem.is_available).toBe(false);
    expect(menuItem.display_order).toBe(2);
    expect(menuItem.category_id).toBe(categoryId);
  });

  it('should order menu items by category display_order then menu item display_order', async () => {
    // Create categories with different display orders
    const category1 = await db.insert(categoriesTable)
      .values({
        name: 'Category B',
        description: 'Second category',
        display_order: 2,
        is_active: true
      })
      .returning()
      .execute();

    const category2 = await db.insert(categoriesTable)
      .values({
        name: 'Category A',
        description: 'First category',
        display_order: 1,
        is_active: true
      })
      .returning()
      .execute();

    // Create menu items in different orders
    await db.insert(menuItemsTable)
      .values([
        {
          name: 'Item B2',
          description: 'Second item in second category',
          price: '12.99',
          display_order: 2,
          category_id: category1[0].id,
          is_available: true
        },
        {
          name: 'Item A1',
          description: 'First item in first category',
          price: '10.99',
          display_order: 1,
          category_id: category2[0].id,
          is_available: true
        },
        {
          name: 'Item B1',
          description: 'First item in second category',
          price: '11.99',
          display_order: 1,
          category_id: category1[0].id,
          is_available: true
        },
        {
          name: 'Item A2',
          description: 'Second item in first category',
          price: '13.99',
          display_order: 2,
          category_id: category2[0].id,
          is_available: true
        }
      ])
      .execute();

    const result = await getMenuItems();

    expect(result).toHaveLength(4);
    
    // Should be ordered by category display_order (1, then 2), then by menu item display_order
    expect(result[0].name).toBe('Item A1'); // Category 1, display_order 1
    expect(result[1].name).toBe('Item A2'); // Category 1, display_order 2
    expect(result[2].name).toBe('Item B1'); // Category 2, display_order 1
    expect(result[3].name).toBe('Item B2'); // Category 2, display_order 2

    // Verify category associations
    expect(result[0].category_id).toBe(category2[0].id);
    expect(result[1].category_id).toBe(category2[0].id);
    expect(result[2].category_id).toBe(category1[0].id);
    expect(result[3].category_id).toBe(category1[0].id);
  });

  it('should handle various dietary labels correctly', async () => {
    // Create a category first
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Health Category',
        description: 'Healthy options',
        display_order: 1,
        is_active: true
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create menu items with different dietary labels
    await db.insert(menuItemsTable)
      .values([
        {
          name: 'Vegan Salad',
          description: 'Fresh vegan salad',
          price: '14.99',
          dietary_labels: ['vegan', 'gluten-free', 'organic'],
          display_order: 1,
          category_id: categoryId,
          is_available: true
        },
        {
          name: 'Keto Bowl',
          description: 'Low carb bowl',
          price: '18.99',
          dietary_labels: ['keto', 'low-carb', 'dairy-free'],
          display_order: 2,
          category_id: categoryId,
          is_available: true
        }
      ])
      .execute();

    const result = await getMenuItems();

    expect(result).toHaveLength(2);
    
    expect(result[0].dietary_labels).toEqual(['vegan', 'gluten-free', 'organic']);
    expect(result[1].dietary_labels).toEqual(['keto', 'low-carb', 'dairy-free']);
  });

  it('should handle multiple menu items across multiple categories', async () => {
    // Create multiple categories
    const appetizers = await db.insert(categoriesTable)
      .values({
        name: 'Appetizers',
        description: 'Start your meal',
        display_order: 1,
        is_active: true
      })
      .returning()
      .execute();

    const mains = await db.insert(categoriesTable)
      .values({
        name: 'Main Courses',
        description: 'Main dishes',
        display_order: 2,
        is_active: true
      })
      .returning()
      .execute();

    const desserts = await db.insert(categoriesTable)
      .values({
        name: 'Desserts',
        description: 'Sweet endings',
        display_order: 3,
        is_active: true
      })
      .returning()
      .execute();

    // Create multiple menu items
    await db.insert(menuItemsTable)
      .values([
        {
          name: 'Chocolate Cake',
          description: 'Rich chocolate cake',
          price: '8.99',
          display_order: 1,
          category_id: desserts[0].id,
          is_available: true
        },
        {
          name: 'Caesar Salad',
          description: 'Classic caesar salad',
          price: '7.99',
          display_order: 1,
          category_id: appetizers[0].id,
          is_available: true
        },
        {
          name: 'Grilled Chicken',
          description: 'Seasoned grilled chicken',
          price: '22.99',
          display_order: 1,
          category_id: mains[0].id,
          is_available: true
        },
        {
          name: 'Bruschetta',
          description: 'Tomato and basil bruschetta',
          price: '9.99',
          display_order: 2,
          category_id: appetizers[0].id,
          is_available: true
        }
      ])
      .execute();

    const result = await getMenuItems();

    expect(result).toHaveLength(4);
    
    // Verify ordering by category display_order
    expect(result[0].name).toBe('Caesar Salad'); // Appetizers (1), display_order 1
    expect(result[1].name).toBe('Bruschetta'); // Appetizers (1), display_order 2
    expect(result[2].name).toBe('Grilled Chicken'); // Mains (2), display_order 1
    expect(result[3].name).toBe('Chocolate Cake'); // Desserts (3), display_order 1

    // Verify all items have proper price conversion
    result.forEach(item => {
      expect(typeof item.price).toBe('number');
    });
  });
});