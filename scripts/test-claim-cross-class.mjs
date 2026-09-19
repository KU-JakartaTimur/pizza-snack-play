/**
 * Verifikasi perilaku yang diminta: klaim bersifat per (tanggal × kelas).
 *
 * Skenario:
 *   1. Admin siapkan jadwal tanggal sama untuk kelas 1 dan kelas 2, lalu
 *      kunci + publikasi semua kelas sekaligus.
 *   2. Orang tua kelas 1 (`sari`) mengambil tanggal itu di kelas 1.
 *   3. Orang tua kelas 1 lain (`budi`) mencoba tanggal yang sama di kelas 1
 *      → harus ditolak 409.
 *   4. Orang tua kelas 2 (`dewi`) mengambil tanggal yang sama di kelas 2
 *      → harus berhasil, karena kelasnya berbeda.
 */
const BASE = "http://localhost:5174/api";
const DATE = "2033-04-05"; // Selasa, jauh di depan

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

async function login(username) {
  const r = await call("POST", "/auth/login", {
    body: { username, password: "snack123" },
  });
  return r.data?.token;
}

let pass = 0;
let fail = 0;
const check = (name, cond, detail = "") => {
  if (cond) {
    pass++;
    console.log(`  PASS  ${name}`);
  } else {
    fail++;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
};

const admin = await login("admin");
const sari = await login("sari"); // orang tua kelas 1
const budi = await login("budi"); // korlas kelas 1 (juga orang tua kelas 1)
const dewi = await login("dewi"); // orang tua kelas 2 & 3

// Bersihkan sisa uji.
for (const cls of ["1", "2"]) {
  const rows = await call(
    "GET",
    `/schedules/range?from=${DATE}&to=${DATE}&class=${cls}`,
    { token: admin },
  );
  for (const day of rows.data ?? []) {
    if (day.scheduleId) {
      await call("POST", `/schedules/${day.scheduleId}/unlock`, { token: admin });
      await call("DELETE", `/schedules/${day.scheduleId}`, { token: admin });
    }
  }
}

// Siapkan menu + jadwal untuk kelas 1 dan 2 pada tanggal yang sama.
const menu = await call("POST", "/menus", {
  token: admin,
  body: {
    name: `Menu Kelas Lintas ${Date.now()}`,
    items: [{ name: "Risol lintas", itemType: "main" }],
  },
});
const menuId = menu.data?.id;
check("menu uji dibuat", menu.status === 201, `got ${menu.status}`);

const created = {};
for (const cls of ["1", "2"]) {
  const r = await call("POST", "/schedules", {
    token: admin,
    body: { scheduleDate: DATE, className: cls, menuId },
  });
  created[cls] = r.data?.scheduleId;
  check(`jadwal kelas ${cls} dibuat`, r.status === 201, `got ${r.status}`);
}

// Kunci + publikasi SEMUA kelas dalam satu tindakan (perilaku baru).
const lock = await call("POST", "/schedules/lock", {
  token: admin,
  body: { fromDate: DATE, toDate: DATE },
});
check(
  "admin mengunci semua kelas sekaligus",
  lock.status === 200 && lock.data?.locked >= 2,
  `locked=${lock.data?.locked}`,
);

const publish = await call("POST", "/schedules/publish", {
  token: admin,
  body: { year: 2033, month: 4 },
});
check(
  "admin mempublikasi semua kelas sekaligus",
  publish.status === 200,
  `got ${publish.status} ${publish.json?.message ?? ""}`,
);
check(
  "publikasi mencakup kelas 1 dan 2",
  ["1", "2"].every((cls) => (publish.data?.classes ?? []).includes(cls)),
  JSON.stringify(publish.data?.classes),
);

// Orang tua kelas 1 mengambil tanggalnya.
const sariTake = await call("POST", "/claims", {
  token: sari,
  body: { scheduleId: created["1"] },
});
check("orang tua kelas 1 berhasil mengambil", sariTake.status === 201, `got ${sariTake.status} ${sariTake.json?.message ?? ""}`);

// Orang tua kelas 1 LAIN mencoba tanggal yang sama → harus ditolak.
const budiTake = await call("POST", "/claims", {
  token: budi,
  body: { scheduleId: created["1"] },
});
check(
  "orang tua kelas 1 lain TIDAK bisa mengambil tanggal yang sama",
  budiTake.status === 409,
  `got ${budiTake.status} ${budiTake.json?.message ?? ""}`,
);
check(
  "pesan menyebut pemilik pertama",
  typeof budiTake.json?.message === "string" &&
    budiTake.json.message.toLowerCase().includes("sudah dipilih"),
  budiTake.json?.message,
);

// Orang tua kelas 2 tetap BISA mengambil tanggal yang sama di kelasnya.
const dewiTake = await call("POST", "/claims", {
  token: dewi,
  body: { scheduleId: created["2"] },
});
check(
  "orang tua kelas 2 MASIH bisa mengambil tanggal yang sama",
  dewiTake.status === 201,
  `got ${dewiTake.status} ${dewiTake.json?.message ?? ""}`,
);

// Bersihkan.
for (const cls of ["1", "2"]) {
  const rows = await call(
    "GET",
    `/schedules/range?from=${DATE}&to=${DATE}&class=${cls}`,
    { token: admin },
  );
  for (const day of rows.data ?? []) {
    if (day.claim?.id) {
      await call("DELETE", `/claims/${day.claim.id}`, { token: admin });
    }
  }
}
for (const cls of ["1", "2"]) {
  const rows = await call(
    "GET",
    `/schedules/range?from=${DATE}&to=${DATE}&class=${cls}`,
    { token: admin },
  );
  for (const day of rows.data ?? []) {
    if (day.scheduleId) {
      await call("POST", `/schedules/${day.scheduleId}/unlock`, { token: admin });
      await call("DELETE", `/schedules/${day.scheduleId}`, { token: admin });
    }
  }
}
if (menuId) {
  await call("DELETE", `/menus/${menuId}?force=true`, { token: admin });
}

console.log(`\n=== HASIL: ${pass} pass, ${fail} fail ===`);
process.exit(fail === 0 ? 0 : 1);
