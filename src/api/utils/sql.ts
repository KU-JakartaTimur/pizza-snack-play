/** Pembantu query SQL. */

/**
 * Netralkan wildcard `LIKE` (`%`, `_`, `\`) pada input pengguna.
 *
 * Tanpa ini, mencari `100%` akan cocok dengan semua baris, dan `_` akan
 * cocok dengan karakter apa pun — perilaku yang membingungkan pengguna.
 * Dipakai bersama klausa `LIKE ... ESCAPE '\'`.
 */
export function escapeLike(value: string): string {
  return value.replace(/[%_\\]/g, (match) => `\\${match}`);
}

/** Bungkus nilai menjadi pola `LIKE` yang aman. */
export function likePattern(value: string): string {
  return `%${escapeLike(value.trim())}%`;
}
