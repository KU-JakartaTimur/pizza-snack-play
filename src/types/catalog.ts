/** DTO katalog — kategori & menu. Dipakai bersama oleh API dan frontend. */

export type MenuItemType = "main" | "fruit" | "drink" | "other";

/**
 * Batas panjang gambar kategori, dihitung pada **data URI**-nya (termasuk
 * awalan `data:…;base64,`) — kira-kira setara berkas 730 KB.
 *
 * Angka ini dijaga di satu tempat karena dipakai dua sisi: klien menolak
 * berkas yang terlalu besar sebelum dikirim, server memvalidasinya lagi.
 * Sisa ruang ke batas 2 MB per baris D1 masih lega.
 */
export const CATEGORY_IMAGE_MAX_LENGTH = 1_000_000;

/** Tipe gambar yang diterima — semuanya bisa langsung ditampilkan peramban. */
export const CATEGORY_IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const;

/**
 * Kategori versi ringkas — **tanpa gambar**.
 *
 * Inilah bentuk yang menempel pada menu & jadwal. Gambarnya sengaja tidak
 * ikut: satu bulan jadwal memuat puluhan menu, dan setiap menu membawa
 * daftar kategorinya — menyalin data URI di situ akan menggandakan ukuran
 * jawaban berkali-kali tanpa ada yang menampilkannya.
 */
export interface CategorySummaryDto {
  id: number;
  name: string;
  slug: string;
  color: string | null;
}

/** Kategori lengkap, termasuk gambar — dipakai halaman Kategori. */
export interface CategoryDto extends CategorySummaryDto {
  /** Data URI siap pakai `<img src>`, atau `null` bila belum diunggah. */
  image: string | null;
}

export interface MenuItemDto {
  id: number;
  name: string;
  itemType: MenuItemType;
  categoryId: number | null;
  categoryName: string | null;
  categoryColor: string | null;
}

export interface MenuDto {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  isArchived: boolean;
  items: MenuItemDto[];
  categories: CategorySummaryDto[];
}

/** Payload untuk membuat / mengubah menu. */
export interface MenuInput {
  name: string;
  description?: string | null;
  isActive?: boolean;
  items?: {
    name: string;
    itemType?: MenuItemType;
    categoryId?: number | null;
  }[];
  categoryIds?: number[];
}

export interface CategoryInput {
  name: string;
  slug?: string;
  color?: string | null;
  /**
   * Gambar sebagai data URI base64. `null` mengosongkan gambar yang tersimpan;
   * tidak menyertakan kolom ini sama sekali berarti gambarnya dibiarkan.
   */
  image?: string | null;
}
