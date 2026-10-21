import { Hono } from "hono";
import { requireAuth, type AuthEnv } from "../middleware/auth";
import { requireRole } from "../middleware/role";
import { whatsappController } from "./controller";

/**
 * Notifikasi WhatsApp lewat `sikuwa`.
 *
 * Seluruh rute di sini butuh login. Status gateway boleh dibaca korlas karena
 * UI-nya perlu mematikan tombol kirim sebelum ditekan; pengiriman pesan uji
 * hanya admin, sebab satu-satunya gunanya adalah memeriksa konfigurasi server.
 *
 * Rute broadcast & riwayat dulu berada di `/api/notifications/whatsapp/*`.
 * Sekarang keduanya tinggal di sini — bersama pengingat petugas — supaya satu
 * tabel (`whatsapp_broadcasts`) punya satu modul pemilik.
 */
export const whatsappRoute = new Hono<AuthEnv>()
  .get(
    "/status",
    requireAuth,
    requireRole("admin", "korlas"),
    whatsappController.status,
  )
  .post(
    "/test",
    requireAuth,
    requireRole("admin"),
    whatsappController.sendTest,
  )
  .post(
    "/broadcast",
    requireAuth,
    requireRole("admin", "korlas"),
    whatsappController.broadcast,
  )
  .post(
    "/petugas",
    requireAuth,
    requireRole("admin", "korlas"),
    whatsappController.remindPetugas,
  )
  .get(
    "/history",
    requireAuth,
    requireRole("admin", "korlas"),
    whatsappController.history,
  );
