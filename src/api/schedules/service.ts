import type { Db } from "../../database/db";
import type { Holiday, Schedule, Week } from "../../database/schema";
import type { MenuDto, MenuItemType } from "../../types/catalog";
import type { Role } from "../../types/auth";
import type { ScheduleClaimSummaryDto } from "../../types/claim";
import type {
  CopyWeekInput,
  CopyWeekResultDto,
  LockScheduleInput,
  LockScheduleResultDto,
  MenuHistoryDto,
  MenuHistoryMatchDto,
  MonthScheduleDto,
  PublishScheduleInput,
  PublishScheduleResultDto,
  ScheduleDayDto,
  ScheduleInput,
  ScheduleStatus,
  TodayAllClassesDto,
  TodayScheduleDto,
  WeekDto,
  WeekScheduleDto,
} from "../../types/schedule";
import { catalogRepository } from "../catalog/repository";
import { claimService } from "../claims/service";
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
import { classRepository } from "../classes/repository";
import { scheduleRepository } from "./repository";

export type ScheduleError =
  | "not_found"
  | "duplicate_date"
  | "menu_not_found"
  | "same_week"
  | "forbidden_class"
  | "not_editable"
  | "drafts_remaining";

/** Data pendukung yang dimuat sekali untuk sebuah rentang tanggal. */
interface ScheduleContext {
  /** Kelas yang sedang dilihat; `null` bila user belum punya kelas sama sekali. */
  className: string | null;
  schedulesByDate: Map<string, Schedule>;
  holidaysByDate: Map<string, Holiday>;
  weeksByStart: Map<string, Week>;
  menusById: Map<number, MenuDto>;
  claimsByScheduleId: Map<number, ScheduleClaimSummaryDto>;
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
   *
   * `className` menentukan kelas yang dibaca; `null` berarti user belum
   * punya kelas, sehingga jadwalnya dikosongkan tanpa menyentuh database.
   */
  private async loadContext(
    db: Db,
    from: string,
    to: string,
    className: string | null,
    statusFilter?: ScheduleStatus[],
  ): Promise<ScheduleContext> {
    const [scheduleRows, holidayRows, weekRows] = await Promise.all([
      className
        ? scheduleRepository.findSchedulesBetween(db, from, to, className, statusFilter)
        : Promise.resolve<Schedule[]>([]),
      scheduleRepository.findHolidaysBetween(db, from, to),
      scheduleRepository.findWeeksOverlapping(db, from, to),
    ]);

    const [menusById, claimsByScheduleId] = await Promise.all([
      catalogRepository.loadMenusByIds(
        db,
        scheduleRows
          .map((row) => row.menuId)
          .filter((id): id is number => id !== null),
      ),
      claimService.summariesByScheduleIds(
        db,
        scheduleRows.map((row) => row.id),
      ),
    ]);

    return {
      className,
      schedulesByDate: new Map(scheduleRows.map((row) => [row.scheduleDate, row])),
      holidaysByDate: new Map(holidayRows.map((row) => [row.date, row])),
      weeksByStart: new Map(weekRows.map((row) => [row.weekStartDate, row])),
      menusById,
      claimsByScheduleId,
      today: todayInWib(),
    };
  }

  private buildDay(date: string, ctx: ScheduleContext): ScheduleDayDto {
    const schedule = ctx.schedulesByDate.get(date);
    const holiday = ctx.holidaysByDate.get(date);

    // Hari libur tetap berlaku global (tabel `holidays`), apa pun kelasnya.
    const isHoliday = schedule?.isHoliday === 1 || Boolean(holiday);

    return {
      date,
      dayOfWeek: dayOfWeek(date),
      dayName: indonesianDayName(date),
      className: ctx.className,
      isToday: date === ctx.today,
      isHoliday,
      holidayName: holiday?.name ?? null,
      notes: schedule?.notes ?? null,
      scheduleId: schedule?.id ?? null,
      menu: isHoliday
        ? null
        : ((schedule?.menuId ? ctx.menusById.get(schedule.menuId) : null) ?? null),
      petugasName: schedule?.petugasName ?? null,
      petugasParentName: schedule?.petugasParentName ?? null,
      status: (schedule?.status as ScheduleStatus | undefined) ?? null,
      claim: schedule ? (ctx.claimsByScheduleId.get(schedule.id) ?? null) : null,
    };
  }

  /** Senin–Jumat untuk minggu yang dimulai pada `weekStart`. */
  private buildWeek(weekStart: string, ctx: ScheduleContext): WeekScheduleDto {
    const weekEnd = endOfWeek(weekStart);
    const week = ctx.weeksByStart.get(weekStart);

    return {
      week: week ? toWeekDto(week) : null,
      className: ctx.className,
      startDate: weekStart,
      endDate: weekEnd,
      label: formatWeekLabel(weekStart, weekEnd),
      days: [0, 1, 2, 3, 4].map((offset) =>
        this.buildDay(addDays(weekStart, offset), ctx),
      ),
    };
  }

  // ── Pembacaan ───────────────────────────────────────────────

  /**
   * Orang tua hanya boleh melihat jadwal yang sudah 'published'.
   * Admin & korlas melihat semua status.
   */
  private statusFilterForRole(role: Role): ScheduleStatus[] | undefined {
    return role === "parent" ? ["published"] : undefined;
  }

  async getToday(
    db: Db,
    className: string | null,
    role: Role = "parent",
  ): Promise<TodayScheduleDto> {
    const today = todayInWib();
    const weekStart = startOfWeek(today);
    const ctx = await this.loadContext(
      db,
      weekStart,
      endOfWeek(today),
      className,
      this.statusFilterForRole(role),
    );

    return {
      day: this.buildDay(today, ctx),
      week: this.buildWeek(weekStart, ctx),
    };
  }

  /**
   * Jadwal hari ini untuk SEMUA kelas — khusus admin.
   * Mengembalikan satu kartu per kelas yang dikenal sistem.
   */
  async getTodayAllClasses(db: Db): Promise<TodayAllClassesDto> {
    const today = todayInWib();
    const weekStart = startOfWeek(today);
    const allClasses = await classRepository.listAll(db);

    // Muat konteks minggu sekali (tanpa filter status)
    const baseCtx = await this.loadContext(db, weekStart, endOfWeek(today), null);

    const classes = await Promise.all(
      allClasses.map(async (className) => {
        const ctx = await this.loadContext(
          db,
          weekStart,
          endOfWeek(today),
          className,
        );
        return {
          className,
          day: this.buildDay(today, ctx),
        };
      }),
    );

    return {
      today,
      classes,
      week: this.buildWeek(weekStart, baseCtx),
    };
  }

  /** Jadwal Sepekan. `date` opsional — default hari ini (WIB). */
  async getWeek(
    db: Db,
    className: string | null,
    role: Role = "parent",
    date?: string,
  ): Promise<WeekScheduleDto> {
    const anchor = date ?? todayInWib();
    const weekStart = startOfWeek(anchor);
    const weekEnd = endOfWeek(anchor);
    const ctx = await this.loadContext(
      db,
      weekStart,
      weekEnd,
      className,
      this.statusFilterForRole(role),
    );

    return this.buildWeek(weekStart, ctx);
  }

  /**
   * Jadwal bulanan, dikelompokkan per minggu (Senin–Jumat) seperti
   * struktur dokumen sumber.
   */
  async getMonth(
    db: Db,
    year: number,
    month: number,
    className: string | null,
    role: Role = "parent",
  ): Promise<MonthScheduleDto> {
    const { start, end } = monthRange(year, month);

    const weekStarts: string[] = [];
    for (let cursor = startOfWeek(start); cursor <= end; cursor = addDays(cursor, 7)) {
      weekStarts.push(cursor);
    }

    const from = weekStarts[0] ?? start;
    const to = addDays(weekStarts[weekStarts.length - 1] ?? start, 4);
    const ctx = await this.loadContext(
      db,
      from,
      to,
      className,
      this.statusFilterForRole(role),
    );

    return {
      year,
      month,
      monthName: indonesianMonthName(month),
      className,
      weeks: weekStarts.map((weekStart) => this.buildWeek(weekStart, ctx)),
    };
  }

  /** Jadwal pada rentang bebas. Maksimum 92 hari untuk membatasi beban query. */
  async getRange(
    db: Db,
    from: string,
    to: string,
    className: string | null,
    role: Role = "parent",
  ): Promise<ScheduleDayDto[]> {
    const ctx = await this.loadContext(
      db,
      from,
      to,
      className,
      this.statusFilterForRole(role),
    );
    const days: ScheduleDayDto[] = [];

    for (let cursor = from; cursor <= to; cursor = addDays(cursor, 1)) {
      days.push(this.buildDay(cursor, ctx));
    }

    return days;
  }

  /**
   * Detail satu baris jadwal — kelasnya mengikuti baris itu sendiri.
   * Orang tua hanya bisa melihat baris yang sudah 'published'.
   */
  async getById(
    db: Db,
    id: number,
    role: Role = "parent",
  ): Promise<ScheduleDayDto | null> {
    const schedule = await scheduleRepository.findScheduleById(db, id);
    if (!schedule) return null;

    if (role === "parent" && schedule.status !== "published") return null;

    const ctx = await this.loadContext(
      db,
      schedule.scheduleDate,
      schedule.scheduleDate,
      schedule.className,
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

  /**
   * Cari tanggal di mana sebuah menu atau komponennya pernah dijadwalkan.
   *
   * Hasil dikelompokkan per tanggal; satu tanggal muncul sekali meskipun
   * beberapa komponennya cocok.
   */
  async searchMenuHistory(
    db: Db,
    query: string,
    from: string,
    to: string,
    className: string | null,
  ): Promise<MenuHistoryDto> {
    const trimmed = query.trim();
    const rows = className
      ? await scheduleRepository.searchMenuHistory(db, trimmed, from, to, className)
      : [];

    const term = trimmed.toLowerCase();
    const byDate = new Map<string, MenuHistoryMatchDto>();

    for (const row of rows) {
      let entry = byDate.get(row.scheduleDate);

      if (!entry) {
        entry = {
          date: row.scheduleDate,
          dayName: indonesianDayName(row.scheduleDate),
          menuId: row.menuId,
          menuName: row.menuName,
          matchedItems: [],
          menuNameMatched: row.menuName.toLowerCase().includes(term),
          notes: row.notes,
        };
        byDate.set(row.scheduleDate, entry);
      }

      if (row.itemName && row.itemName.toLowerCase().includes(term)) {
        const alreadyAdded = entry.matchedItems.some(
          (item) => item.name === row.itemName,
        );
        if (!alreadyAdded) {
          entry.matchedItems.push({
            name: row.itemName,
            itemType: (row.itemType ?? "other") as MenuItemType,
          });
        }
      }
    }

    const matches = [...byDate.values()].sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    return {
      query: trimmed,
      from,
      to,
      totalMatches: matches.length,
      matches,
    };
  }

  // ── Penulisan (admin & korlas) ──────────────────────────────

  /**
   * Buat satu baris jadwal untuk satu kelas.
   * Keunikan (tanggal, kelas) dijaga di sini agar pesannya ramah.
   */
  async createSchedule(
    db: Db,
    className: string,
    input: ScheduleInput,
  ): Promise<ScheduleDayDto | ScheduleError> {
    const existing = await scheduleRepository.findScheduleByDate(
      db,
      input.scheduleDate,
      className,
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
      className,
      menuId: input.isHoliday ? null : (input.menuId ?? null),
      isHoliday: input.isHoliday ? 1 : 0,
      petugasName: input.petugasName ?? null,
      petugasParentName: input.petugasParentName ?? null,
      notes: input.notes ?? null,
    });

    return (await this.getById(db, created.id, "admin"))!;
  }

  async updateSchedule(
    db: Db,
    id: number,
    input: Partial<Omit<ScheduleInput, "scheduleDate">>,
  ): Promise<ScheduleDayDto | ScheduleError> {
    const current = await scheduleRepository.findScheduleById(db, id);
    if (!current) return "not_found";

    // Jadwal yang sudah dikunci/dipublikasi tidak dapat diubah.
    if (current.status === "locked" || current.status === "published") {
      return "not_editable";
    }

    if (input.menuId != null) {
      const menu = await catalogRepository.findMenuById(db, input.menuId);
      if (!menu) return "menu_not_found";
    }

    const isHoliday = input.isHoliday;

    await scheduleRepository.updateSchedule(db, id, {
      ...(input.menuId !== undefined ? { menuId: input.menuId } : {}),
      ...(isHoliday !== undefined ? { isHoliday: isHoliday ? 1 : 0 } : {}),
      ...(input.petugasName !== undefined ? { petugasName: input.petugasName } : {}),
      ...(input.petugasParentName !== undefined ? { petugasParentName: input.petugasParentName } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      // Hari libur tidak menyimpan menu.
      ...(isHoliday ? { menuId: null } : {}),
    });

    return (await this.getById(db, id, "admin"))!;
  }

  async deleteSchedule(db: Db, id: number): Promise<boolean | ScheduleError> {
    const current = await scheduleRepository.findScheduleById(db, id);
    if (!current) return false;

    // Jadwal yang sudah dikunci/dipublikasi tidak dapat dihapus.
    if (current.status === "locked" || current.status === "published") {
      return "not_editable";
    }

    await scheduleRepository.deleteSchedule(db, id);
    return true;
  }

  /**
   * Salin jadwal Senin–Jumat dari satu minggu ke minggu lain **untuk satu kelas**.
   *
   * Hari yang sudah punya jadwal di minggu tujuan dilewati, kecuali
   * `overwrite` diaktifkan. Hari tanpa jadwal di minggu sumber ikut dilewati.
   */
  async copyWeek(
    db: Db,
    className: string,
    input: CopyWeekInput,
  ): Promise<CopyWeekResultDto | ScheduleError> {
    const sourceStart = startOfWeek(input.fromDate);
    const targetStart = startOfWeek(input.toDate);

    if (sourceStart === targetStart) return "same_week";

    const sourceEnd = endOfWeek(input.fromDate);
    const sourceSchedules = await scheduleRepository.findSchedulesBetween(
      db,
      sourceStart,
      sourceEnd,
      className,
    );
    const sourceByDate = new Map(
      sourceSchedules.map((row) => [row.scheduleDate, row]),
    );

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (let offset = 0; offset < 5; offset += 1) {
      const sourceDate = addDays(sourceStart, offset);
      const targetDate = addDays(targetStart, offset);
      const source = sourceByDate.get(sourceDate);

      if (!source) {
        skipped += 1;
        continue;
      }

      const existing = await scheduleRepository.findScheduleByDate(
        db,
        targetDate,
        className,
      );

      if (existing) {
        // Baris yang sudah dikunci/dipublikasi tidak boleh ditimpa.
        if (existing.status === "locked" || existing.status === "published") {
          skipped += 1;
          continue;
        }

        if (!input.overwrite) {
          skipped += 1;
          continue;
        }

        await scheduleRepository.updateSchedule(db, existing.id, {
          menuId: source.menuId,
          isHoliday: source.isHoliday,
          petugasName: source.petugasName,
          petugasParentName: source.petugasParentName,
          notes: source.notes,
        });
        updated += 1;
        continue;
      }

      const week = await scheduleRepository.ensureWeek(db, targetDate);
      await scheduleRepository.insertSchedule(db, {
        weekId: week.id,
        scheduleDate: targetDate,
        dayOfWeek: dayOfWeek(targetDate),
        className,
        menuId: source.menuId,
        isHoliday: source.isHoliday,
        petugasName: source.petugasName,
        petugasParentName: source.petugasParentName,
        notes: source.notes,
      });
      created += 1;
    }

    return {
      sourceLabel: formatWeekLabel(sourceStart, sourceEnd),
      targetLabel: formatWeekLabel(targetStart, endOfWeek(input.toDate)),
      created,
      updated,
      skipped,
    };
  }

  // ── Kunci & Publikasi (korlas & admin) ─────────────────────

  /**
   * Kunci semua jadwal 'draft' pada rentang `fromDate`–`toDate` untuk satu kelas.
   * Baris yang sudah 'locked' atau 'published' dilewati.
   * Dipanggil oleh korlas setelah selesai menyusun jadwal.
   */
  async lockSchedules(
    db: Db,
    className: string,
    input: LockScheduleInput,
    userId: number,
  ): Promise<LockScheduleResultDto> {
    // Ambil status saat ini untuk menghitung yang sudah terkunci/dilewati.
    const rows = await scheduleRepository.findSchedulesBetween(
      db,
      input.fromDate,
      input.toDate,
      className,
    );

    const draftCount = rows.filter((r) => r.status === "draft").length;
    const alreadyLocked = rows.filter((r) => r.status === "locked").length;
    const skipped = rows.filter((r) => r.status === "published").length;

    const locked = draftCount > 0
      ? await scheduleRepository.lockDraftSchedulesBetween(
          db,
          input.fromDate,
          input.toDate,
          className,
          userId,
        )
      : 0;

    return {
      className,
      fromDate: input.fromDate,
      toDate: input.toDate,
      locked,
      alreadyLocked,
      skipped,
    };
  }

  /**
   * Publikasi semua jadwal 'locked' untuk satu bulan + kelas.
   * Gagal bila masih ada baris 'draft' — harus dikunci dulu.
   * Setelah publikasi, jadwal terlihat oleh semua orang tua.
   */
  async publishMonth(
    db: Db,
    className: string,
    input: PublishScheduleInput,
    userId: number,
  ): Promise<PublishScheduleResultDto | ScheduleError> {
    const statusCounts = await scheduleRepository.countSchedulesByStatusForMonth(
      db,
      input.year,
      input.month,
      className,
    );

    const counts = new Map(statusCounts.map((r) => [r.status, r.count]));
    const draftCount = counts.get("draft") ?? 0;

    if (draftCount > 0) return "drafts_remaining";

    const alreadyPublished = counts.get("published") ?? 0;

    const published = await scheduleRepository.publishLockedSchedulesForMonth(
      db,
      input.year,
      input.month,
      className,
      userId,
    );

    return {
      className,
      year: input.year,
      month: input.month,
      published,
      draftCount,
      alreadyPublished,
    };
  }

  /**
   * Buka kunci satu baris jadwal — kembalikan ke 'draft'.
   * Hanya admin yang boleh melakukan ini (lihat middleware route).
   */
  async unlock(db: Db, id: number): Promise<ScheduleDayDto | ScheduleError> {
    const current = await scheduleRepository.findScheduleById(db, id);
    if (!current) return "not_found";

    await scheduleRepository.unlockSchedule(db, id);
    return (await this.getById(db, id, "admin"))!;
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
