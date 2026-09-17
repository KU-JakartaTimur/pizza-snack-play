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
  .get("/:id", requireAuth, admin, parentController.detail)
  .post("/", requireAuth, admin, parentController.create)
  .put("/:id", requireAuth, admin, parentController.update)
  .delete("/:id", requireAuth, admin, parentController.remove)
  .post("/:id/reset-password", requireAuth, admin, parentController.resetPassword);
