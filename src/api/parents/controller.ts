import type { Context } from "hono";
import { getDb } from "../../database/db";
import type { ParentInput, ParentRelationship } from "../../types/account";
import type { AuthEnv } from "../middleware/auth";
import { parseId } from "../utils/params";
import {
  responseBadRequest,
  responseConflict,
  responseCreated,
  responseNotFound,
  responseOK,
} from "../utils/response";
import { RELATIONSHIPS, parentService, type ParentError } from "./service";

type ParentContext = Context<AuthEnv>;

const USERNAME_PATTERN = /^[a-z0-9._-]{3,32}$/;
const MIN_PASSWORD_LENGTH = 8;

function mapError(c: ParentContext, error: ParentError) {
  switch (error) {
    case "not_found":
      return responseNotFound(c, "Data orang tua tidak ditemukan");
    case "duplicate_username":
      return responseConflict(c, "Username sudah dipakai");
    case "invalid_relationship":
      return responseBadRequest(
        c,
        `Hubungan harus salah satu dari: ${RELATIONSHIPS.join(", ")}`,
      );
  }
}

/** Validasi umum untuk create & update. `requireAll` = true saat create. */
function validateInput(
  body: Partial<ParentInput>,
  requireAll: boolean,
): string | null {
  const need = (value: unknown) =>
    requireAll && (typeof value !== "string" || !value.trim());

  if (need(body.username)) return "`username` wajib diisi";
  if (need(body.parentName)) return "`parentName` wajib diisi";
  if (need(body.studentName)) return "`studentName` wajib diisi";
  if (requireAll && (typeof body.password !== "string" || !body.password)) {
    return "`password` wajib diisi";
  }

  if (body.username !== undefined) {
    if (typeof body.username !== "string") return "`username` harus teks";
    if (!USERNAME_PATTERN.test(body.username.trim().toLowerCase())) {
      return "Username 3–32 karakter, hanya huruf kecil, angka, titik, garis bawah, atau strip";
    }
  }

  if (body.password !== undefined && body.password !== "") {
    if (typeof body.password !== "string") return "`password` harus teks";
    if (body.password.length < MIN_PASSWORD_LENGTH) {
      return `Password minimal ${MIN_PASSWORD_LENGTH} karakter`;
    }
  }

  if (
    body.relationship !== undefined &&
    !RELATIONSHIPS.includes(body.relationship as ParentRelationship)
  ) {
    return `Hubungan harus salah satu dari: ${RELATIONSHIPS.join(", ")}`;
  }

  if (body.isActive !== undefined && typeof body.isActive !== "boolean") {
    return "`isActive` harus boolean";
  }

  return null;
}

class ParentController {
  list = async (c: ParentContext) => {
    const page = Number.parseInt(c.req.query("page") ?? "1", 10);
    const perPage = Number.parseInt(c.req.query("perPage") ?? "20", 10);
    const activeRaw = c.req.query("active");

    const data = await parentService.list(getDb(c.env), {
      search: c.req.query("search")?.trim() || undefined,
      active:
        activeRaw === undefined ? undefined : activeRaw === "true",
      page: Number.isInteger(page) ? page : 1,
      perPage: Number.isInteger(perPage) ? perPage : 20,
    });

    return responseOK(c, "Daftar orang tua", data);
  };

  detail = async (c: ParentContext) => {
    const id = parseId(c.req.param("id"));
    if (id === null) return responseBadRequest(c, "ID tidak valid");

    const data = await parentService.getById(getDb(c.env), id);
    if (!data) return responseNotFound(c, "Data orang tua tidak ditemukan");

    return responseOK(c, "Detail orang tua", data);
  };

  create = async (c: ParentContext) => {
    let body: Partial<ParentInput>;
    try {
      body = await c.req.json<Partial<ParentInput>>();
    } catch {
      return responseBadRequest(c, "Body harus berupa JSON");
    }

    const error = validateInput(body, true);
    if (error) return responseBadRequest(c, error);

    const result = await parentService.create(getDb(c.env), {
      username: body.username!,
      password: body.password!,
      parentName: body.parentName!,
      studentName: body.studentName!,
      studentClass: body.studentClass ?? null,
      relationship: body.relationship ?? "ibu",
      phone: body.phone ?? null,
      address: body.address ?? null,
      email: body.email ?? null,
      isActive: body.isActive,
    });

    if (typeof result === "string") return mapError(c, result);
    return responseCreated(c, "Akun orang tua berhasil dibuat", result);
  };

  update = async (c: ParentContext) => {
    const id = parseId(c.req.param("id"));
    if (id === null) return responseBadRequest(c, "ID tidak valid");

    let body: Partial<ParentInput>;
    try {
      body = await c.req.json<Partial<ParentInput>>();
    } catch {
      return responseBadRequest(c, "Body harus berupa JSON");
    }

    const error = validateInput(body, false);
    if (error) return responseBadRequest(c, error);

    const result = await parentService.update(getDb(c.env), id, body);
    if (typeof result === "string") return mapError(c, result);

    return responseOK(c, "Data orang tua berhasil diperbarui", result);
  };

  remove = async (c: ParentContext) => {
    const id = parseId(c.req.param("id"));
    if (id === null) return responseBadRequest(c, "ID tidak valid");

    const hard = c.req.query("hard") === "true";
    const result = await parentService.remove(getDb(c.env), id, { hard });
    if (result === "not_found") return mapError(c, result);

    return responseOK(
      c,
      result === "deleted"
        ? "Akun orang tua berhasil dihapus"
        : "Akun orang tua dinonaktifkan",
      { action: result },
    );
  };

  resetPassword = async (c: ParentContext) => {
    const id = parseId(c.req.param("id"));
    if (id === null) return responseBadRequest(c, "ID tidak valid");

    let body: { newPassword?: unknown };
    try {
      body = await c.req.json();
    } catch {
      return responseBadRequest(c, "Body harus berupa JSON");
    }

    if (typeof body.newPassword !== "string" || !body.newPassword) {
      return responseBadRequest(c, "`newPassword` wajib diisi");
    }
    if (body.newPassword.length < MIN_PASSWORD_LENGTH) {
      return responseBadRequest(
        c,
        `Password minimal ${MIN_PASSWORD_LENGTH} karakter`,
      );
    }

    const result = await parentService.resetPassword(
      getDb(c.env),
      id,
      body.newPassword,
    );
    if (result !== true) return mapError(c, result);

    return responseOK(c, "Password berhasil direset");
  };
}

export const parentController = new ParentController();
