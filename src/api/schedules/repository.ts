import { and, asc, eq, gte, inArray, like, lte, or, sql, type SQL } from "drizzle-orm";
import type { Db } from "../../database/db";
import {
  holidays,
  importLogs,
  menuItems,
  menus,
  schedules,
  weeks,
} from "../../database/schema";
import type { Holiday, Schedule, Week } from "../../database/schema";
import type { ScheduleStatus } from "../../types/schedule";
import { endOfWeek, monthOf, startOfWeek, yearOf } from "../utils/date";
import { likePattern } from "../utils/sql";

/** Baris mentah hasil pencarian riwayat menu. */
export interface MenuHistoryRow {
  scheduleDate: string;
  menuId: number;
  menuName: string;
  itemName: string | null;
  itemType: string | null;
  notes: string | null;
}

/** Ringkasan status jadwal untuk satu bulan + kelas. */
export interface MonthStatusRow {
  status: string;
  count: number;
}

/**
 * Rentang tanggal satu bulan penuh sebagai string ISO.
 * Dipakai untuk kunci & publikasi; batas atas selalu `31` karena
 * perbandingan tanggal dilakukan sebagai teks (`YYYY-MM-DD`), sehingga
 * `2026-02-31` tetap menangkap seluruh hari di bulan Februari.
 */
function monthBounds(year: number, month: number): { from: string; to: string } {
  const mm = String(month).padStart(2, "0");
  return { from: `${year}-${mm}-01`, to: `${year}-${mm}-31` };
}

/**
 * Jumlah pernyataan per `db.batch()` saat menyisipkan baris jadwal.
 *
 * D1 membatasi **100 nilai terikat per pernyataan** — terbukti saat mengimpor
 * 132 baris dalam satu `INSERT`: `D1_ERROR: too many SQL variables`. Karena
 * satu baris jadwal mengikat sampai 8 nilai, satu pernyataan hanya boleh
 * memuat belasan baris. Menyisipkan satu baris per pernyataan lalu
 * mengirimkannya lewat `db.batch()` jauh lebih mudah dipercaya: tiap
 * pernyataan hanya 8 nilai, dan batch-nya atomik.
 */
const MAX_STATEMENTS_PER_BATCH = 40;

class ScheduleRepository {
  // ── Jadwal ──────────────────────────────────────────────────

  /**
   * Jadwal pada rentang tanggal, urut tanggal.
   *
   * `className` diisi → hanya kelas itu. `className` `null` → **semua kelas**,
   * yaitu baris-baris yang dikunci/dipublikasi sekaligus oleh admin.
   * `statusFilter` opsional — bila diisi, hanya baris dengan status
   * tersebut yang dikembalikan (dipakai untuk membatasi orang tua
   * ke 'published' saja).
   */
  async findSchedulesBetween(
    db: Db,
    from: string,
    to: string,
    className: string | null,
    statusFilter?: ScheduleStatus[],
  ): Promise<Schedule[]> {
    const conditions = [
      ...(className ? [eq(schedules.className, className)] : []),
      gte(schedules.scheduleDate, from),
      lte(schedules.scheduleDate, to),
    ];

    if (statusFilter && statusFilter.length > 0) {
      conditions.push(inArray(schedules.status, statusFilter));
    }

    return db
      .select()
      .from(schedules)
      .where(and(...conditions))
      .orderBy(asc(schedules.scheduleDate), asc(schedules.className));
  }

  /** Baris jadwal satu kelas pada satu tanggal. */
  async findScheduleByDate(
    db: Db,
    date: string,
    className: string,
  ): Promise<Schedule | undefined> {
    const rows = await db
      .select()
      .from(schedules)
      .where(
        and(
          eq(schedules.scheduleDate, date),
          eq(schedules.className, className),
        ),
      )
      .limit(1);
    return rows[0];
  }

  /**
   * Semua baris jadwal pada satu tanggal, lintas kelas.
   * Dipakai statistik dashboard yang merangkum seluruh sekolah.
   */
  async findSchedulesByDate(db: Db, date: string): Promise<Schedule[]> {
    return db
      .select()
      .from(schedules)
      .where(eq(schedules.scheduleDate, date))
      .orderBy(asc(schedules.className));
  }

  async findScheduleById(db: Db, id: number): Promise<Schedule | undefined> {
    const rows = await db
      .select()
      .from(schedules)
      .where(eq(schedules.id, id))
      .limit(1);
    return rows[0];
  }

  async insertSchedule(
    db: Db,
    values: {
      weekId: number | null;
      scheduleDate: string;
      dayOfWeek: number;
      className: string;
      menuId: number | null;
      isHoliday: number;
      petugasName: string | null;
      petugasStudentId: number | null;
      petugasParentId: number | null;
      petugasParentName: string | null;
      notes: string | null;
    },
  ): Promise<Schedule> {
    const rows = await db.insert(schedules).values(values).returning();
    return rows[0];
  }

  /**
   * Sisipkan banyak baris jadwal sekaligus.
   *
   * Dipakai impor teks, yang bisa menghasilkan ratusan baris (mis. 22 tanggal
   * × 6 kelas = 132). Dua hal yang membuatnya tidak boleh naif:
   *
   *  1. **Tidak bisa satu `INSERT` besar.** D1 membatasi 100 nilai terikat per
   *     pernyataan, sementara 132 baris mengikat ~1.000 nilai →
   *     `D1_ERROR: too many SQL variables`. Jadi satu baris = satu pernyataan.
   *  2. **Harus atomik.** Impor separuh jalan meninggalkan jadwal yang
   *     setengah jadi. `db.batch()` menjalankan seluruh pernyataannya dalam
   *     satu transaksi, dan itulah cara D1 yang dianjurkan (lihat catatan
   *     "Transaksi D1" di README).
   *
   * Menu yang dirujuk baris-baris ini tetap dibuat di luar batch (id-nya harus
   * ada lebih dulu), sehingga pemanggil masih perlu membersihkannya bila
   * penyisipan ini gagal.
   */
  async insertSchedules(
    db: Db,
    values: Array<{
      weekId: number | null;
      scheduleDate: string;
      dayOfWeek: number;
      className: string;
      menuId: number | null;
      isHoliday: number;
      notes: string | null;
      status?: ScheduleStatus;
    }>,
  ): Promise<void> {
    for (let start = 0; start < values.length; start += MAX_STATEMENTS_PER_BATCH) {
      const chunk = values.slice(start, start + MAX_STATEMENTS_PER_BATCH);
      const statements = chunk.map((row) => db.insert(schedules).values(row));
      // `batch()` menuntut tuple tak-kosong; `chunk` sudah dipastikan berisi.
      await db.batch(
        statements as unknown as Parameters<typeof db.batch>[0],
      );
    }
  }

  /**
   * Kunci `"<tanggal>|<kelas>"` untuk baris yang **sudah ada** pada rentang
   * dan kelas yang diberikan.
   *
   * Sengaja hanya mengembalikan kunci, bukan baris utuh: impor cuma perlu tahu
   * pasangan mana yang sudah terisi supaya bisa melewatinya, dan mengangkut
   * seluruh kolom untuk 132 baris hanya membebani tanpa dipakai.
   */
  async findOccupiedDateClassKeys(
    db: Db,
    from: string,
    to: string,
    classNames: string[],
  ): Promise<Set<string>> {
    if (classNames.length === 0) return new Set();

    const rows = await db
      .select({
        scheduleDate: schedules.scheduleDate,
        className: schedules.className,
      })
      .from(schedules)
      .where(
        and(
          gte(schedules.scheduleDate, from),
          lte(schedules.scheduleDate, to),
          inArray(schedules.className, classNames),
        ),
      );

    return new Set(rows.map((row) => `${row.scheduleDate}|${row.className}`));
  }

  async updateSchedule(
    db: Db,
    id: number,
    values: Partial<{
      weekId: number | null;
      menuId: number | null;
      isHoliday: number;
      petugasName: string | null;
      petugasStudentId: number | null;
      petugasParentId: number | null;
      petugasParentName: string | null;
      notes: string | null;
    }>,
  ): Promise<Schedule | undefined> {
    const rows = await db
      .update(schedules)
      .set({ ...values, updatedAt: sql`(datetime('now'))` })
      .where(eq(schedules.id, id))
      .returning();
    return rows[0];
  }

  async deleteSchedule(db: Db, id: number): Promise<void> {
    await db.delete(schedules).where(eq(schedules.id, id));
  }

  async countSchedules(db: Db): Promise<number> {
    const rows = await db
      .select({ count: sql<number>`count(*)` })
      .from(schedules);    return rows[0]?.count ?? 0;
  }

  // ── Kunci & Publikasi ───────────────────────────────────────

  /**
   * Kunci semua jadwal draft pada rentang tanggal.
   *
   * `className` diisi → hanya kelas itu (korlas / admin per kelas).
   * `className` `null` → **semua kelas sekaligus** (admin, satu klik untuk
   * seluruh sekolah). Baris yang sudah 'locked' atau 'published' dilewati.
   * Mengembalikan jumlah baris yang dikunci.
   */
  async lockDraftSchedulesBetween(
    db: Db,
    from: string,
    to: string,
    className: string | null,
    userId: number,
  ): Promise<number> {
    const rows = await db
      .update(schedules)
      .set({
        status: "locked",
        lockedBy: userId,
        lockedAt: sql`(datetime('now'))`,
        updatedAt: sql`(datetime('now'))`,
      })
      .where(
        and(
          ...(className ? [eq(schedules.className, className)] : []),
          eq(schedules.status, "draft"),
          gte(schedules.scheduleDate, from),
          lte(schedules.scheduleDate, to),
        ),
      )
      .returning({ id: schedules.id });

    return rows.length;
  }

  /**
   * Publikasi semua jadwal locked untuk satu bulan.
   *
   * `className` diisi → hanya kelas itu; `null` → seluruh sekolah.
   * Mengembalikan jumlah baris yang dipublikasi.
   */
  async publishLockedSchedulesForMonth(
    db: Db,
    year: number,
    month: number,
    className: string | null,
    userId: number,
  ): Promise<number> {
    const { from, to } = monthBounds(year, month);

    const rows = await db
      .update(schedules)
      .set({
        status: "published",
        publishedBy: userId,
        publishedAt: sql`(datetime('now'))`,
        updatedAt: sql`(datetime('now'))`,
      })
      .where(
        and(
          ...(className ? [eq(schedules.className, className)] : []),
          eq(schedules.status, "locked"),
          gte(schedules.scheduleDate, from),
          lte(schedules.scheduleDate, to),
        ),
      )
      .returning({ id: schedules.id });

    return rows.length;
  }

  /**
   * Hitung jumlah baris per status untuk satu bulan.
   *
   * `className` diisi → hanya kelas itu; `null` → seluruh sekolah.
   * Dipakai untuk menentukan apakah publikasi sudah bisa dilakukan
   * (semua baris harus 'locked', tidak boleh ada 'draft').
   */
  async countSchedulesByStatusForMonth(
    db: Db,
    year: number,
    month: number,
    className: string | null,
  ): Promise<MonthStatusRow[]> {
    const { from, to } = monthBounds(year, month);

    return db
      .select({
        status: schedules.status,
        count: sql<number>`count(*)`,
      })
      .from(schedules)
      .where(
        and(
          ...(className ? [eq(schedules.className, className)] : []),
          gte(schedules.scheduleDate, from),
          lte(schedules.scheduleDate, to),
        ),
      )
      .groupBy(schedules.status);
  }

  // ── Ringkasan status lintas kelas ───────────────────────────

  /**
   * Hitung jumlah baris per (kelas, status) untuk satu bulan, **semua kelas**.
   *
   * Dipakai oleh ringkasan status sekolah: admin perlu tahu kelas mana yang
   * masih menyisakan draft sebelum publikasi serentak, dan kelas mana yang
   * sudah terkunci/dipublikasi. Satu query menggantikan pemuatan jadwal
   * penuh per kelas (pola 1+N).
   *
   * Catatan: mengembalikan hanya kelas yang **punya** baris jadwal bulan ini.
   * Kelas tanpa jadwal tidak muncul — pemanggil menggabungkannya dengan
   * daftar kelas aktif bila perlu menampilkan angka nol.
   */
  async countSchedulesByClassForMonth(
    db: Db,
    year: number,
    month: number,
  ): Promise<Array<{ className: string; status: ScheduleStatus; count: number }>> {
    const { from, to } = monthBounds(year, month);

    const rows = await db
      .select({
        className: schedules.className,
        status: schedules.status,
        count: sql<number>`count(*)`,
      })
      .from(schedules)
      .where(
        and(gte(schedules.scheduleDate, from), lte(schedules.scheduleDate, to)),
      )
      .groupBy(schedules.className, schedules.status);

    return rows.map((row) => ({
      className: row.className,
      status: row.status as ScheduleStatus,
      count: Number(row.count),
    }));
  }

  /**
   * Buka kunci satu baris jadwal — kembalikan ke 'draft'.
   * Hanya admin yang boleh melakukan ini.
   */
  async unlockSchedule(db: Db, id: number): Promise<Schedule | undefined> {
    const rows = await db
      .update(schedules)
      .set({
        status: "draft",
        lockedBy: null,
        lockedAt: null,
        publishedBy: null,
        publishedAt: null,
        updatedAt: sql`(datetime('now'))`,
      })
      .where(eq(schedules.id, id))
      .returning();
    return rows[0];
  }

  // ── Aksi massal atas baris terpilih ─────────────────────────

  /**
   * Baris jadwal berdasarkan daftar id.
   *
   * Daftar kosong sengaja dipintas: `IN ()` bukan SQL yang valid, jadi
   * pemanggil tidak perlu menjaga kasus itu sendiri.
   */
  async findSchedulesByIds(db: Db, ids: number[]): Promise<Schedule[]> {
    if (ids.length === 0) return [];

    return db.select().from(schedules).where(inArray(schedules.id, ids));
  }

  /**
   * Kunci baris-baris terpilih yang masih `draft`.
   *
   * Syarat statusnya ikut masuk ke `WHERE`, bukan diperiksa di aplikasi:
   * dengan begitu baris yang berubah status di antara pembacaan dan
   * penulisan tetap tidak ikut tersentuh. Mengembalikan jumlah baris
   * yang benar-benar berubah.
   */
  async lockDraftSchedulesByIds(
    db: Db,
    ids: number[],
    userId: number,
  ): Promise<number> {
    return this.setStatusByIds(db, ids, ["draft"], {
      status: "locked",
      lockedBy: userId,
      lockedAt: sql`(datetime('now'))`,
    });
  }

  /** Publikasi baris-baris terpilih yang sudah `locked`. */
  async publishLockedSchedulesByIds(
    db: Db,
    ids: number[],
    userId: number,
  ): Promise<number> {
    return this.setStatusByIds(db, ids, ["locked"], {
      status: "published",
      publishedBy: userId,
      publishedAt: sql`(datetime('now'))`,
    });
  }

  /**
   * Buka kunci baris-baris terpilih — `locked` maupun `published` kembali
   * ke `draft`, seluruh jejak kunci/publikasi dihapus.
   */
  async unlockSchedulesByIds(db: Db, ids: number[]): Promise<number> {
    return this.setStatusByIds(db, ids, ["locked", "published"], {
      status: "draft",
      lockedBy: null,
      lockedAt: null,
      publishedBy: null,
      publishedAt: null,
    });
  }

  /**
   * Satu tempat untuk semua perpindahan status massal: `WHERE id IN (…) AND
   * status IN (…)` plus stempel waktu. `from` adalah status yang **boleh**
   * berubah — sisanya dilewati diam-diam, sesuai janji aksi massal yang
   * melaporkan `skipped` alih-alih gagal seluruhnya.
   */
  private async setStatusByIds(
    db: Db,
    ids: number[],
    from: ScheduleStatus[],
    to: Partial<{
      status: ScheduleStatus;
      lockedBy: number | null;
      lockedAt: SQL | null;
      publishedBy: number | null;
      publishedAt: SQL | null;
    }>,
  ): Promise<number> {
    if (ids.length === 0) return 0;

    const rows = await db
      .update(schedules)
      .set({ ...to, updatedAt: sql`(datetime('now'))` })
      .where(and(inArray(schedules.id, ids), inArray(schedules.status, from)))
      .returning({ id: schedules.id });

    return rows.length;
  }

  /**
   * Cari tanggal di mana sebuah menu atau komponennya pernah dijadwalkan.
   *
   * Mengembalikan satu baris per (jadwal × komponen yang cocok), sehingga
   * pemanggil dapat mengelompokkannya per tanggal. Hari libur dikecualikan.
   */
  async searchMenuHistory(
    db: Db,
    query: string,
    from: string,
    to: string,
    className: string,
  ): Promise<MenuHistoryRow[]> {
    const term = likePattern(query);

    return db
      .select({
        scheduleDate: schedules.scheduleDate,
        menuId: menus.id,
        menuName: menus.name,
        itemName: menuItems.name,
        itemType: menuItems.itemType,
        notes: schedules.notes,
      })
      .from(schedules)
      .innerJoin(menus, eq(schedules.menuId, menus.id))
      .leftJoin(menuItems, eq(menuItems.menuId, menus.id))
      .where(
        and(
          eq(schedules.className, className),
          eq(schedules.isHoliday, 0),
          gte(schedules.scheduleDate, from),
          lte(schedules.scheduleDate, to),
          or(like(menus.name, term), like(menuItems.name, term)),
        ),
      )
      .orderBy(asc(schedules.scheduleDate), asc(menuItems.id));
  }

  // ── Minggu ──────────────────────────────────────────────────

  /** Minggu yang rentangnya bersinggungan dengan `from`–`to`. */
  async findWeeksOverlapping(
    db: Db,
    from: string,
    to: string,
  ): Promise<Week[]> {
    return db
      .select()
      .from(weeks)
      .where(
        and(lte(weeks.weekStartDate, to), gte(weeks.weekEndDate, from)),
      )
      .orderBy(asc(weeks.weekStartDate));
  }

  async findWeekByRange(
    db: Db,
    start: string,
    end: string,
  ): Promise<Week | undefined> {
    const rows = await db
      .select()
      .from(weeks)
      .where(and(eq(weeks.weekStartDate, start), eq(weeks.weekEndDate, end)))
      .limit(1);
    return rows[0];
  }

  async findWeekById(db: Db, id: number): Promise<Week | undefined> {
    const rows = await db.select().from(weeks).where(eq(weeks.id, id)).limit(1);
    return rows[0];
  }

  async listWeeksByMonth(db: Db, year: number, month: number): Promise<Week[]> {
    return db
      .select()
      .from(weeks)
      .where(and(eq(weeks.year, year), eq(weeks.month, month)))
      .orderBy(asc(weeks.weekStartDate));
  }

  async insertWeek(
    db: Db,
    values: {
      weekStartDate: string;
      weekEndDate: string;
      month: number;
      year: number;
      label: string | null;
    },
  ): Promise<Week> {
    const rows = await db.insert(weeks).values(values).returning();
    return rows[0];
  }

  /**
   * Ambil baris `weeks` untuk minggu yang memuat `date`, buat bila belum ada.
   * `label` sengaja dibiarkan null — label diturunkan saat pembacaan
   * (`formatWeekLabel`) agar konsisten dengan dokumen sumber.
   */
  async ensureWeek(db: Db, date: string): Promise<Week> {
    const start = startOfWeek(date);
    const end = endOfWeek(date);

    const existing = await this.findWeekByRange(db, start, end);
    if (existing) return existing;

    return this.insertWeek(db, {
      weekStartDate: start,
      weekEndDate: end,
      month: monthOf(start),
      year: yearOf(start),
      label: null,
    });
  }

  // ── Hari libur ──────────────────────────────────────────────

  async findHolidaysBetween(
    db: Db,
    from: string,
    to: string,
  ): Promise<Holiday[]> {
    return db
      .select()
      .from(holidays)
      .where(and(gte(holidays.date, from), lte(holidays.date, to)))
      .orderBy(asc(holidays.date));
  }

  async findHolidayByDate(
    db: Db,
    date: string,
  ): Promise<Holiday | undefined> {
    const rows = await db
      .select()
      .from(holidays)
      .where(eq(holidays.date, date))
      .limit(1);
    return rows[0];
  }

  async insertHoliday(
    db: Db,
    values: { date: string; name: string; description?: string | null },
  ): Promise<Holiday> {
    const rows = await db.insert(holidays).values(values).returning();
    return rows[0];
  }

  async deleteHoliday(db: Db, id: number): Promise<void> {
    await db.delete(holidays).where(eq(holidays.id, id));
  }

  async countHolidays(db: Db): Promise<number> {
    const rows = await db.select({ count: sql<number>`count(*)` }).from(holidays);
    return rows[0]?.count ?? 0;
  }

  // ── Catatan impor ───────────────────────────────────────────

  /**
   * Catat satu impor teks ke `import_logs`.
   *
   * Tabel `import_logs` sudah ada sejak skema awal dengan maksud persis ini
   * ("audit trail impor data dari file teks manual") tetapi belum pernah
   * dipakai; impor jadwal adalah konsumen pertamanya. Diletakkan di
   * repository ini karena jadwal satu-satunya yang mengimpor teks — kalau
   * nanti ada impor lain, method ini yang paling wajar dipindahkan.
   */
  async insertImportLog(
    db: Db,
    values: {
      sourceFile: string;
      recordsAdded: number;
      status: "success" | "partial" | "failed";
      errorMessage: string | null;
    },
  ): Promise<void> {
    await db.insert(importLogs).values(values);
  }
}

export const scheduleRepository = new ScheduleRepository();
