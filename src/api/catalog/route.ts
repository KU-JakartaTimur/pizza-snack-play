import { Hono } from "hono";
import { requireAuth, type AuthEnv } from "../middleware/auth";
import { requireRole } from "../middleware/role";
import { catalogController } from "./controller";

/**
 * Katalog bersifat sekolah-wide (dipakai bersama semua kelas), sehingga
 * korlas boleh ikut mengelolanya — bukan hanya kelasnya sendiri.
 */
const catalogWriters = requireRole("admin", "korlas");

/**
 * Baca katalog: tersedia untuk semua user yang sudah login
 * (orang tua perlu melihat komponen menu pada jadwal).
 */
export const categoriesRoute = new Hono<AuthEnv>()
  .get("/", requireAuth, catalogController.listCategories)
  .get("/:id", requireAuth, catalogController.getCategory)
  .post("/", requireAuth, catalogWriters, catalogController.createCategory)
  .put("/:id", requireAuth, catalogWriters, catalogController.updateCategory)
  .delete("/:id", requireAuth, catalogWriters, catalogController.deleteCategory);

export const menusRoute = new Hono<AuthEnv>()
  // Didaftarkan sebelum `/:id` agar tidak tertangkap sebagai ID.
  .get("/item-types", requireAuth, catalogController.listItemTypes)
  .get("/", requireAuth, catalogController.listMenus)
  .get("/:id", requireAuth, catalogController.getMenu)
  .post("/", requireAuth, catalogWriters, catalogController.createMenu)
  .put("/:id", requireAuth, catalogWriters, catalogController.updateMenu)
  .delete("/:id", requireAuth, catalogWriters, catalogController.deleteMenu);
