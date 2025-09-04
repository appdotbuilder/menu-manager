import { db } from '../db';
import { qrCodesTable } from '../db/schema';
import { type DeleteEntityInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteQRCode = async (input: DeleteEntityInput): Promise<boolean> => {
  try {
    // First check if the QR code exists
    const existingQRCode = await db.select()
      .from(qrCodesTable)
      .where(eq(qrCodesTable.id, input.id))
      .execute();

    if (existingQRCode.length === 0) {
      return false; // QR code doesn't exist
    }

    // Delete the QR code from the database
    const deleteResult = await db.delete(qrCodesTable)
      .where(eq(qrCodesTable.id, input.id))
      .returning()
      .execute();

    // Return true if the deletion was successful
    return deleteResult.length > 0;
  } catch (error) {
    console.error('QR code deletion failed:', error);
    throw error;
  }
};