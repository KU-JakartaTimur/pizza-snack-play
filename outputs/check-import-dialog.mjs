/**
 * Verifikasi tampilan: dialog "Impor Jadwal" di halaman /jadwal.
 *
 * Jalankan: node outputs/check-import-dialog.mjs
 * (dev server harus jalan di localhost:5173 + D1 lokal ter-seed)
 *
 * Yang diperiksa — perilaku nyata, bukan hiasan:
 * - Tombol "Impor Jadwal" membuka dialog, dan textarea-nya belum ada sebelumnya.
 * - Tombol "Impor" MATI selama belum ada pratinjau (dua langkah dipaksa).
 * - "Pratinjau" menampilkan jumlah blok/hari/baris/menu yang benar.
 * - Mengubah teks MEMBUANG pratinjau — tombol "Impor" mati lagi.
 * - "Impor" benar-benar menulis baris ke server dan menampilkan banner hasilnya.
 * - Konsol bersih.
 *
 * Data uji memakai Januari 2037 (5 Jan = Senin, 6 Jan = Selasa) — jauh dari
 * data sekolah — lalu dibersihkan sendiri di akhir.
 */
import fs from "fs";
import puppeteer from "puppeteer-core";

const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const BASE = "http://localhost:5173";
const API = `${BASE}/api`;
const SHOTS = "D:/DEV/JS/pizza-snack-play/outputs/screenshots";

const TANGGAL = ["2037-01-05", "2037-01-06"];
const TAG = "Uji Dialog";
const TEKS = [
  "5 - 6 Januari 2037",
  `Senin   : ${TAG} Nasi Goreng + jeruk`,
  `Selasa  : ${TAG} Mie Ayam + melon`,
].join("\n");

if (!fs.existsSync(SHOTS)) fs.mkdirSync(SHOTS, { recursive: true });

let pass = 0;
let fail = 0;
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  ok ? pass++ : fail++;
};

/** Klik tombol berdasarkan teksnya (persis, setelah trim). */
const clickButton = (page, text) =>
  page.evaluate((t) => {
    const el = [...document.querySelectorAll("button")].find(
      (b) => b.textContent.trim() === t,
    );
    if (!el) throw new Error(`tombol tidak ditemukan: ${t}`);
    el.click();
  }, text);

/** Apakah tombol ada, dan apakah sedang mati. */
const buttonState = (page, text) =>
  page.evaluate((t) => {
    const el = [...document.querySelectorAll("button")].find(
      (b) => b.textContent.trim() === t,
    );
    return el ? { found: true, disabled: el.disabled } : { found: false };
  }, text);

/**
 * Isi textarea ala React.
 *
 * Nilai ditulis lewat setter asli `HTMLTextAreaElement.prototype.value` lalu
 * event `input` disiarkan — cara yang benar untuk input terkendali React.
 * Kalau state React-nya tidak ikut berubah, tombol "Pratinjau" tetap mati dan
 * uji di bawah akan menangkapnya.
 */
const setTextarea = (page, value) =>
  page.evaluate((v) => {
    const ta = document.querySelector("textarea");
    if (!ta) throw new Error("textarea tidak ada");
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value",
    ).set;
    setter.call(ta, v);
    ta.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);

const bodyText = (page) => page.evaluate(() => document.body.innerText);

// ── Bersih-bersih lebih dulu: sisa jalan sebelumnya ─────────────
const api = async (method, path, token, body) => {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* tanpa body */
  }
  return { status: res.status, data: json?.data ?? null };
};

const login = await fetch(`${API}/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username: "admin", password: "snack123" }),
});
const token = (await login.json())?.data?.token;

const cleanup = async () => {
  if (!token) return { rows: 0, menus: 0 };
  const classes =
    (await api("GET", "/classes", token)).data?.classes ?? [];
  let rows = 0;
  for (const className of classes) {
    const days =
      (
        await api(
          "GET",
          `/schedules/range?from=${TANGGAL[0]}&to=${TANGGAL[1]}&class=${encodeURIComponent(className)}`,
          token,
        )
      ).data ?? [];
    const ids = days.map((d) => d.scheduleId).filter((id) => id !== null);
    if (ids.length > 0) {
      await api("POST", "/schedules/bulk/unlock", token, { ids });
      for (const id of ids) {
        await api("DELETE", `/schedules/${id}`, token);
        rows++;
      }
    }
  }
  const menus =
    ((await api("GET", "/menus", token)).data ?? []).filter((m) =>
      m.name.startsWith(TAG),
    );
  for (const menu of menus) await api("DELETE", `/menus/${menu.id}`, token);
  return { rows, menus: menus.length };
};

const stale = await cleanup();
console.log(
  `Bersih-bersih awal: ${stale.rows} baris, ${stale.menus} menu sisa.\n`,
);

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--proxy-server=direct://",
    "--proxy-bypass-list=*",
  ],
});

let imported = false;

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1100 });

  const consoleErrors = [];
  page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
  page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${e.message}`));

  // ── Masuk sebagai admin ────────────────────────────────────
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle2" });
  await page.waitForSelector("input", { timeout: 15000 });

  const inputs = await page.$$("input");
  await inputs[0].click();
  await page.keyboard.type("admin", { delay: 20 });
  await inputs[1].click();
  await page.keyboard.type("snack123", { delay: 20 });
  await page.click('button[type="submit"]');

  await page.waitForFunction(
    () =>
      [...document.querySelectorAll("button")].some(
        (b) => b.textContent.trim() === "Mulai",
      ),
    { timeout: 20000 },
  );
  await clickButton(page, "Mulai");
  await page.waitForFunction(() => !location.pathname.includes("/login"), {
    timeout: 20000,
  });

  // ── Buka /jadwal ───────────────────────────────────────────
  await page.goto(`${BASE}/jadwal`, { waitUntil: "networkidle2" });
  await page.waitForFunction(
    () => document.body.innerText.includes("Kelola Jadwal"),
    { timeout: 20000 },
  );
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll("button")].some(
        (b) => b.textContent.trim() === "Impor Jadwal",
      ),
    { timeout: 20000 },
  );

  check(
    "sebelum dibuka, textarea dialog belum ada",
    (await page.$("textarea")) === null,
  );

  // ── Buka dialog ────────────────────────────────────────────
  await clickButton(page, "Impor Jadwal");
  await page.waitForSelector("textarea", { timeout: 10000 });
  await page.screenshot({ path: `${SHOTS}/import-1-dialog.png` });
  check("tombol Impor Jadwal membuka dialog", true);

  const sebelumTeks = await buttonState(page, "Impor");
  check(
    "tombol Impor mati selama teks masih kosong",
    sebelumTeks.found && sebelumTeks.disabled,
    JSON.stringify(sebelumTeks),
  );

  // ── Isi teks ───────────────────────────────────────────────
  await setTextarea(page, TEKS);
  await new Promise((r) => setTimeout(r, 300));

  const sesudahTeks = await buttonState(page, "Impor");
  check(
    "teks terisi -> state React ikut berubah (Pratinjau hidup)",
    (await buttonState(page, "Pratinjau")).disabled === false,
  );
  check(
    "tombol Impor tetap mati sebelum pratinjau dijalankan",
    sesudahTeks.disabled === true,
    JSON.stringify(sesudahTeks),
  );

  // ── Pratinjau ──────────────────────────────────────────────
  await clickButton(page, "Pratinjau");
  await page.waitForFunction(
    () => document.body.innerText.includes("hari terbaca"),
    { timeout: 20000 },
  );
  await new Promise((r) => setTimeout(r, 400));

  const teksPreview = await bodyText(page);
  // Teks uji di atas hanya punya SATU blok (satu baris rentang tanggal).
  check(
    "pratinjau melaporkan 1 blok & 2 hari terbaca",
    teksPreview.includes("1 blok") && teksPreview.includes("2 hari terbaca"),
    teksPreview
      .split("\n")
      .filter((l) => l.includes("terbaca"))
      .join(" | "),
  );
  check(
    "pratinjau melaporkan baris baru (2 hari x 6 kelas = 12)",
    teksPreview.includes("12 baris baru"),
    teksPreview
      .split("\n")
      .filter((l) => l.includes("baris"))
      .join(" | "),
  );
  check(
    "pratinjau melaporkan 2 menu baru",
    teksPreview.includes("2 menu baru"),
  );
  check(
    "tabel pratinjau memuat tanggal hasil pencocokan",
    teksPreview.includes("2037-01-05") && teksPreview.includes("2037-01-06"),
  );
  await page.screenshot({ path: `${SHOTS}/import-2-pratinjau.png` });

  const sesudahPreview = await buttonState(page, "Impor");
  check(
    "setelah pratinjau, tombol Impor hidup",
    sesudahPreview.found && sesudahPreview.disabled === false,
    JSON.stringify(sesudahPreview),
  );

  // ── Mengubah teks membuang pratinjau ───────────────────────
  await setTextarea(page, `${TEKS}\n`);
  await new Promise((r) => setTimeout(r, 400));

  const teksSetelahUbah = await bodyText(page);
  check(
    "mengubah teks membuang pratinjau lama",
    !teksSetelahUbah.includes("hari terbaca"),
    teksSetelahUbah.includes("hari terbaca")
      ? "pratinjau masih tampil"
      : "pratinjau hilang",
  );
  check(
    "tombol Impor mati lagi setelah teks diubah",
    (await buttonState(page, "Impor")).disabled === true,
  );

  // ── Pratinjau ulang lalu impor ─────────────────────────────
  await clickButton(page, "Pratinjau");
  await page.waitForFunction(
    () => document.body.innerText.includes("hari terbaca"),
    { timeout: 20000 },
  );
  await new Promise((r) => setTimeout(r, 300));

  await clickButton(page, "Impor");
  await page.waitForFunction(
    () => document.body.innerText.includes("Ditambahkan"),
    { timeout: 25000 },
  );
  imported = true;

  const teksBanner = await bodyText(page);
  check(
    "banner menyebut 12 baris draft ditambahkan",
    teksBanner.includes("Ditambahkan 12 baris draft"),
    teksBanner.split("\n").find((l) => l.includes("Ditambahkan")),
  );
  check(
    "banner menyebut 2 menu baru",
    teksBanner.includes("2 menu baru"),
  );
  check(
    "dialog tertutup setelah impor",
    (await page.$("textarea")) === null,
  );
  await page.screenshot({ path: `${SHOTS}/import-3-banner.png` });

  // ── Bukti dari server, bukan dari layar ────────────────────
  const classes = (await api("GET", "/classes", token)).data?.classes ?? [];
  let total = 0;
  for (const className of classes) {
    const days =
      (
        await api(
          "GET",
          `/schedules/range?from=${TANGGAL[0]}&to=${TANGGAL[1]}&class=${encodeURIComponent(className)}`,
          token,
        )
      ).data ?? [];
    total += days.filter((d) => d.scheduleId !== null).length;
  }
  check(
    "server benar-benar menyimpan 12 baris (2 hari x 6 kelas)",
    total === 12,
    `got ${total}`,
  );

  check(
    "konsol bersih (tanpa error React)",
    consoleErrors.length === 0,
    consoleErrors.slice(0, 3).join(" | "),
  );
} catch (error) {
  check("skrip selesai tanpa exception", false, error.message);
  console.error(error);
} finally {
  await browser.close();
  const cleaned = await cleanup();
  console.log(
    `\nBersih-bersih akhir: ${cleaned.rows} baris, ${cleaned.menus} menu dihapus.`,
  );
  if (imported && cleaned.rows !== 12) {
    console.log("PERINGATAN: jumlah baris yang dibersihkan bukan 12.");
  }
  console.log(`\n=== HASIL: ${pass} pass, ${fail} fail ===`);
  process.exit(fail === 0 ? 0 : 1);
}
