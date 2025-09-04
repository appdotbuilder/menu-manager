import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { getCategories } from '../handlers/get_categories';

describe('getCategories', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no categories exist', async () => {
    const result = await getCategories();
    
    expect(result).toHaveLength(0);
  });

  it('should return only active categories', async () => {
    // Create test categories - one active, one inactive
    await db.insert(categoriesTable)
      .values([
        {
          name: 'Active Category',
          description: 'This category is active',
          display_order: 1,
          is_active: true
        },
        {
          name: 'Inactive Category',
          description: 'This category is inactive',
          display_order: 2,
          is_active: false
        }
      ])
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Active Category');
    expect(result[0].is_active).toBe(true);
  });

  it('should return categories ordered by display_order', async () => {
    // Create categories with different display orders
    await db.insert(categoriesTable)
      .values([
        {
          name: 'Third Category',
          description: 'Display order 3',
          display_order: 3,
          is_active: true
        },
        {
          name: 'First Category',
          description: 'Display order 1',
          display_order: 1,
          is_active: true
        },
        {
          name: 'Second Category',
          description: 'Display order 2',
          display_order: 2,
          is_active: true
        }
      ])
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('First Category');
    expect(result[0].display_order).toEqual(1);
    expect(result[1].name).toEqual('Second Category');
    expect(result[1].display_order).toEqual(2);
    expect(result[2].name).toEqual('Third Category');
    expect(result[2].display_order).toEqual(3);
  });

  it('should return categories with all expected fields', async () => {
    await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A test category description',
        display_order: 1,
        is_active: true
      })
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(1);
    const category = result[0];
    
    expect(category.id).toBeDefined();
    expect(typeof category.id).toBe('number');
    expect(category.name).toEqual('Test Category');
    expect(category.description).toEqual('A test category description');
    expect(category.display_order).toEqual(1);
    expect(category.is_active).toBe(true);
    expect(category.created_at).toBeInstanceOf(Date);
    expect(category.updated_at).toBeInstanceOf(Date);
  });

  it('should handle categories with null description', async () => {
    await db.insert(categoriesTable)
      .values({
        name: 'Category Without Description',
        description: null,
        display_order: 1,
        is_active: true
      })
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Category Without Description');
    expect(result[0].description).toBeNull();
  });

  it('should handle mixed active/inactive categories with different display orders', async () => {
    // Create a mix of active and inactive categories with various display orders
    await db.insert(categoriesTable)
      .values([
        {
          name: 'Inactive First',
          description: 'Should not appear',
          display_order: 1,
          is_active: false
        },
        {
          name: 'Active Second',
          description: 'Should appear first',
          display_order: 2,
          is_active: true
        },
        {
          name: 'Active Fourth',
          description: 'Should appear second',
          display_order: 4,
          is_active: true
        },
        {
          name: 'Inactive Third',
          description: 'Should not appear',
          display_order: 3,
          is_active: false
        },
        {
          name: 'Active Fifth',
          description: 'Should appear third',
          display_order: 5,
          is_active: true
        }
      ])
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('Active Second');
    expect(result[0].display_order).toEqual(2);
    expect(result[1].name).toEqual('Active Fourth');
    expect(result[1].display_order).toEqual(4);
    expect(result[2].name).toEqual('Active Fifth');
    expect(result[2].display_order).toEqual(5);
    
    // Verify all returned categories are active
    result.forEach(category => {
      expect(category.is_active).toBe(true);
    });
  });
});