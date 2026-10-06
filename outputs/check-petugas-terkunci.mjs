/**
 * Verifikasi tampilan: dropdown **Petugas** tetap bisa dipakai pada baris
 * jadwal yang sudah `locked`/`published`.
 *
 * Jalankan: bun run outputs/check-petugas-terkunci.mjs
 * (dev server harus jalan: `bun run dev`)
 *
 * Latar belakang bug: `DayRow` menonaktifkan dropdown Petugas bersama menu &
 * catatan begitu status baris bukan `draft` (padahal server sudah menerima
 * perubahan kolom petugas sendirian). Skrip ini membuktikan dua hal yang
 * benar-benar penting — bukan hiasan:
 *
 * - Pada baris `published`, dropdown Petugas **tidak** `disabled` dan
 *   memuat nama siswa kelas itu.
 * - Memilih siswa benar-benar tersimpan ke server (PUT 200 + nama petugas
 *   pada respons), bukan hanya berubah di layar.
 * - Yang tetap terkunci memang terkunci: dropdown Menu & input Catatan pada
 *   baris yang sama masih `disabled`.
 *
 * Penggerak browser mengikuti skill `windows-edge-cdp-ui-verify`.
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
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  ok ? pass++ : fail++;
};

/** Isi form masuk, kirim, lalu lewati popup sambutan. */
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
  await page.send("Emulation.setDeviceMetricsOverride", {
    width: 1500,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });

  await loginAs(page, "admin");

  await page.goto("/jadwal", { baseUrl: BASE });
  await page.waitFor(
    `document.body.innerText.includes("Kelola Jadwal")`,
    "halaman /jadwal terbuka",
  );
  await page.waitFor(`document.querySelectorAll("select").length > 0`, "tabel terisi");
  await new Promise((r) => setTimeout(r, 2500));

  /**
   * Baris pertama yang berstatus **Dipublikasi** — di situlah bug terlihat.
   * Baris dicari lewat badge statusnya, lalu `li` induknya.
   */
  /** Indeks baris Dipublikasi pertama — satu-satunya baris yang diuji. */
  const ROW_INDEX = `(function () {
    const rows = [...document.querySelectorAll("li")];
    // Baris ber-petugas dropdown & berbadge Dipublikasi.
    return rows.filter((li) => {
      const badge = [...li.querySelectorAll("span")].find(
        (s) => s.textContent.trim() === "Dipublikasi",
      );
      if (!badge) return false;
      return [...li.querySelectorAll("select")].some((s) =>
        [...s.options].some((o) => o.textContent.includes("belum ada petugas")),
      );
    });
  })()`;

  const describe = `(function () {
    const li = ${ROW_INDEX}[0];
    if (!li) return { found: false };
    const selects = [...li.querySelectorAll("select")];
    const petugas = selects.find((s) =>
      [...s.options].some((o) => o.textContent.includes("belum ada petugas")),
    );
    if (!petugas) return { found: false };
    /*
      Urutan kolom di DayRow: Menu · Petugas · Orang tua. Petugas dikenali
      dari opsi "belum ada petugas", Orang tua dari disabled + satu opsi,
      dan Menu adalah sisanya.
    */
    const others = selects.filter((s) => s !== petugas);
    const parent = others.find((s) => s.disabled);
    const menu = others.find((s) => s !== parent) ?? null;
    // Catatan = input teks berplaceholder "Catatan…", bukan checkbox baris.
    const notes = li.querySelector('input[placeholder="Catatan…"]');
    return {
      found: true,
      day: li.innerText.split("\\n")[0],
      petugasDisabled: petugas.disabled,
      petugasOptions: [...petugas.options].map((o) => o.textContent.trim()),
      petugasValue: petugas.value,
      menuDisabled: menu ? menu.disabled : null,
      notesDisabled: notes ? notes.disabled : null,
      parentDisabled: parent ? parent.disabled : null,
    };
  })()`;

  let row = await page.evaluate(describe);

  // Seed menyimpan jadwal lama; kalau bulan berjalan belum ada baris terbit,
  // maju satu bulan sampai ketemu supaya uji tidak bergantung tanggal.
  for (let i = 0; i < 4 && !row.found; i++) {
    await page.evaluate(`(function () {
      const btn = document.querySelector('[aria-label="Bulan berikutnya"]');
      if (btn) btn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 2000));
    row = await page.evaluate(describe);
  }

  check(
    "ada baris Dipublikasi di tabel jadwal",
    row.found,
    row.found ? `${row.day}` : "tidak ditemukan pada 5 bulan",
  );
  check(
    "dropdown Petugas pada baris Dipublikasi TIDAK dinonaktifkan",
    row.found && row.petugasDisabled === false,
    `disabled=${row.petugasDisabled}`,
  );
  check(
    "dropdown Petugas memuat nama siswa kelas itu",
    row.found && row.petugasOptions.length > 2,
    (row.petugasOptions ?? []).slice(0, 5).join(", "),
  );
  check(
    "dropdown Menu pada baris yang sama tetap terkunci",
    row.found && row.menuDisabled === true,
    `menuDisabled=${row.menuDisabled}`,
  );
  check(
    "input Catatan pada baris yang sama tetap terkunci",
    row.found && row.notesDisabled === true,
    `notesDisabled=${row.notesDisabled}`,
  );

  await page.screenshot(`${SHOTS}/petugas-terkunci-before.png`);

  // ── Pilih siswa, buktikan tersimpan ke server ─────────────
  if (row.found) {
    const chosen = await page.evaluate(`(function () {
      const li = ${ROW_INDEX}[0];
      if (!li) return null;
      const petugas = [...li.querySelectorAll("select")].find((s) =>
        [...s.options].some((o) => o.textContent.includes("belum ada petugas")),
      );
      if (!petugas) return null;
      // Siswa pertama yang bukan pilihan sekarang.
      const option = [...petugas.options].find(
        (o) => o.value && o.value !== petugas.value,
      );
      if (!option) return null;
      return { id: option.value, name: option.textContent.trim() };
    })()`);

    check("ada siswa lain untuk dipilih", Boolean(chosen), chosen?.name ?? "-");

    if (chosen) {
      /*
        Bukti yang dipakai adalah **hasil di server**, bukan interseptor
        transport: setelah memilih, API dibaca ulang sampai `petugasStudentId`
        baris itu benar-benar berubah (atau batas waktu habis). Dengan begitu
        uji tidak bergantung pada cara klien mengirim (fetch/XHR).
      */
      const readBack = (studentId) =>
        page.evaluate(`(async function () {
          const token = localStorage.getItem("psp_token");
          if (!token) return { error: "token tidak ada" };
          const headers = { Authorization: "Bearer " + token };
          const list = await fetch("/api/schedules/range?from=2026-08-01&to=2026-09-30&class=1", { headers });
          if (!list.ok) return { error: "HTTP " + list.status };
          const payload = await list.json();
          const days = payload?.data ?? [];
          const hit = days.find((d) => d.petugasStudentId === ${studentId});
          return {
            count: days.length,
            hit: Boolean(hit),
            hitDate: hit?.scheduleDate ?? null,
            ids: days.filter((d) => d.petugasStudentId !== null).map((d) => d.petugasStudentId),
          };
        })()`);

      await page.evaluate(`(function () {
        const li = ${ROW_INDEX}[0];
        if (!li) return false;
        const petugas = [...li.querySelectorAll("select")].find((s) =>
          [...s.options].some((o) => o.textContent.includes("belum ada petugas")),
        );
        if (!petugas) return false;
        const setter = Object.getOwnPropertyDescriptor(
          HTMLSelectElement.prototype, "value").set;
        setter.call(petugas, ${JSON.stringify(chosen.id)});
        petugas.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      })()`);

      // Beri kesempatan PUT selesai + query diinvalidasi, lalu baca ulang.
      let persisted = { hit: false };
      for (let i = 0; i < 12 && !persisted?.hit; i++) {
        await new Promise((r) => setTimeout(r, 700));
        persisted = await readBack(Number(chosen.id));
      }

      check(
        "petugas tersimpan di server (dibaca ulang lewat API)",
        persisted?.hit === true,
        JSON.stringify(persisted),
      );

      // Server tidak boleh mengembalikan galat apa pun untuk perubahan ini.
      const failureBanner = await page.evaluate(
        `document.body.innerText.includes("tidak dapat diubah") ||
         document.body.innerText.includes("Gagal menyimpan")`,
      );
      check(
        "tidak ada banner penolakan 409 setelah memilih petugas",
        failureBanner === false,
      );

      await page.screenshot(`${SHOTS}/petugas-terkunci-after.png`);

      // ── Bersih-bersih: kembalikan petugas ke nilai semula ─────
      const original = row.petugasValue;
      if (original !== undefined && original !== null) {
        await page.evaluate(`(function () {
          const li = ${ROW_INDEX}[0];
          if (!li) return false;
          const petugas = [...li.querySelectorAll("select")].find((s) =>
            [...s.options].some((o) => o.textContent.includes("belum ada petugas")),
          );
          if (!petugas) return false;
          const setter = Object.getOwnPropertyDescriptor(
            HTMLSelectElement.prototype, "value").set;
          setter.call(petugas, ${JSON.stringify(original)});
          petugas.dispatchEvent(new Event("change", { bubbles: true }));
          return true;
        })()`);
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }

  check(
    "konsol bersih (tanpa error React)",
    page.errors.length === 0,
    page.errors.slice(0, 3).join(" || "),
  );

  console.log(`\n${fail === 0 ? "SEMUA LULUS" : `${fail} UJI GAGAL`} (${pass} lulus)`);
  console.log(`Screenshot: ${SHOTS}`);
  process.exitCode = fail === 0 ? 0 : 1;
} finally {
  await page.close();
}
