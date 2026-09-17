import { Hono } from "hono";
import { requireAuth, type AuthEnv } from "../middleware/auth";
import { requireRole } from "../middleware/role";
import { statsController } from "./controller";

/** Statistik dashboard — khusus admin. */
export const statsRoute = new Hono<AuthEnv>().get(
  "/summary",
  requireAuth,
  requireRole("admin"),
  statsController.summary,
);
