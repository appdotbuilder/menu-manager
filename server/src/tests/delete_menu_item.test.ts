import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, menuItemsTable } from '../db/schema';
import { type DeleteEntityInput } from '../schema';
import { deleteMenuItem } from '../handlers/delete_menu_item';
import { eq } from 'drizzle-orm';

describe('deleteMenuItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing menu item', async () => {
    // Create a category first (required for menu item)
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'Category for testing',
        display_order: 1,
        is_active: true
      })
      .returning()
      .execute();

    const category = categoryResult[0];

    // Create a menu item to delete
    const menuItemResult = await db.insert(menuItemsTable)
      .values({
        name: 'Test Menu Item',
        description: 'A menu item for testing',
        price: '15.99',
        ingredients: 'Test ingredients',
        image_url: 'https://example.com/image.jpg',
        dietary_labels: ['vegetarian', 'gluten-free'],
        is_available: true,
        display_order: 1,
        category_id: category.id
      })
      .returning()
      .execute();

    const menuItem = menuItemResult[0];

    // Delete the menu item
    const input: DeleteEntityInput = { id: menuItem.id };
    const result = await deleteMenuItem(input);

    // Should return true for successful deletion
    expect(result).toBe(true);

    // Verify menu item was deleted from database
    const deletedMenuItems = await db.select()
      .from(menuItemsTable)
      .where(eq(menuItemsTable.id, menuItem.id))
      .execute();

    expect(deletedMenuItems).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent menu item', async () => {
    // Try to delete a menu item that doesn't exist
    const input: DeleteEntityInput = { id: 99999 };
    const result = await deleteMenuItem(input);

    // Should return false for non-existent menu item
    expect(result).toBe(false);
  });

  it('should not affect other menu items when deleting one', async () => {
    // Create a category first (required for menu items)
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'Category for testing',
        display_order: 1,
        is_active: true
      })
      .returning()
      .execute();

    const category = categoryResult[0];

    // Create multiple menu items
    const menuItem1Result = await db.insert(menuItemsTable)
      .values({
        name: 'Menu Item 1',
        description: 'First menu item',
        price: '10.99',
        category_id: category.id
      })
      .returning()
      .execute();

    const menuItem2Result = await db.insert(menuItemsTable)
      .values({
        name: 'Menu Item 2',
        description: 'Second menu item',
        price: '12.99',
        category_id: category.id
      })
      .returning()
      .execute();

    const menuItem1 = menuItem1Result[0];
    const menuItem2 = menuItem2Result[0];

    // Delete only the first menu item
    const input: DeleteEntityInput = { id: menuItem1.id };
    const result = await deleteMenuItem(input);

    expect(result).toBe(true);

    // Verify first menu item was deleted
    const deletedMenuItems = await db.select()
      .from(menuItemsTable)
      .where(eq(menuItemsTable.id, menuItem1.id))
      .execute();

    expect(deletedMenuItems).toHaveLength(0);

    // Verify second menu item still exists
    const remainingMenuItems = await db.select()
      .from(menuItemsTable)
      .where(eq(menuItemsTable.id, menuItem2.id))
      .execute();

    expect(remainingMenuItems).toHaveLength(1);
    expect(remainingMenuItems[0].name).toBe('Menu Item 2');
  });

  it('should handle menu items with all dietary labels', async () => {
    // Create a category first
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'Category for testing'
      })
      .returning()
      .execute();

    const category = categoryResult[0];

    // Create a menu item with all possible dietary labels
    const allDietaryLabels = [
      'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free',
      'keto', 'low-carb', 'halal', 'kosher', 'spicy', 'organic'
    ];

    const menuItemResult = await db.insert(menuItemsTable)
      .values({
        name: 'Complex Menu Item',
        description: 'Menu item with all dietary labels',
        price: '25.99',
        dietary_labels: allDietaryLabels,
        category_id: category.id
      })
      .returning()
      .execute();

    const menuItem = menuItemResult[0];

    // Delete the menu item
    const input: DeleteEntityInput = { id: menuItem.id };
    const result = await deleteMenuItem(input);

    expect(result).toBe(true);

    // Verify menu item was deleted
    const deletedMenuItems = await db.select()
      .from(menuItemsTable)
      .where(eq(menuItemsTable.id, menuItem.id))
      .execute();

    expect(deletedMenuItems).toHaveLength(0);
  });
});