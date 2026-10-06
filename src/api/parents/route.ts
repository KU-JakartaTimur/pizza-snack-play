import { Hono } from "hono";
import { requireAuth, type AuthEnv } from "../middleware/auth";
import { requireRole } from "../middleware/role";
import { parentController } from "./controller";

/**
 * Manajemen akun orang tua — khusus admin.
 * `requireAuth` dipasang lebih dulu agar request tanpa token mendapat 401,
 * baru kemudian `requireRole("admin")` yang mengembalikan 403.
 */
const admin = requireRole("admin");

export const parentsRoute = new Hono<AuthEnv>()
  .get("/", requireAuth, admin, parentController.list)
  /**
   * Aksi massal atas akun yang dicentang di tabel (`{ ids, action }`).
   *
   * Didaftarkan **sebelum** `/:id` agar `/bulk` tidak tertangkap sebagai
   * `:id = "bulk"` (parameter id memanggil `parseId` yang akan menolaknya
   * sebagai "ID tidak valid", tapi lebih baik tidak sampai ke sana).
   */
  .post("/bulk", requireAuth, admin, parentController.bulk)
  .get("/:id", requireAuth, admin, parentController.detail)
  .post("/", requireAuth, admin, parentController.create)
  .put("/:id", requireAuth, admin, parentController.update)
  .delete("/:id", requireAuth, admin, parentController.remove)
  .post("/:id/reset-password", requireAuth, admin, parentController.resetPassword)
  /**
   * Buka kunci akun akibat percobaan masuk yang gagal. Dipisah dari
   * `reset-password` supaya admin bisa membuka kunci tanpa mengganti password
   * pemakainya — dua tindakan yang akibatnya berbeda.
   */
  .post("/:id/unlock", requireAuth, admin, parentController.unlock);
