import { useEffect, useState, useCallback } from "react";

export interface PWAState {
  /** Apakah PWA sudah di-install (standalone mode). */
  isInstalled: boolean;
  /** Apakah app bisa di-install (beforeinstallprompt event pernah fire). */
  canInstall: boolean;
  /** Apakah ada update service worker yang tersedia. */
  updateAvailable: boolean;
  /** Apakah sedang proses install. */
  isInstalling: boolean;
  /** Fungsi untuk trigger install prompt. */
  promptInstall: () => void;
  /** Fungsi untuk reload dan apply update SW. */
  applyUpdate: () => void;
}

/**
 * Hook untuk mengelola state PWA:
 * - Deteksi installability (beforeinstallprompt)
 * - Deteksi standalone mode
 * - Listen service worker update
 */
export function usePWA(): PWAState {
  const [isInstalled, setIsInstalled] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS fallback
      ("standalone" in window.navigator && !!window.navigator.standalone)
    );
  });

  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia("(display-mode: standalone)");
    const handleChange = (e: MediaQueryListEvent) => setIsInstalled(e.matches);
    mq.addEventListener("change", handleChange);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
      setIsInstalling(false);
    };
    window.addEventListener("appinstalled", handleAppInstalled);

    const handleSWUpdate = () => setUpdateAvailable(true);
    window.addEventListener("sw-update-available", handleSWUpdate);

    return () => {
      mq.removeEventListener("change", handleChange);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("sw-update-available", handleSWUpdate);
    };
  }, []);

  const promptInstall = useCallback(() => {
    if (!deferredPrompt) return;
    setIsInstalling(true);
    // @ts-expect-error beforeinstallprompt event has prompt() method not in standard Event type
    deferredPrompt.prompt();
    // @ts-expect-error userChoice property not in standard Event type
    deferredPrompt.userChoice.then((choice: { outcome: string }) => {
      if (choice.outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
      setIsInstalling(false);
    });
  }, [deferredPrompt]);

  const applyUpdate = useCallback(() => {
    if (typeof window === "undefined") return;
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "SKIP_WAITING" });
      window.location.reload();
    }
  }, []);

  return {
    isInstalled,
    canInstall: !!deferredPrompt,
    updateAvailable,
    isInstalling,
    promptInstall,
    applyUpdate,
  };
}
