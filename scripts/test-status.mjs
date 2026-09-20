/**
 * Uji endpoint ringkasan status jadwal (`GET /schedules/status`).
 *
 * Endpoint ini menggantikan pola lama "muat jadwal tiap kelas lalu hitung di
 * klien". Yang diuji:
 *   1. Admin tanpa `?class=` melihat **seluruh** kelas — inilah yang membuat
 *      cakupan kunci/publikasi sekolah-wide benar-benar terlihat.
 *   2. Korlas hanya melihat kelasnya sendiri.
 *   3. Angka `totals` konsisten dengan penjumlahan `perClass`.
 *   4. `canPublish`/`draftClasses` mengikuti aturan: publikasi hanya boleh
 *      bila tidak ada draft tersisa dan ada jadwal terkunci.
 *   5. Validasi parameter `year`/`month`.
 *
 * Prasyarat: dev server berjalan (`bun run dev`) dan DB lokal sudah
 * dimigrasi + di-seed.
 *
 * Jalankan: bun run scripts/test-status.mjs
 */

const BASE = "http://localhost:5173/api";
const ADMIN = { username: "admin", password: "snack123" };
/** Korlas kelas 1. */
const KORLAS = { username: "budi", password: "snack123" };

let pass = 0;
let fail = 0;
const failures = [];

function check(name, condition, detail = "") {
  if (condition) {
    pass++;
    console.log(`  PASS  ${name}`);
  } else {
    fail++;
    failures.push(name);
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function section(title) {
  console.log(`\n=== ${title} ===`);
}

async function call(method, path, { token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const canHaveBody = !["GET", "HEAD", "OPTIONS"].includes(
    method.toUpperCase(),
  );

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: canHaveBody && body !== undefined ? JSON.stringify(body) : undefined,
  });

  let json = null;
  try {
    json = await res.json();
  } catch {
    /* tanpa body */
  }
  return { status: res.status, json, data: json?.data ?? null };
}

// ── Setup ─────────────────────────────────────────────────────

const adminLogin = await call("POST", "/auth/login", { body: ADMIN });
const adminToken = adminLogin.data?.token;
const korlasLogin = await call("POST", "/auth/login", { body: KORLAS });
const korlasToken = korlasLogin.data?.token;

section("0. Persiapan");
check("login admin berhasil", Boolean(adminToken), `status ${adminLogin.status}`);
check(
  "login korlas berhasil",
  Boolean(korlasToken),
  `status ${korlasLogin.status}`,
);

if (!adminToken || !korlasToken) {
  console.log("\nToken tidak tersedia — hentikan.");
  process.exit(1);
}

// Bulan yang sedang berjalan, agar datanya paling mungkin terisi.
const now = new Date();
const YEAR = now.getUTCFullYear();
const MONTH = now.getUTCMonth() + 1;

// ── 1. Admin: cakupan seluruh sekolah ─────────────────────────

section("1. Admin — cakupan seluruh kelas");
const adminStatus = await call("GET", `/schedules/status?year=${YEAR}&month=${MONTH}`, {
  token: adminToken,
});
check("admin 200 OK", adminStatus.status === 200, `status ${adminStatus.status}`);
check("ada daftar kelas", Array.isArray(adminStatus.data?.classes));
check("ada rincian per kelas", Array.isArray(adminStatus.data?.perClass));
check(
  "admin melihat lebih dari satu kelas",
  (adminStatus.data?.classes?.length ?? 0) > 1,
  `jumlah kelas: ${adminStatus.data?.classes?.length}`,
);
check(
  "perClass mencakup semua kelas pada `classes`",
  (adminStatus.data?.classes ?? []).every((cls) =>
    (adminStatus.data?.perClass ?? []).some((row) => row.className === cls),
  ),
);
check(
  "kelas tanpa jadwal tetap muncul dengan angka nol",
  (adminStatus.data?.perClass ?? []).every(
    (row) =>
      row.draftCount >= 0 &&
      row.lockedCount >= 0 &&
      row.publishedCount >= 0 &&
      row.totalCount === row.draftCount + row.lockedCount + row.publishedCount,
  ),
);

// ── 2. Konsistensi angka ──────────────────────────────────────

section("2. Konsistensi totals vs perClass");
const per = adminStatus.data?.perClass ?? [];
const sum = per.reduce(
  (acc, row) => ({
    draft: acc.draft + row.draftCount,
    locked: acc.locked + row.lockedCount,
    published: acc.published + row.publishedCount,
    total: acc.total + row.totalCount,
  }),
  { draft: 0, locked: 0, published: 0, total: 0 },
);
const totals = adminStatus.data?.totals;
check("totals.draftCount = jumlah perClass", totals?.draftCount === sum.draft,
  `${totals?.draftCount} vs ${sum.draft}`);
check("totals.lockedCount = jumlah perClass", totals?.lockedCount === sum.locked,
  `${totals?.lockedCount} vs ${sum.locked}`);
check("totals.publishedCount = jumlah perClass",
  totals?.publishedCount === sum.published,
  `${totals?.publishedCount} vs ${sum.published}`);
check("totals.totalCount = jumlah perClass", totals?.totalCount === sum.total,
  `${totals?.totalCount} vs ${sum.total}`);

// ── 3. Aturan canPublish & draftClasses ───────────────────────

section("3. Aturan canPublish / draftClasses");
const draftClasses = adminStatus.data?.draftClasses ?? [];
check(
  "draftClasses hanya berisi kelas yang punya draft",
  draftClasses.every((cls) =>
    per.some((row) => row.className === cls && row.draftCount > 0),
  ),
);
check(
  "semua kelas ber-draft muncul di draftClasses",
  per
    .filter((row) => row.draftCount > 0)
    .every((row) => draftClasses.includes(row.className)),
);
check(
  "canPublish = (draftCount 0) dan (lockedCount > 0)",
  adminStatus.data?.canPublish ===
    (totals?.draftCount === 0 && totals?.lockedCount > 0),
  `canPublish=${adminStatus.data?.canPublish}, draft=${totals?.draftCount}, locked=${totals?.lockedCount}`,
);

// ── 4. Korlas: hanya kelasnya sendiri ─────────────────────────

section("4. Korlas — hanya kelasnya sendiri");
const korlasStatus = await call(
  "GET",
  `/schedules/status?year=${YEAR}&month=${MONTH}`,
  { token: korlasToken },
);
check("korlas 200 OK", korlasStatus.status === 200, `status ${korlasStatus.status}`);
check(
  "korlas hanya melihat satu kelas",
  (korlasStatus.data?.classes?.length ?? 0) === 1,
  `jumlah kelas: ${korlasStatus.data?.classes?.length}`,
);
check(
  "kelas korlas sesuai profilnya",
  korlasStatus.data?.classes?.[0] === "1",
  `kelas: ${korlasStatus.data?.classes?.[0]}`,
);
check(
  "perClass korlas hanya satu baris",
  (korlasStatus.data?.perClass?.length ?? 0) === 1,
);

// ── 5. Validasi parameter ─────────────────────────────────────

section("5. Validasi parameter");
const badMonth = await call("GET", `/schedules/status?year=${YEAR}&month=13`, {
  token: adminToken,
});
check("month=13 ditolak 400", badMonth.status === 400, `status ${badMonth.status}`);
const badYear = await call("GET", "/schedules/status?year=1999&month=1", {
  token: adminToken,
});
check("year=1999 ditolak 400", badYear.status === 400, `status ${badYear.status}`);
const noAuth = await call("GET", `/schedules/status?year=${YEAR}&month=${MONTH}`);
check("tanpa token ditolak 401", noAuth.status === 401, `status ${noAuth.status}`);

// ── Ringkasan ─────────────────────────────────────────────────

console.log(`\n${"─".repeat(48)}`);
console.log(`LULUS: ${pass}   GAGAL: ${fail}`);
if (fail > 0) {
  console.log(`\nGagal:`);
  for (const name of failures) console.log(`  - ${name}`);
}
process.exit(fail > 0 ? 1 : 0);
