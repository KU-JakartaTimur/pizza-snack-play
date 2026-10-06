/**
 * Verifikasi impor akun orang tua dari berkas Excel — dijalankan di Node/Bun.
 *
 * Membuktikan, terhadap server sungguhan (dev server + DB lokal ter-seed):
 *   - tanpa token -> 401; korlas/orang tua -> 403 (server, bukan sekadar UI);
 *   - berkas hasil ekspor bisa diunggah kembali dan terbaca (jalur bundar);
 *   - yang sudah ada **ditimpa**, yang belum **dibuat** — dan hasilnya
 *     benar-benar tersimpan, bukan hanya dilaporkan;
 *   - `dryRun` tidak menulis apa pun;
 *   - baris kembar, akun baru tanpa password, dan baris tidak sah dilaporkan
 *     sebagai `skip`/`issues` — bukan diam-diam diabaikan;
 *   - password yang dikosongkan tidak mengubah password akun lama
 *     (dibuktikan dengan login memakai password lamanya);
 *   - id anak yang namanya tidak berubah tetap dipertahankan;
 *   - berkas yang bukan Excel ditolak dengan pesan yang jelas.
 *
 * Berkas ujinya sengaja dibuat dengan **kompresi deflate** (seperti Excel),
 * bukan mode *store* seperti ekspor kita — itulah satu-satunya bagian
 * pembaca `.xlsx` yang bergantung pada runtime (`DecompressionStream`), jadi
 * harus dibuktikan di Worker sungguhan, bukan hanya di `bun test`.
 *
 * Jalankan: bun run outputs/check-import-akun.mjs
 * (dev server harus jalan: `bun run dev`, DB lokal ter-seed)
 */
import { crc32, deflateRawSync } from "node:zlib";
import { ACCOUNT_COLUMNS } from "../src/api/parents/export.ts";
import { parseAccountsSheet } from "../src/api/parents/import.ts";
import { readXlsxGrid } from "../src/api/utils/xlsxRead.ts";

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

async function login(username, password = PASSWORD) {
  const response = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const body = await response.json().catch(() => ({}));
  return { status: response.status, token: body?.data?.token ?? null };
}

async function adminToken() {
  const result = await login("admin");
  if (!result.token) throw new Error(`login admin gagal: ${result.status}`);
  return result.token;
}

// ── Penyusun berkas uji (deflate + inlineStr) ─────────────────

/** ZIP mode deflate — bentuk yang ditulis Excel/WPS. */
function zipDeflated(files) {
  const encoder = new TextEncoder();
  const locals = [];
  const central = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const raw = encoder.encode(file.text);
    const compressed = new Uint8Array(deflateRawSync(raw));
    const crc = crc32(raw) >>> 0;

    const local = new Uint8Array(30 + nameBytes.length);
    const localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0x0800, true);
    localView.setUint16(8, 8, true); // deflate
    localView.setUint32(14, crc, true);
    localView.setUint32(18, compressed.length, true);
    localView.setUint32(22, raw.length, true);
    localView.setUint16(26, nameBytes.length, true);
    local.set(nameBytes, 30);

    locals.push(local, compressed);

    const entry = new Uint8Array(46 + nameBytes.length);
    const entryView = new DataView(entry.buffer);
    entryView.setUint32(0, 0x02014b50, true);
    entryView.setUint16(4, 20, true);
    entryView.setUint16(6, 20, true);
    entryView.setUint16(8, 0x0800, true);
    entryView.setUint16(10, 8, true);
    entryView.setUint32(16, crc, true);
    entryView.setUint32(20, compressed.length, true);
    entryView.setUint32(24, raw.length, true);
    entryView.setUint16(28, nameBytes.length, true);
    entryView.setUint32(42, offset, true);
    entry.set(nameBytes, 46);

    central.push(entry);
    offset += local.length + compressed.length;
  }

  const centralSize = central.reduce((total, part) => total + part.length, 0);
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  eocdView.setUint32(0, 0x06054b50, true);
  eocdView.setUint16(8, central.length, true);
  eocdView.setUint16(10, central.length, true);
  eocdView.setUint32(12, centralSize, true);
  eocdView.setUint32(16, offset, true);

  const parts = [...locals, ...central, eocd];
  const out = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let cursor = 0;
  for (const part of parts) {
    out.set(part, cursor);
    cursor += part.length;
  }
  return out;
}

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const HEADER = [
  ACCOUNT_COLUMNS.parentName,
  ACCOUNT_COLUMNS.username,
  ACCOUNT_COLUMNS.password,
  ACCOUNT_COLUMNS.role,
  ACCOUNT_COLUMNS.className,
  ACCOUNT_COLUMNS.students,
  ACCOUNT_COLUMNS.active,
  ACCOUNT_COLUMNS.locked,
  ACCOUNT_COLUMNS.lastLogin,
];

/**
 * Susun lembar seperti hasil ekspor (judul, kepala kolom, data, ringkasan),
 * lalu kompres dengan deflate. `rows` = array kolom yang sudah berupa teks.
 */
function xlsxFromRows(rows) {
  const column = (index) => {
    let name = "";
    let value = index;
    while (value >= 0) {
      name = String.fromCharCode(65 + (value % 26)) + name;
      value = Math.floor(value / 26) - 1;
    }
    return name;
  };

  const line = (cells, rowNumber, style = false) => {
    const parts = cells
      .map((value, index) =>
        value === null || value === undefined || value === ""
          ? null
          : `<c r="${column(index)}${rowNumber}"${style ? ' s="1"' : ""} t="inlineStr">` +
            `<is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`,
      )
      .filter(Boolean)
      .join("");
    return `<row r="${rowNumber}">${parts}</row>`;
  };

  const sheetData = [
    line(["Daftar Akun Orang Tua"], 1, true),
    line(["Semua akun"], 2, true),
    line([], 3),
    line(HEADER, 4, true),
    ...rows.map((cells, index) => line(cells, 5 + index)),
    line([], 5 + rows.length),
    line(["Ringkasan: contoh"], 6 + rows.length, true),
  ].join("");

  return zipDeflated([
    {
      name: "xl/worksheets/sheet1.xml",
      text:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
        `<sheetData>${sheetData}</sheetData>` +
        "</worksheet>",
    },
  ]);
}

const toBase64 = (bytes) => Buffer.from(bytes).toString("base64");

// ── Pemanggil API ─────────────────────────────────────────────

function importRequest(token, body) {
  return fetch(`${BASE}/parents/import`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

async function json(response) {
  return response.json().catch(() => ({}));
}

async function searchParents(token, search) {
  const response = await fetch(
    `${BASE}/parents?search=${encodeURIComponent(search)}&perPage=50`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const body = await json(response);
  return body?.data?.items ?? [];
}

// ── 1. Tanpa token ────────────────────────────────────────────
console.log("\n=== 1. Tanpa token ===");
const anonymous = await importRequest(null, { content: "AAA", dryRun: true });
check("tanpa token -> 401", anonymous.status === 401, `status ${anonymous.status}`);

// ── 2. Role yang tidak berhak ─────────────────────────────────
console.log("\n=== 2. Role yang tidak berhak ===");
for (const username of ["budi", "sari"]) {
  const { token, status } = await login(username);
  if (!token) {
    check(`${username} bisa login (prasyarat)`, false, `status ${status}`);
    continue;
  }
  const response = await importRequest(token, { content: "AAA", dryRun: true });
  check(
    `${username} -> 403 (server, bukan hanya UI)`,
    response.status === 403,
    `status ${response.status}`,
  );
}

const token = await adminToken();

// ── 3. Isi yang jelas bukan Excel ─────────────────────────────
console.log("\n=== 3. Berkas bukan Excel ===");
const notExcel = await importRequest(token, {
  content: Buffer.from("nama,username\nSari,sari\n").toString("base64"),
  dryRun: true,
});
const notExcelBody = await json(notExcel);
log("pesan", notExcelBody.message);
check(
  "byte non-ZIP -> 400 dengan pesan .xlsx",
  notExcel.status === 400 && /Excel/i.test(notExcelBody.message ?? ""),
  `status ${notExcel.status}`,
);

const emptyBody = await importRequest(token, { dryRun: true });
check("berkas kosong -> 400", emptyBody.status === 400, `status ${emptyBody.status}`);

// ── 4. Bundar: ekspor lalu unggah kembali ─────────────────────
console.log("\n=== 4. Bundar: ekspor -> unggah ===");
const exportResponse = await fetch(`${BASE}/parents/export`, {
  headers: { Authorization: `Bearer ${token}` },
});
check("ekspor -> 200", exportResponse.status === 200, `status ${exportResponse.status}`);

const exportBytes = new Uint8Array(await exportResponse.arrayBuffer());
const exportGrid = await readXlsxGrid(exportBytes);
const parsedExport = parseAccountsSheet(exportGrid);
check("berkas ekspor terbaca sebagai lembar akun", parsedExport.ok === true,
  parsedExport.ok ? "" : parsedExport.error);

const existing = parsedExport.ok ? parsedExport.rows : [];
log("akun terbaca dari ekspor", existing.length);
check("ekspor memuat akun", existing.length > 0, `${existing.length}`);

const roundTrip = await importRequest(token, {
  content: toBase64(exportBytes),
  dryRun: true,
});
const roundTripBody = await json(roundTrip);
log("pesan", roundTripBody.message);
check("berkas ekspor sendiri -> 200", roundTrip.status === 200, `status ${roundTrip.status}`);
check(
  "semua akun ekspor dikenali sebagai akun lama (ditimpa, bukan dibuat)",
  roundTripBody?.data?.created === 0 &&
    roundTripBody?.data?.updated === existing.length &&
    roundTripBody?.data?.skipped === 0,
  JSON.stringify(roundTripBody?.data ?? {}).slice(0, 200),
);

// ── 5. Siapkan berkas uji dari data nyata ─────────────────────
console.log("\n=== 5. Pratinjau (dryRun) ===");

/**
 * Baris hasil `parseAccountsSheet` tidak memuat `id` — id tidak pernah
 * diekspor. Karena itu data acuan diambil dari API, bukan dari lembar.
 */
const allParents = await (
  await fetch(`${BASE}/parents?perPage=100`, {
    headers: { Authorization: `Bearer ${token}` },
  })
).json();
const parentList = allParents?.data?.items ?? [];
log("akun di database", parentList.length);

const sari = parentList.find((item) => item.username === "sari");
// Akun yang punya anak: supaya pemeriksaan "id anak dipertahankan" bermakna.
const renameTarget = parentList.find(
  (item) => item.username !== "sari" && item.students.length > 0,
);

if (!sari || !renameTarget) {
  console.log("  (data seed tidak lengkap — lewati sisa pengujian)");
  console.log(`\n=== HASIL: ${pass} pass, ${fail} fail ===`);
  process.exit(fail === 0 ? 0 : 1);
}

/** Teks kolom `Anak` seperti yang ditulis ekspor. */
const studentsText = (parent) =>
  parent.students
    .map((child) => (child.className ? `${child.name} (${child.className})` : child.name))
    .join(", ");

const roleText = (parent) => (parent.role === "korlas" ? "Korlas" : "Orang tua");

const stamp = Date.now();
const newUsername = `uji-impor-${stamp}`;
const renamedName = `${renameTarget.parentName} (uji impor)`;
const childIdsBefore = renameTarget.students.map((child) => child.id);

const testRows = [
  // 1. akun lama -> ditimpa
  [
    renamedName,
    renameTarget.username,
    "",
    roleText(renameTarget),
    renameTarget.className ?? "",
    studentsText(renameTarget),
    "Ya",
    "",
    "",
  ],
  // 2. akun lama tanpa perubahan — password dikosongkan
  [
    sari.parentName,
    sari.username,
    "",
    roleText(sari),
    sari.className ?? "",
    studentsText(sari),
    "Ya",
    "",
    "",
  ],
  // 3. akun baru
  ["Akun Uji Impor", newUsername, "rahasia123", "Orang tua", "", "Anak Uji (1A)", "Ya", "", ""],
  // 4. username kembar di dalam satu berkas -> dilewati
  ["Akun Uji Kembar", newUsername, "rahasia123", "Orang tua", "", "Anak Kembar (1A)", "Ya", "", ""],
  // 5. akun baru tanpa password -> dilewati
  [`Tanpa Password ${stamp}`, `uji-tanpa-pw-${stamp}`, "", "Orang tua", "", "Anak (1A)", "Ya", "", ""],
  // 6. username tidak sah -> dilaporkan sebagai issue
  ["Username Tidak Sah", "AB", "rahasia123", "Orang tua", "", "Anak (1A)", "Ya", "", ""],
];

const testBytes = xlsxFromRows(testRows);

const preview = await importRequest(token, {
  content: toBase64(testBytes),
  dryRun: true,
});
const previewBody = await json(preview);
log("pesan", previewBody.message);
const previewData = previewBody?.data ?? {};
log("ringkasan", JSON.stringify({
  totalRows: previewData.totalRows,
  created: previewData.created,
  updated: previewData.updated,
  skipped: previewData.skipped,
  issues: previewData.issues?.length,
}));

check("pratinjau -> 200", preview.status === 200, `status ${preview.status}`);
check("dryRun ditandai pada hasil", previewData.dryRun === true);
check("6 baris data terbaca", previewData.totalRows === 6, `${previewData.totalRows}`);
check("1 akun baru", previewData.created === 1, `${previewData.created}`);
check("2 akun ditimpa", previewData.updated === 2, `${previewData.updated}`);
check("2 baris dilewati", previewData.skipped === 2, `${previewData.skipped}`);
check("1 baris bermasalah", previewData.issues?.length === 1, `${previewData.issues?.length}`);

const skipReasons = (previewData.rows ?? [])
  .filter((row) => row.outcome === "skip")
  .map((row) => row.reason);
log("alasan dilewati", JSON.stringify(skipReasons));
check(
  "username kembar & password kosong dilaporkan sebagai sebab",
  skipReasons.some((reason) => /lebih dari sekali/.test(reason ?? "")) &&
    skipReasons.some((reason) => /memerlukan password/.test(reason ?? "")),
);
check(
  "username tidak sah masuk daftar masalah",
  /tidak sah/.test(previewData.issues?.[0]?.message ?? ""),
  previewData.issues?.[0]?.message,
);

// dryRun tidak boleh menulis apa pun.
const afterDryRun = await searchParents(token, newUsername);
check("dryRun tidak membuat akun", afterDryRun.length === 0, `${afterDryRun.length} akun`);
const renameAfterDryRun = await searchParents(token, renameTarget.username);
check(
  "dryRun tidak mengubah nama akun lama",
  renameAfterDryRun[0]?.parentName === renameTarget.parentName,
  renameAfterDryRun[0]?.parentName,
);

// ── 6. Terapkan ───────────────────────────────────────────────
console.log("\n=== 6. Terapkan ===");
const applied = await importRequest(token, {
  content: toBase64(testBytes),
  dryRun: false,
});
const appliedBody = await json(applied);
log("pesan", appliedBody.message);
check("terapkan -> 200", applied.status === 200, `status ${applied.status}`);
check("hasil ditandai bukan dryRun", appliedBody?.data?.dryRun === false);

const createdAccounts = await searchParents(token, newUsername);
check("akun baru benar-benar tersimpan", createdAccounts.length === 1, `${createdAccounts.length}`);
const created = createdAccounts[0];
log("akun baru", JSON.stringify({
  username: created?.username,
  parentName: created?.parentName,
  role: created?.role,
  students: created?.students,
  isActive: created?.isActive,
}));
check("nama akun baru sesuai berkas", created?.parentName === "Akun Uji Impor");
check(
  "anak akun baru tersimpan beserta kelasnya",
  created?.students?.[0]?.name === "Anak Uji" && created?.students?.[0]?.className === "1A",
  JSON.stringify(created?.students),
);

const renamed = await searchParents(token, renameTarget.username);
check("akun lama ditimpa namanya", renamed[0]?.parentName === renamedName, renamed[0]?.parentName);
check(
  "id anak dipertahankan saat nama anak tidak berubah",
  JSON.stringify(renamed[0]?.students?.map((child) => child.id)) ===
    JSON.stringify(childIdsBefore),
  `${JSON.stringify(childIdsBefore)} -> ${JSON.stringify(renamed[0]?.students?.map((child) => child.id))}`,
);

// Password `sari` dikosongkan di berkas: harus tetap bisa masuk.
const sariLogin = await login("sari");
check(
  "password yang dikosongkan tidak mengubah password akun lama",
  sariLogin.status === 200 && Boolean(sariLogin.token),
  `status ${sariLogin.status}`,
);

// Akun baru harus benar-benar bisa dipakai masuk.
const newLogin = await login(newUsername, "rahasia123");
check("akun baru bisa masuk dengan password dari berkas", newLogin.status === 200,
  `status ${newLogin.status}`);

// ── 7. Bersih-bersih ──────────────────────────────────────────
console.log("\n=== 7. Bersih-bersih ===");
const removeResponse = await fetch(
  `${BASE}/parents/${created.id}?hard=true`,
  { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
);
check("akun uji dihapus kembali", removeResponse.status === 200, `status ${removeResponse.status}`);
const afterRemove = await searchParents(token, newUsername);
check("akun uji benar-benar hilang", afterRemove.length === 0, `${afterRemove.length}`);

const revertResponse = await fetch(`${BASE}/parents/${renameTarget.id}`, {
  method: "PUT",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ parentName: renameTarget.parentName }),
});
check("nama akun lama dikembalikan", revertResponse.status === 200, `status ${revertResponse.status}`);

console.log(`\n=== HASIL: ${pass} pass, ${fail} fail ===`);
process.exit(fail === 0 ? 0 : 1);
