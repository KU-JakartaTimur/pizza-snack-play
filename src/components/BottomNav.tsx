import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAuth } from "@/lib/auth-context";
import { usePWA } from "@/hooks/usePWA";
import {
  BOTTOM_TAB_ROUTES,
  PROFILE_NAV_ITEM,
  visibleNavItems,
  type NavItem,
} from "./navItems";

/**
 * Bilah navigasi bawah bergaya "floating pill" — **hanya saat PWA terpasang**.
 *
 * Layout mengikuti referensi desain: empat tab dalam kapsul putih mengambang,
 * dengan tombol bulat ungu di tengah atasnya. Tombol tengah membuka panel berisi
 * seluruh tujuan navigasi yang tidak muat sebagai tab, sehingga daftar di bilah
 * tetap pendek sementara semua halaman tetap terjangkau.
 *
 * Di browser biasa komponen ini tidak dirender sama sekali — bilah menu di
 * header sudah cukup, dan bilah bawah hanya menambah gangguan.
 */
export function BottomNav() {
  const { isInstalled } = usePWA();
  const { isAdmin, canManageSchedule, canManageCatalog } = useAuth();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [sheetOpen, setSheetOpen] = useState(false);

  // Bilah bawah hanya untuk aplikasi yang sudah dipasang ke layar utama.
  if (!isInstalled) return null;

  const items = visibleNavItems({ isAdmin, canManageSchedule, canManageCatalog });

  const allItems = [
    ...items.filter((item) =>
      (BOTTOM_TAB_ROUTES as readonly string[]).includes(item.to),
    ),
    // Profil selalu ada di bilah bawah; di bilah atas ia berupa ikon di header.
    ...(items.some((item) => item.to === PROFILE_NAV_ITEM.to)
      ? []
      : [PROFILE_NAV_ITEM]),
  ].slice(0, 4);

  const sheetItems = items.filter(
    (item) => !allItems.some((tab) => tab.to === item.to),
  );

  return (
    <>
      {/* Ruang bawah agar konten terakhir tidak tertutup bilah mengambang. */}
      <div className="h-28" aria-hidden />

      <nav
        aria-label="Navigasi utama"
        className="fixed inset-x-0 bottom-0 z-40"
      >
        <div className="relative mx-auto mb-4 w-[min(92vw,26rem)]">
          {/* Tombol tengah — muncul menonjol di atas kapsul. */}
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            aria-label="Menu lainnya"
            aria-expanded={sheetOpen}
            className="absolute -top-7 left-1/2 z-10 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/30 transition-transform hover:bg-brand-700 active:scale-95"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Kapsul putih berisi empat tab. */}
          <div className="flex items-center justify-between rounded-[1.75rem] border border-slate-200/80 bg-white px-2 py-2.5 shadow-xl shadow-slate-900/10">
            {allItems.map((item) => (
              <BottomTab
                key={item.to}
                item={item}
                active={pathname === item.to}
              />
            ))}
          </div>
        </div>
      </nav>

      {/* Panel tujuan navigasi yang tidak muat sebagai tab. */}
      {sheetOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-brand-950/45"
          onClick={() => setSheetOpen(false)}
        >
          <div
            className="w-full rounded-t-3xl bg-white pb-8 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="font-semibold text-slate-900">Semua Menu</h2>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-700"
                aria-label="Tutup"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <ul className="grid grid-cols-2 gap-1 px-3 py-3">
              {(sheetItems.length > 0 ? sheetItems : items).map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    onClick={() => setSheetOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                      pathname === item.to
                        ? "bg-brand-50 text-brand-700"
                        : "text-slate-600 hover:bg-slate-50",
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

/** Satu tab di bilah bawah — ikon di atas label, dengan penanda aktif. */
function BottomTab({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      to={item.to}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex flex-1 flex-col items-center gap-0.5 rounded-2xl px-1 py-1.5 transition-colors",
        active ? "text-brand-600" : "text-slate-400 hover:text-slate-600",
      )}
    >
      <item.icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
      <span className={cn("text-[0.68rem]", active && "font-semibold")}>
        {item.label}
      </span>
      {/* Titik penanda tab aktif, sesuai referensi desain. */}
      <span
        className={cn(
          "h-1 w-1 rounded-full transition-colors",
          active ? "bg-brand-600" : "bg-transparent",
        )}
      />
    </Link>
  );
}
