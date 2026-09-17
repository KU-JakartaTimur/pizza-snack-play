import { and, asc, eq, inArray, like, notInArray, or, sql } from "drizzle-orm";
import type { Db } from "../../database/db";
import { parents, students, users } from "../../database/schema";
import type { Parent, Student, User } from "../../database/schema";
import { likePattern } from "../utils/sql";

export interface ParentRow {
  parent: Parent;
  user: User;
  /** Anak-anak dari orang tua ini — bisa lebih dari satu. */
  students: Student[];
}

/** Kelompokkan anak berdasarkan `parent_id` agar tidak terjadi N+1. */
function groupByParent(rows: Student[]): Map<number, Student[]> {
  const byParent = new Map<number, Student[]>();
  for (const row of rows) {
    const list = byParent.get(row.parentId);
    if (list) list.push(row);
    else byParent.set(row.parentId, [row]);
  }
  return byParent;
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
      // Pencarian juga menjangkau nama/kelas anak lewat subquery EXISTS,
      // supaya satu orang tua tidak terduplikasi di hasil paginasi.
      filters.push(
        or(
          like(parents.parentName, term),
          like(users.username, term),
          sql`exists (
            select 1 from ${students}
            where ${students.parentId} = ${parents.id}
              and (${students.name} like ${term} or ${students.className} like ${term})
          )`,
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

    // Satu query tambahan untuk seluruh anak pada halaman ini.
    const parentIds = rows.map((row) => row.parent.id);
    const studentRows = parentIds.length
      ? await db
          .select()
          .from(students)
          .where(inArray(students.parentId, parentIds))
          .orderBy(asc(students.id))
      : [];

    const byParent = groupByParent(studentRows);

    return {
      rows: rows.map((row) => ({
        ...row,
        students: byParent.get(row.parent.id) ?? [],
      })),
      total: totalRows[0]?.count ?? 0,
    };
  }

  async findById(db: Db, id: number): Promise<ParentRow | undefined> {
    const rows = await db
      .select({ parent: parents, user: users })
      .from(parents)
      .innerJoin(users, eq(parents.userId, users.id))
      .where(eq(parents.id, id))
      .limit(1);

    const row = rows[0];
    if (!row) return undefined;

    return { ...row, students: await this.findStudentsByParentId(db, row.parent.id) };
  }

  async findByUserId(db: Db, userId: number): Promise<ParentRow | undefined> {
    const rows = await db
      .select({ parent: parents, user: users })
      .from(parents)
      .innerJoin(users, eq(parents.userId, users.id))
      .where(eq(parents.userId, userId))
      .limit(1);

    const row = rows[0];
    if (!row) return undefined;

    return { ...row, students: await this.findStudentsByParentId(db, row.parent.id) };
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
      /** `parent` atau `korlas` — ditentukan pemanggil, bukan hardcode. */
      role: string;
      /** Kelas yang dikoordinasi; hanya diisi untuk korlas. */
      className: string | null;
      isActive: number;
    },
  ): Promise<User> {
    const rows = await db.insert(users).values(values).returning();
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
      role: string;
      className: string | null;
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
    // `parents.user_id` dan `students.parent_id` memakai ON DELETE CASCADE,
    // sehingga profil orang tua beserta anak-anaknya ikut terhapus.
    await db.delete(users).where(eq(users.id, id));
  }

  async insertParent(
    db: Db,
    values: {
      userId: number;
      parentName: string;
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

  // ── Anak ────────────────────────────────────────────────────

  async findStudentsByParentId(
    db: Db,
    parentId: number,
  ): Promise<Student[]> {
    return db
      .select()
      .from(students)
      .where(eq(students.parentId, parentId))
      .orderBy(asc(students.id));
  }

  async insertStudent(
    db: Db,
    values: { parentId: number; name: string; className: string | null },
  ): Promise<Student> {
    const rows = await db
      .insert(students)
      .values({ ...values, isActive: 1 })
      .returning();
    return rows[0];
  }

  async updateStudent(
    db: Db,
    id: number,
    values: Partial<{ name: string; className: string | null }>,
  ): Promise<void> {
    await db
      .update(students)
      .set({ ...values, updatedAt: sql`(datetime('now'))` })
      .where(eq(students.id, id));
  }

  async deleteStudent(db: Db, id: number): Promise<void> {
    await db.delete(students).where(eq(students.id, id));
  }

  /** Hapus anak milik `parentId` yang id-nya tidak ada di `keepIds`. */
  async deleteStudentsExcept(
    db: Db,
    parentId: number,
    keepIds: number[],
  ): Promise<void> {
    const filters = [eq(students.parentId, parentId)];
    if (keepIds.length > 0) {
      filters.push(notInArray(students.id, keepIds));
    }
    await db.delete(students).where(and(...filters));
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
