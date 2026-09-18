import type { Context } from "hono";
import { getDb } from "../../database/db";
import type { ClaimInput } from "../../types/claim";
import type { AuthEnv } from "../middleware/auth";
import { resolveReadClass } from "../utils/classScope";
import { parseId, validateRange } from "../utils/params";
import {
  responseBadRequest,
  responseConflict,
  responseCreated,
  responseForbidden,
  responseNotFound,
  responseOK,
} from "../utils/response";
import { claimService, type ClaimError } from "./service";

type ClaimContext = Context<AuthEnv>;

function mapError(c: ClaimContext, error: ClaimError, takenBy?: string) {
  switch (error) {
    case "not_parent":
      return responseForbidden(
        c,
        "Akun ini belum terhubung ke profil orang tua",
      );
    case "schedule_not_found":
      return responseNotFound(c, "Jadwal tidak ditemukan");
    case "not_published":
      return responseConflict(c, "Jadwal ini belum dipublikasi korlas");
    case "is_holiday":
      return responseBadRequest(c, "Tanggal ini hari libur — tidak ada snack");
    case "forbidden_class":
      return responseForbidden(c, "Kelas ini bukan kelas anak Anda");
    case "past_date":
      return responseConflict(c, "Tanggal ini sudah lewat");
    case "already_claimed":
      return responseConflict(
        c,
        takenBy
          ? `Yah, sudah dipilih orang tua lain — ${takenBy}`
          : "Yah, sudah dipilih orang tua lain",
      );
    case "already_mine":
      return responseConflict(c, "Tanggal ini sudah Anda pilih sebelumnya");
    case "student_not_found":
      return responseBadRequest(c, "Anak tersebut bukan anak Anda");
    case "claim_not_found":
      return responseNotFound(c, "Pilihan jadwal tidak ditemukan");
    case "not_owner":
      return responseForbidden(c, "Ini bukan pilihan Anda");
  }
}

class ClaimController {
  /**
   * Ambil satu tanggal jadwal — siapa cepat dia dapat.
   * `POST /claims` dengan `{ scheduleId, studentId?, note? }`
   */
  create = async (c: ClaimContext) => {
    let body: Partial<ClaimInput>;
    try {
      body = await c.req.json<Partial<ClaimInput>>();
    } catch {
      return responseBadRequest(c, "Body harus berupa JSON");
    }

    if (!Number.isInteger(body.scheduleId) || body.scheduleId! <= 0) {
      return responseBadRequest(c, "`scheduleId` wajib berupa angka");
    }
    if (
      body.studentId !== undefined &&
      body.studentId !== null &&
      !Number.isInteger(body.studentId)
    ) {
      return responseBadRequest(c, "`studentId` harus berupa angka");
    }

    const result = await claimService.claim(getDb(c.env), c.get("user"), {
      scheduleId: body.scheduleId!,
      studentId: body.studentId ?? null,
      note: typeof body.note === "string" ? body.note : null,
    });

    if (!result.ok) return mapError(c, result.error, result.takenBy);
    return responseCreated(c, "Tanggal berhasil diambil", result.data);
  };

  /** Batalkan pilihan. `DELETE /claims/:id` */
  remove = async (c: ClaimContext) => {
    const id = parseId(c.req.param("id"));
    if (id === null) return responseBadRequest(c, "ID tidak valid");

    const result = await claimService.release(getDb(c.env), c.get("user"), id);
    if (!result.ok) return mapError(c, result.error);

    return responseOK(c, "Pilihan jadwal dibatalkan");
  };

  /** Klaim milik sendiri. `GET /claims/mine?from=…&to=…` */
  mine = async (c: ClaimContext) => {
    const from = c.req.query("from");
    const to = c.req.query("to");

    const error = validateRange(from, to);
    if (error) return responseBadRequest(c, error);

    const result = await claimService.listMine(
      getDb(c.env),
      c.get("user"),
      from!,
      to!,
    );
    if (!result.ok) return mapError(c, result.error);

    return responseOK(c, "Pilihan jadwal saya", result.data);
  };

  /** Rekap klaim satu kelas. `GET /claims?from=…&to=…&class=1A` */
  list = async (c: ClaimContext) => {
    const from = c.req.query("from");
    const to = c.req.query("to");

    const error = validateRange(from, to);
    if (error) return responseBadRequest(c, error);

    const db = getDb(c.env);
    const scope = await resolveReadClass(db, c.get("user"), c.req.query("class"));
    if (!scope.ok) {
      return scope.error === "class_required"
        ? responseBadRequest(c, "Parameter `class` wajib diisi")
        : responseForbidden(c, "Kelas ini bukan cakupan Anda");
    }

    const data = scope.className
      ? await claimService.listByClass(db, scope.className, from!, to!)
      : [];

    return responseOK(c, "Daftar pilihan jadwal", data);
  };
}

export const claimController = new ClaimController();
