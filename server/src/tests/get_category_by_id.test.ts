import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type GetEntityByIdInput, type CreateCategoryInput } from '../schema';
import { getCategoryById } from '../handlers/get_category_by_id';

// Test input for getting category by ID
const testGetInput: GetEntityByIdInput = {
  id: 1
};

// Test input for creating category
const testCreateInput: CreateCategoryInput = {
  name: 'Appetizers',
  description: 'Delicious starters and small plates',
  display_order: 1,
  is_active: true
};

describe('getCategoryById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return category when found', async () => {
    // First create a category
    const insertResult = await db.insert(categoriesTable)
      .values({
        name: testCreateInput.name,
        description: testCreateInput.description,
        display_order: testCreateInput.display_order || 0,
        is_active: testCreateInput.is_active || true
      })
      .returning()
      .execute();

    const createdCategory = insertResult[0];

    // Now get the category by ID
    const result = await getCategoryById({ id: createdCategory.id });

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdCategory.id);
    expect(result!.name).toEqual('Appetizers');
    expect(result!.description).toEqual('Delicious starters and small plates');
    expect(result!.display_order).toEqual(1);
    expect(result!.is_active).toEqual(true);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when category not found', async () => {
    // Try to get a category that doesn't exist
    const result = await getCategoryById({ id: 999 });

    // Verify null is returned
    expect(result).toBeNull();
  });

  it('should return category with null description', async () => {
    // Create a category with null description
    const insertResult = await db.insert(categoriesTable)
      .values({
        name: 'Main Courses',
        description: null,
        display_order: 2,
        is_active: true
      })
      .returning()
      .execute();

    const createdCategory = insertResult[0];

    // Get the category by ID
    const result = await getCategoryById({ id: createdCategory.id });

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdCategory.id);
    expect(result!.name).toEqual('Main Courses');
    expect(result!.description).toBeNull();
    expect(result!.display_order).toEqual(2);
    expect(result!.is_active).toEqual(true);
  });

  it('should return inactive category', async () => {
    // Create an inactive category
    const insertResult = await db.insert(categoriesTable)
      .values({
        name: 'Seasonal Items',
        description: 'Limited time offerings',
        display_order: 5,
        is_active: false
      })
      .returning()
      .execute();

    const createdCategory = insertResult[0];

    // Get the category by ID
    const result = await getCategoryById({ id: createdCategory.id });

    // Verify the result includes inactive category
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdCategory.id);
    expect(result!.name).toEqual('Seasonal Items');
    expect(result!.is_active).toEqual(false);
  });

  it('should handle database query correctly', async () => {
    // Create multiple categories
    const categories = [
      { name: 'Appetizers', description: 'Starters', display_order: 1, is_active: true },
      { name: 'Main Courses', description: 'Entrees', display_order: 2, is_active: true },
      { name: 'Desserts', description: 'Sweet treats', display_order: 3, is_active: true }
    ];

    const insertResults = await db.insert(categoriesTable)
      .values(categories)
      .returning()
      .execute();

    // Get the middle category
    const targetCategory = insertResults[1];
    const result = await getCategoryById({ id: targetCategory.id });

    // Verify we got the correct category
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(targetCategory.id);
    expect(result!.name).toEqual('Main Courses');
    expect(result!.description).toEqual('Entrees');
  });
});