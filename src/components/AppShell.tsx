import type { ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LogOut, UserCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/cn";
import { BottomNav } from "./BottomNav";
import { ClassSwitcher } from "./ClassSwitcher";
import { PWAInstallPrompt } from "./PWAInstallPrompt";
import { visibleNavItems } from "./navItems";
import { usePWA } from "@/hooks/usePWA";
import logo from "@/assets/logo.png";

export function AppShell({ children }: { children: ReactNode }) {
  const {
    user,
    students,
    isAdmin,
    isKorlas,
    korlasClass,
    canManageSchedule,
    canManageCatalog,
    logout,
  } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  // Saat PWA terpasang, bilah menu dipindahkan ke bawah layar.
  const { isInstalled } = usePWA();

  const items = visibleNavItems({ isAdmin, canManageSchedule, canManageCatalog });

  // Korlas tetap orang tua murid, tapi perannya ditampilkan tersendiri
  // beserta kelas yang dikoordinasinya.
  const roleLabel = isAdmin
    ? "Admin"
    : isKorlas
      ? `Korlas${korlasClass ? ` ${korlasClass}` : ""}`
      : "Orang tua";

  // Ringkas daftar anak agar muat di header; rinciannya lewat tooltip.
  const studentLabel =
    students.length === 0
      ? ""
      : students.length === 1
        ? ` · ${students[0].name}`
        : ` · ${students.length} anak`;

  const studentTooltip = students
    .map((s) => `${s.name}${s.className ? ` (${s.className})` : ""}`)
    .join(", ");

  const handleLogout = () => {
    logout();
    void navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="brand-stripe" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link to="/hari-ini" className="flex items-center gap-2.5 shrink-0">
              <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl shadow-sm">
                <img src={logo} alt="Pizza Snack Play" className="h-full w-full object-cover" />
              </span>
              <span className="hidden sm:block">
                <span className="block font-bold leading-tight text-slate-900">
                  Pizza Snack Play
                </span>
                <span className="block text-xs text-slate-500">
                  Jadwal snack sekolah
                </span>
              </span>
            </Link>

            <div className="flex items-center gap-3">
              <ClassSwitcher />
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-slate-800 leading-tight">
                  {user?.fullName ?? user?.username}
                </p>
                <p className="text-xs text-slate-500" title={studentTooltip || undefined}>
                  {roleLabel}
                  {studentLabel}
                </p>
              </div>
              <Link
                to="/profil"
                className="rounded-lg p-2 text-slate-500 hover:bg-brand-50 hover:text-brand-700"
                title="Profil & ubah password"
              >
                <UserCircle className="h-5 w-5" />
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                title="Keluar"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/*
            Bilah menu atas disembunyikan saat PWA terpasang: bilah bawah
            mengambil alih perannya, dan menampilkan keduanya sekaligus hanya
            menduplikasi tujuan yang sama.
          */}
          <nav
            className={cn(
              "-mb-px flex gap-1 overflow-x-auto pb-px",
              isInstalled && "hidden",
            )}
          >
            {items.map(({ to, label, icon: Icon }) => {
              const active = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    "flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "border-brand-600 text-brand-700"
                      : "border-transparent text-slate-500 hover:border-accent-400 hover:text-brand-700",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
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

      <PWAInstallPrompt />
      {/* Bilah bawah hanya muncul bila aplikasi sudah dipasang (PWA). */}
      <BottomNav />
    </div>
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
