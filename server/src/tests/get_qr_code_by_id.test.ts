import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { qrCodesTable } from '../db/schema';
import { type GetEntityByIdInput } from '../schema';
import { getQRCodeById } from '../handlers/get_qr_code_by_id';

// Test QR code data
const testQRCodeData = {
  name: 'Test QR Code',
  menu_url: 'https://example.com/menu',
  qr_code_url: 'https://example.com/qr-code.png',
  is_active: true
};

describe('getQRCodeById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return QR code when found', async () => {
    // Create a test QR code
    const insertResult = await db.insert(qrCodesTable)
      .values(testQRCodeData)
      .returning()
      .execute();

    const createdQRCode = insertResult[0];
    const input: GetEntityByIdInput = { id: createdQRCode.id };

    // Get the QR code by ID
    const result = await getQRCodeById(input);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toBe(createdQRCode.id);
    expect(result!.name).toBe('Test QR Code');
    expect(result!.menu_url).toBe('https://example.com/menu');
    expect(result!.qr_code_url).toBe('https://example.com/qr-code.png');
    expect(result!.is_active).toBe(true);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when QR code not found', async () => {
    const input: GetEntityByIdInput = { id: 999 };

    const result = await getQRCodeById(input);

    expect(result).toBeNull();
  });

  it('should return QR code with all field types correctly', async () => {
    // Create QR code with specific field values
    const specificQRCodeData = {
      name: 'Specific QR Code',
      menu_url: 'https://restaurant.com/digital-menu',
      qr_code_url: 'https://cdn.example.com/qr/abc123.png',
      is_active: false
    };

    const insertResult = await db.insert(qrCodesTable)
      .values(specificQRCodeData)
      .returning()
      .execute();

    const createdQRCode = insertResult[0];
    const input: GetEntityByIdInput = { id: createdQRCode.id };

    const result = await getQRCodeById(input);

    // Verify all field types and values
    expect(result).not.toBeNull();
    expect(typeof result!.id).toBe('number');
    expect(typeof result!.name).toBe('string');
    expect(typeof result!.menu_url).toBe('string');
    expect(typeof result!.qr_code_url).toBe('string');
    expect(typeof result!.is_active).toBe('boolean');
    expect(result!.is_active).toBe(false);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should handle QR codes with different active states', async () => {
    // Create inactive QR code
    const inactiveQRCodeData = {
      ...testQRCodeData,
      name: 'Inactive QR Code',
      is_active: false
    };

    const insertResult = await db.insert(qrCodesTable)
      .values(inactiveQRCodeData)
      .returning()
      .execute();

    const createdQRCode = insertResult[0];
    const input: GetEntityByIdInput = { id: createdQRCode.id };

    const result = await getQRCodeById(input);

    expect(result).not.toBeNull();
    expect(result!.is_active).toBe(false);
    expect(result!.name).toBe('Inactive QR Code');
  });

  it('should retrieve QR code among multiple records', async () => {
    // Create multiple QR codes
    const qrCode1Data = {
      name: 'QR Code 1',
      menu_url: 'https://example.com/menu1',
      qr_code_url: 'https://example.com/qr1.png',
      is_active: true
    };

    const qrCode2Data = {
      name: 'QR Code 2',
      menu_url: 'https://example.com/menu2',
      qr_code_url: 'https://example.com/qr2.png',
      is_active: false
    };

    await db.insert(qrCodesTable)
      .values([qrCode1Data, qrCode2Data])
      .execute();

    // Get all QR codes to find specific IDs
    const allQRCodes = await db.select()
      .from(qrCodesTable)
      .execute();

    const targetQRCode = allQRCodes.find(qr => qr.name === 'QR Code 2');
    expect(targetQRCode).toBeDefined();

    const input: GetEntityByIdInput = { id: targetQRCode!.id };
    const result = await getQRCodeById(input);

    expect(result).not.toBeNull();
    expect(result!.name).toBe('QR Code 2');
    expect(result!.menu_url).toBe('https://example.com/menu2');
    expect(result!.is_active).toBe(false);
  });
});