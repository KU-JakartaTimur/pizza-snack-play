import type { ParentBulkAction, ParentDto } from "@/types/account";

/**
 * Pembantu pemilihan baris akun orang tua untuk aksi massal.
 *
 * Semuanya fungsi murni atas data yang **sudah ada di layar** (`items` dari
 * `GET /parents`), bukan permintaan tambahan. Dengan begitu bilah aksi tahu
 * pasti aksi mana yang masuk akal untuk pilihan saat ini — mis. tombol
 * "Aktifkan" mati bila tak satu pun akun tercentang yang masih nonaktif.
 */

/** Ringkasan akun yang sedang dicentang. */
export interface ParentSelectionSummary {
  /** Jumlah akun tercentang. */
  count: number;
  /** Rincian per keadaan — menentukan tombol mana yang boleh aktif. */
  active: number;
  inactive: number;
}

const EMPTY_SUMMARY: ParentSelectionSummary = {
  count: 0,
  active: 0,
  inactive: 0,
};

/** Seluruh id akun pada halaman yang sedang tampil. */
export function pageSelectableIds(items: ParentDto[]): number[] {
  return items.map((item) => item.id);
}

/** Keadaan centang satu kelompok (seluruh halaman saat ini). */
export interface GroupSelectionState {
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
 * Ringkasan akun tercentang. Akun yang tercentang tetapi tidak lagi ada di
 * `items` (mis. setelah ganti halaman) otomatis tidak terhitung.
 */
export function summarizeParentSelection(
  items: ParentDto[],
  selected: ReadonlySet<number>,
): ParentSelectionSummary {
  if (selected.size === 0) return EMPTY_SUMMARY;

  const summary: ParentSelectionSummary = { ...EMPTY_SUMMARY };

  for (const item of items) {
    if (!selected.has(item.id)) continue;
    summary.count += 1;
    if (item.isActive) summary.active += 1;
    else summary.inactive += 1;
  }

  return summary;
}

/** Akun yang keadaannya boleh berpindah oleh aksi ini. */
export function canApplyBulk(
  action: ParentBulkAction,
  summary: ParentSelectionSummary,
): boolean {
  switch (action) {
    case "activate":
      // Hanya akun yang masih nonaktif yang berubah.
      return summary.inactive > 0;
    case "deactivate":
      // Hanya akun yang masih aktif yang berubah.
      return summary.active > 0;
    case "delete":
      // Penghapusan berlaku untuk seluruh akun tercentang.
      return summary.count > 0;
  }
}
