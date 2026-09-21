import { Hono } from "hono";
import { requireAuth, type AuthEnv } from "../middleware/auth";
import { requireRole } from "../middleware/role";
import { profileController } from "./controller";

/**
 * Layanan mandiri orang tua — mengelola **anaknya sendiri** dari menu Profil.
 *
 * Berbeda dari `/api/parents` yang khusus admin, di sini tidak ada `parentId`
 * di request: pemilik data selalu diambil dari token, sehingga satu orang tua
 * tidak mungkin menyentuh anak milik orang tua lain. Korlas ikut diizinkan
 * karena ia juga orang tua murid.
 *
 * `requireAuth` dipasang lebih dulu agar request tanpa token mendapat 401,
 * baru kemudian `requireRole(...)` yang mengembalikan 403.
 */
const parentOnly = requireRole("parent", "korlas");

export const profileRoute = new Hono<AuthEnv>()
  .get("/students", requireAuth, parentOnly, profileController.listStudents)
  .post("/students", requireAuth, parentOnly, profileController.addStudent)
  .put("/students/:id", requireAuth, parentOnly, profileController.updateStudent)
  .delete("/students/:id", requireAuth, parentOnly, profileController.removeStudent)
  .get("/classes", requireAuth, parentOnly, profileController.classOptions);
