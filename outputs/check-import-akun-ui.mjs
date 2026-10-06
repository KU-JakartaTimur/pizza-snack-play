/**
 * Verifikasi tampilan: impor akun orang tua dari berkas Excel.
 *
 * Yang dibuktikan di peramban sungguhan:
 *   - admin melihat tombol "Impor Excel"; korlas tidak (halaman admin-only);
 *   - berkas yang **bukan** Excel memunculkan pesan dari server, bukan
 *     gagal diam-diam;
 *   - berkas hasil ekspor sendiri membuka **pratinjau** lebih dulu — berapa
 *     baris ditimpa dan berapa dilewati — sebelum apa pun ditulis;
 *   - menekan "Terapkan" benar-benar menjalankan impor dan menampilkan
 *     ringkasan hasilnya;
 *   - halaman tidak error dan tidak memunculkan dialog bawaan peramban.
 *
 * Berkas ujinya adalah **hasil ekspor sungguhan** dari server, diambil lewat
 * sesi admin di halaman itu sendiri — jadi sekaligus membuktikan bahwa
 * unduhannya membawa token yang benar. Menerapkannya tidak mengubah data:
 * isinya sama persis dengan yang ada di database.
 *
 * Jalankan: bun run outputs/check-import-akun-ui.mjs
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
const { launchEdge, tmpProfile } = await import(cdpPath);

const BASE = "http://localhost:5173";
const SHOTS = "D:\\REACT-DEV\\pizza-snack-play\\outputs\\screenshots";
const UPLOADS = "D:\\REACT-DEV\\pizza-snack-play\\outputs\\exports\\impor";

if (!fs.existsSync(SHOTS)) fs.mkdirSync(SHOTS, { recursive: true });
fs.rmSync(UPLOADS, { recursive: true, force: true });
fs.mkdirSync(UPLOADS, { recursive: true });

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

// ── Penggerak browser ─────────────────────────────────────────

const importButton = (page) =>
  page.evaluate(
    `Boolean([...document.querySelectorAll("button")]
       .find((item) => item.textContent.includes("Impor Excel")))`,
  );

/** Isi `<input type=file>` dengan berkas nyata, lalu picu perubahannya. */
async function uploadFile(page, filePath) {
  const { root } = await page.send("DOM.getDocument", { depth: -1 });
  const { nodeId } = await page.send("DOM.querySelector", {
    nodeId: root.nodeId,
    selector: 'input[type="file"]',
  });
  if (!nodeId) throw new Error("input file tidak ditemukan");
  await page.send("DOM.setFileInputFiles", { nodeId, files: [filePath] });
}

const dialogText = (page) =>
  page.evaluate(
    `(document.querySelector('[role="dialog"]')?.innerText ?? "").replace(/\\s+/g, " ").trim()`,
  );

const hasDialog = (page) =>
  page.evaluate(`Boolean(document.querySelector('[role="dialog"]'))`);

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

/**
 * Unduh berkas ekspor lewat **sesi di halaman itu sendiri**, bukan lewat
 * `fetch` milik Bun.
 *
 * Dua alasan. Pertama, `fetch` Bun dari skrip ini mengembalikan `404` kosong
 * begitu penggerak browser menghapus `HTTP_PROXY` dari lingkungan — jebakan
 * yang menyesatkan karena tampak seperti server yang mati, padahal bukan.
 * Kedua, permintaan dari halaman membawa token sungguhan dari `localStorage`,
 * jadi unduhannya sekaligus membuktikan alur otentikasinya.
 */
async function writeExportFixture(page) {
  const base64 = await page.evaluate(`fetch("/api/parents/export", {
    headers: { Authorization: "Bearer " + localStorage.getItem("psp_token") },
  })
    .then((response) => {
      if (!response.ok) throw new Error("ekspor gagal: " + response.status);
      return response.arrayBuffer();
    })
    .then((buffer) => {
      const bytes = new Uint8Array(buffer);
      let binary = "";
      for (let index = 0; index < bytes.length; index += 0x8000) {
        binary += String.fromCharCode.apply(null, bytes.subarray(index, index + 0x8000));
      }
      return btoa(binary);
    })`);

  const file = `${UPLOADS}\\akun-ekspor.xlsx`;
  fs.writeFileSync(file, Buffer.from(base64, "base64"));
  return file;
}

// Profil WAJIB di luar folder proyek — lihat SKILL.md. Namanya dibuat unik
// per jalan: kalau profil yang sama masih dipegang proses Edge lain, Edge baru
// hanya "menempel" ke proses itu dan tidak pernah membuka port debug-nya.
const page = await launchEdge({
  port: 9336,
  profileDir: tmpProfile(`psp-edge-impor-${Date.now()}`),
  startupTimeoutMs: 45000,
});

try {
  // ── 1. Admin ────────────────────────────────────────────────
  console.log("\n=== 1. Admin · tombol impor ===");
  await loginAs(page, "admin");
  await page.goto("/orang-tua", { baseUrl: BASE });
  await page.waitFor(
    `document.body.innerText.includes("Akun Orang Tua")`,
    "halaman Akun Orang Tua",
  );
  check("admin melihat tombol Impor Excel", await importButton(page));
  await page.screenshot(`${SHOTS}/impor-akun-01-admin.png`);

  // Berkas uji disiapkan setelah halaman punya sesi admin.
  const exportFile = await writeExportFixture(page);
  log("berkas uji", `${exportFile} (${fs.statSync(exportFile).size} byte)`);

  const notExcelFile = `${UPLOADS}\\bukan-excel.xlsx`;
  fs.writeFileSync(notExcelFile, Buffer.from("nama,username\nSari,sari\n"));

  // ── 2. Berkas yang bukan Excel ──────────────────────────────
  console.log("\n=== 2. Berkas bukan Excel ===");
  await uploadFile(page, notExcelFile);
  await page.waitFor(
    `document.body.innerText.includes("yang sah")`,
    "pesan penolakan dari server",
  );
  const rejection = await page.evaluate(
    `document.body.innerText.replace(/\\s+/g, " ")`,
  );
  check(
    "berkas bukan Excel ditolak dengan pesan dari server",
    rejection.includes("bukan Excel (.xlsx) yang sah"),
  );
  check("pratinjau tidak terbuka untuk berkas yang ditolak", !(await hasDialog(page)));
  await page.screenshot(`${SHOTS}/impor-akun-02-bukan-excel.png`);

  // ── 3. Pratinjau dari berkas ekspor sendiri ─────────────────
  console.log("\n=== 3. Pratinjau ===");
  await uploadFile(page, exportFile);
  await page.waitFor(
    `document.querySelector('[role="dialog"]')?.innerText.includes("Pratinjau impor")`,
    "dialog pratinjau",
  );

  const preview = await dialogText(page);
  log("3. pratinjau", preview.slice(0, 220));
  check("dialog pratinjau memuat nama berkasnya", preview.includes("akun-ekspor.xlsx"));
  check("pratinjau menyebut jumlah baris terbaca", /\d+ baris terbaca/.test(preview));
  check("pratinjau menyebut akun yang ditimpa", /\d+ ditimpa/.test(preview));
  check("pratinjau menyebut baris yang dilewati", /\d+ dilewati/.test(preview));
  check(
    "pratinjau menjelaskan pencocokan lewat username",
    preview.includes("username"),
  );
  check(
    "tidak ada baris bermasalah pada berkas hasil ekspor sendiri",
    !/baris tidak terbaca/.test(preview),
    preview.slice(0, 220),
  );
  check(
    "ada tombol Terapkan",
    await page.evaluate(
      `[...document.querySelectorAll('[role="dialog"] button')]
         .some((button) => button.textContent.includes("Terapkan"))`,
    ),
  );
  await page.screenshot(`${SHOTS}/impor-akun-03-pratinjau.png`);

  // ── 4. Batal tidak menulis apa pun ──────────────────────────
  console.log("\n=== 4. Batal ===");
  await page.clickByText("Batal");
  await page.waitFor(`!document.querySelector('[role="dialog"]')`, "dialog tertutup");
  check("menekan Batal menutup pratinjau tanpa menerapkan", !(await hasDialog(page)));

  // ── 5. Terapkan ─────────────────────────────────────────────
  console.log("\n=== 5. Terapkan ===");
  await uploadFile(page, exportFile);
  await page.waitFor(
    `document.querySelector('[role="dialog"]')?.innerText.includes("Pratinjau impor")`,
    "dialog pratinjau kedua",
  );
  await page.clickByText("Terapkan");
  await page.waitFor(
    `document.body.innerText.includes("Impor selesai")`,
    "ringkasan hasil impor",
  );

  const banner = await page.evaluate(
    `document.body.innerText.replace(/\\s+/g, " ")`,
  );
  const summary = /Impor selesai: \d+ akun baru, \d+ diperbarui, \d+ dilewati/.exec(
    banner,
  );
  log("5. ringkasan", summary?.[0] ?? "(tidak ditemukan)");
  check("ringkasan hasil impor ditampilkan", Boolean(summary), banner.slice(0, 200));
  check("pratinjau tertutup setelah diterapkan", !(await hasDialog(page)));
  await page.screenshot(`${SHOTS}/impor-akun-04-terapkan.png`);

  // ── 6. Korlas — halaman tertutup ────────────────────────────
  console.log("\n=== 6. Korlas ===");
  await loginAs(page, "budi");
  await page.goto("/orang-tua", { baseUrl: BASE });
  await page.waitFor(
    `document.body.innerText.includes("Akses ditolak") ||
     document.body.innerText.includes("Akun Orang Tua")`,
    "halaman akun (korlas)",
  );
  check("korlas tidak melihat tombol impor", !(await importButton(page)));
  check(
    "korlas melihat halaman tertutup",
    await page.evaluate(`document.body.innerText.includes("Akses ditolak")`),
  );
  await page.screenshot(`${SHOTS}/impor-akun-05-korlas.png`);

  console.log("\n--- galat konsol ---");
  console.log(JSON.stringify(page.errors));
  check("tidak ada galat di konsol", page.errors.length === 0, page.errors.join(" | "));
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
