import { Bell, BellOff, BellRing, Loader2 } from "lucide-react";
import { Card, CardHeader, InlineAlert } from "@/components/ui";
import { usePushNotification } from "@/hooks/usePushNotification";

/**
 * Kartu pengaturan Push Notification PWA.
 *
 * Ditampilkan di dashboard admin/korlas dan bisa juga di profil orang tua.
 * Browser yang belum mendukung (Safari lama, mode privat) ditampilkan
 * sebagai tidak tersedia.
 */
export function PushNotificationCard() {
  const push = usePushNotification();

  return (
    <Card>
      <CardHeader
        title="Notifikasi Push"
        description="Dapatkan pemberitahuan langsung di perangkat Anda"
      />
      <div className="px-5 py-4">
        {!push.isSupported ? (
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <BellOff className="h-5 w-5 shrink-0" />
            <p>Browser Anda tidak mendukung push notification.</p>
          </div>
        ) : push.permission === "denied" ? (
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <BellOff className="h-5 w-5 shrink-0 text-slate-400" />
            <p>
              Izin notifikasi ditolak. Aktifkan lewat pengaturan browser
              untuk menggunakan fitur ini.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {push.isSubscribed ? (
                  <BellRing className="h-5 w-5 text-brand-600" />
                ) : (
                  <Bell className="h-5 w-5 text-slate-400" />
                )}
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {push.isSubscribed
                      ? "Notifikasi aktif"
                      : "Notifikasi nonaktif"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {push.isSubscribed
                      ? "Anda akan menerima pemberitahuan push"
                      : "Klik tombol di kanan untuk mengaktifkan"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={push.isSubscribed ? push.unsubscribe : push.subscribe}
                disabled={push.isLoading}
                className={
                  push.isSubscribed
                    ? "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    : "rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                }
              >
                {push.isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : push.isSubscribed ? (
                  "Nonaktifkan"
                ) : (
                  "Aktifkan"
                )}
              </button>
            </div>

            {push.error && (
              <InlineAlert tone="error">{push.error}</InlineAlert>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
