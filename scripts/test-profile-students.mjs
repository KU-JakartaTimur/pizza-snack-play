/**
 * Uji layanan mandiri orang tua: menambah/mengubah/menghapus **anaknya sendiri**
 * dari menu Profil (`/api/profile/students`).
 *
 * Prasyarat: dev server berjalan (`bun run dev`) dan database lokal
 * sudah dimigrasi + di-seed:
 *   bun run db:migrate:local && bun run db:seed && bun run db:seed:local
 *
 * Jalankan: bun run test:profile
 */

const BASE = "http://localhost:5173/api";
const ADMIN = { username: "admin", password: "snack123" };
/** Orang tua biasa — 1 anak (Aisyah Sari, kelas 1). */
const PARENT = { username: "sari", password: "snack123" };
/** Korlas kelas 1 — sekaligus orang tua, jadi boleh memakai layanan ini juga. */
const KORLAS = { username: "budi", password: "snack123" };
/** Orang tua dengan 2 anak (kelas 2 dan 3). */
const OTHER_PARENT = { username: "dewi", password: "snack123" };

/** Awalan nama anak buatan uji — dipakai untuk membersihkan sisa uji. */
const TEST_PREFIX = "Uji Anak";

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
  return { status: res.status, json, data: json?.data ?? null };
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

/** Nama anak yang terlihat oleh pemiliknya sendiri. */
function names(students) {
  return (students ?? []).map((student) => student.name);
}

/** Buang sisa anak buatan uji; anak asli (non-"Uji Anak") dibiarkan. */
async function cleanup(token) {
  const { data } = await call("GET", "/profile/students", { token });
  const stuck = [];

  for (const student of data ?? []) {
    if (!student.name.startsWith(TEST_PREFIX)) continue;

    const res = await call("DELETE", `/profile/students/${student.id}`, { token });
    // Penjaga "anak terakhir" menolak bila anak uji ini satu-satunya anak —
    // artinya data uji sebelumnya sudah merusak data asli, jadi perlu terlihat.
    if (res.status !== 200) stuck.push(`${student.name} (${res.status})`);
  }

  return stuck;
}

const adminToken = await login(ADMIN);
const parentToken = await login(PARENT);
const korlasToken = await login(KORLAS);
const otherToken = await login(OTHER_PARENT);

await cleanup(parentToken);
await cleanup(korlasToken);

// ── Akses ─────────────────────────────────────────────────────

section("Akses");

const anonymous = await call("GET", "/profile/students");
check("tanpa token → 401", anonymous.status === 401, `status ${anonymous.status}`);

const asAdmin = await call("GET", "/profile/students", { token: adminToken });
check(
  "admin ditolak → 403 (admin tidak punya profil orang tua)",
  asAdmin.status === 403,
  `status ${asAdmin.status}`,
);

const asAdminWrite = await call("POST", "/profile/students", {
  token: adminToken,
  body: { name: "Anak Admin", className: "1" },
});
check(
  "admin tidak boleh menambah anak lewat /profile → 403",
  asAdminWrite.status === 403,
  `status ${asAdminWrite.status}`,
);

const own = await call("GET", "/profile/students", { token: parentToken });
check(
  "orang tua melihat anaknya sendiri",
  own.status === 200 && names(own.data).includes("Aisyah Sari"),
  JSON.stringify(own.data),
);

// Dijalankan saat sari masih punya tepat satu anak — invariannya "profil orang
// tua tidak boleh kosong", jadi pengujiannya harus di titik ini.
const soleChild = (own.data ?? []).find(
  (student) => !student.name.startsWith(TEST_PREFIX),
);
const removeLast = await call("DELETE", `/profile/students/${soleChild?.id}`, {
  token: parentToken,
});
check(
  "anak terakhir tidak boleh dihapus → 400",
  removeLast.status === 400,
  `status ${removeLast.status}`,
);

const afterGuard = await call("GET", "/profile/students", { token: parentToken });
check(
  "anak terakhir tetap ada setelah percobaan hapus",
  names(afterGuard.data).includes("Aisyah Sari"),
  JSON.stringify(names(afterGuard.data)),
);

// ── Validasi ──────────────────────────────────────────────────

section("Validasi");

const noName = await call("POST", "/profile/students", {
  token: parentToken,
  body: { className: "4" },
});
check("nama kosong → 400", noName.status === 400, `status ${noName.status}`);

const blankName = await call("POST", "/profile/students", {
  token: parentToken,
  body: { name: "   ", className: "4" },
});
check("nama hanya spasi → 400", blankName.status === 400, `status ${blankName.status}`);

const noClass = await call("POST", "/profile/students", {
  token: parentToken,
  body: { name: `${TEST_PREFIX} Tanpa Kelas` },
});
check("kelas kosong → 400", noClass.status === 400, `status ${noClass.status}`);

const badJson = await fetch(`${BASE}/profile/students`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${parentToken}`,
  },
  body: "{bukan json",
});
check("body bukan JSON → 400", badJson.status === 400, `status ${badJson.status}`);

// ── Menambah anak ─────────────────────────────────────────────

section("Menambah anak");

const added = await call("POST", "/profile/students", {
  token: parentToken,
  body: { name: `${TEST_PREFIX} Satu`, className: "4" },
});
check(
  "tambah anak → 201",
  added.status === 201 && added.data?.name === `${TEST_PREFIX} Satu`,
  `status ${added.status} ${JSON.stringify(added.data)}`,
);
check("kelas tersimpan apa adanya", added.data?.className === "4", `${added.data?.className}`);

const addedId = added.data?.id;

const second = await call("POST", "/profile/students", {
  token: parentToken,
  body: { name: `${TEST_PREFIX} Dua`, className: "9" },
});
check("tambah anak kedua → 201", second.status === 201, `status ${second.status}`);

const afterAdd = await call("GET", "/profile/students", { token: parentToken });
check(
  "daftar anak bertambah",
  (afterAdd.data ?? []).length === 3,
  `jumlah ${(afterAdd.data ?? []).length}`,
);

const me = await call("GET", "/auth/me", { token: parentToken });
check(
  "profil sesi ikut memuat anak baru",
  names(me.data?.user?.students).includes(`${TEST_PREFIX} Satu`),
  JSON.stringify(names(me.data?.user?.students)),
);

const classes = await call("GET", "/classes", { token: parentToken });
check(
  "kelas anak baru muncul di daftar kelas yang bisa diakses",
  (classes.data?.classes ?? []).includes("9"),
  JSON.stringify(classes.data?.classes),
);

const suggestions = await call("GET", "/profile/classes", { token: parentToken });
check(
  "saran kelas tersedia untuk kolom isian",
  suggestions.status === 200 && (suggestions.data?.classes ?? []).includes("1"),
  JSON.stringify(suggestions.data?.classes),
);

// ── Mengubah anak ─────────────────────────────────────────────

section("Mengubah anak");

const renamed = await call("PUT", `/profile/students/${addedId}`, {
  token: parentToken,
  body: { name: `${TEST_PREFIX} Satu Diubah` },
});
check(
  "ubah nama → 200",
  renamed.status === 200 && renamed.data?.name === `${TEST_PREFIX} Satu Diubah`,
  `status ${renamed.status} ${JSON.stringify(renamed.data)}`,
);
check(
  "kelas lama dipertahankan bila tidak dikirim",
  renamed.data?.className === "4",
  `${renamed.data?.className}`,
);

const cleared = await call("PUT", `/profile/students/${addedId}`, {
  token: parentToken,
  body: { className: null },
});
check(
  "kelas boleh dikosongkan dengan null",
  cleared.status === 200 && cleared.data?.className === null,
  `status ${cleared.status} ${JSON.stringify(cleared.data)}`,
);

const restored = await call("PUT", `/profile/students/${addedId}`, {
  token: parentToken,
  body: { className: "4" },
});
check("kelas bisa diisi ulang", restored.data?.className === "4");

const blankClassUpdate = await call("PUT", `/profile/students/${addedId}`, {
  token: parentToken,
  body: { className: "" },
});
check(
  "kelas string kosong → 400 (pakai null untuk mengosongkan)",
  blankClassUpdate.status === 400,
  `status ${blankClassUpdate.status}`,
);

// ── Kepemilikan ───────────────────────────────────────────────

section("Kepemilikan data");

const stealUpdate = await call("PUT", `/profile/students/${addedId}`, {
  token: otherToken,
  body: { name: "Dibajak" },
});
check(
  "orang tua lain tidak bisa mengubah anak ini → 404",
  stealUpdate.status === 404,
  `status ${stealUpdate.status}`,
);

const stealDelete = await call("DELETE", `/profile/students/${addedId}`, {
  token: otherToken,
});
check(
  "orang tua lain tidak bisa menghapus anak ini → 404",
  stealDelete.status === 404,
  `status ${stealDelete.status}`,
);

const stillThere = await call("GET", "/profile/students", { token: parentToken });
check(
  "data anak tetap utuh setelah percobaan di atas",
  names(stillThere.data).includes(`${TEST_PREFIX} Satu Diubah`),
);

// ── Menghapus anak ────────────────────────────────────────────

section("Menghapus anak");

const removed = await call("DELETE", `/profile/students/${addedId}`, {
  token: parentToken,
});
check("hapus anak → 200", removed.status === 200, `status ${removed.status}`);

const afterRemove = await call("GET", "/profile/students", { token: parentToken });
check(
  "daftar kembali ke 2 anak (1 asli + 1 anak uji kedua)",
  (afterRemove.data ?? []).length === 2,
  `jumlah ${(afterRemove.data ?? []).length}`,
);

const removeTwice = await call("DELETE", `/profile/students/${addedId}`, {
  token: parentToken,
});
check(
  "menghapus anak yang sudah hilang → 404",
  removeTwice.status === 404,
  `status ${removeTwice.status}`,
);

const classesAfter = await call("GET", "/classes", { token: parentToken });
check(
  "kelas anak yang dihapus hilang dari kelas yang bisa diakses",
  !(classesAfter.data?.classes ?? []).includes("4"),
  JSON.stringify(classesAfter.data?.classes),
);

// ── Korlas juga orang tua ─────────────────────────────────────

section("Korlas sebagai orang tua");

const korlasAdd = await call("POST", "/profile/students", {
  token: korlasToken,
  body: { name: `${TEST_PREFIX} Korlas`, className: "1" },
});
check("korlas boleh menambah anaknya → 201", korlasAdd.status === 201, `status ${korlasAdd.status}`);

const korlasRemove = await call("DELETE", `/profile/students/${korlasAdd.data?.id}`, {
  token: korlasToken,
});
check("korlas boleh menghapusnya lagi → 200", korlasRemove.status === 200, `status ${korlasRemove.status}`);

// ── Pembersihan ───────────────────────────────────────────────

const stuck = [...(await cleanup(parentToken)), ...(await cleanup(korlasToken))];
check(
  "sisa anak buatan uji sudah bersih",
  stuck.length === 0,
  stuck.join(", "),
);

const finalCheck = await call("GET", "/profile/students", { token: parentToken });
check(
  "anak asli tetap utuh di akhir uji",
  names(finalCheck.data).includes("Aisyah Sari"),
  JSON.stringify(names(finalCheck.data)),
);

// ── Ringkasan ─────────────────────────────────────────────────

console.log(`\n=== HASIL: ${pass} pass, ${fail} fail ===`);
if (failures.length > 0) {
  console.log("\nGagal:");
  for (const name of failures) console.log(`  - ${name}`);
}
process.exit(fail === 0 ? 0 : 1);
