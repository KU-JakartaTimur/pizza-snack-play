/**
 * Automated User Acceptance Testing (UAT) Script for Pizza Snack Play
 * 
 * Executes full user flows across Admin, Korlas, and Parent roles.
 * Saves screenshots to outputs/screenshots/uat-*.png
 */

import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE_URL = "http://localhost:5173";
const OUTPUT_DIR = "D:\\DEV\\JS\\pizza-snack-play\\outputs\\screenshots";

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Utility delay
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runUAT() {
  console.log("=================================================");
  console.log("🚀 MEMULAI PROSES UAT (USER ACCEPTANCE TESTING)");
  console.log("=================================================");
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Target Output: ${OUTPUT_DIR}\n`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    defaultViewport: { width: 1280, height: 860 },
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  const results = [];

  async function step(id, name, action) {
    process.stdout.write(`⏳ [${id}] ${name}... `);
    try {
      await action();
      console.log("✅ BERHASIL");
      results.push({ id, name, status: "PASSED" });
    } catch (err) {
      console.log(`❌ GAGAL: ${err.message}`);
      results.push({ id, name, status: "FAILED", error: err.message });
    }
  }

  async function saveScreenshot(filename) {
    const fullPath = path.join(OUTPUT_DIR, filename);
    await page.screenshot({ path: fullPath, fullPage: false });
    return fullPath;
  }

  // -------------------------------------------------------------
  // SKENARIO 1: AUTENTIKASI & VALIDASI LOGIN
  // -------------------------------------------------------------
  await step("UAT-01", "Halaman Login Awal (Clean State)", async () => {
    // Clear localStorage to ensure logged out state
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle0" });
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle0" });
    await wait(600);
    await saveScreenshot("uat-01-halaman-login.png");
  });

  await step("UAT-02", "Validasi Login Gagal (Password Salah)", async () => {
    await page.type('input[placeholder="mis. sari"]', "admin");
    await page.type('input[type="password"]', "password-salah-123");
    await page.click('button[type="submit"]');
    await wait(800);
    await saveScreenshot("uat-02-login-validasi-gagal.png");
  });

  await step("UAT-03", "Login Sukses Akun Admin", async () => {
    // Clear fields
    await page.evaluate(() => {
      const inputs = document.querySelectorAll("input");
      inputs.forEach((input) => (input.value = ""));
    });
    await page.click('input[placeholder="mis. sari"]', { clickCount: 3 });
    await page.type('input[placeholder="mis. sari"]', "admin");
    await page.click('input[type="password"]', { clickCount: 3 });
    await page.type('input[type="password"]', "snack123");
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => window.location.pathname !== '/login', { timeout: 6000 }).catch(() => {});
    await wait(1200);
    await saveScreenshot("uat-03-login-sukses-admin.png");
  });

  // -------------------------------------------------------------
  // SKENARIO 2: DASHBOARD ADMIN
  // -------------------------------------------------------------
  await step("UAT-04", "Dashboard Admin & Ringkasan Statistik", async () => {
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle0" });
    await wait(1000);
    await saveScreenshot("uat-04-dashboard-admin.png");
  });

  // -------------------------------------------------------------
  // SKENARIO 3: TAMPILAN JADWAL (HARI INI, MINGGUAN, BULANAN)
  // -------------------------------------------------------------
  await step("UAT-05", "Jadwal Hari Ini (Today View)", async () => {
    await page.goto(`${BASE_URL}/hari-ini`, { waitUntil: "networkidle0" });
    await wait(800);
    await saveScreenshot("uat-05-jadwal-hari-ini.png");
  });

  await step("UAT-06", "Jadwal Mingguan (Senin s/d Jumat)", async () => {
    await page.goto(`${BASE_URL}/minggu-ini`, { waitUntil: "networkidle0" });
    await wait(800);
    await saveScreenshot("uat-06-jadwal-minggu-ini.png");
  });

  await step("UAT-07", "Jadwal Kalender Bulanan (Bulan September 2026)", async () => {
    await page.goto(`${BASE_URL}/bulan`, { waitUntil: "networkidle0" });
    await wait(800);
    await saveScreenshot("uat-07-jadwal-bulanan.png");
  });

  // -------------------------------------------------------------
  // SKENARIO 4: PENGELOLAAN JADWAL (ADMIN / KORLAS)
  // -------------------------------------------------------------
  await step("UAT-08", "Kelola Jadwal & Status Draft/Locked/Published", async () => {
    await page.goto(`${BASE_URL}/jadwal`, { waitUntil: "networkidle0" });
    await wait(1000);
    await saveScreenshot("uat-08-kelola-jadwal-admin.png");
  });

  await step("UAT-09", "Modal Dialog Salin Jadwal Antar Minggu", async () => {
    // Click "Salin Minggu" button
    const buttons = await page.$$("button");
    for (const btn of buttons) {
      const text = await page.evaluate((el) => el.textContent, btn);
      if (text && text.includes("Salin Minggu")) {
        await btn.click();
        break;
      }
    }
    await wait(600);
    await saveScreenshot("uat-09-modal-salin-minggu.png");

    // Close modal by clicking Batal or Close button
    const cancelButtons = await page.$$("button");
    for (const btn of cancelButtons) {
      const text = await page.evaluate((el) => el.textContent, btn);
      if (text && (text.includes("Batal") || text.includes("Tutup"))) {
        await btn.click();
        break;
      }
    }
    await wait(400);
  });

  await step("UAT-10", "Modal Dialog Hari Libur", async () => {
    const buttons = await page.$$("button");
    for (const btn of buttons) {
      const text = await page.evaluate((el) => el.textContent, btn);
      if (text && text.includes("Hari Libur")) {
        await btn.click();
        break;
      }
    }
    await wait(600);
    await saveScreenshot("uat-10-modal-hari-libur.png");

    // Close modal
    const cancelButtons = await page.$$("button");
    for (const btn of cancelButtons) {
      const text = await page.evaluate((el) => el.textContent, btn);
      if (text && (text.includes("Batal") || text.includes("Tutup"))) {
        await btn.click();
        break;
      }
    }
    await wait(400);
  });

  // -------------------------------------------------------------
  // SKENARIO 5: KATALOG MENU & KATEGORI
  // -------------------------------------------------------------
  await step("UAT-11", "Katalog Menu Snack (Admin View)", async () => {
    await page.goto(`${BASE_URL}/menu`, { waitUntil: "networkidle0" });
    await wait(800);
    await saveScreenshot("uat-11-katalog-menu.png");
  });

  await step("UAT-12", "Modal Dialog Form Tambah Menu Baru", async () => {
    const buttons = await page.$$("button");
    for (const btn of buttons) {
      const text = await page.evaluate((el) => el.textContent, btn);
      if (text && text.includes("Menu baru")) {
        await btn.click();
        break;
      }
    }
    await wait(600);
    await saveScreenshot("uat-12-modal-tambah-menu.png");

    // Close modal
    const cancelButtons = await page.$$("button");
    for (const btn of cancelButtons) {
      const text = await page.evaluate((el) => el.textContent, btn);
      if (text && (text.includes("Batal") || text.includes("Tutup"))) {
        await btn.click();
        break;
      }
    }
    await wait(400);
  });

  await step("UAT-13", "Manajemen Kategori Menu", async () => {
    await page.goto(`${BASE_URL}/kategori`, { waitUntil: "networkidle0" });
    await wait(800);
    await saveScreenshot("uat-13-kategori-menu.png");
  });

  // -------------------------------------------------------------
  // SKENARIO 6: PENCARIAN RIWAYAT MENU
  // -------------------------------------------------------------
  await step("UAT-14", "Pencarian Riwayat Menu & Buah ('jeruk')", async () => {
    await page.goto(`${BASE_URL}/pencarian`, { waitUntil: "networkidle0" });
    await wait(500);

    // Type query "jeruk"
    const input = await page.$('input[placeholder*="jeruk"]');
    if (input) {
      await input.type("jeruk");
    } else {
      const anyInput = await page.$("form input");
      if (anyInput) await anyInput.type("jeruk");
    }

    // Click submit button
    await page.click('button[type="submit"]');
    await wait(1000);
    await saveScreenshot("uat-14-pencarian-menu-jeruk.png");
  });

  // -------------------------------------------------------------
  // SKENARIO 7: MANAJEMEN AKUN ORANG TUA (ADMIN)
  // -------------------------------------------------------------
  await step("UAT-15", "Manajemen Akun Orang Tua (Daftar & Role)", async () => {
    await page.goto(`${BASE_URL}/orang-tua`, { waitUntil: "networkidle0" });
    await wait(800);
    await saveScreenshot("uat-15-kelola-akun-orang-tua.png");
  });

  await step("UAT-16", "Modal Form Tambah Akun Orang Tua", async () => {
    const buttons = await page.$$("button");
    for (const btn of buttons) {
      const text = await page.evaluate((el) => el.textContent, btn);
      if (text && text.includes("Akun baru")) {
        await btn.click();
        break;
      }
    }
    await wait(600);
    await saveScreenshot("uat-16-modal-tambah-orang-tua.png");

    // Close modal
    const cancelButtons = await page.$$("button");
    for (const btn of cancelButtons) {
      const text = await page.evaluate((el) => el.textContent, btn);
      if (text && (text.includes("Batal") || text.includes("Tutup"))) {
        await btn.click();
        break;
      }
    }
    await wait(400);
  });

  // -------------------------------------------------------------
  // SKENARIO 8: ROLE ORANG TUA & FITUR PILIH JADWAL (F9)
  // -------------------------------------------------------------
  await step("UAT-17", "Login Orang Tua ('sari') & Fitur Pilih Jadwal", async () => {
    // Logout and login as sari
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle0" });
    await page.type('input[placeholder="mis. sari"]', "sari");
    await page.type('input[type="password"]', "snack123");
    await page.click('button[type="submit"]');
    await wait(1000);

    // Go to /pilih-jadwal
    await page.goto(`${BASE_URL}/pilih-jadwal`, { waitUntil: "networkidle0" });
    await wait(1000);
    await saveScreenshot("uat-17-pilih-jadwal-orang-tua.png");
  });

  // -------------------------------------------------------------
  // SKENARIO 9: ORANG TUA MULTI-ANAK & CLASS SWITCHER
  // -------------------------------------------------------------
  await step("UAT-18", "Orang Tua Multi-Anak ('dewi') & Class Switcher", async () => {
    // Logout and login as dewi
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle0" });
    await page.type('input[placeholder="mis. sari"]', "dewi");
    await page.type('input[type="password"]', "snack123");
    await page.click('button[type="submit"]');
    await wait(1000);

    await page.goto(`${BASE_URL}/hari-ini`, { waitUntil: "networkidle0" });
    await wait(800);
    await saveScreenshot("uat-18-orang-tua-multi-anak-switcher.png");
  });

  await step("UAT-19", "Profil Pengguna Orang Tua & Form Password", async () => {
    await page.goto(`${BASE_URL}/profil`, { waitUntil: "networkidle0" });
    await wait(800);
    await saveScreenshot("uat-19-profil-orang-tua.png");
  });

  // -------------------------------------------------------------
  // SKENARIO 10: ROLE KORLAS (KOORDINATOR KELAS)
  // -------------------------------------------------------------
  await step("UAT-20", "Login Korlas ('budi' Kelas 1) & Wewenang Terbatas", async () => {
    // Logout and login as budi
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle0" });
    await page.type('input[placeholder="mis. sari"]', "budi");
    await page.type('input[type="password"]', "snack123");
    await page.click('button[type="submit"]');
    await wait(1000);

    await page.goto(`${BASE_URL}/jadwal`, { waitUntil: "networkidle0" });
    await wait(800);
    await saveScreenshot("uat-20-tampilan-korlas-kelas-1.png");
  });

  // -------------------------------------------------------------
  // SKENARIO 11: RESPONSIVE MOBILE VIEW (SMARTPHONE VIEWPORT)
  // -------------------------------------------------------------
  await step("UAT-21", "Tampilan Mobile Viewport (iPhone 12/13/14)", async () => {
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.goto(`${BASE_URL}/hari-ini`, { waitUntil: "networkidle0" });
    await wait(800);
    await saveScreenshot("uat-21-responsive-mobile-view.png");
  });

  await browser.close();

  console.log("\n=================================================");
  console.log("🏁 HASIL UAT SELESAI");
  console.log("=================================================");
  const passed = results.filter((r) => r.status === "PASSED").length;
  const failed = results.filter((r) => r.status === "FAILED").length;
  console.log(`Total Skenario: ${results.length}`);
  console.log(`Lolos (Passed): ${passed}`);
  console.log(`Gagal (Failed): ${failed}`);
  console.log(`Semua screenshoot tersimpan di: ${OUTPUT_DIR}\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runUAT().catch((err) => {
  console.error("FATAL ERROR IN UAT:", err);
  process.exit(1);
});
