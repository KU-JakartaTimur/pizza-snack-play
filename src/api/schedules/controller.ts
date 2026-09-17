import type { Context } from "hono";
import { getDb } from "../../database/db";
import type { CopyWeekInput, ScheduleInput } from "../../types/schedule";
import type { AuthEnv } from "../middleware/auth";
import {
  canWriteClass,
  resolveReadClass,
  resolveWriteClass,
  type ClassScopeError,
} from "../utils/classScope";
import { isIsoDate } from "../utils/date";
import { MAX_SEARCH_DAYS, parseId, validateRange } from "../utils/params";
import {
  responseBadRequest,
  responseConflict,
  responseCreated,
  responseForbidden,
  responseNotFound,
  responseOK,
} from "../utils/response";
import { scheduleRepository } from "./repository";
import { scheduleService, type ScheduleError } from "./service";

type ScheduleContext = Context<AuthEnv>;

function mapError(c: ScheduleContext, error: ScheduleError) {
  switch (error) {
    case "not_found":
      return responseNotFound(c, "Jadwal tidak ditemukan");
    case "duplicate_date":
      return responseConflict(c, "Sudah ada jadwal pada tanggal tersebut");
    case "menu_not_found":
      return responseBadRequest(c, "Menu tidak ditemukan");
    case "same_week":
      return responseBadRequest(c, "Minggu sumber dan tujuan sama");
    case "forbidden_class":
      return responseForbidden(c, "Kelas ini bukan cakupan Anda");
  }
}

function mapScopeError(c: ScheduleContext, error: ClassScopeError) {
  return error === "class_required"
    ? responseBadRequest(c, "Parameter `class` wajib diisi")
    : responseForbidden(c, "Kelas ini bukan cakupan Anda");
}

const FORBIDDEN_CLASS = "Kelas ini bukan cakupan Anda";

class ScheduleController {
  // ── Pembacaan ───────────────────────────────────────────────

  /**
   * Semua endpoint baca menerima `?class=` opsional. Bila kosong, kelas
   * default user dipakai — sehingga halaman orang tua tidak perlu tahu
   * kelas anaknya, dan korlas otomatis terarah ke kelasnya sendiri.
   */
  today = async (c: ScheduleContext) => {
    const db = getDb(c.env);
    const scope = await resolveReadClass(db, c.get("user"), c.req.query("class"));
    if (!scope.ok) return mapScopeError(c, scope.error);

    const data = await scheduleService.getToday(db, scope.className);
    return responseOK(c, "Jadwal hari ini", data);
  };

  week = async (c: ScheduleContext) => {
    const date = c.req.query("date");

    if (date !== undefined && !isIsoDate(date)) {
      return responseBadRequest(c, "Parameter `date` harus format YYYY-MM-DD");
    }

    const db = getDb(c.env);
    const scope = await resolveReadClass(db, c.get("user"), c.req.query("class"));
    if (!scope.ok) return mapScopeError(c, scope.error);

    const data = await scheduleService.getWeek(db, scope.className, date);
    return responseOK(c, "Jadwal mingguan", data);
  };

  month = async (c: ScheduleContext) => {
    const year = Number.parseInt(c.req.query("year") ?? "", 10);
    const month = Number.parseInt(c.req.query("month") ?? "", 10);

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return responseBadRequest(c, "Parameter `year` tidak valid");
    }
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      return responseBadRequest(c, "Parameter `month` harus 1–12");
    }

    const db = getDb(c.env);
    const scope = await resolveReadClass(db, c.get("user"), c.req.query("class"));
    if (!scope.ok) return mapScopeError(c, scope.error);

    const data = await scheduleService.getMonth(
      db,
      year,
      month,
      scope.className,
    );
    return responseOK(c, "Jadwal bulanan", data);
  };

  range = async (c: ScheduleContext) => {
    const from = c.req.query("from");
    const to = c.req.query("to");

    const error = validateRange(from, to);
    if (error) return responseBadRequest(c, error);

    const db = getDb(c.env);
    const scope = await resolveReadClass(db, c.get("user"), c.req.query("class"));
    if (!scope.ok) return mapScopeError(c, scope.error);

    const data = await scheduleService.getRange(db, from!, to!, scope.className);
    return responseOK(c, "Jadwal rentang", data);
  };

  detail = async (c: ScheduleContext) => {
    const id = parseId(c.req.param("id"));
    if (id === null) return responseBadRequest(c, "ID tidak valid");

    const db = getDb(c.env);
    const current = await scheduleRepository.findScheduleById(db, id);
    if (!current) return responseNotFound(c, "Jadwal tidak ditemukan");

    // Baris ini milik kelas tertentu — pastikan user memang berhak melihatnya.
    if (!canWriteClass(c.get("user"), current.className)) {
      const allowed = await resolveReadClass(db, c.get("user"), current.className);
      if (!allowed.ok) return responseForbidden(c, FORBIDDEN_CLASS);
    }

    const data = await scheduleService.getById(db, id);
    if (!data) return responseNotFound(c, "Jadwal tidak ditemukan");

    return responseOK(c, "Detail jadwal", data);
  };

  weeks = async (c: ScheduleContext) => {
    const year = Number.parseInt(c.req.query("year") ?? "", 10);
    const month = Number.parseInt(c.req.query("month") ?? "", 10);

    if (!Number.isInteger(year) || !Number.isInteger(month)) {
      return responseBadRequest(c, "Parameter `year` dan `month` wajib diisi");
    }

    const data = await scheduleService.listWeeks(getDb(c.env), year, month);
    return responseOK(c, "Daftar minggu", data);
  };

  /**
   * Cari tanggal di mana sebuah menu/komponen pernah dijadwalkan.
   * `GET /schedules/search?q=jeruk&from=…&to=…&class=1A`
   */
  search = async (c: ScheduleContext) => {
    const query = c.req.query("q");
    const from = c.req.query("from");
    const to = c.req.query("to");

    if (query === undefined || !query.trim()) {
      return responseBadRequest(c, "Parameter `q` wajib diisi");
    }

    const error = validateRange(from, to, MAX_SEARCH_DAYS);
    if (error) return responseBadRequest(c, error);

    const db = getDb(c.env);
    const scope = await resolveReadClass(db, c.get("user"), c.req.query("class"));
    if (!scope.ok) return mapScopeError(c, scope.error);

    const data = await scheduleService.searchMenuHistory(
      db,
      query,
      from!,
      to!,
      scope.className,
    );
    return responseOK(c, "Riwayat menu", data);
  };

  // ── Penulisan (admin & korlas) ──────────────────────────────

  create = async (c: ScheduleContext) => {
    let body: Partial<ScheduleInput>;
    try {
      body = await c.req.json<Partial<ScheduleInput>>();
    } catch {
      return responseBadRequest(c, "Body harus berupa JSON");
    }

    const scope = resolveWriteClass(
      c.get("user"),
      typeof body.className === "string" ? body.className : null,
    );
    if (!scope.ok) return mapScopeError(c, scope.error);

    if (!isIsoDate(body.scheduleDate)) {
      return responseBadRequest(c, "`scheduleDate` wajib format YYYY-MM-DD");
    }
    if (
      body.menuId !== undefined &&
      body.menuId !== null &&
      !Number.isInteger(body.menuId)
    ) {
      return responseBadRequest(c, "`menuId` harus berupa angka");
    }

    const result = await scheduleService.createSchedule(
      getDb(c.env),
      scope.className!,
      {
        scheduleDate: body.scheduleDate,
        menuId: body.menuId ?? null,
        isHoliday: body.isHoliday === true,
        notes: typeof body.notes === "string" ? body.notes : null,
      },
    );

    if (typeof result === "string") return mapError(c, result);
    return responseCreated(c, "Jadwal berhasil dibuat", result);
  };

  /**
   * Kelas sebuah baris jadwal **tidak bisa dipindah** lewat update — kelasnya
   * ditentukan baris itu sendiri. Untuk kelas lain, buat baris baru.
   */
  update = async (c: ScheduleContext) => {
    const id = parseId(c.req.param("id"));
    if (id === null) return responseBadRequest(c, "ID tidak valid");

    const db = getDb(c.env);
    const current = await scheduleRepository.findScheduleById(db, id);
    if (!current) return responseNotFound(c, "Jadwal tidak ditemukan");

    if (!canWriteClass(c.get("user"), current.className)) {
      return responseForbidden(c, FORBIDDEN_CLASS);
    }

    let body: Partial<ScheduleInput>;
    try {
      body = await c.req.json<Partial<ScheduleInput>>();
    } catch {
      return responseBadRequest(c, "Body harus berupa JSON");
    }

    const result = await scheduleService.updateSchedule(db, id, {
      ...(body.menuId !== undefined ? { menuId: body.menuId } : {}),
      ...(body.isHoliday !== undefined ? { isHoliday: body.isHoliday } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
    });

    if (typeof result === "string") return mapError(c, result);
    return responseOK(c, "Jadwal berhasil diperbarui", result);
  };

  remove = async (c: ScheduleContext) => {
    const id = parseId(c.req.param("id"));
    if (id === null) return responseBadRequest(c, "ID tidak valid");

    const db = getDb(c.env);
    const current = await scheduleRepository.findScheduleById(db, id);
    if (!current) return responseNotFound(c, "Jadwal tidak ditemukan");

    if (!canWriteClass(c.get("user"), current.className)) {
      return responseForbidden(c, FORBIDDEN_CLASS);
    }

    const removed = await scheduleService.deleteSchedule(db, id);
    if (!removed) return responseNotFound(c, "Jadwal tidak ditemukan");

    return responseOK(c, "Jadwal berhasil dihapus");
  };

  /**
   * Salin jadwal Senin–Jumat dari satu minggu ke minggu lain, untuk satu kelas.
   * `POST /schedules/copy` dengan `{ fromDate, toDate, className, overwrite? }`
   */
  copy = async (c: ScheduleContext) => {
    let body: Partial<CopyWeekInput>;
    try {
      body = await c.req.json<Partial<CopyWeekInput>>();
    } catch {
      return responseBadRequest(c, "Body harus berupa JSON");
    }

    const scope = resolveWriteClass(
      c.get("user"),
      typeof body.className === "string" ? body.className : null,
    );
    if (!scope.ok) return mapScopeError(c, scope.error);

    if (!isIsoDate(body.fromDate)) {
      return responseBadRequest(c, "`fromDate` wajib format YYYY-MM-DD");
    }
    if (!isIsoDate(body.toDate)) {
      return responseBadRequest(c, "`toDate` wajib format YYYY-MM-DD");
    }

    const result = await scheduleService.copyWeek(getDb(c.env), scope.className!, {
      fromDate: body.fromDate,
      toDate: body.toDate,
      overwrite: body.overwrite === true,
    });

    if (typeof result === "string") return mapError(c, result);
    return responseCreated(c, "Jadwal berhasil disalin", result);
  };

  // ── Hari libur (tetap global, khusus admin) ─────────────────

  listHolidays = async (c: ScheduleContext) => {
    const from = c.req.query("from");
    const to = c.req.query("to");

    if (from !== undefined || to !== undefined) {
      const error = validateRange(from, to);
      if (error) return responseBadRequest(c, error);
    }

    const data = await scheduleService.listHolidays(
      getDb(c.env),
      from ?? "0000-01-01",
      to ?? "9999-12-31",
    );
    return responseOK(c, "Daftar hari libur", data);
  };

  createHoliday = async (c: ScheduleContext) => {
    let body: { date?: unknown; name?: unknown; description?: unknown };
    try {
      body = await c.req.json();
    } catch {
      return responseBadRequest(c, "Body harus berupa JSON");
    }

    if (!isIsoDate(body.date)) {
      return responseBadRequest(c, "`date` wajib format YYYY-MM-DD");
    }
    if (typeof body.name !== "string" || !body.name.trim()) {
      return responseBadRequest(c, "`name` wajib diisi");
    }

    const result = await scheduleService.createHoliday(getDb(c.env), {
      date: body.date,
      name: body.name,
      description:
        typeof body.description === "string" ? body.description : null,
    });

    if (result === "duplicate_date") {
      return responseConflict(c, "Hari libur pada tanggal tersebut sudah ada");
    }

    return responseCreated(c, "Hari libur berhasil ditambahkan", result);
  };

  deleteHoliday = async (c: ScheduleContext) => {
    const id = parseId(c.req.param("id"));
    if (id === null) return responseBadRequest(c, "ID tidak valid");

    const removed = await scheduleService.deleteHoliday(getDb(c.env), id);
    if (!removed) return responseNotFound(c, "Hari libur tidak ditemukan");

    return responseOK(c, "Hari libur berhasil dihapus");
  };
}

export const scheduleController = new ScheduleController();
