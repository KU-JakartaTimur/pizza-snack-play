import type { Context } from "hono";
import { getDb } from "../../database/db";
import type { AuthEnv } from "../middleware/auth";
import {
  responseBadRequest,
  responseForbidden,
  responseInternalError,
  responseNotFound,
  responseOK,
} from "../utils/response";
import { notificationService, type NotificationError } from "./service";

type NotificationContext = Context<AuthEnv>;

function mapError(c: NotificationContext, error: NotificationError) {
  switch (error) {
    case "invalid_subscription":
      return responseBadRequest(c, "Data subscription tidak lengkap");
    case "vapid_not_configured":
      return responseInternalError(
        c,
        "VAPID belum dikonfigurasi — hubungi admin sistem",
      );
    case "send_failed":
      return responseInternalError(c, "Gagal mengirim notifikasi");
    case "no_targets":
      return responseBadRequest(
        c,
        "Belum ada perangkat yang berlangganan notifikasi",
      );
  }
}

class NotificationController {
  // ── Push Subscription ───────────────────────────────────────

  subscribe = async (c: NotificationContext) => {
    let body: {
      endpoint?: unknown;
      keys?: { p256dh?: unknown; auth?: unknown };
    };
    try {
      body = await c.req.json();
    } catch {
      return responseBadRequest(c, "Body harus berupa JSON");
    }

    if (typeof body.endpoint !== "string" || !body.endpoint) {
      return responseBadRequest(c, "`endpoint` wajib diisi");
    }
    if (
      typeof body.keys?.p256dh !== "string" ||
      typeof body.keys?.auth !== "string"
    ) {
      return responseBadRequest(c, "`keys.p256dh` dan `keys.auth` wajib diisi");
    }

    const user = c.get("user");
    const userId = user?.sub ?? null;
    const className = user?.className ?? null;

    const result = await notificationService.subscribe(
      getDb(c.env),
      {
        endpoint: body.endpoint,
        keys: {
          p256dh: body.keys.p256dh,
          auth: body.keys.auth,
        },
      },
      userId,
      className,
    );

    if (typeof result === "string") return mapError(c, result);
    return responseOK(c, "Berlangganan notifikasi aktif", result);
  };

  /**
   * Update user linkage untuk subscription yang sudah ada.
   * Dipakai saat user login setelah subscribe di halaman depan.
   */
  linkSubscription = async (c: NotificationContext) => {
    let body: { endpoint?: unknown };
    try {
      body = await c.req.json();
    } catch {
      return responseBadRequest(c, "Body harus berupa JSON");
    }

    if (typeof body.endpoint !== "string" || !body.endpoint) {
      return responseBadRequest(c, "`endpoint` wajib diisi");
    }

    const user = c.get("user");
    const result = await notificationService.linkSubscription(
      getDb(c.env),
      body.endpoint,
      user.sub,
      user.className ?? null,
    );

    if (typeof result === "string") return mapError(c, result);
    return responseOK(c, "Subscription diperbarui", result);
  };

  unsubscribe = async (c: NotificationContext) => {
    let body: { endpoint?: unknown };
    try {
      body = await c.req.json();
    } catch {
      return responseBadRequest(c, "Body harus berupa JSON");
    }

    if (typeof body.endpoint !== "string" || !body.endpoint) {
      return responseBadRequest(c, "`endpoint` wajib diisi");
    }

    await notificationService.unsubscribe(getDb(c.env), body.endpoint);
    return responseOK(c, "Berlangganan notifikasi dihentikan");
  };

  /** Kirim push notification ke semua subscriber — admin/korlas only. */
  sendPush = async (c: NotificationContext) => {
    const user = c.get("user");

    let body: {
      title?: unknown;
      body?: unknown;
      icon?: unknown;
      tag?: unknown;
      url?: unknown;
      className?: unknown;
    };
    try {
      body = await c.req.json();
    } catch {
      return responseBadRequest(c, "Body harus berupa JSON");
    }

    if (typeof body.title !== "string" || !body.title.trim()) {
      return responseBadRequest(c, "`title` wajib diisi");
    }
    if (typeof body.body !== "string" || !body.body.trim()) {
      return responseBadRequest(c, "`body` wajib diisi");
    }

    // Korlas hanya boleh kirim ke kelasnya sendiri
    let targetClass: string | null = null;
    if (typeof body.className === "string" && body.className) {
      targetClass = body.className;
    }

    if (user.role === "korlas") {
      if (targetClass && targetClass !== user.className) {
        return responseForbidden(
          c,
          "Korlas hanya boleh mengirim ke kelasnya sendiri",
        );
      }
      targetClass = user.className ?? null;
    }

    const result = await notificationService.sendPushToAll(
      getDb(c.env),
      c.env,
      {
        title: body.title.trim(),
        body: body.body.trim(),
        icon: typeof body.icon === "string" ? body.icon : undefined,
        tag: typeof body.tag === "string" ? body.tag : undefined,
        url: typeof body.url === "string" ? body.url : undefined,
      },
      { className: targetClass },
    );

    if (typeof result === "string") return mapError(c, result);
    return responseOK(
      c,
      `Notifikasi terkirim: ${result.sent} sukses, ${result.failed} gagal`,
      result,
    );
  };

  /** Ambil VAPID public key untuk frontend subscription. */
  vapidKey = async (c: NotificationContext) => {
    const key = c.env.VAPID_PUBLIC_KEY;
    if (!key) {
      return responseNotFound(c, "VAPID public key belum dikonfigurasi");
    }
    return responseOK(c, "VAPID public key", { publicKey: key });
  };
}

export const notificationController = new NotificationController();
