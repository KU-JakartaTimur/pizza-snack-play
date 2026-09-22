import type { Context } from "hono";
import { getDb } from "../../database/db";
import {
  responseBadRequest,
  responseNotFound,
  responseOK,
  responseUnauthorized,
} from "../utils/response";
import type { AuthEnv } from "../middleware/auth";
import { parseId } from "../utils/params";
import { authService, resolveExpiresIn } from "./service";

type AuthContext = Context<AuthEnv>;

interface LoginBody {
  username?: unknown;
  password?: unknown;
}

interface ChangePasswordBody {
  currentPassword?: unknown;
  newPassword?: unknown;
}

interface ImpersonateBody {
  /** `users.id` akun yang akan dibuka sesinya. */
  userId?: unknown;
}

const MIN_PASSWORD_LENGTH = 8;

class AuthController {
  login = async (c: AuthContext) => {
    let body: LoginBody;
    try {
      body = await c.req.json<LoginBody>();
    } catch {
      return responseBadRequest(c, "Body harus berupa JSON");
    }

    const { username, password } = body;

    if (typeof username !== "string" || typeof password !== "string") {
      return responseBadRequest(c, "Username dan password wajib diisi");
    }

    if (!username.trim() || !password) {
      return responseBadRequest(c, "Username dan password wajib diisi");
    }

    const result = await authService.login(getDb(c.env), {
      username: username.trim(),
      password,
      secret: c.env.JWT_SECRET,
      expiresIn: resolveExpiresIn(c.env.JWT_EXPIRES_IN),
    });

    if (result === "inactive") {
      return responseUnauthorized(c, "Akun dinonaktifkan. Hubungi admin.");
    }

    if (result === "invalid_credentials") {
      // Pesan sengaja generik agar tidak membocorkan username mana yang ada.
      return responseUnauthorized(c, "Username atau password salah");
    }

    return responseOK(c, "Login berhasil", result);
  };

  /**
   * "Login as" — admin membuka sesi atas nama korlas/orang tua tanpa password.
   *
   * Dijaga `requireRole("admin")` di route. Token yang dikembalikan berisi
   * identitas target apa adanya, jadi tidak ada wewenang yang bertambah:
   * admin hanya melihat apa yang dilihat akun itu.
   */
  impersonate = async (c: AuthContext) => {
    let body: ImpersonateBody;
    try {
      body = await c.req.json<ImpersonateBody>();
    } catch {
      return responseBadRequest(c, "Body harus berupa JSON");
    }

    // `userId` boleh datang sebagai angka maupun teks dari klien.
    const { userId: rawUserId } = body;
    const userId = parseId(
      typeof rawUserId === "number" || typeof rawUserId === "string"
        ? String(rawUserId)
        : undefined,
    );
    if (userId === null) {
      return responseBadRequest(c, "`userId` tidak valid");
    }

    const result = await authService.impersonate(getDb(c.env), {
      userId,
      secret: c.env.JWT_SECRET,
      expiresIn: resolveExpiresIn(c.env.JWT_EXPIRES_IN),
    });

    if (result === "not_found") {
      return responseNotFound(c, "Akun tidak ditemukan");
    }

    if (result === "inactive") {
      return responseBadRequest(
        c,
        "Akun sedang nonaktif. Aktifkan dulu sebelum masuk sebagai akun ini.",
      );
    }

    if (result === "not_impersonable") {
      return responseBadRequest(
        c,
        "Login as hanya untuk akun orang tua atau korlas",
      );
    }

    const { fullName, username } = result.user;

    return responseOK(c, `Masuk sebagai ${fullName ?? username}`, result);
  };

  /**
   * JWT bersifat stateless — logout cukup dengan membuang token di sisi klien.
   * Endpoint ini disediakan agar klien punya satu titik keluar yang eksplisit.
   */
  logout = async (c: AuthContext) => {
    return responseOK(c, "Logout berhasil");
  };

  me = async (c: AuthContext) => {
    const { sub } = c.get("user");
    const profile = await authService.getProfile(getDb(c.env), sub);

    if (!profile) {
      return responseNotFound(c, "User tidak ditemukan");
    }

    return responseOK(c, "Profil berhasil diambil", profile);
  };

  changePassword = async (c: AuthContext) => {
    let body: ChangePasswordBody;
    try {
      body = await c.req.json<ChangePasswordBody>();
    } catch {
      return responseBadRequest(c, "Body harus berupa JSON");
    }

    const { currentPassword, newPassword } = body;

    if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
      return responseBadRequest(c, "Password lama dan baru wajib diisi");
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return responseBadRequest(
        c,
        `Password baru minimal ${MIN_PASSWORD_LENGTH} karakter`,
      );
    }

    if (newPassword === currentPassword) {
      return responseBadRequest(c, "Password baru harus berbeda dari yang lama");
    }

    const { sub } = c.get("user");
    const changed = await authService.changePassword(
      getDb(c.env),
      sub,
      currentPassword,
      newPassword,
    );

    if (!changed) {
      return responseUnauthorized(c, "Password lama salah");
    }

    return responseOK(c, "Password berhasil diubah");
  };
}

export const authController = new AuthController();
