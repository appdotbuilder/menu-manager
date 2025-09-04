import { serial, text, pgTable, timestamp, numeric, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enum for dietary labels
export const dietaryLabelEnum = pgEnum('dietary_label', [
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

// Enum for button shapes
export const buttonShapeEnum = pgEnum('button_shape', [
  'rounded',
  'square',
  'pill'
]);

// Enum for background types
export const backgroundTypeEnum = pgEnum('background_type', [
  'color',
  'image'
]);

// Categories table
export const categoriesTable = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'), // Nullable by default
  display_order: integer('display_order').notNull().default(0),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Menu items table
export const menuItemsTable = pgTable('menu_items', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'), // Nullable by default
  price: numeric('price', { precision: 10, scale: 2 }).notNull(), // Use numeric for monetary values
  ingredients: text('ingredients'), // Nullable by default
  image_url: text('image_url'), // Nullable by default
  dietary_labels: text('dietary_labels').array(), // Array of dietary labels stored as text array
  is_available: boolean('is_available').notNull().default(true),
  display_order: integer('display_order').notNull().default(0),
  category_id: integer('category_id').references(() => categoriesTable.id).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Menu theme table
export const menuThemesTable = pgTable('menu_themes', {
  id: serial('id').primaryKey(),
  restaurant_name: text('restaurant_name').notNull(),
  button_color: text('button_color').notNull(), // Hex color code
  button_shape: buttonShapeEnum('button_shape').notNull(),
  background_type: backgroundTypeEnum('background_type').notNull(),
  background_value: text('background_value').notNull(), // Hex color or image URL
  border_radius: integer('border_radius').notNull().default(10), // 0-50 for roundness percentage
  primary_color: text('primary_color').notNull(), // Hex color code
  text_color: text('text_color').notNull(), // Hex color code
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// QR codes table
export const qrCodesTable = pgTable('qr_codes', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  menu_url: text('menu_url').notNull(),
  qr_code_url: text('qr_code_url').notNull(), // URL to the generated QR code image
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Define relations
export const categoriesRelations = relations(categoriesTable, ({ many }) => ({
  menuItems: many(menuItemsTable),
}));

export const menuItemsRelations = relations(menuItemsTable, ({ one }) => ({
  category: one(categoriesTable, {
    fields: [menuItemsTable.category_id],
    references: [categoriesTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Category = typeof categoriesTable.$inferSelect; // For SELECT operations
export type NewCategory = typeof categoriesTable.$inferInsert; // For INSERT operations

export type MenuItem = typeof menuItemsTable.$inferSelect;
export type NewMenuItem = typeof menuItemsTable.$inferInsert;

export type MenuTheme = typeof menuThemesTable.$inferSelect;
export type NewMenuTheme = typeof menuThemesTable.$inferInsert;

export type QRCode = typeof qrCodesTable.$inferSelect;
export type NewQRCode = typeof qrCodesTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  categories: categoriesTable,
  menuItems: menuItemsTable,
  menuThemes: menuThemesTable,
  qrCodes: qrCodesTable
};