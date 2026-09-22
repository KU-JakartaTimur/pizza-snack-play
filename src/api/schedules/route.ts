import { Hono } from "hono";
import { requireAuth, type AuthEnv } from "../middleware/auth";
import { requireRole } from "../middleware/role";
import { scheduleController } from "./controller";

const admin = requireRole("admin");

/**
 * Penulis jadwal: admin (semua kelas) dan korlas (kelasnya sendiri saja —
 * pembatasan kelasnya ditegakkan di controller, bukan di middleware).
 *
 * Korlas boleh menyusun jadwal kelasnya selama masih `draft` — termasuk
 * memilih menu, mengisi petugas, menambah catatan, dan Salin Sepekan — lalu
 * **mengunci (lock) dan mempublikasikannya** untuk kelasnya sendiri.
 * Lihat PRD §7.5 & F8: kunci dan publikasi = admin + korlas.
 *
 * Yang tetap khusus admin: **buka kunci** (unlock) dan penulisan baris
 * `locked`/`published` (baris tersebut tidak dapat diubah siapa pun —
 * `409 not_editable`).
 */
const scheduleWriters = requireRole("admin", "korlas");

/**
 * Jadwal — dibaca oleh semua role, dengan cakupan kelas yang dipersempit
 * sesuai role (lihat `resolveReadClass`).
 *
 * Rute statis (`/today`, `/week`, `/month`, `/status`, `/range`, `/search`,
 * `/export`, `/lock`, `/publish`) didaftarkan sebelum `/:id` agar tidak
 * tertangkap sebagai parameter ID.
 *
 * Kunci (`/lock`) dan publikasi (`/publish`):
 * - Admin dapat mengosongkan `className` (atau kirim `"*"`) untuk menerapkan
 *   operasi ke **semua kelas sekaligus** (1–6). Menu snack sama untuk semua
 *   kelas, namun klaim (pilih tanggal) tetap per-kelas — parent kelas 1
 *   yang sudah memilih tanggal tidak memblokir parent kelas 2.
 * - Korlas hanya bisa untuk kelasnya sendiri.
 */
export const schedulesRoute = new Hono<AuthEnv>()
  .get("/today", requireAuth, scheduleController.today)
  .get("/today-all", requireAuth, admin, scheduleController.todayAll)
  .get("/week", requireAuth, scheduleController.week)
  .get("/month", requireAuth, scheduleController.month)
  .get("/status", requireAuth, scheduleController.status)
  .get("/range", requireAuth, scheduleController.range)
  .get("/search", requireAuth, scheduleController.search)
  /**
   * Unduh jadwal sebagai berkas Excel (`.xlsx`) — **admin & korlas saja**.
   * Orang tua tidak butuh: jadwalnya sudah tampil di layar, dan berkasnya
   * memuat status internal (draft/terkunci) yang bukan urusannya.
   */
  .get("/export", requireAuth, scheduleWriters, scheduleController.exportSchedule)
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
