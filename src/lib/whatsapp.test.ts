import { describe, expect, test } from "bun:test";
import { whatsAppLink } from "./whatsapp";

describe("whatsAppLink", () => {
  test("nomor lokal diganti kode negara — nol di depan bukan bagian nomor", () => {
    expect(whatsAppLink("081234567890")).toBe("https://wa.me/6281234567890");
  });

  test("tanda pemisah apa pun diabaikan", () => {
    expect(whatsAppLink("0812-3456-7890")).toBe("https://wa.me/6281234567890");
    expect(whatsAppLink("+62 812 3456 7890")).toBe("https://wa.me/6281234567890");
    expect(whatsAppLink("(0812) 3456.7890")).toBe("https://wa.me/6281234567890");
  });

  test("nomor yang sudah memakai kode negara tidak ditambahi lagi", () => {
    expect(whatsAppLink("6281234567890")).toBe("https://wa.me/6281234567890");
  });

  test("nomor asing dibiarkan apa adanya — kode negaranya tidak ditebak", () => {
    expect(whatsAppLink("+6591234567")).toBe("https://wa.me/6591234567");
  });

  test("nomor kosong tidak menghasilkan tautan", () => {
    expect(whatsAppLink(null)).toBeNull();
    expect(whatsAppLink(undefined)).toBeNull();
    expect(whatsAppLink("")).toBeNull();
    expect(whatsAppLink("   ")).toBeNull();
  });

  test("digit terlalu pendek tidak dibuatkan tautan", () => {
    expect(whatsAppLink("0812")).toBeNull();
    expect(whatsAppLink("1234567")).toBeNull();
  });
});
