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

export type LoginFailureReason = "invalid_credentials" | "inactive" | "locked";

/**
 * Hasil login.
 *
 * Kegagalan membawa `attemptsLeft` supaya pengguna tahu kesempatannya tinggal
 * berapa. Tanpa itu penguncian datang tanpa peringatan sama sekali — dan pada
 * aplikasi ini yang mengunci diri sendiri biasanya orang tua yang salah ketik,
 * bukan penyerang.
 */
export type LoginOutcome =
  | { ok: true; data: LoginResult }
  | { ok: false; reason: LoginFailureReason; attemptsLeft?: number };

/** Batas kegagalan masuk berturut-turut sebelum akun dikunci. */
export const MAX_LOGIN_ATTEMPTS = 5;

/**
 * Jendela penghitungan kegagalan, dalam detik.
 *
 * Kegagalan yang lebih lama dari ini tidak lagi menumpuk. Tanpa jendela, tiga
 * salah ketik bulan lalu ditambah dua hari ini akan mengunci akun orang tua
 * yang sama sekali tidak sedang mencoba menembus apa pun.
 */
export const LOGIN_ATTEMPT_WINDOW_SECONDS = 15 * 60;

export interface LoginInput {
  username: string;
  password: string;
  /** Secret untuk signing JWT — dari `c.env.JWT_SECRET`. */
  secret: string;
  /** Masa berlaku token dalam detik. */
  expiresIn: number;
}

/** Kegagalan "Login as" — dipetakan ke pesan Indonesia di controller. */
export type ImpersonateFailure = "not_found" | "inactive" | "not_impersonable";

export interface ImpersonateInput {
  /** `users.id` akun yang akan dibuka sesinya. */
  userId: number;
  secret: string;
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
  parentId: number | null;
  relationship: string | null;
  students: StudentProfile[];
}

const EMPTY_PROFILE: ParentProfile = {
  parentId: null,
  relationship: null,
  students: [],
};

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
    parentId: profile.parentId,
    relationship: profile.relationship,
    students: profile.students,
  };
}

/**
 * Terbitkan JWT untuk seorang user. Dipakai jalur masuk mana pun (login biasa
 * maupun "Login as") supaya isi tokennya dijamin sama — pembatasan kelas dan
 * role di API bersandar pada klaim di sini.
 */
async function issueToken(
  user: { id: number; username: string; role: string; className: string | null },
  secret: string,
  expiresIn: number,
): Promise<{ token: string; expiresAt: number }> {
  const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;

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
    secret,
  );

  return { token, expiresAt };
}

class AuthService {
  /**
   * Verifikasi kredensial dan terbitkan JWT.
   *
   * Setiap password yang salah menambah penghitung kegagalan; setelah
   * `MAX_LOGIN_ATTEMPTS` kali berturut-turut akunnya dikunci dan hanya admin
   * yang bisa membukanya. Login yang berhasil mengosongkan penghitung itu,
   * sehingga akun yang dipakai normal tidak pernah mendekati batas.
   */
  async login(db: Db, input: LoginInput): Promise<LoginOutcome> {
    const user = await authRepository.findByUsername(db, input.username);

    if (!user) return { ok: false, reason: "invalid_credentials" };
    if (user.isActive !== 1) return { ok: false, reason: "inactive" };

    // Diperiksa sebelum password: akun terkunci tidak perlu diverifikasi lagi,
    // dan pengguna harus tahu bahwa mencoba ulang tidak akan menolong —
    // yang perlu dilakukan adalah menghubungi admin.
    if (user.lockedAt) return { ok: false, reason: "locked" };

    const passwordMatches = await verifyPassword(
      input.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      const attempts = await authRepository.registerFailedLogin(
        db,
        user.id,
        LOGIN_ATTEMPT_WINDOW_SECONDS,
      );

      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        await authRepository.lock(db, user.id);
        return { ok: false, reason: "locked" };
      }

      return {
        ok: false,
        reason: "invalid_credentials",
        attemptsLeft: MAX_LOGIN_ATTEMPTS - attempts,
      };
    }

    // Berhasil masuk: bersihkan jejak kegagalan agar tidak menumpuk.
    await authRepository.clearLoginFailures(db, user.id);

    const { token, expiresAt } = await issueToken(
      user,
      input.secret,
      input.expiresIn,
    );

    await authRepository.touchLastLogin(db, user.id);

    const profile = await this.parentProfileFor(db, user.id, user.role);

    return {
      ok: true,
      data: {
        token,
        expiresAt,
        user: toPublicUser(user, profile),
      },
    };
  }

  /**
   * Terbitkan sesi atas nama user lain **tanpa password** — dipakai admin
   * untuk menelusuri tampilan korlas/orang tua ("Login as").
   *
   * Yang dilewati hanyalah pemeriksaan password: token yang keluar tetap
   * membawa identitas asli target, sehingga seluruh pembatasan kelas dan role
   * di API berlaku persis seperti ia masuk sendiri. Karena itu endpoint
   * pemanggilnya wajib khusus admin.
   */
  async impersonate(
    db: Db,
    input: ImpersonateInput,
  ): Promise<LoginResult | ImpersonateFailure> {
    const user = await authRepository.findById(db, input.userId);

    if (!user) return "not_found";
    if (user.isActive !== 1) return "inactive";
    // Sesama admin tidak perlu dibuka: satu sesi admin sudah mencakup seluruh
    // sekolah, dan membukanya hanya memperluas permukaan penyalahgunaan.
    if (user.role !== "parent" && user.role !== "korlas") {
      return "not_impersonable";
    }

    const { token, expiresAt } = await issueToken(
      user,
      input.secret,
      input.expiresIn,
    );

    // `lastLoginAt` sengaja tidak disentuh — kolom itu catatan login pemilik
    // akun, bukan kunjungan admin ke tampilannya.
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
      parentId: found.parent.id,
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
