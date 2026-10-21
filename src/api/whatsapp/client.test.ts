import { describe, expect, test } from "bun:test";
import type { Env } from "../../database/db";
import {
  createWhatsappClient,
  resolveProvider,
  resolveToken,
  whatsappStatus,
  WhatsappNotConfiguredError,
} from "./client";

/**
 * Uji modul transport tanpa jaringan.
 *
 * `sikuwa` menerima klien HTTP pengganti, jadi yang diuji di sini adalah
 * **bentuk request yang benar-benar berangkat** — URL, header autentikasi,
 * dan body — bukan sekadar "tidak melempar". Itu bagian yang paling mudah
 * rusak diam-diam saat gateway atau versi SDK berganti.
 */

/** Env minimum; binding lain dibiarkan kosong seperti di Worker sungguhan. */
function env(overrides: Partial<Env> = {}): Env {
  return {
    DB: {} as D1Database,
    JWT_SECRET: "rahasia-uji",
    ...overrides,
  } as Env;
}

interface RecordedCall {
  url: string;
  init?: RequestInit;
}

/**
 * Klien HTTP palsu yang merekam setiap request.
 *
 * Balasannya sengaja berbentuk respons sukses OpenWA (`{ messageId }`) supaya
 * jalur sukses provider ikut teruji, bukan hanya jalur gagal.
 */
function recorder() {
  const calls: RecordedCall[] = [];

  const fetchImpl = async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    return new Response(JSON.stringify({ messageId: "wamid.uji" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };

  return { calls, fetchImpl };
}

describe("resolveProvider", () => {
  test("nama baku dikenali apa adanya", () => {
    expect(resolveProvider(env({ WHATSAPP_PROVIDER: "OpenWA" }))).toBe("OpenWA");
  });

  test("huruf besar-kecil dan tanda hubung tidak membuat gateway 'tidak dikenal'", () => {
    expect(resolveProvider(env({ WHATSAPP_PROVIDER: "openwa" }))).toBe("OpenWA");
    expect(resolveProvider(env({ WHATSAPP_PROVIDER: "evolution-api" }))).toBe(
      "EvolutionAPI",
    );
    expect(resolveProvider(env({ WHATSAPP_PROVIDER: " Fonnte " }))).toBe("Fonnte");
  });

  test("kosong berarti belum diisi, bukan nama yang salah", () => {
    expect(resolveProvider(env())).toBeNull();
    expect(resolveProvider(env({ WHATSAPP_PROVIDER: "   " }))).toBeNull();
  });

  test("nama asing tidak ditebak menjadi gateway lain", () => {
    expect(resolveProvider(env({ WHATSAPP_PROVIDER: "wablas" }))).toBeNull();
  });
});

describe("resolveToken", () => {
  test("token per-provider menang atas token umum", () => {
    const value = env({
      WHATSAPP_TOKEN: "umum",
      WHATSAPP_TOKEN_OpenWA: "khusus-openwa",
    } as Partial<Env>);

    expect(resolveToken(value, "OpenWA")).toBe("khusus-openwa");
    expect(resolveToken(value, "Fonnte")).toBe("umum");
  });
});

describe("whatsappStatus", () => {
  test("tanpa provider: belum siap, dan alasannya menyebut kuncinya", () => {
    const status = whatsappStatus(env());

    expect(status.configured).toBe(false);
    expect(status.provider).toBeNull();
    expect(status.reason).toContain("WHATSAPP_PROVIDER");
  });

  test("provider ada tetapi token kosong: belum siap", () => {
    const status = whatsappStatus(env({ WHATSAPP_PROVIDER: "OpenWA" }));

    expect(status.configured).toBe(false);
    expect(status.provider).toBe("OpenWA");
    expect(status.reason).toContain("WHATSAPP_TOKEN_OpenWA");
  });

  test("siap bila provider dan token terisi", () => {
    const status = whatsappStatus(
      env({ WHATSAPP_PROVIDER: "OpenWA", WHATSAPP_TOKEN: "k" }),
    );

    expect(status).toEqual({
      configured: true,
      provider: "OpenWA",
      session: null,
      reason: null,
    });
  });

  test("nama provider asing dilaporkan sebagai alasan, bukan dilempar", () => {
    const status = whatsappStatus(env({ WHATSAPP_PROVIDER: "wablas" }));

    expect(status.configured).toBe(false);
    expect(status.reason).toContain("tidak dikenal");
  });
});

describe("createWhatsappClient", () => {
  test("melempar pesan yang menyebutkan pilihan gateway yang sah", () => {
    expect(() => createWhatsappClient(env())).toThrow(WhatsappNotConfiguredError);

    try {
      createWhatsappClient(env());
    } catch (error) {
      expect((error as Error).message).toContain("OpenWA");
      expect((error as Error).message).toContain("Waxum");
    }
  });

  test("kunci lama WHATSAPP_GATEWAY_URL disebut sebagai pengganti yang salah", () => {
    try {
      createWhatsappClient(env({ WHATSAPP_GATEWAY_URL: "https://gw.lama/send" }));
      throw new Error("seharusnya melempar");
    } catch (error) {
      expect((error as Error).message).toContain("WHATSAPP_GATEWAY_URL");
    }
  });

  test("mengirim teks lewat endpoint OpenWA dengan header dan body yang benar", async () => {
    const { calls, fetchImpl } = recorder();
    const client = createWhatsappClient(
      env({
        WHATSAPP_PROVIDER: "OpenWA",
        WHATSAPP_TOKEN: "kunci-uji",
        WHATSAPP_URL: "https://gw.test",
        WHATSAPP_SESSION: "sekolah",
      }),
      fetchImpl,
    );

    const detail = await client.send({
      destination: "081234567890",
      message: "Halo dari uji",
    });

    expect(detail).toContain("Sukses");
    expect(calls).toHaveLength(1);

    const [call] = calls;
    expect(call.url).toBe(
      "https://gw.test/api/sessions/sekolah/messages/send-text",
    );

    const headers = new Headers(call.init?.headers);
    expect(headers.get("X-API-Key")).toBe("kunci-uji");

    // Nomor lokal dinormalkan menjadi WID — bukti bahwa normalisasi nomor
    // benar-benar terjadi di dalam SDK, bukan diasumsikan di kode kita.
    expect(JSON.parse(String(call.init?.body))).toEqual({
      chatId: "6281234567890@c.us",
      text: "Halo dari uji",
    });
  });

  test("pemeriksaan nomor tidak berjalan selama kuncinya tidak dinyalakan", async () => {
    const { calls, fetchImpl } = recorder();
    const client = createWhatsappClient(
      env({
        WHATSAPP_PROVIDER: "OpenWA",
        WHATSAPP_TOKEN: "kunci-uji",
        WHATSAPP_URL: "https://gw.test",
        WHATSAPP_SESSION: "sekolah",
      }),
      fetchImpl,
    );

    await client.send({ destination: "081234567890", message: "Halo" });

    // Satu request saja: kirim teks. Tidak ada panggilan pemeriksaan nomor.
    expect(calls).toHaveLength(1);
  });
});
