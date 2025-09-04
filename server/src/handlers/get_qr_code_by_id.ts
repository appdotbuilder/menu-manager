import { db } from '../db';
import { qrCodesTable } from '../db/schema';
import { type GetEntityByIdInput, type QRCode } from '../schema';
import { eq } from 'drizzle-orm';

export const getQRCodeById = async (input: GetEntityByIdInput): Promise<QRCode | null> => {
  try {
    const result = await db.select()
      .from(qrCodesTable)
      .where(eq(qrCodesTable.id, input.id))
      .execute();

    if (result.length === 0) {
      return null;
    }

    // Return the QR code - no numeric field conversions needed for this table
    return result[0];
  } catch (error) {
    console.error('Failed to get QR code by ID:', error);
    throw error;
  }
};