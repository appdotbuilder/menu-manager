import { db } from '../db';
import { menuItemsTable, categoriesTable } from '../db/schema';
import { type MenuItem, type DietaryLabel } from '../schema';
import { eq, asc } from 'drizzle-orm';

export const getMenuItems = async (): Promise<MenuItem[]> => {
  try {
    // Get all menu items with their categories, ordered by category display_order and menu item display_order
    const results = await db.select()
      .from(menuItemsTable)
      .innerJoin(categoriesTable, eq(menuItemsTable.category_id, categoriesTable.id))
      .orderBy(asc(categoriesTable.display_order), asc(menuItemsTable.display_order))
      .execute();

    // Transform results and handle numeric conversions
    return results.map(result => ({
      id: result.menu_items.id,
      name: result.menu_items.name,
      description: result.menu_items.description,
      price: parseFloat(result.menu_items.price), // Convert numeric string to number
      ingredients: result.menu_items.ingredients,
      image_url: result.menu_items.image_url,
      dietary_labels: (result.menu_items.dietary_labels || []) as DietaryLabel[], // Handle null arrays and cast to proper type
      is_available: result.menu_items.is_available,
      display_order: result.menu_items.display_order,
      category_id: result.menu_items.category_id,
      created_at: result.menu_items.created_at,
      updated_at: result.menu_items.updated_at
    }));
  } catch (error) {
    console.error('Failed to get menu items:', error);
    throw error;
  }
};