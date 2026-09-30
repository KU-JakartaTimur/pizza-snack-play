import type { Db } from "../../database/db";
import type { Holiday, Schedule, Week } from "../../database/schema";
import type { MenuDto, MenuItemType } from "../../types/catalog";
import type { Role } from "../../types/auth";
import type { ScheduleClaimSummaryDto } from "../../types/claim";
import type {
  BulkRowAction,
  BulkRowScheduleResultDto,
  CopyWeekInput,
  CopyWeekResultDto,
  ImportDayOutcomeDto,
  ImportScheduleResultDto,
  LockClassResult,
  LockScheduleInput,
  LockScheduleResultDto,
  MenuHistoryDto,
  MenuHistoryMatchDto,
  MonthScheduleDto,
  MonthStatusClassDto,
  MonthStatusDto,
  PublishClassResult,
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
import { guessCategorySlug } from "../catalog/categorize";
import { catalogRepository } from "../catalog/repository";
import { classRepository } from "../classes/repository";
import { claimService } from "../claims/service";
import { menuKey, parseScheduleText } from "./importParser";
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

export type ScheduleError =
  | "not_found"
  | "duplicate_date"
  | "menu_not_found"
  | "petugas_not_found"
  | "same_week"
  | "forbidden_class"
  | "not_editable"
  | "drafts_remaining"
  | "import_empty";

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

/**
 * Urutkan nama kelas secara alami — "1", "2", …, "10" — bukan abjad
 * ("1", "10", "2"). Duplikat dibuang, karena yang dilaporkan selalu
 * "kelas mana saja yang tersentuh", bukan berapa barisnya.
 */
function sortClassNames(names: Iterable<string>): string[] {
  return [...new Set(names)].sort((a, b) =>
    a.localeCompare(b, "id", { numeric: true }),
  );
}

/**
 * Status yang boleh berpindah oleh tiap aksi massal.
 *
 * Dinyatakan sebagai data, bukan rangkaian `if`, supaya aturannya terbaca
 * sekali di satu tempat dan tidak mungkin berbeda antar-aksi.
 */
const BULK_ACTION_FROM: Record<BulkRowAction, ScheduleStatus[]> = {
  lock: ["draft"],
  publish: ["locked"],
  unlock: ["locked", "published"],
};

/** Nama menu gabungan — bentuk yang sama dengan yang ditampilkan katalog. */
function composeMenuName(main: string, fruit: string | null): string {
  return fruit ? `${main} + ${fruit}` : main;
}

/**
 * Kunci pembanding sebuah menu yang sudah ada di katalog.
 *
 * `null` bila menunya tidak punya komponen yang bisa dibandingkan — menu
 * kosong tidak boleh dianggap kembar dengan menu kosong lain.
 */
function keyOfMenu(menu: MenuDto): string | null {
  const main = menu.items.find((item) => item.itemType === "main") ?? menu.items[0];
  if (!main) return null;
  const fruit = menu.items.find((item) => item.itemType === "fruit") ?? null;
  return menuKey(main.name, fruit?.name ?? null);
}

/** Bentuk satu baris jadwal yang menunggu disisipkan. */
type PendingScheduleRow = Parameters<
  typeof scheduleRepository.insertSchedules
>[1][number];

class ScheduleService {
  /**
   * Kelas yang masih menyisakan `draft` pada percobaan publikasi terakhir.
   *
   * Diisi `publishMonth` saat mengembalikan `drafts_remaining`, lalu dibaca
   * controller untuk menyusun pesan 409 yang menyebut kelas penyebabnya.
   * Dipakai karena `ScheduleError` sengaja tetap berupa union string.
   */
  private lastDraftBlockers: Array<{ className: string; count: number }> = [];

  /** Kelas penyebab publikasi terakhir ditolak. Kosong bila tidak ada. */
  draftBlockers(): Array<{ className: string; count: number }> {
    return this.lastDraftBlockers;
  }

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
      petugasStudentId: schedule?.petugasStudentId ?? null,
      petugasParentId: schedule?.petugasParentId ?? null,
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

  /**
   * Ringkasan status satu bulan, dipecah per kelas.
   *
   * Menggantikan pola lama "muat jadwal penuh tiap kelas lalu hitung di
   * klien": di sini seluruh agregasi dilakukan dengan **satu** query
   * `GROUP BY class_name, status`.
   *
   * `className` `null` → seluruh kelas (dipakai admin, karena kunci &
   * publikasi admin menyentuh semua kelas sekaligus). Nilai konkret →
   * dibatasi ke kelas itu, dan daftar `classes` dipersempit juga agar UI
   * korlas tidak menampilkan kelas lain.
   */
  async getMonthStatus(
    db: Db,
    year: number,
    month: number,
    className: string | null,
  ): Promise<MonthStatusDto> {
    const allClasses = await classRepository.listAll(db);
    const scopedClasses =
      className === null ? allClasses : allClasses.filter((c) => c === className);

    const rows = await scheduleRepository.countSchedulesByClassForMonth(
      db,
      year,
      month,
    );
    const relevantRows =
      className === null ? rows : rows.filter((row) => row.className === className);

    // Mulai dari daftar kelas agar kelas tanpa jadwal tetap muncul dengan nol.
    const perClass: MonthStatusClassDto[] = scopedClasses.map((name) => {
      const forClass = relevantRows.filter((row) => row.className === name);
      const countOf = (status: ScheduleStatus) =>
        forClass.find((row) => row.status === status)?.count ?? 0;

      const draftCount = countOf("draft");
      const lockedCount = countOf("locked");
      const publishedCount = countOf("published");

      return {
        className: name,
        draftCount,
        lockedCount,
        publishedCount,
        totalCount: draftCount + lockedCount + publishedCount,
      };
    });

    const totals = perClass.reduce(
      (acc, item) => ({
        draftCount: acc.draftCount + item.draftCount,
        lockedCount: acc.lockedCount + item.lockedCount,
        publishedCount: acc.publishedCount + item.publishedCount,
        totalCount: acc.totalCount + item.totalCount,
      }),
      { draftCount: 0, lockedCount: 0, publishedCount: 0, totalCount: 0 },
    );

    return {
      year,
      month,
      monthName: indonesianMonthName(month),
      className,
      classes: scopedClasses,
      perClass,
      totals,
      draftClasses: perClass
        .filter((item) => item.draftCount > 0)
        .map((item) => item.className),
      canPublish: totals.draftCount === 0 && totals.lockedCount > 0,
    };
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
   * Terjemahkan `petugasStudentId` menjadi nama siswa & nama orang tuanya,
   * untuk satu kelas tertentu.
   *
   * Ini **satu-satunya** tempat petugas ditetapkan, dan sengaja tidak
   * menerima nama dari klien: `petugasName`/`petugasParentName` yang dikirim
   * klien akan ditimpa, sehingga baris jadwal tidak pernah memuat pasangan
   * siswa–orang tua yang tidak ada di database, maupun petugas dari kelas
   * lain. Siswa diambil dari roster kelas baris itu, jadi penunjukan lintas
   * kelas tidak perlu diperiksa terpisah — kelasnya sudah jadi filter.
   *
   * Tiga hasil yang mungkin:
   *
   * - `{ ok: true, value: null }`  → membatalkan petugas (id dikosongkan).
   * - `{ ok: true, value: {...} }` → petugas sah; nama diturunkan dari data.
   * - `{ ok: false }`              → siswa tidak ada di kelas ini.
   *
   * `fallback` menjaga perilaku lama tetap hidup: jadwal yang petugasnya
   * masih berupa teks bebas (diisi sebelum kolom id ada, atau lewat impor)
   * tidak kehilangan isinya hanya karena sengaja tidak menyebut id. Yang
   * dihapus, justru pasangan yang bertentangan.
   */
  private async resolvePetugas(
    db: Db,
    className: string,
    input: Partial<Pick<ScheduleInput, "petugasStudentId" | "petugasName" | "petugasParentName">>,
    fallback: Schedule | undefined,
  ): Promise<
    | { ok: true; value: {
        petugasName: string | null;
        petugasStudentId: number | null;
        petugasParentId: number | null;
        petugasParentName: string | null;
      } }
    | { ok: false; error: ScheduleError }
  > {
    const requested = input.petugasStudentId;

    // Tidak menyebut studentId sama sekali → pertahankan yang tersimpan.
    if (requested === undefined) {
      if (fallback) {
        return {
          ok: true,
          value: {
            petugasName: fallback.petugasName,
            petugasStudentId: fallback.petugasStudentId,
            petugasParentId: fallback.petugasParentId,
            petugasParentName: fallback.petugasParentName,
          },
        };
      }

      // Baris baru tanpa id: satu-satunya jalan agar data lama & impor tetap
      // bisa menyimpan nama sebagai teks bebas.
      return {
        ok: true,
        value: {
          petugasName: input.petugasName?.trim() || null,
          petugasStudentId: null,
          petugasParentId: null,
          petugasParentName: input.petugasParentName?.trim() || null,
        },
      };
    }

    // Menyebut `null` secara eksplisit → kosongkan petugas.
    if (requested === null) {
      return {
        ok: true,
        value: {
          petugasName: null,
          petugasStudentId: null,
          petugasParentId: null,
          petugasParentName: null,
        },
      };
    }

    const student = (await classRepository.listStudentsForClass(db, className)).find(
      (row) => row.studentId === requested,
    );
    if (!student) return { ok: false, error: "petugas_not_found" };

    return {
      ok: true,
      value: {
        petugasName: student.studentName,
        petugasStudentId: student.studentId,
        // Orang tua tanpa profil tetap boleh jadi petugas; hanya
        // keterkaitan ke akunnya yang kosong.
        petugasParentId: student.parentId || null,
        petugasParentName: student.parentName || null,
      },
    };
  }

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

    const petugas = await this.resolvePetugas(db, className, input, undefined);
    if (!petugas.ok) return petugas.error;

    const week = await scheduleRepository.ensureWeek(db, input.scheduleDate);

    const created = await scheduleRepository.insertSchedule(db, {
      weekId: week.id,
      scheduleDate: input.scheduleDate,
      dayOfWeek: dayOfWeek(input.scheduleDate),
      className,
      menuId: input.isHoliday ? null : (input.menuId ?? null),
      isHoliday: input.isHoliday ? 1 : 0,
      ...petugas.value,
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

    /*
      Baris `locked`/`published` memang beku — menu, catatan, dan hari libur
      sudah disetujui sekolah dan tidak boleh bergeser setelah orang tua
      melihatnya.

      Satu pengecualian: **penunjukan petugas**. Piket sering baru terisi
      setelah jadwal terbit (orang tua menyanggupi belakangan, atau anak yang
      ditunjuk berhalangan), dan itulah satu-satunya kolom yang isinya bukan
      kesepakatan menu. Karena itu pintunya dibuka lewat jalur sempit ini:
      **hanya** `petugasStudentId` yang boleh ikut, `undefined` atau bukan.

      Begitu ada kolom lain di patch, aturan lama berlaku penuh — supaya
      perubahan campuran tidak diam-diam tersimpan separuh dan klien tidak
      mengira menu/catatannya ikut berubah.
    */
    if (current.status === "locked" || current.status === "published") {
      const onlyPetugas =
        input.petugasStudentId !== undefined &&
        input.menuId === undefined &&
        input.isHoliday === undefined &&
        input.notes === undefined;

      // Hari libur tidak punya petugas piket — tidak ada yang bisa diubah.
      if (!onlyPetugas || current.isHoliday === 1) return "not_editable";
    }

    if (input.menuId != null) {
      const menu = await catalogRepository.findMenuById(db, input.menuId);
      if (!menu) return "menu_not_found";
    }

    // Petugas selalu diturunkan dari roster kelas **baris ini**, bukan dari
    // kelas yang dipilih di layar — keduanya bisa berbeda saat admin bekerja.
    const petugas = await this.resolvePetugas(
      db,
      current.className,
      input,
      current,
    );
    if (!petugas.ok) return petugas.error;

    const isHoliday = input.isHoliday;

    await scheduleRepository.updateSchedule(db, id, {
      ...(input.menuId !== undefined ? { menuId: input.menuId } : {}),
      ...(isHoliday !== undefined ? { isHoliday: isHoliday ? 1 : 0 } : {}),
      ...petugas.value,
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
          petugasStudentId: source.petugasStudentId,
          petugasParentId: source.petugasParentId,
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
        petugasStudentId: source.petugasStudentId,
        petugasParentId: source.petugasParentId,
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
   * Kunci semua jadwal 'draft' pada rentang `fromDate`–`toDate`.
   *
   * `classNames` `null` berarti **semua kelas sekaligus** — dipakai admin
   * lewat tombol "Kunci bulan": satu bulan penuh untuk kelas 1–6 terkunci
   * dalam satu tindakan, sehingga tidak ada kelas yang tertinggal. Daftar
   * berisi → hanya kelas-kelas itu (dipakai aksi massal di kartu status,
   * maupun korlas yang selalu terbatas pada kelasnya — dijaga di controller).
   *
   * Baris yang sudah 'locked' atau 'published' dilewati.
   */
  async lockSchedules(
    db: Db,
    classNames: string[] | null,
    input: LockScheduleInput,
    userId: number,
  ): Promise<LockScheduleResultDto> {
    // Daftar kelas yang boleh tersentuh operasi ini.
    // `null` = sekolah-wide (admin) → semua kelas; selain itu hanya kelas ybs,
    // sehingga korlas tidak pernah menyentuh kelas lain.
    const targetClasses =
      classNames === null ? await classRepository.listAll(db) : classNames;

    const perClass: LockClassResult[] = [];
    let totalLocked = 0;
    let totalAlreadyLocked = 0;
    let totalSkipped = 0;
    const touched = new Set<string>();

    for (const cls of targetClasses) {
      const rows = await scheduleRepository.findSchedulesBetween(
        db,
        input.fromDate,
        input.toDate,
        cls,
      );

      const draftCount = rows.filter((r) => r.status === "draft").length;
      const alreadyLocked = rows.filter((r) => r.status === "locked").length;
      const skipped = rows.filter((r) => r.status === "published").length;

      const locked =
        draftCount > 0
          ? await scheduleRepository.lockDraftSchedulesBetween(
              db,
              input.fromDate,
              input.toDate,
              cls,
              userId,
            )
          : 0;

      if (rows.length > 0) touched.add(cls);
      perClass.push({ className: cls, locked, alreadyLocked, skipped });
      totalLocked += locked;
      totalAlreadyLocked += alreadyLocked;
      totalSkipped += skipped;
    }

    return {
      classNames,
      // Kelas yang benar-benar punya baris pada rentang ini.
      classes: sortClassNames(touched),
      fromDate: input.fromDate,
      toDate: input.toDate,
      locked: totalLocked,
      alreadyLocked: totalAlreadyLocked,
      skipped: totalSkipped,
      perClass,
    };
  }

  /**
   * Publikasi semua jadwal 'locked' untuk satu bulan.
   *
   * `classNames` `null` berarti **seluruh sekolah** — semua kelas dipublikasi
   * bersamaan sehingga jadwal bulan itu terbuka untuk orang tua kelas 1–6
   * pada saat yang sama. Daftar berisi → hanya kelas-kelas itu.
   *
   * Gagal (`drafts_remaining`) bila masih ada baris 'draft' **di antara kelas
   * yang dipilih** — harus dikunci dulu. Draft menahan publikasi kelas itu
   * sendiri; itu disengaja agar tidak ada kelas yang terbit dengan jadwal
   * separuh jadi. Kelas yang tidak dipilih tidak ikut menghalangi.
   */
  async publishMonth(
    db: Db,
    classNames: string[] | null,
    input: PublishScheduleInput,
    userId: number,
  ): Promise<PublishScheduleResultDto | ScheduleError> {
    // `null` = seluruh sekolah (admin) → semua kelas; selain itu hanya kelas ybs.
    const targetClasses =
      classNames === null ? await classRepository.listAll(db) : classNames;

    const perClass: PublishClassResult[] = [];
    let totalPublished = 0;
    let totalLockedCount = 0;
    let totalDraftCount = 0;
    let totalAlreadyPublished = 0;

    for (const cls of targetClasses) {
      const statusCounts =
        await scheduleRepository.countSchedulesByStatusForMonth(
          db,
          input.year,
          input.month,
          cls,
        );

      const counts = new Map(statusCounts.map((r) => [r.status, r.count]));
      const draftCount = counts.get("draft") ?? 0;
      const alreadyPublished = counts.get("published") ?? 0;
      const lockedCount = counts.get("locked") ?? 0;

      // Draft di kelas mana pun menahan publikasi — jangan terbit separuh jadi.
      if (draftCount > 0) {
        perClass.push({
          className: cls,
          published: 0,
          draftCount,
          alreadyPublished,
          blocked: true,
        });
        totalDraftCount += draftCount;
        totalAlreadyPublished += alreadyPublished;
        continue;
      }

      const published =
        await scheduleRepository.publishLockedSchedulesForMonth(
          db,
          input.year,
          input.month,
          cls,
          userId,
        );

      perClass.push({
        className: cls,
        published,
        draftCount,
        alreadyPublished,
        blocked: false,
      });
      totalPublished += published;
      totalLockedCount += lockedCount;
      totalAlreadyPublished += alreadyPublished;
    }

    // Gagal bila masih ada draft. `lastDraftBlockers` dipakai controller
    // untuk menyebut kelas penyebabnya di pesan 409.
    if (totalDraftCount > 0) {
      this.lastDraftBlockers = perClass
        .filter((row) => row.blocked && row.draftCount > 0)
        .map((row) => ({ className: row.className, count: row.draftCount }));
      return "drafts_remaining";
    }

    this.lastDraftBlockers = [];

    return {
      classNames,
      // Kelas yang statusnya `published` setelah operasi ini — termasuk yang
      // sudah terbit sebelumnya, supaya laporan tidak mengecil saat publikasi
      // diulang.
      classes: perClass
        .filter((row) => row.published > 0 || row.alreadyPublished > 0)
        .map((row) => row.className),
      year: input.year,
      month: input.month,
      published: totalPublished,
      lockedCount: totalLockedCount,
      draftCount: 0,
      draftByClass: [],
      alreadyPublished: totalAlreadyPublished,
      perClass,
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

  /**
   * Jalankan satu aksi massal atas baris-baris jadwal yang dicentang.
   *
   * Berbeda dari `/lock` & `/publish` yang berbasis rentang tanggal atau
   * kelas, di sini pemilihannya **eksplisit per baris**. Karena itu tidak ada
   * operasi yang digagalkan seluruhnya: baris yang statusnya tidak cocok
   * dengan aksinya (mis. mempublikasi baris `draft`) hanya **dilewati** dan
   * dilaporkan lewat `skipped` — bukan `409` — sebab pemakainya menyebut
   * barisnya satu per satu dan berhak tahu hasilnya per baris.
   *
   * `scopeClass` `null` berarti tanpa batas kelas (admin). Selain itu hanya
   * baris dengan kelas tersebut yang diproses; sisanya masuk `ignored`,
   * sehingga korlas tidak bisa menyentuh kelas lain lewat centang.
   */
  async bulkRows(
    db: Db,
    ids: number[],
    action: BulkRowAction,
    scopeClass: string | null,
    userId: number,
  ): Promise<BulkRowScheduleResultDto> {
    // Id ganda (mis. dari "pilih semua" yang bertumpang) dihitung sekali saja.
    const uniqueIds = [...new Set(ids)].filter(
      (id) => Number.isInteger(id) && id > 0,
    );

    const rows = await scheduleRepository.findSchedulesByIds(db, uniqueIds);
    const inScope =
      scopeClass === null
        ? rows
        : rows.filter((row) => row.className === scopeClass);

    const allowed = BULK_ACTION_FROM[action];
    const eligible = inScope.filter((row) =>
      allowed.includes(row.status as ScheduleStatus),
    );
    const eligibleIds = eligible.map((row) => row.id);

    // Statusnya sudah disaring di atas; syarat yang sama diulang di `WHERE`
    // repository sebagai jaring pengaman bila baris berubah di sela-sela.
    const apply: Record<BulkRowAction, () => Promise<number>> = {
      lock: () =>
        scheduleRepository.lockDraftSchedulesByIds(db, eligibleIds, userId),
      publish: () =>
        scheduleRepository.publishLockedSchedulesByIds(db, eligibleIds, userId),
      unlock: () => scheduleRepository.unlockSchedulesByIds(db, eligibleIds),
    };

    return {
      action,
      changed: await apply[action](),
      skipped: inScope.length - eligible.length,
      // Tidak ditemukan + di luar cakupan kelas.
      ignored: uniqueIds.length - inScope.length,
      classes: sortClassNames(eligible.map((row) => row.className)),
    };
  }

  /**
   * Impor jadwal dari teks yang ditempel admin/korlas.
   *
   * Sekolah mengirim jadwal sebagai teks biasa; sebelum ini satu-satunya cara
   * memasukkannya adalah menjalankan skrip Python + `wrangler d1 execute`
   * terhadap produksi. Method ini melakukan hal yang sama dari dalam aplikasi,
   * dengan dua perbedaan yang disengaja:
   *
   *  1. **Baris yang sudah ada dilewati, bukan ditimpa.** Jadwal yang sudah
   *     dikunci/dipublikasi tidak boleh berubah diam-diam hanya karena
   *     seseorang menempel ulang teks yang sama. Karena itu tempelan yang
   *     sama boleh diulang kapan saja — hasilnya idempoten.
   *  2. **Baris baru berstatus `draft`**, sehingga masih melewati kunci &
   *     publikasi seperti jadwal yang disusun lewat layar.
   *
   * `dryRun` mengembalikan laporan yang sama tanpa menulis apa pun, sehingga
   * UI bisa menampilkan pratinjau lebih dulu — mitigasi yang memang diminta
   * PRD §14 untuk risiko salah input.
   */
  async importSchedule(
    db: Db,
    text: string,
    classNames: string[],
    dryRun: boolean,
  ): Promise<ImportScheduleResultDto | ScheduleError> {
    const parsed = parseScheduleText(text);
    if (parsed.dayCount === 0) return "import_empty";

    const classes = sortClassNames(classNames);
    if (classes.length === 0) return "forbidden_class";

    const days = parsed.blocks
      .flatMap((block) => block.days)
      .sort((a, b) => a.date.localeCompare(b.date));

    // Satu query untuk seluruh tempelan — bukan satu query per tanggal.
    const [occupied, allMenus, categories] = await Promise.all([
      scheduleRepository.findOccupiedDateClassKeys(
        db,
        days[0].date,
        days[days.length - 1].date,
        classes,
      ),
      catalogRepository.loadAllMenus(db),
      catalogRepository.listCategories(db),
    ]);

    const categoryIdBySlug = new Map(
      categories.map((category) => [category.slug, category.id]),
    );

    // Menu yang sudah ada, dikenali dari pasangan utama+buah — bukan dari nama
    // yang persis sama, supaya beda huruf besar/kecil tidak melahirkan menu
    // kembar ("Puding Roti + jeruk" vs "Puding Roti + Jeruk").
    const knownMenus = new Map<string, { id: number | null; name: string }>();
    for (const menu of allMenus.values()) {
      const key = keyOfMenu(menu);
      if (key && !knownMenus.has(key)) {
        knownMenus.set(key, { id: menu.id, name: menu.name });
      }
    }

    const outcomes: ImportDayOutcomeDto[] = [];
    const pendingRows: PendingScheduleRow[] = [];
    const weekIdByStart = new Map<string, number>();
    /** Menu yang benar-benar dibuat di pemanggilan ini — untuk pembersihan. */
    const createdMenuIds: number[] = [];
    let createdMenus = 0;
    let reusedMenus = 0;

    for (const day of days) {
      let menuId: number | null = null;
      let menuName: string | null = null;
      let menuCreated = false;

      if (!day.isHoliday && day.menuMain) {
        const key = menuKey(day.menuMain, day.menuFruit);
        const known = knownMenus.get(key);

        if (known) {
          menuId = known.id;
          menuName = known.name;
          reusedMenus++;
        } else {
          menuName = composeMenuName(day.menuMain, day.menuFruit);
          menuCreated = true;
          createdMenus++;

          if (!dryRun) {
            const created = await catalogRepository.insertMenu(db, {
              name: menuName,
            });
            menuId = created.id;
            createdMenuIds.push(created.id);
            await catalogRepository.replaceMenuItems(db, created.id, [
              {
                name: day.menuMain,
                itemType: "main" as MenuItemType,
                categoryId:
                  categoryIdBySlug.get(
                    guessCategorySlug(day.menuMain, "main"),
                  ) ?? null,
              },
              ...(day.menuFruit
                ? [
                    {
                      name: day.menuFruit,
                      itemType: "fruit" as MenuItemType,
                      categoryId:
                        categoryIdBySlug.get(
                          guessCategorySlug(day.menuFruit, "fruit"),
                        ) ?? null,
                    },
                  ]
                : []),
            ]);
          }

          // Dicatat juga saat pratinjau: menu yang sama pada tanggal
          // berikutnya tidak boleh terhitung "baru" dua kali.
          knownMenus.set(key, { id: menuId, name: menuName });
        }
      }

      const classesCreated: string[] = [];
      const classesSkipped: string[] = [];

      for (const className of classes) {
        const key = `${day.date}|${className}`;
        if (occupied.has(key)) {
          classesSkipped.push(className);
          continue;
        }

        classesCreated.push(className);
        // Ditandai terisi supaya tanggal yang muncul dua kali dalam satu
        // tempelan tidak menghasilkan dua baris untuk kelas yang sama.
        occupied.add(key);

        if (dryRun) continue;

        const weekStart = startOfWeek(day.date);
        let weekId = weekIdByStart.get(weekStart);
        if (weekId === undefined) {
          weekId = (await scheduleRepository.ensureWeek(db, day.date)).id;
          weekIdByStart.set(weekStart, weekId);
        }

        pendingRows.push({
          weekId,
          scheduleDate: day.date,
          dayOfWeek: dayOfWeek(day.date),
          className,
          menuId,
          isHoliday: day.isHoliday ? 1 : 0,
          notes: day.notes,
          // Selalu `draft` — hasil tempelan masih harus ditinjau, dikunci,
          // lalu dipublikasikan seperti jadwal yang disusun lewat layar.
          status: "draft",
        });
      }

      outcomes.push({
        date: day.date,
        dayName: day.dayName,
        menuText: day.menuText,
        isHoliday: day.isHoliday,
        menuName,
        menuCreated,
        outcome: classesCreated.length > 0 ? "create" : "skip",
        reason:
          classesCreated.length > 0
            ? null
            : "Semua kelas sudah punya jadwal pada tanggal ini",
        classesCreated,
        classesSkipped,
      });
    }

    const createdRows = outcomes.reduce(
      (total, day) => total + day.classesCreated.length,
      0,
    );
    const skippedRows = outcomes.reduce(
      (total, day) => total + day.classesSkipped.length,
      0,
    );

    if (!dryRun) {
      try {
        await scheduleRepository.insertSchedules(db, pendingRows);
      } catch (error) {
        // D1 tidak punya transaksi interaktif, dan menu harus dibuat lebih
        // dulu karena baris jadwal merujuk id-nya. Jadi kalau penyisipan
        // jadwal gagal, menu yang terlanjur dibuat dibersihkan di sini —
        // supaya katalog tidak menyimpan menu yatim.
        await catalogRepository.deleteMenus(db, createdMenuIds);
        throw error;
      }

      await scheduleRepository.insertImportLog(db, {
        sourceFile: "tempelan-jadwal",
        recordsAdded: createdRows,
        status: parsed.issues.length > 0 ? "partial" : "success",
        errorMessage:
          parsed.issues.length > 0
            ? parsed.issues
                .map((issue) => `baris ${issue.line}: ${issue.message}`)
                .join("; ")
            : null,
      });
    }

    return {
      dryRun,
      parsedDays: days.length,
      blocks: parsed.blocks.length,
      createdRows,
      skippedRows,
      createdMenus,
      reusedMenus,
      classes,
      days: outcomes,
      warnings: parsed.warnings,
      issues: parsed.issues,
    };
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
