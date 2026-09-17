import type { ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  CalendarDays,
  CalendarRange,
  LayoutDashboard,
  LogOut,
  Pizza,
  Tags,
  UserCircle,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/cn";

interface NavItem {
  to: string;
  label: string;
  icon: typeof CalendarDays;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, adminOnly: true },
  { to: "/hari-ini", label: "Hari Ini", icon: CalendarDays },
  { to: "/minggu-ini", label: "Minggu Ini", icon: CalendarRange },
  { to: "/bulan", label: "Bulanan", icon: CalendarDays },
  { to: "/menu", label: "Menu", icon: UtensilsCrossed },
  { to: "/kategori", label: "Kategori", icon: Tags, adminOnly: true },
  { to: "/jadwal", label: "Kelola Jadwal", icon: CalendarRange, adminOnly: true },
  { to: "/orang-tua", label: "Akun Orang Tua", icon: Users, adminOnly: true },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, student, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  const items = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  const handleLogout = () => {
    logout();
    void navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link to="/hari-ini" className="flex items-center gap-2.5 shrink-0">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
                <Pizza className="h-5 w-5" />
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
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-slate-800 leading-tight">
                  {user?.fullName ?? user?.username}
                </p>
                <p className="text-xs text-slate-500">
                  {isAdmin ? "Admin" : "Orang tua"}
                  {student?.name ? ` · ${student.name}` : ""}
                </p>
              </div>
              <Link
                to="/profil"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
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
                      ? "border-emerald-600 text-emerald-700"
                      : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800",
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
