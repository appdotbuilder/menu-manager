import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type CreateCategoryInput } from '../schema';
import { createCategory } from '../handlers/create_category';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateCategoryInput = {
  name: 'Appetizers',
  description: 'Delicious starters to begin your meal',
  display_order: 1,
  is_active: true
};

describe('createCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a category with all fields', async () => {
    const result = await createCategory(testInput);

    // Basic field validation
    expect(result.name).toEqual('Appetizers');
    expect(result.description).toEqual('Delicious starters to begin your meal');
    expect(result.display_order).toEqual(1);
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save category to database', async () => {
    const result = await createCategory(testInput);

    // Query using proper drizzle syntax
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, result.id))
      .execute();

    expect(categories).toHaveLength(1);
    expect(categories[0].name).toEqual('Appetizers');
    expect(categories[0].description).toEqual('Delicious starters to begin your meal');
    expect(categories[0].display_order).toEqual(1);
    expect(categories[0].is_active).toEqual(true);
    expect(categories[0].created_at).toBeInstanceOf(Date);
    expect(categories[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle minimal input with defaults', async () => {
    const minimalInput: CreateCategoryInput = {
      name: 'Main Courses',
      description: null
    };

    const result = await createCategory(minimalInput);

    expect(result.name).toEqual('Main Courses');
    expect(result.description).toBeNull();
    expect(result.display_order).toEqual(0); // Default value
    expect(result.is_active).toEqual(true); // Default value
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should handle null description', async () => {
    const inputWithNullDescription: CreateCategoryInput = {
      name: 'Desserts',
      description: null,
      display_order: 5,
      is_active: false
    };

    const result = await createCategory(inputWithNullDescription);

    expect(result.name).toEqual('Desserts');
    expect(result.description).toBeNull();
    expect(result.display_order).toEqual(5);
    expect(result.is_active).toEqual(false);
  });

  it('should handle custom display order and active status', async () => {
    const customInput: CreateCategoryInput = {
      name: 'Beverages',
      description: 'Hot and cold drinks',
      display_order: 10,
      is_active: false
    };

    const result = await createCategory(customInput);

    expect(result.name).toEqual('Beverages');
    expect(result.description).toEqual('Hot and cold drinks');
    expect(result.display_order).toEqual(10);
    expect(result.is_active).toEqual(false);
  });

  it('should create multiple categories with different display orders', async () => {
    const category1 = await createCategory({
      name: 'Starters',
      description: 'Light appetizers',
      display_order: 1,
      is_active: true
    });

    const category2 = await createCategory({
      name: 'Mains',
      description: 'Hearty main courses',
      display_order: 2,
      is_active: true
    });

    // Verify both categories exist in database
    const allCategories = await db.select()
      .from(categoriesTable)
      .execute();

    expect(allCategories).toHaveLength(2);
    
    const starterCategory = allCategories.find(cat => cat.name === 'Starters');
    const mainCategory = allCategories.find(cat => cat.name === 'Mains');

    expect(starterCategory).toBeDefined();
    expect(starterCategory!.display_order).toEqual(1);
    
    expect(mainCategory).toBeDefined();
    expect(mainCategory!.display_order).toEqual(2);
  });
});