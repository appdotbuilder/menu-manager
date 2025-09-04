import { db } from '../db';
import { qrCodesTable } from '../db/schema';
import { type CreateQRCodeInput, type QRCode } from '../schema';

export const createQRCode = async (input: CreateQRCodeInput): Promise<QRCode> => {
  try {
    // For this implementation, we'll generate a placeholder QR code URL
    // In a real implementation, this would integrate with a QR code generation service
    // and potentially upload the image to cloud storage
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(input.menu_url)}`;

    // Insert QR code record
    const result = await db.insert(qrCodesTable)
      .values({
        name: input.name,
        menu_url: input.menu_url,
        qr_code_url: qrCodeUrl,
        is_active: input.is_active ?? true // Apply default if not provided
      })
      .returning()
      .execute();

    // Return the created QR code
    return result[0];
  } catch (error) {
    console.error('QR code creation failed:', error);
    throw error;
  }
};