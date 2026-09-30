/**
 * Verifikasi ekspor data akun orang tua ke Excel — dijalankan di Node/Bun.
 *
 * Membuktikan, terhadap server sungguhan (dev server + DB lokal ter-seed):
 *   - tanpa token -> 401; korlas/orang tua -> 403 (server, bukan sekadar UI);
 *   - admin bisa mengunduh, dan hasilnya benar-benar berkas `.xlsx` (PK);
 *   - nama berkasnya berformat slug ASCII tanpa spasi;
 *   - `Content-Disposition` dan `Content-Type` benar.
 *
 * Jalankan: bun run outputs/check-export-akun.mjs
 * (dev server harus jalan: `bun run dev`, DB lokal ter-seed)
 */
const BASE = "http://localhost:5173/api";
const PASSWORD = "snack123";

let pass = 0;
let fail = 0;

function check(name, condition, detail = "") {
  if (condition) {
    pass++;
    console.log(`  PASS  ${name}`);
  } else {
    fail++;
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

const log = (label, value) => console.log(`${label}: ${value}`);

async function login(username) {
  const response = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password: PASSWORD }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(`login ${username} gagal: ${response.status}`);
  return body.data.token;
}

/** Unduh apa adanya, tanpa mengurai JSON — responsnya biner. */
function exportRequest(token, query = "") {
  return fetch(`${BASE}/parents/export${query}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

// ── 1. Tanpa token ────────────────────────────────────────────
console.log("\n=== 1. Tanpa token ===");
const anonymous = await exportRequest(null);
check("tanpa token -> 401", anonymous.status === 401, `status ${anonymous.status}`);

// ── 2. Role yang tidak berhak ─────────────────────────────────
console.log("\n=== 2. Role yang tidak berhak ===");
for (const username of ["budi", "sari"]) {
  const token = await login(username);
  const response = await exportRequest(token);
  check(
    `${username} -> 403 (server, bukan hanya UI)`,
    response.status === 403,
    `status ${response.status}`,
  );
}

// ── 3. Admin ──────────────────────────────────────────────────
console.log("\n=== 3. Admin ===");
const adminToken = await login("admin");

const response = await exportRequest(adminToken);
check("admin -> 200", response.status === 200, `status ${response.status}`);

const disposition = response.headers.get("Content-Disposition") ?? "";
log("Content-Disposition", disposition);
log("Content-Type", response.headers.get("Content-Type") ?? "");

check(
  "Content-Type = xlsx",
  (response.headers.get("Content-Type") ?? "").includes(
    "spreadsheetml.sheet",
  ),
);

const filename = /filename="?([^";]+)"?/i.exec(disposition)?.[1] ?? "";
log("nama berkas", filename);
check(
  "nama berkas slug ASCII tanpa spasi",
  /^akun-orang-tua-\d{4}-\d{2}-\d{2}\.xlsx$/.test(filename),
  filename,
);

const bytes = new Uint8Array(await response.arrayBuffer());
log("ukuran berkas", `${bytes.length} byte`);
check("berkas benar-benar Excel (tanda tangan PK)", bytes[0] === 0x50 && bytes[1] === 0x4b, `${bytes[0]},${bytes[1]}`);
check("berkasnya berisi (bukan kosong)", bytes.length > 1000, `${bytes.length} byte`);

const text = new TextDecoder().decode(bytes);
check("lembar memuat judul", text.includes("Daftar Akun Orang Tua"));
check("lembar memuat kepala kolom", text.includes("Nama orang tua"));
check(
  "lembar memuat baris ringkasan",
  /Ringkasan: \d+ akun/.test(text),
);

// ── 4. Filter `active` ────────────────────────────────────────
console.log("\n=== 4. Filter active ===");
for (const active of ["true", "false"]) {
  const filtered = await exportRequest(adminToken, `?active=${active}`);
  const filteredBytes = new Uint8Array(await filtered.arrayBuffer());
  check(
    `active=${active} -> 200 & berkas xlsx`,
    filtered.status === 200 && filteredBytes[0] === 0x50,
    `status ${filtered.status}`,
  );
}

console.log(`\n=== HASIL: ${pass} pass, ${fail} fail ===`);
process.exit(fail === 0 ? 0 : 1);
