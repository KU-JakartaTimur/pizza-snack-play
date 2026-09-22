/**
 * Verifikasi halaman masuk **produksi** lewat browser sungguhan (Edge + CDP).
 *
 *   bun run outputs/check-login-prod.mjs
 *
 * Latar belakang: pernah ada bug di mana halaman masuk **selalu** menjawab
 * "Akun terkunci karena 5 kali gagal masuk" pada percobaan pertama, padahal
 * password yang dipakai adalah password bawaan. Penyebabnya skema D1
 * produksi tertinggal satu migrasi: kolom `locked_at` belum ada, dan SQLite
 * mengembalikan **nama kolom sebagai teks** (perilaku double-quoted string),
 * sehingga setiap baris tampak terkunci.
 *
 * Skrip ini menjaga agar kelas bug itu tidak kembali. Yang diuji:
 *
 *   A. password salah pada akun baru  → "Sisa N kesempatan", **bukan**
 *      "Akun terkunci"  ← persis keluhan yang dilaporkan
 *   B. password benar setelah satu kegagalan → tetap bisa masuk
 *   C. akun `sari` (parent) dengan password bawaan → masuk
 *   D. akun uji ber-role `admin` → masuk (jalur login admin)
 *
 * ⚠️ Skrip ini menyentuh **produksi**: ia membuat dua akun uji sekali pakai
 * (`uji_login_*`) lewat D1 REST API lalu menghapusnya kembali, dan bila
 * penghitung kegagalan akun bawaan ikut bergeser, penghitung itu
 * dikembalikan ke nol. Pembersihan ada di blok `finally`, jadi tetap jalan
 * walau pengujian gagal di tengah.
 *
 * Berbeda dengan `check-login-lock.mjs` (yang menguji aturan kunci di
 * server lokal), skrip ini memeriksa Worker produksi yang sesungguhnya.
 *
 * Password akun uji dibuat di dalam skrip dan tidak pernah lewat baris
 * perintah. Kredensial Cloudflare dibaca dari `.env` proyek.
 */
import fs from "fs";
import path from "path";
import { launchEdge } from "C:/Users/asus/.workbuddy-ai/skills/windows-edge-cdp-ui-verify/scripts/cdp.mjs";
import { hashPassword } from "../src/api/utils/password.ts";

const BASE =
  process.env.PSP_BASE ?? "https://pizza-snack-play.topidesta.workers.dev";
const PROJECT = path.resolve(import.meta.dir, "..");
const SHOTS = path.join(PROJECT, "outputs", "screenshots");
const PORT = 9341;
const PROFILE = `${process.env.TEMP}\\psp-edge-profile-prod`;

/** `DEFAULT_PASSWORD` di `scripts/seed.ts`. */
const DEFAULT_PASSWORD = "snack123";

// ── kredensial Cloudflare dari .env proyek ───────────────────────
function readEnv() {
  const out = {};
  for (const line of fs
    .readFileSync(path.join(PROJECT, ".env"), "utf8")
    .split(/\r?\n/)) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (match) out[match[1]] = match[2];
  }
  return out;
}

const env = readEnv();
const D1_URL =
  `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}` +
  `/d1/database/${env.CLOUDFLARE_DATABASE_ID}/query`;

/** Satu perintah SQL ke D1 produksi. */
async function d1(sql, params = []) {
  const response = await fetch(D1_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.CLOUDFLARE_D1_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql, params }),
  });
  const payload = await response.json();
  if (!payload.success) {
    throw new Error(`D1 gagal: ${JSON.stringify(payload.errors)}`);
  }
  return payload.result[0]?.results ?? [];
}

// ── akun uji sekali pakai ────────────────────────────────────────
const suffix = Math.random().toString(36).slice(2, 10);
const TEST_USER = `uji_login_${suffix}`;
const ADMIN_USER = `uji_login_admin_${suffix}`;
const TEST_PASS = `Rahasia-${suffix}-9x`;
const WRONG_PASS = `Salah-${suffix}-zz`;

// ── pencatatan hasil ─────────────────────────────────────────────
let pass = 0;
let fail = 0;
const failures = [];

function check(label, condition, detail = "") {
  if (condition) {
    pass++;
    console.log(`  ok   ${label}`);
  } else {
    fail++;
    failures.push(label);
    console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

const bodyText = (page) => page.evaluate("document.body.innerText");
const hasDialog = (page) =>
  page.evaluate('document.querySelector(\'[role="dialog"]\') !== null');

/** Isi form masuk lalu kirim. */
async function submitLogin(page, username, password) {
  await page.setValue('input[placeholder="mis. sari"]', username);
  await page.setValue('input[type="password"]', password);
  await page.clickByText("Masuk");
  await Bun.sleep(2500); // PBKDF2 100k iterasi + perjalanan ke Worker
}

/**
 * Bersihkan sesi lalu muat ulang halaman masuk.
 *
 * `localStorage` hanya bisa disentuh setelah dokumen berasal dari origin yang
 * benar — pada `about:blank` Edge melempar SecurityError — jadi halaman
 * dimuat dulu, baru penyimpanan dibersihkan, lalu dimuat ulang.
 */
async function freshLoginPage(page) {
  await page.goto("/login", { baseUrl: BASE });
  await page.evaluate("localStorage.clear(); true");
  await page.goto("/login", { baseUrl: BASE });
  await page.waitFor(
    'document.querySelector(\'input[placeholder="mis. sari"]\') !== null',
    "form masuk tampil",
  );
}

/** Keadaan kolom pelacak kegagalan untuk akun bawaan yang ikut disinggung. */
const readCounters = () =>
  d1(
    `SELECT username, failed_login_attempts, locked_at
       FROM users WHERE username IN ('sari','admin') ORDER BY username`,
  );

async function main() {
  fs.mkdirSync(SHOTS, { recursive: true });

  let page = null;
  try {
    // ── 0. keadaan awal akun bawaan ───────────────────────────
    console.log("Keadaan awal:", JSON.stringify(await readCounters()));

    // ── 1. akun uji ───────────────────────────────────────────
    const hash = await hashPassword(TEST_PASS);
    await d1(
      `INSERT INTO users (username, password_hash, full_name, role, is_active)
       VALUES (?, ?, ?, 'parent', 1)`,
      [TEST_USER, hash, "Akun Uji Verifikasi"],
    );
    await d1(
      `INSERT INTO users (username, password_hash, full_name, role, is_active)
       VALUES (?, ?, ?, 'admin', 1)`,
      [ADMIN_USER, hash, "Akun Uji Admin"],
    );
    console.log(`Akun uji dibuat: ${TEST_USER}, ${ADMIN_USER}`);

    page = await launchEdge({ port: PORT, profileDir: PROFILE });

    // ── 2. halaman masuk tampil ───────────────────────────────
    console.log("\n[1] Halaman masuk produksi tampil");
    await freshLoginPage(page);
    check(
      "judul 'Pizza Snack Play' tampil",
      (await bodyText(page)).includes("Pizza Snack Play"),
    );

    // ── 3. A: password salah → sisa kesempatan, bukan terkunci ─
    console.log("\n[2] A. Password salah pada akun baru (keluhan yang dilaporkan)");
    await submitLogin(page, TEST_USER, WRONG_PASS);
    const afterWrong = await bodyText(page);
    await page.screenshot(path.join(SHOTS, "prod-login-01-password-salah.png"));
    check(
      "muncul 'Username atau password salah'",
      afterWrong.includes("Username atau password salah"),
      afterWrong.slice(0, 160),
    );
    check(
      "menyebut sisa kesempatan (4 tersisa)",
      /Sisa 4 kesempatan/.test(afterWrong),
      afterWrong.slice(0, 200),
    );
    check(
      "TIDAK muncul 'Akun terkunci'",
      !afterWrong.includes("Akun terkunci"),
      afterWrong.slice(0, 200),
    );
    check(
      "masih di halaman /login",
      (await page.evaluate("location.pathname")) === "/login",
    );

    // ── 4. B: password benar setelah gagal → masuk ────────────
    console.log("\n[3] B. Password benar setelah satu kegagalan");
    await submitLogin(page, TEST_USER, TEST_PASS);
    const afterRight = await bodyText(page);
    await page.screenshot(path.join(SHOTS, "prod-login-02-password-benar.png"));
    check("dialog sambutan terbuka", await hasDialog(page), afterRight.slice(0, 160));
    check(
      "TIDAK muncul 'Akun terkunci'",
      !afterRight.includes("Akun terkunci"),
      afterRight.slice(0, 200),
    );
    check(
      "token tersimpan",
      await page.evaluate('localStorage.getItem("psp_token") !== null'),
    );
    await page.clickByText("Mulai");
    await page.waitFor("location.pathname !== '/login'", "masuk ke aplikasi");
    check(
      "dialihkan keluar dari /login",
      (await page.evaluate("location.pathname")) !== "/login",
    );

    // ── 5. C: parent bawaan ───────────────────────────────────
    console.log("\n[4.1] sari (parent) dengan password bawaan");
    await freshLoginPage(page);
    await submitLogin(page, "sari", DEFAULT_PASSWORD);
    const sariText = await bodyText(page);
    await page.screenshot(path.join(SHOTS, "prod-login-03-sari.png"));
    check(
      "sari: TIDAK muncul 'Akun terkunci'",
      !sariText.includes("Akun terkunci"),
      sariText.slice(0, 200),
    );
    check("sari: dialog sambutan terbuka", await hasDialog(page), sariText.slice(0, 160));

    // ── 6. D: jalur login role admin ──────────────────────────
    // Password admin produksi sudah diganti pengguna, jadi jalur ini
    // dibuktikan lewat akun uji ber-role admin.
    console.log("\n[4.2] akun uji ber-role admin");
    await freshLoginPage(page);
    await submitLogin(page, ADMIN_USER, TEST_PASS);
    const adminText = await bodyText(page);
    await page.screenshot(path.join(SHOTS, "prod-login-04-admin.png"));
    check(
      "admin: TIDAK muncul 'Akun terkunci'",
      !adminText.includes("Akun terkunci"),
      adminText.slice(0, 200),
    );
    check("admin: dialog sambutan terbuka", await hasDialog(page), adminText.slice(0, 160));

    // ── 7. akun admin nyata: cukup bebas lockout palsu ────────
    console.log("\n[4.3] akun 'admin' nyata");
    await freshLoginPage(page);
    await submitLogin(page, "admin", DEFAULT_PASSWORD);
    const realAdmin = await bodyText(page);
    await page.screenshot(path.join(SHOTS, "prod-login-05-admin-nyata.png"));
    check(
      "admin nyata: TIDAK muncul 'Akun terkunci'",
      !realAdmin.includes("Akun terkunci"),
      realAdmin.slice(0, 200),
    );
    console.log(
      realAdmin.includes("Username atau password salah")
        ? "  catatan: password bawaan tidak berlaku untuk akun admin ini (401, bukan 423)"
        : "  catatan: akun admin masuk dengan password bawaan",
    );

    // ── 8. kebersihan sesi browser ────────────────────────────
    console.log("\n[5] Kebersihan sesi browser");
    check("tidak ada error konsol", page.errors.length === 0, page.errors.join(" / "));
    check(
      "tidak ada alert/confirm bawaan",
      page.dialogs.length === 0,
      page.dialogs.join(" / "),
    );
  } finally {
    // Pembersihan wajib jalan walau pengujian gagal di tengah — akun uji
    // tidak boleh tertinggal di produksi.
    if (page) await page.close();

    try {
      await d1(`DELETE FROM users WHERE username LIKE 'uji_login_%'`);
      const leftovers = await d1(
        `SELECT username FROM users WHERE username LIKE 'uji_login_%'`,
      );
      console.log(`\nAkun uji dihapus. Sisa akun 'uji_login_*': ${leftovers.length}`);

      // Akun bawaan seharusnya tidak terpengaruh. Bila penghitungnya
      // bergeser (mis. karena password bawaan sudah tidak berlaku),
      // kembalikan ke nol — keadaan yang sama dengan tombol "Buka kunci".
      const after = await readCounters();
      console.log("Keadaan akhir:", JSON.stringify(after));
      const disturbed = after.filter(
        (row) => row.failed_login_attempts > 0 || row.locked_at,
      );
      if (disturbed.length > 0) {
        await d1(
          `UPDATE users SET failed_login_attempts = 0, last_failed_login_at = NULL,
             locked_at = NULL WHERE username IN ('sari','admin')`,
        );
        console.log(
          `Penghitung dibersihkan untuk: ${disturbed.map((r) => r.username).join(", ")}`,
        );
      } else {
        console.log("Penghitung akun bawaan tidak tersentuh.");
      }
    } catch (error) {
      console.error("Pembersihan gagal — periksa akun 'uji_login_*' secara manual:", error);
      process.exitCode = 1;
    }
  }

  // ── 9. ringkasan ────────────────────────────────────────────
  console.log(`\n${"=".repeat(52)}`);
  console.log(`HASIL: ${pass} lulus, ${fail} gagal`);
  if (fail > 0) {
    console.log("Gagal pada:");
    for (const item of failures) console.log(`  - ${item}`);
    process.exitCode = 1;
  } else {
    console.log("Halaman masuk produksi bersih — tidak ada 'Akun terkunci' palsu.");
  }
}

await main();
