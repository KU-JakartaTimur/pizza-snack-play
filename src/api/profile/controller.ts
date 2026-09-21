import type { Context } from "hono";
import { getDb } from "../../database/db";
import type { AuthEnv } from "../middleware/auth";
import { parseId } from "../utils/params";
import {
  responseBadRequest,
  responseCreated,
  responseForbidden,
  responseNotFound,
  responseOK,
} from "../utils/response";
import {
  MAX_CLASS_LENGTH,
  MAX_NAME_LENGTH,
  profileService,
  type ProfileError,
  type StudentForm,
} from "./service";

type ProfileContext = Context<AuthEnv>;

interface StudentBody {
  name?: unknown;
  className?: unknown;
}

/** Rapikan spasi berlebih — sama seperti yang dilakukan service. */
function tidy(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function mapError(c: ProfileContext, error: ProfileError) {
  switch (error) {
    case "not_parent":
      return responseForbidden(
        c,
        "Akun ini tidak memiliki profil orang tua, sehingga daftar anak tidak bisa diubah",
      );
    case "not_found":
      return responseNotFound(c, "Data anak tidak ditemukan");
    case "last_student":
      return responseBadRequest(
        c,
        "Minimal satu anak harus tetap terdaftar. Hubungi admin bila anak Anda sudah tidak bersekolah",
      );
    case "invalid_name":
      return responseBadRequest(
        c,
        `Nama anak wajib diisi, maksimal ${MAX_NAME_LENGTH} karakter`,
      );
    case "invalid_class":
      return responseBadRequest(
        c,
        `Kelas wajib diisi, maksimal ${MAX_CLASS_LENGTH} karakter`,
      );
  }
}

/**
 * Validasi body. `requireAll` = true saat menambah anak, saat itu nama dan
 * kelas sama-sama wajib: anak tanpa kelas tidak akan pernah punya jadwal.
 */
function validateBody(body: StudentBody, requireAll: boolean): string | null {
  if (requireAll || body.name !== undefined) {
    if (typeof body.name !== "string") return "`name` wajib diisi";
    if (!tidy(body.name)) return "Nama anak wajib diisi";
    if (tidy(body.name).length > MAX_NAME_LENGTH) {
      return `Nama anak maksimal ${MAX_NAME_LENGTH} karakter`;
    }
  }

  if (requireAll || body.className !== undefined) {
    // Saat mengubah, `null` berarti kelas dikosongkan.
    const clearable = !requireAll && body.className === null;
    if (!clearable) {
      if (typeof body.className !== "string") return "`className` wajib diisi";
      if (!tidy(body.className)) return "Kelas wajib diisi";
      if (tidy(body.className).length > MAX_CLASS_LENGTH) {
        return `Nama kelas maksimal ${MAX_CLASS_LENGTH} karakter`;
      }
    }
  }

  return null;
}

/** Ambil body sebagai objek; `null` bila bukan JSON yang sah. */
async function readBody(c: ProfileContext): Promise<StudentBody | null> {
  try {
    const body = await c.req.json<unknown>();
    if (typeof body !== "object" || body === null || Array.isArray(body)) return null;
    return body as StudentBody;
  } catch {
    return null;
  }
}

/** Terjemahkan body yang sudah valid menjadi `StudentForm` untuk service. */
function toForm(body: StudentBody): StudentForm {
  return {
    ...(body.name !== undefined ? { name: body.name as string } : {}),
    ...(body.className !== undefined
      ? { className: body.className === null ? null : (body.className as string) }
      : {}),
  };
}

class ProfileController {
  /** `GET /api/profile/students` — anak milik user yang sedang login. */
  listStudents = async (c: ProfileContext) => {
    const result = await profileService.listStudents(getDb(c.env), c.get("user"));
    if (typeof result === "string") return mapError(c, result);

    return responseOK(c, "Daftar anak", result);
  };

  /** `POST /api/profile/students` — tambah anak sendiri. */
  addStudent = async (c: ProfileContext) => {
    const body = await readBody(c);
    if (body === null) return responseBadRequest(c, "Body harus berupa JSON");

    const error = validateBody(body, true);
    if (error) return responseBadRequest(c, error);

    const result = await profileService.addStudent(
      getDb(c.env),
      c.get("user"),
      toForm(body),
    );
    if (typeof result === "string") return mapError(c, result);

    return responseCreated(c, "Anak berhasil ditambahkan", result);
  };

  /** `PUT /api/profile/students/:id` — ubah anak sendiri. */
  updateStudent = async (c: ProfileContext) => {
    const id = parseId(c.req.param("id"));
    if (id === null) return responseBadRequest(c, "ID tidak valid");

    const body = await readBody(c);
    if (body === null) return responseBadRequest(c, "Body harus berupa JSON");

    const error = validateBody(body, false);
    if (error) return responseBadRequest(c, error);

    const result = await profileService.updateStudent(
      getDb(c.env),
      c.get("user"),
      id,
      toForm(body),
    );
    if (typeof result === "string") return mapError(c, result);

    return responseOK(c, "Data anak berhasil diperbarui", result);
  };

  /** `DELETE /api/profile/students/:id` — hapus anak sendiri. */
  removeStudent = async (c: ProfileContext) => {
    const id = parseId(c.req.param("id"));
    if (id === null) return responseBadRequest(c, "ID tidak valid");

    const result = await profileService.removeStudent(
      getDb(c.env),
      c.get("user"),
      id,
    );
    if (result !== true) return mapError(c, result);

    return responseOK(c, "Data anak berhasil dihapus");
  };

  /** `GET /api/profile/classes` — saran kelas untuk kolom kelas. */
  classOptions = async (c: ProfileContext) => {
    const data = await profileService.classOptions(getDb(c.env));
    return responseOK(c, "Daftar kelas", data);
  };
}

export const profileController = new ProfileController();
