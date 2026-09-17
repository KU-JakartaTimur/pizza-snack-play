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

// ── Setup: ambil token ────────────────────────────────────────

const adminLogin = await call("POST", "/auth/login", { body: ADMIN });
const adminToken = adminLogin.data?.token;

const parentLogin = await call("POST", "/auth/login", { body: PARENT });
const parentToken = parentLogin.data?.token;

section("0. Persiapan");
check("login admin berhasil", Boolean(adminToken), `status ${adminLogin.status}`);
check("login orang tua berhasil", Boolean(parentToken), `status ${parentLogin.status}`);

if (!adminToken || !parentToken) {
  console.log("\nTidak bisa melanjutkan tanpa token. Pastikan server & seed siap.");
  process.exit(1);
}

// ── 1. Jadwal ─────────────────────────────────────────────────

section("1. Jadwal — hari ini");
{
  const r = await call("GET", "/schedules/today", { token: parentToken });
  check("GET /schedules/today -> 200", r.status === 200, `got ${r.status}`);
  check("ada objek day", Boolean(r.data?.day?.date), JSON.stringify(r.data)?.slice(0, 120));
  check("ada objek week dengan 5 hari", r.data?.week?.days?.length === 5,
    `days=${r.data?.week?.days?.length}`);
  check(
    "hari kerja (dayOfWeek 1-5)",
    r.data?.day?.dayOfWeek >= 1 && r.data?.day?.dayOfWeek <= 5,
    `dayOfWeek=${r.data?.day?.dayOfWeek}`,
  );
}

section("2. Jadwal — mingguan");
{
  const r = await call("GET", "/schedules/week?date=2026-09-01", { token: parentToken });
  check("GET /schedules/week -> 200", r.status === 200, `got ${r.status}`);
  check("rentang minggu 2026-08-31 s/d 2026-09-04",
    r.data?.startDate === "2026-08-31" && r.data?.endDate === "2026-09-04",
    `${r.data?.startDate}..${r.data?.endDate}`);
  check("label minggu terisi", typeof r.data?.label === "string" && r.data.label.length > 0,
    r.data?.label);
  check("hari pertama = Senin", r.data?.days?.[0]?.dayName === "Senin",
    r.data?.days?.[0]?.dayName);

  const selasa = r.data?.days?.[1];
  check("Selasa 1 Sep punya menu", Boolean(selasa?.menu?.name), JSON.stringify(selasa)?.slice(0, 120));
  check("menu punya komponen", (selasa?.menu?.items?.length ?? 0) > 0,
    `items=${selasa?.menu?.items?.length}`);
}

section("3. Jadwal — bulanan");
{
  const r = await call("GET", "/schedules/month?year=2026&month=9", { token: parentToken });
  check("GET /schedules/month -> 200", r.status === 200, `got ${r.status}`);
  check("nama bulan = September", r.data?.monthName === "September", r.data?.monthName);
  check("ada 5 minggu", r.data?.weeks?.length === 5, `weeks=${r.data?.weeks?.length}`);
  check(
    "total hari = 25 (5 minggu x 5 hari)",
    r.data?.weeks?.reduce((sum, w) => sum + w.days.length, 0) === 25,
  );
}

section("4. Jadwal — Agustus (termasuk libur)");
{
  const r = await call("GET", "/schedules/month?year=2026&month=8", { token: parentToken });
  check("GET bulan Agustus -> 200", r.status === 200, `got ${r.status}`);

  const allDays = (r.data?.weeks ?? []).flatMap((w) => w.days);
  const holiday = allDays.find((d) => d.date === "2026-08-17");
  check("17 Agustus 2026 ada di data", Boolean(holiday), "tanggal tidak ditemukan");
  check("17 Agustus ditandai libur", holiday?.isHoliday === true,
    JSON.stringify(holiday)?.slice(0, 120));
  check("hari libur tidak punya menu", holiday?.menu === null);
}

section("5. Jadwal — rentang & validasi");
{
  const ok = await call("GET", "/schedules/range?from=2026-09-01&to=2026-09-07", { token: parentToken });
  check("GET /schedules/range -> 200", ok.status === 200, `got ${ok.status}`);
  check("7 hari terisi", ok.data?.length === 7, `len=${ok.data?.length}`);

  const bad = await call("GET", "/schedules/range?from=2026-09-01", { token: parentToken });
  check("range tanpa `to` -> 400", bad.status === 400, `got ${bad.status}`);

  const tooLong = await call("GET", "/schedules/range?from=2026-01-01&to=2026-12-31", { token: parentToken });
  check("range > 92 hari -> 400", tooLong.status === 400, `got ${tooLong.status}`);

  const badMonth = await call("GET", "/schedules/month?year=2026&month=13", { token: parentToken });
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
  check("menu terisi (42 dari seed)", r.data?.length === 42, `len=${r.data?.length}`);

  const withItems = (r.data ?? []).filter((m) => (m.items?.length ?? 0) > 0);
  check("semua menu punya komponen", withItems.length === r.data?.length,
    `${withItems.length}/${r.data?.length}`);

  const first = r.data?.[0];
  const detail = await call("GET", `/menus/${first?.id}`, { token: parentToken });
  check("GET /menus/:id -> 200", detail.status === 200, `got ${detail.status}`);
  check("detail menu cocok", detail.data?.id === first?.id);

  const types = await call("GET", "/menus/item-types", { token: parentToken });
  check("GET /menus/item-types -> 200", types.status === 200, `got ${types.status}`);
  check("ada 4 jenis komponen", types.data?.length === 4, `len=${types.data?.length}`);
}

// ── 3. RBAC ───────────────────────────────────────────────────

section("8. RBAC — orang tua ditolak di endpoint admin");
{
  const cases = [
    ["GET", "/parents"],
    ["GET", "/stats/summary"],
    ["POST", "/menus"],
    ["POST", "/categories"],
    ["POST", "/schedules"],
    ["POST", "/holidays"],
  ];

  for (const [method, path] of cases) {
    const r = await call(method, path, { token: parentToken, body: {} });
    check(`${method} ${path} sebagai orang tua -> 403`, r.status === 403, `got ${r.status}`);
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
    check(`${method} ${path} tanpa token -> 401`, r.status === 401, `got ${r.status}`);
  }
}

// ── 4. Statistik ──────────────────────────────────────────────

section("10. Statistik dashboard");
{
  const r = await call("GET", "/stats/summary", { token: adminToken });
  check("GET /stats/summary -> 200", r.status === 200, `got ${r.status}`);
  check("3 orang tua", r.data?.parents?.total === 3, `total=${r.data?.parents?.total}`);
  check("3 orang tua aktif", r.data?.parents?.active === 3, `active=${r.data?.parents?.active}`);
  check("42 menu", r.data?.menus?.total === 42, `total=${r.data?.menus?.total}`);
  check("ada hari libur tercatat", r.data?.schedules?.holidays >= 1,
    `holidays=${r.data?.schedules?.holidays}`);
  check("currentWeek terisi", Boolean(r.data?.currentWeek?.label), r.data?.currentWeek?.label);
  check("today terisi", Boolean(r.data?.today?.date), JSON.stringify(r.data?.today));
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
  check("menu baru punya 2 komponen", created.data?.items?.length === 2,
    `items=${created.data?.items?.length}`);

  const updated = await call("PUT", `/menus/${menuId}`, {
    token: adminToken,
    body: { description: "Deskripsi diperbarui", items: [{ name: "Hanya satu", itemType: "main" }] },
  });
  check("PUT /menus/:id -> 200", updated.status === 200, `got ${updated.status}`);
  check("deskripsi berubah", updated.data?.description === "Deskripsi diperbarui",
    updated.data?.description);
  check("komponen diganti jadi 1", updated.data?.items?.length === 1,
    `items=${updated.data?.items?.length}`);

  const dup = await call("POST", "/menus", {
    token: adminToken,
    body: { name: updated.data?.name, items: [{ name: "x" }] },
  });
  check("nama menu duplikat -> 409", dup.status === 409, `got ${dup.status}`);

  const noItems = await call("POST", "/menus", {
    token: adminToken,
    body: { name: `Kosong ${Date.now()}`, items: [] },
  });
  check("menu tanpa komponen -> 400", noItems.status === 400, `got ${noItems.status}`);

  const removed = await call("DELETE", `/menus/${menuId}`, { token: adminToken });
  check("DELETE /menus/:id -> 200", removed.status === 200, `got ${removed.status}`);

  const gone = await call("GET", `/menus/${menuId}`, { token: adminToken });
  check("menu terhapus -> 404", gone.status === 404, `got ${gone.status}`);
}

section("12. CRUD kategori (admin)");
{
  const created = await call("POST", "/categories", {
    token: adminToken,
    body: { name: `Kategori Uji ${Date.now()}`, color: "#123456" },
  });
  check("POST /categories -> 201", created.status === 201, `got ${created.status}`);
  check("slug dibuat otomatis", Boolean(created.data?.slug), created.data?.slug);
  check("warna tersimpan", created.data?.color === "#123456", created.data?.color);

  const badColor = await call("POST", "/categories", {
    token: adminToken,
    body: { name: `Warna Salah ${Date.now()}`, color: "biru" },
  });
  check("warna bukan hex -> 400", badColor.status === 400, `got ${badColor.status}`);

  const removed = await call("DELETE", `/categories/${created.data?.id}`, { token: adminToken });
  check("DELETE /categories/:id -> 200", removed.status === 200, `got ${removed.status}`);
}

section("13. CRUD jadwal (admin)");
{
  const date = "2026-10-05"; // Senin

  const existing = await call("GET", `/schedules/range?from=${date}&to=${date}`, { token: adminToken });
  const existingId = existing.data?.[0]?.scheduleId;
  if (existingId) await call("DELETE", `/schedules/${existingId}`, { token: adminToken });

  const menus = await call("GET", "/menus?active=true", { token: adminToken });
  const menuId = menus.data?.[0]?.id;

  const created = await call("POST", "/schedules", {
    token: adminToken,
    body: { scheduleDate: date, menuId, notes: "Dibuat test" },
  });
  check("POST /schedules -> 201", created.status === 201, `got ${created.status}`);
  check("tanggal sesuai", created.data?.date === date, created.data?.date);
  check("dayOfWeek = 1 (Senin)", created.data?.dayOfWeek === 1, `dow=${created.data?.dayOfWeek}`);
  check("menu terpasang", created.data?.menu?.id === menuId);
  check("notes tersimpan", created.data?.notes === "Dibuat test", created.data?.notes);

  const scheduleId = created.data?.scheduleId;

  const dup = await call("POST", "/schedules", {
    token: adminToken,
    body: { scheduleDate: date, menuId },
  });
  check("tanggal duplikat -> 409", dup.status === 409, `got ${dup.status}`);

  const badDate = await call("POST", "/schedules", {
    token: adminToken,
    body: { scheduleDate: "05-10-2026", menuId },
  });
  check("format tanggal salah -> 400", badDate.status === 400, `got ${badDate.status}`);

  const asHoliday = await call("PUT", `/schedules/${scheduleId}`, {
    token: adminToken,
    body: { isHoliday: true },
  });
  check("PUT jadwal jadi libur -> 200", asHoliday.status === 200, `got ${asHoliday.status}`);
  check("libur menghapus menu", asHoliday.data?.menu === null, JSON.stringify(asHoliday.data?.menu));

  const removed = await call("DELETE", `/schedules/${scheduleId}`, { token: adminToken });
  check("DELETE /schedules/:id -> 200", removed.status === 200, `got ${removed.status}`);
}

section("14. Hari libur (admin)");
{
  const date = "2026-12-25";
  const list = await call("GET", `/holidays?from=${date}&to=${date}`, { token: adminToken });
  for (const h of list.data ?? []) {
    await call("DELETE", `/holidays/${h.id}`, { token: adminToken });
  }

  const created = await call("POST", "/holidays", {
    token: adminToken,
    body: { date, name: "Hari Natal", description: "Libur nasional" },
  });
  check("POST /holidays -> 201", created.status === 201, `got ${created.status}`);

  const dup = await call("POST", "/holidays", {
    token: adminToken,
    body: { date, name: "Duplikat" },
  });
  check("tanggal libur duplikat -> 409", dup.status === 409, `got ${dup.status}`);

  const week = await call("GET", `/schedules/range?from=${date}&to=${date}`, { token: adminToken });
  check("hari libur muncul di jadwal", week.data?.[0]?.isHoliday === true,
    JSON.stringify(week.data?.[0])?.slice(0, 140));
  check("nama libur terbawa", week.data?.[0]?.holidayName === "Hari Natal",
    week.data?.[0]?.holidayName);

  const removed = await call("DELETE", `/holidays/${created.data?.id}`, { token: adminToken });
  check("DELETE /holidays/:id -> 200", removed.status === 200, `got ${removed.status}`);
}

section("15. CRUD orang tua (admin)");
{
  const username = `uji${Date.now().toString(36)}`;

  const created = await call("POST", "/parents", {
    token: adminToken,
    body: {
      username,
      password: "rahasia123",
      parentName: "Ibu Uji",
      studentName: "Anak Uji",
      studentClass: "2A",
      relationship: "ibu",
    },
  });
  check("POST /parents -> 201", created.status === 201, `got ${created.status}`);
  check("role akun baru = parent", created.data?.username === username, created.data?.username);
  const parentId = created.data?.id;

  const dup = await call("POST", "/parents", {
    token: adminToken,
    body: {
      username,
      password: "rahasia123",
      parentName: "Duplikat",
      studentName: "Anak",
    },
  });
  check("username duplikat -> 409", dup.status === 409, `got ${dup.status}`);

  const badUser = await call("POST", "/parents", {
    token: adminToken,
    body: { username: "AB", password: "rahasia123", parentName: "x", studentName: "y" },
  });
  check("username terlalu pendek -> 400", badUser.status === 400, `got ${badUser.status}`);

  const shortPw = await call("POST", "/parents", {
    token: adminToken,
    body: { username: `p${Date.now().toString(36)}`, password: "123", parentName: "x", studentName: "y" },
  });
  check("password < 8 karakter -> 400", shortPw.status === 400, `got ${shortPw.status}`);

  const list = await call("GET", `/parents?search=${username}`, { token: adminToken });
  check("pencarian menemukan akun baru", list.data?.items?.length === 1,
    `found=${list.data?.items?.length}`);
  check("total terisi", list.data?.total === 1, `total=${list.data?.total}`);

  // Akun baru harus bisa login
  const login = await call("POST", "/auth/login", {
    body: { username, password: "rahasia123" },
  });
  check("akun baru bisa login", login.status === 200, `got ${login.status}`);
  check("profil siswa terbawa", login.data?.student?.className === "2A",
    JSON.stringify(login.data?.student));

  const reset = await call("POST", `/parents/${parentId}/reset-password`, {
    token: adminToken,
    body: { newPassword: "baru12345" },
  });
  check("reset password -> 200", reset.status === 200, `got ${reset.status}`);

  const loginNew = await call("POST", "/auth/login", {
    body: { username, password: "baru12345" },
  });
  check("login dengan password baru", loginNew.status === 200, `got ${loginNew.status}`);

  const deactivated = await call("DELETE", `/parents/${parentId}`, { token: adminToken });
  check("DELETE /parents/:id -> 200", deactivated.status === 200, `got ${deactivated.status}`);
  check("aksi = deactivated", deactivated.data?.action === "deactivated", deactivated.data?.action);

  const loginOff = await call("POST", "/auth/login", {
    body: { username, password: "baru12345" },
  });
  check("akun nonaktif tidak bisa login -> 401", loginOff.status === 401, `got ${loginOff.status}`);

  const hard = await call("DELETE", `/parents/${parentId}?hard=true`, { token: adminToken });
  check("hapus permanen -> 200", hard.status === 200, `got ${hard.status}`);
  check("aksi = deleted", hard.data?.action === "deleted", hard.data?.action);
}

// ── Ringkasan ─────────────────────────────────────────────────

console.log(`\n=== HASIL: ${pass} pass, ${fail} fail ===`);
if (failures.length > 0) {
  console.log("\nGagal:");
  for (const name of failures) console.log(`  - ${name}`);
}
process.exit(fail === 0 ? 0 : 1);
