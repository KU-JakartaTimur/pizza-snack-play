/** DTO jadwal — dipakai bersama oleh API dan frontend. */

import type { MenuDto, MenuItemType } from "./catalog";

/** Status jadwal: draft (editable) → locked (dikunci) → published (tampil ke orang tua). */
export type ScheduleStatus = "draft" | "locked" | "published";

export interface WeekDto {
  id: number;
  weekStartDate: string;
  weekEndDate: string;
  month: number;
  year: number;
  label: string | null;
}

/**
 * Satu hari pada jadwal. `scheduleId` null berarti belum ada entri jadwal
 * untuk tanggal tersebut (mis. akhir pekan atau data belum diimpor).
 *
 * Jadwal bersifat per kelas, jadi setiap hari selalu menyertakan kelas mana
 * yang sedang dilihat.
 *
 * `status` hanya diisi untuk admin/korlas; orang tua selalu melihat 'published'
 * (atau null bila jadwal belum dipublikasi).
 */
export interface ScheduleDayDto {
  date: string;
  dayOfWeek: number;
  dayName: string;
  /** Kelas yang sedang dilihat. `null` bila user belum punya kelas. */
  className: string | null;
  isToday: boolean;
  isHoliday: boolean;
  holidayName: string | null;
  notes: string | null;
  scheduleId: number | null;
  menu: MenuDto | null;
  /** Nama siswa yang bertugas piket (ambil snack) pada hari ini. */
  petugasName: string | null;
  /** Nama orang tua/wali petugas — bila diketahui. */
  petugasParentName: string | null;
  /** Status jadwal — hanya relevan untuk admin/korlas. */
  status: ScheduleStatus | null;
}

export interface WeekScheduleDto {
  week: WeekDto | null;
  className: string | null;
  startDate: string;
  endDate: string;
  label: string;
  days: ScheduleDayDto[];
}

export interface MonthScheduleDto {
  year: number;
  month: number;
  monthName: string;
  className: string | null;
  weeks: WeekScheduleDto[];
}

/** Ringkasan untuk endpoint `/schedules/today`. */
export interface TodayScheduleDto {
  day: ScheduleDayDto;
  week: WeekScheduleDto;
}

export interface ScheduleInput {
  scheduleDate: string;
  /**
   * Kelas pemilik jadwal. Wajib untuk admin; untuk korlas diisi otomatis
   * dari kelas yang dikoordinasinya (bila dikirim, harus sama).
   */
  className?: string;
  menuId?: number | null;
  isHoliday?: boolean;
  /** Nama siswa yang bertugas piket mengambil snack. */
  petugasName?: string | null;
  /** Nama orang tua/wali petugas. */
  petugasParentName?: string | null;
  notes?: string | null;
}

// ─────────────────────────────────────────────────────────────
// Kunci & Publikasi jadwal
// ─────────────────────────────────────────────────────────────

export interface LockScheduleInput {
  /** Tanggal awal rentang yang dikunci (inklusif). */
  fromDate: string;
  /** Tanggal akhir rentang yang dikunci (inklusif). */
  toDate: string;
  /** Kelas yang dikunci. Wajib untuk admin; korlas diisi otomatis. */
  className?: string;
}

export interface LockScheduleResultDto {
  className: string;
  fromDate: string;
  toDate: string;
  locked: number;
  alreadyLocked: number;
  /** Baris yang sudah published dilewati (tidak bisa dikunci ulang). */
  skipped: number;
}

export interface PublishScheduleInput {
  year: number;
  month: number;
  /** Kelas yang dipublikasi. Wajib untuk admin; korlas diisi otomatis. */
  className?: string;
}

export interface PublishScheduleResultDto {
  className: string;
  year: number;
  month: number;
  published: number;
  /** Baris draft yang belum dikunci (menggagalkan publikasi bila > 0). */
  draftCount: number;
  /** Baris yang sudah published sebelumnya (dilewati). */
  alreadyPublished: number;
}

// ─────────────────────────────────────────────────────────────
// Pencarian riwayat menu — "kapan jeruk disajikan?"
// ─────────────────────────────────────────────────────────────

export interface MenuHistoryItemMatch {
  name: string;
  itemType: MenuItemType;
}

export interface MenuHistoryMatchDto {
  date: string;
  dayName: string;
  menuId: number;
  menuName: string;
  /** Komponen menu yang cocok dengan kata kunci. */
  matchedItems: MenuHistoryItemMatch[];
  /** `true` bila nama menu itu sendiri yang cocok, bukan hanya komponennya. */
  menuNameMatched: boolean;
  notes: string | null;
}

export interface MenuHistoryDto {
  query: string;
  from: string;
  to: string;
  totalMatches: number;
  matches: MenuHistoryMatchDto[];
}

// ─────────────────────────────────────────────────────────────
// Duplikasi jadwal antar minggu
// ─────────────────────────────────────────────────────────────

export interface CopyWeekInput {
  /** Tanggal mana pun pada minggu sumber. */
  fromDate: string;
  /** Tanggal mana pun pada minggu tujuan. */
  toDate: string;
  /** Kelas yang disalin. Wajib untuk admin; korlas diisi otomatis. */
  className?: string;
  /** Timpa jadwal yang sudah ada di minggu tujuan (default: lewati). */
  overwrite?: boolean;
}

export interface CopyWeekResultDto {
  sourceLabel: string;
  targetLabel: string;
  created: number;
  updated: number;
  skipped: number;
}
