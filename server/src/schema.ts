import { z } from 'zod';

// Predefined dietary labels enum
export const dietaryLabelSchema = z.enum([
  'vegetarian',
  'vegan',
  'gluten-free',
  'dairy-free',
  'nut-free',
  'keto',
  'low-carb',
  'halal',
  'kosher',
  'spicy',
  'organic'
]);

export type DietaryLabel = z.infer<typeof dietaryLabelSchema>;

// Category schema
export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  display_order: z.number().int(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Category = z.infer<typeof categorySchema>;

// Menu item schema
export const menuItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  price: z.number(),
  ingredients: z.string().nullable(),
  image_url: z.string().nullable(),
  dietary_labels: z.array(dietaryLabelSchema),
  is_available: z.boolean(),
  display_order: z.number().int(),
  category_id: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type MenuItem = z.infer<typeof menuItemSchema>;

// Menu theme schema
export const menuThemeSchema = z.object({
  id: z.number(),
  restaurant_name: z.string(),
  button_color: z.string(), // Hex color code
  button_shape: z.enum(['rounded', 'square', 'pill']),
  background_type: z.enum(['color', 'image']),
  background_value: z.string(), // Hex color or image URL
  border_radius: z.number().int().min(0).max(50), // 0-50 for roundness percentage
  primary_color: z.string(), // Hex color code
  text_color: z.string(), // Hex color code
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type MenuTheme = z.infer<typeof menuThemeSchema>;

// QR Code schema
export const qrCodeSchema = z.object({
  id: z.number(),
  name: z.string(),
  menu_url: z.string(),
  qr_code_url: z.string(), // URL to the generated QR code image
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type QRCode = z.infer<typeof qrCodeSchema>;

// Input schemas for creating entities
export const createCategoryInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable(),
  display_order: z.number().int().optional(),
  is_active: z.boolean().optional()
});

export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>;

export const createMenuItemInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable(),
  price: z.number().positive(),
  ingredients: z.string().nullable(),
  image_url: z.string().url().nullable(),
  dietary_labels: z.array(dietaryLabelSchema).optional(),
  is_available: z.boolean().optional(),
  display_order: z.number().int().optional(),
  category_id: z.number()
});

export type CreateMenuItemInput = z.infer<typeof createMenuItemInputSchema>;

export const createMenuThemeInputSchema = z.object({
  restaurant_name: z.string().min(1),
  button_color: z.string().regex(/^#[0-9A-F]{6}$/i),
  button_shape: z.enum(['rounded', 'square', 'pill']),
  background_type: z.enum(['color', 'image']),
  background_value: z.string().min(1),
  border_radius: z.number().int().min(0).max(50),
  primary_color: z.string().regex(/^#[0-9A-F]{6}$/i),
  text_color: z.string().regex(/^#[0-9A-F]{6}$/i),
  is_active: z.boolean().optional()
});

export type CreateMenuThemeInput = z.infer<typeof createMenuThemeInputSchema>;

export const createQRCodeInputSchema = z.object({
  name: z.string().min(1),
  menu_url: z.string().url(),
  is_active: z.boolean().optional()
});

export type CreateQRCodeInput = z.infer<typeof createQRCodeInputSchema>;

// Input schemas for updating entities
export const updateCategoryInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  display_order: z.number().int().optional(),
  is_active: z.boolean().optional()
});

export type UpdateCategoryInput = z.infer<typeof updateCategoryInputSchema>;

export const updateMenuItemInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  price: z.number().positive().optional(),
  ingredients: z.string().nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  dietary_labels: z.array(dietaryLabelSchema).optional(),
  is_available: z.boolean().optional(),
  display_order: z.number().int().optional(),
  category_id: z.number().optional()
});

export type UpdateMenuItemInput = z.infer<typeof updateMenuItemInputSchema>;

export const updateMenuThemeInputSchema = z.object({
  id: z.number(),
  restaurant_name: z.string().min(1).optional(),
  button_color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  button_shape: z.enum(['rounded', 'square', 'pill']).optional(),
  background_type: z.enum(['color', 'image']).optional(),
  background_value: z.string().min(1).optional(),
  border_radius: z.number().int().min(0).max(50).optional(),
  primary_color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  text_color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  is_active: z.boolean().optional()
});

export type UpdateMenuThemeInput = z.infer<typeof updateMenuThemeInputSchema>;

export const updateQRCodeInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  menu_url: z.string().url().optional(),
  is_active: z.boolean().optional()
});

export type UpdateQRCodeInput = z.infer<typeof updateQRCodeInputSchema>;

// Additional utility schemas
export const deleteEntityInputSchema = z.object({
  id: z.number()
});

export type DeleteEntityInput = z.infer<typeof deleteEntityInputSchema>;

export const getEntityByIdInputSchema = z.object({
  id: z.number()
});

export type GetEntityByIdInput = z.infer<typeof getEntityByIdInputSchema>;