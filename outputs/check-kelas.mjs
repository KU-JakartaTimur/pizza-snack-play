/**
 * Verifikasi tampilan: cakupan kelas di pemilih header + notifikasi bila kelas
 * belum ada.
 *
 * Jalankan: bun run outputs/check-kelas.mjs
 * (dev server harus jalan: `bun run dev`)
 *
 * Aturan yang diuji:
 * - admin & korlas → semua kelas (korlas default-nya kelas yang dikoordinasi)
 * - orang tua      → hanya kelas anaknya; satu kelas saja = pemilih disembunyikan
 * - tidak ada kelas sama sekali → banner "lengkapi data di Profil"
 *
 * Penggerak browser diambil dari skill `windows-edge-cdp-ui-verify` — lihat
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

/** Pemilih kelas di header: `{ value, options }`, atau `null` bila tak dirender. */
const headerClass = () =>
  page.evaluate(`(function () {
    const select = document.querySelector("header select");
    return select
      ? { value: select.value, options: [...select.options].map((o) => o.value) }
      : null;
  })()`);

/** Ubah pilihan kelas di header seperti user (setter native + event change). */
const pickClass = (value) =>
  page.evaluate(`(function () {
    const select = document.querySelector("header select");
    if (!select) throw new Error("pemilih kelas tidak ada");
    const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set;
    setter.call(select, ${JSON.stringify(value)});
    select.dispatchEvent(new Event("change", { bubbles: true }));
    return select.value;
  })()`);

/** Panggil API dari dalam halaman memakai token sesi yang tersimpan. */
const callApi = (path, method = "GET", body = null) =>
  page.evaluate(`(async () => {
    const response = await fetch(${JSON.stringify("/api")} + ${JSON.stringify(path)}, {
      method: ${JSON.stringify(method)},
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + localStorage.getItem("psp_token"),
      },
      body: ${body ? JSON.stringify(JSON.stringify(body)) : "undefined"},
    });
    return { status: response.status, data: (await response.json()).data ?? null };
  })()`);

const bodyText = () => page.evaluate("document.body.innerText");

/** Alamat permintaan API yang dibuat halaman — bukti kelas mana yang diminta. */
const apiCalls = () =>
  page.evaluate(
    `performance.getEntriesByType("resource").map((e) => e.name).filter((n) => n.includes("/api/"))`,
  );

const noticeShown = async () =>
  (await bodyText()).includes("Kelas anak Anda belum diisi");

try {
  // ── 1. Admin — semua kelas ──────────────────────────────────
  console.log("\n=== 1. Admin ===");
  await page.goto("/login", { baseUrl: BASE });
  await page.evaluate("localStorage.clear()");
  await loginAs("admin");
  await page.goto("/hari-ini", { baseUrl: BASE });
  await page.waitFor(`Boolean(document.querySelector("header select"))`, "pemilih kelas");
  const adminClasses = await headerClass();
  log("1. pemilih kelas admin", JSON.stringify(adminClasses));
  check(
    "admin melihat semua kelas",
    adminClasses.options.join() === "1,2,3,4,5,6",
    JSON.stringify(adminClasses.options),
  );
  check("admin tanpa notifikasi kelas kosong", !(await noticeShown()));
  await page.screenshot(`${SHOTS}/kelas-01-admin.png`);

  // ── 2. Korlas — semua kelas, default kelasnya ───────────────
  console.log("\n=== 2. Korlas (budi, kelas 1) ===");
  await page.evaluate("localStorage.clear()");
  await loginAs("budi");
  await page.goto("/hari-ini", { baseUrl: BASE });
  await page.waitFor(`Boolean(document.querySelector("header select"))`, "pemilih kelas");
  const korlasClasses = await headerClass();
  log("2. pemilih kelas korlas", JSON.stringify(korlasClasses));
  log("2b. psp_class", await page.evaluate(`localStorage.getItem("psp_class")`));
  check(
    "korlas melihat semua kelas",
    korlasClasses.options.join() === "1,2,3,4,5,6",
    JSON.stringify(korlasClasses.options),
  );
  check(
    "default korlas = kelas yang dikoordinasinya",
    korlasClasses.value === "1",
    korlasClasses.value,
  );
  await page.screenshot(`${SHOTS}/kelas-02-korlas.png`);

  // ── 3. Korlas boleh membaca kelas lain ──────────────────────
  console.log("\n=== 3. Korlas membaca kelas lain ===");
  await pickClass("3");
  await page.waitFor(
    `performance.getEntriesByType("resource").some((e) => e.name.includes("class=3"))`,
    "permintaan kelas 3",
  );
  check(
    "halaman meminta jadwal kelas 3",
    (await apiCalls()).some((url) => url.includes("class=3")),
  );
  check(
    "tanpa pesan cakupan terlarang",
    !(await bodyText()).includes("bukan cakupan"),
  );
  await page.screenshot(`${SHOTS}/kelas-03-korlas-kelas-lain.png`);

  // ── 3b. Kelola jadwal tetap terkunci ke kelas korlas ────────
  console.log("\n=== 3b. Korlas menyusun jadwal kelasnya sendiri ===");
  await page.goto("/jadwal", { baseUrl: BASE });
  await page.waitFor(
    `document.body.innerText.includes("Kelola Jadwal")`,
    "halaman kelola jadwal",
  );
  await page.waitFor(
    `performance.getEntriesByType("resource").some((e) => e.name.includes("class=1"))`,
    "permintaan kelas korlas",
  );
  const jadwalCalls = await apiCalls();
  check(
    "halaman kelola jadwal memakai kelas korlas (1)",
    jadwalCalls.some((url) => url.includes("class=1")),
  );
  check(
    "tidak memakai kelas lain (3) untuk menyusun",
    !jadwalCalls.some((url) => url.includes("class=3")),
  );
  await page.screenshot(`${SHOTS}/kelas-03b-korlas-kelola.png`);

  // ── 4. Orang tua dua anak (dewi) — hanya kelas anaknya ──────
  console.log("\n=== 4. Orang tua dua anak (dewi: kelas 2 & 3) ===");
  await page.evaluate("localStorage.clear()");
  await loginAs("dewi");
  await page.goto("/hari-ini", { baseUrl: BASE });
  await page.waitFor(`Boolean(document.querySelector("header select"))`, "pemilih kelas");
  const parentClasses = await headerClass();
  log("4. pemilih kelas dewi", JSON.stringify(parentClasses));
  check(
    "orang tua hanya melihat kelas anaknya",
    parentClasses.options.join() === "2,3",
    JSON.stringify(parentClasses.options),
  );
  check("tanpa notifikasi kelas kosong", !(await noticeShown()));
  await page.screenshot(`${SHOTS}/kelas-04-orangtua.png`);

  // ── 5. Orang tua satu kelas (sari) — pemilih disembunyikan ──
  console.log("\n=== 5. Orang tua satu kelas (sari: kelas 1) ===");
  await page.evaluate("localStorage.clear()");
  await loginAs("sari");
  await page.goto("/hari-ini", { baseUrl: BASE });
  await page.waitFor("document.body.innerText.includes('Jadwal Hari Ini')", "halaman");
  check("pemilih kelas disembunyikan", (await headerClass()) === null);
  check("tanpa notifikasi kelas kosong", !(await noticeShown()));

  // ── 6. Kelas dikosongkan → banner notifikasi ────────────────
  console.log("\n=== 6. Anak belum punya kelas ===");
  const students = (await callApi("/profile/students")).data ?? [];
  const student = students[0];
  log("6. anak sari", JSON.stringify(student));
  const cleared = await callApi(`/profile/students/${student.id}`, "PUT", {
    name: student.name,
    className: null,
  });
  check("kelas anak dikosongkan lewat API", cleared.status === 200, `${cleared.status}`);

  await page.goto("/hari-ini", { baseUrl: BASE });
  await page.waitFor(
    `document.body.innerText.includes("Kelas anak Anda belum diisi")`,
    "banner notifikasi",
  );
  check("banner notifikasi muncul", true);
  check(
    "pilihan kelas lama dibersihkan",
    (await page.evaluate(`localStorage.getItem("psp_class")`)) === null,
  );
  check(
    "ada tombol menuju Profil",
    (await bodyText()).includes("Lengkapi di Profil"),
  );
  await page.screenshot(`${SHOTS}/kelas-05-notifikasi.png`);

  // "Nanti" menutup banner
  await page.clickByText("Nanti");
  await page.waitFor(
    `!document.body.innerText.includes("Kelas anak Anda belum diisi")`,
    "banner tertutup",
  );
  check("tombol Nanti menutup banner", true);

  // Tombol tindakan membuka menu Profil
  await page.goto("/hari-ini", { baseUrl: BASE });
  await page.waitFor(
    `document.body.innerText.includes("Lengkapi di Profil")`,
    "banner muncul lagi",
  );
  await page.clickByText("Lengkapi di Profil");
  await page.waitFor("location.pathname === '/profil'", "pindah ke /profil");
  check("tombol membuka menu Profil", true);
  await page.screenshot(`${SHOTS}/kelas-06-profil.png`);

  // ── 7. Pulihkan data uji ────────────────────────────────────
  console.log("\n=== 7. Pulihkan kelas anak ===");
  const restored = await callApi(`/profile/students/${student.id}`, "PUT", {
    name: student.name,
    className: "1",
  });
  check("kelas anak dikembalikan", restored.status === 200, `${restored.status}`);

  await page.goto("/hari-ini", { baseUrl: BASE });
  await page.waitFor("document.body.innerText.includes('Jadwal Hari Ini')", "halaman");
  check("banner hilang setelah kelas diisi", !(await noticeShown()));

  console.log(
    `\nerror halaman: ${page.errors.length === 0 ? "tidak ada" : JSON.stringify(page.errors)}`,
  );
  console.log(`\n=== HASIL: ${pass} pass, ${fail} fail ===`);
  console.log("Tangkapan layar ada di outputs/screenshots/");
} finally {
  await page.close();
  console.log("Edge ditutup.");
}

process.exit(fail > 0 ? 1 : 0);
