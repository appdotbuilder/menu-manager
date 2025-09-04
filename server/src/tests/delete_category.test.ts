import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, menuItemsTable } from '../db/schema';
import { type DeleteEntityInput, type CreateCategoryInput, type CreateMenuItemInput } from '../schema';
import { deleteCategory } from '../handlers/delete_category';
import { eq } from 'drizzle-orm';

const testCategoryInput: CreateCategoryInput = {
  name: 'Test Category',
  description: 'A category for testing',
  display_order: 1,
  is_active: true
};

const testMenuItemInput: CreateMenuItemInput = {
  name: 'Test Menu Item',
  description: 'A menu item for testing',
  price: 12.99,
  ingredients: 'Test ingredients',
  image_url: 'https://example.com/image.jpg',
  dietary_labels: ['vegetarian'],
  is_available: true,
  display_order: 1,
  category_id: 1 // Will be updated with actual category ID
};

describe('deleteCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return false when category does not exist', async () => {
    const input: DeleteEntityInput = { id: 999 };
    const result = await deleteCategory(input);

    expect(result).toBe(false);
  });

  it('should successfully delete an existing category', async () => {
    // Create a test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: testCategoryInput.name,
        description: testCategoryInput.description,
        display_order: testCategoryInput.display_order || 0,
        is_active: testCategoryInput.is_active ?? true
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Delete the category
    const input: DeleteEntityInput = { id: categoryId };
    const result = await deleteCategory(input);

    expect(result).toBe(true);

    // Verify category is deleted from database
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .execute();

    expect(categories).toHaveLength(0);
  });

  it('should throw error when category has menu items', async () => {
    // Create a test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: testCategoryInput.name,
        description: testCategoryInput.description,
        display_order: testCategoryInput.display_order || 0,
        is_active: testCategoryInput.is_active ?? true
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create a menu item in this category
    await db.insert(menuItemsTable)
      .values({
        name: testMenuItemInput.name,
        description: testMenuItemInput.description,
        price: testMenuItemInput.price.toString(),
        ingredients: testMenuItemInput.ingredients,
        image_url: testMenuItemInput.image_url,
        dietary_labels: testMenuItemInput.dietary_labels || [],
        is_available: testMenuItemInput.is_available ?? true,
        display_order: testMenuItemInput.display_order || 0,
        category_id: categoryId
      })
      .execute();

    // Try to delete the category
    const input: DeleteEntityInput = { id: categoryId };

    await expect(deleteCategory(input)).rejects.toThrow(/Cannot delete category.*menu items/i);

    // Verify category still exists in database
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .execute();

    expect(categories).toHaveLength(1);
  });

  it('should handle category with multiple menu items', async () => {
    // Create a test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: testCategoryInput.name,
        description: testCategoryInput.description,
        display_order: testCategoryInput.display_order || 0,
        is_active: testCategoryInput.is_active ?? true
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create multiple menu items in this category
    await db.insert(menuItemsTable)
      .values([
        {
          name: 'Menu Item 1',
          description: 'First menu item',
          price: '10.99',
          ingredients: null,
          image_url: null,
          dietary_labels: [],
          is_available: true,
          display_order: 1,
          category_id: categoryId
        },
        {
          name: 'Menu Item 2',
          description: 'Second menu item',
          price: '15.99',
          ingredients: null,
          image_url: null,
          dietary_labels: [],
          is_available: true,
          display_order: 2,
          category_id: categoryId
        }
      ])
      .execute();

    // Try to delete the category
    const input: DeleteEntityInput = { id: categoryId };

    await expect(deleteCategory(input)).rejects.toThrow(/Cannot delete category.*2 menu items/i);

    // Verify category still exists
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .execute();

    expect(categories).toHaveLength(1);
  });

  it('should delete category after all menu items are removed', async () => {
    // Create a test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: testCategoryInput.name,
        description: testCategoryInput.description,
        display_order: testCategoryInput.display_order || 0,
        is_active: testCategoryInput.is_active ?? true
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create a menu item in this category
    const menuItemResult = await db.insert(menuItemsTable)
      .values({
        name: testMenuItemInput.name,
        description: testMenuItemInput.description,
        price: testMenuItemInput.price.toString(),
        ingredients: testMenuItemInput.ingredients,
        image_url: testMenuItemInput.image_url,
        dietary_labels: testMenuItemInput.dietary_labels || [],
        is_available: testMenuItemInput.is_available ?? true,
        display_order: testMenuItemInput.display_order || 0,
        category_id: categoryId
      })
      .returning()
      .execute();

    // First attempt should fail
    const input: DeleteEntityInput = { id: categoryId };
    await expect(deleteCategory(input)).rejects.toThrow(/Cannot delete category.*menu items/i);

    // Delete the menu item first
    await db.delete(menuItemsTable)
      .where(eq(menuItemsTable.id, menuItemResult[0].id))
      .execute();

    // Now category deletion should succeed
    const result = await deleteCategory(input);
    expect(result).toBe(true);

    // Verify category is deleted
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .execute();

    expect(categories).toHaveLength(0);
  });
});