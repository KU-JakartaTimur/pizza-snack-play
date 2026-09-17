import { and, asc, eq, like, or, sql } from "drizzle-orm";
import type { Db } from "../../database/db";
import { parents, users } from "../../database/schema";
import type { Parent, User } from "../../database/schema";
import { likePattern } from "../utils/sql";

export interface ParentRow {
  parent: Parent;
  user: User;
}

class ParentRepository {
  async listParents(
    db: Db,
    options: {
      search?: string;
      active?: boolean;
      page: number;
      perPage: number;
    },
  ): Promise<{ rows: ParentRow[]; total: number }> {
    const filters = [];

    if (options.search) {
      const term = likePattern(options.search);
      filters.push(
        or(
          like(parents.parentName, term),
          like(parents.studentName, term),
          like(parents.studentClass, term),
          like(users.username, term),
        ),
      );
    }

    if (options.active !== undefined) {
      filters.push(eq(parents.isActive, options.active ? 1 : 0));
    }

    const where = filters.length ? and(...filters) : undefined;

    const totalRows = await db
      .select({ count: sql<number>`count(*)` })
      .from(parents)
      .innerJoin(users, eq(parents.userId, users.id))
      .where(where);

    const rows = await db
      .select({ parent: parents, user: users })
      .from(parents)
      .innerJoin(users, eq(parents.userId, users.id))
      .where(where)
      .orderBy(asc(parents.parentName))
      .limit(options.perPage)
      .offset((options.page - 1) * options.perPage);

    return { rows, total: totalRows[0]?.count ?? 0 };
  }

  async findById(db: Db, id: number): Promise<ParentRow | undefined> {
    const rows = await db
      .select({ parent: parents, user: users })
      .from(parents)
      .innerJoin(users, eq(parents.userId, users.id))
      .where(eq(parents.id, id))
      .limit(1);
    return rows[0];
  }

  async findByUserId(db: Db, userId: number): Promise<ParentRow | undefined> {
    const rows = await db
      .select({ parent: parents, user: users })
      .from(parents)
      .innerJoin(users, eq(parents.userId, users.id))
      .where(eq(parents.userId, userId))
      .limit(1);
    return rows[0];
  }

  /** Cek ketersediaan username (dipakai sebelum membuat akun baru). */
  async usernameExists(
    db: Db,
    username: string,
    exceptUserId?: number,
  ): Promise<boolean> {
    const filters = [eq(users.username, username)];
    if (exceptUserId !== undefined) {
      filters.push(sql`${users.id} <> ${exceptUserId}`);
    }

    const rows = await db
      .select({ id: users.id })
      .from(users)
      .where(and(...filters))
      .limit(1);

    return rows.length > 0;
  }

  async insertUser(
    db: Db,
    values: {
      username: string;
      passwordHash: string;
      fullName: string;
      email: string | null;
      phone: string | null;
      isActive: number;
    },
  ): Promise<User> {
    const rows = await db
      .insert(users)
      .values({ ...values, role: "parent" })
      .returning();
    return rows[0];
  }

  async updateUser(
    db: Db,
    id: number,
    values: Partial<{
      username: string;
      fullName: string | null;
      email: string | null;
      phone: string | null;
      isActive: number;
      passwordHash: string;
    }>,
  ): Promise<void> {
    await db
      .update(users)
      .set({ ...values, updatedAt: sql`(datetime('now'))` })
      .where(eq(users.id, id));
  }

  async deleteUser(db: Db, id: number): Promise<void> {
    // `parents.user_id` memakai ON DELETE CASCADE, profil ikut terhapus.
    await db.delete(users).where(eq(users.id, id));
  }

  async insertParent(
    db: Db,
    values: {
      userId: number;
      parentName: string;
      studentName: string;
      studentClass: string | null;
      relationship: string;
      phone: string | null;
      address: string | null;
      isActive: number;
    },
  ): Promise<Parent> {
    const rows = await db.insert(parents).values(values).returning();
    return rows[0];
  }

  async updateParent(
    db: Db,
    id: number,
    values: Partial<{
      parentName: string;
      studentName: string;
      studentClass: string | null;
      relationship: string;
      phone: string | null;
      address: string | null;
      isActive: number;
    }>,
  ): Promise<void> {
    await db
      .update(parents)
      .set({ ...values, updatedAt: sql`(datetime('now'))` })
      .where(eq(parents.id, id));
  }

  async countAll(db: Db): Promise<{ total: number; active: number }> {
    const rows = await db
      .select({
        total: sql<number>`count(*)`,
        active: sql<number>`sum(case when ${parents.isActive} = 1 then 1 else 0 end)`,
      })
      .from(parents);

    return {
      total: rows[0]?.total ?? 0,
      active: rows[0]?.active ?? 0,
    };
  }
}

export const parentRepository = new ParentRepository();
