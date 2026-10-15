import { describe, expect, test } from "bun:test";
import type { StudentProfile } from "@/types/auth";
import { primaryStudent } from "./students";

/** Anak dengan nilai wajar, siap ditimpa seperlunya per kasus uji. */
function student(
  id: number,
  name: string,
  className: string | null = "1",
): StudentProfile {
  return { id, name, className };
}

describe("primaryStudent", () => {
  test("orang tua tanpa anak tidak punya anak utama", () => {
    expect(primaryStudent([])).toBeNull();
  });

  test("anak tunggal dipakai apa adanya", () => {
    const only = student(1, "Aisyah Sari", "1");
    expect(primaryStudent([only])).toBe(only);
  });

  test("anak di kelas tertinggi yang dipakai", () => {
    const primary = primaryStudent([
      student(1, "Citra Dewi", "2"),
      student(2, "Raka Dewi", "3"),
    ]);

    expect(primary?.name).toBe("Raka Dewi");
  });

  test("urutan kelas alami — 10 di atas 2, bukan di bawahnya", () => {
    const primary = primaryStudent([
      student(1, "Adik", "2"),
      student(2, "Kakak", "10"),
    ]);

    expect(primary?.name).toBe("Kakak");
  });

  test("kelas yang belum diisi tidak menggeser anak yang sudah jelas", () => {
    const primary = primaryStudent([
      student(1, "Belum Ada Kelas", null),
      student(2, "Sudah Ada Kelas", "1"),
    ]);

    expect(primary?.name).toBe("Sudah Ada Kelas");
  });

  test("semua kelas kosong — yang pertama di daftar yang dipakai", () => {
    const primary = primaryStudent([
      student(1, "Anak Pertama", null),
      student(2, "Anak Kedua", null),
    ]);

    expect(primary?.name).toBe("Anak Pertama");
  });

  test("kelas sama tidak membuat pilihan berpindah", () => {
    const primary = primaryStudent([
      student(1, "Anak Pertama", "1A"),
      student(2, "Anak Kedua", "1A"),
    ]);

    expect(primary?.name).toBe("Anak Pertama");
  });

  test("kelas dengan huruf dibandingkan apa adanya", () => {
    const primary = primaryStudent([
      student(1, "Satu A", "1A"),
      student(2, "Satu B", "1B"),
    ]);

    expect(primary?.name).toBe("Satu B");
  });
});
