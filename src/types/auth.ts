export type Role = "admin" | "parent";

/** Payload yang disimpan di dalam JWT. */
export interface JwtPayload {
  /** user id */
  sub: number;
  username: string;
  role: Role;
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
