import { eq } from "drizzle-orm";
import type { Db } from "../../database/db";
import { pushSubscriptions } from "../../database/schema";
import type { PushSubscription } from "../../database/schema";

/**
 * Data untuk notifikasi **push (PWA)**.
 *
 * WhatsApp punya repository sendiri di `src/api/whatsapp/repository.ts` —
 * tabel `whatsapp_broadcasts` sengaja tidak lagi disentuh dari sini supaya
 * satu tabel hanya punya satu modul pemilik.
 */
class NotificationRepository {
  // ── Push Subscriptions ──────────────────────────────────────

  async findSubscriptionByEndpoint(
    db: Db,
    endpoint: string,
  ): Promise<PushSubscription | undefined> {
    const rows = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint))
      .limit(1);
    return rows[0];
  }

  async insertSubscription(
    db: Db,
    values: {
      endpoint: string;
      p256dh: string;
      auth: string;
      userId: number | null;
      className: string | null;
    },
  ): Promise<PushSubscription> {
    const rows = await db
      .insert(pushSubscriptions)
      .values(values)
      .returning();
    return rows[0];
  }

  async updateSubscriptionUser(
    db: Db,
    id: number,
    userId: number | null,
    className: string | null,
  ): Promise<void> {
    await db
      .update(pushSubscriptions)
      .set({ userId, className })
      .where(eq(pushSubscriptions.id, id));
  }

  async deleteSubscriptionByEndpoint(db: Db, endpoint: string): Promise<void> {
    await db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint));
  }

  async deleteSubscriptionById(db: Db, id: number): Promise<void> {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, id));
  }

  /** Ambil semua subscription aktif. Bila `className` diberikan, hanya untuk kelas itu. */
  async listSubscriptions(
    db: Db,
    options: { className?: string | null } = {},
  ): Promise<PushSubscription[]> {
    if (options.className) {
      return db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.className, options.className));
    }
    return db.select().from(pushSubscriptions);
  }
}

export const notificationRepository = new NotificationRepository();
