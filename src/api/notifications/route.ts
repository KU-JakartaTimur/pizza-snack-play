import { Hono } from "hono";
import { requireAuth, type AuthEnv } from "../middleware/auth";
import { requireRole } from "../middleware/role";
import { notificationController } from "./controller";

/**
 * Notifikasi push (PWA).
 *
 * Push subscription bisa dilakukan tanpa login (halaman depan),
 * sehingga endpoint /push/subscribe tidak memakai requireAuth.
 * Unsubscribe juga terbuka agar browser bisa membersihkan sendiri.
 *
 * Pengiriman push hanya untuk admin & korlas. Notifikasi WhatsApp punya
 * modul sendiri di `/api/whatsapp` karena transportnya memakai `sikuwa`.
 */
export const notificationsRoute = new Hono<AuthEnv>()
  // Push — subscription terbuka (bisa dari halaman depan)
  .post("/push/subscribe", notificationController.subscribe)
  .post("/push/unsubscribe", notificationController.unsubscribe)
  .get("/push/vapid-key", notificationController.vapidKey)
  // Push — kaitkan subscription yang sudah ada ke akun yang login
  .post(
    "/push/link",
    requireAuth,
    notificationController.linkSubscription,
  )
  // Push — kirim (admin/korlas)
  .post(
    "/push/send",
    requireAuth,
    requireRole("admin", "korlas"),
    notificationController.sendPush,
  );
