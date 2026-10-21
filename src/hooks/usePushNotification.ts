import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

export interface PushNotificationState {
  /** Apakah browser mendukung push notification. */
  isSupported: boolean;
  /** Apakah user sudah memberikan izin (granted / denied / default). */
  permission: NotificationPermission;
  /** Apakah user sudah subscribe ke push service. */
  isSubscribed: boolean;
  /** Apakah sedang proses subscribe/unsubscribe. */
  isLoading: boolean;
  /** Pesan error terakhir. */
  error: string | null;
  /** Minta izin dan subscribe ke push notification. */
  subscribe: () => Promise<void>;
  /** Unsubscribe dari push notification. */
  unsubscribe: () => Promise<void>;
}

const STORAGE_KEY = "psp_push_endpoint";

function readStoredEndpoint(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

function saveStoredEndpoint(endpoint: string | null) {
  if (typeof localStorage === "undefined") return;
  if (endpoint) localStorage.setItem(STORAGE_KEY, endpoint);
  else localStorage.removeItem(STORAGE_KEY);
}

/**
 * Hook untuk mengelola Push Notification PWA.
 *
 * Flow:
 * 1. Cek apakah browser mendukung service worker + push manager.
 * 2. Cek izin notifikasi — bila "default", user perlu klik tombol Subscribe.
 * 3. Subscribe ke push service menggunakan VAPID public key dari server.
 * 4. Kirim subscription (endpoint, p256dh, auth) ke backend untuk disimpan.
 * 5. Bila unsubscribe, hapus dari backend dan browser.
 */
export function usePushNotification(): PushNotificationState {
  const isSupported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window;

  const [permission, setPermission] = useState<NotificationPermission>(
    () => (isSupported ? Notification.permission : "default"),
  );
  const [isSubscribed, setIsSubscribed] = useState(() => !!readStoredEndpoint());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sinkronkan status subscription saat komponen mount
  useEffect(() => {
    if (!isSupported) return;

    let cancelled = false;

    async function check() {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (cancelled) return;

      setIsSubscribed(!!sub);
      if (sub) saveStoredEndpoint(sub.endpoint);
      else saveStoredEndpoint(null);

      // Subscription yang dibuat sebelum login belum punya `user_id`. Bila
      // sekarang ada sesi, kaitkan agar notifikasi bisa disaring per kelas.
      // Kegagalan di sini tidak mengganggu — status subscribe tetap benar.
      const hasSession =
        typeof localStorage !== "undefined" &&
        !!localStorage.getItem("psp_token");
      if (sub && hasSession) {
        void api.notifications
          .linkPush({ endpoint: sub.endpoint })
          .catch(() => undefined);
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [isSupported]);

  const subscribe = useCallback(async () => {
    if (!isSupported) {
      setError("Browser tidak mendukung push notification");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Minta izin notifikasi
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== "granted") {
        setError("Izin notifikasi ditolak — aktifkan di pengaturan browser");
        setIsLoading(false);
        return;
      }

      // 2. Ambil VAPID public key dari server
      const { publicKey } = await api.notifications.vapidKey();
      if (!publicKey) {
        setError("VAPID key belum dikonfigurasi di server");
        setIsLoading(false);
        return;
      }

      // 3. Subscribe ke push service
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });

      // 4. Kirim subscription ke backend
      const subJson = subscription.toJSON();
      await api.notifications.subscribePush({
        endpoint: subJson.endpoint!,
        keys: {
          p256dh: subJson.keys!.p256dh,
          auth: subJson.keys!.auth,
        },
      });

      setIsSubscribed(true);
      saveStoredEndpoint(subJson.endpoint!);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal mengaktifkan notifikasi";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async () => {
    if (!isSupported) return;

    setIsLoading(true);
    setError(null);

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();

      if (sub) {
        // Hapus dari backend dulu
        await api.notifications.unsubscribePush({ endpoint: sub.endpoint });
        // Lalu unsubscribe di browser
        await sub.unsubscribe();
      }

      setIsSubscribed(false);
      saveStoredEndpoint(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal menonaktifkan notifikasi";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
  };
}

/** Konversi base64url VAPID key ke Uint8Array yang dibutuhkan PushManager. */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
