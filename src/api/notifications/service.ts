import { buildPushHTTPRequest } from "@pushforge/builder";
import type { Db } from "../../database/db";
import type { Env } from "../../database/db";
import { notificationRepository } from "./repository";

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
}

export interface PushSubscriptionInput {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export type NotificationError =
  | "invalid_subscription"
  | "vapid_not_configured"
  | "send_failed"
  | "no_targets";

class NotificationService {
  // ── Push Subscription ───────────────────────────────────────

  async subscribe(
    db: Db,
    input: PushSubscriptionInput,
    userId: number | null,
    className: string | null,
  ): Promise<{ id: number } | NotificationError> {
    if (!input.endpoint || !input.keys?.p256dh || !input.keys?.auth) {
      return "invalid_subscription";
    }

    const existing = await notificationRepository.findSubscriptionByEndpoint(
      db,
      input.endpoint,
    );

    if (existing) {
      // Update user linkage bila sudah ada
      await notificationRepository.updateSubscriptionUser(
        db,
        existing.id,
        userId,
        className,
      );
      return { id: existing.id };
    }

    const sub = await notificationRepository.insertSubscription(db, {
      endpoint: input.endpoint,
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
      userId,
      className,
    });

    return { id: sub.id };
  }

  async unsubscribe(db: Db, endpoint: string): Promise<void> {
    await notificationRepository.deleteSubscriptionByEndpoint(db, endpoint);
  }

  async linkSubscription(
    db: Db,
    endpoint: string,
    userId: number,
    className: string | null,
  ): Promise<{ updated: boolean } | NotificationError> {
    const existing = await notificationRepository.findSubscriptionByEndpoint(
      db,
      endpoint,
    );
    if (!existing) {
      return "invalid_subscription";
    }

    await notificationRepository.updateSubscriptionUser(
      db,
      existing.id,
      userId,
      className,
    );

    return { updated: true };
  }

  // ── Push Sending ────────────────────────────────────────────

  async sendPushToAll(
    db: Db,
    env: Env,
    payload: PushPayload,
    options: { className?: string | null } = {},
  ): Promise<{ sent: number; failed: number } | NotificationError> {
    const privateJwk = env.VAPID_PRIVATE_KEY;
    const vapidSubject = env.VAPID_SUBJECT;

    if (!privateJwk || !vapidSubject) {
      return "vapid_not_configured";
    }

    const subs = await notificationRepository.listSubscriptions(db, {
      className: options.className,
    });

    if (subs.length === 0) {
      return "no_targets";
    }

    let sent = 0;
    let failed = 0;

    for (const sub of subs) {
      try {
        const { endpoint, headers, body } = await buildPushHTTPRequest({
          privateJWK: JSON.parse(privateJwk),
          subscription: {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          message: {
            payload: {
              title: payload.title,
              body: payload.body,
              icon: payload.icon ?? "/pwa/icon-192x192.png",
              badge: payload.badge ?? "/pwa/icon-192x192.png",
              tag: payload.tag ?? "snack-update",
              url: payload.url ?? "/",
            },
            adminContact: vapidSubject,
          },
        });

        const response = await fetch(endpoint, {
          method: "POST",
          headers,
          body,
        });

        if (response.status === 201 || response.status === 200) {
          sent++;
        } else if (response.status === 410 || response.status === 404) {
          // Subscription expired or invalid — hapus
          await notificationRepository.deleteSubscriptionById(db, sub.id);
          failed++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    return { sent, failed };
  }
}

export const notificationService = new NotificationService();
