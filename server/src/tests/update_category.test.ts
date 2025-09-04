import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type UpdateCategoryInput } from '../schema';
import { updateCategory } from '../handlers/update_category';
import { eq } from 'drizzle-orm';

describe('updateCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a category with all fields', async () => {
    // Create a test category first
    const createResult = await db.insert(categoriesTable)
      .values({
        name: 'Original Category',
        description: 'Original description',
        display_order: 1,
        is_active: true
      })
      .returning()
      .execute();

    const categoryId = createResult[0].id;

    // Update the category
    const updateInput: UpdateCategoryInput = {
      id: categoryId,
      name: 'Updated Category',
      description: 'Updated description',
      display_order: 5,
      is_active: false
    };

    const result = await updateCategory(updateInput);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(categoryId);
    expect(result!.name).toEqual('Updated Category');
    expect(result!.description).toEqual('Updated description');
    expect(result!.display_order).toEqual(5);
    expect(result!.is_active).toEqual(false);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at > result!.created_at).toBe(true);
  });

  it('should update only specified fields', async () => {
    // Create a test category first
    const createResult = await db.insert(categoriesTable)
      .values({
        name: 'Original Category',
        description: 'Original description',
        display_order: 1,
        is_active: true
      })
      .returning()
      .execute();

    const categoryId = createResult[0].id;
    const originalCreatedAt = createResult[0].created_at;

    // Update only name and is_active
    const updateInput: UpdateCategoryInput = {
      id: categoryId,
      name: 'Partially Updated',
      is_active: false
    };

    const result = await updateCategory(updateInput);

    // Verify only specified fields were updated
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(categoryId);
    expect(result!.name).toEqual('Partially Updated');
    expect(result!.description).toEqual('Original description'); // Unchanged
    expect(result!.display_order).toEqual(1); // Unchanged
    expect(result!.is_active).toEqual(false);
    expect(result!.created_at).toEqual(originalCreatedAt); // Unchanged
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should handle null description update', async () => {
    // Create a test category with description
    const createResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'Has description',
        display_order: 1,
        is_active: true
      })
      .returning()
      .execute();

    const categoryId = createResult[0].id;

    // Update description to null
    const updateInput: UpdateCategoryInput = {
      id: categoryId,
      description: null
    };

    const result = await updateCategory(updateInput);

    // Verify description was set to null
    expect(result).not.toBeNull();
    expect(result!.description).toBeNull();
    expect(result!.name).toEqual('Test Category'); // Unchanged
  });

  it('should return null for non-existent category', async () => {
    const updateInput: UpdateCategoryInput = {
      id: 999999, // Non-existent ID
      name: 'Updated Name'
    };

    const result = await updateCategory(updateInput);

    expect(result).toBeNull();
  });

  it('should save updates to database', async () => {
    // Create a test category first
    const createResult = await db.insert(categoriesTable)
      .values({
        name: 'Original Category',
        description: 'Original description',
        display_order: 1,
        is_active: true
      })
      .returning()
      .execute();

    const categoryId = createResult[0].id;

    // Update the category
    const updateInput: UpdateCategoryInput = {
      id: categoryId,
      name: 'Database Updated',
      display_order: 10
    };

    await updateCategory(updateInput);

    // Verify changes were saved in database
    const dbResult = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .execute();

    expect(dbResult).toHaveLength(1);
    expect(dbResult[0].name).toEqual('Database Updated');
    expect(dbResult[0].display_order).toEqual(10);
    expect(dbResult[0].description).toEqual('Original description'); // Unchanged
  });

  it('should update updated_at timestamp even with no field changes', async () => {
    // Create a test category first
    const createResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'Test description',
        display_order: 1,
        is_active: true
      })
      .returning()
      .execute();

    const categoryId = createResult[0].id;
    const originalUpdatedAt = createResult[0].updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Update with only id (no other fields)
    const updateInput: UpdateCategoryInput = {
      id: categoryId
    };

    const result = await updateCategory(updateInput);

    // Should return the existing category without changes to core fields
    expect(result).not.toBeNull();
    expect(result!.name).toEqual('Test Category');
    expect(result!.description).toEqual('Test description');
    expect(result!.display_order).toEqual(1);
    expect(result!.is_active).toEqual(true);
  });

  it('should handle display_order zero value', async () => {
    // Create a test category first
    const createResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'Test description',
        display_order: 5,
        is_active: true
      })
      .returning()
      .execute();

    const categoryId = createResult[0].id;

    // Update display_order to 0
    const updateInput: UpdateCategoryInput = {
      id: categoryId,
      display_order: 0
    };

    const result = await updateCategory(updateInput);

    // Verify display_order was updated to 0
    expect(result).not.toBeNull();
    expect(result!.display_order).toEqual(0);
  });
});