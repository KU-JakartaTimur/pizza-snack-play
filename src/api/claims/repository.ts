import { and, asc, eq, gte, inArray, lte, type SQL } from "drizzle-orm";
import type { Db } from "../../database/db";
import {
  menus,
  parents,
  scheduleClaims,
  schedules,
  students,
} from "../../database/schema";
import type { ScheduleClaim } from "../../database/schema";

/** Klaim beserta nama orang tua & anaknya — hasil join siap pakai. */
export interface ClaimRow {
  claim: ScheduleClaim;
  parentName: string;
  studentName: string | null;
}

/** Klaim beserta konteks jadwalnya — untuk daftar "klaim saya". */
export interface ClaimWithScheduleRow extends ClaimRow {
  scheduleDate: string;
  className: string;
  menuName: string | null;
}

class ClaimRepository {
  async findByScheduleId(
    db: Db,
    scheduleId: number,
  ): Promise<ClaimRow | undefined> {
    const rows = await this.selectClaims(db, eq(scheduleClaims.scheduleId, scheduleId));
    return rows[0];
  }

  /** Klaim untuk sekumpulan jadwal sekaligus — menghindari N+1 saat merender sebulan. */
  async findByScheduleIds(db: Db, scheduleIds: number[]): Promise<ClaimRow[]> {
    if (scheduleIds.length === 0) return [];
    return this.selectClaims(db, inArray(scheduleClaims.scheduleId, scheduleIds));
  }

  async findById(db: Db, id: number): Promise<ClaimRow | undefined> {
    const rows = await this.selectClaims(db, eq(scheduleClaims.id, id));
    return rows[0];
  }

  /** Klaim satu orang tua pada rentang tanggal, urut tanggal. */
  async findByParentId(
    db: Db,
    parentId: number,
    from: string,
    to: string,
  ): Promise<ClaimWithScheduleRow[]> {
    return this.selectClaimsWithSchedule(
      db,
      and(
        eq(scheduleClaims.parentId, parentId),
        gte(schedules.scheduleDate, from),
        lte(schedules.scheduleDate, to),
      )!,
    );
  }

  /** Semua klaim satu kelas pada rentang tanggal — rekap untuk korlas/admin. */
  async findByClassBetween(
    db: Db,
    className: string,
    from: string,
    to: string,
  ): Promise<ClaimWithScheduleRow[]> {
    return this.selectClaimsWithSchedule(
      db,
      and(
        eq(schedules.className, className),
        gte(schedules.scheduleDate, from),
        lte(schedules.scheduleDate, to),
      )!,
    );
  }

  async insert(
    db: Db,
    values: {
      scheduleId: number;
      parentId: number;
      studentId: number | null;
      note: string | null;
    },
  ): Promise<ScheduleClaim> {
    const rows = await db.insert(scheduleClaims).values(values).returning();
    return rows[0];
  }

  async deleteById(db: Db, id: number): Promise<void> {
    await db.delete(scheduleClaims).where(eq(scheduleClaims.id, id));
  }

  // ── Query dasar ─────────────────────────────────────────────

  private selectClaims(db: Db, where: SQL) {
    return db
      .select({
        claim: scheduleClaims,
        parentName: parents.parentName,
        studentName: students.name,
      })
      .from(scheduleClaims)
      .innerJoin(parents, eq(scheduleClaims.parentId, parents.id))
      .leftJoin(students, eq(scheduleClaims.studentId, students.id))
      .where(where);
  }

  private selectClaimsWithSchedule(db: Db, where: SQL) {
    return db
      .select({
        claim: scheduleClaims,
        parentName: parents.parentName,
        studentName: students.name,
        scheduleDate: schedules.scheduleDate,
        className: schedules.className,
        menuName: menus.name,
      })
      .from(scheduleClaims)
      .innerJoin(schedules, eq(scheduleClaims.scheduleId, schedules.id))
      .innerJoin(parents, eq(scheduleClaims.parentId, parents.id))
      .leftJoin(students, eq(scheduleClaims.studentId, students.id))
      .leftJoin(menus, eq(schedules.menuId, menus.id))
      .where(where)
      .orderBy(asc(schedules.scheduleDate));
  }
}

export const claimRepository = new ClaimRepository();
