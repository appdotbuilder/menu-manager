import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type UpdateCategoryInput, type Category } from '../schema';
import { eq } from 'drizzle-orm';

export const updateCategory = async (input: UpdateCategoryInput): Promise<Category | null> => {
  try {
    // Extract id and update fields
    const { id, ...updateFields } = input;

    // Check if category exists first
    const existingCategory = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, id))
      .execute();

    if (existingCategory.length === 0) {
      return null;
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof categoriesTable.$inferInsert> = {};
    
    if (updateFields.name !== undefined) {
      updateData.name = updateFields.name;
    }
    
    if (updateFields.description !== undefined) {
      updateData.description = updateFields.description;
    }
    
    if (updateFields.display_order !== undefined) {
      updateData.display_order = updateFields.display_order;
    }
    
    if (updateFields.is_active !== undefined) {
      updateData.is_active = updateFields.is_active;
    }

    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    // If no fields to update (other than id), return existing category
    if (Object.keys(updateData).length === 1) { // Only updated_at
      return existingCategory[0] as Category;
    }

    // Perform the update
    const result = await db.update(categoriesTable)
      .set(updateData)
      .where(eq(categoriesTable.id, id))
      .returning()
      .execute();

    return result[0] as Category;
  } catch (error) {
    console.error('Category update failed:', error);
    throw error;
  }
};