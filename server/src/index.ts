import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import {
  createCategoryInputSchema,
  updateCategoryInputSchema,
  createMenuItemInputSchema,
  updateMenuItemInputSchema,
  createMenuThemeInputSchema,
  updateMenuThemeInputSchema,
  createQRCodeInputSchema,
  updateQRCodeInputSchema,
  deleteEntityInputSchema,
  getEntityByIdInputSchema
} from './schema';

// Import handlers - Categories
import { createCategory } from './handlers/create_category';
import { getCategories } from './handlers/get_categories';
import { getCategoryById } from './handlers/get_category_by_id';
import { updateCategory } from './handlers/update_category';
import { deleteCategory } from './handlers/delete_category';

// Import handlers - Menu Items
import { createMenuItem } from './handlers/create_menu_item';
import { getMenuItems } from './handlers/get_menu_items';
import { getMenuItemsByCategory } from './handlers/get_menu_items_by_category';
import { getMenuItemById } from './handlers/get_menu_item_by_id';
import { updateMenuItem } from './handlers/update_menu_item';
import { deleteMenuItem } from './handlers/delete_menu_item';

// Import handlers - Menu Themes
import { createMenuTheme } from './handlers/create_menu_theme';
import { getMenuThemes } from './handlers/get_menu_themes';
import { getActiveMenuTheme } from './handlers/get_active_menu_theme';
import { updateMenuTheme } from './handlers/update_menu_theme';
import { deleteMenuTheme } from './handlers/delete_menu_theme';

// Import handlers - QR Codes
import { createQRCode } from './handlers/create_qr_code';
import { getQRCodes } from './handlers/get_qr_codes';
import { getQRCodeById } from './handlers/get_qr_code_by_id';
import { updateQRCode } from './handlers/update_qr_code';
import { deleteQRCode } from './handlers/delete_qr_code';
import { regenerateQRCode } from './handlers/regenerate_qr_code';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Category routes
  createCategory: publicProcedure
    .input(createCategoryInputSchema)
    .mutation(({ input }) => createCategory(input)),
  
  getCategories: publicProcedure
    .query(() => getCategories()),
  
  getCategoryById: publicProcedure
    .input(getEntityByIdInputSchema)
    .query(({ input }) => getCategoryById(input)),
  
  updateCategory: publicProcedure
    .input(updateCategoryInputSchema)
    .mutation(({ input }) => updateCategory(input)),
  
  deleteCategory: publicProcedure
    .input(deleteEntityInputSchema)
    .mutation(({ input }) => deleteCategory(input)),

  // Menu Item routes
  createMenuItem: publicProcedure
    .input(createMenuItemInputSchema)
    .mutation(({ input }) => createMenuItem(input)),
  
  getMenuItems: publicProcedure
    .query(() => getMenuItems()),
  
  getMenuItemsByCategory: publicProcedure
    .input(getEntityByIdInputSchema)
    .query(({ input }) => getMenuItemsByCategory(input)),
  
  getMenuItemById: publicProcedure
    .input(getEntityByIdInputSchema)
    .query(({ input }) => getMenuItemById(input)),
  
  updateMenuItem: publicProcedure
    .input(updateMenuItemInputSchema)
    .mutation(({ input }) => updateMenuItem(input)),
  
  deleteMenuItem: publicProcedure
    .input(deleteEntityInputSchema)
    .mutation(({ input }) => deleteMenuItem(input)),

  // Menu Theme routes
  createMenuTheme: publicProcedure
    .input(createMenuThemeInputSchema)
    .mutation(({ input }) => createMenuTheme(input)),
  
  getMenuThemes: publicProcedure
    .query(() => getMenuThemes()),
  
  getActiveMenuTheme: publicProcedure
    .query(() => getActiveMenuTheme()),
  
  updateMenuTheme: publicProcedure
    .input(updateMenuThemeInputSchema)
    .mutation(({ input }) => updateMenuTheme(input)),
  
  deleteMenuTheme: publicProcedure
    .input(deleteEntityInputSchema)
    .mutation(({ input }) => deleteMenuTheme(input)),

  // QR Code routes
  createQRCode: publicProcedure
    .input(createQRCodeInputSchema)
    .mutation(({ input }) => createQRCode(input)),
  
  getQRCodes: publicProcedure
    .query(() => getQRCodes()),
  
  getQRCodeById: publicProcedure
    .input(getEntityByIdInputSchema)
    .query(({ input }) => getQRCodeById(input)),
  
  updateQRCode: publicProcedure
    .input(updateQRCodeInputSchema)
    .mutation(({ input }) => updateQRCode(input)),
  
  deleteQRCode: publicProcedure
    .input(deleteEntityInputSchema)
    .mutation(({ input }) => deleteQRCode(input)),
  
  regenerateQRCode: publicProcedure
    .input(getEntityByIdInputSchema)
    .mutation(({ input }) => regenerateQRCode(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();