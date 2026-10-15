/**
 * Uji layanan mandiri akun orang tua: mengubah **nama, hubungan, dan nomor
 * WhatsApp-nya sendiri** dari menu Profil (`PUT /api/profile/account`).
 *
 * Yang dibuktikan di sini bukan hanya "berhasil disimpan", melainkan juga
 * batas wewenangnya: pemiliknya tidak bisa menaikkan peran, mengganti
 * username, atau menyentuh data orang tua lain lewat jalur ini.
 *
 * Prasyarat: dev server berjalan (`bun run dev`) dan database lokal
 * sudah dimigrasi + di-seed:
 *   bun run db:migrate:local && bun run db:seed && bun run db:seed:local
 *
 * Jalankan: bun run test:profile:account
 */

const BASE = "http://localhost:5173/api";
const ADMIN = { username: "admin", password: "snack123" };
/** Orang tua biasa — 1 anak (Aisyah Sari, kelas 1). */
const PARENT = { username: "sari", password: "snack123" };
/** Korlas kelas 1 — sekaligus orang tua, jadi boleh memakai layanan ini juga. */
const KORLAS = { username: "budi", password: "snack123" };
/** Orang tua lain — dipakai membuktikan cakupannya terkunci pada pemiliknya. */
const OTHER_PARENT = { username: "dewi", password: "snack123" };

/** Nama sementara selama uji — dikembalikan ke aslinya di akhir. */
const TEST_NAME = "Uji Akun Sari";

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
  return { status: res.status, json, data: json?.data ?? null, message: json?.message ?? "" };
}

async function login({ username, password }) {
  const res = await call("POST", "/auth/login", { body: { username, password } });
  if (!res.data?.token) {
    throw new Error(
      `Tidak bisa login sebagai "${username}" — pastikan dev server jalan dan DB lokal ter-seed.`,
    );
  }
  return res.data.token;
}

/** Profil pemilik token apa adanya, langsung dari `/auth/me`. */
async function me(token) {
  const res = await call("GET", "/auth/me", { token });
  return res.data?.user ?? null;
}

/**
 * Baris orang tua menurut pandangan admin (`GET /parents`).
 *
 * Dipakai membuktikan `parents.parent_name` ikut berubah, bukan hanya
 * `users.full_name` — dua kolom itu dibaca layar yang berbeda, dan kalau
 * hanya salah satunya ditulis, daftar akun admin akan menampilkan nama lama.
 */
async function parentRowAsAdmin(adminToken, parentId) {
  const res = await call("GET", "/parents?perPage=100", { token: adminToken });
  const items = res.data?.items ?? [];
  return items.find((item) => item.id === parentId) ?? null;
}

/** Nilai awal pemilik token — dasar pemulihan di akhir uji. */
async function snapshot(token) {
  const user = await me(token);
  return {
    fullName: user.fullName ?? "",
    relationship: user.relationship ?? "ibu",
    phone: user.phone ?? "",
  };
}

/** Kembalikan akun ke keadaan semula, apa pun yang terjadi selama uji. */
async function restore(token, original) {
  return call("PUT", "/profile/account", {
    token,
    body: {
      fullName: original.fullName,
      relationship: original.relationship,
      phone: original.phone,
    },
  });
}

// ── Persiapan ─────────────────────────────────────────────────

const adminToken = await login(ADMIN);
const parentToken = await login(PARENT);
const korlasToken = await login(KORLAS);
const otherToken = await login(OTHER_PARENT);

const original = await snapshot(parentToken);
const otherOriginal = await snapshot(otherToken);
const parentId = (await me(parentToken)).parentId;

section("Bentuk jawaban");
{
  const user = await me(parentToken);
  check("`/auth/me` menyertakan kolom `phone`", "phone" in user, Object.keys(user).join(", "));
  check("`phone` awal terbaca sebagai teks atau null", user.phone === null || typeof user.phone === "string", JSON.stringify(user.phone));
}

section("Mengubah data sendiri");
{
  const res = await call("PUT", "/profile/account", {
    token: parentToken,
    body: { fullName: TEST_NAME, relationship: "ayah", phone: "0812-3456-7890" },
  });

  check("mengubah nama, hubungan, dan nomor → 200", res.status === 200, `status ${res.status} ${res.message}`);
  check("jawabannya memuat profil terbaru", res.data?.user?.fullName === TEST_NAME, JSON.stringify(res.data?.user?.fullName));
  check("hubungan baru ikut dikembalikan", res.data?.user?.relationship === "ayah", JSON.stringify(res.data?.user?.relationship));
  check(
    "nomor ditulis sebagai digit murni (pemisah dibuang)",
    res.data?.user?.phone === "081234567890",
    JSON.stringify(res.data?.user?.phone),
  );

  const after = await me(parentToken);
  check("perubahannya bertahan di `/auth/me`", after.fullName === TEST_NAME, JSON.stringify(after.fullName));
  check("hubungan bertahan", after.relationship === "ayah", JSON.stringify(after.relationship));

  // Nama hidup di dua tabel: `users.full_name` dan `parents.parent_name`.
  const row = await parentRowAsAdmin(adminToken, parentId);
  check("nama orang tua di daftar admin ikut berubah", row?.parentName === TEST_NAME, JSON.stringify(row?.parentName));
  check("nomor di daftar admin ikut berubah", row?.phone === "081234567890", JSON.stringify(row?.phone));
  check("hubungan di daftar admin ikut berubah", row?.relationship === "ayah", JSON.stringify(row?.relationship));
}

section("Bentuk nomor dinormalkan");
{
  const plus = await call("PUT", "/profile/account", {
    token: parentToken,
    body: { phone: "+62 812.3456.7890" },
  });
  check("nomor `+62 …` diterima → 200", plus.status === 200, `status ${plus.status}`);
  check("menjadi digit tanpa `+`", plus.data?.user?.phone === "6281234567890", JSON.stringify(plus.data?.user?.phone));

  const kosong = await call("PUT", "/profile/account", {
    token: parentToken,
    body: { phone: "" },
  });
  check("nomor dikosongkan → 200", kosong.status === 200, `status ${kosong.status}`);
  check("nomor kosong tersimpan sebagai null", kosong.data?.user?.phone === null, JSON.stringify(kosong.data?.user?.phone));
}

section("Penolakan yang benar");
{
  const huruf = await call("PUT", "/profile/account", { token: parentToken, body: { phone: "0812abc3456789" } });
  check("nomor berisi huruf → 400", huruf.status === 400, `status ${huruf.status}`);

  const pendek = await call("PUT", "/profile/account", { token: parentToken, body: { phone: "0812" } });
  check("nomor terlalu pendek → 400", pendek.status === 400, `status ${pendek.status}`);

  const hubungan = await call("PUT", "/profile/account", { token: parentToken, body: { relationship: "tetangga" } });
  check("hubungan tak dikenal → 400", hubungan.status === 400, `status ${hubungan.status}`);

  const namaKosong = await call("PUT", "/profile/account", { token: parentToken, body: { fullName: "   " } });
  check("nama kosong → 400", namaKosong.status === 400, `status ${namaKosong.status}`);

  const namaBukanTeks = await call("PUT", "/profile/account", { token: parentToken, body: { fullName: 123 } });
  check("nama bukan teks → 400", namaBukanTeks.status === 400, `status ${namaBukanTeks.status}`);

  // Setelah semua penolakan, nama uji harus masih utuh — penolakan tidak
  // boleh menulis sebagian.
  const after = await me(parentToken);
  check("penolakan tidak mengubah data", after.fullName === TEST_NAME, JSON.stringify(after.fullName));
}

section("Wewenang tidak bisa dinaikkan lewat jalur ini");
{
  const escalate = await call("PUT", "/profile/account", {
    token: parentToken,
    body: { role: "admin", username: "penyusup", isActive: false, className: "6" },
  });

  check("field asing diabaikan, bukan ditolak → 200", escalate.status === 200, `status ${escalate.status} ${escalate.message}`);

  const after = await me(parentToken);
  check("peran tetap `parent`", after.role === "parent", JSON.stringify(after.role));
  check("username tidak berubah", after.username === PARENT.username, JSON.stringify(after.username));
  check("kelas korlas tidak ikut terisi", after.className === null, JSON.stringify(after.className));
}

section("Cakupan terkunci pada pemilik token");
{
  const before = await me(otherToken);
  const ubah = await call("PUT", "/profile/account", {
    token: parentToken,
    body: { fullName: TEST_NAME },
  });
  const after = await me(otherToken);

  check("orang tua lain tetap bisa login", ubah.status === 200, `status ${ubah.status}`);
  check("nama orang tua lain tidak tersentuh", after.fullName === before.fullName, `${before.fullName} → ${after.fullName}`);
  check("nomor orang tua lain tidak tersentuh", after.phone === before.phone, JSON.stringify(after.phone));
}

section("Peran yang boleh memakai");
{
  const korlas = await call("PUT", "/profile/account", {
    token: korlasToken,
    body: { fullName: (await me(korlasToken)).fullName },
  });
  check("korlas juga boleh mengubah datanya sendiri → 200", korlas.status === 200, `status ${korlas.status}`);

  const admin = await call("PUT", "/profile/account", {
    token: adminToken,
    body: { fullName: "Admin" },
  });
  check("admin tidak punya profil orang tua → 403", admin.status === 403, `status ${admin.status}`);

  const anon = await call("PUT", "/profile/account", { body: { fullName: "Tanpa Token" } });
  check("tanpa token → 401", anon.status === 401, `status ${anon.status}`);

  const badBody = await call("PUT", "/profile/account", { token: parentToken, body: undefined });
  check("body kosong → 400", badBody.status === 400, `status ${badBody.status}`);
}

section("Pemulihan data uji");
{
  const restored = await restore(parentToken, original);
  check("data awal berhasil dikembalikan → 200", restored.status === 200, `status ${restored.status}`);

  const after = await me(parentToken);
  check("nama kembali seperti semula", after.fullName === original.fullName, JSON.stringify(after.fullName));
  check("hubungan kembali seperti semula", after.relationship === original.relationship, JSON.stringify(after.relationship));
  check("nomor kembali seperti semula", (after.phone ?? "") === original.phone, JSON.stringify(after.phone));

  const row = await parentRowAsAdmin(adminToken, parentId);
  check("daftar admin juga kembali seperti semula", row?.parentName === original.fullName, JSON.stringify(row?.parentName));

  // Orang tua lain tidak pernah disentuh uji ini.
  const other = await me(otherToken);
  check("orang tua lain tetap utuh di akhir uji", other.fullName === otherOriginal.fullName, JSON.stringify(other.fullName));
}

console.log(`\n=== HASIL: ${pass} pass, ${fail} fail ===`);
if (failures.length > 0) {
  console.log("\nGagal:");
  for (const name of failures) console.log(`  - ${name}`);
}
process.exit(fail === 0 ? 0 : 1);
