import { describe, expect, test } from "bun:test";
import { sign } from "hono/jwt";
import app from "../index";

/**
 * Uji sambungan rute → controller → service untuk notifikasi WhatsApp.
 *
 * Semua kasus di sini sengaja berhenti **sebelum** database dan gateway
 * disentuh: yang dibuktikan adalah penjagaan wewenang dan pesan kesalahan
 * konfigurasi — dua hal yang paling mahal kalau salah, karena yang pertama
 * membocorkan data kelas lain dan yang kedua membuat admin mencari masalah
 * di tempat yang salah.
 */

const SECRET = "rahasia-uji-rute";

/** Env minimum: tanpa provider WhatsApp, jadi pengiriman tidak mungkin jalan. */
const bindings = { DB: {} as D1Database, JWT_SECRET: SECRET };

async function tokenFor(role: "admin" | "korlas" | "parent", className?: string) {
  return sign(
    {
      sub: 1,
      username: "uji",
      role,
      className: className ?? null,
      exp: Math.floor(Date.now() / 1000) + 3600,
    },
    SECRET,
  );
}

function headers(token: string) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

describe("GET /api/whatsapp/status", () => {
  test("menjawab belum siap tanpa membocorkan token", async () => {
    const response = await app.request(
      "/api/whatsapp/status",
      { headers: headers(await tokenFor("admin")) },
      bindings,
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      data: { configured: boolean; provider: string | null; reason: string | null };
    };

    expect(body.data.configured).toBe(false);
    expect(body.data.provider).toBeNull();
    expect(body.data.reason).toContain("WHATSAPP_PROVIDER");
    // Tidak ada kunci rahasia yang ikut terkirim ke peramban.
    expect(JSON.stringify(body)).not.toContain("token");
  });

  test("orang tua tidak boleh melihat status gateway", async () => {
    const response = await app.request(
      "/api/whatsapp/status",
      { headers: headers(await tokenFor("parent")) },
      bindings,
    );

    expect(response.status).toBe(403);
  });

  test("tanpa token ditolak", async () => {
    const response = await app.request("/api/whatsapp/status", {}, bindings);
    expect(response.status).toBe(401);
  });
});

describe("POST /api/whatsapp/broadcast", () => {
  test("gateway belum dikonfigurasi dijawab 500 dengan pesan yang bisa ditindaklanjuti", async () => {
    const response = await app.request(
      "/api/whatsapp/broadcast",
      {
        method: "POST",
        headers: headers(await tokenFor("admin")),
        body: JSON.stringify({ message: "Halo orang tua" }),
      },
      bindings,
    );

    expect(response.status).toBe(500);
    const body = (await response.json()) as { message: string };
    expect(body.message).toContain("Gateway WhatsApp belum dikonfigurasi");
  });

  test("pesan kosong ditolak sebelum menyentuh gateway", async () => {
    const response = await app.request(
      "/api/whatsapp/broadcast",
      {
        method: "POST",
        headers: headers(await tokenFor("admin")),
        body: JSON.stringify({ message: "   " }),
      },
      bindings,
    );

    expect(response.status).toBe(400);
  });

  test("korlas tidak boleh broadcast ke kelas lain", async () => {
    const response = await app.request(
      "/api/whatsapp/broadcast",
      {
        method: "POST",
        headers: headers(await tokenFor("korlas", "1A")),
        body: JSON.stringify({ message: "Halo", targetScope: "2B" }),
      },
      bindings,
    );

    expect(response.status).toBe(403);
  });
});

describe("POST /api/whatsapp/petugas", () => {
  test("tanggal yang tidak sah ditolak sebelum gateway dipanggil", async () => {
    const response = await app.request(
      "/api/whatsapp/petugas",
      {
        method: "POST",
        headers: headers(await tokenFor("admin")),
        body: JSON.stringify({ date: "22-10-2026" }),
      },
      bindings,
    );

    expect(response.status).toBe(400);
  });

  test("korlas terkunci di kelasnya sendiri", async () => {
    const response = await app.request(
      "/api/whatsapp/petugas",
      {
        method: "POST",
        headers: headers(await tokenFor("korlas", "1A")),
        body: JSON.stringify({ date: "2026-10-22", className: "2B" }),
      },
      bindings,
    );

    expect(response.status).toBe(403);
  });

  test("orang tua tidak boleh mengirim pengingat", async () => {
    const response = await app.request(
      "/api/whatsapp/petugas",
      {
        method: "POST",
        headers: headers(await tokenFor("parent")),
        body: JSON.stringify({ date: "2026-10-22" }),
      },
      bindings,
    );

    expect(response.status).toBe(403);
  });
});

describe("POST /api/whatsapp/test", () => {
  test("hanya admin", async () => {
    const response = await app.request(
      "/api/whatsapp/test",
      {
        method: "POST",
        headers: headers(await tokenFor("korlas", "1A")),
        body: JSON.stringify({ destination: "081234567890" }),
      },
      bindings,
    );

    expect(response.status).toBe(403);
  });

  test("nomor tidak sah dijawab 400, bukan dicoba ke gateway", async () => {
    const response = await app.request(
      "/api/whatsapp/test",
      {
        method: "POST",
        headers: headers(await tokenFor("admin")),
        body: JSON.stringify({ destination: "0812" }),
      },
      bindings,
    );

    expect(response.status).toBe(400);
    const body = (await response.json()) as { message: string };
    expect(body.message).toContain("tidak sah");
  });
});
