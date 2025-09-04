import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type GetEntityByIdInput, type Category } from '../schema';
import { eq } from 'drizzle-orm';

export const getCategoryById = async (input: GetEntityByIdInput): Promise<Category | null> => {
  try {
    // Query the category by ID
    const results = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, input.id))
      .limit(1)
      .execute();

    // Return null if no category found
    if (results.length === 0) {
      return null;
    }

    // Return the category (no numeric conversions needed for this schema)
    return results[0];
  } catch (error) {
    console.error('Failed to fetch category by ID:', error);
    throw error;
  }
};