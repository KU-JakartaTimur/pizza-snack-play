import "dotenv/config";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  /** Masa berlaku token dalam detik (opsional, default 7 hari). */
  JWT_EXPIRES_IN?: string;
  /** VAPID public key untuk Push Notification PWA (base64url). */
  VAPID_PUBLIC_KEY?: string;
  /** VAPID private key untuk Push Notification PWA (JWK JSON string). */
  VAPID_PRIVATE_KEY?: string;
  /** Kontak admin untuk VAPID (mailto: atau https:). */
  VAPID_SUBJECT?: string;
  /**
   * Gateway WhatsApp yang dipakai SDK `sikuwa`, mis. `OpenWA`, `Fonnte`,
   * `Wuzapi`. Wajib diisi bersama salah satu token di bawah — tanpa keduanya
   * notifikasi WhatsApp dimatikan, bukan digagalkan.
   */
  WHATSAPP_PROVIDER?: string;
  /**
   * Token gateway. Bila satu sekolah memakai beberapa gateway sekaligus,
   * pakai bentuk per-provider `WHATSAPP_TOKEN_<Provider>` (mis.
   * `WHATSAPP_TOKEN_OpenWA`) — kunci itu dibaca lebih dulu.
   */
  WHATSAPP_TOKEN?: string;
  /** Base URL gateway self-hosted, mis. `https://wa.sekolah.id`. */
  WHATSAPP_URL?: string;
  /** Id session/instance yang sudah tersambung di gateway. */
  WHATSAPP_SESSION?: string;
  /** Jeda antar pesan beruntun, mis. `0,30` — bawaan SDK: mati. */
  WHATSAPP_PACING_CYCLE?: string;
  /** Indikator "sedang mengetik" sebelum tiap pesan — bawaan SDK: mati. */
  WHATSAPP_TYPING?: string;
  /** Jumlah percobaan ulang saat gateway menolak 429/503 dengan `Retry-After`. */
  WHATSAPP_RETRIES?: string;
  /** Periksa nomor tujuan sebelum mengirim (`1` = aktif). */
  WHATSAPP_CHECK_NUMBERS?: string;
  /**
   * @deprecated Tidak dipakai lagi. Dulu satu-satunya cara mengirim WhatsApp
   * adalah POST ke URL gateway generik. Nilainya hanya dibaca untuk memberi
   * pesan kesalahan yang menyebutkan penggantinya.
   */
  WHATSAPP_GATEWAY_URL?: string;
  /**
   * @deprecated Lihat `WHATSAPP_GATEWAY_URL`. Ganti dengan `WHATSAPP_TOKEN`.
   */
  WHATSAPP_GATEWAY_KEY?: string;
}

export function getDb(env: Env) {
  return drizzle(env.DB, { schema });
}

/**
 * Tipe database yang dipakai bersama di seluruh layer
 * (repository, service, controller).
 */
export type Db = ReturnType<typeof getDb>;
