import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  LANDING_ABOUT,
  LANDING_ABOUT_MODULES,
  LANDING_ABOUT_NOTE,
  LANDING_ABOUT_POINTS,
  LANDING_ABOUT_STATS,
  LANDING_ART,
  LANDING_BENEFITS,
  LANDING_FACTS,
  LANDING_FAQ,
  LANDING_PREVIEW,
  LANDING_ROLES,
  LANDING_STEPS,
  LANDING_TECH,
} from "./content";

/**
 * Halaman depan adalah janji kepada orang tua yang belum punya akun, dan
 * isinya ditulis tangan. Uji ini menjaga hal-hal yang gampang rusak diam-diam
 * saat teksnya disunting: butir yang tertinggal kosong, judul yang terduplikasi
 * sehingga dua kartu tampak sama, dan contoh menu yang tidak ada di katalog.
 */

/** Semua butir berjudul di halaman ini — dipakai untuk memeriksa duplikasi. */
const titled = [
  ...LANDING_BENEFITS.map((item) => item.title),
  ...LANDING_ROLES.flatMap((role) => role.features.map((item) => item.title)),
  ...LANDING_STEPS.map((item) => item.title),
  ...LANDING_ABOUT_POINTS.map((item) => item.title),
  LANDING_ART.title,
];

describe("teks halaman depan", () => {
  test("setiap butir punya judul dan penjelasan yang terisi", () => {
    const filled = [
      ...LANDING_BENEFITS.map((item) => [item.title, item.description]),
      ...LANDING_ROLES.flatMap((role) => [
        [role.label, role.blurb] as const,
        ...role.features.map((item) => [item.title, item.description] as const),
      ]),
      ...LANDING_STEPS.map((item) => [item.title, item.description] as const),
      ...LANDING_FAQ.map((item) => [item.question, item.answer] as const),
      ...LANDING_ABOUT_POINTS.map(
        (item) => [item.title, item.description] as const,
      ),
      ...LANDING_TECH.map((item) => [item.layer, item.items] as const),
      [LANDING_ABOUT.title, LANDING_ABOUT.lead] as const,
      [LANDING_ART.title, LANDING_ART.lead] as const,
    ];

    // `length > 0` di-AND supaya daftar kosong tidak lulus tanpa membuktikan apa pun.
    expect(filled.length).toBeGreaterThan(0);
    for (const [headline, body] of filled) {
      expect(headline.trim().length).toBeGreaterThan(0);
      expect(body.trim().length).toBeGreaterThan(0);
    }
  });

  test("judul tidak terduplikasi — dua kartu dengan judul sama membingungkan", () => {
    expect(titled.length).toBeGreaterThan(0);
    expect(new Set(titled).size).toBe(titled.length);
  });

  test("setiap peran punya id unik dan minimal satu fitur", () => {
    expect(LANDING_ROLES.length).toBeGreaterThan(0);
    expect(new Set(LANDING_ROLES.map((role) => role.id)).size).toBe(
      LANDING_ROLES.length,
    );
    for (const role of LANDING_ROLES) {
      expect(role.features.length).toBeGreaterThan(0);
    }
  });

  test("lencana fakta tidak kosong dan tidak kembar", () => {
    expect(LANDING_FACTS.length).toBeGreaterThan(0);
    for (const fact of LANDING_FACTS) {
      expect(fact.trim().length).toBeGreaterThan(0);
    }
    expect(new Set(LANDING_FACTS).size).toBe(LANDING_FACTS.length);
  });

  test("contoh di hero memakai menu, komponen, dan petugas yang ada di katalog sekolah", () => {
    // Kartu contoh di hero hanya boleh menampilkan nama yang benar-benar ada di
    // seed. Contoh karangan akan menjanjikan menu atau petugas yang tidak
    // pernah muncul di aplikasi.
    const seed = readFileSync(
      join(import.meta.dir, "../../../drizzle/seed.sql"),
      "utf8",
    );
    const menuItems = seed.slice(seed.indexOf("INSERT INTO menu_items"));

    expect(seed).toContain(LANDING_PREVIEW.menuName);
    for (const component of LANDING_PREVIEW.components) {
      expect(menuItems).toContain(`'${component.name}'`);
    }
    for (const petugas of LANDING_PREVIEW.petugas) {
      expect(seed).toContain(`'${petugas.name}'`);
    }
  });

  test("modul yang disebut di bagian tentang benar-benar ada di src/api", () => {
    // Bagian ini menyebut sembilan modul API dengan namanya. Menyebut modul
    // yang tidak ada — atau melewatkan yang ada — membuat keterangannya bohong,
    // dan itu jenis kebohongan yang tidak terlihat sampai ada yang membuka kode.
    const apiDir = join(import.meta.dir, "../../api");
    const domains: string[] = readdirSync(apiDir, { withFileTypes: true })
      .filter(
        (entry) =>
          entry.isDirectory() &&
          existsSync(join(apiDir, entry.name, "route.ts")),
      )
      .map((entry) => entry.name)
      .sort();

    expect(domains).toEqual(
      LANDING_ABOUT_MODULES.map((item) => item.name).sort(),
    );
    expect(new Set(LANDING_ABOUT_MODULES.map((item) => item.label)).size).toBe(
      LANDING_ABOUT_MODULES.length,
    );
    expect(LANDING_ABOUT_NOTE.trim().length).toBeGreaterThan(0);
  });

  test("angka di kartu “Isi aplikasinya” masih cocok dengan repositori", () => {
    // Angka "65 endpoint" dan "13 tabel" dipakai untuk meyakinkan sekolah bahwa
    // aplikasinya bukan mockup. Karena itu angkanya dihitung ulang di sini:
    // menambah endpoint tanpa memperbarui halaman depan akan menggagalkan uji.
    const apiDir = join(import.meta.dir, "../../api");
    const domains = readdirSync(apiDir, { withFileTypes: true })
      .filter(
        (entry) =>
          entry.isDirectory() &&
          existsSync(join(apiDir, entry.name, "route.ts")),
      )
      .map((entry) => entry.name);

    const endpoints = domains.reduce((total, domain) => {
      const source = readFileSync(join(apiDir, domain, "route.ts"), "utf8");
      return total + (source.match(/\.(get|post|put|delete)\(/g)?.length ?? 0);
    }, 0);

    const migrationsDir = join(import.meta.dir, "../../../drizzle/migrations");
    const tables = new Set<string>();
    for (const file of readdirSync(migrationsDir)) {
      if (!file.endsWith(".sql")) continue;
      const sql = readFileSync(join(migrationsDir, file), "utf8");
      for (const [, name] of sql.matchAll(/CREATE TABLE `([^`]+)`/g)) {
        // Tabel `*_new` adalah sisa rebuild yang sudah diganti namanya —
        // menghitungnya akan melebihkan jumlah tabel yang benar-benar hidup.
        if (!name.endsWith("_new")) tables.add(name);
      }
    }

    const stat = (label: string) =>
      Number(LANDING_ABOUT_STATS.find((item) => item.label === label)?.value);

    expect(stat("modul API")).toBe(domains.length);
    expect(stat("endpoint")).toBe(endpoints);
    expect(stat("tabel D1")).toBe(tables.size);
  });
});
