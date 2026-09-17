import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";
import type { Env } from "../../database/db";
import type { AuthVariables, JwtPayload } from "../../types/auth";
import { responseUnauthorized } from "../utils/response";

export type AuthEnv = {
  Bindings: Env;
  Variables: AuthVariables;
};

/**
 * Verifikasi JWT dari header `Authorization: Bearer <token>`.
 * Bila valid, payload user disimpan di `c.get("user")`.
 */
export const requireAuth = createMiddleware<AuthEnv>(async (c, next) => {
  const header = c.req.header("Authorization");

  if (!header?.startsWith("Bearer ")) {
    return responseUnauthorized(c, "Token tidak ditemukan");
  }

  const token = header.slice("Bearer ".length).trim();

  try {
    const payload = (await verify(
      token,
      c.env.JWT_SECRET,
      "HS256",
    )) as unknown as JwtPayload;

    if (typeof payload?.sub !== "number" || !payload.role) {
      return responseUnauthorized(c, "Token tidak valid");
    }

    c.set("user", payload);
    await next();
  } catch {
    return responseUnauthorized(c, "Token tidak valid atau sudah kedaluwarsa");
  }
});
