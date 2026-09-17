import { Hono } from "hono";
import { requireAuth, type AuthEnv } from "../middleware/auth";
import { authController } from "./controller";

const authRoute = new Hono<AuthEnv>()
  .post("/login", authController.login)
  .post("/logout", requireAuth, authController.logout)
  .get("/me", requireAuth, authController.me)
  .put("/password", requireAuth, authController.changePassword);

export default authRoute;
