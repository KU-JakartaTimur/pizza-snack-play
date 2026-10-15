import type { Context } from "hono";
import { getDb } from "../../database/db";
import { authService } from "../auth/service";
import type { AuthEnv } from "../middleware/auth";
import { parseId } from "../utils/params";
import { MAX_PHONE_DIGITS, MIN_PHONE_DIGITS } from "../utils/phone";
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
  type AccountForm,
  type ProfileError,
  type StudentForm,
} from "./service";

type ProfileContext = Context<AuthEnv>;

interface StudentBody {
  name?: unknown;
  className?: unknown;
}

interface AccountBody {
  fullName?: unknown;
  relationship?: unknown;
  phone?: unknown;
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
    case "invalid_relationship":
      return responseBadRequest(c, "Hubungan harus salah satu dari: Ibu, Ayah, Wali");
    case "invalid_phone":
      return responseBadRequest(
        c,
        `Nomor WhatsApp harus ${MIN_PHONE_DIGITS}–${MAX_PHONE_DIGITS} digit angka, boleh diawali +62`,
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

/**
 * Ambil body sebagai objek; `null` bila bukan JSON yang sah.
 *
 * Generik karena modul ini punya dua bentuk body (anak & akun) — isinya
 * divalidasi terpisah oleh `validateBody`/`validateAccountBody`, sehingga
 * di sini cukup dipastikan bentuk terluarnya memang objek JSON.
 */
async function readBody<T extends object>(c: ProfileContext): Promise<T | null> {
  try {
    const body = await c.req.json<unknown>();
    if (typeof body !== "object" || body === null || Array.isArray(body)) return null;
    return body as T;
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

/**
 * Validasi body data akun. Seluruh field opsional, tetapi field yang **ada**
 * harus bertipe benar — memeriksa di sini membuat service bisa bekerja dengan
 * bentuk yang sudah pasti, dan pesannya bisa menyebut field yang salah.
 *
 * Aturan isinya sendiri (panjang nama, daftar hubungan, bentuk nomor) sengaja
 * tidak diduplikasi di sini: itu wewenang service, yang mengembalikan
 * `invalid_name`/`invalid_relationship`/`invalid_phone`.
 */
function validateAccountBody(body: AccountBody): string | null {
  if (body.fullName !== undefined && typeof body.fullName !== "string") {
    return "`fullName` harus berupa teks";
  }

  if (body.relationship !== undefined && typeof body.relationship !== "string") {
    return "`relationship` harus berupa teks";
  }

  // `null` berarti nomornya dikosongkan.
  if (
    body.phone !== undefined &&
    body.phone !== null &&
    typeof body.phone !== "string"
  ) {
    return "`phone` harus berupa teks atau null";
  }

  return null;
}

/** Terjemahkan body data akun menjadi `AccountForm` untuk service. */
function toAccountForm(body: AccountBody): AccountForm {
  return {
    ...(body.fullName !== undefined ? { fullName: body.fullName as string } : {}),
    ...(body.relationship !== undefined
      ? { relationship: body.relationship as string }
      : {}),
    ...(body.phone !== undefined
      ? { phone: body.phone === null ? null : (body.phone as string) }
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
    const body = await readBody<StudentBody>(c);
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

    const body = await readBody<StudentBody>(c);
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

  /**
   * `PUT /api/profile/account` — ubah data akun sendiri: nama sapaan,
   * hubungan dengan siswa, dan nomor WhatsApp.
   *
   * `username` dan `peran` sengaja tidak bisa diubah dari sini; keduanya
   * wewenang admin (lihat `AccountUpdateInput` di `src/types/auth.ts`).
   *
   * Jawabannya berbentuk sama dengan `GET /auth/me` (`{ user }`), sehingga
   * pemanggilnya langsung memegang profil terbaru — tidak perlu menebak apa
   * yang berubah, dan `refresh()` di klien memakai jalur yang sudah ada.
   */
  updateAccount = async (c: ProfileContext) => {
    const body = await readBody<AccountBody>(c);
    if (body === null) return responseBadRequest(c, "Body harus berupa JSON");

    const error = validateAccountBody(body);
    if (error) return responseBadRequest(c, error);

    const user = c.get("user");
    const result = await profileService.updateAccount(
      getDb(c.env),
      user,
      toAccountForm(body),
    );
    if (result !== true) return mapError(c, result);

    const profile = await authService.getProfile(getDb(c.env), user.sub);
    if (!profile) return responseNotFound(c, "User tidak ditemukan");

    return responseOK(c, "Data akun berhasil diperbarui", profile);
  };
}

export const profileController = new ProfileController();
