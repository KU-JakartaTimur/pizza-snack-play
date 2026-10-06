import { describe, expect, test } from "bun:test";
import { accountsFilename, buildAccountsSheet } from "./export";

const base = {
  id: 1,
  userId: 1,
  username: "sari",
  parentName: "Sari Wulandari",
  students: [{ id: 1, name: "Budi", className: "1A" }],
  relationship: "ibu" as const,
  role: "parent" as const,
  className: null,
  phone: null,
  address: null,
  email: null,
  isActive: true,
  lastLoginAt: null,
  lockedAt: null,
  createdAt: "2026-09-01 00:00:00",
};

describe("buildAccountsSheet", () => {
  test("menghasilkan ZIP (xlsx) yang diawali byte PK", () => {
    const bytes = buildAccountsSheet([base], "Semua akun");
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
    expect(bytes.length).toBeGreaterThan(1000);
  });

  test("menyebut jumlah akun dan yang aktif di ringkasan", () => {
    const bytes = buildAccountsSheet([base], "Semua akun");
    const text = new TextDecoder().decode(bytes);
    expect(text).toContain("1 akun");
    expect(text).toContain("1 aktif");
    expect(text).toContain("Daftar Akun Orang Tua");
  });

  test("jam login terakhir digeser ke WIB (+7) dan bulan ditulis penuh", () => {
    const text = new TextDecoder().decode(
      buildAccountsSheet(
        [{ ...base, lastLoginAt: "2026-09-30 04:12:00" }],
        "Semua akun",
      ),
    );
    // 04:12 UTC = 11:12 WIB pada tanggal yang sama.
    expect(text).toContain("30 September 2026 11:12");
  });

  test("akun tanpa riwayat masuk ditandai 'Belum pernah'", () => {
    const text = new TextDecoder().decode(
      buildAccountsSheet([base], "Semua akun"),
    );
    expect(text).toContain("Belum pernah");
  });

  test("korlas menampilkan perannya dan kelas yang dikoordinasi", () => {
    const text = new TextDecoder().decode(
      buildAccountsSheet(
        [{ ...base, role: "korlas", className: "1A", parentName: "Budi Santoso" }],
        "Semua akun",
      ),
    );
    expect(text).toContain("Korlas");
    expect(text).toContain("1A");
  });

  test("anak ditulis dengan kelasnya, akun terkunci ditandai", () => {
    const text = new TextDecoder().decode(
      buildAccountsSheet(
        [
          {
            ...base,
            students: [
              { id: 1, name: "Budi", className: "1A" },
              { id: 2, name: "Ani", className: null },
            ],
            lockedAt: "2026-09-30 04:12:00",
          },
        ],
        "Semua akun",
      ),
    );
    expect(text).toContain("Budi (1A), Ani");
    expect(text).toContain("1 terkunci");
  });

  /**
   * Dua kolom ini yang membuat berkasnya bisa diunggah kembali lewat
   * `POST /parents/import`: `Username` sebagai kunci pencocokan, `Password`
   * sebagai tempat mengisi password akun baru.
   */
  test("memuat kolom Username dan Password agar bisa diimpor kembali", () => {
    const text = new TextDecoder().decode(
      buildAccountsSheet([base], "Semua akun"),
    );
    expect(text).toContain("Username");
    expect(text).toContain("Password");
    expect(text).toContain("sari");
  });

  test("kolom Password selalu kosong — hash tidak pernah diekspor", () => {
    const text = new TextDecoder().decode(
      buildAccountsSheet([base], "Semua akun"),
    );
    // Tidak ada nilai apa pun yang bocor ke sel password; satu-satunya
    // kemunculan "pbkdf2"/"password" yang boleh ada hanyalah kepalanya.
    expect(text).not.toContain("pbkdf2");
    expect(text.match(/Password/g)).toHaveLength(1);
  });
});

describe("accountsFilename", () => {
  test("berformat slug ASCII tanpa spasi", () => {
    expect(accountsFilename("2026-09-30")).toBe("akun-orang-tua-2026-09-30.xlsx");
  });
});
