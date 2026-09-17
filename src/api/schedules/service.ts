import type { Db } from "../../database/db";
import type { Holiday, Schedule, Week } from "../../database/schema";
import type { MenuDto } from "../../types/catalog";
import type {
  MonthScheduleDto,
  ScheduleDayDto,
  ScheduleInput,
  TodayScheduleDto,
  WeekDto,
  WeekScheduleDto,
} from "../../types/schedule";
import { catalogRepository } from "../catalog/repository";
import {
  addDays,
  dayOfWeek,
  endOfWeek,
  formatWeekLabel,
  indonesianDayName,
  indonesianMonthName,
  monthRange,
  startOfWeek,
  todayInWib,
} from "../utils/date";
import { scheduleRepository } from "./repository";

export type ScheduleError = "not_found" | "duplicate_date" | "menu_not_found";

/** Data pendukung yang dimuat sekali untuk sebuah rentang tanggal. */
interface ScheduleContext {
  schedulesByDate: Map<string, Schedule>;
  holidaysByDate: Map<string, Holiday>;
  weeksByStart: Map<string, Week>;
  menusById: Map<number, MenuDto>;
  today: string;
}

function toWeekDto(week: Week): WeekDto {
  return {
    id: week.id,
    weekStartDate: week.weekStartDate,
    weekEndDate: week.weekEndDate,
    month: week.month,
    year: week.year,
    label: week.label,
  };
}

class ScheduleService {
  /**
   * Muat semua data yang dibutuhkan untuk merender satu rentang tanggal
   * dalam 4 query — menghindari N+1 saat menampilkan jadwal sebulan.
   */
  private async loadContext(
    db: Db,
    from: string,
    to: string,
  ): Promise<ScheduleContext> {
    const [scheduleRows, holidayRows, weekRows] = await Promise.all([
      scheduleRepository.findSchedulesBetween(db, from, to),
      scheduleRepository.findHolidaysBetween(db, from, to),
      scheduleRepository.findWeeksOverlapping(db, from, to),
    ]);

    const menusById = await catalogRepository.loadMenusByIds(
      db,
      scheduleRows
        .map((row) => row.menuId)
        .filter((id): id is number => id !== null),
    );

    return {
      schedulesByDate: new Map(scheduleRows.map((row) => [row.scheduleDate, row])),
      holidaysByDate: new Map(holidayRows.map((row) => [row.date, row])),
      weeksByStart: new Map(weekRows.map((row) => [row.weekStartDate, row])),
      menusById,
      today: todayInWib(),
    };
  }

  private buildDay(date: string, ctx: ScheduleContext): ScheduleDayDto {
    const schedule = ctx.schedulesByDate.get(date);
    const holiday = ctx.holidaysByDate.get(date);

    const isHoliday = schedule?.isHoliday === 1 || Boolean(holiday);

    return {
      date,
      dayOfWeek: dayOfWeek(date),
      dayName: indonesianDayName(date),
      isToday: date === ctx.today,
      isHoliday,
      holidayName: holiday?.name ?? null,
      notes: schedule?.notes ?? null,
      scheduleId: schedule?.id ?? null,
      menu: isHoliday
        ? null
        : ((schedule?.menuId ? ctx.menusById.get(schedule.menuId) : null) ?? null),
    };
  }

  /** Senin–Jumat untuk minggu yang dimulai pada `weekStart`. */
  private buildWeek(weekStart: string, ctx: ScheduleContext): WeekScheduleDto {
    const weekEnd = endOfWeek(weekStart);
    const week = ctx.weeksByStart.get(weekStart);

    return {
      week: week ? toWeekDto(week) : null,
      startDate: weekStart,
      endDate: weekEnd,
      label: formatWeekLabel(weekStart, weekEnd),
      days: [0, 1, 2, 3, 4].map((offset) =>
        this.buildDay(addDays(weekStart, offset), ctx),
      ),
    };
  }

  // ── Pembacaan ───────────────────────────────────────────────

  async getToday(db: Db): Promise<TodayScheduleDto> {
    const today = todayInWib();
    const weekStart = startOfWeek(today);
    const ctx = await this.loadContext(db, weekStart, endOfWeek(today));

    return {
      day: this.buildDay(today, ctx),
      week: this.buildWeek(weekStart, ctx),
    };
  }

  /** Jadwal mingguan. `date` opsional — default hari ini (WIB). */
  async getWeek(db: Db, date?: string): Promise<WeekScheduleDto> {
    const anchor = date ?? todayInWib();
    const weekStart = startOfWeek(anchor);
    const weekEnd = endOfWeek(anchor);
    const ctx = await this.loadContext(db, weekStart, weekEnd);

    return this.buildWeek(weekStart, ctx);
  }

  /**
   * Jadwal bulanan, dikelompokkan per minggu (Senin–Jumat) seperti
   * struktur dokumen sumber.
   */
  async getMonth(db: Db, year: number, month: number): Promise<MonthScheduleDto> {
    const { start, end } = monthRange(year, month);

    const weekStarts: string[] = [];
    for (let cursor = startOfWeek(start); cursor <= end; cursor = addDays(cursor, 7)) {
      weekStarts.push(cursor);
    }

    const from = weekStarts[0] ?? start;
    const to = addDays(weekStarts[weekStarts.length - 1] ?? start, 4);
    const ctx = await this.loadContext(db, from, to);

    return {
      year,
      month,
      monthName: indonesianMonthName(month),
      weeks: weekStarts.map((weekStart) => this.buildWeek(weekStart, ctx)),
    };
  }

  /** Jadwal pada rentang bebas. Maksimum 92 hari untuk membatasi beban query. */
  async getRange(db: Db, from: string, to: string): Promise<ScheduleDayDto[]> {
    const ctx = await this.loadContext(db, from, to);
    const days: ScheduleDayDto[] = [];

    for (let cursor = from; cursor <= to; cursor = addDays(cursor, 1)) {
      days.push(this.buildDay(cursor, ctx));
    }

    return days;
  }

  async getById(db: Db, id: number): Promise<ScheduleDayDto | null> {
    const schedule = await scheduleRepository.findScheduleById(db, id);
    if (!schedule) return null;

    const ctx = await this.loadContext(
      db,
      schedule.scheduleDate,
      schedule.scheduleDate,
    );
    return this.buildDay(schedule.scheduleDate, ctx);
  }

  async listWeeks(db: Db, year: number, month: number): Promise<WeekDto[]> {
    const rows = await scheduleRepository.listWeeksByMonth(db, year, month);
    return rows.map(toWeekDto);
  }

  async listHolidays(db: Db, from: string, to: string): Promise<Holiday[]> {
    return scheduleRepository.findHolidaysBetween(db, from, to);
  }

  // ── Penulisan (admin) ───────────────────────────────────────

  async createSchedule(
    db: Db,
    input: ScheduleInput,
  ): Promise<ScheduleDayDto | ScheduleError> {
    const existing = await scheduleRepository.findScheduleByDate(
      db,
      input.scheduleDate,
    );
    if (existing) return "duplicate_date";

    if (input.menuId != null) {
      const menu = await catalogRepository.findMenuById(db, input.menuId);
      if (!menu) return "menu_not_found";
    }

    const week = await scheduleRepository.ensureWeek(db, input.scheduleDate);

    const created = await scheduleRepository.insertSchedule(db, {
      weekId: week.id,
      scheduleDate: input.scheduleDate,
      dayOfWeek: dayOfWeek(input.scheduleDate),
      menuId: input.isHoliday ? null : (input.menuId ?? null),
      isHoliday: input.isHoliday ? 1 : 0,
      notes: input.notes ?? null,
    });

    return (await this.getById(db, created.id))!;
  }

  async updateSchedule(
    db: Db,
    id: number,
    input: Partial<Omit<ScheduleInput, "scheduleDate">>,
  ): Promise<ScheduleDayDto | ScheduleError> {
    const current = await scheduleRepository.findScheduleById(db, id);
    if (!current) return "not_found";

    if (input.menuId != null) {
      const menu = await catalogRepository.findMenuById(db, input.menuId);
      if (!menu) return "menu_not_found";
    }

    const isHoliday = input.isHoliday;

    await scheduleRepository.updateSchedule(db, id, {
      ...(input.menuId !== undefined ? { menuId: input.menuId } : {}),
      ...(isHoliday !== undefined ? { isHoliday: isHoliday ? 1 : 0 } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      // Hari libur tidak menyimpan menu.
      ...(isHoliday ? { menuId: null } : {}),
    });

    return (await this.getById(db, id))!;
  }

  async deleteSchedule(db: Db, id: number): Promise<boolean> {
    const current = await scheduleRepository.findScheduleById(db, id);
    if (!current) return false;

    await scheduleRepository.deleteSchedule(db, id);
    return true;
  }

  async createHoliday(
    db: Db,
    input: { date: string; name: string; description?: string | null },
  ): Promise<Holiday | "duplicate_date"> {
    const existing = await scheduleRepository.findHolidayByDate(db, input.date);
    if (existing) return "duplicate_date";

    return scheduleRepository.insertHoliday(db, {
      date: input.date,
      name: input.name.trim(),
      description: input.description ?? null,
    });
  }

  async deleteHoliday(db: Db, id: number): Promise<boolean> {
    const rows = await scheduleRepository.findHolidaysBetween(db, "0000-01-01", "9999-12-31");
    if (!rows.some((row) => row.id === id)) return false;

    await scheduleRepository.deleteHoliday(db, id);
    return true;
  }
}

export const scheduleService = new ScheduleService();
