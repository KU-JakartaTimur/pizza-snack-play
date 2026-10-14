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
 * `/petugas`, `/export`, `/lock`, `/publish`, `/bulk/*`) didaftarkan sebelum
 * `/:id` agar tidak tertangkap sebagai parameter ID.
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
   * Petugas piket semua kelas pada satu rentang tanggal.
   *
   * Berbeda dari rute baca lain yang selalu dipersempit ke satu kelas
   * (`resolveReadClass`), rute ini memang **lintas kelas**: menu snack sama
   * untuk semua kelas pada satu tanggal, jadi orang tua perlu tahu siapa yang
   * piket di kelas 2, 3, dan seterusnya. Yang dibatasi bukan kelasnya,
   * melainkan isinya — hanya baris `published` bukan libur, dan hanya nama
   * petugas. Karena itu tidak ada middleware peran tambahan: admin pun tidak
   * melihat apa pun yang tidak boleh dilihat orang tua di sini.
   */
  .get("/petugas", requireAuth, scheduleController.classPetugas)
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
  /**
   * Aksi massal atas baris jadwal yang dicentang di tabel (`{ ids }`).
   *
   * Didaftarkan **sebelum** `/:id/unlock` supaya `/bulk/unlock` tidak
   * tertangkap sebagai `:id = "bulk"`.
   *
   * Wewenangnya sama dengan padanannya yang berbasis rentang: kunci &
   * publikasi untuk admin + korlas (korlas hanya baris kelasnya — ditegakkan
   * di controller), buka kunci khusus admin.
   */
  .post("/bulk/lock", requireAuth, scheduleWriters, scheduleController.bulkLock)
  .post(
    "/bulk/publish",
    requireAuth,
    scheduleWriters,
    scheduleController.bulkPublish,
  )
  .post("/bulk/unlock", requireAuth, admin, scheduleController.bulkUnlock)
  /**
   * Impor jadwal dari teks yang ditempel sekolah (`{ text }`).
   *
   * Didaftarkan sebagai rute statis sebelum `/:id/unlock` agar `/import`
   * tidak tertangkap sebagai `:id = "import"`. Wewenangnya sama dengan
   * penyusun jadwal lain: admin (semua kelas) + korlas (kelasnya sendiri).
   * Baris yang sudah ada dilewati, dan baris baru berstatus `draft`.
   */
  .post("/import", requireAuth, scheduleWriters, scheduleController.importSchedule)
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
