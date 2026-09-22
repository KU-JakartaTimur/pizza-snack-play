/**
 * Verifikasi tampilan: orang tua menambah anaknya sendiri dari menu Profil.
 *
 * Jalankan: bun run outputs/check-profil-anak.mjs
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

const log = (label, value) => console.log(`${label}: ${value}`);
const sleep = (ms) => Bun.sleep(ms);

/**
 * Masuk sebagai `username`, lalu tutup popup "Login berhasil" lewat tombol
 * "Mulai". Sejak popup sambutan ada, pengalihan ke aplikasi tidak lagi
 * otomatis — lihat `outputs/check-auth-popup.mjs`.
 */
async function loginAs(page, username, password = "snack123") {
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

// Profil WAJIB di luar folder proyek — lihat SKILL.md.
const page = await launchEdge({
  port: 9333,
  profileDir: `${process.env.TEMP}\\psp-edge-profile`,
});

try {
  // ── 1. Login sebagai orang tua ──────────────────────────────
  await page.goto("/login", { baseUrl: BASE });
  await page.evaluate("localStorage.clear()");
  await loginAs(page, "sari");
  log("1. login berhasil", await page.evaluate("location.pathname"));

  // ── 2. Menu Profil ──────────────────────────────────────────
  await page.goto("/profil", { baseUrl: BASE });
  await page.waitFor(
    "document.body.innerText.includes('Data Anak')",
    "kartu Data Anak muncul",
  );
  log("2. anak awal", JSON.stringify(await page.texts("ul > li")));
  await page.screenshot(`${SHOTS}/profil-01-daftar-anak.png`);

  // ── 3. Tambah anak ──────────────────────────────────────────
  await page.clickByText("Tambah anak");
  await page.waitFor(
    `document.querySelector('input[placeholder="mis. Aisyah Sari"]')`,
    "modal terbuka",
  );
  await page.screenshot(`${SHOTS}/profil-02-modal-tambah.png`);

  await page.setValue('input[placeholder="mis. Aisyah Sari"]', "Uji Tampilan Anak");
  await page.setValue('input[placeholder="mis. 1"]', "5");
  await sleep(1000);
  log(
    "3. saran kelas di datalist",
    JSON.stringify(
      await page.evaluate(
        `[...document.querySelectorAll("datalist option")].map((o) => o.value)`,
      ),
    ),
  );

  await page.evaluate(`(function () {
    const modal = document.querySelector(".fixed.inset-0");
    [...modal.querySelectorAll("button")]
      .find((button) => button.textContent.includes("Simpan"))
      .click();
  })()`);

  await page.waitFor(
    "document.body.innerText.includes('berhasil ditambahkan')",
    "pesan sukses tambah anak",
  );
  await sleep(600);
  log(
    "3b. banner",
    await page.evaluate(
      `[...document.querySelectorAll("p")].find((p) => p.textContent.includes("berhasil ditambahkan"))?.textContent`,
    ),
  );
  log("3c. anak setelah ditambah", JSON.stringify(await page.texts("ul > li")));
  await page.screenshot(`${SHOTS}/profil-03-anak-ditambah.png`);

  // ── 4. Kelas baru ikut dikenali halaman lain ────────────────
  await page.goto("/hari-ini", { baseUrl: BASE });
  await page.waitFor("document.querySelector('select')", "pemilih kelas muncul");
  log(
    "4. pemilih kelas di Hari Ini",
    JSON.stringify(
      await page.evaluate(
        `[...document.querySelector("select").options].map((o) => o.value)`,
      ),
    ),
  );
  await page.screenshot(`${SHOTS}/profil-04-kelas-baru-terdaftar.png`);

  // ── 5. Hapus anak (sekaligus bersihkan) ─────────────────────
  await page.goto("/profil", { baseUrl: BASE });
  await page.waitFor(
    "document.body.innerText.includes('Data Anak')",
    "kartu Data Anak",
  );
  log(
    "5. jumlah tombol hapus",
    await page.evaluate(
      `document.querySelectorAll('button[title="Hapus data anak"]').length`,
    ),
  );
  await page.evaluate(`(function () {
    const buttons = document.querySelectorAll('button[title="Hapus data anak"]');
    buttons[buttons.length - 1].click();
  })()`);

  await page.waitFor(
    "document.body.innerText.includes('berhasil dihapus')",
    "pesan sukses hapus anak",
  );
  await sleep(600);
  log("5b. dialog konfirmasi", JSON.stringify(page.dialogs));
  log("5c. anak setelah dihapus", JSON.stringify(await page.texts("ul > li")));
  await page.screenshot(`${SHOTS}/profil-05-anak-dihapus.png`);

  // ── 6. Admin tidak melihat kartu Data Anak ──────────────────
  await page.evaluate("localStorage.clear()");
  await loginAs(page, "admin");
  await page.goto("/profil", { baseUrl: BASE });
  await sleep(700);
  log(
    "6. admin melihat kartu Data Anak?",
    await page.evaluate("document.body.innerText.includes('Data Anak')"),
  );
  await page.screenshot(`${SHOTS}/profil-06-admin.png`);

  log(
    "error halaman",
    page.errors.length === 0 ? "tidak ada" : JSON.stringify(page.errors),
  );
  console.log("\nSelesai. Tangkapan layar ada di outputs/screenshots/");
} finally {
  await page.close();
  console.log("Edge ditutup.");
}
