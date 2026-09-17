/** Gabungkan class Tailwind secara kondisional. */
export function cn(...values: (string | false | null | undefined)[]): string {
  return values.filter(Boolean).join(" ");
}

/**
 * Utility lebar yang boleh menimpa `w-full` bawaan kontrol form.
 *
 * Sengaja tidak menyertakan `max-w-*`: `max-w-xs` saja tidak boleh membuat
 * kontrol kehilangan `w-full`.
 */
const WIDTH_UTILITY = /(?:^|\s)(?:w-|min-w-|basis-)/;

/**
 * Gabungkan class untuk kontrol form (`Input`, `Select`, `Textarea`).
 *
 * `cn` tidak melakukan dedupe seperti `tailwind-merge`: bila dua utility
 * menyentuh properti yang sama — misalnya `w-full` bawaan dan `w-28` dari
 * pemanggil — pemenangnya ditentukan urutan di stylesheet, bukan urutan
 * penulisan, sehingga `w-full` selalu menang dan lebar eksplisit diabaikan.
 *
 * Helper ini membuang `w-full` dari `base` ketika pemanggil memberikan utility
 * lebar sendiri.
 */
export function cnControl(base: string, className?: string): string {
  if (className && WIDTH_UTILITY.test(className)) {
    return cn(base.replace(/(?:^|\s)w-full(?=\s|$)/, ""), className);
  }
  return cn(base, className);
}
