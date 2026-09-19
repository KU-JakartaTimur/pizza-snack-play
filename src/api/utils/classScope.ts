import type { Db } from "../../database/db";
import type { JwtPayload } from "../../types/auth";
import { classService } from "../classes/service";

/**
 * Penetapan cakupan kelas untuk operasi jadwal.
 *
 * Aturannya:
 * - `admin`  — boleh semua kelas, tetapi **wajib menyebut** kelas saat menulis.
 * - `korlas` — terkunci ke kelas yang dikoordinasinya, untuk baca maupun tulis.
 *              Kunci/buka kunci jadwal bukan wewenangnya — itu admin.
 * - `parent` — hanya boleh membaca kelas anak-anaknya.
 */
export type ClassScopeError = "class_required" | "forbidden_class";

export type ClassScope =
  | { ok: true; className: string | null }
  | { ok: false; error: ClassScopeError };

/**
 * Kelas efektif untuk pembacaan jadwal.
 *
 * `requested` boleh dikosongkan — saat itu kelas default user dipakai
 * (kelas anak pertama untuk orang tua, kelas pertama untuk admin).
 * `className` bernilai `null` bila user belum punya kelas sama sekali.
 */
export async function resolveReadClass(
  db: Db,
  user: JwtPayload,
  requested?: string | null,
): Promise<ClassScope> {
  const allowed = await classService.allowedClasses(db, user);
  const wanted = requested?.trim() || null;

  if (!wanted) return { ok: true, className: allowed[0] ?? null };

  if (!allowed.includes(wanted)) return { ok: false, error: "forbidden_class" };

  return { ok: true, className: wanted };
}

/**
 * Kelas efektif untuk penulisan jadwal.
 *
 * Admin wajib menyebut kelas secara eksplisit agar tidak salah tulis ke kelas
 * lain hanya karena parameternya terlewat. Korlas tidak perlu menyebut apa pun
 * dan tidak bisa menulis ke kelas lain — menyebut kelas lain dijawab
 * `forbidden_class`.
 */
export function resolveWriteClass(
  user: JwtPayload,
  requested?: string | null,
): ClassScope {
  const wanted = requested?.trim() || null;

  if (user.role === "admin") {
    return wanted
      ? { ok: true, className: wanted }
      : { ok: false, error: "class_required" };
  }

  if (user.role !== "korlas") return { ok: false, error: "forbidden_class" };

  const own = user.className?.trim() || null;
  if (!own) return { ok: false, error: "forbidden_class" };
  if (wanted && wanted !== own) return { ok: false, error: "forbidden_class" };

  return { ok: true, className: own };
}

/**
 * Bolehkah user mengubah baris jadwal milik `rowClass`?
 *
 * Dipakai saat memperbarui/menghapus baris yang sudah ada, karena kelasnya
 * ditentukan oleh baris itu sendiri, bukan oleh input klien. Korlas hanya
 * boleh menyentuh baris kelasnya.
 */
export function canWriteClass(user: JwtPayload, rowClass: string): boolean {
  if (user.role === "admin") return true;
  if (user.role === "korlas") {
    return (user.className?.trim() || "") === rowClass;
  }
  return false;
}
