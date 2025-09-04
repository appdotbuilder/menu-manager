import { db } from '../db';
import { qrCodesTable } from '../db/schema';
import { desc } from 'drizzle-orm';
import { type QRCode } from '../schema';

export const getQRCodes = async (): Promise<QRCode[]> => {
  try {
    const result = await db.select()
      .from(qrCodesTable)
      .orderBy(desc(qrCodesTable.created_at))
      .execute();

    return result;
  } catch (error) {
    console.error('Failed to fetch QR codes:', error);
    throw error;
  }
};