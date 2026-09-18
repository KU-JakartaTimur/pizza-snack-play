import type { Db } from "../../database/db";
import type { JwtPayload } from "../../types/auth";
import type {
  ClaimInput,
  ScheduleClaimDto,
  ScheduleClaimSummaryDto,
} from "../../types/claim";
import { classService } from "../classes/service";
import { parentRepository } from "../parents/repository";
import { scheduleRepository } from "../schedules/repository";
import { indonesianDayName, todayInWib } from "../utils/date";
import { claimRepository, type ClaimWithScheduleRow } from "./repository";

export type ClaimError =
  | "not_parent"
  | "schedule_not_found"
  | "not_published"
  | "is_holiday"
  | "forbidden_class"
  | "past_date"
  | "already_claimed"
  | "already_assigned"
  | "already_mine"
  | "student_not_found"
  | "claim_not_found"
  | "not_owner";

export type ClaimResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: ClaimError;
      /** Nama orang tua yang lebih dulu mengambil tanggal ini. */
      takenBy?: string;
    };

function toClaimDto(row: ClaimWithScheduleRow): ScheduleClaimDto {
  return {
    id: row.claim.id,
    scheduleId: row.claim.scheduleId,
    scheduleDate: row.scheduleDate,
    dayName: indonesianDayName(row.scheduleDate),
    className: row.className,
    menuName: row.menuName,
    parentId: row.claim.parentId,
    parentName: row.parentName,
    studentName: row.studentName,
    note: row.claim.note,
    claimedAt: row.claim.claimedAt,
  };
}

/**
 * Deteksi pelanggaran indeks unik `idx_schedule_claims_schedule`.
 *
 * D1 meneruskan pesan SQLite apa adanya, jadi pengenalannya lewat teks —
 * tidak ada kode error terstruktur yang bisa diandalkan.
 */
function isUniqueViolation(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /UNIQUE constraint failed/i.test(message);
}

class ClaimService {
  /**
   * Ambil satu tanggal jadwal untuk orang tua yang sedang login.
   *
   * Pemeriksaan di bawah ini hanya untuk pesan yang ramah; penjaga sebenarnya
   * adalah indeks unik pada `schedule_id`. Dua orang tua yang menekan tombol
   * pada detik yang sama sama-sama lolos pemeriksaan, lalu salah satunya
   * ditolak database — dan ditangkap sebagai `already_claimed` di bawah.
   */
  async claim(
    db: Db,
    user: JwtPayload,
    input: ClaimInput,
  ): Promise<ClaimResult<ScheduleClaimDto>> {
    const parent = await parentRepository.findByUserId(db, user.sub);
    if (!parent) return { ok: false, error: "not_parent" };

    const schedule = await scheduleRepository.findScheduleById(
      db,
      input.scheduleId,
    );
    if (!schedule) return { ok: false, error: "schedule_not_found" };
    if (schedule.status !== "published") {
      return { ok: false, error: "not_published" };
    }
    if (schedule.isHoliday === 1) return { ok: false, error: "is_holiday" };
    if (schedule.scheduleDate < todayInWib()) {
      return { ok: false, error: "past_date" };
    }

    const allowed = await classService.allowedClasses(db, user);
    if (!allowed.includes(schedule.className)) {
      return { ok: false, error: "forbidden_class" };
    }

    const studentId = input.studentId ?? null;
    if (studentId !== null && !parent.students.some((s) => s.id === studentId)) {
      return { ok: false, error: "student_not_found" };
    }

    const existing = await claimRepository.findByScheduleId(db, input.scheduleId);
    if (existing) {
      return existing.claim.parentId === parent.parent.id
        ? { ok: false, error: "already_mine" }
        : { ok: false, error: "already_claimed", takenBy: existing.parentName };
    }

    // Petugas yang sudah terisi tanpa klaim berarti korlas menunjuknya dari
    // daftar piket manual — tanggal itu tidak ikut diperebutkan.
    if (schedule.petugasName || schedule.petugasParentName) {
      return {
        ok: false,
        error: "already_assigned",
        takenBy: schedule.petugasParentName ?? schedule.petugasName ?? undefined,
      };
    }

    // Bila orang tua tidak menyebut anaknya, pakai satu-satunya anak di kelas
    // itu — hampir selalu benar, dan membuat kolom petugas tetap terisi.
    const student =
      parent.students.find((s) => s.id === studentId) ??
      (studentId === null
        ? parent.students.filter((s) => s.className === schedule.className)[0]
        : undefined);

    try {
      await claimRepository.insert(db, {
        scheduleId: input.scheduleId,
        parentId: parent.parent.id,
        studentId: student?.id ?? null,
        note: input.note?.trim() || null,
      });
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;

      // Kalah cepat — baca ulang untuk menyebut nama pemenangnya.
      const winner = await claimRepository.findByScheduleId(db, input.scheduleId);
      return {
        ok: false,
        error: "already_claimed",
        takenBy: winner?.parentName,
      };
    }

    // Klaim menjadi sumber kebenaran petugas hari itu, sehingga seluruh
    // tampilan yang sudah merender petugas ikut terisi tanpa perubahan.
    await scheduleRepository.updateSchedule(db, input.scheduleId, {
      petugasName: student?.name ?? null,
      petugasParentName: parent.parent.parentName,
    });

    const rows = await claimRepository.findByParentId(
      db,
      parent.parent.id,
      schedule.scheduleDate,
      schedule.scheduleDate,
    );
    return { ok: true, data: toClaimDto(rows[0]) };
  }

  /**
   * Batalkan klaim. Orang tua hanya boleh membatalkan klaimnya sendiri dan
   * hanya untuk tanggal yang belum lewat; admin dan korlas kelas terkait
   * boleh membatalkan klaim siapa pun (mis. saat ada pergantian mendadak).
   */
  async release(
    db: Db,
    user: JwtPayload,
    claimId: number,
  ): Promise<ClaimResult<null>> {
    const row = await claimRepository.findById(db, claimId);
    if (!row) return { ok: false, error: "claim_not_found" };

    const schedule = await scheduleRepository.findScheduleById(
      db,
      row.claim.scheduleId,
    );

    const isAdmin = user.role === "admin";
    const isClassKorlas =
      user.role === "korlas" &&
      (user.className?.trim() || "") === schedule?.className;

    if (!isAdmin && !isClassKorlas) {
      const parent = await parentRepository.findByUserId(db, user.sub);
      if (!parent || parent.parent.id !== row.claim.parentId) {
        return { ok: false, error: "not_owner" };
      }
      if (schedule && schedule.scheduleDate < todayInWib()) {
        return { ok: false, error: "past_date" };
      }
    }

    await claimRepository.deleteById(db, claimId);

    // Petugas pada baris ini berasal dari klaim yang baru saja dibatalkan,
    // jadi tanggalnya dikembalikan menjadi kosong dan bisa direbut lagi.
    await scheduleRepository.updateSchedule(db, row.claim.scheduleId, {
      petugasName: null,
      petugasParentName: null,
    });

    return { ok: true, data: null };
  }

  /** Klaim milik orang tua yang sedang login pada rentang tanggal. */
  async listMine(
    db: Db,
    user: JwtPayload,
    from: string,
    to: string,
  ): Promise<ClaimResult<ScheduleClaimDto[]>> {
    const parent = await parentRepository.findByUserId(db, user.sub);
    if (!parent) return { ok: false, error: "not_parent" };

    const rows = await claimRepository.findByParentId(
      db,
      parent.parent.id,
      from,
      to,
    );
    return { ok: true, data: rows.map(toClaimDto) };
  }

  /** Rekap seluruh klaim satu kelas — dipakai korlas untuk memantau sisa tanggal. */
  async listByClass(
    db: Db,
    className: string,
    from: string,
    to: string,
  ): Promise<ScheduleClaimDto[]> {
    const rows = await claimRepository.findByClassBetween(db, className, from, to);
    return rows.map(toClaimDto);
  }

  /** Ringkasan klaim per `schedule_id` — dipakai modul jadwal saat merender hari. */
  async summariesByScheduleIds(
    db: Db,
    scheduleIds: number[],
  ): Promise<Map<number, ScheduleClaimSummaryDto>> {
    const rows = await claimRepository.findByScheduleIds(db, scheduleIds);

    return new Map(
      rows.map((row) => [
        row.claim.scheduleId,
        {
          id: row.claim.id,
          parentId: row.claim.parentId,
          parentName: row.parentName,
          studentName: row.studentName,
          note: row.claim.note,
          claimedAt: row.claim.claimedAt,
        },
      ]),
    );
  }
}

export const claimService = new ClaimService();
