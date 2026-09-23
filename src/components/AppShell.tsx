import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/cn";
import { SPRING } from "@/lib/motion";
import { useHasNoClass } from "@/hooks/useClasses";
import { AccountMenu } from "./AccountMenu";
import { BottomNav } from "./BottomNav";
import { ClassNotice } from "./ClassNotice";
import { ImpersonationBar } from "./ImpersonationBar";
import { PWAInstallPrompt } from "./PWAInstallPrompt";
import { visibleNavItems, type NavItem } from "./navItems";
import { usePWA } from "@/hooks/usePWA";
import logo from "@/assets/logo.png";

/**
 * Kerangka halaman yang butuh login: header lengket (logo, akun, menu), isi
 * halaman, catatan kaki, dan bilah navigasi bawah untuk PWA terpasang.
 *
 * Perilaku tiap bagian dirawat di komponennya sendiri — `AccountMenu` memegang
 * identitas & keluar, `HeaderNav` daftar menu, `BottomNav` bilah bawah.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { isAdmin, isImpersonating, canManageSchedule, canManageCatalog } =
    useAuth();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  // Saat PWA terpasang, bilah menu dipindahkan ke bawah layar.
  const { isInstalled } = usePWA();

  // User tanpa kelas perlu diberi tahu; notifikasinya lebih penting daripada
  // ajakan memasang PWA, dan keduanya sama-sama menempel di bawah layar.
  const hasNoClass = useHasNoClass();

  const items = visibleNavItems({ isAdmin, canManageSchedule, canManageCatalog });

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="brand-stripe" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between gap-4">
            <HomeLink />
            <div className="flex items-center gap-3">
              <AccountMenu />
            </div>
          </div>

          {/*
            Bilah menu atas disembunyikan saat PWA terpasang: bilah bawah
            mengambil alih perannya, dan menampilkan keduanya sekaligus hanya
            menduplikasi tujuan yang sama.
          */}
          <HeaderNav items={items} pathname={pathname} hidden={isInstalled} />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <p className="text-xs text-slate-400">
          Pizza Snack Play · Bun + Hono + Vite + React + Cloudflare D1
        </p>
      </footer>

      {/*
        Ketiganya menempel di bawah layar — tampilkan satu saja, dengan
        urutan prioritas: keadaan sesi (sedang memakai akun orang lain) lebih
        dulu, baru hal yang perlu diperbaiki user, terakhir ajakan memasang PWA.
      */}
      {isImpersonating ? (
        <ImpersonationBar />
      ) : hasNoClass ? (
        <ClassNotice />
      ) : (
        <PWAInstallPrompt />
      )}
      {/* Bilah bawah hanya muncul bila aplikasi sudah dipasang (PWA). */}
      <BottomNav />
    </div>
  );
}

/** Logo + nama aplikasi, sekaligus jalan pulang ke halaman utama. */
function HomeLink() {
  return (
    <Link to="/hari-ini" className="flex items-center gap-2.5 shrink-0">
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
        <span className="block text-xs text-slate-500">Pilih Jadwal Snack Anak Itu Menyenangkan!</span>
      </span>
    </Link>
  );
}

/** Menu utama di bawah header; `hidden` menyembunyikannya saat PWA terpasang. */
function HeaderNav({
  items,
  pathname,
  hidden,
}: {
  items: NavItem[];
  pathname: string;
  hidden: boolean;
}) {
  return (
    <nav className={cn("-mb-px flex gap-1 overflow-x-auto pb-px", hidden && "hidden")}>
      {items.map(({ to, label, icon: Icon }) => {
        const active = pathname === to;
        return (
          <Link
            key={to}
            to={to}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex shrink-0 items-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors",
              active ? "text-brand-700" : "text-slate-500 hover:text-brand-700",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
            {/*
              Garis bawah penanda menu aktif digambar sebagai elemen, bukan
              border, supaya perpindahannya bisa dianimasikan antar menu
              (atribut `layoutId` membuat React hanya memindahkan satu elemen).
            */}
            {active && (
              <motion.span
                layoutId="nav-underline"
                className="absolute inset-x-0 -bottom-px h-0.5 bg-brand-600"
                transition={SPRING}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

/** Judul halaman dengan deskripsi opsional. */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <span className="mb-2.5 block h-1 w-10 rounded-full bg-linear-to-r from-brand-600 via-accent-500 to-highlight-400" />
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
