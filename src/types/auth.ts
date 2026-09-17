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
