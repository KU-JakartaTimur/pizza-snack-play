/**
 * Verifikasi tampilan bagian "Tentang" di halaman depan.
 *
 * Jalankan: node outputs/check-about-landing.mjs
 * (dev server harus jalan di :5199 — `vite --port 5199`)
 *
 * Yang diperiksa:
 * - bagian #tentang benar-benar ter-render, berisi kartu, tabel teknologi, dan
 *   angka isi aplikasi
 * - bilah atas tidak meluap saat lima jangkar ditampilkan (768/1024/1440)
 * - tangkapan layar untuk diperiksa mata
 */
import fs from "node:fs";
import puppeteer from "puppeteer-core";

const BASE = "http://localhost:5199";
const SHOTS = "outputs/screenshots";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

if (!fs.existsSync(SHOTS)) fs.mkdirSync(SHOTS, { recursive: true });

let pass = 0;
let fail = 0;
function check(name, ok, detail = "") {
  if (ok) {
    pass++;
    console.log(`  PASS  ${name}`);
  } else {
    fail++;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

try {
  for (const width of [390, 768, 1024, 1440]) {
    const page = await browser.newPage();
    await page.setViewport({ width, height: 900, deviceScaleFactor: 1 });
    // Tangkapan layar diambil dengan gerak dikurangi: `Reveal` hanya
    // menganimasikan bagian yang masuk layar, sehingga elemen yang lebih tinggi
    // dari viewport akan tertangkap transparan — bukan karena tata letaknya
    // salah, melainkan karena animasinya belum jalan.
    await page.emulateMediaFeatures([
      { name: "prefers-reduced-motion", value: "reduce" },
    ]);
    await page.goto(BASE, { waitUntil: "networkidle0" });

    const header = await page.evaluate(() => {
      const row = document.querySelector("header > div:nth-child(2)");
      const nav = document.querySelector('header nav[aria-label="Navigasi halaman depan"]');
      return {
        rowScroll: row?.scrollWidth ?? 0,
        rowClient: row?.clientWidth ?? 0,
        navDisplay: nav ? getComputedStyle(nav).display : "missing",
      };
    });

    check(
      `${width}px · bilah atas tidak meluap`,
      header.rowScroll <= header.rowClient + 1,
      `scrollWidth ${header.rowScroll} > clientWidth ${header.rowClient}`,
    );
    console.log(`        nav display: ${header.navDisplay}`);

    if (width === 1440) {
      const about = await page.evaluate(() => {
        const section = document.querySelector("#tentang");
        if (!section) return null;
        const cards = section.querySelectorAll(".card").length;
        const text = section.textContent ?? "";
        return {
          height: section.getBoundingClientRect().height,
          cards,
          hasWorkbuddy: text.includes("WorkBuddy"),
          hasFree: text.includes("Biaya operasional nol"),
          hasStats: text.includes("65"),
          hasModules: text.includes("schedules") && text.includes("laporan"),
          hasTech: text.includes("Cloudflare D1") && text.includes("Hono"),
        };
      });
      check("#tentang ter-render", Boolean(about));
      if (about) {
        check("berisi empat kartu alasan + dua kartu rincian", about.cards >= 6, `cards=${about.cards}`);
        check("menyebut WorkBuddy", about.hasWorkbuddy);
        check("menyebut biaya operasional nol", about.hasFree);
        check("menampilkan angka isi aplikasi", about.hasStats);
        check("menampilkan modul API", about.hasModules);
        check("menampilkan tumpukan teknologi", about.hasTech);
      }

      // Animasi `Reveal` baru berjalan saat bagiannya masuk layar. Gulir dulu
      // dan beri waktu, kalau tidak tangkapan layarnya menampilkan bagian yang
      // masih transparan — terlihat seperti tata letak rusak padahal bukan.
      await page.evaluate(() =>
        document.querySelector("#tentang").scrollIntoView({ block: "start" }),
      );
      await new Promise((resolve) => setTimeout(resolve, 900));

      const el = await page.$("#tentang");
      await el.screenshot({ path: `${SHOTS}/about-1440.png` });
      await page.screenshot({ path: `${SHOTS}/landing-1440.png`, fullPage: true });
    }

    if (width === 390) {
      // Di layar HP, tabel teknologi menumpuk dan daftar modul jadi satu kolom.
      // Yang diperiksa: tidak ada gulir mendatar, bukan sekadar "kelihatan rapi".
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      check(
        "390px · tidak ada gulir mendatar",
        overflow <= 0,
        `kelebihan ${overflow}px`,
      );
      await page.evaluate(() =>
        document.querySelector("#tentang").scrollIntoView({ block: "start" }),
      );
      await new Promise((resolve) => setTimeout(resolve, 900));
      const el = await page.$("#tentang");
      await el.screenshot({ path: `${SHOTS}/about-390.png` });
    }

    if (width === 768) {
      // Di bawah `lg` bilah tengahnya dilipat; pastikan tombolnya benar-benar
      // membuka lima tautan, bukan hanya terlihat.
      await page.click('button[aria-controls="mobile-nav"]');
      await new Promise((resolve) => setTimeout(resolve, 350));
      const links = await page.$$eval("#mobile-nav a", (nodes) =>
        nodes.map((node) => node.textContent?.trim()),
      );
      check(
        "768px · menu lipat memuat lima jangkar",
        links.length === 5 && links.includes("Tentang"),
        links.join(" | "),
      );
      await page.screenshot({ path: `${SHOTS}/landing-768.png` });
    }

    await page.close();
  }
} finally {
  await browser.close();
}

console.log(`\n${pass} pass · ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
