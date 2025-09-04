import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { qrCodesTable } from '../db/schema';
import { type DeleteEntityInput, type CreateQRCodeInput } from '../schema';
import { deleteQRCode } from '../handlers/delete_qr_code';
import { eq } from 'drizzle-orm';

// Test input for creating a QR code
const testQRCodeInput: CreateQRCodeInput = {
  name: 'Test QR Code',
  menu_url: 'https://example.com/menu',
  is_active: true
};

describe('deleteQRCode', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing QR code', async () => {
    // First create a QR code
    const createResult = await db.insert(qrCodesTable)
      .values({
        name: testQRCodeInput.name,
        menu_url: testQRCodeInput.menu_url,
        qr_code_url: 'https://example.com/qr-code.png',
        is_active: testQRCodeInput.is_active || true
      })
      .returning()
      .execute();

    const createdQRCode = createResult[0];

    // Now delete the QR code
    const deleteInput: DeleteEntityInput = {
      id: createdQRCode.id
    };

    const result = await deleteQRCode(deleteInput);

    expect(result).toBe(true);

    // Verify the QR code was actually deleted from the database
    const qrCodes = await db.select()
      .from(qrCodesTable)
      .where(eq(qrCodesTable.id, createdQRCode.id))
      .execute();

    expect(qrCodes).toHaveLength(0);
  });

  it('should return false when QR code does not exist', async () => {
    const deleteInput: DeleteEntityInput = {
      id: 999 // Non-existent ID
    };

    const result = await deleteQRCode(deleteInput);

    expect(result).toBe(false);
  });

  it('should not affect other QR codes when deleting one', async () => {
    // Create multiple QR codes
    const qrCode1 = await db.insert(qrCodesTable)
      .values({
        name: 'QR Code 1',
        menu_url: 'https://example.com/menu1',
        qr_code_url: 'https://example.com/qr1.png',
        is_active: true
      })
      .returning()
      .execute();

    const qrCode2 = await db.insert(qrCodesTable)
      .values({
        name: 'QR Code 2',
        menu_url: 'https://example.com/menu2',
        qr_code_url: 'https://example.com/qr2.png',
        is_active: true
      })
      .returning()
      .execute();

    // Delete the first QR code
    const deleteInput: DeleteEntityInput = {
      id: qrCode1[0].id
    };

    const result = await deleteQRCode(deleteInput);

    expect(result).toBe(true);

    // Verify only the first QR code was deleted
    const remainingQRCodes = await db.select()
      .from(qrCodesTable)
      .execute();

    expect(remainingQRCodes).toHaveLength(1);
    expect(remainingQRCodes[0].id).toBe(qrCode2[0].id);
    expect(remainingQRCodes[0].name).toBe('QR Code 2');
  });

  it('should handle deletion of inactive QR codes', async () => {
    // Create an inactive QR code
    const createResult = await db.insert(qrCodesTable)
      .values({
        name: 'Inactive QR Code',
        menu_url: 'https://example.com/menu',
        qr_code_url: 'https://example.com/qr-inactive.png',
        is_active: false
      })
      .returning()
      .execute();

    const createdQRCode = createResult[0];

    // Delete the inactive QR code
    const deleteInput: DeleteEntityInput = {
      id: createdQRCode.id
    };

    const result = await deleteQRCode(deleteInput);

    expect(result).toBe(true);

    // Verify the QR code was deleted
    const qrCodes = await db.select()
      .from(qrCodesTable)
      .where(eq(qrCodesTable.id, createdQRCode.id))
      .execute();

    expect(qrCodes).toHaveLength(0);
  });

  it('should verify QR code exists before attempting deletion', async () => {
    // Create and delete a QR code
    const createResult = await db.insert(qrCodesTable)
      .values({
        name: testQRCodeInput.name,
        menu_url: testQRCodeInput.menu_url,
        qr_code_url: 'https://example.com/qr-test.png',
        is_active: true
      })
      .returning()
      .execute();

    const createdQRCode = createResult[0];

    // Delete it once
    const deleteInput: DeleteEntityInput = {
      id: createdQRCode.id
    };

    const firstDeleteResult = await deleteQRCode(deleteInput);
    expect(firstDeleteResult).toBe(true);

    // Try to delete it again - should return false
    const secondDeleteResult = await deleteQRCode(deleteInput);
    expect(secondDeleteResult).toBe(false);
  });
});