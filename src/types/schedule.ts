/** DTO jadwal — dipakai bersama oleh API dan frontend. */

import type { MenuDto, MenuItemType } from "./catalog";

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
 */
export interface ScheduleDayDto {
  date: string;
  dayOfWeek: number;
  dayName: string;
  isToday: boolean;
  isHoliday: boolean;
  holidayName: string | null;
  notes: string | null;
  scheduleId: number | null;
  menu: MenuDto | null;
}

export interface WeekScheduleDto {
  week: WeekDto | null;
  startDate: string;
  endDate: string;
  label: string;
  days: ScheduleDayDto[];
}

export interface MonthScheduleDto {
  year: number;
  month: number;
  monthName: string;
  weeks: WeekScheduleDto[];
}

/** Ringkasan untuk endpoint `/schedules/today`. */
export interface TodayScheduleDto {
  day: ScheduleDayDto;
  week: WeekScheduleDto;
}

export interface ScheduleInput {
  scheduleDate: string;
  menuId?: number | null;
  isHoliday?: boolean;
  notes?: string | null;
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
