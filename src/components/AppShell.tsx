import type { ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  CalendarDays,
  CalendarRange,
  HandHeart,
  LayoutDashboard,
  LogOut,
  Search,
  Tags,
  UserCircle,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/cn";
import { ClassSwitcher } from "./ClassSwitcher";
import { PWAInstallPrompt } from "./PWAInstallPrompt";
import type { Capability } from "./AdminOnly";
import logo from "@/assets/logo.png";

interface NavItem {
  to: string;
  label: string;
  icon: typeof CalendarDays;
  /** Kemampuan minimum untuk melihat menu ini; kosong = semua role. */
  need?: Capability;
  /** Sembunyikan dari admin — admin tidak punya profil orang tua. */
  parentsOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, need: "admin" },
  { to: "/hari-ini", label: "Hari Ini", icon: CalendarDays },
  { to: "/minggu-ini", label: "Minggu Ini", icon: CalendarRange },
  { to: "/bulan", label: "Bulanan", icon: CalendarDays },
  { to: "/pilih-jadwal", label: "Pilih Jadwal", icon: HandHeart, parentsOnly: true },
  { to: "/pencarian", label: "Cari Menu", icon: Search },
  { to: "/menu", label: "Menu", icon: UtensilsCrossed },
  { to: "/kategori", label: "Kategori", icon: Tags, need: "catalog" },
  { to: "/jadwal", label: "Kelola Jadwal", icon: CalendarRange, need: "schedule" },
  { to: "/orang-tua", label: "Akun Orang Tua", icon: Users, need: "admin" },
];

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

  const items = NAV_ITEMS.filter((item) => {
    if (item.parentsOnly && isAdmin) return false;
    if (!item.need) return true;
    if (item.need === "admin") return isAdmin;
    if (item.need === "schedule") return canManageSchedule;
    return canManageCatalog;
  });

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

          <nav className="-mb-px flex gap-1 overflow-x-auto pb-px">
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
