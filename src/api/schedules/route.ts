import { Hono } from "hono";
import { requireAuth, type AuthEnv } from "../middleware/auth";
import { requireRole } from "../middleware/role";
import { scheduleController } from "./controller";

const admin = requireRole("admin");

/**
 * Penulis jadwal: admin (semua kelas) dan korlas (kelasnya sendiri saja —
 * pembatasan kelasnya ditegakkan di controller, bukan di middleware).
 */
const scheduleWriters = requireRole("admin", "korlas");

/**
 * Jadwal — dibaca oleh semua role, dengan cakupan kelas yang dipersempit
 * sesuai role (lihat `resolveReadClass`).
 *
 * Rute statis (`/today`, `/week`, `/month`, `/range`, `/search`, `/lock`,
 * `/publish`) didaftarkan sebelum `/:id` agar tidak tertangkap sebagai
 * parameter ID.
 *
 * Kunci & publikasi: korlas dapat mengunci jadwal draft dan mempublikasi
 * jadwal yang sudah terkunci penuh satu bulan. Buka kunci (unlock) hanya
 * untuk admin.
 */
export const schedulesRoute = new Hono<AuthEnv>()
  .get("/today", requireAuth, scheduleController.today)
  .get("/today-all", requireAuth, admin, scheduleController.todayAll)
  .get("/week", requireAuth, scheduleController.week)
  .get("/month", requireAuth, scheduleController.month)
  .get("/range", requireAuth, scheduleController.range)
  .get("/search", requireAuth, scheduleController.search)
  .get("/:id", requireAuth, scheduleController.detail)
  .post("/", requireAuth, scheduleWriters, scheduleController.create)
  .post("/copy", requireAuth, scheduleWriters, scheduleController.copy)
  .post("/lock", requireAuth, scheduleWriters, scheduleController.lock)
  .post("/publish", requireAuth, scheduleWriters, scheduleController.publish)
  .post("/:id/unlock", requireAuth, admin, scheduleController.unlock)
  .put("/:id", requireAuth, scheduleWriters, scheduleController.update)
  .delete("/:id", requireAuth, scheduleWriters, scheduleController.remove);

export const weeksRoute = new Hono<AuthEnv>().get(
  "/",
  requireAuth,
  scheduleController.weeks,
);

export const holidaysRoute = new Hono<AuthEnv>()
  .get("/", requireAuth, scheduleController.listHolidays)
  .post("/", requireAuth, admin, scheduleController.createHoliday)
  .delete("/:id", requireAuth, admin, scheduleController.deleteHoliday);
