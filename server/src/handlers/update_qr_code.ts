import { db } from '../db';
import { qrCodesTable } from '../db/schema';
import { type UpdateQRCodeInput, type QRCode } from '../schema';
import { eq } from 'drizzle-orm';

export const updateQRCode = async (input: UpdateQRCodeInput): Promise<QRCode | null> => {
  try {
    // First, check if the QR code exists
    const existingQRCode = await db.select()
      .from(qrCodesTable)
      .where(eq(qrCodesTable.id, input.id))
      .execute();

    if (existingQRCode.length === 0) {
      return null;
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }

    if (input.menu_url !== undefined) {
      updateData.menu_url = input.menu_url;
      // When menu_url is updated, generate a new QR code URL
      // For now, we'll simulate QR code generation with a placeholder URL
      updateData.qr_code_url = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(input.menu_url)}`;
    }

    if (input.is_active !== undefined) {
      updateData.is_active = input.is_active;
    }

    // Update the QR code record
    const result = await db.update(qrCodesTable)
      .set(updateData)
      .where(eq(qrCodesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      return null;
    }

    return result[0];
  } catch (error) {
    console.error('QR code update failed:', error);
    throw error;
  }
};