/**
 * Uji end-to-end API Pizza Snack Play.
 *
 * Prasyarat: dev server berjalan (`bun run dev`) dan database lokal
 * sudah dimigrasi + di-seed:
 *   bun run db:migrate:local && bun run db:seed && bun run db:seed:local
 *
 * Jalankan: bun run test:api
 */

const BASE = "http://localhost:5173/api";
const ADMIN = { username: "admin", password: "snack123" };
const PARENT = { username: "sari", password: "snack123" };
/** Korlas kelas 1 — orang tua yang ditunjuk sebagai koordinator kelas. */
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

  // GET/HEAD/OPTIONS tidak boleh menyertakan body.
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

// ── Setup: ambil token ────────────────────────────────────────

const adminLogin = await call("POST", "/auth/login", { body: ADMIN });
const adminToken = adminLogin.data?.token;

const parentLogin = await call("POST", "/auth/login", { body: PARENT });
const parentToken = parentLogin.data?.token;

section("0. Persiapan");
check(
  "login admin berhasil",
  Boolean(adminToken),
  `status ${adminLogin.status}`,
);
check(
  "login orang tua berhasil",
  Boolean(parentToken),
  `status ${parentLogin.status}`,
);

if (!adminToken || !parentToken) {
  console.log(
    "\nTidak bisa melanjutkan tanpa token. Pastikan server & seed siap.",
  );
  process.exit(1);
}

// ── 1. Jadwal ─────────────────────────────────────────────────

section("1. Jadwal — hari ini");
{
  const r = await call("GET", "/schedules/today", { token: parentToken });
  check("GET /schedules/today -> 200", r.status === 200, `got ${r.status}`);
  check(
    "ada objek day",
    Boolean(r.data?.day?.date),
    JSON.stringify(r.data)?.slice(0, 120),
  );
  check(
    "ada objek week dengan 5 hari",
    r.data?.week?.days?.length === 5,
    `days=${r.data?.week?.days?.length}`,
  );
  check(
    // `todayInWib()` boleh jatuh di akhir pekan — itu bukan kegagalan.
    // Yang diuji adalah `dayOfWeek` konsisten dengan nama harinya.
    // Catatan: `dayOfWeek` menormalkan Minggu menjadi **7** (bukan 0),
    // sesuai konvensi ISO 1=Senin … 7=Minggu.
    "dayOfWeek cocok dengan nama hari",
    r.data?.day?.dayOfWeek === 7
      ? r.data?.day?.dayName === "Minggu"
      : r.data?.day?.dayOfWeek === 6
        ? r.data?.day?.dayName === "Sabtu"
        : r.data?.day?.dayOfWeek >= 1 && r.data?.day?.dayOfWeek <= 5,
    `dayOfWeek=${r.data?.day?.dayOfWeek} dayName=${r.data?.day?.dayName}`,
  );
}

section("2. Jadwal — Sepekan");
{
  const r = await call("GET", "/schedules/week?date=2026-09-01", {
    token: parentToken,
  });
  check("GET /schedules/week -> 200", r.status === 200, `got ${r.status}`);
  check(
    "rentang minggu 2026-08-31 s/d 2026-09-04",
    r.data?.startDate === "2026-08-31" && r.data?.endDate === "2026-09-04",
    `${r.data?.startDate}..${r.data?.endDate}`,
  );
  check(
    "label minggu terisi",
    typeof r.data?.label === "string" && r.data.label.length > 0,
    r.data?.label,
  );
  check(
    "hari pertama = Senin",
    r.data?.days?.[0]?.dayName === "Senin",
    r.data?.days?.[0]?.dayName,
  );

  const selasa = r.data?.days?.[1];
  check(
    "Selasa 1 Sep punya menu",
    Boolean(selasa?.menu?.name),
    JSON.stringify(selasa)?.slice(0, 120),
  );
  check(
    "menu punya komponen",
    (selasa?.menu?.items?.length ?? 0) > 0,
    `items=${selasa?.menu?.items?.length}`,
  );
}

section("3. Jadwal — bulanan");
{
  const r = await call("GET", "/schedules/month?year=2026&month=9", {
    token: parentToken,
  });
  check("GET /schedules/month -> 200", r.status === 200, `got ${r.status}`);
  check(
    "nama bulan = September",
    r.data?.monthName === "September",
    r.data?.monthName,
  );
  check(
    "ada 5 minggu",
    r.data?.weeks?.length === 5,
    `weeks=${r.data?.weeks?.length}`,
  );
  check(
    "total hari = 25 (5 minggu x 5 hari)",
    r.data?.weeks?.reduce((sum, w) => sum + w.days.length, 0) === 25,
  );
}

section("4. Jadwal — Agustus (termasuk libur)");
{
  const r = await call("GET", "/schedules/month?year=2026&month=8", {
    token: parentToken,
  });
  check("GET bulan Agustus -> 200", r.status === 200, `got ${r.status}`);

  const allDays = (r.data?.weeks ?? []).flatMap((w) => w.days);
  const holiday = allDays.find((d) => d.date === "2026-08-17");
  check(
    "17 Agustus 2026 ada di data",
    Boolean(holiday),
    "tanggal tidak ditemukan",
  );
  check(
    "17 Agustus ditandai libur",
    holiday?.isHoliday === true,
    JSON.stringify(holiday)?.slice(0, 120),
  );
  check("hari libur tidak punya menu", holiday?.menu === null);
}

section("5. Jadwal — rentang & validasi");
{
  const ok = await call(
    "GET",
    "/schedules/range?from=2026-09-01&to=2026-09-07",
    { token: parentToken },
  );
  check("GET /schedules/range -> 200", ok.status === 200, `got ${ok.status}`);
  check("7 hari terisi", ok.data?.length === 7, `len=${ok.data?.length}`);

  const bad = await call("GET", "/schedules/range?from=2026-09-01", {
    token: parentToken,
  });
  check("range tanpa `to` -> 400", bad.status === 400, `got ${bad.status}`);

  const tooLong = await call(
    "GET",
    "/schedules/range?from=2026-01-01&to=2026-12-31",
    { token: parentToken },
  );
  check(
    "range > 92 hari -> 400",
    tooLong.status === 400,
    `got ${tooLong.status}`,
  );

  const badMonth = await call("GET", "/schedules/month?year=2026&month=13", {
    token: parentToken,
  });
  check("bulan 13 -> 400", badMonth.status === 400, `got ${badMonth.status}`);
}

// ── 2. Katalog ────────────────────────────────────────────────

section("6. Kategori");
{
  const r = await call("GET", "/categories", { token: parentToken });
  check("GET /categories -> 200", r.status === 200, `got ${r.status}`);
  check("kategori terisi", (r.data?.length ?? 0) > 0, `len=${r.data?.length}`);
  check("kategori punya slug", Boolean(r.data?.[0]?.slug));
}

section("7. Menu");
{
  const r = await call("GET", "/menus", { token: parentToken });
  check("GET /menus -> 200", r.status === 200, `got ${r.status}`);
  check(
    "menu terisi (42 dari seed)",
    r.data?.length === 42,
    `len=${r.data?.length}`,
  );

  const withItems = (r.data ?? []).filter((m) => (m.items?.length ?? 0) > 0);
  check(
    "semua menu punya komponen",
    withItems.length === r.data?.length,
    `${withItems.length}/${r.data?.length}`,
  );

  const first = r.data?.[0];
  const detail = await call("GET", `/menus/${first?.id}`, {
    token: parentToken,
  });
  check("GET /menus/:id -> 200", detail.status === 200, `got ${detail.status}`);
  check("detail menu cocok", detail.data?.id === first?.id);

  const types = await call("GET", "/menus/item-types", { token: parentToken });
  check(
    "GET /menus/item-types -> 200",
    types.status === 200,
    `got ${types.status}`,
  );
  check(
    "ada 4 jenis komponen",
    types.data?.length === 4,
    `len=${types.data?.length}`,
  );
}

// ── 3. RBAC ───────────────────────────────────────────────────

section("8. RBAC — orang tua ditolak di endpoint admin");
{
  // Seluruh operasi tulis harus ditolak, bukan hanya POST.
  const cases = [
    ["GET", "/parents"],
    ["GET", "/stats/summary"],
    ["POST", "/menus"],
    ["PUT", "/menus/1"],
    ["DELETE", "/menus/1"],
    ["POST", "/categories"],
    ["PUT", "/categories/1"],
    ["DELETE", "/categories/1"],
    ["POST", "/schedules"],
    ["PUT", "/schedules/1"],
    ["DELETE", "/schedules/1"],
    ["POST", "/schedules/copy"],
    ["POST", "/holidays"],
    ["DELETE", "/holidays/1"],
    ["POST", "/parents"],
    ["PUT", "/parents/1"],
    ["DELETE", "/parents/1"],
  ];

  for (const [method, path] of cases) {
    const r = await call(method, path, { token: parentToken, body: {} });
    check(
      `${method} ${path} sebagai orang tua -> 403`,
      r.status === 403,
      `got ${r.status}`,
    );
  }

  // Bukti tambahan: percobaan tulis benar-benar tidak mengubah data.
  const before = await call("GET", "/menus/1", { token: adminToken });
  await call("PUT", "/menus/1", {
    token: parentToken,
    body: { name: "DIUBAH ORANG TUA" },
  });
  const after = await call("GET", "/menus/1", { token: adminToken });
  check(
    "nama menu tidak berubah setelah percobaan orang tua",
    before.data?.name === after.data?.name,
    `${before.data?.name} -> ${after.data?.name}`,
  );

  const catBefore = await call("GET", "/categories", { token: adminToken });
  await call("DELETE", "/categories/1", { token: parentToken });
  const catAfter = await call("GET", "/categories", { token: adminToken });
  check(
    "jumlah kategori tidak berubah setelah percobaan orang tua",
    catBefore.data?.length === catAfter.data?.length,
    `${catBefore.data?.length} -> ${catAfter.data?.length}`,
  );

  // Orang tua tetap boleh membaca katalog (dipakai halaman Menu & jadwal).
  for (const path of ["/menus", "/categories", "/menus/item-types"]) {
    const r = await call("GET", path, { token: parentToken });
    check(
      `GET ${path} sebagai orang tua -> 200`,
      r.status === 200,
      `got ${r.status}`,
    );
  }
}

section("9. RBAC — tanpa token");
{
  const cases = [
    ["GET", "/schedules/today"],
    ["GET", "/menus"],
    ["GET", "/categories"],
    ["GET", "/parents"],
    ["GET", "/stats/summary"],
  ];

  for (const [method, path] of cases) {
    const r = await call(method, path);
    check(
      `${method} ${path} tanpa token -> 401`,
      r.status === 401,
      `got ${r.status}`,
    );
  }
}

// ── 4. Statistik ──────────────────────────────────────────────

section("10. Statistik dashboard");
{
  const r = await call("GET", "/stats/summary", { token: adminToken });
  check("GET /stats/summary -> 200", r.status === 200, `got ${r.status}`);
  // Jumlahnya mengikuti daftar wali murid di seed, jadi yang diuji adalah
  // semua orang tua tercatat dan aktif — bukan angka tetap.
  check(
    "ada orang tua tercatat",
    r.data?.parents?.total >= 3,
    `total=${r.data?.parents?.total}`,
  );
  check(
    "semua orang tua aktif",
    r.data?.parents?.active === r.data?.parents?.total,
    `active=${r.data?.parents?.active} total=${r.data?.parents?.total}`,
  );
  check(
    "42 menu",
    r.data?.menus?.total === 42,
    `total=${r.data?.menus?.total}`,
  );
  check(
    "ada hari libur tercatat",
    r.data?.schedules?.holidays >= 1,
    `holidays=${r.data?.schedules?.holidays}`,
  );
  check(
    "currentWeek terisi",
    Boolean(r.data?.currentWeek?.label),
    r.data?.currentWeek?.label,
  );
  check(
    "today terisi",
    Boolean(r.data?.today?.date),
    JSON.stringify(r.data?.today),
  );
  check(
    "today merangkum menu & jumlah kelas",
    Array.isArray(r.data?.today?.menuNames) &&
      Number.isInteger(r.data?.today?.classCount),
    JSON.stringify(r.data?.today),
  );
}

// ── 5. CRUD admin ─────────────────────────────────────────────

section("11. CRUD menu (admin)");
{
  const created = await call("POST", "/menus", {
    token: adminToken,
    body: {
      name: `Menu Uji ${Date.now()}`,
      description: "Dibuat oleh test suite",
      items: [
        { name: "Nasi uduk", itemType: "main" },
        { name: "Pisang", itemType: "fruit" },
      ],
    },
  });
  check("POST /menus -> 201", created.status === 201, `got ${created.status}`);
  const menuId = created.data?.id;
  check(
    "menu baru punya 2 komponen",
    created.data?.items?.length === 2,
    `items=${created.data?.items?.length}`,
  );

  const updated = await call("PUT", `/menus/${menuId}`, {
    token: adminToken,
    body: {
      description: "Deskripsi diperbarui",
      items: [{ name: "Hanya satu", itemType: "main" }],
    },
  });
  check(
    "PUT /menus/:id -> 200",
    updated.status === 200,
    `got ${updated.status}`,
  );
  check(
    "deskripsi berubah",
    updated.data?.description === "Deskripsi diperbarui",
    updated.data?.description,
  );
  check(
    "komponen diganti jadi 1",
    updated.data?.items?.length === 1,
    `items=${updated.data?.items?.length}`,
  );

  const dup = await call("POST", "/menus", {
    token: adminToken,
    body: { name: updated.data?.name, items: [{ name: "x" }] },
  });
  check("nama menu duplikat -> 409", dup.status === 409, `got ${dup.status}`);

  const noItems = await call("POST", "/menus", {
    token: adminToken,
    body: { name: `Kosong ${Date.now()}`, items: [] },
  });
  check(
    "menu tanpa komponen -> 400",
    noItems.status === 400,
    `got ${noItems.status}`,
  );

  const removed = await call("DELETE", `/menus/${menuId}`, {
    token: adminToken,
  });
  check(
    "DELETE /menus/:id -> 200",
    removed.status === 200,
    `got ${removed.status}`,
  );

  const gone = await call("GET", `/menus/${menuId}`, { token: adminToken });
  check("menu terhapus -> 404", gone.status === 404, `got ${gone.status}`);
}

section("12. CRUD kategori (admin)");
{
  const created = await call("POST", "/categories", {
    token: adminToken,
    body: { name: `Kategori Uji ${Date.now()}`, color: "#123456" },
  });
  check(
    "POST /categories -> 201",
    created.status === 201,
    `got ${created.status}`,
  );
  check(
    "slug dibuat otomatis",
    Boolean(created.data?.slug),
    created.data?.slug,
  );
  check(
    "warna tersimpan",
    created.data?.color === "#123456",
    created.data?.color,
  );

  const badColor = await call("POST", "/categories", {
    token: adminToken,
    body: { name: `Warna Salah ${Date.now()}`, color: "biru" },
  });
  check(
    "warna bukan hex -> 400",
    badColor.status === 400,
    `got ${badColor.status}`,
  );

  const removed = await call("DELETE", `/categories/${created.data?.id}`, {
    token: adminToken,
  });
  check(
    "DELETE /categories/:id -> 200",
    removed.status === 200,
    `got ${removed.status}`,
  );
}

section("13. CRUD jadwal (admin)");
{
  const date = "2026-10-05"; // Senin
  const CLASS = "1";

  // Bersihkan sisa uji pada tanggal ini untuk kedua kelas yang dipakai.
  // Baris yang sudah `locked`/`published` wajib dibuka kuncinya lebih dulu —
  // tanpa itu DELETE dijawab 409 dan sisa uji akan menggagalkan pembuatan.
  for (const cls of [CLASS, "2"]) {
    const rows = await call(
      "GET",
      `/schedules/range?from=${date}&to=${date}&class=${cls}`,
      { token: adminToken },
    );
    const leftoverId = rows.data?.[0]?.scheduleId;
    if (leftoverId) {
      await call("POST", `/schedules/${leftoverId}/unlock`, {
        token: adminToken,
      });
      await call("DELETE", `/schedules/${leftoverId}`, { token: adminToken });
    }
  }

  const menus = await call("GET", "/menus?active=true", { token: adminToken });
  const menuId = menus.data?.[0]?.id;

  // Admin wajib menyebut kelas agar tidak salah tulis ke kelas lain.
  const noClass = await call("POST", "/schedules", {
    token: adminToken,
    body: { scheduleDate: date, menuId },
  });
  check(
    "admin tanpa `className` -> 400",
    noClass.status === 400,
    `got ${noClass.status}`,
  );

  const created = await call("POST", "/schedules", {
    token: adminToken,
    body: {
      scheduleDate: date,
      className: CLASS,
      menuId,
      notes: "Dibuat test",
    },
  });
  check(
    "POST /schedules -> 201",
    created.status === 201,
    `got ${created.status}`,
  );
  check("tanggal sesuai", created.data?.date === date, created.data?.date);
  check(
    "kelas tersimpan",
    created.data?.className === CLASS,
    created.data?.className,
  );
  check(
    "dayOfWeek = 1 (Senin)",
    created.data?.dayOfWeek === 1,
    `dow=${created.data?.dayOfWeek}`,
  );
  check("menu terpasang", created.data?.menu?.id === menuId);
  check(
    "notes tersimpan",
    created.data?.notes === "Dibuat test",
    created.data?.notes,
  );

  const scheduleId = created.data?.scheduleId;

  const dup = await call("POST", "/schedules", {
    token: adminToken,
    body: { scheduleDate: date, className: CLASS, menuId },
  });
  check("tanggal + kelas sama -> 409", dup.status === 409, `got ${dup.status}`);

  // Keunikan komposit: tanggal sama boleh dipakai kelas lain.
  const otherClass = await call("POST", "/schedules", {
    token: adminToken,
    body: { scheduleDate: date, className: "2", menuId },
  });
  check(
    "tanggal sama, kelas berbeda -> 201",
    otherClass.status === 201,
    `got ${otherClass.status}`,
  );

  const badDate = await call("POST", "/schedules", {
    token: adminToken,
    body: { scheduleDate: "05-10-2026", className: CLASS, menuId },
  });
  check(
    "format tanggal salah -> 400",
    badDate.status === 400,
    `got ${badDate.status}`,
  );

  const asHoliday = await call("PUT", `/schedules/${scheduleId}`, {
    token: adminToken,
    body: { isHoliday: true },
  });
  check(
    "PUT jadwal jadi libur -> 200",
    asHoliday.status === 200,
    `got ${asHoliday.status}`,
  );
  check(
    "libur menghapus menu",
    asHoliday.data?.menu === null,
    JSON.stringify(asHoliday.data?.menu),
  );

  const removed = await call("DELETE", `/schedules/${scheduleId}`, {
    token: adminToken,
  });
  check(
    "DELETE /schedules/:id -> 200",
    removed.status === 200,
    `got ${removed.status}`,
  );

  // Bersihkan baris kelas lain yang dibuat di atas.
  await call("DELETE", `/schedules/${otherClass.data?.scheduleId}`, {
    token: adminToken,
  });
}

section("14. Hari libur (admin)");
{
  const date = "2026-12-25";
  const list = await call("GET", `/holidays?from=${date}&to=${date}`, {
    token: adminToken,
  });
  for (const h of list.data ?? []) {
    await call("DELETE", `/holidays/${h.id}`, { token: adminToken });
  }

  const created = await call("POST", "/holidays", {
    token: adminToken,
    body: { date, name: "Hari Natal", description: "Libur nasional" },
  });
  check(
    "POST /holidays -> 201",
    created.status === 201,
    `got ${created.status}`,
  );

  const dup = await call("POST", "/holidays", {
    token: adminToken,
    body: { date, name: "Duplikat" },
  });
  check(
    "tanggal libur duplikat -> 409",
    dup.status === 409,
    `got ${dup.status}`,
  );

  const week = await call("GET", `/schedules/range?from=${date}&to=${date}`, {
    token: adminToken,
  });
  check(
    "hari libur muncul di jadwal",
    week.data?.[0]?.isHoliday === true,
    JSON.stringify(week.data?.[0])?.slice(0, 140),
  );
  check(
    "nama libur terbawa",
    week.data?.[0]?.holidayName === "Hari Natal",
    week.data?.[0]?.holidayName,
  );

  const removed = await call("DELETE", `/holidays/${created.data?.id}`, {
    token: adminToken,
  });
  check(
    "DELETE /holidays/:id -> 200",
    removed.status === 200,
    `got ${removed.status}`,
  );
}

section("15. CRUD orang tua (admin)");
{
  const username = `uji${Date.now().toString(36)}`;

  // ── 15a. Satu orang tua, dua anak ───────────────────────────
  const created = await call("POST", "/parents", {
    token: adminToken,
    body: {
      username,
      password: "rahasia123",
      parentName: "Ibu Uji",
      students: [
        { name: "Anak Uji A", className: "3" },
        { name: "Anak Uji B", className: "3B" },
      ],
      relationship: "ibu",
    },
  });
  check(
    "POST /parents -> 201",
    created.status === 201,
    `got ${created.status}`,
  );
  check(
    "username akun baru terbaca",
    created.data?.username === username,
    created.data?.username,
  );
  check(
    "dua anak tersimpan",
    created.data?.students?.length === 2,
    JSON.stringify(created.data?.students),
  );
  check(
    "anak pertama lengkap",
    created.data?.students?.[0]?.name === "Anak Uji A" &&
      created.data?.students?.[0]?.className === "3",
    JSON.stringify(created.data?.students?.[0]),
  );
  check(
    "anak kedua lengkap",
    created.data?.students?.[1]?.name === "Anak Uji B" &&
      created.data?.students?.[1]?.className === "3B",
    JSON.stringify(created.data?.students?.[1]),
  );
  const parentId = created.data?.id;
  const firstStudentId = created.data?.students?.[0]?.id;

  // ── 15b. Validasi input ─────────────────────────────────────
  const dup = await call("POST", "/parents", {
    token: adminToken,
    body: {
      username,
      password: "rahasia123",
      parentName: "Duplikat",
      students: [{ name: "Anak" }],
    },
  });
  check("username duplikat -> 409", dup.status === 409, `got ${dup.status}`);

  const badUser = await call("POST", "/parents", {
    token: adminToken,
    body: {
      username: "AB",
      password: "rahasia123",
      parentName: "x",
      students: [{ name: "y" }],
    },
  });
  check(
    "username terlalu pendek -> 400",
    badUser.status === 400,
    `got ${badUser.status}`,
  );

  const shortPw = await call("POST", "/parents", {
    token: adminToken,
    body: {
      username: `p${Date.now().toString(36)}`,
      password: "123",
      parentName: "x",
      students: [{ name: "y" }],
    },
  });
  check(
    "password < 8 karakter -> 400",
    shortPw.status === 400,
    `got ${shortPw.status}`,
  );

  const noStudents = await call("POST", "/parents", {
    token: adminToken,
    body: {
      username: `n${Date.now().toString(36)}`,
      password: "rahasia123",
      parentName: "x",
    },
  });
  check(
    "`students` tidak dikirim -> 400",
    noStudents.status === 400,
    `got ${noStudents.status}`,
  );

  const emptyStudents = await call("POST", "/parents", {
    token: adminToken,
    body: {
      username: `e${Date.now().toString(36)}`,
      password: "rahasia123",
      parentName: "x",
      students: [],
    },
  });
  check(
    "`students` kosong -> 400",
    emptyStudents.status === 400,
    `got ${emptyStudents.status}`,
  );

  const blankStudent = await call("POST", "/parents", {
    token: adminToken,
    body: {
      username: `b${Date.now().toString(36)}`,
      password: "rahasia123",
      parentName: "x",
      students: [{ name: "   " }],
    },
  });
  check(
    "nama anak hanya spasi -> 400",
    blankStudent.status === 400,
    `got ${blankStudent.status}`,
  );

  const badRelationship = await call("POST", "/parents", {
    token: adminToken,
    body: {
      username: `r${Date.now().toString(36)}`,
      password: "rahasia123",
      parentName: "x",
      students: [{ name: "y" }],
      relationship: "kakek",
    },
  });
  check(
    "hubungan tidak dikenal -> 400",
    badRelationship.status === 400,
    `got ${badRelationship.status}`,
  );

  // ── 15c. Daftar & pencarian ─────────────────────────────────
  const list = await call("GET", `/parents?search=${username}`, {
    token: adminToken,
  });
  check(
    "pencarian menemukan akun baru",
    list.data?.items?.length === 1,
    `found=${list.data?.items?.length}`,
  );
  check("total terisi", list.data?.total === 1, `total=${list.data?.total}`);
  check(
    "daftar memuat kedua anak",
    list.data?.items?.[0]?.students?.length === 2,
    JSON.stringify(list.data?.items?.[0]?.students),
  );

  const searchByChild = await call(
    "GET",
    `/parents?search=${encodeURIComponent("Anak Uji B")}`,
    {
      token: adminToken,
    },
  );
  check(
    "pencarian lewat nama anak menemukan orang tua",
    searchByChild.data?.items?.some((item) => item.id === parentId),
    `found=${searchByChild.data?.items?.length}`,
  );
  check(
    "tidak ada baris ganda saat cocok 1 anak",
    searchByChild.data?.items?.filter((item) => item.id === parentId).length ===
      1,
    JSON.stringify(searchByChild.data?.items?.map((item) => item.id)),
  );

  const searchByClass = await call("GET", "/parents?search=3B", {
    token: adminToken,
  });
  check(
    "pencarian lewat kelas anak berhasil",
    searchByClass.data?.items?.some((item) => item.id === parentId),
    `found=${searchByClass.data?.items?.length}`,
  );

  // ── 15d. Login mengembalikan seluruh anak ───────────────────
  const login = await call("POST", "/auth/login", {
    body: { username, password: "rahasia123" },
  });
  check("akun baru bisa login", login.status === 200, `got ${login.status}`);
  check(
    "profil memuat dua anak",
    login.data?.user?.students?.length === 2,
    JSON.stringify(login.data?.user?.students),
  );
  check(
    "hubungan terbawa",
    login.data?.user?.relationship === "ibu",
    login.data?.user?.relationship,
  );

  // ── 15e. Update mengganti daftar anak ───────────────────────
  const updated = await call("PUT", `/parents/${parentId}`, {
    token: adminToken,
    body: {
      parentName: "Ibu Uji Revisi",
      students: [
        { id: firstStudentId, name: "Anak Uji A Revisi", className: "4C" },
        { name: "Anak Uji C", className: "5D" },
      ],
    },
  });
  check(
    "PUT /parents/:id -> 200",
    updated.status === 200,
    `got ${updated.status}`,
  );
  check(
    "nama orang tua berubah",
    updated.data?.parentName === "Ibu Uji Revisi",
    updated.data?.parentName,
  );
  check(
    "anak lama diperbarui di tempat",
    updated.data?.students?.[0]?.id === firstStudentId &&
      updated.data?.students?.[0]?.name === "Anak Uji A Revisi" &&
      updated.data?.students?.[0]?.className === "4C",
    JSON.stringify(updated.data?.students?.[0]),
  );
  check(
    "anak baru ditambahkan",
    updated.data?.students?.[1]?.name === "Anak Uji C" &&
      updated.data?.students?.[1]?.className === "5D",
    JSON.stringify(updated.data?.students?.[1]),
  );
  check(
    "anak yang tidak disebut lagi terhapus",
    updated.data?.students?.length === 2,
    JSON.stringify(updated.data?.students),
  );

  // Ganti daftar jadi satu anak saja → anak kedua harus hilang.
  const narrowed = await call("PUT", `/parents/${parentId}`, {
    token: adminToken,
    body: {
      students: [
        { id: firstStudentId, name: "Anak Uji A Revisi", className: "4C" },
      ],
    },
  });
  check(
    "menyusutkan daftar anak -> 200",
    narrowed.status === 200,
    `got ${narrowed.status}`,
  );
  check(
    "daftar anak jadi satu",
    narrowed.data?.students?.length === 1,
    JSON.stringify(narrowed.data?.students),
  );

  const detail = await call("GET", `/parents/${parentId}`, {
    token: adminToken,
  });
  check(
    "detail konsisten dengan hasil update",
    detail.data?.students?.length === 1,
    JSON.stringify(detail.data?.students),
  );

  // ── 15f. ID anak milik orang tua lain tidak bisa dibajak ────
  const victimStudentId = parentLogin.data?.user?.students?.[0]?.id;
  const victimName = parentLogin.data?.user?.students?.[0]?.name;

  const hijack = await call("PUT", `/parents/${parentId}`, {
    token: adminToken,
    body: {
      students: [
        { id: firstStudentId, name: "Anak Uji A Revisi", className: "4C" },
        { id: victimStudentId, name: "Anak Curian", className: "6Z" },
      ],
    },
  });
  check(
    "ID anak orang lain ditolak sebagai update -> 200 (dibuat baru)",
    hijack.status === 200,
    `got ${hijack.status}`,
  );
  check(
    "ID anak orang lain tidak tercatat di akun ini",
    !hijack.data?.students?.some((student) => student.id === victimStudentId),
    JSON.stringify(hijack.data?.students?.map((student) => student.id)),
  );

  const victimAfter = await call("POST", "/auth/login", { body: PARENT });
  check(
    "data anak orang tua lain tidak berubah",
    victimAfter.data?.user?.students?.[0]?.id === victimStudentId &&
      victimAfter.data?.user?.students?.[0]?.name === victimName,
    JSON.stringify(victimAfter.data?.user?.students?.[0]),
  );

  // ── 15g. Update tidak boleh mengosongkan daftar anak ────────
  const emptied = await call("PUT", `/parents/${parentId}`, {
    token: adminToken,
    body: { students: [{ name: "   " }] },
  });
  check(
    "update dengan anak kosong -> 400",
    emptied.status === 400,
    `got ${emptied.status}`,
  );

  // ── 15h. Reset password & nonaktifkan ───────────────────────
  const reset = await call("POST", `/parents/${parentId}/reset-password`, {
    token: adminToken,
    body: { newPassword: "baru12345" },
  });
  check("reset password -> 200", reset.status === 200, `got ${reset.status}`);

  const loginNew = await call("POST", "/auth/login", {
    body: { username, password: "baru12345" },
  });
  check(
    "login dengan password baru",
    loginNew.status === 200,
    `got ${loginNew.status}`,
  );

  const deactivated = await call("DELETE", `/parents/${parentId}`, {
    token: adminToken,
  });
  check(
    "DELETE /parents/:id -> 200",
    deactivated.status === 200,
    `got ${deactivated.status}`,
  );
  check(
    "aksi = deactivated",
    deactivated.data?.action === "deactivated",
    deactivated.data?.action,
  );

  const loginOff = await call("POST", "/auth/login", {
    body: { username, password: "baru12345" },
  });
  check(
    "akun nonaktif tidak bisa login -> 401",
    loginOff.status === 401,
    `got ${loginOff.status}`,
  );

  const hard = await call("DELETE", `/parents/${parentId}?hard=true`, {
    token: adminToken,
  });
  check("hapus permanen -> 200", hard.status === 200, `got ${hard.status}`);
  check("aksi = deleted", hard.data?.action === "deleted", hard.data?.action);
}

// ── 6. Pencarian riwayat menu ─────────────────────────────────

section("16. Pencarian riwayat menu");
{
  const iso = (date) => date.toISOString().slice(0, 10);
  const from = iso(new Date(Date.now() - 180 * 86_400_000));
  const to = iso(new Date());
  const range = `from=${from}&to=${to}`;

  const noQuery = await call("GET", `/schedules/search?${range}`, {
    token: adminToken,
  });
  check("tanpa `q` -> 400", noQuery.status === 400, `got ${noQuery.status}`);

  const blankQuery = await call("GET", `/schedules/search?q=%20&${range}`, {
    token: adminToken,
  });
  check(
    "`q` hanya spasi -> 400",
    blankQuery.status === 400,
    `got ${blankQuery.status}`,
  );

  const noRange = await call("GET", "/schedules/search?q=jeruk", {
    token: adminToken,
  });
  check(
    "tanpa rentang -> 400",
    noRange.status === 400,
    `got ${noRange.status}`,
  );

  const reversed = await call(
    "GET",
    "/schedules/search?q=jeruk&from=2026-12-31&to=2026-01-01",
    { token: adminToken },
  );
  check(
    "rentang terbalik -> 400",
    reversed.status === 400,
    `got ${reversed.status}`,
  );

  const tooWide = await call(
    "GET",
    "/schedules/search?q=jeruk&from=2020-01-01&to=2026-01-01",
    { token: adminToken },
  );
  check(
    "rentang > 400 hari -> 400",
    tooWide.status === 400,
    `got ${tooWide.status}`,
  );

  const hit = await call("GET", `/schedules/search?q=jeruk&${range}`, {
    token: adminToken,
  });
  check(
    "GET /schedules/search -> 200",
    hit.status === 200,
    `got ${hit.status}`,
  );
  check("query di-echo", hit.data?.query === "jeruk", hit.data?.query);
  check(
    "ada hasil untuk 'jeruk'",
    (hit.data?.totalMatches ?? 0) > 0,
    `total=${hit.data?.totalMatches}`,
  );
  check(
    "totalMatches cocok dengan panjang matches",
    hit.data?.totalMatches === hit.data?.matches?.length,
    `total=${hit.data?.totalMatches} len=${hit.data?.matches?.length}`,
  );
  check(
    "hasil terurut menaik",
    (hit.data?.matches ?? []).every(
      (m, i, arr) => i === 0 || arr[i - 1].date <= m.date,
    ),
  );
  check(
    "satu tanggal hanya muncul sekali",
    new Set((hit.data?.matches ?? []).map((m) => m.date)).size ===
      hit.data?.matches?.length,
  );
  check(
    "setiap hasil membawa nama menu",
    (hit.data?.matches ?? []).every((m) => typeof m.menuName === "string"),
  );
  check(
    "'jeruk' terdeteksi sebagai komponen",
    (hit.data?.matches ?? []).some((m) =>
      m.matchedItems.some((item) => item.name.toLowerCase().includes("jeruk")),
    ),
  );
  check(
    "komponen hasil punya itemType valid",
    (hit.data?.matches ?? []).every((m) =>
      m.matchedItems.every((item) =>
        ["main", "fruit", "drink", "other"].includes(item.itemType),
      ),
    ),
  );

  const miss = await call("GET", `/schedules/search?q=zzz-tidak-ada&${range}`, {
    token: adminToken,
  });
  check(
    "kata kunci tanpa hasil -> totalMatches 0",
    miss.data?.totalMatches === 0,
    `total=${miss.data?.totalMatches}`,
  );

  // Wildcard LIKE harus diperlakukan sebagai karakter literal.
  const wildcard = await call("GET", `/schedules/search?q=%25&${range}`, {
    token: adminToken,
  });
  check(
    "'%' diperlakukan literal -> 0 hasil",
    wildcard.data?.totalMatches === 0,
    `total=${wildcard.data?.totalMatches}`,
  );

  const underscore = await call("GET", `/schedules/search?q=_&${range}`, {
    token: adminToken,
  });
  check(
    "'_' diperlakukan literal -> 0 hasil",
    underscore.data?.totalMatches === 0,
    `total=${underscore.data?.totalMatches}`,
  );

  const asParent = await call("GET", `/schedules/search?q=jeruk&${range}`, {
    token: parentToken,
  });
  check(
    "orang tua boleh mencari -> 200",
    asParent.status === 200,
    `got ${asParent.status}`,
  );

  const noToken = await call("GET", `/schedules/search?q=jeruk&${range}`);
  check("tanpa token -> 401", noToken.status === 401, `got ${noToken.status}`);
}

// ── 7. Duplikasi jadwal Sepekan ──────────────────────────

section("17. Duplikasi jadwal Sepekan");
{
  const isoDate = (date) => date.toISOString().slice(0, 10);

  /** Senin dari minggu yang memuat `base`, digeser `weeks` minggu. */
  function mondayOf(base, weeks) {
    const date = new Date(`${base}T00:00:00Z`);
    const dow = date.getUTCDay(); // 0 = Minggu
    date.setUTCDate(date.getUTCDate() + (dow === 0 ? 1 : 1 - dow) + weeks * 7);
    return isoDate(date);
  }

  const addDays = (value, days) =>
    isoDate(
      new Date(new Date(`${value}T00:00:00Z`).getTime() + days * 86_400_000),
    );

  // Tanggal jauh di masa depan agar tidak bertabrakan dengan data seed.
  const source = mondayOf("2031-06-15", 0);
  const target = mondayOf("2031-06-15", 1);

  /** Hapus semua jadwal pada minggu yang memuat `date` — agar uji idempoten. */
  async function clearWeek(date) {
    const week = await call("GET", `/schedules/week?date=${date}`, {
      token: adminToken,
    });
    for (const day of week.data?.days ?? []) {
      if (day.scheduleId) {
        await call("DELETE", `/schedules/${day.scheduleId}`, {
          token: adminToken,
        });
      }
    }
  }

  await clearWeek(source);
  await clearWeek(target);

  const menus = await call("GET", "/menus?active=true", { token: adminToken });
  const menuId = menus.data?.[0]?.id;
  check(
    "ada menu aktif untuk diuji",
    Number.isInteger(menuId),
    `menuId=${menuId}`,
  );

  // Sumber: Senin & Selasa saja.
  const createdA = await call("POST", "/schedules", {
    token: adminToken,
    body: { scheduleDate: source, className: "1", menuId },
  });
  const createdB = await call("POST", "/schedules", {
    token: adminToken,
    body: { scheduleDate: addDays(source, 1), className: "1", menuId },
  });
  check(
    "siapkan jadwal sumber Senin -> 201",
    createdA.status === 201,
    `got ${createdA.status}`,
  );
  check(
    "siapkan jadwal sumber Selasa -> 201",
    createdB.status === 201,
    `got ${createdB.status}`,
  );

  const sameWeek = await call("POST", "/schedules/copy", {
    token: adminToken,
    body: { fromDate: source, toDate: addDays(source, 2), className: "1" },
  });
  check(
    "minggu sumber = tujuan -> 400",
    sameWeek.status === 400,
    `got ${sameWeek.status}`,
  );

  const badDate = await call("POST", "/schedules/copy", {
    token: adminToken,
    body: { fromDate: "bukan-tanggal", toDate: target, className: "1" },
  });
  check(
    "`fromDate` tidak valid -> 400",
    badDate.status === 400,
    `got ${badDate.status}`,
  );

  const asParentCopy = await call("POST", "/schedules/copy", {
    token: parentToken,
    body: { fromDate: source, toDate: target, className: "1" },
  });
  check(
    "orang tua ditolak -> 403",
    asParentCopy.status === 403,
    `got ${asParentCopy.status}`,
  );

  // Salin pertama: 2 dibuat, 3 dilewati (Rabu–Jumat tanpa sumber).
  const copy1 = await call("POST", "/schedules/copy", {
    token: adminToken,
    body: { fromDate: source, toDate: target, className: "1" },
  });
  check(
    "POST /schedules/copy -> 201",
    copy1.status === 201,
    `got ${copy1.status}`,
  );
  check(
    "created = 2",
    copy1.data?.created === 2,
    `created=${copy1.data?.created}`,
  );
  check(
    "updated = 0",
    copy1.data?.updated === 0,
    `updated=${copy1.data?.updated}`,
  );
  check(
    "skipped = 3",
    copy1.data?.skipped === 3,
    `skipped=${copy1.data?.skipped}`,
  );
  check(
    "ada label sumber & tujuan",
    Boolean(copy1.data?.sourceLabel && copy1.data?.targetLabel),
  );

  const targetWeek = await call("GET", `/schedules/week?date=${target}`, {
    token: adminToken,
  });
  check(
    "Senin tujuan terisi menu sumber",
    targetWeek.data?.days?.[0]?.menu?.id === menuId,
    `menuId=${targetWeek.data?.days?.[0]?.menu?.id}`,
  );
  check(
    "Selasa tujuan terisi menu sumber",
    targetWeek.data?.days?.[1]?.menu?.id === menuId,
    `menuId=${targetWeek.data?.days?.[1]?.menu?.id}`,
  );
  check(
    "Rabu tujuan tetap kosong",
    targetWeek.data?.days?.[2]?.scheduleId === null,
    `scheduleId=${targetWeek.data?.days?.[2]?.scheduleId}`,
  );

  // Salin kedua tanpa overwrite: semuanya dilewati.
  const copy2 = await call("POST", "/schedules/copy", {
    token: adminToken,
    body: { fromDate: source, toDate: target, className: "1" },
  });
  check(
    "salin ulang tanpa overwrite -> created 0",
    copy2.data?.created === 0,
    `created=${copy2.data?.created}`,
  );
  check(
    "salin ulang tanpa overwrite -> skipped 5",
    copy2.data?.skipped === 5,
    `skipped=${copy2.data?.skipped}`,
  );

  // Salin ketiga dengan overwrite.
  const copy3 = await call("POST", "/schedules/copy", {
    token: adminToken,
    body: { fromDate: source, toDate: target, className: "1", overwrite: true },
  });
  check(
    "overwrite -> updated 2",
    copy3.data?.updated === 2,
    `updated=${copy3.data?.updated}`,
  );
  check(
    "overwrite -> created 0",
    copy3.data?.created === 0,
    `created=${copy3.data?.created}`,
  );

  // Hari libur ikut tersalin, tetapi tanpa menu.
  const holidayDate = addDays(source, 2);
  await call("POST", "/schedules", {
    token: adminToken,
    body: {
      scheduleDate: holidayDate,
      className: "1",
      isHoliday: true,
      notes: "Libur uji",
    },
  });
  const copy4 = await call("POST", "/schedules/copy", {
    token: adminToken,
    body: { fromDate: source, toDate: target, className: "1" },
  });
  check(
    "hari libur ikut tersalin -> created 1",
    copy4.data?.created === 1,
    `created=${copy4.data?.created}`,
  );

  const afterHoliday = await call("GET", `/schedules/week?date=${target}`, {
    token: adminToken,
  });
  check(
    "Rabu tujuan jadi libur",
    afterHoliday.data?.days?.[2]?.isHoliday === true,
    `isHoliday=${afterHoliday.data?.days?.[2]?.isHoliday}`,
  );
  check(
    "hari libur tidak menyimpan menu",
    afterHoliday.data?.days?.[2]?.menu === null,
    JSON.stringify(afterHoliday.data?.days?.[2]?.menu),
  );
  check(
    "catatan ikut tersalin",
    afterHoliday.data?.days?.[2]?.notes === "Libur uji",
    afterHoliday.data?.days?.[2]?.notes,
  );

  // Bersihkan jejak uji.
  await clearWeek(source);
  await clearWeek(target);
  const cleaned = await call("GET", `/schedules/week?date=${target}`, {
    token: adminToken,
  });
  check(
    "pembersihan berhasil",
    (cleaned.data?.days ?? []).every((day) => day.scheduleId === null),
  );
}

// ── 6. Cakupan kelas & korlas ─────────────────────────────────

section("18. Cakupan kelas — daftar & pembatasan baca");
{
  const asAdmin = await call("GET", "/classes", { token: adminToken });
  check(
    "GET /classes sebagai admin -> 200",
    asAdmin.status === 200,
    `got ${asAdmin.status}`,
  );
  check(
    "admin melihat semua kelas",
    JSON.stringify(asAdmin.data?.classes) ===
      JSON.stringify(["1", "2", "3", "4", "5", "6"]),
    JSON.stringify(asAdmin.data?.classes),
  );

  // `sari` hanya punya anak di kelas 1.
  const asParent = await call("GET", "/classes", { token: parentToken });
  check(
    "orang tua hanya melihat kelas anaknya",
    JSON.stringify(asParent.data?.classes) === JSON.stringify(["1"]),
    JSON.stringify(asParent.data?.classes),
  );

  const ownClass = await call("GET", "/schedules/today?class=1", {
    token: parentToken,
  });
  check(
    "orang tua membaca kelas anaknya -> 200",
    ownClass.status === 200,
    `got ${ownClass.status}`,
  );
  check(
    "jadwal membawa nama kelas",
    ownClass.data?.day?.className === "1",
    ownClass.data?.day?.className,
  );

  const otherClass = await call("GET", "/schedules/today?class=2", {
    token: parentToken,
  });
  check(
    "orang tua membaca kelas lain -> 403",
    otherClass.status === 403,
    `got ${otherClass.status}`,
  );

  // Tanpa `class`, orang tua otomatis diarahkan ke kelas anaknya.
  const implicit = await call("GET", "/schedules/today", {
    token: parentToken,
  });
  check(
    "tanpa `class` -> kelas anaknya dipakai",
    implicit.data?.day?.className === "1",
    implicit.data?.day?.className,
  );
}

section("19. Korlas — jadwal kelasnya, kunci tetap admin");
{
  const korlasLogin = await call("POST", "/auth/login", { body: KORLAS });
  check(
    "login korlas -> 200",
    korlasLogin.status === 200,
    `got ${korlasLogin.status}`,
  );

  const korlasToken = korlasLogin.data?.token;
  // Kelas korlas dibaca dari profil, bukan di-hardcode — basis data lokal bisa
  // saja sudah diubah lewat halaman admin.
  const korlasClass = korlasLogin.data?.user?.className;
  check(
    "profil korlas membawa kelasnya",
    typeof korlasClass === "string" && korlasClass.length > 0,
    korlasClass,
  );
  check(
    "korlas tetap melihat anaknya",
    (korlasLogin.data?.user?.students?.length ?? 0) > 0,
    JSON.stringify(korlasLogin.data?.user?.students),
  );

  // Kelas lain — dipakai untuk menguji batas cakupan korlas.
  const allClasses = (await call("GET", "/classes", { token: adminToken })).data
    ?.classes ?? [];
  const otherClass =
    allClasses.find((cls) => cls !== korlasClass) ?? `${korlasClass}x`;

  // Korlas boleh **membaca** seluruh kelas seperti admin; yang tetap tertutup
  // adalah wewenang menulis kelas lain (diuji di bawah).
  const classes = await call("GET", "/classes", { token: korlasToken });
  check(
    "korlas melihat seluruh kelas seperti admin",
    JSON.stringify(classes.data?.classes) === JSON.stringify(allClasses),
    JSON.stringify(classes.data?.classes),
  );
  check(
    "kelas korlas sendiri menjadi pilihan default",
    classes.data?.default === korlasClass,
    `default=${classes.data?.default} kelas=${korlasClass}`,
  );

  const otherRead = await call("GET", `/schedules/today?class=${otherClass}`, {
    token: korlasToken,
  });
  check(
    "korlas membaca jadwal kelas lain -> 200",
    otherRead.status === 200,
    `got ${otherRead.status}`,
  );

  // ── Katalog menu tetap terpusat di admin (sekolah-wide) ──────
  const menu = await call("POST", "/menus", {
    token: korlasToken,
    body: {
      name: `Menu Korlas ${Date.now()}`,
      items: [{ name: "Risol korlas", itemType: "main" }],
    },
  });
  check(
    "korlas membuat menu -> 403",
    menu.status === 403,
    `got ${menu.status}`,
  );

  const category = await call("POST", "/categories", {
    token: korlasToken,
    body: { name: `Kategori Korlas ${Date.now()}` },
  });
  check(
    "korlas membuat kategori -> 403",
    category.status === 403,
    `got ${category.status}`,
  );

  // Admin menyiapkan dua menu sebagai bahan uji ganti-menu.
  const adminMenu = await call("POST", "/menus", {
    token: adminToken,
    body: {
      name: `Menu Uji Korlas ${Date.now()}`,
      items: [{ name: "Risol uji", itemType: "main" }],
    },
  });
  const menuId = adminMenu.data?.id;

  const adminMenu2 = await call("POST", "/menus", {
    token: adminToken,
    body: {
      name: `Menu Uji Korlas 2 ${Date.now()}`,
      items: [{ name: "Buah uji", itemType: "fruit" }],
    },
  });
  const secondMenuId = adminMenu2.data?.id;

  const from = "2032-03-01";
  const to = "2032-03-31";
  const month = { year: 2032, month: 3 };

  /** Hapus sisa uji pada rentang ini — buka kunci dulu bila perlu. */
  const cleanup = async () => {
    for (const cls of [korlasClass, otherClass]) {
      const rows = await call(
        "GET",
        `/schedules/range?from=${from}&to=${to}&class=${cls}`,
        { token: adminToken },
      );
      for (const day of rows.data ?? []) {
        if (!day.scheduleId) continue;
        await call("POST", `/schedules/${day.scheduleId}/unlock`, {
          token: adminToken,
        });
        await call("DELETE", `/schedules/${day.scheduleId}`, {
          token: adminToken,
        });
      }
    }
  };

  await cleanup();

  // ── Korlas menyusun jadwal kelasnya sendiri ──────────────────
  // Kelas korlas diisi otomatis — tidak perlu menyebut `className`.
  const ownCreate = await call("POST", "/schedules", {
    token: korlasToken,
    body: { scheduleDate: from, menuId },
  });
  check(
    "korlas membuat jadwal kelasnya -> 201",
    ownCreate.status === 201,
    `got ${ownCreate.status}`,
  );
  check(
    "kelas terisi otomatis",
    ownCreate.data?.className === korlasClass,
    ownCreate.data?.className,
  );
  const ownId = ownCreate.data?.scheduleId;

  // Mengganti menu pada tanggal itu (dropdown di halaman Jadwal).
  const ownMenuChange = await call("PUT", `/schedules/${ownId}`, {
    token: korlasToken,
    body: { menuId: secondMenuId },
  });
  check(
    "korlas mengganti menu jadwalnya -> 200",
    ownMenuChange.status === 200 && ownMenuChange.data?.menu?.id === secondMenuId,
    `got ${ownMenuChange.status} / menu ${ownMenuChange.data?.menu?.id}`,
  );

  const ownUpdate = await call("PUT", `/schedules/${ownId}`, {
    token: korlasToken,
    body: { notes: "Diubah korlas" },
  });
  check(
    "korlas mengubah jadwal kelasnya -> 200",
    ownUpdate.status === 200,
    `got ${ownUpdate.status}`,
  );

  const intact = await call("GET", `/schedules/${ownId}`, {
    token: adminToken,
  });
  check(
    "perubahan korlas tersimpan",
    intact.data?.notes === "Diubah korlas",
    intact.data?.notes,
  );

  // Salin Sepekan untuk kelasnya sendiri boleh.
  const copyOwn = await call("POST", "/schedules/copy", {
    token: korlasToken,
    body: { fromDate: from, toDate: "2032-03-08" },
  });
  check(
    "korlas menyalin minggu kelasnya -> 201",
    copyOwn.status === 201,
    `got ${copyOwn.status}`,
  );

  // ── Kelas lain tetap di luar jangkauan korlas ────────────────
  const otherWrite = await call("POST", "/schedules", {
    token: korlasToken,
    body: { scheduleDate: from, className: otherClass, menuId },
  });
  check(
    "korlas menulis kelas lain -> 403",
    otherWrite.status === 403,
    `got ${otherWrite.status}`,
  );

  const otherRow = await call("POST", "/schedules", {
    token: adminToken,
    body: { scheduleDate: from, className: otherClass, menuId },
  });
  check(
    "admin menyiapkan baris kelas lain -> 201",
    otherRow.status === 201,
    `got ${otherRow.status}`,
  );
  const otherId = otherRow.data?.scheduleId;

  const hijack = await call("PUT", `/schedules/${otherId}`, {
    token: korlasToken,
    body: { notes: "DIUBAH KORLAS" },
  });
  check(
    "korlas mengubah jadwal kelas lain -> 403",
    hijack.status === 403,
    `got ${hijack.status}`,
  );

  const otherIntact = await call("GET", `/schedules/${otherId}`, {
    token: adminToken,
  });
  check(
    "jadwal kelas lain tidak ikut berubah",
    otherIntact.data?.notes !== "DIUBAH KORLAS",
    otherIntact.data?.notes,
  );

  const hijackDelete = await call("DELETE", `/schedules/${otherId}`, {
    token: korlasToken,
  });
  check(
    "korlas menghapus jadwal kelas lain -> 403",
    hijackDelete.status === 403,
    `got ${hijackDelete.status}`,
  );

  const copyOther = await call("POST", "/schedules/copy", {
    token: korlasToken,
    body: { fromDate: from, toDate: "2032-03-08", className: otherClass },
  });
  check(
    "korlas menyalin minggu kelas lain -> 403",
    copyOther.status === 403,
    `got ${copyOther.status}`,
  );

  // Kunci & publikasi: korlas tetap terbatas pada kelasnya.
  const korlasLockOther = await call("POST", "/schedules/lock", {
    token: korlasToken,
    body: { fromDate: from, toDate: to, className: "2" },
  });
  check(
    "korlas mengunci kelas lain -> 403",
    korlasLockOther.status === 403,
    `got ${korlasLockOther.status}`,
  );

  // Korlas tanpa `className` = kelasnya sendiri; yang dikunci hanya kelas 1.
  const korlasLock = await call("POST", "/schedules/lock", {
    token: korlasToken,
    body: { fromDate: from, toDate: to },
  });
  check(
    "korlas mengunci kelasnya -> 200",
    korlasLock.status === 200,
    `got ${korlasLock.status}`,
  );
  check(
    "kunci korlas hanya menyentuh kelas 1",
    JSON.stringify(korlasLock.data?.classes) === JSON.stringify(["1"]),
    JSON.stringify(korlasLock.data?.classes),
  );

  // Kelas 2 sengaja dibiarkan draft: publikasi seluruh sekolah harus ditolak
  // dan pesannya menyebut kelas penyebabnya.
  const blockedPublish = await call("POST", "/schedules/publish", {
    token: adminToken,
    body: { year: 2032, month: 3 },
  });
  check(
    "publikasi semua kelas ditolak selama ada draft -> 409",
    blockedPublish.status === 409,
    `got ${blockedPublish.status}`,
  );
  check(
    "pesan penolakan menyebut kelas penyebab draft",
    typeof blockedPublish.json?.message === "string" &&
      blockedPublish.json.message.includes("kelas 2"),
    blockedPublish.json?.message,
  );

  // Admin mengunci semua kelas sekaligus — satu panggilan, tanpa `className`.
  const allLock = await call("POST", "/schedules/lock", {
    token: adminToken,
    body: { fromDate: from, toDate: to },
  });
  check(
    "admin mengunci semua kelas -> 200",
    allLock.status === 200,
    `got ${allLock.status}`,
  );
  check(
    "kunci menyentuh kelas 1 dan 2",
    ["1", "2"].every((cls) => (allLock.data?.classes ?? []).includes(cls)),
    JSON.stringify(allLock.data?.classes),
  );
  check(
    "kunci admin melengkapi kelas yang tersisa (kelas 2)",
    allLock.data?.locked === 1,
    `locked=${allLock.data?.locked}`,
  );

  // Publikasi seluruh sekolah dalam satu tindakan.
  const allPublish = await call("POST", "/schedules/publish", {
    token: adminToken,
    body: { year: 2032, month: 3 },
  });
  check(
    "admin mempublikasi semua kelas -> 200",
    allPublish.status === 200,
    `got ${allPublish.status}`,
  );
  check(
    "semua kelas ikut terbit",
    ["1", "2"].every((cls) => (allPublish.data?.classes ?? []).includes(cls)),
    JSON.stringify(allPublish.data?.classes),
  );

  // Orang tua kelas 1 kini melihat jadwalnya.
  const publishedWeek = await call("GET", `/schedules/week?date=${from}`, {
    token: parentToken,
  });
  check(
    "orang tua kelas 1 melihat jadwal published",
    publishedWeek.data?.days?.some((day) => day.scheduleId !== null),
    JSON.stringify(publishedWeek.data?.days?.map((d) => d.status)),
  );

  // Hari libur & akun tetap khusus admin.
  const holiday = await call("POST", "/holidays", {
    token: korlasToken,
    body: { date: "2032-03-03", name: "Libur Korlas" },
  });
  check(
    "korlas menambah hari libur -> 403",
    holiday.status === 403,
    `got ${holiday.status}`,
  );

  for (const path of ["/parents", "/stats/summary"]) {
    const r = await call("GET", path, { token: korlasToken });
    check(
      `GET ${path} sebagai korlas -> 403`,
      r.status === 403,
      `got ${r.status}`,
    );
  }

  // Bersihkan jejak uji. Baris `published` harus di-unlock dulu sebelum
  // bisa dihapus (`not_editable`), karena publikasi di atas menyentuh
  // kedua kelas.
  for (const cls of ["1", "2"]) {
    const rows = await call(
      "GET",
      `/schedules/range?from=${from}&to=${to}&class=${cls}`,
      { token: adminToken },
    );
    for (const day of rows.data ?? []) {
      if (day.scheduleId) {
        await call("POST", `/schedules/${day.scheduleId}/unlock`, {
          token: adminToken,
        });
        await call("DELETE", `/schedules/${day.scheduleId}`, {
          token: adminToken,
        });
      }
    }
  }

  for (const id of [menuId, secondMenuId]) {
    if (id) {
      await call("DELETE", `/menus/${id}?force=true`, { token: adminToken });
    }
  }

  const leftover = await call(
    "GET",
    `/schedules/range?from=${from}&to=${to}&class=${korlasClass}`,
    { token: adminToken },
  );
  check(
    "pembersihan korlas berhasil",
    (leftover.data ?? []).every((day) => day.scheduleId === null),
  );
}

// ── 7. Login as ───────────────────────────────────────────────

section("20. Login as — admin membuka sesi korlas/orang tua");
{
  // Akun uji dicari lewat modul orang tua (admin-only) agar `userId` tidak
  // di-hardcode — basis data lokal bisa saja sudah diubah lewat halaman admin.
  const parents =
    (await call("GET", "/parents?perPage=100", { token: adminToken })).data
      ?.items ?? [];
  const sari = parents.find((p) => p.username === PARENT.username);
  const budi = parents.find((p) => p.username === KORLAS.username);

  check("akun uji orang tua ditemukan", Boolean(sari), PARENT.username);
  check("akun uji korlas ditemukan", Boolean(budi), KORLAS.username);

  // ── Batas akses endpoint ────────────────────────────────────
  const anonymous = await call("POST", "/auth/impersonate", {
    body: { userId: sari?.userId },
  });
  check(
    "tanpa token -> 401",
    anonymous.status === 401,
    `got ${anonymous.status}`,
  );

  for (const [label, token] of [
    ["orang tua", parentToken],
    ["korlas", (await call("POST", "/auth/login", { body: KORLAS })).data?.token],
  ]) {
    const r = await call("POST", "/auth/impersonate", {
      token,
      body: { userId: sari?.userId },
    });
    check(
      `${label} memakai Login as -> 403`,
      r.status === 403,
      `got ${r.status}`,
    );
  }

  // ── Sasaran yang ditolak ────────────────────────────────────
  const missing = await call("POST", "/auth/impersonate", {
    token: adminToken,
    body: { userId: 999999 },
  });
  check(
    "akun tidak ada -> 404",
    missing.status === 404,
    `got ${missing.status}`,
  );

  const badId = await call("POST", "/auth/impersonate", {
    token: adminToken,
    body: { userId: "bukan-angka" },
  });
  check(
    "`userId` tidak valid -> 400",
    badId.status === 400,
    `got ${badId.status}`,
  );

  const adminUserId = (await call("GET", "/auth/me", { token: adminToken })).data
    ?.user?.id;
  const asAdmin = await call("POST", "/auth/impersonate", {
    token: adminToken,
    body: { userId: adminUserId },
  });
  check(
    "sesama admin tidak bisa dibuka -> 400",
    asAdmin.status === 400,
    `got ${asAdmin.status}`,
  );

  // ── Admin masuk sebagai orang tua ───────────────────────────
  // `lastLoginAt` diambil sebelum & sesudah: Login as bukan login pemilik
  // akun, jadi kolom itu tidak boleh tersentuh.
  const before = (await call("GET", `/parents/${sari?.id}`, { token: adminToken }))
    .data?.lastLoginAt;

  const asParent = await call("POST", "/auth/impersonate", {
    token: adminToken,
    body: { userId: sari?.userId },
  });
  check(
    "admin masuk sebagai orang tua -> 200",
    asParent.status === 200,
    `got ${asParent.status}`,
  );
  // Pesannya dibangun dari `users.fullName` — bukan `parents.parentName`,
  // yang bisa saja berbeda isinya.
  const targetName =
    asParent.data?.user?.fullName ?? asParent.data?.user?.username ?? "";
  check(
    "pesan sukses menyebut nama akunnya",
    typeof asParent.json?.message === "string" &&
      targetName.length > 0 &&
      asParent.json.message.includes(targetName),
    `${asParent.json?.message} vs ${targetName}`,
  );
  check(
    "token membawa role target, bukan admin",
    asParent.data?.user?.role === "parent",
    asParent.data?.user?.role,
  );
  check(
    "profil anak ikut terbawa",
    (asParent.data?.user?.students?.length ?? 0) > 0,
    JSON.stringify(asParent.data?.user?.students),
  );

  const parentToken2 = asParent.data?.token;

  const after = (await call("GET", `/parents/${sari?.id}`, { token: adminToken }))
    .data?.lastLoginAt;
  check(
    "`lastLoginAt` pemilik akun tidak tersentuh",
    before === after,
    `${before} -> ${after}`,
  );

  // ── Wewenang tidak bertambah: yang berlaku adalah milik target ──
  const whoAmI = await call("GET", "/auth/me", { token: parentToken2 });
  check(
    "GET /auth/me memakai identitas target",
    whoAmI.data?.user?.username === PARENT.username,
    whoAmI.data?.user?.username,
  );

  const classes = await call("GET", "/classes", { token: parentToken2 });
  check(
    "cakupan kelas menyempit ke kelas anaknya",
    JSON.stringify(classes.data?.classes) === JSON.stringify(["1"]),
    JSON.stringify(classes.data?.classes),
  );

  for (const [label, method, path, body] of [
    ["mengelola akun", "GET", "/parents", undefined],
    ["menyusun jadwal", "POST", "/schedules", { scheduleDate: "2033-01-03", menuId: 1 }],
    ["mempublikasi jadwal", "POST", "/schedules/publish", { year: 2033, month: 1 }],
    ["menambah hari libur", "POST", "/holidays", { date: "2033-01-04", name: "Libur uji" }],
    ["membuka sesi lain", "POST", "/auth/impersonate", { userId: budi?.userId }],
  ]) {
    const r = await call(method, path, { token: parentToken2, body });
    check(
      `sesi orang tua ${label} -> 403`,
      r.status === 403,
      `got ${r.status}`,
    );
  }

  // ── Admin masuk sebagai korlas ──────────────────────────────
  const asKorlas = await call("POST", "/auth/impersonate", {
    token: adminToken,
    body: { userId: budi?.userId },
  });
  check(
    "admin masuk sebagai korlas -> 200",
    asKorlas.status === 200,
    `got ${asKorlas.status}`,
  );
  check(
    "token korlas membawa kelas yang dikoordinasinya",
    asKorlas.data?.user?.role === "korlas" &&
      asKorlas.data?.user?.className === budi?.className,
    `role=${asKorlas.data?.user?.role} kelas=${asKorlas.data?.user?.className}`,
  );

  // Kunci jadwal tetap wewenang admin — sesi korlas tidak boleh mewarisinya
  // dari admin yang membukanya.
  const korlasLock = await call("POST", "/schedules/lock", {
    token: asKorlas.data?.token,
    body: { fromDate: "2033-02-01", toDate: "2033-02-28", className: "2" },
  });
  check(
    "sesi korlas tidak mewarisi wewenang admin -> 403",
    korlasLock.status === 403,
    `got ${korlasLock.status}`,
  );

  // Sesi hasil Login as tetap sesi biasa: yang keluar darinya juga 403.
  const nested = await call("POST", "/auth/impersonate", {
    token: asKorlas.data?.token,
    body: { userId: sari?.userId },
  });
  check(
    "sesi hasil Login as tidak bisa Login as lagi -> 403",
    nested.status === 403,
    `got ${nested.status}`,
  );
}

// ── 8. Ekspor Excel ───────────────────────────────────────────

section("21. Ekspor Excel — admin & korlas");
{
  const XLSX_TYPE =
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

  /**
   * Ambil respons mentah. `call()` tidak bisa dipakai di sini karena ia
   * membaca JSON, sedangkan isi endpoint ini biner.
   */
  const raw = (path, token) =>
    fetch(`${BASE}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

  /**
   * Berkas disusun dengan metode ZIP *store* (tanpa kompresi), jadi nama
   * bagian arsip dan seluruh XML-nya bisa dicari langsung di dalam byte.
   */
  const asText = async (response) =>
    Buffer.from(new Uint8Array(await response.arrayBuffer())).toString("latin1");

  const korlasLogin = await call("POST", "/auth/login", { body: KORLAS });
  const korlasToken = korlasLogin.data?.token;
  const korlasClass = korlasLogin.data?.user?.className;

  const adminClasses =
    (await call("GET", "/classes", { token: adminToken })).data?.classes ?? [];
  const kelasUji = adminClasses[0];
  const kelasLain = adminClasses.find((name) => name !== korlasClass);

  check("ada kelas untuk diuji", Boolean(kelasUji), JSON.stringify(adminClasses));

  // ── Penjagaan akses: hanya admin & korlas ───────────────────
  const anonymous = await raw("/schedules/export?scope=week");
  check("tanpa token -> 401", anonymous.status === 401, `got ${anonymous.status}`);

  const byParent = await raw("/schedules/export?scope=week", parentToken);
  check(
    "orang tua mengunduh jadwal -> 403",
    byParent.status === 403,
    `got ${byParent.status}`,
  );

  const parentMonth = await raw(
    "/schedules/export?scope=month&year=2026&month=9",
    parentToken,
  );
  check(
    "orang tua mengunduh bulanan -> 403",
    parentMonth.status === 403,
    `got ${parentMonth.status}`,
  );

  // ── Sepekan (admin) ─────────────────────────────────────────
  const week = await raw(
    `/schedules/export?scope=week&class=${encodeURIComponent(kelasUji)}`,
    adminToken,
  );
  check("admin mengunduh sepekan -> 200", week.status === 200, `got ${week.status}`);
  check(
    "Content-Type berkas Excel",
    week.headers.get("content-type") === XLSX_TYPE,
    week.headers.get("content-type"),
  );

  const weekDisposition = week.headers.get("content-disposition") ?? "";
  check(
    "nama berkas sepekan menyebut kelas & tanggal",
    /^attachment; filename="jadwal-sepekan-kelas-.+-\d{4}-\d{2}-\d{2}\.xlsx"$/.test(
      weekDisposition,
    ),
    weekDisposition,
  );
  check(
    "berkas ditandai tidak boleh di-cache",
    week.headers.get("cache-control") === "no-store",
    week.headers.get("cache-control"),
  );

  const weekBytes = new Uint8Array(await week.arrayBuffer());
  check(
    "berkas berawalan tanda tangan ZIP (PK)",
    weekBytes[0] === 0x50 && weekBytes[1] === 0x4b,
    `${weekBytes[0]},${weekBytes[1]}`,
  );
  check(
    "Content-Length sesuai panjang isi",
    week.headers.get("content-length") === String(weekBytes.length),
    `${week.headers.get("content-length")} vs ${weekBytes.length}`,
  );

  const weekText = Buffer.from(weekBytes).toString("latin1");
  for (const part of [
    "[Content_Types].xml",
    "xl/workbook.xml",
    "xl/styles.xml",
    "xl/worksheets/sheet1.xml",
  ]) {
    check(`isi arsip memuat ${part}`, weekText.includes(part));
  }

  for (const label of [
    "Jadwal Snack Sepekan",
    "Hari",
    "Tanggal",
    "Komponen menu",
    "Orang tua petugas",
    "Senin",
    "Jumat",
    "Ringkasan",
  ]) {
    check(`lembar sepekan memuat "${label}"`, weekText.includes(label));
  }

  // ── Sepekan (korlas) ────────────────────────────────────────
  const korlasWeek = await raw("/schedules/export?scope=week", korlasToken);
  check(
    "korlas mengunduh sepekan -> 200",
    korlasWeek.status === 200,
    `got ${korlasWeek.status}`,
  );
  check(
    "nama berkas korlas menyebut kelasnya",
    /filename="jadwal-sepekan-kelas-[^"]+\.xlsx"/.test(
      korlasWeek.headers.get("content-disposition") ?? "",
    ),
    korlasWeek.headers.get("content-disposition"),
  );

  const korlasText = await asText(korlasWeek);
  check(
    "lembar korlas menyebut kelas yang dikoordinasinya",
    korlasText.includes(`Kelas ${korlasClass}`),
    `Kelas ${korlasClass}`,
  );

  if (kelasLain) {
    // Korlas boleh **membaca** kelas lain (aturan `resolveReadClass` yang sama
    // dengan `/week` & `/month` — lihat bagian 19), jadi mengunduh kelas lain
    // pun terbuka; yang tertutup adalah wewenang menulisnya. Yang diuji di
    // sini: `class` benar-benar dihormati, bukan diam-diam ditimpa kelasnya.
    const other = await raw(
      `/schedules/export?scope=week&class=${encodeURIComponent(kelasLain)}`,
      korlasToken,
    );
    check(
      "korlas mengunduh kelas lain -> 200 (baca lintas kelas)",
      other.status === 200,
      `got ${other.status}`,
    );

    const otherText = await asText(other);
    check(
      "kelas yang diminta benar-benar dipakai",
      otherText.includes(`Kelas ${kelasLain}`) &&
        !otherText.includes(`Kelas ${korlasClass}`),
      `diminta Kelas ${kelasLain}, punya Kelas ${korlasClass}`,
    );
  }

  // ── Bulanan (admin) ─────────────────────────────────────────
  const month = await raw(
    `/schedules/export?scope=month&year=2026&month=9&class=${encodeURIComponent(kelasUji)}`,
    adminToken,
  );
  check("admin mengunduh bulanan -> 200", month.status === 200, `got ${month.status}`);
  check(
    "nama berkas bulanan memuat tahun-bulan",
    /filename="jadwal-bulanan-2026-09-kelas-[^"]+\.xlsx"/.test(
      month.headers.get("content-disposition") ?? "",
    ),
    month.headers.get("content-disposition"),
  );

  const monthText = await asText(month);
  check(
    "lembar bulanan memuat judul bulan",
    monthText.includes("Jadwal Snack September 2026"),
  );
  // Kepala tabel diulang per pekan — satu bulan pasti lebih dari satu blok.
  check(
    "kepala tabel diulang tiap pekan",
    (monthText.match(/Komponen menu/g) ?? []).length > 1,
    `${(monthText.match(/Komponen menu/g) ?? []).length} blok`,
  );
  check(
    "nama lembar bulanan = bulan + tahun",
    monthText.includes('name="September 2026"'),
  );

  // Bulan tanpa jadwal tetap harus menghasilkan berkas yang bisa dibuka,
  // bukan galat — admin kadang mengunduh sebelum jadwalnya disusun.
  const emptyMonth = await raw(
    "/schedules/export?scope=month&year=2033&month=1",
    adminToken,
  );
  check(
    "bulan tanpa jadwal tetap menghasilkan berkas -> 200",
    emptyMonth.status === 200,
    `got ${emptyMonth.status}`,
  );

  // ── Validasi parameter ──────────────────────────────────────
  for (const [label, path] of [
    ["`scope` kosong", "/schedules/export"],
    ["`scope` asing", "/schedules/export?scope=year"],
    ["`date` salah format", "/schedules/export?scope=week&date=22-09-2026"],
    ["`year`/`month` kosong", "/schedules/export?scope=month"],
    ["`month` di luar 1–12", "/schedules/export?scope=month&year=2026&month=13"],
  ]) {
    const r = await raw(path, adminToken);
    check(`${label} -> 400`, r.status === 400, `got ${r.status}`);
  }
}

// ── 9. Batas percobaan masuk ──────────────────────────────────

section("22. Batas percobaan masuk — kunci setelah 5 kali gagal");
{
  const PASSWORD = "rahasia123";
  const username = `ujikunci${Date.now()}`;

  const login = (name, password) =>
    call("POST", "/auth/login", { body: { username: name, password } });

  // Akun sekali pakai: akun demo (sari/budi) dipakai uji lain, jadi jangan
  // sampai ikut terkunci. Dibuat lewat API admin supaya bentuknya sama
  // dengan akun sungguhan, lalu dihapus lagi di akhir blok ini.
  const created = await call("POST", "/parents", {
    token: adminToken,
    body: {
      username,
      password: PASSWORD,
      parentName: "Uji Batas Masuk",
      students: [{ name: "Anak Uji", className: "1" }],
    },
  });
  const parentId = created.data?.id;

  check(
    "akun uji dibuat",
    created.status === 201 && typeof parentId === "number",
    `status ${created.status}`,
  );

  if (parentId) {
    const wrong = "password-salah";

    // ── Kegagalan berturut-turut, dengan sisa kesempatan ──────
    for (let attempt = 1; attempt <= 4; attempt++) {
      const r = await login(username, wrong);
      const left = 5 - attempt;
      check(
        `gagal ke-${attempt} -> 401 dengan sisa ${left} kesempatan`,
        r.status === 401 && r.json?.message?.includes(`Sisa ${left} kesempatan`),
        `${r.status} ${r.json?.message}`,
      );
    }

    // ── Kegagalan kelima mengunci akun ────────────────────────
    const fifth = await login(username, wrong);
    check(
      "gagal ke-5 -> 423 terkunci",
      fifth.status === 423,
      `got ${fifth.status}`,
    );
    check(
      "pesannya menyuruh menghubungi admin",
      typeof fifth.json?.message === "string" &&
        fifth.json.message.toLowerCase().includes("hubungi admin"),
      fifth.json?.message,
    );

    // ── Terkunci berarti terkunci: password benar pun ditolak ──
    const correctWhileLocked = await login(username, PASSWORD);
    check(
      "password benar saat terkunci tetap 423",
      correctWhileLocked.status === 423,
      `got ${correctWhileLocked.status}`,
    );

    // ── Status terkunci terlihat oleh admin ───────────────────
    const listed = await call("GET", `/parents/${parentId}`, {
      token: adminToken,
    });
    check(
      "admin melihat akun berstatus terkunci",
      typeof listed.data?.lockedAt === "string" && listed.data.lockedAt.length > 0,
      String(listed.data?.lockedAt),
    );

    // ── Membuka kunci hanya wewenang admin ────────────────────
    const byParent = await call("POST", `/parents/${parentId}/unlock`, {
      token: parentToken,
    });
    check(
      "orang tua membuka kunci akun -> 403",
      byParent.status === 403,
      `got ${byParent.status}`,
    );

    const anonymous = await call("POST", `/parents/${parentId}/unlock`);
    check(
      "tanpa token membuka kunci -> 401",
      anonymous.status === 401,
      `got ${anonymous.status}`,
    );

    const unlocked = await call("POST", `/parents/${parentId}/unlock`, {
      token: adminToken,
    });
    check(
      "admin membuka kunci -> 200",
      unlocked.status === 200,
      `got ${unlocked.status}`,
    );

    const afterUnlock = await login(username, PASSWORD);
    check(
      "setelah dibuka, password yang sama bisa dipakai masuk",
      afterUnlock.status === 200,
      `got ${afterUnlock.status}`,
    );
    check(
      "penghitung kegagalan ikut dikosongkan",
      (await call("GET", `/parents/${parentId}`, { token: adminToken })).data
        ?.lockedAt === null,
      "lockedAt masih terisi",
    );

    // ── Masuk yang berhasil mengosongkan penghitung ───────────
    // Tiga gagal, satu berhasil, lalu empat gagal lagi: kalau penghitungnya
    // tidak direset, kegagalan ke-4 sesudah masuk itu akan mengunci akun.
    for (let attempt = 1; attempt <= 3; attempt++) await login(username, wrong);
    await login(username, PASSWORD);

    let lastStatus = 0;
    for (let attempt = 1; attempt <= 4; attempt++) {
      lastStatus = (await login(username, wrong)).status;
    }
    check(
      "penghitung direset oleh login yang berhasil",
      lastStatus === 401,
      `gagal ke-4 sesudah login berhasil seharusnya 401, dapat ${lastStatus}`,
    );

    // ── Reset password sekaligus membuka kunci ────────────────
    await login(username, wrong); // kegagalan ke-5 -> terkunci lagi
    const lockedAgain = await login(username, PASSWORD);
    check(
      "akun terkunci lagi setelah 5 gagal",
      lockedAgain.status === 423,
      `got ${lockedAgain.status}`,
    );

    const reset = await call("POST", `/parents/${parentId}/reset-password`, {
      token: adminToken,
      body: { newPassword: "passwordbaru123" },
    });
    check(
      "admin mereset password -> 200",
      reset.status === 200,
      `got ${reset.status}`,
    );

    const afterReset = await login(username, "passwordbaru123");
    check(
      "reset password sekaligus membuka kunci",
      afterReset.status === 200,
      `got ${afterReset.status}`,
    );

    // ── Username tak dikenal tidak menumpuk penghitung ────────
    const unknown = await login(`tidakada${Date.now()}`, wrong);
    check(
      "username tak dikenal -> 401 generik",
      unknown.status === 401,
      `got ${unknown.status}`,
    );
    check(
      "username tak dikenal tidak membocorkan sisa kesempatan",
      !unknown.json?.message?.includes("kesempatan"),
      unknown.json?.message,
    );

    // ── Bersih-bersih ─────────────────────────────────────────
    const removed = await call("DELETE", `/parents/${parentId}?hard=true`, {
      token: adminToken,
    });
    check(
      "akun uji dihapus kembali",
      removed.status === 200,
      `got ${removed.status}`,
    );
  }
}

// ── Ringkasan ─────────────────────────────────────────────────

console.log(`\n=== HASIL: ${pass} pass, ${fail} fail ===`);
if (failures.length > 0) {
  console.log("\nGagal:");
  for (const name of failures) console.log(`  - ${name}`);
}
process.exit(fail === 0 ? 0 : 1);
