import { sign } from "hono/jwt";
import type { Db } from "../../database/db";
import type { AuthUser, Role, StudentProfile } from "../../types/auth";
import { hashPassword, verifyPassword } from "../utils/password";
import { authRepository } from "./repository";

export type { AuthUser, StudentProfile };

export interface LoginResult {
  token: string;
  expiresAt: number;
  user: AuthUser;
  /** Profil siswa — hanya ada bila role `parent`. */
  student: StudentProfile | null;
}

export type LoginFailure = "invalid_credentials" | "inactive";

export interface LoginInput {
  username: string;
  password: string;
  /** Secret untuk signing JWT — dari `c.env.JWT_SECRET`. */
  secret: string;
  /** Masa berlaku token dalam detik. */
  expiresIn: number;
}

export const DEFAULT_EXPIRES_IN = 60 * 60 * 24 * 7; // 7 hari

/** Parse `JWT_EXPIRES_IN` dari env; fallback ke 7 hari bila tidak valid. */
export function resolveExpiresIn(raw: string | undefined): number {
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_EXPIRES_IN;
}

function toPublicUser(user: {
  id: number;
  username: string;
  fullName: string | null;
  role: string;
}): AuthUser {
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role as Role,
  };
}

class AuthService {
  /**
   * Verifikasi kredensial dan terbitkan JWT.
   * Mengembalikan string kode kegagalan bila username/password salah
   * atau akun nonaktif.
   */
  async login(db: Db, input: LoginInput): Promise<LoginResult | LoginFailure> {
    const user = await authRepository.findByUsername(db, input.username);

    if (!user) return "invalid_credentials";
    if (user.isActive !== 1) return "inactive";

    const passwordMatches = await verifyPassword(
      input.password,
      user.passwordHash,
    );
    if (!passwordMatches) return "invalid_credentials";

    const expiresAt = Math.floor(Date.now() / 1000) + input.expiresIn;

    const token = await sign(
      {
        sub: user.id,
        username: user.username,
        role: user.role,
        exp: expiresAt,
      },
      input.secret,
    );

    await authRepository.touchLastLogin(db, user.id);

    const student = await this.studentProfileFor(db, user.id, user.role);

    return {
      token,
      expiresAt,
      user: toPublicUser(user),
      student,
    };
  }

  /** Profil user yang sedang login, termasuk profil siswa bila `parent`. */
  async getProfile(db: Db, userId: number) {
    const user = await authRepository.findById(db, userId);
    if (!user) return null;

    return {
      user: toPublicUser(user),
      student: await this.studentProfileFor(db, userId, user.role),
    };
  }

  /**
   * Ubah password sendiri. Mengembalikan `false` bila password lama salah.
   */
  async changePassword(
    db: Db,
    userId: number,
    currentPassword: string,
    newPassword: string,
  ): Promise<boolean> {
    const user = await authRepository.findById(db, userId);
    if (!user) return false;

    const matches = await verifyPassword(currentPassword, user.passwordHash);
    if (!matches) return false;

    const newHash = await hashPassword(newPassword);
    await authRepository.updatePassword(db, userId, newHash);
    return true;
  }

  private async studentProfileFor(
    db: Db,
    userId: number,
    role: string,
  ): Promise<StudentProfile | null> {
    if (role !== "parent") return null;

    const profile = await authRepository.findParentProfile(db, userId);
    if (!profile) return null;

    return {
      name: profile.studentName,
      className: profile.studentClass,
      relationship: profile.relationship,
    };
  }
}

export const authService = new AuthService();
