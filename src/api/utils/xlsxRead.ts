/**
 * Pembaca berkas `.xlsx` seadanya — pasangan dari `xlsx.ts`.
 *
 * Kenapa ditulis sendiri: yang kita butuhkan hanya **satu lembar tabel
 * sederhana** dibaca kembali sebagai teks. Pustaka `exceljs`/`xlsx` jauh lebih
 * berat dari itu dan harus ikut di-bundle ke Worker.
 *
 * `.xlsx` adalah arsip ZIP berisi XML. Di sini ZIP-nya dibaca sendiri
 * (daftar isi di *central directory*, isi berkasnya digelembungkan dengan
 * `DecompressionStream("deflate-raw")` yang tersedia di Workers), lalu
 * `xl/worksheets/sheetN.xml` diterjemahkan menjadi kisi teks.
 *
 * Dua bentuk penyimpanan teks sel ditangani, karena keduanya nyata:
 *  - `t="inlineStr"` — tulisan kita sendiri (`xlsx.ts`);
 *  - `t="s"` — indeks ke `xl/sharedStrings.xml`, bentuk yang dipakai Excel/WPS
 *    begitu berkasnya disimpan ulang. Berkas yang kita ekspor lalu disunting
 *    admin di Excel **akan** berbentuk begini, jadi wajib didukung.
 *
 * Modul ini murni: byte masuk, kisi teks keluar. Tidak menyentuh database,
 * jam, maupun `Context` Hono, sehingga bisa diuji tanpa menyalakan server.
 */

const SIG_EOCD = 0x06054b50;
const SIG_CENTRAL = 0x02014b50;
const SIG_LOCAL = 0x04034b50;

/** Panjang minimum satu record EOCD — batas bawah pencarian dari ekor. */
const EOCD_MIN_SIZE = 22;
/** Komentar ZIP maksimal 65535 byte, jadi EOCD selalu ada di 64 KiB terakhir. */
const ZIP_COMMENT_MAX = 0xffff;

interface ZipEntry {
  name: string;
  /** 0 = store (tanpa kompresi), 8 = deflate. */
  method: number;
  /** Offset header lokal di dalam berkas. */
  offset: number;
  /** Ukuran data terkompresi, dari central directory (selalu benar). */
  size: number;
}

// ── Pembaca ZIP ───────────────────────────────────────────────

function readU16(view: DataView, offset: number): number {
  return view.getUint16(offset, true);
}

function readU32(view: DataView, offset: number): number {
  return view.getUint32(offset, true);
}

/**
 * Cari *End of Central Directory*.
 *
 * Posisinya tidak tetap karena ZIP boleh diakhiri komentar, jadi dicari dari
 * ekor. Berkas yang tidak punya tanda ini bukan ZIP — dan hampir selalu
 * berarti yang diunggah bukan `.xlsx` (mis. `.csv` atau `.xls` lama).
 */
function findEocd(view: DataView): number {
  const lowest = Math.max(0, view.byteLength - ZIP_COMMENT_MAX - EOCD_MIN_SIZE);
  for (let cursor = view.byteLength - EOCD_MIN_SIZE; cursor >= lowest; cursor--) {
    if (readU32(view, cursor) === SIG_EOCD) return cursor;
  }
  throw new Error("bukan berkas ZIP (bukan .xlsx)");
}

/** Daftar seluruh berkas di dalam arsip, dari central directory. */
function readEntries(view: DataView, bytes: Uint8Array): ZipEntry[] {
  const eocd = findEocd(view);
  const count = readU16(view, eocd + 10);
  const decoder = new TextDecoder();
  const entries: ZipEntry[] = [];

  let cursor = readU32(view, eocd + 16);

  for (let index = 0; index < count; index++) {
    if (readU32(view, cursor) !== SIG_CENTRAL) break;

    const method = readU16(view, cursor + 10);
    const size = readU32(view, cursor + 20);
    const nameLength = readU16(view, cursor + 28);
    const extraLength = readU16(view, cursor + 30);
    const commentLength = readU16(view, cursor + 32);
    const offset = readU32(view, cursor + 42);

    const name = decoder.decode(
      bytes.subarray(cursor + 46, cursor + 46 + nameLength),
    );

    entries.push({ name, method, offset, size });
    cursor += 46 + nameLength + extraLength + commentLength;
  }

  return entries;
}

/**
 * Ambil data satu berkas di dalam arsip.
 *
 * Panjang nama & extra field dibaca dari **header lokal**, bukan dari central
 * directory: keduanya boleh berbeda panjang antar keduanya, dan memakai yang
 * salah membuat data mulai dari offset yang meleset.
 */
function entryData(
  view: DataView,
  bytes: Uint8Array<ArrayBuffer>,
  entry: ZipEntry,
): Uint8Array<ArrayBuffer> {
  if (readU32(view, entry.offset) !== SIG_LOCAL) {
    throw new Error("header lokal ZIP rusak");
  }

  const nameLength = readU16(view, entry.offset + 26);
  const extraLength = readU16(view, entry.offset + 28);
  const start = entry.offset + 30 + nameLength + extraLength;

  return bytes.subarray(start, start + entry.size);
}

/** Gelembungkan data deflate mentah (tanpa header zlib). */
async function inflateRaw(data: Uint8Array<ArrayBuffer>): Promise<Uint8Array> {
  const stream = new Blob([data])
    .stream()
    .pipeThrough(new DecompressionStream("deflate-raw"));

  return new Uint8Array(await new Response(stream).arrayBuffer());
}

// ── Pembaca SpreadsheetML ─────────────────────────────────────

/** Kembalikan entitas XML & rujukan karakter ke teksnya. */
function decodeXml(value: string): string {
  return value
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec: string) =>
      String.fromCodePoint(Number.parseInt(dec, 10)),
    )
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    // `&amp;` paling akhir: kalau didahulukan, "&amp;lt;" akan jadi "<".
    .replace(/&amp;/g, "&");
}

/** `A` → 0, `B` → 1, `AA` → 26. */
function columnIndex(letters: string): number {
  let value = 0;
  for (const char of letters) {
    value = value * 26 + (char.charCodeAt(0) - 64);
  }
  return value - 1;
}

/** Seluruh `<si>` pada `sharedStrings.xml` → daftar teks. */
function parseSharedStrings(xml: string | null): string[] {
  if (!xml) return [];

  const out: string[] = [];
  const siPattern = /<si\b[^>]*>([\s\S]*?)<\/si>|<si\b[^>]*\/>/g;

  for (const match of xml.matchAll(siPattern)) {
    let text = "";
    // Satu `<si>` boleh terdiri dari beberapa `<r><t>` (teks kaya);
    // semuanya disambung karena kita hanya butuh teksnya.
    for (const part of (match[1] ?? "").matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)) {
      text += decodeXml(part[1]);
    }
    out.push(text);
  }

  return out;
}

/** Teks satu sel `<c>`, sesuai atribut `t`-nya. */
function cellText(type: string, inner: string, shared: string[]): string {
  if (type === "inlineStr") {
    let text = "";
    for (const part of inner.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)) {
      text += decodeXml(part[1]);
    }
    return text;
  }

  const value = /<v\b[^>]*>([\s\S]*?)<\/v>/.exec(inner);
  if (!value) return "";
  const raw = value[1];

  // `t="s"` = indeks ke tabel sharedStrings.
  if (type === "s") {
    const index = Number.parseInt(raw, 10);
    return shared[index] ?? "";
  }

  // Angka & boolean dibiarkan apa adanya (`1`/`0`) — penafsirannya urusan
  // pemanggil, bukan pembaca berkas.
  return decodeXml(raw);
}

/**
 * Terjemahkan `sheetN.xml` menjadi kisi teks.
 *
 * Sel yang kosong tidak ditulis sama sekali oleh Excel, jadi posisinya
 * **wajib** ditentukan dari rujukan selnya (`r="C5"`), bukan dari urutan
 * kemunculan. Baris & kolom yang melompat tetap menghasilkan indeks yang
 * benar, dengan lubang yang diisi `""` oleh pemanggil.
 */
function parseSheet(xml: string, shared: string[]): string[][] {
  const grid: string[][] = [];

  const rowPattern = /<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g;
  let nextRow = 0;

  for (const rowMatch of xml.matchAll(rowPattern)) {
    const rowAttributes = rowMatch[1] ?? "";
    const rowInner = rowMatch[2] ?? "";

    const declared = /\br="(\d+)"/.exec(rowAttributes);
    const rowIndex = declared ? Number(declared[1]) - 1 : nextRow;
    nextRow = rowIndex + 1;

    const cells = (grid[rowIndex] ??= []);

    const cellPattern = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
    let nextColumn = 0;

    for (const cellMatch of rowInner.matchAll(cellPattern)) {
      const attributes = cellMatch[1] ?? "";
      const inner = cellMatch[2] ?? "";

      const reference = /\br="([A-Z]+)\d*"/.exec(attributes);
      const index = reference ? columnIndex(reference[1]) : nextColumn;
      nextColumn = index + 1;

      const type = /\bt="([^"]+)"/.exec(attributes)?.[1] ?? "n";
      cells[index] = cellText(type, inner, shared);
    }
  }

  return grid;
}

/**
 * Baca lembar **pertama** sebuah berkas `.xlsx` sebagai kisi teks.
 *
 * Melempar `Error` bila berkasnya bukan ZIP/`.xlsx` yang sah atau tidak punya
 * lembar kerja — pemanggil yang memutuskan bagaimana melaporkannya ke pemakai.
 */
export async function readXlsxGrid(
  bytes: Uint8Array<ArrayBuffer>,
): Promise<string[][]> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const entries = readEntries(view, bytes);
  const decoder = new TextDecoder();

  const readText = async (entry: ZipEntry | undefined): Promise<string | null> => {
    if (!entry) return null;
    const raw = entryData(view, bytes, entry);
    const data = entry.method === 0 ? raw : await inflateRaw(raw);
    return decoder.decode(data);
  };

  // Lembar pertama menurut nomor berkasnya, bukan urutan di arsip: urutan
  // entri ZIP tidak dijamin, sedangkan `sheet1` selalu lembar pertama.
  const sheets = entries
    .filter((entry) => /^xl\/worksheets\/sheet\d+\.xml$/.test(entry.name))
    .sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true }));

  const sheetXml = await readText(sheets[0]);
  if (sheetXml === null) throw new Error("lembar kerja tidak ditemukan");

  const shared = parseSharedStrings(
    await readText(entries.find((entry) => entry.name === "xl/sharedStrings.xml")),
  );

  return parseSheet(sheetXml, shared);
}

/** Nilai satu sel pada kisi; `""` untuk baris/kolom yang tidak ada. */
export function cellAt(grid: string[][], row: number, column: number): string {
  return grid[row]?.[column] ?? "";
}

/** Buang baris yang seluruh selnya kosong — biasanya pemisah antar blok. */
export function isBlankRow(row: string[] | undefined): boolean {
  return !row || row.every((cell) => !cell || !cell.trim());
}
