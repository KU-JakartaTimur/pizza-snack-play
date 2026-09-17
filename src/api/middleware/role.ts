import { createMiddleware } from "hono/factory";
import type { Role } from "../../types/auth";
import { responseForbidden } from "../utils/response";
import type { AuthEnv } from "./auth";

/**
 * Batasi akses berdasarkan role. Harus dipasang SETELAH `requireAuth`.
 *
 * Contoh: `app.post("/", requireAuth, requireRole("admin"), handler)`
 */
export const requireRole = (...roles: Role[]) =>
  createMiddleware<AuthEnv>(async (c, next) => {
    const user = c.get("user");

    if (!user) {
      return responseForbidden(c, "Akses ditolak");
    }

    if (!roles.includes(user.role)) {
      return responseForbidden(
        c,
        `Akses ditolak — diperlukan role: ${roles.join(" atau ")}`,
      );
    }

    await next();
  });
