import { and, asc, eq, sql } from "drizzle-orm";
import { parents, students, users } from "../../database/schema";
import type { Parent, Student, User } from "../../database/schema";
import type { Db } from "../../database/db";

class AuthRepository {
  async findByUsername(db: Db, username: string): Promise<User | undefined> {
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    return rows[0];
  }

  async findById(db: Db, id: number): Promise<User | undefined> {
    const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return rows[0];
  }

  /**
   * Profil orang tua beserta seluruh anaknya bila user ber-role `parent`.
   * Anak nonaktif tidak disertakan.
   */
  async findParentWithStudents(
    db: Db,
    userId: number,
  ): Promise<{ parent: Parent; students: Student[] } | undefined> {
    const rows = await db
      .select()
      .from(parents)
      .where(eq(parents.userId, userId))
      .limit(1);

    const parent = rows[0];
    if (!parent) return undefined;

    const studentRows = await db
      .select()
      .from(students)
      .where(and(eq(students.parentId, parent.id), eq(students.isActive, 1)))
      .orderBy(asc(students.id));

    return { parent, students: studentRows };
  }

  async touchLastLogin(db: Db, id: number): Promise<void> {
    await db
      .update(users)
      .set({ lastLoginAt: sql`(datetime('now'))` })
      .where(eq(users.id, id));
  }

  /**
   * Catat satu kegagalan masuk, lalu kembalikan jumlah kegagalan
   * **berturut-turut** yang baru.
   *
   * Penghitungannya sengaja dilakukan di SQL, bukan di JavaScript:
   *
   * - Jendela waktunya ikut dihitung. Bila kegagalan terakhir sudah lewat
   *   `windowSeconds`, hitungannya dimulai lagi dari 1 — supaya salah ketik
   *   yang berjauhan tidak menumpuk menjadi penguncian.
   * - Tidak perlu bolak-balik membaca lalu menulis, sehingga dua percobaan
   *   yang tiba bersamaan tidak saling menimpa (baca-lalu-tulis bisa membuat
   *   keduanya menulis angka yang sama, dan kegagalan jadi tidak terhitung).
   *
   * Timestamp dibandingkan sebagai teks `YYYY-MM-DD HH:MM:SS` UTC — format
   * yang sama dengan `datetime('now')`, jadi urutannya sahih.
   */
  async registerFailedLogin(
    db: Db,
    id: number,
    windowSeconds: number,
  ): Promise<number> {
    const rows = await db
      .update(users)
      .set({
        failedLoginAttempts: sql`CASE
          WHEN ${users.lastFailedLoginAt} IS NULL
            OR ${users.lastFailedLoginAt} < datetime('now', ${`-${windowSeconds} seconds`})
          THEN 1
          ELSE ${users.failedLoginAttempts} + 1
        END`,
        lastFailedLoginAt: sql`(datetime('now'))`,
      })
      .where(eq(users.id, id))
      .returning({ attempts: users.failedLoginAttempts });

    return rows[0]?.attempts ?? 0;
  }

  /** Kunci akun — login berikutnya ditolak sampai dibuka admin. */
  async lock(db: Db, id: number): Promise<void> {
    await db
      .update(users)
      .set({ lockedAt: sql`(datetime('now'))`, updatedAt: sql`(datetime('now'))` })
      .where(eq(users.id, id));
  }

  /**
   * Bersihkan seluruh jejak kegagalan: penghitung, waktu kegagalan terakhir,
   * dan kunci. Dipakai di dua tempat yang tujuannya sama — login berhasil
   * (akun kembali bersih) dan admin membuka kunci akun.
   */
  async clearLoginFailures(db: Db, id: number): Promise<void> {
    await db
      .update(users)
      .set({
        failedLoginAttempts: 0,
        lastFailedLoginAt: null,
        lockedAt: null,
        updatedAt: sql`(datetime('now'))`,
      })
      .where(eq(users.id, id));
  }

  async updatePassword(
    db: Db,
    id: number,
    passwordHash: string,
  ): Promise<void> {
    await db
      .update(users)
      .set({ passwordHash, updatedAt: sql`(datetime('now'))` })
      .where(eq(users.id, id));
  }
}

export const authRepository = new AuthRepository();
