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
   * Unduh daftar akun sebagai berkas Excel (`.xlsx`) — **admin saja**.
   *
   * Didaftarkan **sebelum** `/:id` supaya `/export` tidak tertangkap sebagai
   * `:id = "export"` dan gagal dengan "ID tidak valid".
   */
  .get("/export", requireAuth, admin, parentController.exportAccounts)
  /**
   * Impor akun dari berkas Excel (isi dikirim base64 di dalam JSON) —
   * **admin saja**. Didaftarkan sebelum `/:id` dengan alasan yang sama
   * seperti `/export`.
   *
   * Yang sudah ada **ditimpa** (dicocokkan lewat username), yang belum
   * dibuat. Kirim `dryRun: true` untuk melihat nasib tiap baris tanpa
   * menulis apa pun.
   */
  .post("/import", requireAuth, admin, parentController.importAccounts)
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
