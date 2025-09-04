import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { qrCodesTable } from '../db/schema';
import { type CreateQRCodeInput } from '../schema';
import { createQRCode } from '../handlers/create_qr_code';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateQRCodeInput = {
  name: 'Main Menu QR',
  menu_url: 'https://restaurant.example.com/menu',
  is_active: true
};

// Test input with minimal required fields (using defaults)
const minimalInput: CreateQRCodeInput = {
  name: 'Simple QR',
  menu_url: 'https://simple.example.com/menu'
  // is_active will use default value (true)
};

describe('createQRCode', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a QR code with all fields', async () => {
    const result = await createQRCode(testInput);

    // Basic field validation
    expect(result.name).toEqual('Main Menu QR');
    expect(result.menu_url).toEqual('https://restaurant.example.com/menu');
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify QR code URL is generated
    expect(result.qr_code_url).toBeDefined();
    expect(result.qr_code_url).toContain('qrserver.com');
    expect(result.qr_code_url).toContain(encodeURIComponent(testInput.menu_url));
  });

  it('should create a QR code with default is_active value', async () => {
    const result = await createQRCode(minimalInput);

    expect(result.name).toEqual('Simple QR');
    expect(result.menu_url).toEqual('https://simple.example.com/menu');
    expect(result.is_active).toEqual(true); // Should default to true
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a QR code with is_active set to false', async () => {
    const inactiveInput: CreateQRCodeInput = {
      name: 'Inactive QR',
      menu_url: 'https://inactive.example.com/menu',
      is_active: false
    };

    const result = await createQRCode(inactiveInput);

    expect(result.name).toEqual('Inactive QR');
    expect(result.is_active).toEqual(false);
    expect(result.qr_code_url).toBeDefined();
  });

  it('should save QR code to database', async () => {
    const result = await createQRCode(testInput);

    // Query the database to verify the record was saved
    const qrCodes = await db.select()
      .from(qrCodesTable)
      .where(eq(qrCodesTable.id, result.id))
      .execute();

    expect(qrCodes).toHaveLength(1);
    expect(qrCodes[0].name).toEqual('Main Menu QR');
    expect(qrCodes[0].menu_url).toEqual('https://restaurant.example.com/menu');
    expect(qrCodes[0].is_active).toEqual(true);
    expect(qrCodes[0].qr_code_url).toBeDefined();
    expect(qrCodes[0].created_at).toBeInstanceOf(Date);
    expect(qrCodes[0].updated_at).toBeInstanceOf(Date);
  });

  it('should generate unique QR code URLs for different menu URLs', async () => {
    const input1: CreateQRCodeInput = {
      name: 'QR 1',
      menu_url: 'https://restaurant1.example.com/menu'
    };

    const input2: CreateQRCodeInput = {
      name: 'QR 2',
      menu_url: 'https://restaurant2.example.com/menu'
    };

    const result1 = await createQRCode(input1);
    const result2 = await createQRCode(input2);

    expect(result1.qr_code_url).not.toEqual(result2.qr_code_url);
    expect(result1.qr_code_url).toContain(encodeURIComponent(input1.menu_url));
    expect(result2.qr_code_url).toContain(encodeURIComponent(input2.menu_url));
  });

  it('should handle special characters in menu URLs', async () => {
    const specialUrlInput: CreateQRCodeInput = {
      name: 'Special Characters QR',
      menu_url: 'https://restaurant.example.com/menu?table=1&section=main%20dining'
    };

    const result = await createQRCode(specialUrlInput);

    expect(result.name).toEqual('Special Characters QR');
    expect(result.menu_url).toEqual(specialUrlInput.menu_url);
    expect(result.qr_code_url).toBeDefined();
    expect(result.qr_code_url).toContain('qrserver.com');
    // URL should be properly encoded
    expect(result.qr_code_url).toContain(encodeURIComponent(specialUrlInput.menu_url));
  });

  it('should create multiple QR codes successfully', async () => {
    const input1: CreateQRCodeInput = {
      name: 'First QR',
      menu_url: 'https://first.example.com/menu'
    };

    const input2: CreateQRCodeInput = {
      name: 'Second QR',
      menu_url: 'https://second.example.com/menu'
    };

    const result1 = await createQRCode(input1);
    const result2 = await createQRCode(input2);

    // Both should be created successfully
    expect(result1.id).toBeDefined();
    expect(result2.id).toBeDefined();
    expect(result1.id).not.toEqual(result2.id);

    // Verify both exist in database
    const allQRCodes = await db.select()
      .from(qrCodesTable)
      .execute();

    expect(allQRCodes).toHaveLength(2);
    const names = allQRCodes.map(qr => qr.name);
    expect(names).toContain('First QR');
    expect(names).toContain('Second QR');
  });
});