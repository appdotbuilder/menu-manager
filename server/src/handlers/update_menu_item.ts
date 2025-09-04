import { db } from '../db';
import { menuItemsTable, categoriesTable } from '../db/schema';
import { type UpdateMenuItemInput, type MenuItem } from '../schema';
import { eq } from 'drizzle-orm';

export const updateMenuItem = async (input: UpdateMenuItemInput): Promise<MenuItem | null> => {
  try {
    // First check if the menu item exists
    const existingItem = await db.select()
      .from(menuItemsTable)
      .where(eq(menuItemsTable.id, input.id))
      .execute();

    if (existingItem.length === 0) {
      return null;
    }

    // If category_id is being updated, validate that the category exists
    if (input.category_id !== undefined) {
      const categoryExists = await db.select()
        .from(categoriesTable)
        .where(eq(categoriesTable.id, input.category_id))
        .execute();

      if (categoryExists.length === 0) {
        throw new Error(`Category with id ${input.category_id} does not exist`);
      }
    }

    // Build the update object with only the fields that are provided
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.price !== undefined) {
      updateData.price = input.price.toString(); // Convert number to string for numeric column
    }
    if (input.ingredients !== undefined) {
      updateData.ingredients = input.ingredients;
    }
    if (input.image_url !== undefined) {
      updateData.image_url = input.image_url;
    }
    if (input.dietary_labels !== undefined) {
      updateData.dietary_labels = input.dietary_labels;
    }
    if (input.is_available !== undefined) {
      updateData.is_available = input.is_available;
    }
    if (input.display_order !== undefined) {
      updateData.display_order = input.display_order;
    }
    if (input.category_id !== undefined) {
      updateData.category_id = input.category_id;
    }

    // Update the menu item
    const result = await db.update(menuItemsTable)
      .set(updateData)
      .where(eq(menuItemsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      return null;
    }

    // Convert numeric fields back to numbers before returning
    const menuItem = result[0];
    return {
      ...menuItem,
      price: parseFloat(menuItem.price), // Convert string back to number
      dietary_labels: (menuItem.dietary_labels || []) as MenuItem['dietary_labels'] // Ensure array is returned even if null with proper typing
    };
  } catch (error) {
    console.error('Menu item update failed:', error);
    throw error;
  }
};