import type { WeekScheduleDto } from "@/types/schedule";

/**
 * Pembantu pemilihan baris jadwal untuk aksi massal.
 *
 * Semuanya fungsi murni atas data yang **sudah ada di layar** (`weeks` dari
 * `GET /schedules/month`), bukan permintaan tambahan. Dengan begitu bilah aksi
 * tahu pasti aksi mana yang masuk akal untuk pilihan saat ini — mis. tombol
 * "Publikasi" mati bila tak satu pun baris tercentang berstatus `locked`.
 */

/** Ringkasan status baris-baris yang sedang dicentang. */
export interface SelectionSummary {
  /** Jumlah baris tercentang. */
  count: number;
  /** Rincian per status — menentukan tombol mana yang boleh aktif. */
  draft: number;
  locked: number;
  published: number;
}

const EMPTY_SUMMARY: SelectionSummary = {
  count: 0,
  draft: 0,
  locked: 0,
  published: 0,
};

/**
 * Id jadwal yang boleh dicentang pada satu minggu.
 *
 * Hari tanpa entri jadwal (`scheduleId` null — akhir pekan atau data yang
 * belum diisi) tidak bisa dicentang: tidak ada baris yang bisa dikunci.
 */
export function weekSelectableIds(week: WeekScheduleDto): number[] {
  return week.days
    .map((day) => day.scheduleId)
    .filter((id): id is number => id !== null);
}

/** Seluruh id yang boleh dicentang pada bulan yang sedang tampil. */
export function monthSelectableIds(weeks: WeekScheduleDto[]): number[] {
  return weeks.flatMap(weekSelectableIds);
}

/** Keadaan centang satu kelompok (satu minggu, atau seluruh bulan). */
export interface GroupSelectionState {
  /** Semua id yang termasuk kelompok ini. */
  ids: number[];
  selectedCount: number;
  /** Semua id kelompok tercentang — kotak induk tercentang penuh. */
  allSelected: boolean;
  /** Sebagian saja — kotak induk tampil "sebagian" (indeterminate). */
  someSelected: boolean;
}

export function groupSelection(
  ids: number[],
  selected: ReadonlySet<number>,
): GroupSelectionState {
  const selectedCount = ids.filter((id) => selected.has(id)).length;

  return {
    ids,
    selectedCount,
    allSelected: ids.length > 0 && selectedCount === ids.length,
    someSelected: selectedCount > 0 && selectedCount < ids.length,
  };
}

/**
 * Ringkasan baris tercentang. Baris yang tercentang tetapi tidak lagi ada di
 * `weeks` (mis. setelah pindah bulan) otomatis tidak terhitung.
 */
export function summarizeSelection(
  weeks: WeekScheduleDto[],
  selected: ReadonlySet<number>,
): SelectionSummary {
  if (selected.size === 0) return EMPTY_SUMMARY;

  const summary: SelectionSummary = { ...EMPTY_SUMMARY };

  for (const week of weeks) {
    for (const day of week.days) {
      const id = day.scheduleId;
      if (id === null || !selected.has(id) || !day.status) continue;

      summary.count += 1;
      summary[day.status] += 1;
    }
  }

  return summary;
}

/** Baris yang statusnya boleh berpindah oleh aksi ini. */
export function canApplyBulk(
  action: "lock" | "publish" | "unlock",
  summary: SelectionSummary,
): boolean {
  switch (action) {
    case "lock":
      return summary.draft > 0;
    case "publish":
      return summary.locked > 0;
    case "unlock":
      return summary.locked + summary.published > 0;
  }
}
