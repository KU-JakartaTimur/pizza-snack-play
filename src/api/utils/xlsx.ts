/**
 * Pembuat berkas `.xlsx` seadanya — tanpa dependensi npm.
 *
 * Kenapa ditulis sendiri: satu-satunya kebutuhan kita adalah **satu lembar
 * tabel sederhana** (teks, angka, judul tebal, lebar kolom, baris gabungan).
 * Pustaka seperti `exceljs`/`xlsx` beratnya berkali-kali lipat dari kebutuhan
 * itu, dan harus ikut di-bundle ke Worker.
 *
 * `.xlsx` pada dasarnya arsip ZIP berisi beberapa berkas XML. Format ZIP yang
 * dipakai di sini adalah **store** (tanpa kompresi) — tidak perlu DEFLATE,
 * jadi tidak perlu `CompressionStream`, dan Excel/WPS/LibreOffice menerimanya
 * tanpa masalah.
 *
 * Batas yang disengaja: satu lembar per berkas, gaya hanya "biasa" dan
 * "tebal", dan nilai teks selalu ditulis sebagai *inline string* (tidak ada
 * tabel `sharedStrings`). Jangan dipakai untuk kebutuhan di luar itu.
 */

// ── CRC-32 (wajib ada di header ZIP) ──────────────────────────

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index++) {
    let value = index;
    for (let bit = 0; bit < 8; bit++) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff]! ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// ── Penulis byte little-endian ────────────────────────────────

/** Menyusun byte berurutan; seluruh angka ZIP ditulis little-endian. */
class ByteWriter {
  private readonly chunks: Uint8Array[] = [];
  private size = 0;

  /** Panjang data yang sudah ditulis — dipakai sebagai offset header lokal. */
  get offset(): number {
    return this.size;
  }

  push(bytes: Uint8Array): void {
    this.chunks.push(bytes);
    this.size += bytes.length;
  }

  u16(value: number): void {
    const bytes = new Uint8Array(2);
    new DataView(bytes.buffer).setUint16(0, value & 0xffff, true);
    this.push(bytes);
  }

  u32(value: number): void {
    const bytes = new Uint8Array(4);
    new DataView(bytes.buffer).setUint32(0, value >>> 0, true);
    this.push(bytes);
  }

  toUint8Array(): Uint8Array<ArrayBuffer> {
    const out = new Uint8Array(this.size);
    let cursor = 0;
    for (const chunk of this.chunks) {
      out.set(chunk, cursor);
      cursor += chunk.length;
    }
    return out;
  }
}

// ── ZIP (metode store) ────────────────────────────────────────

interface ZipEntry {
  name: string;
  data: Uint8Array;
}

/** Bit 11: nama berkas memakai UTF-8 (nama kita selalu ASCII). */
const FLAG_UTF8 = 0x0800;
/** Versi minimum 2.0 — cukup untuk metode store. */
const ZIP_VERSION = 20;

/**
 * Susun arsip ZIP dari daftar berkas, tanpa kompresi.
 * Susunannya: [header lokal + data]… lalu [central directory] lalu [EOCD].
 */
function zip(entries: ZipEntry[]): Uint8Array<ArrayBuffer> {
  const now = new Date();
  // Format waktu DOS: tanggal & jam dibulatkan ke 2 detik terdekat.
  const dosTime =
    (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
  const dosDate =
    ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();

  const encoder = new TextEncoder();
  const writer = new ByteWriter();
  const directory: { name: Uint8Array; crc: number; size: number; offset: number }[] =
    [];

  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const crc = crc32(entry.data);
    const offset = writer.offset;

    // Header lokal.
    writer.u32(0x04034b50);
    writer.u16(ZIP_VERSION);
    writer.u16(FLAG_UTF8);
    writer.u16(0); // metode 0 = store
    writer.u16(dosTime);
    writer.u16(dosDate);
    writer.u32(crc);
    writer.u32(entry.data.length); // ukuran terkompresi = asli
    writer.u32(entry.data.length);
    writer.u16(name.length);
    writer.u16(0); // tanpa field tambahan
    writer.push(name);
    writer.push(entry.data);

    directory.push({ name, crc, size: entry.data.length, offset });
  }

  const directoryOffset = writer.offset;

  for (const item of directory) {
    writer.u32(0x02014b50);
    writer.u16(ZIP_VERSION); // versi pembuat
    writer.u16(ZIP_VERSION); // versi yang dibutuhkan
    writer.u16(FLAG_UTF8);
    writer.u16(0);
    writer.u16(dosTime);
    writer.u16(dosDate);
    writer.u32(item.crc);
    writer.u32(item.size);
    writer.u32(item.size);
    writer.u16(item.name.length);
    writer.u16(0); // extra
    writer.u16(0); // komentar
    writer.u16(0); // nomor disk
    writer.u16(0); // atribut internal
    writer.u32(0); // atribut eksternal
    writer.u32(item.offset);
    writer.push(item.name);
  }

  const directorySize = writer.offset - directoryOffset;

  // End of central directory.
  writer.u32(0x06054b50);
  writer.u16(0);
  writer.u16(0);
  writer.u16(directory.length);
  writer.u16(directory.length);
  writer.u32(directorySize);
  writer.u32(directoryOffset);
  writer.u16(0); // tanpa komentar

  return writer.toUint8Array();
}

// ── SpreadsheetML ─────────────────────────────────────────────

/** 0 = biasa, 1 = tebal (judul, kepala tabel, label pekan). */
export type XlsxCellStyle = 0 | 1;

export interface XlsxCell {
  value: string | number | null;
  style?: XlsxCellStyle;
}

export interface XlsxRow {
  cells: XlsxCell[];
  /**
   * Gabungkan `span` kolom pertama pada baris ini. Dipakai untuk judul dan
   * label pekan — sama seperti tampilan di aplikasi.
   */
  span?: number;
}

const NS_MAIN =
  "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
const NS_REL_DOC =
  "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const NS_PACKAGE_REL =
  "http://schemas.openxmlformats.org/package/2006/relationships";

/**
 * Buang karakter yang tidak sah di XML 1.0.
 *
 * Bukan kehati-hatian teoretis: admin sering menempel catatan dari Excel atau
 * dokumen lain, dan karakter kontrol yang ikut tersalin membuat berkasnya
 * ditolak ("unreadable content") — tanpa pesan apa pun soal penyebabnya.
 *
 * Ditulis sebagai penapis per *code point*, bukan regex: `for…of` sudah
 * menelusuri pasangan surrogate, jadi emoji tetap utuh.
 */
function stripInvalidXmlChars(value: string): string {
  let result = "";
  for (const char of value) {
    const code = char.codePointAt(0)!;
    const valid =
      code === 0x09 || // tab
      code === 0x0a || // line feed
      code === 0x0d || // carriage return
      (code >= 0x20 && code <= 0xd7ff) ||
      (code >= 0xe000 && code <= 0xfffd) ||
      (code >= 0x10000 && code <= 0x10ffff);

    if (valid) result += char;
  }
  return result;
}

function escapeXml(value: string): string {
  return stripInvalidXmlChars(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Indeks kolom (0-based) → huruf kolom: 0 → `A`, 26 → `AA`. */
function columnName(index: number): string {
  let name = "";
  let value = index;
  while (value >= 0) {
    name = String.fromCharCode(65 + (value % 26)) + name;
    value = Math.floor(value / 26) - 1;
  }
  return name;
}

/** Nama lembar Excel: maksimal 31 karakter, tanpa `[]:*?/\`. */
function safeSheetName(raw: string): string {
  const cleaned = raw.replace(/[[\]:*?/\\]/g, " ").trim();
  return (cleaned || "Sheet1").slice(0, 31);
}

function buildSheetXml(rows: XlsxRow[], columnWidths?: number[]): string {
  const columnCount = rows.reduce((max, row) => Math.max(max, row.cells.length), 1);

  const parts: string[] = [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    `<worksheet xmlns="${NS_MAIN}">`,
  ];

  if (rows.length > 0) {
    const lastCell = `${columnName(Math.max(columnCount - 1, 0))}${rows.length}`;
    parts.push(`<dimension ref="A1:${lastCell}"/>`);
  }

  if (columnWidths?.length) {
    parts.push("<cols>");
    columnWidths.forEach((width, index) => {
      parts.push(
        `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`,
      );
    });
    parts.push("</cols>");
  }

  parts.push("<sheetData>");
  rows.forEach((row, rowIndex) => {
    const rowNumber = rowIndex + 1;
    parts.push(`<row r="${rowNumber}">`);

    row.cells.forEach((cell, cellIndex) => {
      if (cell.value === null || cell.value === "") return;

      const reference = `${columnName(cellIndex)}${rowNumber}`;
      const style = cell.style ? ` s="${cell.style}"` : "";

      if (typeof cell.value === "number" && Number.isFinite(cell.value)) {
        parts.push(`<c r="${reference}"${style}><v>${cell.value}</v></c>`);
        return;
      }

      parts.push(
        `<c r="${reference}"${style} t="inlineStr"><is><t xml:space="preserve">` +
          `${escapeXml(String(cell.value))}</t></is></c>`,
      );
    });

    parts.push("</row>");
  });
  parts.push("</sheetData>");

  // `mergeCells` harus berada setelah `sheetData`.
  const merged = rows
    .map((row, index) =>
      row.span && row.span > 1
        ? `A${index + 1}:${columnName(Math.min(row.span, columnCount) - 1)}${index + 1}`
        : null,
    )
    .filter((ref): ref is string => ref !== null);

  if (merged.length > 0) {
    parts.push(`<mergeCells count="${merged.length}">`);
    for (const ref of merged) parts.push(`<mergeCell ref="${ref}"/>`);
    parts.push("</mergeCells>");
  }

  parts.push("</worksheet>");
  return parts.join("");
}

/** Dua gaya sel saja: biasa dan tebal. */
const STYLES_XML =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  `<styleSheet xmlns="${NS_MAIN}">` +
  '<fonts count="2">' +
  '<font><sz val="11"/><name val="Calibri"/></font>' +
  '<font><b/><sz val="11"/><name val="Calibri"/></font>' +
  "</fonts>" +
  '<fills count="2">' +
  '<fill><patternFill patternType="none"/></fill>' +
  '<fill><patternFill patternType="gray125"/></fill>' +
  "</fills>" +
  '<borders count="1">' +
  "<border><left/><right/><top/><bottom/><diagonal/></border>" +
  "</borders>" +
  '<cellStyleXfs count="1">' +
  '<xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>' +
  "</cellStyleXfs>" +
  '<cellXfs count="2">' +
  '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
  '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
  "</cellXfs>" +
  "</styleSheet>";

/**
 * Susun satu berkas `.xlsx` berisi satu lembar.
 *
 * Sel bernilai `null` atau `""` dilewati sepenuhnya — itu cara membuat baris
 * pemisah antar blok tanpa menulis sel kosong.
 *
 * Tipe kembaliannya `Uint8Array<ArrayBuffer>` (bukan `Uint8Array` biasa):
 * hanya bentuk itu yang diterima `Response`/`c.body` tanpa salinan tambahan.
 */
export function buildXlsx(input: {
  sheetName: string;
  rows: XlsxRow[];
  /** Lebar kolom dalam satuan Excel (1 ≈ lebar satu karakter). */
  columnWidths?: number[];
}): Uint8Array<ArrayBuffer> {
  const encoder = new TextEncoder();

  const files: ZipEntry[] = [
    {
      name: "[Content_Types].xml",
      data: encoder.encode(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
          '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
          '<Default Extension="xml" ContentType="application/xml"/>' +
          '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
          '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
          '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
          "</Types>",
      ),
    },
    {
      name: "_rels/.rels",
      data: encoder.encode(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          `<Relationships xmlns="${NS_PACKAGE_REL}">` +
          `<Relationship Id="rId1" Type="${NS_REL_DOC}/officeDocument" Target="xl/workbook.xml"/>` +
          "</Relationships>",
      ),
    },
    {
      name: "xl/workbook.xml",
      data: encoder.encode(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          `<workbook xmlns="${NS_MAIN}" xmlns:r="${NS_REL_DOC}">` +
          `<sheets><sheet name="${escapeXml(safeSheetName(input.sheetName))}" sheetId="1" r:id="rId1"/></sheets>` +
          "</workbook>",
      ),
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      data: encoder.encode(
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
          `<Relationships xmlns="${NS_PACKAGE_REL}">` +
          `<Relationship Id="rId1" Type="${NS_REL_DOC}/worksheet" Target="worksheets/sheet1.xml"/>` +
          `<Relationship Id="rId2" Type="${NS_REL_DOC}/styles" Target="styles.xml"/>` +
          "</Relationships>",
      ),
    },
    { name: "xl/styles.xml", data: encoder.encode(STYLES_XML) },
    {
      name: "xl/worksheets/sheet1.xml",
      data: encoder.encode(buildSheetXml(input.rows, input.columnWidths)),
    },
  ];

  return zip(files);
}

/** MIME resmi `.xlsx` — dipakai di header `Content-Type`. */
export const XLSX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
