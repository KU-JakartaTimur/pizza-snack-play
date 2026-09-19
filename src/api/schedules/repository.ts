import { and, asc, eq, gte, inArray, like, lte, or, sql } from "drizzle-orm";
import type { Db } from "../../database/db";
import {
  holidays,
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

/** Jumlah baris untuk satu status, dipecah per kelas. */
export interface MonthStatusByClassRow {
  className: string;
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

  /**
   * Alias eksplisit dari `findSchedulesBetween` untuk operasi sekolah-wide
   * (kunci/publikasi semua kelas). Namanya sengaja berbeda agar pemanggil
   * yang mengirim `null` terbaca jelas di kode service.
   */
  async findSchedulesBetweenAnyClass(
    db: Db,
    from: string,
    to: string,
    className: string | null,
    statusFilter?: ScheduleStatus[],
  ): Promise<Schedule[]> {
    return this.findSchedulesBetween(db, from, to, className, statusFilter);
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
      petugasParentName: string | null;
      notes: string | null;
    },
  ): Promise<Schedule> {
    const rows = await db.insert(schedules).values(values).returning();
    return rows[0];
  }

  async updateSchedule(
    db: Db,
    id: number,
    values: Partial<{
      weekId: number | null;
      menuId: number | null;
      isHoliday: number;
      petugasName: string | null;
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
      .from(schedules);
    return rows[0]?.count ?? 0;
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

  /**
   * Jumlah baris per (kelas × status) untuk satu bulan, urut nama kelas.
   *
   * Dipakai saat publikasi seluruh sekolah gagal karena masih ada `draft`:
   * pesan 409-nya bisa menyebut kelas mana saja yang belum dikunci, alih-alih
   * hanya bilang "masih ada draft" tanpa petunjuk.
   */
  async countSchedulesByStatusPerClassForMonth(
    db: Db,
    year: number,
    month: number,
    status: ScheduleStatus,
  ): Promise<MonthStatusByClassRow[]> {
    const { from, to } = monthBounds(year, month);

    return db
      .select({
        className: schedules.className,
        status: schedules.status,
        count: sql<number>`count(*)`,
      })
      .from(schedules)
      .where(
        and(
          eq(schedules.status, status),
          gte(schedules.scheduleDate, from),
          lte(schedules.scheduleDate, to),
        ),
      )
      .groupBy(schedules.className)
      .orderBy(asc(schedules.className));
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
}

export const scheduleRepository = new ScheduleRepository();
