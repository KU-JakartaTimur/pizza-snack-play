import { describe, expect, test } from "bun:test";
import { groupPetugasByDate } from "./petugas";
import type { PetugasRow } from "./repository";

/** Baris petugas dengan nilai default — hanya yang relevan yang diisi. */
function row(
  overrides: Partial<PetugasRow> & { scheduleDate: string; className: string },
): PetugasRow {
  return {
    petugasName: null,
    petugasParentName: null,
    petugasPhone: null,
    claimId: null,
    ...overrides,
  };
}

describe("groupPetugasByDate — pengurutan", () => {
  test("kelas diurutkan alami, bukan abjad", () => {
    const result = groupPetugasByDate([
      row({ scheduleDate: "2026-10-01", className: "10" }),
      row({ scheduleDate: "2026-10-01", className: "2" }),
      row({ scheduleDate: "2026-10-01", className: "1" }),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].classes.map((c) => c.className)).toEqual(["1", "2", "10"]);
  });

  test("tanggal diurutkan menaik walau masukannya acak", () => {
    const result = groupPetugasByDate([
      row({ scheduleDate: "2026-10-05", className: "1" }),
      row({ scheduleDate: "2026-10-01", className: "1" }),
      row({ scheduleDate: "2026-10-02", className: "1" }),
    ]);

    expect(result.map((entry) => entry.date)).toEqual([
      "2026-10-01",
      "2026-10-02",
      "2026-10-05",
    ]);
  });
});

describe("groupPetugasByDate — pengelompokan", () => {
  test("satu entri per tanggal, kelasnya lengkap", () => {
    const result = groupPetugasByDate([
      row({ scheduleDate: "2026-10-01", className: "1", petugasName: "Budi" }),
      row({ scheduleDate: "2026-10-01", className: "2", petugasName: "Ani" }),
      row({ scheduleDate: "2026-10-02", className: "1", petugasName: "Citra" }),
    ]);

    expect(result).toHaveLength(2);
    expect(result[0].classes.map((c) => c.petugasName)).toEqual(["Budi", "Ani"]);
    expect(result[1].classes.map((c) => c.petugasName)).toEqual(["Citra"]);
  });

  test("tanggal tanpa baris tidak melahirkan entri kosong", () => {
    expect(groupPetugasByDate([])).toEqual([]);
  });

  test("kelas yang belum ada petugas tetap ikut, namanya null", () => {
    const result = groupPetugasByDate([
      row({ scheduleDate: "2026-10-01", className: "1", petugasName: "Budi" }),
      row({ scheduleDate: "2026-10-01", className: "2" }),
    ]);

    expect(result[0].classes[1]).toEqual({
      className: "2",
      petugasName: null,
      petugasParentName: null,
      petugasPhone: null,
      claimed: false,
    });
  });
});

describe("groupPetugasByDate — asal petugas", () => {
  test("ada klaim berarti diambil orang tua", () => {
    const result = groupPetugasByDate([
      row({
        scheduleDate: "2026-10-01",
        className: "1",
        petugasName: "Budi",
        petugasParentName: "Ibu Sari",
        claimId: 7,
      }),
    ]);

    expect(result[0].classes[0].claimed).toBe(true);
  });

  test("tanpa klaim berarti ditunjuk korlas, nama orang tua tetap diteruskan", () => {
    const result = groupPetugasByDate([
      row({
        scheduleDate: "2026-10-01",
        className: "1",
        petugasName: "Budi",
        petugasParentName: "Ibu Sari",
        claimId: null,
      }),
    ]);

    expect(result[0].classes[0]).toEqual({
      className: "1",
      petugasName: "Budi",
      petugasParentName: "Ibu Sari",
      petugasPhone: null,
      claimed: false,
    });
  });
});

describe("groupPetugasByDate — nomor wali petugas", () => {
  test("nomor wali diteruskan apa adanya, tanpa dirapikan", () => {
    const result = groupPetugasByDate([
      row({
        scheduleDate: "2026-10-01",
        className: "1",
        petugasName: "Budi",
        petugasParentName: "Ibu Sari",
        petugasPhone: "0812-3456-7890",
      }),
    ]);

    expect(result[0].classes[0].petugasPhone).toBe("0812-3456-7890");
  });

  test("wali yang belum mengisi nomor tetap diwakili, nomornya null", () => {
    const result = groupPetugasByDate([
      row({
        scheduleDate: "2026-10-01",
        className: "1",
        petugasName: "Budi",
        petugasParentName: "Ibu Sari",
        petugasPhone: null,
      }),
    ]);

    expect(result[0].classes[0].petugasParentName).toBe("Ibu Sari");
    expect(result[0].classes[0].petugasPhone).toBeNull();
  });
});
