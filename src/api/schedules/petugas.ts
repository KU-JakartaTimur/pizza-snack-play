/**
 * Pengelompokan petugas piket kelas lain per tanggal.
 *
 * Dipisahkan dari service-nya karena bagian ini **murni**: dari baris-baris
 * database ia hanya menyusun ulang dan mengurutkan, tanpa menyentuh apa pun.
 * Dengan begitu aturan urutannya bisa diuji tanpa database — dan panel "kelas
 * lain" di halaman Pilih Jadwal menampilkan urutan yang sama persis dengan
 * yang diuji, bukan urutan kebetulan dari SQL.
 */
import type { ClassPetugasDto, DatePetugasDto } from "../../types/schedule";
import { compareClassNames } from "../utils/classNames";
import type { PetugasRow } from "./repository";

/**
 * Susun baris petugas menjadi daftar per tanggal.
 *
 * Dua hal yang dijamin di sini:
 *
 *  1. **Tanggal tanpa satu pun baris tidak muncul** — daftar kosong hanya
 *     menghasilkan baris kosong di UI, jadi tidak dihasilkan sama sekali.
 *  2. **Kelas diurutkan alami** ("1", "2", … "10"). Urutan dari SQL adalah
 *     urutan teks, sehingga "10" akan mendahului "2" bila dibiarkan.
 */
export function groupPetugasByDate(rows: PetugasRow[]): DatePetugasDto[] {
  const byDate = new Map<string, ClassPetugasDto[]>();

  for (const row of rows) {
    const classes = byDate.get(row.scheduleDate) ?? [];

    classes.push({
      className: row.className,
      petugasName: row.petugasName,
      petugasParentName: row.petugasParentName,
      // Adanya klaim = tanggal ini diambil orang tua, bukan ditunjuk korlas.
      claimed: row.claimId !== null,
    });

    byDate.set(row.scheduleDate, classes);
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, classes]) => ({
      date,
      classes: classes.sort((a, b) => compareClassNames(a.className, b.className)),
    }));
}
