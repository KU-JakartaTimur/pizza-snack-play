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
}

export interface StudentProfile {
  name: string;
  className: string | null;
  relationship: string;
}

export interface LoginResponse {
  token: string;
  expiresAt: number;
  user: AuthUser;
  student: StudentProfile | null;
}

export interface ProfileResponse {
  user: AuthUser;
  student: StudentProfile | null;
}
