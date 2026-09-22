import { Hono } from "hono";
import { requireAuth, type AuthEnv } from "../middleware/auth";
import { requireRole } from "../middleware/role";
import { authController } from "./controller";

const authRoute = new Hono<AuthEnv>()
  .post("/login", authController.login)
  // "Login as" membuka sesi orang lain tanpa password — wajib admin, dan
  // tetap lewat `requireAuth` lebih dulu agar request tanpa token dapat 401.
  .post(
    "/impersonate",
    requireAuth,
    requireRole("admin"),
    authController.impersonate,
  )
  .post("/logout", requireAuth, authController.logout)
  .get("/me", requireAuth, authController.me)
  .put("/password", requireAuth, authController.changePassword);

export default authRoute;
