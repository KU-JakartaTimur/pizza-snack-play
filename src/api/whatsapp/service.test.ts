import { describe, expect, test } from "bun:test";
import type { Db, Env } from "../../database/db";
import { whatsappService } from "./service";

/**
 * Konfirmasi klaim harus benar-benar senyap.
 *
 * Klaim sudah tersimpan dan sudah dijawab ke orang tua saat fungsi ini jalan,
 * jadi apa pun yang terjadi di sini tidak boleh terlihat oleh pemanggil. Dua
 * jaminan yang diuji:
 *
 * 1. Gateway yang belum dikonfigurasi dilewati **sebelum** database disentuh.
 * 2. Wali tanpa nomor dilewati tanpa satu pun request.
 *
 * Jalur "gateway menolak" sengaja tidak diuji dengan URL palsu: `sikuwa` akan
 * benar-benar mencoba menghubunginya, dan uji yang menyentuh jaringan adalah
 * uji yang gagal di mesin tanpa internet. Jaminannya ada di `catch` yang
 * menelan seluruh kegagalan, bukan di hasil percobaan koneksi.
 */

function env(overrides: Partial<Env> = {}): Env {
  return { DB: {} as D1Database, JWT_SECRET: "rahasia-uji", ...overrides } as Env;
}

/** Database yang meledak bila tersentuh — bukti tidak ada query yang jalan. */
function untouchableDb(): Db {
  return new Proxy(
    {},
    {
      get() {
        throw new Error("database tidak boleh disentuh");
      },
    },
  ) as Db;
}

const claim = {
  parentId: 40,
  parentName: "Sari Wulandari",
  studentName: "Aisyah Sari",
  className: "1",
  date: "2026-08-31",
  menuName: "sosis solo",
};

describe("confirmClaimQuietly", () => {
  test("tanpa gateway, tidak menyentuh database dan tidak melempar", async () => {
    await expect(
      whatsappService.confirmClaimQuietly(untouchableDb(), env(), claim),
    ).resolves.toBeUndefined();
  });

  test("nomor wali yang kosong dilewati tanpa request", async () => {
    let queried = 0;
    const db = {
      select: () => {
        queried++;
        return {
          from: () => ({
            where: () => ({
              limit: async () => [{ parentName: "Sari", phone: null }],
            }),
          }),
        };
      },
    } as unknown as Db;

    await expect(
      whatsappService.confirmClaimQuietly(
        db,
        env({
          WHATSAPP_PROVIDER: "OpenWA",
          WHATSAPP_TOKEN: "uji",
          WHATSAPP_URL: "http://",
          WHATSAPP_SESSION: "sekolah",
        }),
        claim,
      ),
    ).resolves.toBeUndefined();

    expect(queried).toBe(1);
  });
});

describe("broadcast", () => {
  test("pesan kosong ditolak sebelum gateway dibangun", async () => {
    const result = await whatsappService.broadcast(untouchableDb(), env(), {
      senderId: 1,
      message: "   ",
      className: null,
    });

    expect(result).toBe("message_empty");
  });

  test("gateway belum dikonfigurasi dilaporkan sebagai kode, bukan exception", async () => {
    const result = await whatsappService.broadcast(untouchableDb(), env(), {
      senderId: 1,
      message: "Halo",
      className: null,
    });

    expect(result).toBe("gateway_not_configured");
  });
});

describe("remindPetugas", () => {
  test("gateway belum dikonfigurasi dilaporkan sebagai kode, bukan exception", async () => {
    const result = await whatsappService.remindPetugas(untouchableDb(), env(), {
      senderId: 1,
      date: "2026-10-22",
      className: null,
    });

    expect(result).toBe("gateway_not_configured");
  });
});
