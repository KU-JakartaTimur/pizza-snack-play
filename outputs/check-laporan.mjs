/**
 * Verifikasi tampilan: halaman Laporan Jadwal.
 *
 * Jalankan: bun run outputs/check-laporan.mjs
 * (dev server harus jalan: `bun run dev`)
 *
 * Yang diuji — bukan hiasan, tapi wewenang & perilaku filter:
 * - Admin melihat menu "Laporan", memilih rentang + kelas, dan laporan
 *   ter-render lengkap dengan angka ringkasan.
 * - Filter kelas benar-benar mempersempit hasil (jumlah baris berubah).
 * - Korlas melihat menu "Laporan" tetapi pemilih kelasnya terkunci ke
 *   kelasnya sendiri (tidak bisa memilih kelas lain).
 * - Orang tua **tidak** melihat menu "Laporan", dan membuka /laporan
 *   langsung ditolak ("Akses ditolak"), bukan menampilkan data.
 * - Konsol bersih (tidak ada error React).
 *
 * Penggerak browser mengikuti skill `windows-edge-cdp-ui-verify` — lihat
 * SKILL.md-nya untuk jebakan yang wajib dipatuhi (profil di luar proyek, tutup
 * di `finally`, proxy localhost, input React).
 */
import fs from "fs";
import { execFileSync } from "node:child_process";

const cdpPath =
  "C:/Users/asus/.workbuddy-ai/skills/windows-edge-cdp-ui-verify/scripts/cdp.mjs";
const { launchEdge } = await import(cdpPath);

const BASE = "http://localhost:5173";
const SHOTS = "D:\\REACT-DEV\\pizza-snack-play\\outputs\\screenshots";
const PROJECT = "D:\\REACT-DEV\\pizza-snack-play";

if (!fs.existsSync(SHOTS)) fs.mkdirSync(SHOTS, { recursive: true });

/**
 * Data uji sekali pakai: satu klaim untuk `sari` di kelas 1.
 *
 * Laporan hanya bermakna bila ada klaim, sedangkan seed tidak memuat satu pun
 * (dan tanggal yang bisa diklaim sudah lewat). Karena itu barisnya ditulis
 * langsung ke D1 lokal dan **selalu** dihapus di blok `finally` — pola yang
 * sama dengan `check-login-prod.mjs`.
 */
const TEST_NOTE = "__uji_laporan__";
const d1 = (command) =>
  execFileSync(
    "bunx",
    ["wrangler", "d1", "execute", "pizza-snack-play", "--local", "--command", command],
    { cwd: PROJECT, stdio: "pipe" },
  );

function seedTestClaim() {
  d1(`DELETE FROM schedule_claims WHERE note='${TEST_NOTE}'`);
  // Jadwal published kelas 1 yang paling awal pada September 2026.
  d1(
    `INSERT INTO schedule_claims (schedule_id, parent_id, note) ` +
      `SELECT id, 40, '${TEST_NOTE}' FROM schedules ` +
      `WHERE class_name='1' AND status='published' AND is_holiday=0 ` +
      `AND schedule_date BETWEEN '2026-09-01' AND '2026-09-30' ORDER BY schedule_date LIMIT 1`,
  );
}

function removeTestClaim() {
  d1(`DELETE FROM schedule_claims WHERE note='${TEST_NOTE}'`);
}

let pass = 0;
let fail = 0;

function check(name, condition, detail = "") {
  if (condition) {
    pass++;
    console.log(`  PASS  ${name}`);
  } else {
    fail++;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

const log = (label, value) => console.log(`${label}: ${value}`);

const page = await launchEdge({
  port: 9334,
  profileDir: `${process.env.TEMP}\\psp-edge-profile`,
});

/** Masuk lewat UI, lalu tutup popup "Login berhasil" dengan tombol "Mulai". */
async function loginAs(username, password = "snack123") {
  await page.goto("/login", { baseUrl: BASE });
  await page.setValue('input[placeholder="mis. sari"]', username);
  await page.setValue('input[type="password"]', password);
  await page.clickByText("Masuk");
  await page.waitFor(
    `document.querySelector('[role="dialog"]')?.innerText.includes('Login berhasil')`,
    "popup login berhasil",
  );
  await page.evaluate(`(function () {
    const dialog = document.querySelector('[role="dialog"]');
    [...dialog.querySelectorAll("button")]
      .find((button) => button.textContent.includes("Mulai"))
      .click();
  })()`);
  await page.waitFor("location.pathname !== '/login'", "masuk ke aplikasi");
}

/** Muat origin dulu (localStorage tidak bisa disentuh di about:blank). */
async function freshLoginPage() {
  await page.goto("/login", { baseUrl: BASE });
  await page.evaluate("localStorage.clear(); true");
  await page.goto("/login", { baseUrl: BASE });
  await page.waitFor(
    `document.querySelector('input[placeholder="mis. sari"]') !== null`,
    "form masuk tampil",
  );
}

async function openRoute(path, needle) {
  await page.goto(path, { baseUrl: BASE });
  await page.waitFor(
    `document.body.innerText.includes(${JSON.stringify(needle)})`,
    `halaman ${path}`,
  );
}

const bodyText = () => page.evaluate("document.body.innerText");

/** Tombol "Tampilkan" formulir filter (menghindari tombol lain). */
const submitFilter = () =>
  page.evaluate(`(function () {
    const button = [...document.querySelectorAll("button")]
      .find((el) => el.textContent.trim() === "Tampilkan");
    if (button) button.click();
    return Boolean(button);
  })()`);

/** Baris orang tua di rekap — tombol yang bisa dibuka-tutup (`aria-expanded`). */
const rekapRows = () => page.evaluate(`document.querySelectorAll('button[aria-expanded]').length`);

/**
 * Angka "Total ambil" pada kartu statistik pertama.
 *
 * Kartunya berbentuk `<angka>\n\n<label>\n\n<hint>`, jadi angkanya adalah
 * baris **pertama** — bukan baris sebelum label (baris itu kosong).
 */
const totalAmbil = () =>
  page.evaluate(`(function () {
    const card = [...document.querySelectorAll(".card")]
      .find((el) => el.innerText.includes("Total ambil"));
    if (!card) return null;
    const lines = card.innerText.split("\\n").filter((t) => t.trim() !== "");
    return Number(lines[0]);
  })()`);

/** Pilihan yang tersedia di pemilih kelas pada formulir filter (admin). */
const classOptions = () =>
  page.evaluate(`(function () {
    const form = document.querySelector("form");
    const select = form && form.querySelector("select");
    if (!select) return null;
    return {
      value: select.value,
      options: [...select.options].map((o) => o.value),
    };
  })()`);

/** Isi kolom kelas yang terkunci untuk korlas (input read-only). */
const lockedClassField = () =>
  page.evaluate(`(function () {
    const form = document.querySelector("form");
    const inputs = form ? [...form.querySelectorAll("input")] : [];
    return inputs.map((i) => i.value);
  })()`);

const navHasLaporan = () =>
  page.evaluate(
    `[...document.querySelectorAll("a")].some((a) => a.getAttribute("href") === "/laporan")`,
  );

try {
  seedTestClaim();
  console.log(`\n(data uji: 1 klaim kelas 1 untuk sari — note=${TEST_NOTE})`);

  // ── 1. Admin ────────────────────────────────────────────────
  console.log("\n=== 1. Admin — menu & laporan lengkap ===");
  await freshLoginPage();
  await loginAs("admin");
  await openRoute("/laporan", "Laporan Jadwal");

  check("admin melihat menu Laporan", await navHasLaporan());

  const selector = await classOptions();
  log("1. pemilih kelas admin", JSON.stringify(selector));
  check("pemilih kelas admin aktif", Boolean(selector));
  check(
    "pemilih kelas admin punya opsi Semua kelas",
    selector && selector.options.includes(""),
    JSON.stringify(selector?.options),
  );

  check("tombol Tampilkan ada", await submitFilter());
  // Tunggu rekap benar-benar tergambar (bukan hanya kartu ringkasan muncul).
  await page.waitFor(
    `document.body.innerText.includes("Rekap per orang tua") &&
     document.querySelectorAll('button[aria-expanded]').length > 0`,
    "rekap per orang tua",
  );

  const text = await bodyText();
  // Data uji menjamin minimal satu klaim → "Total ambil" harus > 0.
  // Catatan: `waitFor` membungkus ekspresi dengan `Boolean(...)`, jadi yang
  // ditunggu harus **ekspresi bernilai** — bukan IIFE (fungsi selalu truthy,
  // dan penantiannya akan lolos seketika).
  await page.waitFor(
    `Number(([...document.querySelectorAll(".card")]
      .find((el) => el.innerText.includes("Total ambil")) || { innerText: "0" })
      .innerText.split("\\n")[0]) > 0`,
    "total ambil > 0",
  );
  log("1. total ambil (semua kelas)", await totalAmbil());
  check("kartu ringkasan tampil", text.includes("Orang tua aktif"));
  check("daftar belum ambil tampil", text.includes("Belum pernah mengambil"));
  await page.screenshot(`${SHOTS}/laporan-01-admin.png`);

  const semuaKelasTotal = await totalAmbil();
  const semuaKelasRows = await rekapRows();
  log("1. baris rekap (semua kelas)", semuaKelasRows);
  check(
    "rekap menampilkan satu baris orang tua",
    semuaKelasRows === 1,
    `${semuaKelasRows} baris`,
  );

  // Filter ke kelas 2 — kelas tanpa klaim uji, jadi hasilnya harus 0 dan
  // buktinya kelas benar-benar menyaring (bukan sekadar ikut angka global).
  console.log("\n=== 2. Admin — filter kelas mempersempit hasil ===");
  const beforeCalls = await page.evaluate(
    `performance.getEntriesByType("resource").filter((e) => e.name.includes("/api/laporan")).length`,
  );
  await page.evaluate(`(function () {
    const select = document.querySelector("form select");
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLSelectElement.prototype, "value"
    ).set;
    setter.call(select, "2");
    select.dispatchEvent(new Event("change", { bubbles: true }));
    return select.value;
  })()`);
  await submitFilter();
  // Tunggu permintaan laporan yang baru (bukan sekadar render lama).
  await page.waitFor(
    `performance.getEntriesByType("resource").filter((e) => e.name.includes("/api/laporan")).length > ${beforeCalls}`,
    "permintaan laporan kelas 2",
  );
  await page.waitFor(
    `document.body.innerText.includes("Rekap per orang tua")`,
    "render ulang kelas 2",
  );
  // Kelas 2 tidak punya klaim uji → "Total ambil" harus kembali 0.
  await page.waitFor(
    `Number(([...document.querySelectorAll(".card")]
      .find((el) => el.innerText.includes("Total ambil")) || { innerText: "9" })
      .innerText.split("\\n")[0]) === 0`,
    "total kelas 2 kembali 0",
  );
  const kelas2Total = await totalAmbil();
  log("2. total ambil (kelas 2)", kelas2Total);
  log("2. total ambil (semua kelas)", semuaKelasTotal);
  check(
    "filter kelas menyaring laporan",
    kelas2Total === 0 && semuaKelasTotal > 0,
    `semua=${semuaKelasTotal} kelas2=${kelas2Total}`,
  );
  await page.screenshot(`${SHOTS}/laporan-02-admin-kelas2.png`);

  // ── 3. Korlas ───────────────────────────────────────────────
  console.log("\n=== 3. Korlas — menu tampil, kelas terkunci ===");
  await freshLoginPage();
  await loginAs("budi");
  await openRoute("/laporan", "Laporan Jadwal");

  check("korlas melihat menu Laporan", await navHasLaporan());
  const locked = await lockedClassField();
  log("3. kolom kelas korlas", JSON.stringify(locked));
  check(
    "kolom kelas korlas terkunci ke kelasnya sendiri",
    locked.includes("Kelas 1"),
    JSON.stringify(locked),
  );
  await page.screenshot(`${SHOTS}/laporan-03-korlas.png`);

  // ── 4. Orang tua ────────────────────────────────────────────
  console.log("\n=== 4. Orang tua — tidak berhak ===");
  await freshLoginPage();
  await loginAs("sari");
  check("orang tua TIDAK melihat menu Laporan", !(await navHasLaporan()));

  await openRoute("/laporan", "Laporan Jadwal");
  await page.waitFor(
    `!document.body.innerText.includes("Rekap per orang tua")`,
    "tidak ada data laporan",
  );
  const parentText = await bodyText();
  check(
    "orang tua ditolak (bukan melihat data)",
    parentText.includes("Akses ditolak"),
    parentText.slice(0, 160),
  );
  check(
    "orang tua tidak melihat angka Total ambil",
    !parentText.includes("Total ambil"),
  );
  await page.screenshot(`${SHOTS}/laporan-04-orangtua.png`);

  // ── 5. Konsol bersih ────────────────────────────────────────
  console.log("\n=== 5. Konsol ===");
  const errors = await page.evaluate(
    "window.__pspConsoleErrors ? window.__pspConsoleErrors : []",
  );
  log("5. error konsol", JSON.stringify(errors));
  check("tidak ada error konsol", !Array.isArray(errors) || errors.length === 0);
} finally {
  try {
    removeTestClaim();
  } catch (error) {
    console.log(`(peringatan) gagal membersihkan data uji: ${error}`);
  }
  await page.close();
  console.log(`\n${pass} PASS · ${fail} FAIL`);
  if (fail > 0) process.exitCode = 1;
}
