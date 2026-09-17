/**
 * Label & urutan tampil untuk jenis komponen menu.
 * Dipakai bersama oleh kartu jadwal dan halaman pencarian.
 */

import type { MenuItemType } from "@/types/catalog";

export const ITEM_TYPE_LABELS: Record<MenuItemType, string> = {
  main: "Makanan utama",
  fruit: "Buah",
  drink: "Minuman",
  other: "Pelengkap",
};

/** Urutan tetap agar tampilan konsisten di seluruh halaman. */
export const ITEM_TYPE_ORDER: MenuItemType[] = [
  "main",
  "fruit",
  "drink",
  "other",
];
