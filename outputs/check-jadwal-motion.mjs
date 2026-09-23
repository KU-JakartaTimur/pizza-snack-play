/**
 * Verifikasi tampilan: refactor + animasi pada menu jadwal.
 *
 * Jalankan: bun run outputs/check-jadwal-motion.mjs
 * (dev server harus jalan: `bun run dev`)
 *
 * Yang diuji — semua akibat refactor, bukan hiasan:
 * - Halaman jadwal (Hari Ini, Pekan Ini, Bulanan, Kelola, Pilih Jadwal) tetap
 *   merender isinya setelah `ScheduleDayCard` dipecah jadi sub-komponen.
 * - Navigasi bulan masih menggeser bulan, dan **berputar tahun** dengan benar
 *   (dulu logikanya disalin di tiga halaman; sekarang satu hook).
 * - Pemilih kelas + wewenang tidak berubah: korlas melihat semua kelas tapi
 *   menyusun kelasnya sendiri.
 * - Animasi benar-benar terpasang: elemen ber-`transform`/`opacity` dari
 *   framer-motion ada di DOM, dan tetap ada walau `prefers-reduced-motion`
 *   tidak disetel.
 * - Konsol bersih (tidak ada error React/framer-motion).
 *
 * Penggerak browser mengikuti skill `windows-edge-cdp-ui-verify` — lihat
 * SKILL.md-nya untuk jebakan yang wajib dipatuhi (profil di luar proyek, tutup
 * di `finally`, proxy localhost, input React).
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

const page = await launchEdge({
  port: 9333,
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

/**
 * Buka sebuah route sambil menunggu judulnya benar-benar ter-commit.
 *
 * `location.pathname` berubah sebelum React menaruh pohon route yang baru
 * (skill `windows-edge-cdp-ui-verify`, jebakan 7), jadi yang ditunggu adalah
 * teks di DOM — bukan URL-nya.
 */
async function openRoute(path, title) {
  await page.goto(path, { baseUrl: BASE });
  await page.waitFor(
    `document.body.innerText.includes(${JSON.stringify(title)})`,
    `halaman ${path}`,
  );
}

const bodyText = () => page.evaluate("document.body.innerText");

/** Label bulan yang sedang ditampilkan {@link MonthNavigator}. */
const monthLabel = () =>
  page.evaluate(`(function () {
    const nav = [...document.querySelectorAll("div")]
      .find((el) => el.querySelector(':scope > button[aria-label="Bulan berikutnya"]'));
    return nav ? nav.innerText.trim() : null;
  })()`);

/** Klik tombol geser bulan lewat aria-label-nya. */
const shiftMonth = async (label, times = 1) => {
  for (let i = 0; i < times; i++) {
    await page.evaluate(`(function () {
      document.querySelector('button[aria-label=${JSON.stringify(label)}]').click();
    })()`);
  }
};

/**
 * Bukti animasi: hitung elemen yang punya `transform` atau `opacity` inline.
 *
 * framer-motion menulis keduanya ke atribut `style` saat menjalankan varian,
 * jadi keberadaannya membuktikan animasinya benar-benar merender — bukan
 * sekadar kelas CSS yang tidak terpakai.
 */
const animatedCount = () =>
  page.evaluate(`(function () {
    return [...document.querySelectorAll("[style]")]
      .filter((el) => (el.getAttribute("style") || "").includes("transform")).length;
  })()`);

/** Kartu hari jadwal di dalam grid hasil `ListReveal`. */
const dayCards = () =>
  page.evaluate(`document.querySelectorAll('main .grid > * > .card').length`);

const cardCount = () =>
  page.evaluate(`document.querySelectorAll(".card").length`);

const apiCalls = () =>
  page.evaluate(
    `performance.getEntriesByType("resource").map((e) => e.name).filter((n) => n.includes("/api/"))`,
  );

/** Tunggu sejumlah kartu hari benar-benar tergambar di dalam grid. */
const waitForDayCards = (min) =>
  page.waitFor(
    `document.querySelectorAll('main .grid > * > .card').length >= ${min}`,
    `${min} kartu hari`,
  );

try {
  // ── 1. Orang tua — Pekan Ini & Bulanan tetap merender ──────
  console.log("\n=== 1. Pekan Ini (sari) ===");
  await freshLoginPage();
  await loginAs("sari");

  await openRoute("/minggu-ini", "Jadwal Sepekan");
  // Tunggu kartunya benar-benar tergambar — teks judul muncul lebih dulu.
  await waitForDayCards(5);
  const weekText = await bodyText();
  log("1. kartu pekan", await dayCards());
  check("judul pekan tampil", weekText.includes("Jadwal Sepekan"));
  check(
    "hari Senin–Jumat tampil",
    ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"].every((d) =>
      weekText.includes(d),
    ),
  );
  check("5 kartu hari dirender", (await dayCards()) >= 5, `${await dayCards()}`);
  check(
    "animasi terpasang di kartu pekan",
    (await animatedCount()) > 0,
    `${await animatedCount()} elemen ber-transform`,
  );
  await page.screenshot(`${SHOTS}/motion-01-pekan.png`);

  // ── 2. Bulanan — navigasi bulan + putar tahun ───────────────
  console.log("\n=== 2. Bulanan: navigasi bulan & putar tahun ===");
  await openRoute("/bulan", "Jadwal Bulanan");
  await page.waitFor(
    `document.body.innerText.includes("Hari sekolah")`,
    "ringkasan bulan",
  );
  const initialLabel = await monthLabel();
  log("2. label bulan awal", initialLabel);
  check("label bulan terbaca", /^[A-Za-z]+ \d{4}$/.test(initialLabel ?? ""), initialLabel);

  await shiftMonth("Bulan berikutnya");
  await page.waitFor(
    `performance.getEntriesByType("resource").filter((e) => e.name.includes("/api/schedules/month")).length > 1`,
    "permintaan bulan kedua",
  );
  const nextLabel = await monthLabel();
  log("2b. setelah geser", nextLabel);
  check("bulan bergeser", nextLabel !== initialLabel, `${initialLabel} → ${nextLabel}`);

  // Geser mundur 14 bulan: harus melewati batas tahun, bukan mentok.
  await shiftMonth("Bulan sebelumnya", 14);
  await page.waitFor(
    `performance.getEntriesByType("resource").filter((e) => e.name.includes("/api/schedules/month")).length > 3`,
    "permintaan bulan mundur",
  );
  // Statistik baru muncul setelah data bulan tujuan tiba — tunggu dulu, kalau
  // tidak pembacaannya hanya menangkap keadaan kosong sementara.
  await page.waitFor(
    `document.body.innerText.includes("Hari sekolah")
       && document.querySelectorAll("main .grid > * > .card").length > 0`,
    "statistik bulan mundur",
  );
  const backLabel = await monthLabel();
  log("2c. setelah mundur 14 bulan", backLabel);
  check(
    "putar tahun mundur bekerja (bukan mentok di Januari)",
    /^[A-Za-z]+ \d{4}$/.test(backLabel ?? "") && backLabel !== nextLabel,
    backLabel,
  );
  const backText = await bodyText();
  check(
    "statistik bulan tetap dihitung",
    backText.includes("Hari sekolah") && backText.includes("Ada menu"),
  );
  check("kartu bulan mundur dirender", (await dayCards()) > 0, `${await dayCards()}`);
  const [, initYear] = (initialLabel ?? "").split(" ");
  const [, backYear] = (backLabel ?? "").split(" ");
  check(
    "tahun berkurang saat melewati Januari",
    Number(backYear) < Number(initYear),
    `${initYear} → ${backYear}`,
  );
  await page.screenshot(`${SHOTS}/motion-02-bulanan.png`);

  // ── 3. Pilih Jadwal — aksi klaim tetap utuh ─────────────────
  console.log("\n=== 3. Pilih Jadwal (sari) ===");
  await openRoute("/pilih-jadwal", "Pilih Jadwal");
  await page.waitFor(
    `performance.getEntriesByType("resource").some((e) => e.name.includes("/api/schedules/month"))`,
    "data bulan termuat",
  );
  // Tunggu kartunya tergambar; teks judul muncul sebelum datanya tiba.
  await waitForDayCards(5);
  const pickText = await bodyText();
  log("3. kartu pilih jadwal", await dayCards());
  check("judul halaman tampil", pickText.includes("Pilih Jadwal"));
  check("penghitung 'Masih kosong' ada", pickText.includes("Masih kosong"));
  check("penghitung 'Pilihan saya' ada", pickText.includes("Pilihan saya"));
  check("navigasi bulan ada di halaman ini", (await monthLabel()) !== null);
  check("kartu tanggal dirender", (await dayCards()) >= 5, `${await dayCards()}`);
  // Tiap kartu harus berakhir dengan salah satu tindakan — inilah bukti
  // `ClaimAction` menghasilkan footer yang benar untuk semuanya.
  const claimFooters = await page.evaluate(`(function () {
    const labels = ["Ambil tanggal ini", "Pilihan Anda",
      "Sudah dipilih orang tua lain", "Ditetapkan korlas", "Tanggal sudah lewat"];
    const cells = [...document.querySelectorAll('main .grid > * > .card')];
    return cells.filter((card) =>
      labels.some((label) => card.innerText.includes(label))).length;
  })()`);
  log("3b. kartu ber-footer aksi", claimFooters);
  check(
    "tiap kartu punya footer tindakan",
    claimFooters === (await dayCards()),
    `${claimFooters} dari ${await dayCards()}`,
  );
  await page.screenshot(`${SHOTS}/motion-03-pilih-jadwal.png`);

  // ── 4. Korlas — Kelola Jadwal + animasi baris ───────────────
  console.log("\n=== 4. Kelola Jadwal (budi, korlas kelas 1) ===");
  await freshLoginPage();
  await loginAs("budi");
  await openRoute("/jadwal", "Kelola Jadwal");
  await page.waitFor(
    `performance.getEntriesByType("resource").some((e) => e.name.includes("/api/schedules/month"))`,
    "tabel bulanan termuat",
  );
  const jadwalText = await bodyText();
  log("4. cuplikan", jadwalText.slice(0, 200).replace(/\n/g, " | "));
  check("judul tampil", jadwalText.includes("Kelola Jadwal"));
  check("toolbar bulan ada", (await monthLabel()) !== null);
  check(
    "aksi massal tetap dirender",
    ["Kunci bulan", "Salin Sepekan", "Publikasi"].some((t) =>
      jadwalText.includes(t),
    ),
  );
  // Ringkasan status datang dari query terpisah (`/schedules/status`), jadi ia
  // bisa tiba setelah tabelnya — tunggu, jangan baca langsung.
  await page.waitFor(
    `document.body.innerText.includes("Status bulan ini")`,
    "ringkasan status per kelas",
  );
  check("ringkasan status per kelas ada", (await bodyText()).includes("Status bulan ini"));
  check(
    "kelas korlas yang dipakai (bukan kelas lain)",
    (await apiCalls()).some((u) => u.includes("class=1")),
  );

  // Baris tabel harus punya input menu/petugas — bukti DayRow utuh setelah
  // dibungkus animasi.
  const rowInputs = await page.evaluate(
    `document.querySelectorAll('ul > li input[placeholder="Petugas…"]').length`,
  );
  log("4b. input petugas", rowInputs);
  check("baris day punya input petugas", rowInputs > 0, `${rowInputs}`);

  const dayRows = await page.evaluate(
    `document.querySelectorAll('ul > li input[placeholder="Catatan…"]').length`,
  );
  log("4c. input catatan", dayRows);
  check("baris day punya input catatan", dayRows > 0, `${dayRows}`);
  await page.screenshot(`${SHOTS}/motion-04-kelola.png`);

  // ── 5. Geser bulan di Kelola Jadwal ─────────────────────────
  console.log("\n=== 5. Kelola Jadwal: geser bulan ===");
  const beforeShift = await monthLabel();
  await shiftMonth("Bulan berikutnya");
  await page.waitFor(
    `performance.getEntriesByType("resource").filter((e) => e.name.includes("/api/schedules/month")).length > 1`,
    "permintaan bulan berikutnya",
  );
  const afterShift = await monthLabel();
  log("5. label", `${beforeShift} → ${afterShift}`);
  check("bulan bergeser di Kelola Jadwal", afterShift !== beforeShift);

  // ── 6. Admin — bilah menu + Kelola Jadwal semua kelas ───────
  console.log("\n=== 6. Admin ===");
  await freshLoginPage();
  await loginAs("admin");
  await openRoute("/jadwal", "Kelola Jadwal");
  await page.waitFor(
    `performance.getEntriesByType("resource").some((e) => e.name.includes("/api/schedules/status"))`,
    "status semua kelas",
  );
  const adminText = await bodyText();
  check("admin melihat aksi semua kelas", adminText.includes("semua kelas"));
  check(
    "menu header punya penanda aktif (animasi layout)",
    (await page.evaluate(
      `document.querySelectorAll('header nav a[aria-current="page"]').length`,
    )) === 1,
    "penanda aktif",
  );
  await page.screenshot(`${SHOTS}/motion-05-admin.png`);

  // ── 7. reduced motion tidak mogok ───────────────────────────
  console.log("\n=== 7. prefers-reduced-motion ===");
  await page.send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });
  await openRoute("/minggu-ini", "Jadwal Sepekan");
  check(
    "halaman tetap merender dengan reduced motion",
    (await cardCount()) > 0,
    `${await cardCount()} kartu`,
  );
  await page.send("Emulation.setEmulatedMedia", { features: [] });

  // ── 8. Konsol bersih ────────────────────────────────────────
  console.log("\n=== 8. Konsol ===");
  const errors = page.errors.filter(
    (e) => !/favicon|DevTools|Download the React DevTools/i.test(String(e)),
  );
  log("error halaman", errors.length === 0 ? "tidak ada" : JSON.stringify(errors));
  check("tanpa error konsol", errors.length === 0, JSON.stringify(errors).slice(0, 300));
  check("tanpa dialog bawaan peramban", page.dialogs.length === 0, JSON.stringify(page.dialogs));

  console.log(`\n=== HASIL: ${pass} pass, ${fail} fail ===`);
  console.log("Tangkapan layar ada di outputs/screenshots/");
} finally {
  await page.close();
  console.log("Edge ditutup.");
}

process.exit(fail > 0 ? 1 : 0);
