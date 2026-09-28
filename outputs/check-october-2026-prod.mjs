/**
 * Verifikasi jadwal Oktober 2026 di **produksi** lewat Worker sungguhan.
 *
 *   node outputs/check-october-2026-prod.mjs
 *
 * Latar belakang: patch `scripts/sql/2026-10-october-menus.sql` ditulis
 * langsung ke D1 produksi (bukan lewat UI). Berkas ini membuktikan hasilnya
 * benar-benar **terbaca aplikasi**, bukan hanya tersimpan di tabel — sekaligus
 * mengunci daftar menu Oktober sebagai ekspektasi yang bisa diuji ulang.
 *
 * Yang diuji:
 *   A. `/api/schedules/month?year=2026&month=10` → 22 hari, menu per tanggal
 *      persis seperti daftar sekolah, 2 Okt bertanda libur.
 *   B. `/api/schedules/status?year=2026&month=10` → 132 baris `published`,
 *      tanpa sisa `draft`, dan keenam kelas punya jadwal.
 *
 * ⚠️ Menyentuh produksi: membuat **satu akun admin sekali pakai**
 * (`uji_okt_*`) lewat D1 REST API, lalu menghapusnya di blok `finally`.
 * Password akun uji dibuat di dalam skrip, tidak lewat baris perintah.
 * Kredensial Cloudflare dibaca dari `.env` proyek.
 *
 * Berbeda dengan `outputs/check-login-prod.mjs` (yang menguji aturan kunci
 * akun), berkas ini memeriksa **isi jadwal**. Keduanya sama-sama berbicara
 * ke Worker produksi, bukan ke D1 lokal.
 */
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.PSP_BASE ?? "https://pizza-snack-play.topidesta.workers.dev";
const PROJECT = path.resolve(path.dirname(new URL(import.meta.url).pathname.slice(1)), "..");

// ── kredensial Cloudflare dari .env proyek ───────────────────────
const env = {};
for (const line of fs
  .readFileSync(path.join(PROJECT, ".env"), "utf8")
  .split(/\r?\n/)) {
  const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
  if (m) env[m[1]] = m[2];
}

const D1_URL =
  `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}` +
  `/d1/database/${env.CLOUDFLARE_DATABASE_ID}/query`;

/** Satu perintah SQL ke D1 produksi. */
async function d1(sql, params = []) {
  const res = await fetch(D1_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.CLOUDFLARE_D1_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql, params }),
  });
  const payload = await res.json();
  if (!payload.success) throw new Error(`D1 gagal: ${JSON.stringify(payload.errors)}`);
  return payload.result[0]?.results ?? [];
}

// ── hash password (PBKDF2-SHA256, sama dengan src/api/utils/password.ts) ──
const ITERATIONS = 100_000;
const b64u = (bytes) =>
  Buffer.from(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    key,
    256,
  );
  return ["pbkdf2", String(ITERATIONS), b64u(salt), b64u(new Uint8Array(bits))].join("$");
}

/** Jadwal menu Oktober 2026 — `null` berarti libur. */
const EXPECTED_MENU = {
  "2026-10-01": "Puding Roti + Jeruk",
  "2026-10-02": null,
  "2026-10-05": "Pisang kukus + Melon",
  "2026-10-06": "Bubur kacang hijau + pisang",
  "2026-10-07": "pastel sayur + pir",
  "2026-10-08": "kacang rebus + mangga",
  "2026-10-09": "Dimsum + semangka",
  "2026-10-12": "Telur rebus + pepaya",
  "2026-10-13": "urab jagung + Nanas madu",
  "2026-10-14": "singkong thailand + strawberry",
  "2026-10-15": "Lemper ayam + jeruk",
  "2026-10-16": "tahu bakso + mangga",
  "2026-10-19": "Getuk + melon",
  "2026-10-20": "sandwich telur + jeruk",
  "2026-10-21": "kue lumpur + pepaya",
  "2026-10-22": "misro + salak",
  "2026-10-23": "somay + buah naga",
  "2026-10-26": "Onde onde kacang hijau + nanas madu",
  "2026-10-27": "kolak pisang + jambu kristal",
  "2026-10-28": "omelet sayur + semangka",
  "2026-10-29": "klepon + strawberry",
  "2026-10-30": "popcorn caramel + pisang",
};

const suffix = Math.random().toString(36).slice(2, 10);
const USER = `uji_okt_${suffix}`;
const PASS = `Rahasia-${suffix}-9x`;

let pass = 0;
let fail = 0;
const check = (label, ok, detail = "") => {
  if (ok) {
    pass++;
    console.log(`  ok   ${label}`);
  } else {
    fail++;
    console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ""}`);
  }
};

async function main() {
  let token = null;
  try {
    const hash = await hashPassword(PASS);
    await d1(
      `INSERT INTO users (username, password_hash, full_name, role, is_active)
       VALUES (?, ?, ?, 'admin', 1)`,
      [USER, hash, "Akun Uji Jadwal Oktober"],
    );
    console.log(`Akun uji dibuat: ${USER}`);

    console.log("\n[1] Login lewat Worker produksi");
    const loginRes = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: USER, password: PASS }),
    });
    const loginJson = await loginRes.json();
    check(
      "login HTTP 200",
      loginRes.status === 200,
      `status=${loginRes.status} ${JSON.stringify(loginJson).slice(0, 200)}`,
    );
    token = loginJson?.data?.token ?? null;
    check("token diterima", Boolean(token));
    const auth = { Authorization: `Bearer ${token}` };

    console.log("\n[2] GET /api/schedules/month?year=2026&month=10&class=1");
    const monthRes = await fetch(
      `${BASE}/api/schedules/month?year=2026&month=10&class=1`,
      { headers: auth },
    );
    check("HTTP 200", monthRes.status === 200, `status=${monthRes.status}`);
    const monthJson = await monthRes.json();
    const weeks = monthJson?.data?.weeks ?? [];
    const days = weeks
      .flatMap((w) => w.days ?? [])
      .filter((d) => d.date >= "2026-10-01" && d.date <= "2026-10-31");
    console.log(`  minggu: ${weeks.length}, hari: ${days.length}`);

    const byDate = new Map(days.map((d) => [d.date, d]));
    for (const [date, menu] of Object.entries(EXPECTED_MENU)) {
      const day = byDate.get(date);
      if (!day) {
        check(`${date} tampil`, false, "tanggal tidak ada di response");
      } else if (menu === null) {
        check(`${date} = libur`, day.isHoliday === true, `isHoliday=${day.isHoliday}`);
      } else {
        check(`${date} = ${menu}`, day.menu?.name === menu, `dapat "${day.menu?.name}"`);
      }
    }
    check(
      "tanggal di luar rencana tidak muncul",
      days.length === Object.keys(EXPECTED_MENU).length,
      `${days.length} hari (harap ${Object.keys(EXPECTED_MENU).length})`,
    );

    console.log("\n[3] GET /api/schedules/status?year=2026&month=10");
    const stRes = await fetch(`${BASE}/api/schedules/status?year=2026&month=10`, {
      headers: auth,
    });
    check("HTTP 200", stRes.status === 200, `status=${stRes.status}`);
    const st = (await stRes.json())?.data;
    console.log(`  totals: ${JSON.stringify(st?.totals)}`);
    check("tidak ada draft tersisa", (st?.totals?.draftCount ?? -1) === 0);
    check(
      "132 baris published",
      (st?.totals?.publishedCount ?? -1) === 132,
      JSON.stringify(st?.totals),
    );
    check(
      "kelas 1-6 semuanya punya jadwal",
      (st?.perClass ?? []).filter((c) => c.publishedCount > 0).length === 6,
    );
  } finally {
    // Pembersihan wajib jalan walau pengujian gagal di tengah.
    try {
      await d1(`DELETE FROM users WHERE username LIKE 'uji_okt_%'`);
      const left = await d1(`SELECT username FROM users WHERE username LIKE 'uji_okt_%'`);
      console.log(`\nAkun uji dihapus. Sisa akun 'uji_okt_*': ${left.length}`);
    } catch (error) {
      console.error("Pembersihan gagal — hapus akun 'uji_okt_*' manual:", error);
      process.exitCode = 1;
    }
  }

  console.log(`\n${"=".repeat(52)}`);
  console.log(`HASIL: ${pass} lulus, ${fail} gagal`);
  if (fail > 0) process.exitCode = 1;
}

await main();
