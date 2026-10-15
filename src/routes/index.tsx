import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Benefits } from "@/components/landing/Benefits";
import { Closing } from "@/components/landing/Closing";
import { Faq } from "@/components/landing/Faq";
import { Features } from "@/components/landing/Features";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { MasukLink } from "@/components/landing/MasukLink";
import { FullPageSpinner } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import logo from "@/assets/logo.png";

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
        <Faq />
        <Closing />
      </main>

      <LandingFooter />
    </div>
  );
}

/** Bilah atas: identitas aplikasi di kiri, ajakan masuk di kanan. */
function LandingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="brand-stripe" />
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        {/*
          Bukan tautan: pengunjung sudah berada di halaman ini, dan tautan ke
          diri sendiri hanya menambah satu tujuan tanpa isi bagi pembaca layar.
        */}
        <div className="flex shrink-0 items-center gap-2.5">
          <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl shadow-sm">
            <img
              src={logo}
              alt="Pizza Snack Play"
              className="h-full w-full object-cover"
            />
          </span>
          <span className="hidden sm:block">
            <span className="block font-bold leading-tight text-slate-900">
              Pizza Snack Play
            </span>
            <span className="block text-xs text-slate-500">
              Pilih Jadwal Snack Anak Itu Menyenangkan!
            </span>
          </span>
        </div>

        <MasukLink size="sm" />
      </div>
    </header>
  );
}

function LandingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-1.5 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-xs text-slate-400">
          Pizza Snack Play · Bun + Hono + Vite + React + Cloudflare D1
        </p>
        <p className="text-xs text-slate-400">
          Setiap orang tua punya akun sendiri yang dibuat admin sekolah.
        </p>
      </div>
    </footer>
  );
}
