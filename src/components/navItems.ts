import {
  CalendarDays,
  CalendarRange,
  HandHeart,
  LayoutDashboard,
  Search,
  Tags,
  UserCircle,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import type { Capability } from "@/components/AdminOnly";

/** Satu tujuan navigasi di seluruh aplikasi. */
export interface NavItem {
  to: string;
  label: string;
  icon: typeof CalendarDays;
  /** Kemampuan minimum untuk melihat menu ini; kosong = semua role. */
  need?: Capability;
  /** Sembunyikan dari admin — admin tidak punya profil orang tua. */
  parentsOnly?: boolean;
}

/**
 * Sumber tunggal untuk semua tujuan navigasi.
 *
 * Dipakai bersama oleh bilah atas (`AppShell`) dan bilah bawah
 * (`BottomNav`) supaya keduanya tidak pernah lepas sinkron.
 */
export const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, need: "admin" },
  { to: "/hari-ini", label: "Hari Ini", icon: CalendarDays },
  { to: "/minggu-ini", label: "Pekan Ini", icon: CalendarRange },
  { to: "/bulan", label: "Bulanan", icon: CalendarDays },
  { to: "/pilih-jadwal", label: "Pilih Jadwal", icon: HandHeart, parentsOnly: true },
  { to: "/pencarian", label: "Cari Menu", icon: Search },
  { to: "/menu", label: "Menu", icon: UtensilsCrossed },
  { to: "/kategori", label: "Kategori", icon: Tags, need: "catalog" },
  { to: "/jadwal", label: "Kelola Jadwal", icon: CalendarRange, need: "schedule" },
  { to: "/orang-tua", label: "Akun Orang Tua", icon: Users, need: "admin" },
];

/** Profil kapabilitas user, dipakai untuk menyaring `NAV_ITEMS`. */
export interface NavCapabilities {
  isAdmin: boolean;
  canManageSchedule: boolean;
  canManageCatalog: boolean;
}

/** Saring `NAV_ITEMS` sesuai hak akses user. */
export function visibleNavItems({
  isAdmin,
  canManageSchedule,
  canManageCatalog,
}: NavCapabilities): NavItem[] {
  return NAV_ITEMS.filter((item) => {
    if (item.parentsOnly && isAdmin) return false;
    if (!item.need) return true;
    if (item.need === "admin") return isAdmin;
    if (item.need === "schedule") return canManageSchedule;
    return canManageCatalog;
  });
}

/**
 * Empat tujuan yang tampil sebagai tab di bilah bawah (PWA terpasang).
 *
 * Dipilih yang paling sering dibuka peran mana pun: jadwal hari ini, pilih
 * tanggal piket, cari menu, lalu profil. Sisanya masuk ke panel tombol
 * tengah agar daftar tetap pendek dan tidak berdesakan.
 */
export const BOTTOM_TAB_ROUTES = [
  "/hari-ini",
  "/pilih-jadwal",
  "/pencarian",
  "/profil",
] as const;

/** Ikon & label untuk tab Profil di bilah bawah. */
export const PROFILE_NAV_ITEM: NavItem = {
  to: "/profil",
  label: "Profil",
  icon: UserCircle,
};
