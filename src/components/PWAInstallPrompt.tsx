import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Download, X, RefreshCw, Smartphone } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";
import { Button } from "@/components/ui";
import { SPRING } from "@/lib/motion";

/**
 * Notifikasi yang naik dari tepi bawah layar.
 *
 * Dipakai untuk semua keadaan banner di bawah ini supaya kemunculannya selalu
 * sama — memudar sambil terangkat sedikit, dan menghilang dengan cepat saat
 * ditutup. `bottomOffset` ikut beranimasi karena sifatnya bawaan animasi
 * `bottom`, bukan `transition` CSS terpisah.
 */
function Banner({
  offset,
  children,
}: {
  offset: string;
  children: React.ReactNode;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0, bottom: undefined }}
      exit={reduced ? undefined : { opacity: 0, y: 12 }}
      transition={SPRING}
      className={`fixed left-0 right-0 z-50 border-t border-brand-200 bg-brand-50 px-4 py-3 shadow-lg ${offset}`}
    >
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
        {children}
      </div>
    </motion.div>
  );
}

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

  // Saat PWA terpasang, bilah bawah mengambang menempati bagian bawah layar —
  // notifikasi SW digeser ke atasnya agar tidak tertutup.
  const bottomOffset = pwa.isInstalled ? "bottom-28" : "bottom-0";

  // Deteksi iOS
  const isIOS =
    typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as unknown as Record<string, boolean>).MSStream;

  /** Keadaan banner saat ini — satu nilai, jadi hanya satu yang bisa tampil. */
  const banner = resolveBanner();

  return (
    <AnimatePresence>
      {banner && <Banner key={banner} offset={bottomOffset}>{content()}</Banner>}
    </AnimatePresence>
  );

  /**
   * Banner mana yang harus tampil. Urutannya penting: pembaruan versi
   * mengalahkan ajakan memasang, dan ajakan memasang tidak muncul sama sekali
   * bila aplikasinya sudah terpasang.
   */
  function resolveBanner(): string | null {
    if (dismissed) return null;
    if (pwa.updateAvailable) return "update";
    if (pwa.isInstalled) return null;
    if (isIOS) return showIOSHint ? "ios-hint" : "ios-install";
    if (pwa.canInstall) return "install";
    return null;
  }

  function content() {
    if (banner === "update") {
      return (
        <>
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
        </>
      );
    }

    if (banner === "ios-hint") {
      return (
        <div className="w-full">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <p className="text-sm font-medium text-brand-900">
                Tambahkan ke Layar Utama
              </p>
              <ol className="list-decimal pl-4 text-xs text-brand-700">
                <li>
                  Ketuk tombol <strong>Share</strong> di bawah Safari
                </li>
                <li>
                  Gulir ke bawah dan pilih <strong>Add to Home Screen</strong>
                </li>
                <li>
                  Ketuk <strong>Add</strong>
                </li>
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
      );
    }

    /** Ajakan memasang terakhir — teksnya beda di iOS yang tak punya prompt. */
    const installing = banner === "install";

    return (
      <>
        <div className="flex items-center gap-3">
          {installing ? (
            <Download className="h-5 w-5 shrink-0 text-brand-600" />
          ) : (
            <Smartphone className="h-5 w-5 shrink-0 text-brand-600" />
          )}
          <p className="text-sm text-brand-900">
            {installing
              ? "Pasang Pizza Snack Play ke layar utama untuk akses lebih cepat."
              : "Pasang Pizza Snack Play untuk akses lebih cepat."}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="ghost" size="sm" onClick={() => setDismissed(true)}>
            {installing ? "Nanti" : <X className="h-4 w-4" />}
          </Button>
          {installing ? (
            <Button size="sm" onClick={pwa.promptInstall} loading={pwa.isInstalling}>
              Pasang
            </Button>
          ) : (
            <Button size="sm" onClick={() => setShowIOSHint(true)}>
              Cara Pasang
            </Button>
          )}
        </div>
      </>
    );
  }
}
