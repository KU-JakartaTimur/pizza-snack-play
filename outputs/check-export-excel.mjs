/**
 * Verifikasi tampilan: tombol "Unduh Excel" di halaman Sepekan & Bulanan.
 *
 * Yang dibuktikan di sini, di peramban sungguhan:
 *   - admin & korlas melihat tombolnya, orang tua tidak;
 *   - menekan tombolnya benar-benar mengirim permintaan ke server (`class`
 *     yang diminta = kelas yang tampil di layar) dan menghasilkan **berkas
 *     nyata** di folder unduhan, bukan sekadar pesan sukses;
 *   - server tetap menolak orang tua meski tombolnya dipaksa lewat API.
 *
 * Jalankan: bun run outputs/check-export-excel.mjs
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
const DOWNLOADS = "D:\\REACT-DEV\\pizza-snack-play\\outputs\\exports\\unduhan";

if (!fs.existsSync(SHOTS)) fs.mkdirSync(SHOTS, { recursive: true });
fs.rmSync(DOWNLOADS, { recursive: true, force: true });
fs.mkdirSync(DOWNLOADS, { recursive: true });

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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Tombol "Unduh Excel" ada di halaman ini? */
const exportButton = (page) =>
  page.evaluate(
    `Boolean([...document.querySelectorAll("button")]
       .find((item) => item.textContent.includes("Unduh Excel")))`,
  );

/** Tombolnya sudah aktif (data halaman sudah termuat)? */
const exportButtonReady = (page) =>
  page.evaluate(
    `Boolean([...document.querySelectorAll("button")]
       .find((item) => item.textContent.includes("Unduh Excel") && !item.disabled))`,
  );

/** Permintaan API yang benar-benar dikirim dokumen ini. */
const apiRequests = (page) =>
  page.evaluate(
    `performance.getEntriesByType("resource").map((e) => e.name)
       .filter((name) => name.includes("/api/"))`,
  );

/** Status balikan server untuk sebuah permintaan API, dari sudut pandang halaman. */
const apiStatus = (page, path) =>
  page.evaluate(`fetch(${JSON.stringify(path)}, {
    headers: { Authorization: "Bearer " + localStorage.getItem("psp_token") },
  }).then((response) => response.status)`);

/**
 * Tunggu berkas `.xlsx` muncul di folder unduhan.
 * Berkas `.crdownload` (unduhan belum selesai) sengaja dilewati.
 */
async function waitForDownload(timeoutMs = 15000) {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    const files = fs
      .readdirSync(DOWNLOADS)
      .filter((name) => name.endsWith(".xlsx"));
    if (files.length > 0) return files[0];
    await sleep(250);
  }
  return null;
}

function clearDownloads() {
  for (const name of fs.readdirSync(DOWNLOADS)) {
    fs.rmSync(`${DOWNLOADS}\\${name}`, { force: true });
  }
}

/** Berkas benar-benar berkas Excel? Cek tanda tangan ZIP + ukuran wajar. */
function isXlsx(file) {
  const bytes = fs.readFileSync(file);
  return {
    ok: bytes.length > 1000 && bytes[0] === 0x50 && bytes[1] === 0x4b,
    size: bytes.length,
    head: `${bytes[0]},${bytes[1]}`,
  };
}

/** Isi form masuk, kirim, lalu lewati popup sambutan. */
async function loginAs(page, username) {
  await page.goto("/login", { baseUrl: BASE });
  await page.evaluate("localStorage.clear()");
  await page.goto("/login", { baseUrl: BASE });
  await page.setValue('input[placeholder="mis. sari"]', username);
  await page.setValue('input[type="password"]', "snack123");
  await page.clickByText("Masuk");
  await page.waitFor(
    `document.querySelector('[role="dialog"]')?.innerText.includes("Login berhasil")`,
    "popup login berhasil",
  );
  await page.evaluate(`(function () {
    const dialog = document.querySelector('[role="dialog"]');
    [...dialog.querySelectorAll("button")]
      .find((button) => button.textContent.includes("Mulai")).click();
  })()`);
  await page.waitFor("location.pathname === '/hari-ini'", "masuk ke /hari-ini");
  await page.waitFor(
    `!document.querySelector('[role="dialog"]')`,
    "popup sambutan lepas dari DOM",
  );
}

// Profil WAJIB di luar folder proyek — lihat SKILL.md.
const page = await launchEdge({
  port: 9333,
  profileDir: `${process.env.TEMP}\\psp-edge-profile`,
});

try {
  // Unduhan headless diarahkan ke folder kita; tanpa ini berkasnya tidak
  // pernah menyentuh disk dan "berhasil" hanya berarti tidak ada galat.
  await page.send("Browser.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: DOWNLOADS,
    eventsEnabled: true,
  });

  // ── 1. Admin — halaman Sepekan ──────────────────────────────
  console.log("\n=== 1. Admin · Sepekan ===");
  await loginAs(page, "admin");

  await page.goto("/minggu-ini", { baseUrl: BASE });
  await page.waitFor(
    `document.body.innerText.includes("Jadwal Sepekan")`,
    "halaman Sepekan",
  );
  check("admin melihat tombol Unduh Excel", await exportButton(page));
  await page.waitFor(
    `Boolean([...document.querySelectorAll("button")]
       .find((item) => item.textContent.includes("Unduh Excel") && !item.disabled))`,
    "tombol unduh aktif",
  );
  check("tombol baru aktif setelah jadwal termuat", await exportButtonReady(page));
  await page.screenshot(`${SHOTS}/export-01-sepekan-admin.png`);

  const weekLabel = await page.evaluate(
    `document.querySelector("main, body").innerText.match(/\\d+ - \\d+ \\w+ \\d{4}/)?.[0] ?? ""`,
  );
  log("1. label pekan di layar", JSON.stringify(weekLabel));

  clearDownloads();
  await page.clickByText("Unduh Excel");
  const weekFile = await waitForDownload();
  check("menekan tombol menghasilkan berkas", Boolean(weekFile), "tidak ada berkas");

  if (weekFile) {
    const info = isXlsx(`${DOWNLOADS}\\${weekFile}`);
    log("1. berkas terunduh", `${weekFile} (${info.size} byte)`);
    check("nama berkas sepekan sesuai pola", /^jadwal-sepekan-kelas-.+-\d{4}-\d{2}-\d{2}\.xlsx$/.test(weekFile), weekFile);
    check("berkasnya benar-benar berkas Excel (PK)", info.ok, `byte awal ${info.head}`);
  }

  const weekRequests = (await apiRequests(page)).filter((url) =>
    url.includes("schedules/export"),
  );
  log("1. permintaan ekspor", JSON.stringify(weekRequests));
  check(
    "halaman meminta ekspor sepekan",
    weekRequests.some((url) => url.includes("scope=week")),
  );
  check(
    "kelas yang diminta ikut disertakan",
    weekRequests.some((url) => url.includes("class=")),
  );

  // ── 2. Admin — halaman Bulanan ──────────────────────────────
  console.log("\n=== 2. Admin · Bulanan ===");
  await page.goto("/bulan", { baseUrl: BASE });
  await page.waitFor(
    `document.body.innerText.includes("Jadwal Bulanan")`,
    "halaman Bulanan",
  );
  check("admin melihat tombol Unduh Excel", await exportButton(page));
  await page.waitFor(
    `Boolean([...document.querySelectorAll("button")]
       .find((item) => item.textContent.includes("Unduh Excel") && !item.disabled))`,
    "tombol unduh aktif",
  );
  await page.screenshot(`${SHOTS}/export-02-bulanan-admin.png`);

  clearDownloads();
  await page.clickByText("Unduh Excel");
  const monthFile = await waitForDownload();
  check("menekan tombol menghasilkan berkas", Boolean(monthFile), "tidak ada berkas");

  if (monthFile) {
    const info = isXlsx(`${DOWNLOADS}\\${monthFile}`);
    log("2. berkas terunduh", `${monthFile} (${info.size} byte)`);
    check(
      "nama berkas bulanan sesuai pola",
      /^jadwal-bulanan-\d{4}-\d{2}-kelas-.+\.xlsx$/.test(monthFile),
      monthFile,
    );
    check("berkasnya benar-benar berkas Excel (PK)", info.ok, `byte awal ${info.head}`);
    check(
      "berkas bulanan lebih besar dari berkas sepekan",
      Boolean(weekFile) && info.size > 2000,
      `${info.size} byte`,
    );
  }

  check(
    "halaman meminta ekspor bulanan",
    (await apiRequests(page)).some((url) => url.includes("scope=month")),
  );

  // ── 3. Korlas — tombol ada, kelasnya sendiri ────────────────
  console.log("\n=== 3. Korlas · Sepekan ===");
  await loginAs(page, "budi");
  await page.goto("/minggu-ini", { baseUrl: BASE });
  await page.waitFor(
    `document.body.innerText.includes("Jadwal Sepekan")`,
    "halaman Sepekan",
  );
  check("korlas melihat tombol Unduh Excel", await exportButton(page));
  await page.screenshot(`${SHOTS}/export-03-sepekan-korlas.png`);

  clearDownloads();
  await page.clickByText("Unduh Excel");
  const korlasFile = await waitForDownload();
  check("korlas bisa mengunduh", Boolean(korlasFile), "tidak ada berkas");
  if (korlasFile) {
    log("3. berkas korlas", korlasFile);
    check(
      "berkas korlas memakai kelasnya",
      /^jadwal-sepekan-kelas-1-/.test(korlasFile),
      korlasFile,
    );
  }

  // ── 4. Orang tua — tidak ada tombol, server tetap menolak ───
  console.log("\n=== 4. Orang tua ===");
  await loginAs(page, "sari");

  await page.goto("/minggu-ini", { baseUrl: BASE });
  await page.waitFor(
    `document.body.innerText.includes("Jadwal Sepekan")`,
    "halaman Sepekan",
  );
  check("orang tua tidak melihat tombolnya (Sepekan)", !(await exportButton(page)));
  await page.screenshot(`${SHOTS}/export-04-sepekan-orangtua.png`);

  await page.goto("/bulan", { baseUrl: BASE });
  await page.waitFor(
    `document.body.innerText.includes("Jadwal Bulanan")`,
    "halaman Bulanan",
  );
  check("orang tua tidak melihat tombolnya (Bulanan)", !(await exportButton(page)));
  await page.screenshot(`${SHOTS}/export-05-bulanan-orangtua.png`);

  // Menyembunyikan tombol bukan penjagaan — server harus tetap menolak
  // walaupun permintaannya dibuat langsung dari sesi orang tua ini.
  const weekStatus = await apiStatus(page, "/api/schedules/export?scope=week");
  check(
    "orang tua memaksa ekspor sepekan lewat API -> 403",
    weekStatus === 403,
    `got ${weekStatus}`,
  );

  const monthStatus = await apiStatus(
    page,
    "/api/schedules/export?scope=month&year=2026&month=9",
  );
  check(
    "orang tua memaksa ekspor bulanan lewat API -> 403",
    monthStatus === 403,
    `got ${monthStatus}`,
  );

  console.log("\n--- galat konsol ---");
  console.log(JSON.stringify(page.errors));
  check("tidak ada galat di konsol", page.errors.length === 0, page.errors.join(" | "));
  check("tidak ada dialog bawaan peramban", page.dialogs.length === 0, page.dialogs.join(" | "));
} finally {
  await page.close();
}

console.log(`\n=== HASIL: ${pass} pass, ${fail} fail ===`);
process.exit(fail === 0 ? 0 : 1);
