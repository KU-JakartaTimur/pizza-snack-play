import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  LANDING_ART,
  LANDING_BENEFITS,
  LANDING_FACTS,
  LANDING_FAQ,
  LANDING_PREVIEW,
  LANDING_ROLES,
  LANDING_STEPS,
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
});
