import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { menuItemsTable, categoriesTable } from '../db/schema';
import { type UpdateMenuItemInput, type CreateCategoryInput } from '../schema';
import { updateMenuItem } from '../handlers/update_menu_item';
import { eq } from 'drizzle-orm';

// Test data
const testCategory: CreateCategoryInput = {
  name: 'Appetizers',
  description: 'Starter dishes',
  display_order: 1,
  is_active: true
};

const testCategory2: CreateCategoryInput = {
  name: 'Main Courses',
  description: 'Primary dishes',
  display_order: 2,
  is_active: true
};

const testMenuItem = {
  name: 'Spring Rolls',
  description: 'Fresh vegetable spring rolls',
  price: '12.99', // Database stores as string
  ingredients: 'Vegetables, rice paper, herbs',
  image_url: 'https://example.com/spring-rolls.jpg',
  dietary_labels: ['vegetarian', 'vegan'],
  is_available: true,
  display_order: 1,
  category_id: 1
};

describe('updateMenuItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let categoryId: number;
  let category2Id: number;
  let menuItemId: number;

  beforeEach(async () => {
    // Create test categories
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();
    categoryId = categoryResult[0].id;

    const category2Result = await db.insert(categoriesTable)
      .values(testCategory2)
      .returning()
      .execute();
    category2Id = category2Result[0].id;

    // Create test menu item
    const menuItemResult = await db.insert(menuItemsTable)
      .values({
        ...testMenuItem,
        category_id: categoryId
      })
      .returning()
      .execute();
    menuItemId = menuItemResult[0].id;
  });

  it('should update menu item name successfully', async () => {
    const updateInput: UpdateMenuItemInput = {
      id: menuItemId,
      name: 'Updated Spring Rolls'
    };

    const result = await updateMenuItem(updateInput);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(menuItemId);
    expect(result!.name).toEqual('Updated Spring Rolls');
    expect(result!.description).toEqual(testMenuItem.description);
    expect(result!.price).toEqual(12.99); // Converted back to number
    expect(typeof result!.price).toEqual('number');
  });

  it('should update menu item price successfully', async () => {
    const updateInput: UpdateMenuItemInput = {
      id: menuItemId,
      price: 15.99
    };

    const result = await updateMenuItem(updateInput);

    expect(result).toBeDefined();
    expect(result!.price).toEqual(15.99);
    expect(typeof result!.price).toEqual('number');
  });

  it('should update multiple fields at once', async () => {
    const updateInput: UpdateMenuItemInput = {
      id: menuItemId,
      name: 'Premium Spring Rolls',
      price: 18.50,
      description: 'Premium fresh vegetable spring rolls with special sauce',
      is_available: false,
      display_order: 5
    };

    const result = await updateMenuItem(updateInput);

    expect(result).toBeDefined();
    expect(result!.name).toEqual('Premium Spring Rolls');
    expect(result!.price).toEqual(18.50);
    expect(result!.description).toEqual('Premium fresh vegetable spring rolls with special sauce');
    expect(result!.is_available).toEqual(false);
    expect(result!.display_order).toEqual(5);
  });

  it('should update dietary labels successfully', async () => {
    const updateInput: UpdateMenuItemInput = {
      id: menuItemId,
      dietary_labels: ['vegetarian', 'gluten-free', 'organic']
    };

    const result = await updateMenuItem(updateInput);

    expect(result).toBeDefined();
    expect(result!.dietary_labels).toEqual(['vegetarian', 'gluten-free', 'organic']);
  });

  it('should update nullable fields to null', async () => {
    const updateInput: UpdateMenuItemInput = {
      id: menuItemId,
      description: null,
      ingredients: null,
      image_url: null
    };

    const result = await updateMenuItem(updateInput);

    expect(result).toBeDefined();
    expect(result!.description).toBeNull();
    expect(result!.ingredients).toBeNull();
    expect(result!.image_url).toBeNull();
  });

  it('should update category_id successfully', async () => {
    const updateInput: UpdateMenuItemInput = {
      id: menuItemId,
      category_id: category2Id
    };

    const result = await updateMenuItem(updateInput);

    expect(result).toBeDefined();
    expect(result!.category_id).toEqual(category2Id);
  });

  it('should update the updated_at timestamp', async () => {
    const originalItem = await db.select()
      .from(menuItemsTable)
      .where(eq(menuItemsTable.id, menuItemId))
      .execute();
    
    const originalUpdatedAt = originalItem[0].updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateMenuItemInput = {
      id: menuItemId,
      name: 'Updated Name'
    };

    const result = await updateMenuItem(updateInput);

    expect(result).toBeDefined();
    expect(result!.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should save changes to database', async () => {
    const updateInput: UpdateMenuItemInput = {
      id: menuItemId,
      name: 'Database Test Spring Rolls',
      price: 22.99
    };

    await updateMenuItem(updateInput);

    // Verify changes were persisted in database
    const menuItems = await db.select()
      .from(menuItemsTable)
      .where(eq(menuItemsTable.id, menuItemId))
      .execute();

    expect(menuItems).toHaveLength(1);
    expect(menuItems[0].name).toEqual('Database Test Spring Rolls');
    expect(parseFloat(menuItems[0].price)).toEqual(22.99);
  });

  it('should return null for non-existent menu item', async () => {
    const updateInput: UpdateMenuItemInput = {
      id: 99999,
      name: 'Non-existent Item'
    };

    const result = await updateMenuItem(updateInput);

    expect(result).toBeNull();
  });

  it('should throw error for non-existent category_id', async () => {
    const updateInput: UpdateMenuItemInput = {
      id: menuItemId,
      category_id: 99999
    };

    await expect(updateMenuItem(updateInput)).rejects.toThrow(/Category with id 99999 does not exist/i);
  });

  it('should handle empty dietary_labels array', async () => {
    const updateInput: UpdateMenuItemInput = {
      id: menuItemId,
      dietary_labels: []
    };

    const result = await updateMenuItem(updateInput);

    expect(result).toBeDefined();
    expect(result!.dietary_labels).toEqual([]);
  });

  it('should not modify fields that are not provided', async () => {
    const originalItem = await db.select()
      .from(menuItemsTable)
      .where(eq(menuItemsTable.id, menuItemId))
      .execute();

    const updateInput: UpdateMenuItemInput = {
      id: menuItemId,
      name: 'Only Name Updated'
    };

    const result = await updateMenuItem(updateInput);

    expect(result).toBeDefined();
    expect(result!.name).toEqual('Only Name Updated'); // Updated
    expect(result!.description).toEqual(originalItem[0].description); // Unchanged
    expect(result!.ingredients).toEqual(originalItem[0].ingredients); // Unchanged
    expect(parseFloat(result!.price.toString())).toEqual(parseFloat(originalItem[0].price)); // Unchanged
  });
});