import type { MenuItemType } from "../../types/catalog";

/**
 * Menebak kategori sebuah komponen menu dari namanya.
 *
 * Ini **salinan** dari `CATEGORY_KEYWORDS` di `scripts/seed.ts`, dan itu
 * disengaja: menu yang dibuat lewat impor teks harus berkategori sama dengan
 * menu yang dibuat lewat seed untuk bahan yang sama. Kalau heuristiknya
 * berbeda, "Pisang goreng" akan jadi Gorengan di satu jalur dan Lainnya di
 * jalur lain — perbedaan yang tidak terlihat sampai orang tua menyaring
 * katalog.
 *
 * Urutannya penting: pola paling spesifik lebih dulu, karena `roti` juga
 * cocok untuk "Puding Roti" yang sebenarnya kue.
 */
const CATEGORY_KEYWORDS: Array<[RegExp, string]> = [
  [/roti|sandwich|bolen|gabin|kue sus|kue lumpur|donat/i, "roti-bakery"],
  [/nagasari|klepon|lemet|sawut|kue|serabi|puding/i, "kue-tradisional"],
  [/panggang|bakar/i, "panggangan"],
  [/rebus|kukus|edamame|telur puyuh|telor rebus|jagung rebus/i, "rebusan"],
  [/risol|bakwan|misro|onde|pastel|kroket|sosis solo|tahu|ubi|pisang goreng/i, "gorengan"],
  [/bihun|urap|kroket/i, "lainnya"],
];

/** Buah pendamping selalu masuk kategori "Buah Segar". */
export function guessCategorySlug(
  itemName: string,
  itemType: MenuItemType,
): string {
  if (itemType === "fruit") return "buah-segar";

  for (const [pattern, slug] of CATEGORY_KEYWORDS) {
    if (pattern.test(itemName)) return slug;
  }
  return "lainnya";
}
