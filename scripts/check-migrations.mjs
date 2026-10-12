/**
 * Menjaga berkas migrasi bebas dari titik-koma di dalam komentar.
 *
 * Latar masalah — `0008_heavy_human_robot.sql` sempat gagal di production:
 *
 *   X [ERROR] SQL code did not contain a statement. [code: 7500]
 *
 * Penyebabnya bukan SQL-nya, melainkan komentarnya. `wrangler d1 migrations
 * apply` **tidak** menjalankan berkasnya sebagai berkas: isinya dibaca, disambung
 * dengan `INSERT INTO d1_migrations …`, lalu dikirim sebagai **satu string
 * perintah** — jalur yang sama dengan `d1 execute --command`. Di jalur itu
 * pemisah pernyataan D1 memotong string pada setiap titik-koma **sebelum**
 * komentar dibuang. Komentar yang memuat titik-koma karena itu pecah, dan
 * potongan pertamanya (yang isinya cuma pembuka komentar) jadi kosong lalu
 * ditolak 7500.
 *
 * Jebakan ini sulit terlihat sendiri karena **hanya muncul di production**:
 *
 * - `d1 execute --file` aman — wrangler memotongnya sendiri di sisi klien.
 * - `db:migrate:local` aman — miniflare memakai pemisah yang berbeda, jadi
 *   migrasinya sukses dan kolomnya benar-benar terbentuk di database lokal.
 *
 * Akibatnya kegagalan baru ketahuan saat `bun run deploy`, di langkah migrasi,
 * setelah build selesai — dan karena urutannya migrasi dulu lalu deploy, Worker
 * lamanya tetap melayani seolah tidak terjadi apa-apa.
 *
 * Berkas di direktori ini ditulis tangan dan memang panjang komentarnya (lihat
 * `0007_petugas_link.sql`), jadi contoh kode di dalam prosa adalah hal yang
 * wajar — dan di situlah titik-koma paling mudah ikut terbawa. Skrip ini
 * memeriksanya sebelum migrasi dijalankan, bukan sesudahnya.
 *
 * Jalankan: bun run scripts/check-migrations.mjs [direktori]
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_DIR = join(HERE, "..", "drizzle", "migrations");

const dir = process.argv[2] ?? DEFAULT_DIR;
const files = readdirSync(dir)
  .filter((name) => name.endsWith(".sql"))
  .sort();

if (files.length === 0) {
  console.error(`Tidak ada berkas .sql di ${dir}`);
  process.exit(1);
}

/** Nomor baris (1-based) untuk sebuah indeks karakter. */
const lineAt = (text, index) => text.slice(0, index).split("\n").length;

const problems = [];

for (const name of files) {
  const raw = readFileSync(join(dir, name), "utf8");

  // Komentar blok diperiksa apa adanya, lalu "dikosongkan" supaya komentar
  // baris di dalamnya tidak ikut terhitung dua kali.
  const masked = raw.replace(/\/\*[\s\S]*?\*\//g, (block) =>
    block.replace(/[^\n]/g, " "),
  );

  const comments = [
    ...[...raw.matchAll(/\/\*[\s\S]*?\*\//g)].map((m) => ({
      index: m.index,
      text: m[0],
      kind: "blok",
    })),
    ...[...masked.matchAll(/--[^\n]*/g)].map((m) => ({
      index: m.index,
      text: m[0],
      kind: "baris",
    })),
  ];

  for (const comment of comments) {
    const count = (comment.text.match(/;/g) ?? []).length;
    if (count === 0) continue;
    problems.push({
      name,
      line: lineAt(raw, comment.index),
      kind: comment.kind,
      count,
      // Kalimat pembuka komentar biasanya sudah cukup untuk menemukannya.
      excerpt: comment.text.replace(/\s+/g, " ").slice(0, 90),
    });
  }

  // Sanity: di luar komentar harus tetap ada pernyataan yang bisa dijalankan.
  const bare = masked.replace(/--[^\n]*/g, "");
  const statements = bare
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
  if (statements.length === 0) {
    problems.push({ name, line: 1, kind: "kosong", count: 0, excerpt: "tidak ada pernyataan" });
  }
}

if (problems.length > 0) {
  console.error("\nBerkas migrasi tidak lolos pemeriksaan:\n");
  for (const p of problems) {
    if (p.kind === "kosong") {
      console.error(`  ${p.name}:${p.line}  ${p.excerpt}`);
      continue;
    }
    console.error(
      `  ${p.name}:${p.line}  ${p.count} titik-koma di dalam komentar ${p.kind}`,
    );
    console.error(`      ${p.excerpt}…`);
  }
  console.error(`
Titik-koma di dalam komentar membuat \`d1 migrations apply --remote\` gagal
dengan "SQL code did not contain a statement" [7500] — lihat penjelasan di
kepala scripts/check-migrations.mjs. Tulis contohnya tanpa titik-koma.
`);
  process.exit(1);
}

console.log(`✅ ${files.length} berkas migrasi bersih (tidak ada titik-koma di komentar).`);
