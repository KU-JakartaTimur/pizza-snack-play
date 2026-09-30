import { and, asc, eq, gte, inArray, lte, type SQL } from "drizzle-orm";
import type { Db } from "../../database/db";
import {
  menus,
  parents,
  scheduleClaims,
  schedules,
  students,
} from "../../database/schema";

/**
 * Akses data laporan jadwal.
 *
 * Laporan ini **hanya membaca** — tidak ada penulisan sama sekali. Sumbernya
 * dua tabel: `schedule_claims` (siapa mengambil tanggal apa) dan `schedules`
 * (tanggal, kelas, menu), ditambah `parents`/`students` untuk nama.
 */

/** Klaim beserta konteks jadwalnya — baris mentah yang dirakit service. */
export interface LaporanClaimRow {
  parentId: number;
  parentName: string;
  studentName: string | null;
  claimId: number;
  scheduleId: number;
  scheduleDate: string;
  dayOfWeek: number;
  className: string;
  menuName: string | null;
  note: string | null;
  claimedAt: string;
}

/** Orang tua yang punya anak di kelas tertentu — untuk menghitung yang kosong. */
export interface LaporanParentRow {
  parentId: number;
  parentName: string;
  studentNames: string[];
}

class LaporanRepository {
  /**
   * Seluruh klaim pada rentang tanggal, dipersempit ke `classNames` bila diisi.
   *
   * `classNames` kosong berarti **semua kelas** — itu jalur admin yang
   * mengosongkan pemilih kelas. Tanggal dibandingkan sebagai teks
   * (`YYYY-MM-DD`), sama seperti pembacaan jadwal lain.
   */
  async claimsBetween(
    db: Db,
    from: string,
    to: string,
    classNames: string[],
  ): Promise<LaporanClaimRow[]> {
    const conditions: SQL[] = [
      gte(schedules.scheduleDate, from),
      lte(schedules.scheduleDate, to),
    ];
    if (classNames.length > 0) {
      conditions.push(inArray(schedules.className, classNames));
    }

    const rows = await db
      .select({
        parentId: scheduleClaims.parentId,
        parentName: parents.parentName,
        studentName: students.name,
        claimId: scheduleClaims.id,
        scheduleId: scheduleClaims.scheduleId,
        scheduleDate: schedules.scheduleDate,
        dayOfWeek: schedules.dayOfWeek,
        className: schedules.className,
        menuName: menus.name,
        note: scheduleClaims.note,
        claimedAt: scheduleClaims.claimedAt,
      })
      .from(scheduleClaims)
      .innerJoin(schedules, eq(scheduleClaims.scheduleId, schedules.id))
      .innerJoin(parents, eq(scheduleClaims.parentId, parents.id))
      .leftJoin(students, eq(scheduleClaims.studentId, students.id))
      .leftJoin(menus, eq(schedules.menuId, menus.id))
      .where(and(...conditions))
      .orderBy(asc(schedules.scheduleDate), asc(schedules.className));

    return rows;
  }

  /**
   * Orang tua yang punya anak di kelas `classNames`, beserta nama anaknya.
   *
   * Dipakai untuk mencari siapa yang **belum pernah** mengambil — daftar itu
   * tidak bisa diturunkan dari tabel klaim, karena justru ketiadaan barisnya
   * yang jadi artinya.
   */
  async parentsWithStudents(
    db: Db,
    classNames: string[],
  ): Promise<LaporanParentRow[]> {
    const conditions = classNames.length > 0
      ? inArray(students.className, classNames)
      : undefined;

    const rows = await db
      .select({
        parentId: parents.id,
        parentName: parents.parentName,
        studentName: students.name,
      })
      .from(parents)
      .innerJoin(students, eq(students.parentId, parents.id))
      .where(conditions)
      .orderBy(asc(parents.parentName), asc(students.name));

    // Gabungkan anak-anak ke satu baris per orang tua (hindari duplikat
    // akibat join satu-baris-per-anak).
    const byParent = new Map<number, LaporanParentRow>();
    for (const row of rows) {
      const existing = byParent.get(row.parentId);
      if (existing) {
        existing.studentNames.push(row.studentName);
      } else {
        byParent.set(row.parentId, {
          parentId: row.parentId,
          parentName: row.parentName,
          studentNames: [row.studentName],
        });
      }
    }

    return [...byParent.values()];
  }
}

export const laporanRepository = new LaporanRepository();
