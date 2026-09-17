import { Hono } from "hono";
import { requireAuth, type AuthEnv } from "../middleware/auth";
import { requireRole } from "../middleware/role";
import { scheduleController } from "./controller";

const admin = requireRole("admin");

/**
 * Jadwal — dibaca oleh admin maupun orang tua.
 * Perubahan data hanya untuk admin.
 *
 * Rute statis (`/today`, `/week`, `/month`, `/range`) didaftarkan sebelum
 * `/:id` agar tidak tertangkap sebagai parameter ID.
 */
export const schedulesRoute = new Hono<AuthEnv>()
  .get("/today", requireAuth, scheduleController.today)
  .get("/week", requireAuth, scheduleController.week)
  .get("/month", requireAuth, scheduleController.month)
  .get("/range", requireAuth, scheduleController.range)
  .get("/:id", requireAuth, scheduleController.detail)
  .post("/", requireAuth, admin, scheduleController.create)
  .put("/:id", requireAuth, admin, scheduleController.update)
  .delete("/:id", requireAuth, admin, scheduleController.remove);

export const weeksRoute = new Hono<AuthEnv>().get(
  "/",
  requireAuth,
  scheduleController.weeks,
);

export const holidaysRoute = new Hono<AuthEnv>()
  .get("/", requireAuth, scheduleController.listHolidays)
  .post("/", requireAuth, admin, scheduleController.createHoliday)
  .delete("/:id", requireAuth, admin, scheduleController.deleteHoliday);
