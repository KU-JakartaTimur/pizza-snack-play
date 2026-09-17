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

/** Profil anak & hubungan orang tua — kosong untuk admin. */
interface ParentProfile {
  relationship: string | null;
  students: StudentProfile[];
}

const EMPTY_PROFILE: ParentProfile = { relationship: null, students: [] };

function toPublicUser(
  user: {
    id: number;
    username: string;
    fullName: string | null;
    role: string;
    className: string | null;
  },
  profile: ParentProfile = EMPTY_PROFILE,
): AuthUser {
  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role as Role,
    className: user.className,
    relationship: profile.relationship,
    students: profile.students,
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
        // Korlas membawa kelasnya di token; API memakainya untuk membatasi
        // jadwal yang boleh diubah. Mengubah kelas/role butuh login ulang.
        className: user.className,
        exp: expiresAt,
      },
      input.secret,
    );

    await authRepository.touchLastLogin(db, user.id);

    const profile = await this.parentProfileFor(db, user.id, user.role);

    return {
      token,
      expiresAt,
      user: toPublicUser(user, profile),
    };
  }

  /** Profil user yang sedang login, termasuk daftar anak bila `parent`. */
  async getProfile(db: Db, userId: number) {
    const user = await authRepository.findById(db, userId);
    if (!user) return null;

    return {
      user: toPublicUser(user, await this.parentProfileFor(db, userId, user.role)),
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

  /**
   * Hubungan + daftar anak untuk role `parent` dan `korlas` — korlas tetap
   * orang tua murid, jadi anaknya ikut ditampilkan. Kosong untuk admin.
   */
  private async parentProfileFor(
    db: Db,
    userId: number,
    role: string,
  ): Promise<ParentProfile> {
    if (role !== "parent" && role !== "korlas") return EMPTY_PROFILE;

    const found = await authRepository.findParentWithStudents(db, userId);
    if (!found) return EMPTY_PROFILE;

    return {
      relationship: found.parent.relationship,
      students: found.students.map((student) => ({
        id: student.id,
        name: student.name,
        className: student.className,
      })),
    };
  }
}

export const authService = new AuthService();
