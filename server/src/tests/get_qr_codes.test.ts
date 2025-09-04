import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { qrCodesTable } from '../db/schema';
import { getQRCodes } from '../handlers/get_qr_codes';

describe('getQRCodes', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no QR codes exist', async () => {
    const result = await getQRCodes();
    
    expect(result).toEqual([]);
  });

  it('should return all QR codes ordered by created_at descending', async () => {
    // Create test QR codes with slight delay to ensure different timestamps
    const qrCode1 = await db.insert(qrCodesTable)
      .values({
        name: 'First QR Code',
        menu_url: 'https://example.com/menu1',
        qr_code_url: 'https://example.com/qr1.png',
        is_active: true
      })
      .returning()
      .execute();

    // Add a small delay to ensure different created_at timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const qrCode2 = await db.insert(qrCodesTable)
      .values({
        name: 'Second QR Code',
        menu_url: 'https://example.com/menu2',
        qr_code_url: 'https://example.com/qr2.png',
        is_active: false
      })
      .returning()
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    const qrCode3 = await db.insert(qrCodesTable)
      .values({
        name: 'Third QR Code',
        menu_url: 'https://example.com/menu3',
        qr_code_url: 'https://example.com/qr3.png',
        is_active: true
      })
      .returning()
      .execute();

    const result = await getQRCodes();

    expect(result).toHaveLength(3);
    
    // Should be ordered by created_at descending (newest first)
    expect(result[0].name).toEqual('Third QR Code');
    expect(result[1].name).toEqual('Second QR Code');
    expect(result[2].name).toEqual('First QR Code');

    // Verify all fields are returned correctly
    expect(result[0].menu_url).toEqual('https://example.com/menu3');
    expect(result[0].qr_code_url).toEqual('https://example.com/qr3.png');
    expect(result[0].is_active).toEqual(true);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    // Verify inactive QR codes are also included
    expect(result[1].is_active).toEqual(false);
  });

  it('should include both active and inactive QR codes', async () => {
    // Create active QR code
    await db.insert(qrCodesTable)
      .values({
        name: 'Active QR Code',
        menu_url: 'https://example.com/active',
        qr_code_url: 'https://example.com/active.png',
        is_active: true
      })
      .execute();

    // Create inactive QR code
    await db.insert(qrCodesTable)
      .values({
        name: 'Inactive QR Code',
        menu_url: 'https://example.com/inactive',
        qr_code_url: 'https://example.com/inactive.png',
        is_active: false
      })
      .execute();

    const result = await getQRCodes();

    expect(result).toHaveLength(2);
    
    // Both active and inactive should be included
    const activeQR = result.find(qr => qr.name === 'Active QR Code');
    const inactiveQR = result.find(qr => qr.name === 'Inactive QR Code');
    
    expect(activeQR).toBeDefined();
    expect(activeQR?.is_active).toEqual(true);
    expect(inactiveQR).toBeDefined();
    expect(inactiveQR?.is_active).toEqual(false);
  });

  it('should handle QR codes with nullable fields correctly', async () => {
    // Create QR code with all required fields only
    await db.insert(qrCodesTable)
      .values({
        name: 'Basic QR Code',
        menu_url: 'https://example.com/basic',
        qr_code_url: 'https://example.com/basic.png'
      })
      .execute();

    const result = await getQRCodes();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Basic QR Code');
    expect(result[0].menu_url).toEqual('https://example.com/basic');
    expect(result[0].qr_code_url).toEqual('https://example.com/basic.png');
    expect(result[0].is_active).toEqual(true); // Default value
  });

  it('should maintain chronological order with multiple QR codes', async () => {
    const qrCodeNames = ['First', 'Second', 'Third', 'Fourth', 'Fifth'];
    
    // Create QR codes sequentially
    for (const name of qrCodeNames) {
      await db.insert(qrCodesTable)
        .values({
          name: `${name} QR Code`,
          menu_url: `https://example.com/${name.toLowerCase()}`,
          qr_code_url: `https://example.com/${name.toLowerCase()}.png`
        })
        .execute();
      
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    const result = await getQRCodes();

    expect(result).toHaveLength(5);
    
    // Should be in reverse chronological order (newest first)
    expect(result[0].name).toEqual('Fifth QR Code');
    expect(result[1].name).toEqual('Fourth QR Code');
    expect(result[2].name).toEqual('Third QR Code');
    expect(result[3].name).toEqual('Second QR Code');
    expect(result[4].name).toEqual('First QR Code');

    // Verify timestamps are in descending order
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].created_at >= result[i + 1].created_at).toBe(true);
    }
  });
});