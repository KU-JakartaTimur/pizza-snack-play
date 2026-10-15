import { Hono } from "hono";
import { requireAuth, type AuthEnv } from "../middleware/auth";
import { requireRole } from "../middleware/role";
import { profileController } from "./controller";

/**
 * Layanan mandiri orang tua — mengelola **akun & anaknya sendiri** dari menu
 * Profil.
 *
 * Berbeda dari `/api/parents` yang khusus admin, di sini tidak ada `parentId`
 * di request: pemilik data selalu diambil dari token, sehingga satu orang tua
 * tidak mungkin menyentuh data orang tua lain. Korlas ikut diizinkan karena ia
 * juga orang tua murid.
 *
 * Yang boleh diubah sendiri terbatas pada data kontaknya — nama sapaan,
 * hubungan dengan siswa, dan nomor WhatsApp (`PUT /account`). `username`,
 * `peran`, dan kelas korlas tetap wewenang admin; membiarkannya diubah dari
 * sini berarti satu orang tua bisa menaikkan wewenangnya sendiri.
 *
 * `requireAuth` dipasang lebih dulu agar request tanpa token mendapat 401,
 * baru kemudian `requireRole(...)` yang mengembalikan 403.
 */
const parentOnly = requireRole("parent", "korlas");

export const profileRoute = new Hono<AuthEnv>()
  .put("/account", requireAuth, parentOnly, profileController.updateAccount)
  .get("/students", requireAuth, parentOnly, profileController.listStudents)
  .post("/students", requireAuth, parentOnly, profileController.addStudent)
  .put("/students/:id", requireAuth, parentOnly, profileController.updateStudent)
  .delete("/students/:id", requireAuth, parentOnly, profileController.removeStudent)
  .get("/classes", requireAuth, parentOnly, profileController.classOptions);
