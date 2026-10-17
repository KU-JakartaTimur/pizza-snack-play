import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { About } from "@/components/landing/About";
import { Benefits } from "@/components/landing/Benefits";
import { Closing } from "@/components/landing/Closing";
import { Faq } from "@/components/landing/Faq";
import { Features } from "@/components/landing/Features";
import { LandingFooter } from "@/components/landing/Footer";
import { LandingHeader } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { IslamicBand } from "@/components/landing/IslamicBand";
import { FullPageSpinner } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

/**
 * Halaman depan — satu-satunya halaman yang boleh dibaca tanpa masuk.
 *
 * Isinya menjelaskan fitur dan manfaatnya kepada orang tua yang **belum punya
 * akun**; halaman-halaman di dalam aplikasi tetap tertutup dan diarahkan ke
 * `/login` oleh layout `_app`.
 *
 * Pengguna yang sudah masuk langsung dialihkan ke jadwal hari ini. Ini bukan
 * sekadar kerapian: `start_url` di `manifest.json` masih `"/"`, jadi aplikasi
 * yang sudah dipasang di HP membuka halaman ini lebih dulu setiap kali
 * dijalankan. Tanpa pengalihan itu, setiap orang tua yang membuka PWA-nya akan
 * mendarat di halaman promosi, bukan di jadwal anaknya.
 *
 * Selama sesi tersimpan masih diverifikasi (`isReady` palsu), yang tampil
 * adalah indikator memuat — bukan halaman ini. Sebaliknya, pengunjung tanpa
 * sesi tidak menunggu apa pun: `AuthProvider` menandai sesi kosong sebagai
 * sudah siap, sehingga halamannya langsung terbaca.
 *
 * Berkas ini sengaja hanya berisi urusan rute: siapa yang boleh melihat, dan
 * bagian mana yang tampil dalam urutan apa. Seluruh isi dan tampilannya ada di
 * `components/landing/` — termasuk bilah atas dan kaki halaman, supaya tidak
 * ada bagian halaman depan yang tersembunyi di dalam berkas rute.
 */
function LandingPage() {
  const { user, isReady } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // `replace` supaya tombol kembali tidak memantul ke halaman ini lagi.
    if (isReady && user) void navigate({ to: "/hari-ini", replace: true });
  }, [isReady, user, navigate]);

  if (!isReady) return <FullPageSpinner label="Memeriksa sesi…" />;
  if (user) return <FullPageSpinner label="Mengalihkan ke jadwal hari ini…" />;

  return (
    <div className="min-h-screen bg-canvas">
      <LandingHeader />

      <main>
        <Hero />
        <Benefits />
        <Features />
        <HowItWorks />
        <IslamicBand />
        <Faq />
        <About />
        <Closing />
      </main>

      <LandingFooter />
    </div>
  );
}
