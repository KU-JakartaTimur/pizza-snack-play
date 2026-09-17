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
