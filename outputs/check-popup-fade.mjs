/**
 * Verifikasi tampilan: setiap popup memudar masuk **dan** memudar keluar.
 *
 * Yang dibuktikan di sini bukan "kelasnya ada", melainkan animasinya benar-benar
 * berjalan: framer-motion menulis `transform`/`opacity` ke atribut `style`
 * sambil menjalankan variannya, jadi kehadiran nilai **antara** (0 < opacity < 1,
 * atau transform selain `none`) adalah bukti gerak yang sesungguhnya.
 *
 * Empat popup yang diperiksa — tiga di antaranya **bukan** `Modal`, sehingga
 * tidak ikut terbawa saat `Modal` saja yang diubah:
 *   1. `Modal` (kelola jadwal → Tambah hari libur)
 *   2. `ConfirmDialog` (menu → hapus)  — memakai `Modal`
 *   3. Banner PWA (`PWAInstallPrompt`) — `fixed`, dirender `AppShell`
 *   4. Panel "Petugas kelas lain"      — setangkup buka/tutup di kartu tanggal
 *
 * Jalankan: bun run outputs/check-popup-fade.mjs
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

const dialogOpen = (page) =>
  page.evaluate(`Boolean(document.querySelector('[role="dialog"]'))`);

const dialogText = (page) =>
  page.evaluate(`document.querySelector('[role="dialog"]')?.innerText ?? null`);

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

/**
 * Buka tombol ber-`title` tertentu di dalam baris yang teksnya memuat `rowText`.
 * `li, tr` sekaligus supaya daftar berbentuk list maupun tabel sama-sama jalan.
 */
const clickRowButton = (page, rowText, buttonTitle) =>
  page.evaluate(`(function () {
    const row = [...document.querySelectorAll("li, tr")]
      .find((el) => el.innerText.includes(${JSON.stringify(rowText)}));
    if (!row) throw new Error("baris tidak ditemukan: " + ${JSON.stringify(rowText)});
    const button = row.querySelector(${JSON.stringify(`button[title="${buttonTitle}"]`)});
    if (!button) throw new Error("tombol tidak ada di baris itu: " + ${JSON.stringify(buttonTitle)});
    button.click();
    return true;
  })()`);

const api = (page, path, { method = "GET", body } = {}) =>
  page.evaluate(`fetch(${JSON.stringify(path)}, {
    method: ${JSON.stringify(method)},
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + localStorage.getItem("psp_token"),
    },
    ${body === undefined ? "" : `body: ${JSON.stringify(JSON.stringify(body))},`}
  }).then(async (response) => ({ status: response.status, json: await response.json() }))`);

/** Isi form masuk, kirim, lalu lewati popup sambutan. */
async function signIn(page, username, password) {
  // Kunjungi origin dulu supaya `localStorage` bisa disentuh (jebakan 11 di SKILL.md).
  await page.goto("/login", { baseUrl: BASE });
  await page.evaluate("localStorage.clear(); true");
  await page.goto("/login", { baseUrl: BASE });
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

// ── Alat ukur gerak ───────────────────────────────────────────

/**
 * Rekam gerak sebuah elemen **selagi** `action()` dijalankan.
 *
 * Cara kerjanya menentukan sahih atau tidaknya pengukuran:
 *
 * 1. **Perekam dipasang sebelum aksinya**, dan yang memasang adalah
 *    `MutationObserver` — bukan gelung `requestAnimationFrame`. Ini bukan
 *    pilihan gaya: React 19 menyerahkan hasil render ke mikro-task, jadi
 *    elemen barunya sudah ada di DOM sebelum bingkai berikutnya tiba. Gelung
 *    yang menunggu bingkai pertama akan selalu datang terlambat dan hanya
 *    melihat keadaan akhir — persis jebakan yang pernah membuat animasi
 *    masuk Modal tampak "tidak pernah berjalan" padahal berjalan.
 *
 * 2. **Cuplikan pertama diambil di mikro-task yang sama** dengan
 *    penyisipannya (`queueMicrotask`). Di situlah framer-motion menuliskan
 *    `opacity`/`transform` fase hidden — beberapa mikrodetik sebelum
 *    bingkai pertama sempat menggambar.
 *
 * 3. **Selektor di-`query` ulang tiap cuplikan** karena framer-motion melepas
 *    elemennya dari DOM begitu animasi keluarnya selesai.
 */
/**
 * Rekam gerak sebuah elemen **selagi** `action()` dijalankan.
 *
 * Cara kerjanya menentukan sahih atau tidaknya pengukuran:
 *
 * 1. **Perekam dipasang sebelum aksinya**, dan yang memasang adalah
 *    `MutationObserver` — bukan gelung `requestAnimationFrame`. Ini bukan
 *    pilihan gaya: React 19 menyerahkan hasil render ke mikro-task, jadi
 *    elemen barunya sudah ada di DOM sebelum bingkai berikutnya tiba. Gelung
 *    yang menunggu bingkai pertama akan selalu datang terlambat dan hanya
 *    melihat keadaan akhir — persis jebakan yang pernah membuat animasi
 *    masuk `Modal` tampak "tidak pernah berjalan" padahal berjalan.
 *
 * 2. **Cuplikan pertama diambil di mikro-task yang sama** dengan
 *    penyisipannya (`queueMicrotask`). Di situlah framer-motion menuliskan
 *    `opacity`/`transform` fase `hidden` — beberapa mikrodetik sebelum
 *    bingkai pertama sempat menggambar.
 *
 * 3. **Selektor di-`query` ulang tiap cuplikan** karena framer-motion melepas
 *    elemennya dari DOM begitu animasi keluarnya selesai.
 */
const recordMotion = (page, selector, ms, action) =>
  page.evaluate(`(async function () {
    const target = ${JSON.stringify(selector)};
    const samples = [];
    let stopped = false;

    const read = () => {
      const el = document.querySelector(target);
      if (!el) return false;
      const cs = getComputedStyle(el);
      samples.push({ opacity: Number(cs.opacity), transform: cs.transform });
      return true;
    };

    /**
     * Rekaman mikro-task pertama — gaya fase hidden yang sesungguhnya. Tanpa
     * ini animasi masuk selalu terbaca "sudah penuh", karena bingkai pertama
     * datang setelah transisinya dimulai.
     */
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node.nodeType !== 1) continue;
          const el = node.matches?.(target) ? node : node.querySelector?.(target);
          if (!el) continue;
          queueMicrotask(() => {
            const cs = getComputedStyle(el);
            samples.push({ opacity: Number(cs.opacity), transform: cs.transform });
          });
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    const loop = (async () => {
      const start = performance.now();
      while (!stopped && performance.now() - start < ${ms}) {
        if (!read() && samples.length > 0) break;
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
    })();

    ${action}

    await loop;
    stopped = true;
    observer.disconnect();
    return samples;
  })()`);

/**
 * Ringkas satu deret cuplikan menjadi bukti gerak.
 *
 * `partial` = ada cuplikan dengan opacity **di antara** 0 dan 1 — inilah yang
 * membuktikan elemennya memudar, bukan sekadar muncul.
 * `moved`   = ada transform selain `none`/`matrix(1,0,0,1,0,0)` — elemennya
 *             benar-benar bergerak, bukan hanya tembus pandang berubah.
 *
 * Deret kosong **tidak** dianggap lulus: elemen yang tidak pernah ditemukan
 * bukan elemen yang beranimasi, dan itulah bedanya "tidak ada opacity antara"
 * pada `prefers-reduced-motion` (yang memang diinginkan) dengan "tidak ada
 * sampel sama sekali" (yang berarti pengukurannya gagal).
 */
function motionEvidence(samples) {
  if (!Array.isArray(samples) || samples.length === 0) {
    return { count: 0, empty: true, partial: false, moved: false };
  }
  const opaque = samples.map((s) => s.opacity);
  return {
    count: samples.length,
    empty: false,
    partial: samples.some((s) => s.opacity > 0.001 && s.opacity < 0.999),
    moved: samples.some(
      (s) =>
        s.transform !== "none" &&
        s.transform !== "matrix(1, 0, 0, 1, 0, 0)" &&
        s.transform !== "",
    ),
    first: opaque[0],
    last: opaque[opaque.length - 1],
    min: Math.min(...opaque),
    max: Math.max(...opaque),
  };
}

const fmt = (evidence) =>
  evidence.empty
    ? "tidak ada sampel"
    : `n=${evidence.count} opacity ${evidence.min.toFixed(2)}→${evidence.max.toFixed(2)} ` +
      `(awal ${evidence.first.toFixed(2)}, akhir ${evidence.last.toFixed(2)}), ` +
      `transform:${evidence.moved ? "bergerak" : "diam"}`;

// ── Jalan ─────────────────────────────────────────────────────

const page = await launchEdge({
  port: 9334,
  profileDir: `${process.env.TEMP}\\psp-edge-fade-${Date.now()}`,
});

try {
  /**
   * Matikan "kurangi gerak" sebelum bagian animasi.
   *
   * Ini bukan penyetelan agar uji lolos: profil Edge di mesin ini memakai
   * `prefers-reduced-motion: reduce` (terbukti saat menyelidiki — animasi
   * masuk `Modal` tampak "tidak berjalan" padahal komponennya memang
   * **sengaja** melewatinya). Uji gerak harus dijalankan pada keadaan
   * sebaliknya, dan bagian 4 di bawah mengembalikan keadaan ini ke `reduce`
   * untuk memeriksa jalur itu.
   */
  await page.send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "no-preference" }],
  });

  // ── 1. Modal: hari libur ────────────────────────────────────
  console.log("\n=== 1. Modal — Tambah hari libur (masuk & keluar) ===");

  /**
   * Buktikan dulu bahwa "kurangi gerak" memang mati di sini. Tanpa ini,
   * kegagalan animasi masuk tidak bisa dibedakan antara komponen yang rusak
   * dan komponen yang **benar** menghormati permintaan pengguna — persis
   * kebingungan yang pernah menghabiskan satu sesi penyelidikan.
   */
  const motionSetting = await page.evaluate(
    `window.matchMedia("(prefers-reduced-motion: reduce)").matches`,
  );
  check(
    "gerak tidak dikurangi — animasi memang seharusnya berjalan",
    motionSetting === false,
    `prefers-reduced-motion: reduce = ${motionSetting}`,
  );
  await page.goto("/login", { baseUrl: BASE });
  await signIn(page, "admin", "snack123");

  await page.goto("/jadwal", { baseUrl: BASE });
  await page.waitFor(
    `[...document.querySelectorAll("button")].some((b) => b.textContent.includes("Hari libur"))`,
    "tombol Hari libur tampil",
  );

  check("modal tertutup saat halaman dibuka", !(await dialogOpen(page)));

  /**
   * Buka modal sambil merekam gerak panelnya.
   *
   * Yang direkam adalah **anak pertama** `[role="dialog"]` — kotak putihnya,
   * bukan latar gelapnya; latar gelap diuji terpisah di bagian 2.
   */
  const openSamples = await recordMotion(
    page,
    '[role="dialog"] > *:first-child',
    500,
    `[...document.querySelectorAll("button")]
      .find((b) => b.textContent.includes("Hari libur")).click();`,
  );

  const openEvidence = motionEvidence(openSamples);
  console.log(`  modal masuk: ${fmt(openEvidence)}`);
  check(
    "modal memudar masuk — ada opacity antara",
    openEvidence.partial,
    fmt(openEvidence),
  );
  check(
    "modal bergerak masuk — transform bukan matriks identitas",
    openEvidence.moved,
    fmt(openEvidence),
  );
  check(
    "modal berakhir sepenuhnya tampak",
    !openEvidence.empty && openEvidence.last > 0.99,
    fmt(openEvidence),
  );

  check("modal benar-benar terbuka", await dialogOpen(page));
  check(
    "judul modal benar",
    (await dialogText(page))?.includes("Tambah hari libur") ?? false,
  );

  await page.screenshot(`${SHOTS}\\popup-fade-01-modal-open.png`);

  // Tutup — framer-motion menulis gaya `exit` sebelum melepas elemennya.
  const closeSamples = await recordMotion(
    page,
    '[role="dialog"] > *:first-child',
    500,
    `document.querySelector('[role="dialog"]')
      .querySelector('button[aria-label="Tutup"]').click();`,
  );

  const closeEvidence = motionEvidence(closeSamples);
  console.log(`  modal keluar: ${fmt(closeEvidence)}`);
  check(
    "modal memudar keluar — ada opacity antara",
    closeEvidence.partial,
    fmt(closeEvidence),
  );
  check(
    "modal bergerak keluar — transform bukan matriks identitas",
    closeEvidence.moved,
    fmt(closeEvidence),
  );
  check(
    "modal tidak langsung lenyap — sempat beberapa bingkai",
    closeEvidence.count >= 4,
    `hanya ${closeEvidence.count} bingkai direkam`,
  );
  // Setelah animasi keluarnya selesai, AnimatePresence melepasnya dari DOM.
  await page.waitFor(
    `!document.querySelector('[role="dialog"]')`,
    "modal lepas dari DOM",
  );
  check("modal akhirnya lepas dari DOM", !(await dialogOpen(page)));

  // ── 2. ConfirmDialog (memakai Modal yang sama) ──────────────
  console.log("\n=== 2. ConfirmDialog — hapus menu (masuk & keluar) ===");
  await page.goto("/menu", { baseUrl: BASE });
  await page.waitFor(
    `document.querySelectorAll('button[title="Hapus"]').length > 0`,
    "tombol hapus menu tampil",
  );

  // Buka dialog hapus baris pertama lewat klik tombol aslinya.
  // Yang direkam latar gelapnya (`[role="dialog"]` itu sendiri) — panel putihnya
  // sudah diuji di bagian 1, dan keduanya memakai varian yang berbeda.
  const confirmOpen = await recordMotion(
    page,
    '[role="dialog"]',
    500,
    `document.querySelector('button[title="Hapus"]').click();`,
  );

  const confirmOpenEvidence = motionEvidence(confirmOpen);
  console.log(`  latar gelap masuk: ${fmt(confirmOpenEvidence)}`);
  check(
    "latar dialog memudar masuk",
    confirmOpenEvidence.partial,
    fmt(confirmOpenEvidence),
  );
  check("ConfirmDialog terbuka", await dialogOpen(page));
  check(
    "teks konfirmasi hapus tampil",
    (await dialogText(page))?.includes("Hapus") ?? false,
  );

  await page.screenshot(`${SHOTS}\\popup-fade-02-confirm-open.png`);

  // Batal — animasi keluar, dan tidak ada yang terhapus.
  const beforeCount = await page.evaluate(
    `document.querySelectorAll('button[title="Hapus"]').length`,
  );
  const confirmClose = await recordMotion(
    page,
    '[role="dialog"]',
    500,
    `[...document.querySelector('[role="dialog"]').querySelectorAll("button")]
      .find((b) => b.textContent.includes("Batal")).click();`,
  );

  const confirmCloseEvidence = motionEvidence(confirmClose);
  console.log(`  latar gelap keluar: ${fmt(confirmCloseEvidence)}`);
  check(
    "latar dialog memudar keluar",
    confirmCloseEvidence.partial,
    fmt(confirmCloseEvidence),
  );
  await page.waitFor(
    `!document.querySelector('[role="dialog"]')`,
    "ConfirmDialog lepas dari DOM",
  );
  check("ConfirmDialog tertutup setelah Batal", !(await dialogOpen(page)));
  check(
    "Batal tidak menghapus apa pun",
    (await page.evaluate(
      `document.querySelectorAll('button[title="Hapus"]').length`,
    )) === beforeCount,
  );

  // ── 3. Panel "Petugas kelas lain" (setangkup buka/tutup) ────
  console.log("\n=== 3. Panel Petugas kelas lain — setangkup buka/tutup ===");

  /**
   * Panel ini hanya muncul bila ada **kelas lain** yang jadwalnya terbit pada
   * tanggal yang sama — dan data semai hanya memuat September 2026, sedangkan
   * halaman ini menampilkan Oktober. Pemeriksaan yang melewatkan bagiannya
   * sendiri tidak membuktikan apa pun, jadi kondisinya dibuat lebih dulu lewat
   * API sebagai admin: satu pekan Oktober diisi untuk kelas 1, 2, dan 3, lalu
   * ketiganya diterbitkan.
   *
   * Publikasi **tidak bisa dibatalkan** (server menolak `unlock` untuk baris
   * terbit), jadi baris fixture ini sengaja dibiarkan dan dilaporkan di akhir —
   * bukan dihapus diam-diam.
   */
  const MONTH_INDEX = {
    Januari: 1, Februari: 2, Maret: 3, April: 4, Mei: 5, Juni: 6,
    Juli: 7, Agustus: 8, September: 9, Oktober: 10, November: 11, Desember: 12,
  };

  /** Bulan yang ditampilkan halaman — dibaca, bukan ditulis tetap. */
  const readShownMonth = () =>
    page.evaluate(`(function () {
      const match = document.body.innerText.match(
        /(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\\s+(\\d{4})/,
      );
      return match ? { name: match[1], year: Number(match[2]) } : null;
    })()`);

  // Masuk sebagai orang tua kelas 1 dulu — halaman ini memang milik mereka, dan
  // bulan yang tampil di sini yang menentukan pekan mana yang perlu diisi.
  await page.goto("/login", { baseUrl: BASE });
  await signIn(page, "sari", "snack123");
  await page.goto("/pilih-jadwal", { baseUrl: BASE });
  await page.waitFor(
    `/(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\\s+\\d{4}/.test(document.body.innerText)`,
    "halaman pilih-jadwal termuat",
  );

  const shownMonth = await readShownMonth();
  const monthYear = shownMonth?.year ?? new Date().getFullYear();
  const monthIndex = MONTH_INDEX[shownMonth?.name] ?? new Date().getMonth() + 1;
  console.log(`  bulan yang tampil: ${shownMonth?.name} ${monthYear}`);

  /**
   * Senin pertama bulan itu — dihitung dengan `Date` UTC supaya tidak bergeser
   * oleh zona waktu mesin yang menjalankannya.
   */
  function firstMonday(year, month) {
    const date = new Date(Date.UTC(year, month - 1, 1));
    while (date.getUTCDay() !== 1) date.setUTCDate(date.getUTCDate() + 1);
    return date;
  }

  /** Teks impor untuk satu pekan: blok rentang tanggal + baris "Hari : menu". */
  function weekImportText(year, month, weekOffset) {
    const monday = firstMonday(year, month);
    monday.setUTCDate(monday.getUTCDate() + weekOffset * 7);
    const friday = new Date(monday);
    friday.setUTCDate(friday.getUTCDate() + 4);

    const iso = (date) => date.toISOString().slice(0, 10);
    const dayName = (date) =>
      ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][
        date.getUTCDay()
      ];

    const lines = [`${monday.getUTCDate()} - ${friday.getUTCDate()} ${shownMonth.name} ${year}`];
    for (let index = 0; index < 5; index++) {
      const date = new Date(monday);
      date.setUTCDate(date.getUTCDate() + index);
      lines.push(`${dayName(date).padEnd(7)} : Puding Roti + jeruk`);
    }
    return { text: lines.join("\n"), from: iso(monday), to: iso(friday) };
  }

  const week = weekImportText(monthYear, monthIndex, 0);
  console.log(`  pekan fixture: ${week.from} … ${week.to}`);

  /** Isi pekan itu untuk kelas 1–3, lalu terbitkan kelas 2 & 3 saja. */
  async function seedNeighbourClasses() {
    await page.goto("/login", { baseUrl: BASE });
    await signIn(page, "admin", "snack123");

    for (const className of ["1", "2", "3"]) {
      const imported = await api(page, "/api/schedules/import", {
        method: "POST",
        body: { text: week.text, classNames: [className] },
      });
      console.log(
        `  impor kelas ${className}: ${imported.status} ${imported.json?.message ?? ""}`,
      );
    }

    /**
     * Ketiga kelas diterbitkan — termasuk kelas 1.
     *
     * Kelas 1 ikut diterbitkan bukan karena panelnya diuji (panel itu justru
     * menampilkan kelas **lain**), melainkan karena halaman `/pilih-jadwal`
     * hanya menggambar kartu tanggal yang punya jadwal terbit **milik kelas
     * pengguna**. Tanpa kelas 1 terbit, sari tidak melihat kartu Oktober sama
     * sekali, sehingga tombol panelnya tidak pernah ada untuk diklik.
     */
    for (const className of ["1", "2", "3"]) {
      // Dua langkah, sesuai alur di server: draft → terkunci → terbit.
      const locked = await api(page, "/api/schedules/lock", {
        method: "POST",
        body: { fromDate: week.from, toDate: week.to, className },
      });
      console.log(
        `  kunci kelas ${className}: ${locked.status} ${locked.json?.message ?? ""}`,
      );

      const result = await api(page, "/api/schedules/publish", {
        method: "POST",
        body: { year: monthYear, month: monthIndex, className },
      });
      console.log(
        `  publikasi kelas ${className}: ${result.status} ${result.json?.message ?? ""}`,
      );
    }
  }

  await seedNeighbourClasses();

  await page.goto("/login", { baseUrl: BASE });
  await signIn(page, "sari", "snack123");
  await page.goto("/pilih-jadwal", { baseUrl: BASE });
  await page.waitFor(
    `[...document.querySelectorAll("button")]
      .some((b) => b.textContent.includes("Petugas kelas lain"))
      || document.body.innerText.includes("Belum ada jadwal")`,
    "halaman pilih-jadwal termuat",
  );

  const toggleExists = await page.evaluate(
    `[...document.querySelectorAll("button")]
      .some((b) => b.textContent.includes("Petugas kelas lain"))`,
  );

  if (!toggleExists) {
    console.log("  (dilewati — tidak ada tanggal dengan kelas lain yang terbit)");
    check("panel Petugas kelas lain tersedia untuk diuji", false,
      "tidak ada kartu dengan kelas lain terbit");
  } else {
    // Id panel stabil sebelum dibuka (dari `useId`), jadi bisa dibaca lebih dulu —
    // dan `aria-controls` sudah menunjuknya walau panelnya belum ada di DOM.
    const panelId = await page.evaluate(
      `[...document.querySelectorAll("button")]
        .find((b) => b.textContent.includes("Petugas kelas lain"))
        .getAttribute("aria-controls")`,
    );
    check("panel punya id yang ditunjuk aria-controls", Boolean(panelId));

    // Buka sambil merekam tinggi panelnya — setangkup buka harus beranimasi,
    // bukan melompat dari 0 ke tinggi penuh dalam satu bingkai.
    const growSamples = await page.evaluate(`(async function () {
      const toggle = [...document.querySelectorAll("button")]
        .find((b) => b.textContent.includes("Petugas kelas lain"));
      const heights = [];
      const recorder = (async () => {
        const start = performance.now();
        while (performance.now() - start < 500) {
          const panel = document.getElementById(${JSON.stringify(panelId)});
          if (panel) heights.push(panel.getBoundingClientRect().height);
          await new Promise((resolve) => requestAnimationFrame(resolve));
        }
        return heights;
      })();
      toggle.click();
      return recorder;
    })()`);

    const nonZero = growSamples.filter((h) => h > 0);
    const distinct = new Set(nonZero.map((h) => Math.round(h)));
    console.log(
      `  tinggi panel saat membuka: ${nonZero.length} bingkai, ` +
        `${distinct.size} nilai berbeda (${[...distinct].slice(0, 6).join(", ")}…)`,
    );
    check("panel akhirnya punya tinggi", nonZero.length > 0);
    check(
      "tingginya bertumbuh bertahap — bukan lompat sekali",
      distinct.size >= 3,
      `hanya ${distinct.size} tinggi berbeda: ${[...distinct].join(", ")}`,
    );

    await page.waitFor(
      `document.getElementById(${JSON.stringify(panelId)}) !== null`,
      "panel terbuka",
    );

    const panelGrew = await page.evaluate(`(function () {
      const panel = document.getElementById(${JSON.stringify(panelId)});
      if (!panel) return null;
      const cs = getComputedStyle(panel);
      return {
        height: panel.getBoundingClientRect().height,
        overflow: cs.overflowY,
        rows: panel.querySelectorAll("li").length,
      };
    })()`);
    console.log(`  panel terbuka: ${JSON.stringify(panelGrew)}`);
    check("panel berisi baris kelas", (panelGrew?.rows ?? 0) > 0);

    // Tutup — panel harus masih terpasang sesaat, lalu hilang.
    const closeFrames = await page.evaluate(`(async function () {
      const toggle = [...document.querySelectorAll("button")]
        .find((b) => b.textContent.includes("Petugas kelas lain"));
      let framesWithPanel = 0;
      const recorder = (async () => {
        const start = performance.now();
        while (performance.now() - start < 500) {
          if (document.getElementById(${JSON.stringify(panelId)})) framesWithPanel++;
          await new Promise((resolve) => requestAnimationFrame(resolve));
        }
        return framesWithPanel;
      })();
      toggle.click();
      return recorder;
    })()`);
    console.log(`  bingkai panel masih terpasang saat menutup: ${closeFrames}`);
    check(
      "panel tidak lenyap seketika — sempat beberapa bingkai saat menutup",
      closeFrames >= 4,
      `hanya ${closeFrames} bingkai`,
    );
    check(
      "panel akhirnya lepas dari DOM",
      (await page.evaluate(
        `document.getElementById(${JSON.stringify(panelId)}) === null`,
      )) === true,
    );
  }

  // ── 4. prefers-reduced-motion: halaman tetap tampil ─────────
  console.log("\n=== 4. prefers-reduced-motion — tanpa animasi, isi tetap tampil ===");
  await page.send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });

  /**
   * Masuk kembali sebagai admin — bagian 3 meninggalkan sesi orang tua, dan
   * `/jadwal` menolak aksesnya. Tanpa ini halaman yang ditunggu tidak akan
   * pernah muncul, dan kegagalannya terbaca seolah animasinya yang salah.
   */
  await page.goto("/login", { baseUrl: BASE });
  await signIn(page, "admin", "snack123");

  await page.goto("/jadwal", { baseUrl: BASE });
  await page.waitFor(
    `[...document.querySelectorAll("button")].some((b) => b.textContent.includes("Hari libur"))`,
    "halaman jadwal tampil dengan gerak dikurangi",
  );

  const reducedOpen = await recordMotion(
    page,
    '[role="dialog"]',
    400,
    `[...document.querySelectorAll("button")]
      .find((b) => b.textContent.includes("Hari libur")).click();`,
  );
  const reducedEvidence = motionEvidence(reducedOpen);
  console.log(`  opacity latar (reduced): ${fmt(reducedEvidence)}`);
  check("tanpa gerak: dialog tetap terukur", !reducedEvidence.empty, fmt(reducedEvidence));
  check(
    "tanpa gerak: tidak ada opacity antara — langsung penuh",
    !reducedEvidence.partial,
    fmt(reducedEvidence),
  );
  check(
    "tanpa gerak: tetap terbaca penuh",
    !reducedEvidence.empty && reducedEvidence.last > 0.99,
    fmt(reducedEvidence),
  );

  await page.waitFor(`Boolean(document.querySelector('[role="dialog"]'))`, "modal terbuka");
  const reducedText = await dialogText(page);
  check(
    "modal tetap terbuka & berisi saat gerak dikurangi",
    reducedText?.includes("Tambah hari libur") ?? false,
  );

  await page.screenshot(`${SHOTS}\\popup-fade-03-reduced-motion.png`);
  await page.send("Emulation.setEmulatedMedia", { features: [] });

  // ── 5. Tanpa galat konsol di seluruh alur ───────────────────
  console.log("\n=== 5. Konsol ===");
  const errors = page.errors.filter(
    (line) => !/favicon|DevTools|Download the React DevTools/i.test(line),
  );
  check("tidak ada galat konsol", errors.length === 0, errors.join(" | "));
  if (errors.length > 0) console.log("  errors:", errors);

  console.log(`\n=== ${pass} lulus, ${fail} gagal ===`);
  if (fail > 0) process.exitCode = 1;
} finally {
  await page.close();
}
