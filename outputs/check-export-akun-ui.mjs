/**
 * Verifikasi tampilan: tombol "Unduh Excel" di halaman Akun Orang Tua.
 *
 * Yang dibuktikan di peramban sungguhan:
 *   - admin melihat tombolnya, korlas & orang tua tidak (halaman admin-only);
 *   - menekan tombolnya mengirim permintaan ke `/api/parents/export` dan
 *     menghasilkan **berkas nyata** di folder unduhan, bukan sekadar pesan sukses;
 *   - berkasnya benar-benar `.xlsx` (PK) dan namanya slug ASCII;
 *   - halaman tidak error dan tidak memunculkan dialog bawaan peramban.
 *
 * Jalankan: bun run outputs/check-export-akun-ui.mjs
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
const DOWNLOADS = "D:\\REACT-DEV\\pizza-snack-play\\outputs\\exports\\akun";

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

const exportButton = (page) =>
  page.evaluate(
    `Boolean([...document.querySelectorAll("button")]
       .find((item) => item.textContent.includes("Unduh Excel")))`,
  );

const apiRequests = (page) =>
  page.evaluate(
    `performance.getEntriesByType("resource").map((e) => e.name)
       .filter((name) => name.includes("/api/"))`,
  );

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

function isXlsx(file) {
  const bytes = fs.readFileSync(file);
  return {
    ok: bytes.length > 1000 && bytes[0] === 0x50 && bytes[1] === 0x4b,
    size: bytes.length,
  };
}

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
  port: 9334,
  profileDir: `${process.env.TEMP}\\psp-edge-profile`,
});

try {
  await page.send("Browser.setDownloadBehavior", {
    behavior: "allow",
    downloadPath: DOWNLOADS,
    eventsEnabled: true,
  });

  // ── 1. Admin ────────────────────────────────────────────────
  console.log("\n=== 1. Admin · Akun Orang Tua ===");
  await loginAs(page, "admin");

  await page.goto("/orang-tua", { baseUrl: BASE });
  await page.waitFor(
    `document.body.innerText.includes("Akun Orang Tua")`,
    "halaman Akun Orang Tua",
  );
  check("admin melihat tombol Unduh Excel", await exportButton(page));
  await page.screenshot(`${SHOTS}/export-akun-01-admin.png`);

  const headerText = await page.evaluate(
    `document.querySelector("main, body").innerText.slice(0, 200)`,
  );
  log("1. cuplikan halaman", JSON.stringify(headerText.split("\n")[0]));

  clearDownloads();
  await page.clickByText("Unduh Excel");
  const file = await waitForDownload();
  check("menekan tombol menghasilkan berkas", Boolean(file), "tidak ada berkas");

  if (file) {
    const info = isXlsx(`${DOWNLOADS}\\${file}`);
    log("1. berkas terunduh", `${file} (${info.size} byte)`);
    check(
      "nama berkas sesuai pola slug",
      /^akun-orang-tua-\d{4}-\d{2}-\d{2}\.xlsx$/.test(file),
      file,
    );
    check("berkasnya benar-benar berkas Excel (PK)", info.ok);
  }

  const requests = (await apiRequests(page)).filter((url) =>
    url.includes("parents/export"),
  );
  log("1. permintaan ekspor", JSON.stringify(requests));
  check(
    "halaman meminta /api/parents/export",
    requests.some((url) => url.includes("parents/export")),
  );

  // ── 2. Korlas — halaman tertutup ────────────────────────────
  console.log("\n=== 2. Korlas ===");
  await loginAs(page, "budi");
  await page.goto("/orang-tua", { baseUrl: BASE });
  await page.waitFor(
    `document.body.innerText.includes("Akses ditolak") ||
     document.body.innerText.includes("Akun Orang Tua")`,
    "halaman akun (korlas)",
  );
  check("korlas tidak melihat tombolnya", !(await exportButton(page)));
  check(
    "korlas melihat halaman tertutup",
    await page.evaluate(`document.body.innerText.includes("Akses ditolak")`),
  );
  await page.screenshot(`${SHOTS}/export-akun-02-korlas.png`);

  // ── 3. Orang tua — halaman tertutup ─────────────────────────
  console.log("\n=== 3. Orang tua ===");
  await loginAs(page, "sari");
  await page.goto("/orang-tua", { baseUrl: BASE });
  await page.waitFor(
    `document.body.innerText.includes("Akses ditolak") ||
     document.body.innerText.includes("Akun Orang Tua")`,
    "halaman akun (orang tua)",
  );
  check("orang tua tidak melihat tombolnya", !(await exportButton(page)));
  await page.screenshot(`${SHOTS}/export-akun-03-orangtua.png`);

  console.log("\n--- galat konsol ---");
  console.log(JSON.stringify(page.errors));
  check(
    "tidak ada galat di konsol",
    page.errors.length === 0,
    page.errors.join(" | "),
  );
  check(
    "tidak ada dialog bawaan peramban",
    page.dialogs.length === 0,
    page.dialogs.join(" | "),
  );
} finally {
  await page.close();
}

console.log(`\n=== HASIL: ${pass} pass, ${fail} fail ===`);
process.exit(fail === 0 ? 0 : 1);
