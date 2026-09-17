import type { Context } from "hono";
import { getDb } from "../../database/db";
import type { ScheduleInput } from "../../types/schedule";
import type { AuthEnv } from "../middleware/auth";
import { isIsoDate } from "../utils/date";
import { parseId, validateRange } from "../utils/params";
import {
  responseBadRequest,
  responseConflict,
  responseCreated,
  responseNotFound,
  responseOK,
} from "../utils/response";
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
  }
}

class ScheduleController {
  // ── Pembacaan ───────────────────────────────────────────────

  today = async (c: ScheduleContext) => {
    const data = await scheduleService.getToday(getDb(c.env));
    return responseOK(c, "Jadwal hari ini", data);
  };

  week = async (c: ScheduleContext) => {
    const date = c.req.query("date");

    if (date !== undefined && !isIsoDate(date)) {
      return responseBadRequest(c, "Parameter `date` harus format YYYY-MM-DD");
    }

    const data = await scheduleService.getWeek(getDb(c.env), date);
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

    const data = await scheduleService.getMonth(getDb(c.env), year, month);
    return responseOK(c, "Jadwal bulanan", data);
  };

  range = async (c: ScheduleContext) => {
    const from = c.req.query("from");
    const to = c.req.query("to");

    const error = validateRange(from, to);
    if (error) return responseBadRequest(c, error);

    const data = await scheduleService.getRange(getDb(c.env), from!, to!);
    return responseOK(c, "Jadwal rentang", data);
  };

  detail = async (c: ScheduleContext) => {
    const id = parseId(c.req.param("id"));
    if (id === null) return responseBadRequest(c, "ID tidak valid");

    const data = await scheduleService.getById(getDb(c.env), id);
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

  // ── Penulisan (admin) ───────────────────────────────────────

  create = async (c: ScheduleContext) => {
    let body: Partial<ScheduleInput>;
    try {
      body = await c.req.json<Partial<ScheduleInput>>();
    } catch {
      return responseBadRequest(c, "Body harus berupa JSON");
    }

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

    const result = await scheduleService.createSchedule(getDb(c.env), {
      scheduleDate: body.scheduleDate,
      menuId: body.menuId ?? null,
      isHoliday: body.isHoliday === true,
      notes: typeof body.notes === "string" ? body.notes : null,
    });

    if (typeof result === "string") return mapError(c, result);
    return responseCreated(c, "Jadwal berhasil dibuat", result);
  };

  update = async (c: ScheduleContext) => {
    const id = parseId(c.req.param("id"));
    if (id === null) return responseBadRequest(c, "ID tidak valid");

    let body: Partial<ScheduleInput>;
    try {
      body = await c.req.json<Partial<ScheduleInput>>();
    } catch {
      return responseBadRequest(c, "Body harus berupa JSON");
    }

    const result = await scheduleService.updateSchedule(getDb(c.env), id, {
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

    const removed = await scheduleService.deleteSchedule(getDb(c.env), id);
    if (!removed) return responseNotFound(c, "Jadwal tidak ditemukan");

    return responseOK(c, "Jadwal berhasil dihapus");
  };

  // ── Hari libur ──────────────────────────────────────────────

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
