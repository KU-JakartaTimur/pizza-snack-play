/**
 * Verifikasi tampilan: "Login as" — admin masuk sebagai korlas/orang tua.
 *
 * Jalankan: bun run outputs/check-login-as.mjs
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

/**
 * Teks header aplikasi — di situ label role pemakai ditampilkan.
 * Header bisa saja belum ada: selama sesi diverifikasi, layout hanya
 * menampilkan spinner satu layar penuh.
 */
const headerText = (page) =>
  page.evaluate(`document.querySelector("header")?.innerText ?? ""`);

const dialogText = (page) =>
  page.evaluate(`document.querySelector('[role="dialog"]')?.innerText ?? null`);

const dialogOpen = (page) =>
  page.evaluate(`Boolean(document.querySelector('[role="dialog"]'))`);

const loginAsButton = (page) =>
  page.evaluate(`Boolean(document.querySelector('button[title^="Login as"]'))`);

const storedToken = (page) =>
  page.evaluate(`localStorage.getItem("psp_token")`);

const storedImpersonator = (page) =>
  page.evaluate(
    `JSON.parse(localStorage.getItem("psp_impersonator") ?? "null")`,
  );

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

/** Panggil API memakai token yang sedang tersimpan di peramban. */
const apiStatus = (page, path) =>
  page.evaluate(`fetch(${JSON.stringify(path)}, {
    headers: { Authorization: "Bearer " + localStorage.getItem("psp_token") },
  }).then((response) => response.status)`);

const apiData = (page, path) =>
  page.evaluate(`fetch(${JSON.stringify(path)}, {
    headers: { Authorization: "Bearer " + localStorage.getItem("psp_token") },
  }).then((response) => response.json()).then((body) => body.data)`);

/** Isi form masuk, kirim, lalu lewati popup sambutan. */
async function loginAs(page, username, password) {
  await page.setValue('input[placeholder="mis. sari"]', username);
  await page.setValue('input[type="password"]', password);
  await page.clickByText("Masuk");
  await page.waitFor(
    `document.querySelector('[role="dialog"]')?.innerText.includes("Login berhasil")`,
    "popup login berhasil",
  );
  await clickInDialog(page, "Mulai");
  await page.waitFor("location.pathname === '/hari-ini'", "masuk ke /hari-ini");
  await page.waitFor(
    `!document.querySelector('[role="dialog"]')`,
    "popup sambutan lepas dari DOM",
  );
}

/** Buka dialog "Login as", cari akun, lalu pilih baris pertama yang cocok. */
async function pickAccount(page, query) {
  await page.evaluate(`document.querySelector('button[title^="Login as"]').click()`);
  await page.waitFor(
    `document.querySelector('[role="dialog"]')?.innerText.includes("Login as")`,
    "dialog Login as",
  );
  await page.setValue('input[placeholder^="Cari"]', query);
  await page.waitFor(
    `[...document.querySelectorAll('[role="dialog"] li button')]
       .some((item) => item.textContent.includes(${JSON.stringify(query)}))`,
    `baris akun "${query}"`,
  );
  await page.evaluate(`(function () {
    const rows = [...document.querySelectorAll('[role="dialog"] li button')];
    const row = rows.find((item) => item.textContent.includes(${JSON.stringify(query)}));
    if (!row) throw new Error("baris akun tidak ditemukan: " + ${JSON.stringify(query)});
    row.click();
    return true;
  })()`);
  await page.waitFor(
    `!document.querySelector('[role="dialog"]')`,
    "dialog Login as tertutup",
  );
}

// Profil WAJIB di luar folder proyek — lihat SKILL.md.
const page = await launchEdge({
  port: 9333,
  profileDir: `${process.env.TEMP}\\psp-edge-profile`,
});

try {
  // ── 1. Masuk sebagai admin ──────────────────────────────────
  console.log("\n=== 1. Masuk sebagai admin ===");
  await page.goto("/login", { baseUrl: BASE });
  await page.evaluate("localStorage.clear()");
  await page.goto("/login", { baseUrl: BASE });
  await loginAs(page, "admin", "snack123");

  const adminToken = await storedToken(page);
  check("sesi admin aktif", typeof adminToken === "string" && adminToken.length > 0);
  check(
    "header menampilkan role admin",
    (await headerText(page)).includes("Admin"),
    await headerText(page),
  );
  check("tombol Login as tampil untuk admin", await loginAsButton(page));
  await page.screenshot(`${SHOTS}/login-as-01-admin.png`);

  // ── 2. Dialog Login as & daftar akun ────────────────────────
  console.log("\n=== 2. Dialog Login as ===");
  await page.evaluate(`document.querySelector('button[title^="Login as"]').click()`);
  await page.waitFor(
    `document.querySelector('[role="dialog"]')?.innerText.includes("Login as")`,
    "dialog Login as",
  );
  const dialog = await dialogText(page);
  log("2. isi dialog", JSON.stringify(dialog.slice(0, 160)));
  check("menjelaskan maksudnya", dialog.includes("tanpa password"));
  check("menyebut sesi admin tersimpan", dialog.includes("tersimpan"));
  check(
    "ada kolom pencarian",
    await page.evaluate(`Boolean(document.querySelector('input[placeholder^="Cari"]'))`),
  );
  // Daftar diambil lewat API — tunggu sampai benar-benar terisi (atau gagal).
  await page.waitFor(
    `document.querySelectorAll('[role="dialog"] li button').length > 0
       || (document.querySelector('[role="dialog"]')?.innerText ?? "").includes("Belum ada akun")
       || (document.querySelector('[role="dialog"]')?.innerText ?? "").includes("gagal dimuat")`,
    "daftar akun termuat",
  );
  const rows = await page.texts('[role="dialog"] li button');
  log("2. jumlah akun", rows.length);
  check("daftar akun terisi", rows.length > 0);
  check(
    "akun nonaktif tidak ditawarkan",
    rows.every((row) => !row.toLowerCase().includes("nonaktif")),
  );
  await page.screenshot(`${SHOTS}/login-as-02-dialog.png`);

  // ── 3. Pencarian menyaring daftar ───────────────────────────
  console.log("\n=== 3. Pencarian akun ===");
  await page.setValue('input[placeholder^="Cari"]', "sari");
  // `every` pada daftar kosong bernilai benar — panjangnya ikut diperiksa
  // supaya daftar yang belum termuat tidak lolos sebagai "tersaring".
  await page.waitFor(
    `(function () {
      const rows = [...document.querySelectorAll('[role="dialog"] li button')];
      return rows.length > 0
        && rows.every((item) => item.textContent.includes("sari"));
    })()`,
    "daftar tersaring",
  );
  const filtered = await page.texts('[role="dialog"] li button');
  log("3. hasil pencarian", JSON.stringify(filtered));
  check("hasil pencarian tersaring", filtered.length > 0);
  check(
    "semua baris cocok dengan kata kunci",
    filtered.every((row) => row.includes("sari")),
    JSON.stringify(filtered),
  );

  // ── 4. Masuk sebagai orang tua ──────────────────────────────
  console.log("\n=== 4. Masuk sebagai orang tua ===");
  await page.evaluate(`(function () {
    const row = [...document.querySelectorAll('[role="dialog"] li button')]
      .find((item) => item.textContent.includes("sari"));
    row.click();
    return true;
  })()`);
  await page.waitFor(
    `!document.querySelector('[role="dialog"]')`,
    "dialog Login as tertutup",
  );
  await page.waitFor(
    `localStorage.getItem("psp_impersonator") !== null`,
    "jejak sesi admin tersimpan",
  );
  await page.waitFor(
    `document.body.innerText.includes("Kembali ke admin")`,
    "bilah kembali ke admin",
  );

  const parentToken = await storedToken(page);
  const savedAdmin = await storedImpersonator(page);
  log("4. token berubah", parentToken !== adminToken);
  check("token berganti", parentToken !== adminToken);
  check("token admin tersimpan", savedAdmin?.token === adminToken);
  check(
    "tersimpan beserta identitasnya",
    savedAdmin?.user?.username === "admin",
    savedAdmin?.user?.username,
  );
  check(
    "header menampilkan role orang tua",
    (await headerText(page)).includes("Orang tua"),
    await headerText(page),
  );
  check(
    "tombol Login as disembunyikan",
    !(await loginAsButton(page)),
  );
  await page.screenshot(`${SHOTS}/login-as-03-sebagai-orang-tua.png`);

  // ── 5. Wewenang menyempit ke milik target ───────────────────
  console.log("\n=== 5. Wewenang sesi hasil Login as ===");
  const parentsStatus = await apiStatus(page, "/api/parents");
  check("mengelola akun -> 403", parentsStatus === 403, String(parentsStatus));
  const classes = await apiData(page, "/api/classes");
  log("5. kelas yang terlihat", JSON.stringify(classes?.classes));
  check(
    "cakupan kelas menyempit ke kelas anaknya",
    (classes?.classes ?? []).length === 1,
    JSON.stringify(classes?.classes),
  );
  const menuWrite = await page.evaluate(`fetch("/api/menus", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + localStorage.getItem("psp_token"),
    },
    body: JSON.stringify({ name: "Menu uji login as", items: [{ name: "X", itemType: "main" }] }),
  }).then((response) => response.status)`);
  check("membuat menu -> 403", menuWrite === 403, String(menuWrite));

  // ── 6. Kembali ke admin ─────────────────────────────────────
  console.log("\n=== 6. Kembali ke admin ===");
  await page.clickByText("Kembali ke admin");
  await page.waitFor(
    `localStorage.getItem("psp_impersonator") === null`,
    "jejak sesi admin dibersihkan",
  );
  await page.waitFor(
    `(document.querySelector("header")?.innerText ?? "").includes("Admin")`,
    "header kembali menampilkan admin",
  );
  check("token admin dipulihkan", (await storedToken(page)) === adminToken);
  check(
    "header kembali menampilkan admin",
    (await headerText(page)).includes("Admin"),
    await headerText(page),
  );
  check("bilah kembali hilang", !(await page.evaluate(
    `document.body.innerText.includes("Kembali ke admin")`,
  )));
  check("tombol Login as tampil lagi", await loginAsButton(page));
  check(
    "tetap di halaman yang sama",
    (await page.evaluate("location.pathname")) === "/hari-ini",
  );
  await page.screenshot(`${SHOTS}/login-as-04-kembali-admin.png`);

  // ── 7. Bertahan setelah halaman dimuat ulang ────────────────
  console.log("\n=== 7. Setelah muat ulang ===");
  await pickAccount(page, "sari");
  await page.waitFor(
    `localStorage.getItem("psp_impersonator") !== null`,
    "sesi orang tua aktif",
  );
  await page.goto("/hari-ini", { baseUrl: BASE });
  await page.waitFor(
    `(document.querySelector("header")?.innerText ?? "").includes("Orang tua")`,
    "identitas orang tua pulih",
  );
  check("identitas target pulih dari penyimpanan", true);
  check(
    "bilah kembali tetap tampil",
    await page.evaluate(`document.body.innerText.includes("Kembali ke admin")`),
  );
  check(
    "tombol Login as tetap tersembunyi",
    !(await loginAsButton(page)),
  );
  await page.screenshot(`${SHOTS}/login-as-05-setelah-muat-ulang.png`);

  // ── 8. Keluar saat memakai akun orang lain ──────────────────
  console.log("\n=== 8. Keluar dari sesi titipan ===");
  await page.evaluate(`document.querySelector('button[title="Keluar"]').click()`);
  await page.waitFor(
    `document.querySelector('[role="dialog"]')?.innerText.includes("Ingin keluar?")`,
    "konfirmasi keluar",
  );
  const confirm = await dialogText(page);
  log("8. isi konfirmasi", JSON.stringify(confirm));
  check(
    "memperingatkan sesi admin ikut berakhir",
    confirm.includes("sama-sama diakhiri"),
    confirm,
  );
  await clickInDialog(page, "Keluar");
  await page.waitFor("location.pathname === '/login'", "kembali ke /login");
  check("kembali ke halaman masuk", true);
  check("token dibuang", (await storedToken(page)) === null);
  check("jejak sesi admin dibuang", (await storedImpersonator(page)) === null);
  await page.screenshot(`${SHOTS}/login-as-06-setelah-keluar.png`);

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
