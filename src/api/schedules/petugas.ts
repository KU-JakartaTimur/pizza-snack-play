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
  const classesByDate = new Map<string, ClassPetugasDto[]>();

  for (const row of rows) {
    const classes = classesByDate.get(row.scheduleDate) ?? [];

    classes.push(toClassPetugasDto(row));
    classesByDate.set(row.scheduleDate, classes);
  }

  return [...classesByDate.entries()]
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, classes]) => ({
      date,
      classes: classes.sort(compareByClass),
    }));
}

/** Satu baris database → satu baris DTO. Satu-satunya tempat pemetaannya. */
function toClassPetugasDto(row: PetugasRow): ClassPetugasDto {
  return {
    className: row.className,
    petugasName: row.petugasName,
    petugasParentName: row.petugasParentName,
    petugasPhone: row.petugasPhone,
    // Adanya klaim = tanggal ini diambil orang tua, bukan ditunjuk korlas.
    claimed: row.claimId !== null,
  };
}

/** Kelas diurutkan alami ("1", "2", … "10"), bukan urut teks. */
function compareByClass(a: ClassPetugasDto, b: ClassPetugasDto): number {
  return compareClassNames(a.className, b.className);
}
