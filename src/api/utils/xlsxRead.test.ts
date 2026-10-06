import { describe, expect, test } from "bun:test";
import { crc32, deflateRawSync } from "node:zlib";
import { buildXlsx } from "./xlsx";
import { cellAt, isBlankRow, readXlsxGrid } from "./xlsxRead";

/**
 * Penyusun ZIP ber-**kompresi deflate** untuk pengujian.
 *
 * `xlsx.ts` hanya menulis mode *store*, sedangkan Excel/WPS selalu menulis
 * deflate — dan justru bentuk itulah yang akan diunggah admin kembali.
 * Tanpa berkas seperti ini, jalur `DecompressionStream` tidak pernah teruji.
 */
function zipDeflated(files: { name: string; text: string }[]): Uint8Array<ArrayBuffer> {
  const encoder = new TextEncoder();
  const locals: Uint8Array[] = [];
  const central: Uint8Array[] = [];
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
    localView.setUint16(8, 8, true); // metode 8 = deflate
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

/** `.xlsx` gaya Excel: deflate + `sharedStrings` + sel yang dilompati. */
function excelStyleWorkbook(): Uint8Array<ArrayBuffer> {
  return zipDeflated([
    {
      name: "xl/sharedStrings.xml",
      text:
        '<?xml version="1.0" encoding="UTF-8"?>' +
        '<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="4">' +
        "<si><t>Nama orang tua</t></si>" +
        "<si><t>Sari &amp; Wulandari</t></si>" +
        "<si><t>Budi (1A), Ani</t></si>" +
        "<si><t>Ya</t></si>" +
        "</sst>",
    },
    {
      name: "xl/worksheets/sheet1.xml",
      text:
        '<?xml version="1.0" encoding="UTF-8"?>' +
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
        "<sheetData>" +
        // Kolom B sengaja dilewati: sel C1 harus tetap mendarat di kolom 2.
        '<row r="1"><c r="A1" t="s"><v>0</v></c><c r="C1" t="s"><v>3</v></c></row>' +
        // Baris 2 dikosongkan seluruhnya (pemisah antar blok).
        '<row r="3"><c r="A3" t="s"><v>1</v></c><c r="C3" t="s"><v>2</v></c></row>' +
        '<row r="4"/>' +
        "</sheetData>" +
        "</worksheet>",
    },
  ]);
}

describe("readXlsxGrid — berkas tulisan sendiri (store + inlineStr)", () => {
  test("kisi hasil baca cocok dengan baris yang ditulis", async () => {
    const bytes = buildXlsx({
      sheetName: "Uji",
      rows: [
        { cells: [{ value: "Judul", style: 1 }], span: 3 },
        { cells: [{ value: "A" }, { value: "B" }, { value: "C" }] },
        { cells: [{ value: "1" }, { value: 2 }, { value: null }] },
      ],
    });

    const grid = await readXlsxGrid(bytes);

    expect(cellAt(grid, 0, 0)).toBe("Judul");
    expect(cellAt(grid, 1, 0)).toBe("A");
    expect(cellAt(grid, 1, 1)).toBe("B");
    expect(cellAt(grid, 1, 2)).toBe("C");
    expect(cellAt(grid, 2, 0)).toBe("1");
    expect(cellAt(grid, 2, 1)).toBe("2");
    // Sel `null` tidak ditulis ke XML — harus terbaca sebagai kosong.
    expect(cellAt(grid, 2, 2)).toBe("");
  });
});

describe("readXlsxGrid — berkas gaya Excel (deflate + sharedStrings)", () => {
  test("menggelembungkan deflate dan menelusuri sharedStrings", async () => {
    const grid = await readXlsxGrid(excelStyleWorkbook());

    expect(cellAt(grid, 0, 0)).toBe("Nama orang tua");
    // Kolom B tidak ada di XML; C tetap di indeks 2.
    expect(cellAt(grid, 0, 1)).toBe("");
    expect(cellAt(grid, 0, 2)).toBe("Ya");
  });

  test("entitas XML dikembalikan ke teksnya", async () => {
    const grid = await readXlsxGrid(excelStyleWorkbook());
    expect(cellAt(grid, 2, 0)).toBe("Sari & Wulandari");
  });

  test("baris kosong di tengah tetap mempertahankan nomor barisnya", async () => {
    const grid = await readXlsxGrid(excelStyleWorkbook());
    expect(isBlankRow(grid[1])).toBe(true);
    expect(cellAt(grid, 2, 2)).toBe("Budi (1A), Ani");
    expect(isBlankRow(grid[3])).toBe(true);
  });
});

/** Teks → byte dengan tipe yang diterima `readXlsxGrid`. */
function utf8(text: string): Uint8Array<ArrayBuffer> {
  const encoded = new TextEncoder().encode(text);
  const out = new Uint8Array(encoded.length);
  out.set(encoded);
  return out;
}

describe("readXlsxGrid — berkas tidak sah", () => {
  test("byte sembarangan ditolak, bukan mengembalikan kisi kosong", async () => {
    const notAZip = utf8("nama,username\nSari,sari\n");
    await expect(readXlsxGrid(notAZip)).rejects.toThrow(/ZIP/);
  });

  test("ZIP tanpa lembar kerja ditolak", async () => {
    const bytes = zipDeflated([{ name: "hello.txt", text: "halo" }]);
    await expect(readXlsxGrid(bytes)).rejects.toThrow(/lembar kerja/);
  });
});
