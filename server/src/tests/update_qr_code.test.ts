import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { qrCodesTable } from '../db/schema';
import { type UpdateQRCodeInput } from '../schema';
import { updateQRCode } from '../handlers/update_qr_code';
import { eq } from 'drizzle-orm';

describe('updateQRCode', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testQRCodeId: number;

  beforeEach(async () => {
    // Create a test QR code before each test
    const result = await db.insert(qrCodesTable)
      .values({
        name: 'Test QR Code',
        menu_url: 'https://menu.example.com',
        qr_code_url: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https%3A%2F%2Fmenu.example.com',
        is_active: true
      })
      .returning()
      .execute();
    
    testQRCodeId = result[0].id;
  });

  it('should update QR code name only', async () => {
    const input: UpdateQRCodeInput = {
      id: testQRCodeId,
      name: 'Updated QR Code Name'
    };

    const result = await updateQRCode(input);

    expect(result).not.toBeNull();
    expect(result!.name).toEqual('Updated QR Code Name');
    expect(result!.menu_url).toEqual('https://menu.example.com'); // Should remain unchanged
    expect(result!.is_active).toBe(true); // Should remain unchanged
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.id).toEqual(testQRCodeId);
  });

  it('should update menu_url and regenerate QR code', async () => {
    const newMenuUrl = 'https://newmenu.example.com';
    const input: UpdateQRCodeInput = {
      id: testQRCodeId,
      menu_url: newMenuUrl
    };

    const result = await updateQRCode(input);

    expect(result).not.toBeNull();
    expect(result!.menu_url).toEqual(newMenuUrl);
    expect(result!.qr_code_url).toEqual(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(newMenuUrl)}`);
    expect(result!.name).toEqual('Test QR Code'); // Should remain unchanged
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should update is_active status', async () => {
    const input: UpdateQRCodeInput = {
      id: testQRCodeId,
      is_active: false
    };

    const result = await updateQRCode(input);

    expect(result).not.toBeNull();
    expect(result!.is_active).toBe(false);
    expect(result!.name).toEqual('Test QR Code'); // Should remain unchanged
    expect(result!.menu_url).toEqual('https://menu.example.com'); // Should remain unchanged
  });

  it('should update multiple fields at once', async () => {
    const newMenuUrl = 'https://updated.menu.com';
    const input: UpdateQRCodeInput = {
      id: testQRCodeId,
      name: 'Multi Update QR',
      menu_url: newMenuUrl,
      is_active: false
    };

    const result = await updateQRCode(input);

    expect(result).not.toBeNull();
    expect(result!.name).toEqual('Multi Update QR');
    expect(result!.menu_url).toEqual(newMenuUrl);
    expect(result!.qr_code_url).toEqual(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(newMenuUrl)}`);
    expect(result!.is_active).toBe(false);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent QR code', async () => {
    const input: UpdateQRCodeInput = {
      id: 99999,
      name: 'Non-existent QR'
    };

    const result = await updateQRCode(input);

    expect(result).toBeNull();
  });

  it('should save changes to database', async () => {
    const input: UpdateQRCodeInput = {
      id: testQRCodeId,
      name: 'Database Test QR'
    };

    const result = await updateQRCode(input);

    // Verify changes were saved to database
    const qrCodes = await db.select()
      .from(qrCodesTable)
      .where(eq(qrCodesTable.id, testQRCodeId))
      .execute();

    expect(qrCodes).toHaveLength(1);
    expect(qrCodes[0].name).toEqual('Database Test QR');
    expect(qrCodes[0].updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toEqual(qrCodes[0].updated_at.getTime());
  });

  it('should handle URL encoding correctly', async () => {
    const complexUrl = 'https://menu.example.com/restaurant?id=123&lang=en&special=café';
    const input: UpdateQRCodeInput = {
      id: testQRCodeId,
      menu_url: complexUrl
    };

    const result = await updateQRCode(input);

    expect(result).not.toBeNull();
    expect(result!.menu_url).toEqual(complexUrl);
    expect(result!.qr_code_url).toContain('https://api.qrserver.com/v1/create-qr-code/');
    expect(result!.qr_code_url).toContain(encodeURIComponent(complexUrl));
  });

  it('should update timestamp even with minimal changes', async () => {
    // Get original timestamp
    const originalQRCode = await db.select()
      .from(qrCodesTable)
      .where(eq(qrCodesTable.id, testQRCodeId))
      .execute();

    // Small delay to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const input: UpdateQRCodeInput = {
      id: testQRCodeId,
      is_active: true // Same value as before, but should still update timestamp
    };

    const result = await updateQRCode(input);

    expect(result).not.toBeNull();
    expect(result!.updated_at.getTime()).toBeGreaterThan(originalQRCode[0].updated_at.getTime());
  });
});