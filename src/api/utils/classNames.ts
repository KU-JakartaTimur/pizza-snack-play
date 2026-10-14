/**
 * Urutan nama kelas — satu tempat untuk seluruh server.
 *
 * Nama kelas disimpan sebagai teks ("1", "2", … "10"), sehingga pengurutan
 * biasa menaruh "10" sebelum "2". Perbandingan `numeric` memperbaikinya, dan
 * karena aturan ini dipakai di beberapa tempat (daftar kelas yang tersentuh
 * kunci/publikasi, panel petugas kelas lain), ia tinggal di sini agar tidak
 * mungkin berbeda antar pemanggil.
 */

/** Pembanding nama kelas: alami (`"2"` sebelum `"10"`), bukan abjad. */
export function compareClassNames(a: string, b: string): number {
  return a.localeCompare(b, "id", { numeric: true });
}

/**
 * Urutkan nama kelas secara alami, **duplikat dibuang**.
 *
 * Yang dilaporkan pemanggilnya selalu "kelas mana saja yang tersentuh",
 * bukan berapa barisnya — jadi himpunan, bukan daftar.
 */
export function sortClassNames(names: Iterable<string>): string[] {
  return [...new Set(names)].sort(compareClassNames);
}
