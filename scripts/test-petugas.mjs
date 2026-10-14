/**
 * Uji endpoint petugas lintas kelas (`GET /schedules/petugas`).
 *
 * Endpoint ini melayani panel "kelas lain" di halaman Pilih Jadwal: menu snack
 * sama untuk semua kelas pada satu tanggal, jadi yang dicari orang tua dari
 * kelas lain adalah siapa yang piket hari itu. Yang diuji:
 *
 *   1. **Cakupannya benar-benar lintas kelas** — bukan cuma kelas si pemanggil,
 *      karena itulah gunanya endpoint ini.
 *   2. **Hanya jadwal `published` yang ikut.** Ini yang paling penting: rute
 *      ini sengaja tidak lewat `resolveReadClass` (yang selalu mempersempit ke
 *      satu kelas), jadi satu kelalaian di sini akan membocorkan jadwal
 *      draft/terkunci ke seluruh orang tua. Diuji dengan baris `draft`
 *      sungguhan yang dibuat lewat API, lalu dihapus lagi di blok `finally`.
 *   3. Bentuk jawaban & urutannya (tanggal menaik, kelas urut alami).
 *   4. Validasi parameter dan kewajiban token.
 *
 * Prasyarat: dev server berjalan (`bun run dev`) dan DB lokal sudah
 * dimigrasi + di-seed.
 *
 * Jalankan: bun run scripts/test-petugas.mjs
 */

const BASE = "http://localhost:5173/api";
const ADMIN = { username: "admin", password: "snack123" };
/** Orang tua; anaknya di kelas 1. */
const PARENT = { username: "sari", password: "snack123" };

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

function skip(name, reason) {
  console.log(`  SKIP  ${name} — ${reason}`);
}

function section(title) {
  console.log(`\n=== ${title} ===`);
}

async function call(method, path, { token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const canHaveBody = !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());

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

/** `YYYY-MM-DD`. */
function isoDate(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Batas bulan seperti `monthRange` di klien: atasnya selalu `31`. */
function monthBounds(year, month) {
  return { from: isoDate(year, month, 1), to: isoDate(year, month, 31) };
}

/** Hari Senin–Jumat pertama pada bulan itu. */
function firstWeekday(year, month) {
  for (let day = 1; day <= 7; day += 1) {
    const dow = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    if (dow >= 1 && dow <= 5) return isoDate(year, month, day);
  }
  return isoDate(year, month, 1);
}

function shiftMonth(year, month, delta) {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

/** Pembanding kelas alami — sama dengan `compareClassNames` di server. */
const compareClassNames = (a, b) => a.localeCompare(b, "id", { numeric: true });

// ── Setup ─────────────────────────────────────────────────────

const adminLogin = await call("POST", "/auth/login", { body: ADMIN });
const adminToken = adminLogin.data?.token;
const parentLogin = await call("POST", "/auth/login", { body: PARENT });
const parentToken = parentLogin.data?.token;

section("0. Persiapan");
check("login admin berhasil", Boolean(adminToken), `status ${adminLogin.status}`);
check("login orang tua berhasil", Boolean(parentToken), `status ${parentLogin.status}`);

if (!adminToken || !parentToken) {
  console.log("\nToken tidak tersedia — hentikan.");
  process.exit(1);
}

// ── 1. Token & validasi parameter ─────────────────────────────

section("1. Token & validasi parameter");
const noAuth = await call("GET", "/schedules/petugas?from=2026-09-01&to=2026-09-30");
check("tanpa token ditolak 401", noAuth.status === 401, `status ${noAuth.status}`);

const noParams = await call("GET", "/schedules/petugas", { token: parentToken });
check("tanpa from/to ditolak 400", noParams.status === 400, `status ${noParams.status}`);

const badFormat = await call("GET", "/schedules/petugas?from=01-09-2026&to=30-09-2026", {
  token: parentToken,
});
check("format tanggal salah ditolak 400", badFormat.status === 400, `status ${badFormat.status}`);

const reversed = await call("GET", "/schedules/petugas?from=2026-09-30&to=2026-09-01", {
  token: parentToken,
});
check("from > to ditolak 400", reversed.status === 400, `status ${reversed.status}`);

const tooWide = await call("GET", "/schedules/petugas?from=2026-01-01&to=2026-12-31", {
  token: parentToken,
});
check("rentang > 92 hari ditolak 400", tooWide.status === 400, `status ${tooWide.status}`);

// ── 2. Bulan uji: bulan terakhir yang punya jadwal terbit ─────

section("2. Mencari bulan dengan jadwal terbit");
const now = new Date();
let cursor = { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
let target = null;

for (let step = 0; step < 13 && !target; step += 1) {
  const res = await call(
    "GET",
    `/schedules/month?year=${cursor.year}&month=${cursor.month}`,
    { token: parentToken },
  );
  // Minggu pertama sebuah bulan dimulai pada Senin — yang bisa jatuh di bulan
  // sebelumnya. Tanpa penyaring ini, Oktober 2026 tampak "punya jadwal" hanya
  // karena minggu pertamanya memuat 28–30 September.
  const prefix = `${cursor.year}-${String(cursor.month).padStart(2, "0")}-`;
  const days = (res.data?.weeks ?? [])
    .flatMap((week) => week.days)
    .filter((day) => day.scheduleId !== null && day.date.startsWith(prefix));
  if (days.length > 0) target = { ...cursor, days };
  else cursor = shiftMonth(cursor.year, cursor.month, -1);
}

check("ada bulan dengan jadwal terbit di DB lokal", target !== null);

if (!target) {
  console.log("\nTidak ada jadwal terbit — hentikan.");
  process.exit(1);
}
console.log(`  → memakai ${target.month}/${target.year} (${target.days.length} hari terbit)`);

const bounds = monthBounds(target.year, target.month);

// ── 3. Bentuk jawaban & urutan ────────────────────────────────

section("3. Bentuk jawaban & urutan");
const list = await call(
  "GET",
  `/schedules/petugas?from=${bounds.from}&to=${bounds.to}`,
  { token: parentToken },
);
check("orang tua 200 OK", list.status === 200, `status ${list.status}`);
check("ada larik `dates`", Array.isArray(list.data?.dates));

const dates = list.data?.dates ?? [];
check("ada setidaknya satu tanggal", dates.length > 0, `jumlah: ${dates.length}`);

// `[].every(…)` bernilai `true`, jadi setiap pemeriksaan di bawah ini
// mensyaratkan `dates.length > 0` lebih dulu — kalau tidak, jawaban kosong
// akan lulus semua tanpa membuktikan apa pun.
check(
  "tanggal urut menaik",
  dates.length > 0 &&
    dates.every((entry, index) => index === 0 || dates[index - 1].date < entry.date),
);

check(
  "setiap tanggal memuat kelas dengan nama teks & penanda klaim",
  dates.length > 0 &&
    dates.every(
      (entry) =>
        Array.isArray(entry.classes) &&
        entry.classes.length > 0 &&
        entry.classes.every(
          (row) =>
            typeof row.className === "string" &&
            row.className.length > 0 &&
            typeof row.claimed === "boolean",
        ),
    ),
);

check(
  "kelas urut alami, bukan abjad (\"2\" sebelum \"10\")",
  dates.length > 0 &&
    dates.every((entry) => {
      const names = entry.classes.map((row) => row.className);
      return JSON.stringify(names) === JSON.stringify([...names].sort(compareClassNames));
    }),
);

// ── 4. Cakupan lintas kelas ───────────────────────────────────

section("4. Cakupan lintas kelas");
const widest = dates.reduce(
  (best, entry) => (entry.classes.length > (best?.classes.length ?? 0) ? entry : best),
  null,
);
check(
  "satu tanggal memuat lebih dari satu kelas",
  (widest?.classes.length ?? 0) > 1,
  `kelas terbanyak: ${widest?.classes.length}`,
);
check(
  "jawaban memuat kelas si pemanggil juga (penyaringan kelas sendiri urusan UI)",
  widest?.classes.some((row) => row.className === "1") === true,
  JSON.stringify(widest?.classes.map((row) => row.className)),
);
check(
  "jumlah kelas tidak melebihi kelas yang dikenal sistem",
  (widest?.classes.length ?? 0) <= 12,
  `jumlah: ${widest?.classes.length ?? 0}`,
);

// ── 5. Jadwal draft tidak bocor ───────────────────────────────

section("5. Jadwal draft tidak bocor ke jalur ini");
// Bulan berikutnya hampir selalu belum dijadwalkan, jadi aman untuk fixture.
const probeMonth = shiftMonth(target.year, target.month, 1);
const probeDate = firstWeekday(probeMonth.year, probeMonth.month);
let probeId = null;

try {
  const created = await call("POST", "/schedules", {
    token: adminToken,
    body: { scheduleDate: probeDate, className: "1" },
  });

  if (created.status !== 201) {
    skip(
      "baris draft tidak muncul di /schedules/petugas",
      `fixture tidak bisa dibuat (status ${created.status}) — tanggal ${probeDate} mungkin sudah terisi`,
    );
  } else {
    probeId = created.data?.scheduleId ?? null;
    check("fixture draft terbuat", probeId !== null, `id: ${probeId}`);
    check(
      "fixture benar-benar draft",
      created.data?.status === "draft",
      `status: ${created.data?.status}`,
    );

    const asParent = await call(
      "GET",
      `/schedules/petugas?from=${probeDate}&to=${probeDate}`,
      { token: parentToken },
    );
    check(
      "baris draft tidak muncul untuk orang tua",
      (asParent.data?.dates ?? []).length === 0,
      JSON.stringify(asParent.data?.dates),
    );

    const asAdmin = await call(
      "GET",
      `/schedules/petugas?from=${probeDate}&to=${probeDate}`,
      { token: adminToken },
    );
    check(
      "baris draft juga tidak muncul untuk admin lewat jalur ini",
      (asAdmin.data?.dates ?? []).length === 0,
      JSON.stringify(asAdmin.data?.dates),
    );
  }
} finally {
  if (probeId !== null) {
    const removed = await call("DELETE", `/schedules/${probeId}`, { token: adminToken });
    check("baris uji dibersihkan kembali", removed.status === 200, `status ${removed.status}`);

    const afterCleanup = await call(
      "GET",
      `/schedules/petugas?from=${probeDate}&to=${probeDate}`,
      { token: parentToken },
    );
    check(
      "setelah dibersihkan, tanggal itu tetap kosong",
      (afterCleanup.data?.dates ?? []).length === 0,
    );
  }
}

// ── Ringkasan ─────────────────────────────────────────────────

console.log(`\n${"─".repeat(48)}`);
console.log(`LULUS: ${pass}   GAGAL: ${fail}`);
if (fail > 0) {
  console.log(`\nGagal:`);
  for (const name of failures) console.log(`  - ${name}`);
}
process.exit(fail > 0 ? 1 : 0);
