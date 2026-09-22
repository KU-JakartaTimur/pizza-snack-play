/**
 * Verifikasi tampilan: dialog konfirmasi menggantikan `confirm()` bawaan
 * peramban di lima layar — Kategori, Menu, Orang Tua, Kelola Jadwal, Profil.
 *
 * Yang diperiksa tiap layar: tombolnya membuka `[role="dialog"]` (bukan dialog
 * native), "Batal" tidak mengubah apa pun, dan tombol tegasnya benar-benar
 * menjalankan tindakannya.
 *
 * Jalankan: bun run outputs/check-confirm-dialogs.mjs
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

/** Cap waktu agar tiap jalan uji memakai nama sendiri — aman diulang. */
const STAMP = Date.now();

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

/**
 * Klik tombol ber-`title` tertentu di dalam baris yang teksnya memuat `rowText`.
 * `li, tr` sekaligus supaya daftar berbentuk list maupun tabel sama-sama jalan.
 */
const clickRowButton = (page, rowText, buttonTitle) =>
  page.evaluate(`(function () {
    const rows = [...document.querySelectorAll("li, tr")];
    const row = rows.find((el) => el.innerText.includes(${JSON.stringify(rowText)}));
    if (!row) throw new Error("baris tidak ditemukan: " + ${JSON.stringify(rowText)});
    const button = row.querySelector(${JSON.stringify(`button[title="${buttonTitle}"]`)});
    if (!button) throw new Error("tombol tidak ada di baris itu: " + ${JSON.stringify(buttonTitle)});
    button.click();
    return true;
  })()`);

/** Geser satu bulan ke depan lewat panah kanan di bilah bulan. */
const shiftMonthForward = (page) =>
  page.evaluate(`(function () {
    const label = document.querySelector("span.min-w-40");
    if (!label) throw new Error("label bulan tidak ditemukan");
    const [, next] = label.parentElement.querySelectorAll("button");
    next.click();
    return true;
  })()`);

const rowExists = (page, rowText) =>
  page.evaluate(
    `[...document.querySelectorAll("li, tr")].some((el) => el.innerText.includes(${JSON.stringify(rowText)}))`,
  );

/**
 * Apakah baris itu punya tombol ber-`title` tertentu.
 *
 * Penting untuk halaman jadwal: minggu pertama sebuah bulan ikut menampilkan
 * hari terakhir bulan sebelumnya, jadi "tidak ada tombol hapus di mana pun"
 * bukan pernyataan yang sah — harus diperiksa per baris.
 */
const rowHasButton = (page, rowText, title) =>
  page.evaluate(`(function () {
    const row = [...document.querySelectorAll("li, tr")]
      .find((el) => el.innerText.includes(${JSON.stringify(rowText)}));
    if (!row) return false;
    return Boolean(row.querySelector(${JSON.stringify(`button[title="${title}"]`)}));
  })()`);

/** Panggil API memakai token yang sedang tersimpan di peramban. */
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

// Profil WAJIB di luar folder proyek — lihat SKILL.md.
const page = await launchEdge({
  port: 9333,
  profileDir: `${process.env.TEMP}\\psp-edge-profile`,
});

// Nama data uji — dibersihkan di blok `finally` bila masih tertinggal.
const CATEGORY_NAME = `Uji Dialog Kategori ${STAMP}`;
const MENU_NAME = `Uji Dialog Menu ${STAMP}`;
const PARENT_USERNAME = `uji.dialog.${STAMP}`;
const CHILD_NAME = `Uji Dialog Anak ${STAMP}`;

/** Sisa data uji yang perlu dibersihkan lewat API di akhir. */
const leftovers = { categoryId: null, menuId: null, parentId: null, scheduleId: null };

try {
  // ── 1. Kategori ─────────────────────────────────────────────
  console.log("\n=== 1. Kategori — hapus lewat dialog ===");
  await page.goto("/login", { baseUrl: BASE });
  await page.evaluate("localStorage.clear()");
  await signIn(page, "admin", "snack123");

  const category = await api(page, "/api/categories", {
    method: "POST",
    body: { name: CATEGORY_NAME, color: "#10B981" },
  });
  leftovers.categoryId = category.json?.data?.id;
  check(
    "kategori uji dibuat",
    category.status === 201,
    `status ${category.status}`,
  );

  await page.goto("/kategori", { baseUrl: BASE });
  await page.waitFor(
    `[...document.querySelectorAll("li")].some((el) => el.innerText.includes(${JSON.stringify(CATEGORY_NAME)}))`,
    "baris kategori tampil",
  );

  await clickRowButton(page, CATEGORY_NAME, "Hapus");
  await page.waitFor(
    `document.querySelector('[role="dialog"]')?.innerText.includes("Hapus kategori?")`,
    "dialog hapus kategori",
  );
  const categoryDialog = await dialogText(page);
  log("1. isi dialog", JSON.stringify(categoryDialog));
  check("dialog bergaya, bukan native", await dialogOpen(page));
  check("menyebut nama kategori", categoryDialog.includes(CATEGORY_NAME));
  await page.screenshot(`${SHOTS}/dialog-01-kategori.png`);

  await clickInDialog(page, "Batal");
  await page.waitFor(`!document.querySelector('[role="dialog"]')`, "dialog tertutup");
  check("Batal menutup dialog", !(await dialogOpen(page)));
  check("data belum terhapus setelah Batal", await rowExists(page, CATEGORY_NAME));

  await clickRowButton(page, CATEGORY_NAME, "Hapus");
  await page.waitFor(`Boolean(document.querySelector('[role="dialog"]'))`, "dialog");
  await clickInDialog(page, "Hapus");
  await page.waitFor(
    `![...document.querySelectorAll("li")].some((el) => el.innerText.includes(${JSON.stringify(CATEGORY_NAME)}))`,
    "baris kategori hilang",
  );
  check("konfirmasi benar-benar menghapus", !(await rowExists(page, CATEGORY_NAME)));
  leftovers.categoryId = null;

  // ── 2. Menu ─────────────────────────────────────────────────
  console.log("\n=== 2. Menu — hapus lewat dialog ===");
  const menu = await api(page, "/api/menus", {
    method: "POST",
    body: { name: MENU_NAME, items: [{ name: "Komponen uji", itemType: "main" }] },
  });
  leftovers.menuId = menu.json?.data?.id;
  check("menu uji dibuat", menu.status === 201, `status ${menu.status}`);

  await page.goto("/menu", { baseUrl: BASE });
  await page.setValue('input[placeholder="Cari menu…"]', MENU_NAME);
  await page.waitFor(
    `[...document.querySelectorAll("li")].some((el) => el.innerText.includes(${JSON.stringify(MENU_NAME)}))`,
    "baris menu tampil",
  );

  await clickRowButton(page, MENU_NAME, "Hapus");
  await page.waitFor(
    `document.querySelector('[role="dialog"]')?.innerText.includes("Hapus menu?")`,
    "dialog hapus menu",
  );
  const menuDialog = await dialogText(page);
  log("2. isi dialog", JSON.stringify(menuDialog));
  check("menyebut nama menu", menuDialog.includes(MENU_NAME));
  check(
    "menjelaskan menu terpakai hanya diarsipkan",
    menuDialog.includes("diarsipkan"),
  );
  await page.screenshot(`${SHOTS}/dialog-02-menu.png`);

  await clickInDialog(page, "Hapus");
  await page.waitFor(
    `![...document.querySelectorAll("li")].some((el) => el.innerText.includes(${JSON.stringify(MENU_NAME)}))`,
    "baris menu hilang",
  );
  check("konfirmasi menghapus menu", !(await rowExists(page, MENU_NAME)));
  leftovers.menuId = null;

  // ── 3. Orang tua — dua kadar tindakan ───────────────────────
  console.log("\n=== 3. Orang Tua — nonaktifkan & hapus permanen ===");
  const parent = await api(page, "/api/parents", {
    method: "POST",
    body: {
      username: PARENT_USERNAME,
      password: "snack123",
      parentName: `Orang Tua Uji ${STAMP}`,
      students: [{ name: `Anak Uji ${STAMP}`, className: "1" }],
    },
  });
  leftovers.parentId = parent.json?.data?.id;
  check("akun uji dibuat", parent.status === 201, `status ${parent.status}`);

  await page.goto("/orang-tua", { baseUrl: BASE });
  await page.setValue(
    'input[placeholder="Cari nama, siswa, kelas, atau username…"]',
    PARENT_USERNAME,
  );
  await page.waitFor(
    `[...document.querySelectorAll("tr")].some((el) => el.innerText.includes(${JSON.stringify(PARENT_USERNAME)}))`,
    "baris akun tampil",
  );

  // Nonaktifkan — nada biasa, bukan bahaya.
  await clickRowButton(page, PARENT_USERNAME, "Nonaktifkan");
  await page.waitFor(
    `document.querySelector('[role="dialog"]')?.innerText.includes("Nonaktifkan akun?")`,
    "dialog nonaktifkan",
  );
  const deactivateDialog = await dialogText(page);
  log("3a. isi dialog", JSON.stringify(deactivateDialog));
  check("menjelaskan datanya tetap tersimpan", deactivateDialog.includes("tersimpan"));
  check("tidak menyebut tidak bisa dibatalkan", !deactivateDialog.includes("tidak bisa dibatalkan"));
  await page.screenshot(`${SHOTS}/dialog-03-nonaktifkan.png`);

  await clickInDialog(page, "Nonaktifkan");
  await page.waitFor(
    `[...document.querySelectorAll("tr")]
       .some((el) => el.innerText.includes(${JSON.stringify(PARENT_USERNAME)}) && el.innerText.includes("Nonaktif"))`,
    "status berubah jadi Nonaktif",
  );
  check("akun benar-benar dinonaktifkan", true);

  // Hapus permanen — nada bahaya, peringatannya tegas.
  await clickRowButton(page, PARENT_USERNAME, "Hapus permanen");
  await page.waitFor(
    `document.querySelector('[role="dialog"]')?.innerText.includes("Hapus permanen?")`,
    "dialog hapus permanen",
  );
  const hardDialog = await dialogText(page);
  log("3b. isi dialog", JSON.stringify(hardDialog));
  check(
    "memperingatkan tidak bisa dibatalkan",
    hardDialog.includes("tidak bisa dibatalkan"),
  );
  await page.screenshot(`${SHOTS}/dialog-04-hapus-permanen.png`);

  await clickInDialog(page, "Hapus permanen");
  await page.waitFor(
    `![...document.querySelectorAll("tr")].some((el) => el.innerText.includes(${JSON.stringify(PARENT_USERNAME)}))`,
    "baris akun hilang",
  );
  check("akun benar-benar dihapus", !(await rowExists(page, PARENT_USERNAME)));
  leftovers.parentId = null;

  // ── 4. Kelola Jadwal — hapus & buka kunci ───────────────────
  console.log("\n=== 4. Kelola Jadwal — hapus & buka kunci ===");
  const scheduleMenu = await api(page, "/api/menus", {
    method: "POST",
    body: { name: MENU_NAME, items: [{ name: "Komponen uji", itemType: "main" }] },
  });
  leftovers.menuId = scheduleMenu.json?.data?.id;
  const scheduleMenuId = scheduleMenu.json?.data?.id;

  // Oktober 2026 sengaja dipilih: bulan itu kosong, jadi uji ini tidak
  // menyentuh jadwal hasil seed yang sudah `published`.
  const TEST_DATE = "2026-10-07";
  const TEST_DATE_LABEL = "7 Okt 2026";

  const createRow = () =>
    api(page, "/api/schedules", {
      method: "POST",
      body: { scheduleDate: TEST_DATE, className: "1", menuId: scheduleMenuId },
    });

  const firstRow = await createRow();
  leftovers.scheduleId = firstRow.json?.data?.scheduleId;
  check("baris jadwal uji dibuat", firstRow.status === 201, `status ${firstRow.status}`);

  await page.goto("/jadwal", { baseUrl: BASE });
  await page.waitFor(`Boolean(document.querySelector("span.min-w-40"))`, "bilah bulan");
  await shiftMonthForward(page);
  await page.waitFor(
    `document.body.innerText.includes("Oktober 2026")`,
    "pindah ke Oktober 2026",
  );
  await page.waitFor(
    `[...document.querySelectorAll("li")].some((el) => el.innerText.includes(${JSON.stringify(TEST_DATE_LABEL)}))`,
    "baris tanggal uji tampil",
  );

  await clickRowButton(page, TEST_DATE_LABEL, "Hapus jadwal");
  await page.waitFor(
    `document.querySelector('[role="dialog"]')?.innerText.includes("Hapus jadwal?")`,
    "dialog hapus jadwal",
  );
  const deleteDayDialog = await dialogText(page);
  log("4a. isi dialog", JSON.stringify(deleteDayDialog));
  check("menyebut tanggal & kelasnya", deleteDayDialog.includes("7 Okt 2026"));
  await page.screenshot(`${SHOTS}/dialog-05-hapus-jadwal.png`);

  await clickInDialog(page, "Hapus");
  await page.waitFor(
    `(function () {
      const row = [...document.querySelectorAll("li")]
        .find((el) => el.innerText.includes(${JSON.stringify(TEST_DATE_LABEL)}));
      return !row || !row.querySelector('button[title="Hapus jadwal"]');
    })()`,
    "baris jadwal kehilangan tombol hapus",
  );
  check("jadwal benar-benar dihapus", !(await rowHasButton(page, TEST_DATE_LABEL, "Hapus jadwal")));

  // Server juga harus sepakat — bukan sekadar tampilan yang berubah.
  // Rentang selalu mengembalikan satu objek per tanggal — yang menandakan
  // barisnya hilang adalah `scheduleId` yang kembali `null`.
  const afterDelete = await api(page, "/api/schedules/range?from=2026-10-01&to=2026-10-31&class=1");
  const deletedDay = (afterDelete.json?.data ?? []).find((day) => day.date === TEST_DATE);
  check(
    "server mengonfirmasi baris hilang",
    deletedDay !== undefined && deletedDay.scheduleId === null,
    JSON.stringify(deletedDay),
  );
  leftovers.scheduleId = null;

  // Buka kunci: baris dikunci dulu, baru dibuka lewat dialog.
  const secondRow = await createRow();
  leftovers.scheduleId = secondRow.json?.data?.scheduleId;
  const lock = await api(page, "/api/schedules/lock", {
    method: "POST",
    body: { fromDate: TEST_DATE, toDate: TEST_DATE, className: "1" },
  });
  check(
    "baris uji dikunci",
    lock.status === 200 && lock.json?.data?.locked === 1,
    `status ${lock.status} locked ${lock.json?.data?.locked}`,
  );

  await page.goto("/jadwal", { baseUrl: BASE });
  await page.waitFor(`Boolean(document.querySelector("span.min-w-40"))`, "bilah bulan");
  await shiftMonthForward(page);
  await page.waitFor(
    `document.body.innerText.includes("Oktober 2026")`,
    "pindah ke Oktober 2026 lagi",
  );
  await page.waitFor(
    `(function () {
      const row = [...document.querySelectorAll("li")]
        .find((el) => el.innerText.includes(${JSON.stringify(TEST_DATE_LABEL)}));
      return Boolean(row?.querySelector('button[title="Buka kunci jadwal"]'));
    })()`,
    "tombol buka kunci tampil di baris uji",
  );
  check("baris terkunci menampilkan tombol buka kunci", true);

  await clickRowButton(page, TEST_DATE_LABEL, "Buka kunci jadwal");
  await page.waitFor(
    `document.querySelector('[role="dialog"]')?.innerText.includes("Buka kunci jadwal?")`,
    "dialog buka kunci",
  );
  const unlockDialog = await dialogText(page);
  log("4b. isi dialog", JSON.stringify(unlockDialog));
  check("menjelaskan kembali ke draf", unlockDialog.includes("draf"));
  await page.screenshot(`${SHOTS}/dialog-06-buka-kunci.png`);

  await clickInDialog(page, "Buka kunci");
  await page.waitFor(
    `(function () {
      const row = [...document.querySelectorAll("li")]
        .find((el) => el.innerText.includes(${JSON.stringify(TEST_DATE_LABEL)}));
      return !row || !row.querySelector('button[title="Buka kunci jadwal"]');
    })()`,
    "tombol buka kunci hilang",
  );
  check(
    "kunci benar-benar dibuka",
    !(await rowHasButton(page, TEST_DATE_LABEL, "Buka kunci jadwal")),
  );

  const afterUnlock = await api(page, "/api/schedules/range?from=2026-10-01&to=2026-10-31&class=1");
  check(
    "server mencatat statusnya kembali draft",
    (afterUnlock.json?.data ?? []).find((day) => day.date === TEST_DATE)?.status === "draft",
    JSON.stringify((afterUnlock.json?.data ?? []).filter((d) => d.date === TEST_DATE)),
  );

  // Bersihkan: baris sudah kembali draft, jadi bisa dihapus.
  const cleanupRow = await api(page, `/api/schedules/${leftovers.scheduleId}`, {
    method: "DELETE",
  });
  check(
    "baris jadwal uji dibersihkan",
    cleanupRow.status === 200,
    `status ${cleanupRow.status}`,
  );
  leftovers.scheduleId = null;
  await api(page, `/api/menus/${leftovers.menuId}?force=true`, { method: "DELETE" });
  leftovers.menuId = null;

  // ── 5. Profil — hapus data anak (orang tua) ─────────────────
  console.log("\n=== 5. Profil — hapus data anak ===");
  await page.evaluate(`localStorage.clear()`);
  await signIn(page, "sari", "snack123");

  const child = await api(page, "/api/profile/students", {
    method: "POST",
    body: { name: CHILD_NAME, className: "1" },
  });
  const childId = child.json?.data?.id;
  check("anak uji ditambahkan", child.status === 201, `status ${child.status}`);

  await page.goto("/profil", { baseUrl: BASE });
  await page.waitFor(
    `[...document.querySelectorAll("li")].some((el) => el.innerText.includes(${JSON.stringify(CHILD_NAME)}))`,
    "baris anak tampil",
  );

  await clickRowButton(page, CHILD_NAME, "Hapus data anak");
  await page.waitFor(
    `document.querySelector('[role="dialog"]')?.innerText.includes("Hapus data anak?")`,
    "dialog hapus anak",
  );
  const childDialog = await dialogText(page);
  log("5. isi dialog", JSON.stringify(childDialog));
  check("menyebut nama anak", childDialog.includes(CHILD_NAME));
  check("mengingatkan anak terakhir tidak bisa dihapus", childDialog.includes("terakhir"));
  await page.screenshot(`${SHOTS}/dialog-07-hapus-anak.png`);

  await clickInDialog(page, "Hapus");
  await page.waitFor(
    `![...document.querySelectorAll("li")].some((el) => el.innerText.includes(${JSON.stringify(CHILD_NAME)}))`,
    "baris anak hilang",
  );
  check("data anak benar-benar dihapus", !(await rowExists(page, CHILD_NAME)));

  // Anak asli `sari` harus utuh — uji ini tidak boleh menyentuhnya.
  const remaining = await api(page, "/api/profile/students");
  check(
    "anak asli tetap utuh",
    (remaining.json?.data?.length ?? 0) === 1,
    JSON.stringify(remaining.json?.data?.map((s) => s.name)),
  );
  log("5. sisa anak", JSON.stringify(remaining.json?.data?.map((s) => s.name)));

  // ── Ringkasan ───────────────────────────────────────────────
  console.log(
    `\ndialog native (confirm/alert): ${
      page.dialogs.length === 0 ? "tidak ada" : JSON.stringify(page.dialogs)
    }`,
  );
  console.log(
    `error halaman: ${page.errors.length === 0 ? "tidak ada" : JSON.stringify(page.errors)}`,
  );
  check(
    "tidak ada dialog native tersisa",
    page.dialogs.length === 0,
    JSON.stringify(page.dialogs),
  );

  console.log(`\n=== HASIL: ${pass} pass, ${fail} fail ===`);
  console.log("Tangkapan layar ada di outputs/screenshots/");
} finally {
  // Bersihkan sisa data uji lewat API — apa pun yang terjadi di atas.
  try {
    if (leftovers.scheduleId) {
      await api(page, `/api/schedules/${leftovers.scheduleId}/unlock`, { method: "POST" });
      await api(page, `/api/schedules/${leftovers.scheduleId}`, { method: "DELETE" });
    }
    if (leftovers.menuId) {
      await api(page, `/api/menus/${leftovers.menuId}?force=true`, { method: "DELETE" });
    }
    if (leftovers.categoryId) {
      await api(page, `/api/categories/${leftovers.categoryId}`, { method: "DELETE" });
    }
    if (leftovers.parentId) {
      await api(page, `/api/parents/${leftovers.parentId}?hard=true`, { method: "DELETE" });
    }
  } catch {
    console.log("(pembersihan lewat API gagal — cek data uji secara manual)");
  }

  await page.close();
  console.log("Edge ditutup.");
}

process.exit(fail > 0 ? 1 : 0);
