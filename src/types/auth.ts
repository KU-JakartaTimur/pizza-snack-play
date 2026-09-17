/**
 * Role pengguna.
 *
 * - `admin`  — akses penuh: jadwal semua kelas, katalog, akun, hari libur.
 * - `korlas` — koordinator kelas (orang tua yang ditunjuk): boleh mengubah
 *              jadwal **kelasnya sendiri** serta mengelola katalog menu.
 * - `parent` — orang tua biasa: hanya membaca jadwal kelas anaknya.
 */
export type Role = "admin" | "korlas" | "parent";

/** Payload yang disimpan di dalam JWT. */
export interface JwtPayload {
  /** user id */
  sub: number;
  username: string;
  role: Role;
  /** Kelas yang dikoordinasi — hanya terisi untuk role `korlas`. */
  className?: string | null;
  /** Unix timestamp (detik) — wajib untuk hono/jwt */
  exp: number;
}

/** Variabel yang di-set ke Hono context oleh middleware auth. */
export interface AuthVariables {
  user: JwtPayload;
}

// ─────────────────────────────────────────────────────────────
// DTO autentikasi — dipakai bersama oleh API dan frontend.
// ─────────────────────────────────────────────────────────────

export interface AuthUser {
  id: number;
  username: string;
  fullName: string | null;
  role: Role;
  /**
   * Kelas yang dikoordinasi. Terisi hanya untuk role `korlas`,
   * mis. `"1A"`. Dipakai UI untuk mengunci pilihan kelas.
   */
  className: string | null;
  /** Hubungan dengan siswa (`ibu` | `ayah` | `wali`). Null untuk admin. */
  relationship: string | null;
  /**
   * Anak dari orang tua ini. Kosong untuk admin.
   * Satu orang tua dapat memiliki lebih dari satu anak.
   */
  students: StudentProfile[];
}

export interface StudentProfile {
  id: number;
  name: string;
  className: string | null;
}

export interface LoginResponse {
  token: string;
  expiresAt: number;
  user: AuthUser;
}

export interface ProfileResponse {
  user: AuthUser;
}
