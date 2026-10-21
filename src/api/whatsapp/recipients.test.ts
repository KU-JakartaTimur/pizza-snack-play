import { describe, expect, test } from "bun:test";
import { collectRecipients, type RecipientRow } from "./recipients";

/**
 * Penyaringan penerima adalah satu-satunya tempat nomor orang tua berubah
 * menjadi tujuan kirim. Dua kegagalan yang paling mahal ada di sini:
 * mengirim dua kali ke orang yang sama, dan mengirim ke nomor yang tidak ada.
 */

function row(overrides: Partial<RecipientRow> = {}): RecipientRow {
  return {
    parentId: 1,
    parentName: "Rina",
    phone: "081234567890",
    className: "1A",
    ...overrides,
  };
}

describe("collectRecipients", () => {
  test("nomor sah diteruskan apa adanya", () => {
    const { recipients, skipped } = collectRecipients([row()]);

    expect(skipped).toBe(0);
    expect(recipients).toHaveLength(1);
    expect(recipients[0].parentId).toBe(1);
    expect(recipients[0].phone).toBe("081234567890");
  });

  test("nomor kosong dan tidak sah dibuang, bukan dikirim", () => {
    const { recipients, skipped } = collectRecipients([
      row({ parentId: 1, phone: null }),
      row({ parentId: 2, phone: "" }),
      row({ parentId: 3, phone: "0812" }),
      row({ parentId: 4, phone: "0812abc3456789" }),
      row({ parentId: 5, phone: "081234567891" }),
    ]);

    expect(recipients.map((item) => item.parentId)).toEqual([5]);
    expect(skipped).toBe(4);
  });

  test("nomor yang sama tidak dikirim dua kali meski penulisannya berbeda", () => {
    const { recipients, skipped } = collectRecipients([
      row({ parentId: 1, phone: "081234567890", className: "1A" }),
      row({ parentId: 1, phone: "0812-3456-7890", className: "1B" }),
      row({ parentId: 2, phone: "+62 812 3456 7890" }),
    ]);

    expect(recipients).toHaveLength(1);
    expect(recipients[0].className).toBe("1A");
    expect(skipped).toBe(2);
  });

  test("kolom tambahan ikut terbawa — menu dan nama anak dipakai template", () => {
    const { recipients } = collectRecipients([
      { ...row(), studentName: "Aisyah", menuName: "Roti isi" },
    ]);

    expect(recipients[0].studentName).toBe("Aisyah");
    expect(recipients[0].menuName).toBe("Roti isi");
  });

  test("daftar kosong tetap mengembalikan bentuk yang sama", () => {
    expect(collectRecipients([])).toEqual({ recipients: [], skipped: 0 });
  });
});
