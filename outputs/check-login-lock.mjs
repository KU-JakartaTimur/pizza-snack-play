/**
 * Verifikasi tampilan: batas percobaan masuk (5x gagal → akun terkunci).
 *
 * Yang dibuktikan di peramban sungguhan:
 *   - halaman masuk memperingatkan sisa kesempatan setiap kali gagal, lalu
 *     menyebut "hubungi admin" saat akunnya terkunci;
 *   - akun terkunci tidak bisa masuk walau passwordnya benar;
 *   - halaman /orang-tua menandai akun terkunci dan menyediakan tombol buka
 *     kunci yang benar-benar mengembalikan aksesnya.
 *
 * Akun uji dibuat sekali pakai lewat API admin lalu dihapus lagi di akhir —
 * akun demo (sari/budi) dipakai uji lain, jadi tidak boleh ikut terkunci.
 *
 * Jalankan: bun run outputs/check-login-lock.mjs
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

const PASSWORD = "rahasia123";
const USERNAME = `ujikunci${Date.now()}`;

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

/** Teks kotak galat pada form masuk (tempat pesan server tampil). */
const formText = (page) =>
  page.evaluate(`document.querySelector("form")?.innerText ?? ""`);

/** Panggil API memakai token yang tersimpan di peramban. */
const api = (page, path, init = {}) =>
  page.evaluate(`fetch(${JSON.stringify(path)}, {
    method: ${JSON.stringify(init.method ?? "GET")},
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + localStorage.getItem("psp_token"),
    },
    ${init.body ? `body: ${JSON.stringify(JSON.stringify(init.body))},` : ""}
  }).then(async (response) => ({ status: response.status, body: await response.json().catch(() => null) }))`);

/** Login tanpa token — untuk memicu kegagalan dari dalam halaman. */
const bareLogin = (page, username, password) =>
  page.evaluate(`fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: ${JSON.stringify(username)}, password: ${JSON.stringify(password)} }),
  }).then(async (response) => ({ status: response.status, body: await response.json().catch(() => null) }))`);

/** Isi form masuk dan kirim. */
async function submitLogin(page, username, password) {
  await page.setValue('input[placeholder="mis. sari"]', username);
  await page.setValue('input[type="password"]', password);
  await page.clickByText("Masuk");
}

/** Baris tabel pada /orang-tua yang memuat `text`. */
const rowInfo = (page, text) =>
  page.evaluate(`(function () {
    const row = [...document.querySelectorAll("tbody tr")]
      .find((item) => item.innerText.includes(${JSON.stringify(text)}));
    if (!row) return null;
    return {
      text: row.innerText.replace(/\\n/g, " | "),
      hasUnlockButton: Boolean(row.querySelector('button[title="Buka kunci akun"]')),
      hasLockedBadge: row.innerText.includes("Terkunci"),
    };
  })()`);

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

// Profil WAJIB di luar folder proyek — lihat SKILL.md.
const page = await launchEdge({
  port: 9333,
  profileDir: `${process.env.TEMP}\\psp-edge-profile`,
});

try {
  // ── 0. Siapkan akun uji ─────────────────────────────────────
  console.log("\n=== 0. Menyiapkan akun uji ===");
  await page.goto("/login", { baseUrl: BASE });
  await page.evaluate("localStorage.clear()");
  await page.goto("/login", { baseUrl: BASE });
  await submitLogin(page, "admin", "snack123");
  await page.waitFor(
    `document.querySelector('[role="dialog"]')?.innerText.includes("Login berhasil")`,
    "popup login admin",
  );
  await clickInDialog(page, "Mulai");
  await page.waitFor("location.pathname === '/hari-ini'", "admin masuk");

  const created = await api(page, "/api/parents", {
    method: "POST",
    body: {
      username: USERNAME,
      password: PASSWORD,
      parentName: "Uji Batas Masuk",
      students: [{ name: "Anak Uji", className: "1" }],
    },
  });
  const parentId = created.body?.data?.id;
  log("0. akun uji", `${USERNAME} (id ${parentId})`);
  check("akun uji dibuat", created.status === 201 && Boolean(parentId), `status ${created.status}`);

  // ── 1. Percobaan gagal dari halaman masuk ───────────────────
  console.log("\n=== 1. Peringatan sisa kesempatan di halaman masuk ===");
  await page.goto("/login", { baseUrl: BASE });
  await page.evaluate("localStorage.clear()");
  await page.goto("/login", { baseUrl: BASE });

  for (let attempt = 1; attempt <= 4; attempt++) {
    const left = 5 - attempt;
    await submitLogin(page, USERNAME, "password-salah");
    await page.waitFor(
      `document.querySelector("form")?.innerText.includes("Sisa ${left} kesempatan")`,
      `peringatan sisa ${left}`,
    );
    const text = await formText(page);
    check(
      `gagal ke-${attempt} memperingatkan sisa ${left} kesempatan`,
      text.includes(`Sisa ${left} kesempatan`),
      text.replace(/\n/g, " | "),
    );
  }
  await page.screenshot(`${SHOTS}/lock-01-sisa-kesempatan.png`);

  // ── 2. Kegagalan kelima mengunci ────────────────────────────
  console.log("\n=== 2. Kegagalan ke-5 mengunci akun ===");
  await submitLogin(page, USERNAME, "password-salah");
  await page.waitFor(
    `document.querySelector("form")?.innerText.includes("Hubungi admin")`,
    "pesan terkunci",
  );
  const lockedText = await formText(page);
  log("2. pesan di halaman masuk", JSON.stringify(lockedText.replace(/\n/g, " | ")));
  check("pesannya menyebut akun terkunci", lockedText.includes("terkunci"));
  check("pesannya menyuruh menghubungi admin", lockedText.includes("Hubungi admin"));
  await page.screenshot(`${SHOTS}/lock-02-terkunci.png`);

  // Password yang benar pun tidak menolong selama terkunci.
  const correct = await bareLogin(page, USERNAME, PASSWORD);
  check(
    "password benar saat terkunci ditolak (423)",
    correct.status === 423,
    `got ${correct.status}`,
  );

  // ── 3. Admin melihat & membuka kunci ────────────────────────
  console.log("\n=== 3. Admin melihat status terkunci & membukanya ===");
  await page.goto("/login", { baseUrl: BASE });
  await submitLogin(page, "admin", "snack123");
  await page.waitFor(
    `document.querySelector('[role="dialog"]')?.innerText.includes("Login berhasil")`,
    "popup login admin",
  );
  await clickInDialog(page, "Mulai");
  await page.waitFor("location.pathname === '/hari-ini'", "admin masuk");

  await page.goto("/orang-tua", { baseUrl: BASE });
  await page.waitFor(
    `document.body.innerText.includes("Akun Orang Tua")`,
    "halaman akun",
  );
  await page.setValue('input[placeholder^="Cari nama"]', USERNAME);
  await page.waitFor(
    `[...document.querySelectorAll("tbody tr")].some((row) => row.innerText.includes(${JSON.stringify(USERNAME)}))`,
    "baris akun uji",
  );

  const lockedRow = await rowInfo(page, USERNAME);
  log("3. baris akun", JSON.stringify(lockedRow?.text));
  check("baris menampilkan badge Terkunci", lockedRow?.hasLockedBadge === true);
  check("tombol Buka kunci muncul", lockedRow?.hasUnlockButton === true);
  await page.screenshot(`${SHOTS}/lock-03-baris-terkunci.png`);

  await page.evaluate(
    `document.querySelector('tbody tr button[title="Buka kunci akun"]').click()`,
  );
  await page.waitFor(
    `document.querySelector('[role="dialog"]')?.innerText.includes("Buka kunci")`,
    "dialog konfirmasi buka kunci",
  );
  await page.screenshot(`${SHOTS}/lock-04-dialog-buka-kunci.png`);
  await clickInDialog(page, "Buka kunci");

  await page.waitFor(
    `![...document.querySelectorAll("tbody tr")]
       .some((row) => row.innerText.includes(${JSON.stringify(USERNAME)}) && row.innerText.includes("Terkunci"))`,
    "badge Terkunci hilang",
  );
  const afterRow = await rowInfo(page, USERNAME);
  log("3. baris sesudah dibuka", JSON.stringify(afterRow?.text));
  check("badge Terkunci hilang", afterRow?.hasLockedBadge === false);
  check("tombol Buka kunci ikut hilang", afterRow?.hasUnlockButton === false);
  await page.screenshot(`${SHOTS}/lock-05-setelah-dibuka.png`);

  // ── 4. Aksesnya benar-benar kembali ─────────────────────────
  console.log("\n=== 4. Akses kembali seperti semula ===");
  const afterUnlock = await bareLogin(page, USERNAME, PASSWORD);
  check(
    "password yang sama bisa dipakai masuk lagi",
    afterUnlock.status === 200,
    `got ${afterUnlock.status} ${afterUnlock.body?.message ?? ""}`,
  );

  const detail = await api(page, `/api/parents/${parentId}`);
  check(
    "status terkunci benar-benar kosong di server",
    detail.body?.data?.lockedAt === null,
    String(detail.body?.data?.lockedAt),
  );

  // ── 5. Bersih-bersih ────────────────────────────────────────
  console.log("\n=== 5. Membersihkan akun uji ===");
  // `hard=true` wajib: tanpa itu endpoint hanya menonaktifkan akun, dan
  // sisa akun nonaktif membuat uji statistik lain gagal.
  const removed = await api(page, `/api/parents/${parentId}?hard=true`, {
    method: "DELETE",
  });
  check("akun uji dihapus", removed.status === 200, `status ${removed.status}`);

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
