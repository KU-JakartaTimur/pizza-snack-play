import { describe, expect, test } from "bun:test";
import type { ParentDto } from "../../types/account";
import { readXlsxGrid } from "../utils/xlsxRead";
import { ACCOUNT_COLUMNS, buildAccountsSheet } from "./export";
import { nameKey, parseAccountsSheet, parseChild } from "./import";

/** Kepala kolom dalam urutan yang sama dengan berkas ekspor. */
const HEADER = [
  ACCOUNT_COLUMNS.parentName,
  ACCOUNT_COLUMNS.username,
  ACCOUNT_COLUMNS.password,
  ACCOUNT_COLUMNS.role,
  ACCOUNT_COLUMNS.className,
  ACCOUNT_COLUMNS.students,
  ACCOUNT_COLUMNS.active,
  ACCOUNT_COLUMNS.locked,
  ACCOUNT_COLUMNS.lastLogin,
];

/** Bangun kisi seperti lembar Excel: judul, kepala kolom, lalu baris data. */
function sheet(rows: string[][]): string[][] {
  return [
    ["Daftar Akun Orang Tua"],
    ["Semua akun"],
    [],
    HEADER,
    ...rows,
    [],
    ["Ringkasan: 1 akun · 1 aktif · 0 terkunci · 0 korlas"],
  ];
}

function parseOk(grid: string[][]) {
  const result = parseAccountsSheet(grid);
  if (!result.ok) throw new Error(`seharusnya terbaca: ${result.error}`);
  return result;
}

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
} satisfies ParentDto;

describe("parseChild", () => {
  test("nama dengan kelas dalam tanda kurung", () => {
    expect(parseChild("Budi (1A)")).toEqual({ name: "Budi", className: "1A" });
  });

  test("nama tanpa kelas", () => {
    expect(parseChild("Ani")).toEqual({ name: "Ani", className: null });
  });

  test("kurung kosong bukan penanda kelas", () => {
    expect(parseChild("Budi ()")).toEqual({ name: "Budi", className: null });
  });

  test("teks yang hanya berisi kelas dibiarkan apa adanya", () => {
    expect(parseChild("(1A)")).toEqual({ name: "(1A)", className: null });
  });
});

describe("parseAccountsSheet — mencari kepala kolom", () => {
  test("melewati baris judul dan berhenti di baris ringkasan", () => {
    const result = parseOk(
      sheet([
        ["Sari Wulandari", "sari", "", "Orang tua", "", "Budi (1A)", "Ya", "", ""],
      ]),
    );

    expect(result.rows).toHaveLength(1);
    expect(result.issues).toHaveLength(0);
    // Baris ringkasan tidak ikut terbaca sebagai data.
    expect(result.rows[0].row).toBe(5);
  });

  test("kolom dicocokkan dari namanya, bukan posisinya", () => {
    const shuffled = [
      ["Anak", "Username", "Nama orang tua", "Aktif", "Password", "Peran"],
      ["Budi (1A)", "sari", "Sari Wulandari", "Ya", "", "Orang tua"],
    ];

    const result = parseOk(shuffled);
    expect(result.rows[0]).toMatchObject({
      parentName: "Sari Wulandari",
      username: "sari",
      students: [{ name: "Budi", className: "1A" }],
      isActive: true,
    });
  });

  test("lembar tanpa kepala kolom ditolak dengan pesan yang jelas", () => {
    const result = parseAccountsSheet([["halo", "dunia"]]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain(ACCOUNT_COLUMNS.parentName);
  });

  test("kolom wajib yang hilang disebutkan namanya", () => {
    const result = parseAccountsSheet([
      [ACCOUNT_COLUMNS.parentName, ACCOUNT_COLUMNS.students],
      ["Sari", "Budi"],
    ]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain(ACCOUNT_COLUMNS.username);
    expect(result.error).toContain(ACCOUNT_COLUMNS.password);
  });
});

describe("parseAccountsSheet — penafsiran baris", () => {
  test("baris lengkap menghasilkan data yang siap dipakai", () => {
    const result = parseOk(
      sheet([
        [
          "Budi Santoso",
          "budi",
          "rahasia123",
          "Korlas",
          "1A",
          "Ani (2B), Adi",
          "Tidak",
          "",
          "",
        ],
      ]),
    );

    expect(result.rows[0]).toEqual({
      row: 5,
      parentName: "Budi Santoso",
      username: "budi",
      password: "rahasia123",
      role: "korlas",
      className: "1A",
      students: [
        { name: "Ani", className: "2B" },
        { name: "Adi", className: null },
      ],
      isActive: false,
    });
  });

  test("kolom Aktif kosong berarti jangan diubah", () => {
    const result = parseOk(
      sheet([["Sari", "sari", "", "Orang tua", "", "Budi", "", "", ""]]),
    );
    expect(result.rows[0].isActive).toBeNull();
    expect(result.rows[0].password).toBeNull();
  });

  test("kolom Anak kosong berarti daftar anaknya jangan diubah", () => {
    const result = parseOk(
      sheet([["Sari", "sari", "", "Orang tua", "", "", "Ya", "", ""]]),
    );
    expect(result.rows[0].students).toBeNull();
    // Sel kosong bukan kesalahan tulis — akun lama memang boleh belum punya anak.
    expect(result.issues).toHaveLength(0);
  });

  test("baris bermasalah dilaporkan, tidak dikembalikan sebagai data", () => {
    const result = parseOk(
      sheet([
        ["", "tanpa-nama", "", "Orang tua", "", "Budi", "Ya", "", ""],
        ["Tanpa Username", "", "", "Orang tua", "", "Budi", "Ya", "", ""],
        ["Username Pendek", "ab", "", "Orang tua", "", "Budi", "Ya", "", ""],
        ["Password Pendek", "pendek", "123", "Orang tua", "", "Budi", "Ya", "", ""],
        ["Peran Aneh", "aneh", "", "Ketua", "", "Budi", "Ya", "", ""],
        ["Korlas Tanpa Kelas", "korlas1", "", "Korlas", "", "Budi", "Ya", "", ""],
        ["Anak Tidak Terbaca", "anakaneh", "", "Orang tua", "", ", ,", "Ya", "", ""],
        ["Aktif Aneh", "aneh2", "", "Orang tua", "", "Budi", "Kadang", "", ""],
      ]),
    );

    expect(result.rows).toHaveLength(0);
    expect(result.issues.map((issue) => issue.row)).toEqual([5, 6, 7, 8, 9, 10, 11, 12]);
    expect(result.issues[0].message).toContain("Nama orang tua kosong");
    expect(result.issues[2].message).toContain("tidak sah");
    expect(result.issues[5].message).toContain("kelas yang dikoordinasi");
    expect(result.issues[6].message).toContain(ACCOUNT_COLUMNS.students);
    expect(result.issues[7].message).toContain(ACCOUNT_COLUMNS.active);
  });

  test("username dinormalkan ke huruf kecil", () => {
    const result = parseOk(
      sheet([["Sari", "  SARI  ", "", "Orang tua", "", "Budi", "Ya", "", ""]]),
    );
    expect(result.rows[0].username).toBe("sari");
  });

  test("nama orang tua tidak diubah huruf besarnya", () => {
    const result = parseOk(
      sheet([["  Sari Wulandari ", "sari", "", "Orang tua", "", "Budi", "Ya", "", ""]]),
    );
    expect(result.rows[0].parentName).toBe("Sari Wulandari");
  });
});

describe("nameKey", () => {
  test("menyamakan beda huruf besar/kecil dan spasi berlebih", () => {
    expect(nameKey("  Budi   Santoso ")).toBe(nameKey("budi santoso"));
  });
});

describe("bundar: ekspor → baca → tafsir", () => {
  test("berkas hasil ekspor bisa dibaca kembali apa adanya", async () => {
    const grid = await readXlsxGrid(buildAccountsSheet([base], "Semua akun"));
    const result = parseOk(grid);

    expect(result.issues).toHaveLength(0);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({
      parentName: "Sari Wulandari",
      username: "sari",
      // Password tidak pernah diekspor — sel kosong berarti "jangan diubah".
      password: null,
      role: "parent",
      className: null,
      students: [{ name: "Budi", className: "1A" }],
      isActive: true,
    });
  });

  test("kolom password yang diisi admin terbaca sebagai password akun baru", async () => {
    const grid = await readXlsxGrid(buildAccountsSheet([base], "Semua akun"));
    // Menirukan admin mengetik password di kolom kosong itu.
    const headerRow = grid.findIndex(
      (row) => row?.[0] === ACCOUNT_COLUMNS.parentName,
    );
    grid[headerRow + 1][2] = "rahasia123";

    const result = parseOk(grid);
    expect(result.rows[0].password).toBe("rahasia123");
  });

  test("akun tanpa anak tetap bisa diimpor ulang apa adanya", async () => {
    // Nyata di data sekolah: sebagian akun belum punya anak sama sekali.
    // Kalau baris seperti ini ditolak, berkas hasil ekspor sendiri tidak
    // akan pernah bisa diunggah kembali.
    const withoutChildren: ParentDto = { ...base, students: [] };

    const grid = await readXlsxGrid(
      buildAccountsSheet([withoutChildren], "Semua akun"),
    );
    const result = parseOk(grid);

    expect(result.issues).toHaveLength(0);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].students).toBeNull();
  });

  test("korlas dengan kelas & beberapa anak tetap bundar", async () => {
    const korlas: ParentDto = {
      ...base,
      parentName: "Budi Santoso",
      username: "budi",
      role: "korlas",
      className: "1A",
      students: [
        { id: 1, name: "Ani", className: "2B" },
        { id: 2, name: "Adi", className: null },
      ],
      isActive: false,
    };

    const grid = await readXlsxGrid(buildAccountsSheet([korlas], "Semua akun"));
    const result = parseOk(grid);

    expect(result.rows[0]).toMatchObject({
      parentName: "Budi Santoso",
      username: "budi",
      role: "korlas",
      className: "1A",
      students: [
        { name: "Ani", className: "2B" },
        { name: "Adi", className: null },
      ],
      isActive: false,
    });
  });
});
