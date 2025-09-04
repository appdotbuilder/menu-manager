import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { qrCodesTable } from '../db/schema';
import { type GetEntityByIdInput } from '../schema';
import { regenerateQRCode } from '../handlers/regenerate_qr_code';
import { eq } from 'drizzle-orm';

describe('regenerateQRCode', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should regenerate QR code for existing QR code', async () => {
    // Create a test QR code first
    const insertResult = await db.insert(qrCodesTable)
      .values({
        name: 'Test QR Code',
        menu_url: 'https://example.com/menu',
        qr_code_url: 'https://example.com/qr-codes/old-qr-123.png',
        is_active: true
      })
      .returning()
      .execute();

    const originalQRCode = insertResult[0];
    const testInput: GetEntityByIdInput = { id: originalQRCode.id };

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const result = await regenerateQRCode(testInput);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(originalQRCode.id);
    expect(result!.name).toEqual('Test QR Code');
    expect(result!.menu_url).toEqual('https://example.com/menu');
    expect(result!.is_active).toEqual(true);
    
    // QR code URL should be different (regenerated)
    expect(result!.qr_code_url).not.toEqual(originalQRCode.qr_code_url);
    expect(result!.qr_code_url).toMatch(/^https:\/\/example\.com\/qr-codes\/qr-\d+-\d+\.png$/);
    
    // Updated timestamp should be more recent
    expect(result!.updated_at.getTime()).toBeGreaterThan(originalQRCode.updated_at.getTime());
    
    // Created timestamp should remain the same
    expect(result!.created_at.getTime()).toEqual(originalQRCode.created_at.getTime());
  });

  it('should update QR code in database with new URL', async () => {
    // Create a test QR code first
    const insertResult = await db.insert(qrCodesTable)
      .values({
        name: 'Database Test QR',
        menu_url: 'https://example.com/menu/123',
        qr_code_url: 'https://example.com/qr-codes/original-qr.png',
        is_active: false
      })
      .returning()
      .execute();

    const originalQRCode = insertResult[0];
    const testInput: GetEntityByIdInput = { id: originalQRCode.id };

    await regenerateQRCode(testInput);

    // Query the database directly to verify the update
    const updatedQRCodes = await db.select()
      .from(qrCodesTable)
      .where(eq(qrCodesTable.id, originalQRCode.id))
      .execute();

    expect(updatedQRCodes).toHaveLength(1);
    const updatedQRCode = updatedQRCodes[0];

    // Verify all fields remain the same except qr_code_url and updated_at
    expect(updatedQRCode.name).toEqual('Database Test QR');
    expect(updatedQRCode.menu_url).toEqual('https://example.com/menu/123');
    expect(updatedQRCode.is_active).toEqual(false);
    expect(updatedQRCode.created_at.getTime()).toEqual(originalQRCode.created_at.getTime());
    
    // These should be different
    expect(updatedQRCode.qr_code_url).not.toEqual(originalQRCode.qr_code_url);
    expect(updatedQRCode.updated_at.getTime()).toBeGreaterThan(originalQRCode.updated_at.getTime());
  });

  it('should return null for non-existent QR code', async () => {
    const testInput: GetEntityByIdInput = { id: 99999 };

    const result = await regenerateQRCode(testInput);

    expect(result).toBeNull();
  });

  it('should generate unique QR code URLs for multiple regenerations', async () => {
    // Create a test QR code
    const insertResult = await db.insert(qrCodesTable)
      .values({
        name: 'Unique URL Test',
        menu_url: 'https://example.com/menu/unique',
        qr_code_url: 'https://example.com/qr-codes/original.png',
        is_active: true
      })
      .returning()
      .execute();

    const originalQRCode = insertResult[0];
    const testInput: GetEntityByIdInput = { id: originalQRCode.id };

    // Regenerate multiple times with small delays to ensure different timestamps
    const result1 = await regenerateQRCode(testInput);
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const result2 = await regenerateQRCode(testInput);
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const result3 = await regenerateQRCode(testInput);

    // All URLs should be different
    expect(result1!.qr_code_url).not.toEqual(result2!.qr_code_url);
    expect(result2!.qr_code_url).not.toEqual(result3!.qr_code_url);
    expect(result1!.qr_code_url).not.toEqual(result3!.qr_code_url);

    // All should follow the expected pattern
    expect(result1!.qr_code_url).toMatch(/^https:\/\/example\.com\/qr-codes\/qr-\d+-\d+\.png$/);
    expect(result2!.qr_code_url).toMatch(/^https:\/\/example\.com\/qr-codes\/qr-\d+-\d+\.png$/);
    expect(result3!.qr_code_url).toMatch(/^https:\/\/example\.com\/qr-codes\/qr-\d+-\d+\.png$/);

    // Updated timestamps should be progressive
    expect(result2!.updated_at.getTime()).toBeGreaterThan(result1!.updated_at.getTime());
    expect(result3!.updated_at.getTime()).toBeGreaterThan(result2!.updated_at.getTime());
  });

  it('should preserve all original QR code properties except qr_code_url and updated_at', async () => {
    // Create a QR code with all properties set
    const insertResult = await db.insert(qrCodesTable)
      .values({
        name: 'Preservation Test QR',
        menu_url: 'https://restaurant.com/digital-menu',
        qr_code_url: 'https://storage.com/qr-codes/old-code.png',
        is_active: false
      })
      .returning()
      .execute();

    const originalQRCode = insertResult[0];
    const testInput: GetEntityByIdInput = { id: originalQRCode.id };

    const result = await regenerateQRCode(testInput);

    // Properties that should remain unchanged
    expect(result!.id).toEqual(originalQRCode.id);
    expect(result!.name).toEqual('Preservation Test QR');
    expect(result!.menu_url).toEqual('https://restaurant.com/digital-menu');
    expect(result!.is_active).toEqual(false);
    expect(result!.created_at.getTime()).toEqual(originalQRCode.created_at.getTime());

    // Properties that should change
    expect(result!.qr_code_url).not.toEqual(originalQRCode.qr_code_url);
    expect(result!.updated_at.getTime()).toBeGreaterThan(originalQRCode.updated_at.getTime());
  });
});