import { describe, expect, test } from "bun:test";
import { MAX_PHONE_DIGITS, normalizePhone } from "./phone";

describe("normalizePhone", () => {
  test("nomor polos diterima apa adanya", () => {
    expect(normalizePhone("081234567890")).toBe("081234567890");
  });

  test("pemisah lazim dibuang — orang tua tidak perlu menulis ulang", () => {
    expect(normalizePhone("0812-3456-7890")).toBe("081234567890");
    expect(normalizePhone("0812 3456 7890")).toBe("081234567890");
    expect(normalizePhone("(021) 555-1234")).toBe("0215551234");
    expect(normalizePhone("+62 812.3456.7890")).toBe("6281234567890");
  });

  test("teks kosong berarti nomornya dikosongkan, bukan salah", () => {
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone("   ")).toBeNull();
  });

  test("huruf ditolak — tanda salah ketik, bukan nomor", () => {
    expect(normalizePhone("0812abc3456789")).toBe("invalid");
    expect(normalizePhone("nomor saya 081234567890")).toBe("invalid");
  });

  test("`+` di tengah nomor ditolak", () => {
    expect(normalizePhone("0812+34567890")).toBe("invalid");
  });

  test("terlalu pendek atau terlalu panjang ditolak", () => {
    expect(normalizePhone("0812345")).toBe("invalid");
    expect(normalizePhone("0".repeat(MAX_PHONE_DIGITS + 1))).toBe("invalid");
  });

  test("batas panjang yang sah tetap diterima", () => {
    expect(normalizePhone("0".repeat(MAX_PHONE_DIGITS))).toHaveLength(
      MAX_PHONE_DIGITS,
    );
  });
});
