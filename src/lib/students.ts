import type { StudentProfile } from "@/types/auth";

/**
 * Urutan nama kelas untuk sisi klien.
 *
 * Disalin dari `src/api/utils/classNames.ts`, bukan diimpor, karena
 * `tsconfig.app.json` mengecualikan folder `src/api` dari kompilasi frontend —
 * alasan yang sama dengan `lib/date.ts`. Aturannya sengaja dijaga identik:
 * nama kelas disimpan sebagai teks ("1" … "10"), jadi perbandingan `numeric`
 * diperlukan agar "2" tidak kalah dari "10".
 */
function compareClassNames(a: string, b: string): number {
  return a.localeCompare(b, "id", { numeric: true });
}

/**
 * Anak yang mewakili orang tuanya — dipakai saat hanya ada ruang untuk satu nama.
 *
 * Satu orang tua dapat punya beberapa anak, dan yang dipilih adalah anak di
 * **kelas tertinggi**: ia yang paling lama bersekolah, jadi jadwalnya yang
 * paling sering dibuka orang tuanya.
 *
 * Anak yang kelasnya belum diisi (`null`) diperlakukan sebagai paling rendah,
 * supaya data yang belum lengkap tidak menggeser anak yang kelasnya sudah
 * jelas. Bila kelasnya sama, yang lebih dulu di daftar yang menang — daftar
 * dari server sudah urut `students.id`, sehingga pilihannya tidak berpindah
 * sendiri antar sesi.
 */
export function primaryStudent(
  students: readonly StudentProfile[],
): StudentProfile | null {
  let primary: StudentProfile | null = null;

  for (const student of students) {
    const higher =
      primary === null ||
      compareClassNames(primary.className ?? "", student.className ?? "") < 0;

    if (higher) primary = student;
  }

  return primary;
}
