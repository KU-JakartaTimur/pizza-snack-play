import { and, asc, eq, gte, like, lte, or, sql } from "drizzle-orm";
import type { Db } from "../../database/db";
import {
  holidays,
  menuItems,
  menus,
  schedules,
  weeks,
} from "../../database/schema";
import type { Holiday, Schedule, Week } from "../../database/schema";
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

class ScheduleRepository {
  // ── Jadwal ──────────────────────────────────────────────────

  /** Jadwal satu kelas pada rentang tanggal, urut tanggal. */
  async findSchedulesBetween(
    db: Db,
    from: string,
    to: string,
    className: string,
  ): Promise<Schedule[]> {
    return db
      .select()
      .from(schedules)
      .where(
        and(
          eq(schedules.className, className),
          gte(schedules.scheduleDate, from),
          lte(schedules.scheduleDate, to),
        ),
      )
      .orderBy(asc(schedules.scheduleDate));
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
