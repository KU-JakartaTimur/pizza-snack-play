import { useState } from "react";
import { Download, X, RefreshCw, Smartphone } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";
import { Button } from "@/components/ui";

/**
 * Banner instalasi PWA + notifikasi update Service Worker.
 *
 * Muncul di bagian bawah layar bila:
 * - App bisa di-install (Chrome/Android)
 * - Ada update Service Worker yang tersedia
 *
 * Di iOS: menampilkan petunjuk manual "Add to Home Screen"
 * karena Safari tidak mendukung beforeinstallprompt.
 */
export function PWAInstallPrompt() {
  const pwa = usePWA();
  const [dismissed, setDismissed] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);

  // Deteksi iOS
  const isIOS =
    typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as unknown as Record<string, boolean>).MSStream;

  if (dismissed) return null;

  // Service Worker update available
  if (pwa.updateAvailable) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-brand-200 bg-brand-50 px-4 py-3 shadow-lg">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-5 w-5 shrink-0 text-brand-600" />
            <p className="text-sm text-brand-900">
              Versi baru tersedia. Muat ulang untuk pembaruan.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="ghost" size="sm" onClick={() => setDismissed(true)}>
              Nanti
            </Button>
            <Button size="sm" onClick={pwa.applyUpdate}>
              Muat Ulang
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Already installed
  if (pwa.isInstalled) return null;

  // iOS manual install hint
  if (isIOS && showIOSHint) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-brand-200 bg-brand-50 px-4 py-4 shadow-lg">
        <div className="mx-auto max-w-md">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <p className="text-sm font-medium text-brand-900">
                Tambahkan ke Layar Utama
              </p>
              <ol className="list-decimal pl-4 text-xs text-brand-700">
                <li>Ketuk tombol <strong>Share</strong> di bawah Safari</li>
                <li>Gulir ke bawah dan pilih <strong>Add to Home Screen</strong></li>
                <li>Ketuk <strong>Add</strong></li>
              </ol>
            </div>
            <button
              onClick={() => setShowIOSHint(false)}
              className="rounded-md p-1 text-brand-400 hover:bg-brand-100 hover:text-brand-700"
              aria-label="Tutup"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // iOS: show "how to install" button
  if (isIOS) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-brand-200 bg-brand-50 px-4 py-3 shadow-lg">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Smartphone className="h-5 w-5 shrink-0 text-brand-600" />
            <p className="text-sm text-brand-900">
              Pasang Pizza Snack Play untuk akses lebih cepat.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="ghost" size="sm" onClick={() => setDismissed(true)}>
              <X className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={() => setShowIOSHint(true)}>
              Cara Pasang
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Android/Chrome: native install prompt
  if (pwa.canInstall) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-brand-200 bg-brand-50 px-4 py-3 shadow-lg">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Download className="h-5 w-5 shrink-0 text-brand-600" />
            <p className="text-sm text-brand-900">
              Pasang Pizza Snack Play ke layar utama untuk akses lebih cepat.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button variant="ghost" size="sm" onClick={() => setDismissed(true)}>
              Nanti
            </Button>
            <Button
              size="sm"
              onClick={pwa.promptInstall}
              loading={pwa.isInstalling}
            >
              Pasang
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
