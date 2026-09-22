/**
 * Verifikasi tampilan: popup "Login berhasil" dan konfirmasi "Ingin keluar?".
 *
 * Jalankan: bun run outputs/check-auth-popup.mjs
 * (dev server harus jalan: `bun run dev`)
 *
 * Penggerak browser diambil dari skill `windows-edge-cdp-ui-verify` — Edge lewat
 * Chrome DevTools Protocol, tanpa dependensi npm. Lihat SKILL.md skill tersebut
 * untuk jebakan yang wajib dipatuhi (profil di luar proyek, tutup di `finally`,
 * proxy localhost, input React).
 */
import fs from "fs";

const cdpPath =
  "C:/Users/asus/.workbuddy-ai/skills/windows-edge-cdp-ui-verify/scripts/cdp.mjs";
const { launchEdge } = await import(cdpPath);

const BASE = "http://localhost:5173";
const SHOTS = "D:\\REACT-DEV\\pizza-snack-play\\outputs\\screenshots";

if (!fs.existsSync(SHOTS)) fs.mkdirSync(SHOTS, { recursive: true });

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

/** Teks dialog yang sedang terbuka, atau `null` bila tidak ada. */
const dialogText = (page) =>
  page.evaluate(`document.querySelector('[role="dialog"]')?.innerText ?? null`);

const dialogOpen = (page) =>
  page.evaluate(`Boolean(document.querySelector('[role="dialog"]'))`);

/** Klik tombol di dalam dialog saja — tombol lain di halaman tidak tersentuh. */
const clickInDialog = (page, label) =>
  page.evaluate(`(function () {
    const dialog = document.querySelector('[role="dialog"]');
    if (!dialog) throw new Error("dialog tidak terbuka");
    const button = [...dialog.querySelectorAll("button")].find((item) =>
      item.textContent.includes(${JSON.stringify(label)}));
    if (!button) throw new Error("tombol dialog tidak ditemukan: " + ${JSON.stringify(label)});
    button.click();
    return true;
  })()`);

/** Isi form masuk, kirim, lalu tunggu popup sambutan muncul. */
async function submitLogin(page, username, password) {
  await page.setValue('input[placeholder="mis. sari"]', username);
  await page.setValue('input[type="password"]', password);
  await page.clickByText("Masuk");
}

// Profil WAJIB di luar folder proyek — lihat SKILL.md.
const page = await launchEdge({
  port: 9333,
  profileDir: `${process.env.TEMP}\\psp-edge-profile`,
});

try {
  // ── 1. Halaman masuk tampil ─────────────────────────────────
  console.log("\n=== 1. Halaman masuk ===");
  await page.goto("/login", { baseUrl: BASE });
  await page.evaluate("localStorage.clear()");
  await page.goto("/login", { baseUrl: BASE });
  check(
    "form masuk tampil",
    await page.evaluate(
      `Boolean(document.querySelector('input[placeholder="mis. sari"]'))`,
    ),
  );

  // ── 2. Login gagal: pesan error, tanpa popup ────────────────
  console.log("\n=== 2. Login gagal ===");
  await submitLogin(page, "sari", "password-salah");
  await page.waitFor(
    "document.body.innerText.includes('Username atau password salah')",
    "pesan error login",
  );
  check("pesan error tampil", true);
  check("tidak ada popup saat gagal", !(await dialogOpen(page)));
  check(
    "tetap di /login",
    (await page.evaluate("location.pathname")) === "/login",
  );
  await page.screenshot(`${SHOTS}/auth-01-login-gagal.png`);

  // ── 3. Login berhasil: popup sambutan ───────────────────────
  console.log("\n=== 3. Login berhasil ===");
  await submitLogin(page, "sari", "snack123");
  await page.waitFor(
    `document.querySelector('[role="dialog"]')?.innerText.includes('Login berhasil')`,
    "popup login berhasil",
  );
  const welcome = await dialogText(page);
  log("3. isi popup", JSON.stringify(welcome));
  check("judul popup dari server", welcome.includes("Login berhasil"));
  check("menyapa nama pengguna", welcome.includes("Selamat datang, Sari Sari") || welcome.includes("Selamat datang,"));
  check(
    "pengalihan ditahan selama popup terbuka",
    (await page.evaluate("location.pathname")) === "/login",
  );
  check(
    "sesi sudah tersimpan",
    (await page.evaluate(`Boolean(localStorage.getItem("psp_token"))`)) === true,
  );
  await page.screenshot(`${SHOTS}/auth-02-popup-berhasil.png`);

  // ── 4. Tombol "Mulai" membawa ke aplikasi ───────────────────
  console.log("\n=== 4. Lanjut ke aplikasi ===");
  await clickInDialog(page, "Mulai");
  await page.waitFor("location.pathname === '/hari-ini'", "masuk ke /hari-ini");
  check("sampai di /hari-ini", true);
  // Rute berganti lebih dulu, pohon React menyusul — tunggu dialog benar-benar
  // lepas dari DOM sebelum menyimpulkan.
  await page.waitFor(
    `!document.querySelector('[role="dialog"]')`,
    "popup sambutan lepas dari DOM",
  );
  check("popup tertutup", !(await dialogOpen(page)));
  await page.screenshot(`${SHOTS}/auth-03-hari-ini.png`);

  // ── 5. Tombol keluar membuka konfirmasi ─────────────────────
  console.log("\n=== 5. Konfirmasi keluar ===");
  await page.evaluate(`document.querySelector('button[title="Keluar"]').click()`);
  await page.waitFor(
    `document.querySelector('[role="dialog"]')?.innerText.includes('Ingin keluar?')`,
    "popup konfirmasi keluar",
  );
  const confirm = await dialogText(page);
  log("5. isi popup", JSON.stringify(confirm));
  check("bertanya lebih dulu", confirm.includes("Ingin keluar?"));
  check("ada tombol Batal", confirm.includes("Batal"));
  check(
    "sesi belum diputus",
    await page.evaluate(`Boolean(localStorage.getItem("psp_token"))`),
  );
  await page.screenshot(`${SHOTS}/auth-04-konfirmasi-keluar.png`);

  // ── 6. Esc menutup dialog tanpa memutus sesi ────────────────
  console.log("\n=== 6. Esc membatalkan ===");
  await page.send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "Escape",
    code: "Escape",
    windowsVirtualKeyCode: 27,
  });
  await page.send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: "Escape",
    code: "Escape",
    windowsVirtualKeyCode: 27,
  });
  await page.waitFor("!document.querySelector('[role=\"dialog\"]')", "dialog tertutup");
  check("dialog tertutup oleh Esc", true);
  check("masih di dalam aplikasi", (await page.evaluate("location.pathname")) === "/hari-ini");
  check("sesi masih hidup", await page.evaluate(`Boolean(localStorage.getItem("psp_token"))`));

  // ── 7. "Batal" juga tidak memutus sesi ──────────────────────
  console.log("\n=== 7. Batal ===");
  await page.evaluate(`document.querySelector('button[title="Keluar"]').click()`);
  await page.waitFor(`Boolean(document.querySelector('[role="dialog"]'))`, "dialog terbuka");
  await clickInDialog(page, "Batal");
  await page.waitFor("!document.querySelector('[role=\"dialog\"]')", "dialog tertutup");
  check("dialog tertutup oleh Batal", true);
  check("masih di dalam aplikasi", (await page.evaluate("location.pathname")) === "/hari-ini");
  check("sesi masih hidup", await page.evaluate(`Boolean(localStorage.getItem("psp_token"))`));

  // ── 8. "Keluar" benar-benar memutus sesi ────────────────────
  console.log("\n=== 8. Keluar ===");
  await page.evaluate(`document.querySelector('button[title="Keluar"]').click()`);
  await page.waitFor(`Boolean(document.querySelector('[role="dialog"]'))`, "dialog terbuka");
  await clickInDialog(page, "Keluar");
  await page.waitFor("location.pathname === '/login'", "kembali ke /login");
  check("kembali ke halaman masuk", true);
  check(
    "token dibuang",
    (await page.evaluate(`localStorage.getItem("psp_token")`)) === null,
  );
  await page.screenshot(`${SHOTS}/auth-05-setelah-keluar.png`);

  // ── 9. Halaman terproteksi tidak bisa dibuka lagi ───────────
  console.log("\n=== 9. Setelah keluar ===");
  await page.goto("/profil", { baseUrl: BASE });
  await page.waitFor("location.pathname === '/login'", "dipaksa kembali ke /login");
  check("halaman terproteksi mengembalikan ke /login", true);

  console.log(
    `\nerror halaman: ${page.errors.length === 0 ? "tidak ada" : JSON.stringify(page.errors)}`,
  );
  console.log(
    `dialog native (confirm/alert): ${
      page.dialogs.length === 0 ? "tidak ada" : JSON.stringify(page.dialogs)
    }`,
  );
  console.log(`\n=== HASIL: ${pass} pass, ${fail} fail ===`);
  console.log("Tangkapan layar ada di outputs/screenshots/");
} finally {
  await page.close();
  console.log("Edge ditutup.");
}

process.exit(fail > 0 ? 1 : 0);
