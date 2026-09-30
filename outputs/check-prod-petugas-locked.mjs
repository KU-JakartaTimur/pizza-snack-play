/**
 * Verifikasi produksi: petugas tetap bisa dipilih pada jadwal yang sudah
 * dipublikasi, sementara menu & catatan tetap terkunci.
 *
 * Jalankan: bun run outputs/check-prod-petugas-locked.mjs
 *
 * Membuktikan perilaku **server produksi** (bukan build lokal):
 * - `PUT /api/schedules/:id` dengan petugas-murni → 200 & benar tersimpan.
 * - `PUT` dengan menu → 409 (aturan lama tetap berlaku).
 * - `PUT` patch campuran menu+petugas → 409.
 *
 * Skrip ini hanya memakai baris produksi yang sudah ada dan **selalu**
 * mengembalikan nilai petugas ke semula di blok `finally`.
 */
const BASE =
  process.env.PSP_BASE ?? "https://pizza-snack-play.topidesta.workers.dev";

let pass = 0;
let fail = 0;
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  ok ? pass++ : fail++;
};

async function call(method, path, { token, body } = {}) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return {
    status: response.status,
    json: await response.json().catch(() => null),
  };
}

const login = await call("POST", "/api/auth/login", {
  body: { username: "admin", password: "snack123" },
});
check("login admin produksi", login.status === 200, `got ${login.status}`);
const token = login.json?.data?.token;
if (!token) {
  console.log("\nTidak bisa lanjut tanpa token.");
  process.exit(1);
}

/**
 * Cari baris `published` pada salah satu kelas. Rentang per bulan agar tetap
 * di bawah batas 92 hari milik `/range`.
 */
async function findPublishedRow() {
  for (const month of [
    ["2026-08-01", "2026-08-31"],
    ["2026-09-01", "2026-09-30"],
    ["2026-07-01", "2026-07-31"],
  ]) {
    for (const cls of ["1", "2", "3"]) {
      const rows = await call(
        "GET",
        `/api/schedules/range?from=${month[0]}&to=${month[1]}&class=${cls}`,
        { token },
      );
      const hit = (rows.json?.data ?? []).find(
        (d) => d.status === "published" && d.scheduleId && d.isHoliday !== 1,
      );
      if (hit) return { row: hit, cls, range: month };
    }
  }
  return null;
}

const found = await findPublishedRow();
check(
  "ada baris published untuk diuji",
  Boolean(found),
  found ? `kelas ${found.cls} · ${found.row.scheduleDate}` : "tidak ditemukan",
);

if (found) {
  const { row, cls } = found;
  const originalPetugas = row.petugasStudentId;

  // Kandidat siswa lain di kelas yang sama.
  const roster = await call("GET", `/api/classes/${cls}/roster`, { token });
  const candidate = (roster.json?.data?.students ?? []).find(
    (s) => s.studentId !== originalPetugas,
  );
  check("roster kelas tersedia", Boolean(candidate), candidate?.studentName ?? "-");

  if (candidate) {
    try {
      // ── 1. Petugas boleh: 200 & tersimpan ────────────────────
      const petugasPatch = await call("PUT", `/api/schedules/${row.scheduleId}`, {
        token,
        body: { petugasStudentId: candidate.studentId },
      });
      check(
        "produksi: petugas pada baris published -> 200",
        petugasPatch.status === 200,
        `got ${petugasPatch.status} :: ${petugasPatch.json?.message ?? ""}`,
      );
      check(
        "produksi: nama petugas diturunkan server",
        petugasPatch.json?.data?.petugasStudentId === candidate.studentId &&
          petugasPatch.json?.data?.petugasName === candidate.studentName,
        `id=${petugasPatch.json?.data?.petugasStudentId} nama=${petugasPatch.json?.data?.petugasName}`,
      );
      check(
        "produksi: status tetap published",
        petugasPatch.json?.data?.status === "published",
        petugasPatch.json?.data?.status,
      );

      // Bukti tersimpan: baca ulang barisnya.
      const reread = await call("GET", `/api/schedules/${row.scheduleId}`, {
        token,
      });
      check(
        "produksi: petugas benar-benar tersimpan",
        reread.json?.data?.petugasStudentId === candidate.studentId,
        String(reread.json?.data?.petugasStudentId),
      );

      // ── 2. Menu tetap beku: 409 ──────────────────────────────
      const menuPatch = await call("PUT", `/api/schedules/${row.scheduleId}`, {
        token,
        body: { menuId: row.menu?.id ?? 1 },
      });
      check(
        "produksi: menu pada baris published tetap -> 409",
        menuPatch.status === 409,
        `got ${menuPatch.status}`,
      );

      // ── 3. Patch campuran tetap 409 ──────────────────────────
      const mixed = await call("PUT", `/api/schedules/${row.scheduleId}`, {
        token,
        body: {
          menuId: row.menu?.id ?? 1,
          petugasStudentId: candidate.studentId,
        },
      });
      check(
        "produksi: patch campuran menu+petugas -> 409",
        mixed.status === 409,
        `got ${mixed.status}`,
      );

      // ── 4. Catatan tetap beku ────────────────────────────────
      const notes = await call("PUT", `/api/schedules/${row.scheduleId}`, {
        token,
        body: { notes: "uji produksi" },
      });
      check(
        "produksi: catatan pada baris published tetap -> 409",
        notes.status === 409,
        `got ${notes.status}`,
      );
    } finally {
      // Kembalikan petugas ke nilai semula, apa pun yang terjadi.
      const restore = await call("PUT", `/api/schedules/${row.scheduleId}`, {
        token,
        body: { petugasStudentId: originalPetugas },
      });
      console.log(
        `  (pemulihan petugas -> ${restore.status}, nilai ${originalPetugas})`,
      );
    }
  }
}

console.log(`\n${fail === 0 ? "SEMUA LULUS" : `${fail} UJI GAGAL`} (${pass} lulus)`);
process.exitCode = fail === 0 ? 0 : 1;
