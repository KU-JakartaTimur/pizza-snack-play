import { and, eq, isNotNull, ne } from "drizzle-orm";
import type { Db } from "../../database/db";
import { parents, schedules, students, users } from "../../database/schema";

/** Rapikan daftar kelas: buang kosong/spasi, dedupe, urut abjad-numerik. */
function normalize(values: (string | null)[]): string[] {
  const set = new Set<string>();

  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) set.add(trimmed);
  }

  // `numeric: true` agar "2A" mendahului "10A", bukan sebaliknya.
  return [...set].sort((a, b) => a.localeCompare(b, "id", { numeric: true }));
}

/**
 * Kelas bukan tabel tersendiri — daftarnya diturunkan dari data yang ada:
 * kelas anak (`students`), kelas yang dikoordinasi korlas (`users`), dan
 * kelas yang sudah punya baris jadwal (`schedules`).
 *
 * Konsekuensinya kelas hanya berupa teks tanpa id (mis. `"1A"`), sejalan
 * dengan `students.class_name` yang sudah dipakai sebelumnya.
 */
class ClassRepository {
  /** Semua kelas yang dikenal sistem, urut abjad-numerik. */
  async listAll(db: Db): Promise<string[]> {
    const [fromStudents, fromKorlas, fromSchedules] = await Promise.all([
      db
        .selectDistinct({ className: students.className })
        .from(students)
        .where(and(isNotNull(students.className), ne(students.className, ""))),
      db
        .selectDistinct({ className: users.className })
        .from(users)
        .where(and(eq(users.role, "korlas"), isNotNull(users.className))),
      db.selectDistinct({ className: schedules.className }).from(schedules),
    ]);

    return normalize([
      ...fromStudents.map((row) => row.className),
      ...fromKorlas.map((row) => row.className),
      ...fromSchedules.map((row) => row.className),
    ]);
  }

  /** Kelas dari anak-anak seorang orang tua. */
  async listForParent(db: Db, userId: number): Promise<string[]> {
    const rows = await db
      .selectDistinct({ className: students.className })
      .from(students)
      .innerJoin(parents, eq(parents.id, students.parentId))
      .where(
        and(
          eq(parents.userId, userId),
          eq(students.isActive, 1),
          isNotNull(students.className),
          ne(students.className, ""),
        ),
      );

    return normalize(rows.map((row) => row.className));
  }
}

export const classRepository = new ClassRepository();
