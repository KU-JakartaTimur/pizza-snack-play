import { describe, expect, test } from "bun:test";
import { CATEGORY_IMAGE_MAX_LENGTH } from "../../types/catalog";
import { CATEGORY_IMAGE_MAX_KB, validateCategoryImage } from "./image";

/** Data URI sah dengan panjang payload tertentu. */
function png(payload = "AAAA") {
  return `data:image/png;base64,${payload}`;
}

describe("validateCategoryImage — kolom yang tidak dikirim", () => {
  test("undefined berarti gambar dibiarkan, bukan error", () => {
    expect(validateCategoryImage(undefined)).toBeNull();
  });

  test("null berarti gambar dikosongkan, bukan error", () => {
    expect(validateCategoryImage(null)).toBeNull();
  });
});

describe("validateCategoryImage — bentuk yang sah", () => {
  test("keempat tipe gambar yang didukung diterima", () => {
    for (const mime of ["image/png", "image/jpeg", "image/webp", "image/gif"]) {
      expect(validateCategoryImage(`data:${mime};base64,iVBORw0KGgo=`)).toBeNull();
    }
  });

  test("base64 tanpa padding juga diterima", () => {
    expect(validateCategoryImage(png("iVBORw0KGgo"))).toBeNull();
  });

  test("tepat di batas panjang masih diterima", () => {
    const head = "data:image/png;base64,";
    const value = head + "A".repeat(CATEGORY_IMAGE_MAX_LENGTH - head.length);
    expect(value.length).toBe(CATEGORY_IMAGE_MAX_LENGTH);
    expect(validateCategoryImage(value)).toBeNull();
  });
});

describe("validateCategoryImage — bentuk yang ditolak", () => {
  test("bukan teks", () => {
    expect(validateCategoryImage(1234)).toContain("teks base64");
    expect(validateCategoryImage({ image: png() })).toContain("teks base64");
  });

  test("melebihi batas panjang, pesannya menyebut batasnya", () => {
    const tooLong = png("A".repeat(CATEGORY_IMAGE_MAX_LENGTH));
    const message = validateCategoryImage(tooLong);
    expect(message).toContain("terlalu besar");
    expect(message).toContain(String(CATEGORY_IMAGE_MAX_KB));
  });

  test("tipe di luar daftar — SVG tidak boleh (bisa memuat skrip)", () => {
    expect(validateCategoryImage("data:image/svg+xml;base64,PHN2Zy8+")).toContain(
      "data URI",
    );
  });

  test("tanpa penanda base64, atau bukan data URI sama sekali", () => {
    expect(validateCategoryImage("data:image/png,AAAA")).toContain("data URI");
    expect(validateCategoryImage("https://contoh.test/gambar.png")).toContain(
      "data URI",
    );
    expect(validateCategoryImage("")).toContain("data URI");
  });

  test("payload kosong ditolak — tidak ada gambar untuk ditampilkan", () => {
    expect(validateCategoryImage("data:image/png;base64,")).toContain("data URI");
  });
});
