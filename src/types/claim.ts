/**
 * DTO klaim jadwal — dipakai bersama oleh API dan frontend.
 *
 * Setelah korlas mempublikasi jadwal, orang tua berebut memilih tanggal mana
 * yang akan mereka bawakan snack-nya. Satu tanggal hanya untuk satu orang tua;
 * yang datang belakangan mendapat penolakan beserta nama pemilik klaimnya.
 */

/** Ringkasan klaim yang menempel pada setiap hari jadwal. */
export interface ScheduleClaimSummaryDto {
  id: number;
  parentId: number;
  parentName: string;
  /** Nama anak yang diwakili — `null` bila orang tua tidak memilih anak. */
  studentName: string | null;
  note: string | null;
  claimedAt: string;
}

/** Klaim lengkap beserta konteks tanggalnya — untuk daftar "klaim saya". */
export interface ScheduleClaimDto extends ScheduleClaimSummaryDto {
  scheduleId: number;
  scheduleDate: string;
  dayName: string;
  className: string;
  /** Nama menu pada tanggal tersebut, bila sudah diisi korlas. */
  menuName: string | null;
}

export interface ClaimInput {
  scheduleId: number;
  studentId?: number | null;
  note?: string | null;
}
