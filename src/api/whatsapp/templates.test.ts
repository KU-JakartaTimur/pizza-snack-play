import { describe, expect, test } from "bun:test";
import {
  claimConfirmationMessage,
  petugasReminderMessage,
  testMessage,
} from "./templates";

/**
 * Isi pesan diuji apa adanya karena inilah satu-satunya bagian notifikasi yang
 * dibaca orang tua. Kesalahan kecil — tanggal salah format, baris kosong
 * menggantung, nama anak orang lain — tidak akan terlihat di log mana pun.
 */

describe("petugasReminderMessage", () => {
  const base = {
    parentName: "Rina",
    studentName: "Aisyah",
    className: "1A",
    date: "2026-10-22",
    menuName: "Roti isi + Pisang",
  };

  test("memuat sapaan, anak, tanggal lengkap, kelas, dan menu", () => {
    const message = petugasReminderMessage(base);

    expect(message).toContain("Halo Bapak/Ibu Rina,");
    expect(message).toContain("Ananda Aisyah");
    expect(message).toContain("Kamis, 22 Oktober 2026");
    expect(message).toContain("Kelas : 1A");
    expect(message).toContain("Menu : Roti isi + Pisang");
    expect(message).toContain("Pizza Snack Play");
  });

  test("baris menu hilang seluruhnya bila menunya belum diisi", () => {
    const message = petugasReminderMessage({ ...base, menuName: null });

    expect(message).not.toContain("Menu :");
    expect(message).not.toContain("Menu : -");
    expect(message).toContain("Kelas : 1A");
  });

  test("nama yang kosong tidak menyisakan sapaan menggantung", () => {
    const message = petugasReminderMessage({
      ...base,
      parentName: null,
      studentName: null,
    });

    expect(message).toContain("Halo Bapak/Ibu,");
    expect(message).not.toContain("Ananda");
    expect(message).toContain("Anda dijadwalkan piket");
  });

  test("tidak pernah menyebut 'besok' — tanggalnya bisa berapa pun", () => {
    const message = petugasReminderMessage({
      ...base,
      date: "2026-11-02",
    });

    expect(message).not.toMatch(/\bbesok\b/i);
    expect(message).toContain("Senin, 2 November 2026");
  });

  test("catatan hanya muncul bila diisi", () => {
    expect(petugasReminderMessage(base)).not.toContain("Catatan :");

    expect(
      petugasReminderMessage({ ...base, notes: "Bawa uang kembalian" }),
    ).toContain("Catatan : Bawa uang kembalian");
  });
});

describe("claimConfirmationMessage", () => {
  test("menyebut tanggal, kelas, dan cara membatalkan pilihan", () => {
    const message = claimConfirmationMessage({
      parentName: "Rina",
      studentName: "Aisyah",
      className: "1A",
      date: "2026-10-22",
      menuName: "Roti isi",
    });

    expect(message).toContain("Kamis, 22 Oktober 2026");
    expect(message).toContain("Kelas : 1A");
    expect(message).toContain("batalkan pilihan");
    expect(message).toContain("Pizza Snack Play");
  });
});

describe("testMessage", () => {
  test("menyebut gateway yang benar-benar dipakai", () => {
    const message = testMessage("OpenWA");

    expect(message).toContain("gateway OpenWA");
    expect(message).toContain("Uji Konfigurasi WhatsApp");
  });
});
