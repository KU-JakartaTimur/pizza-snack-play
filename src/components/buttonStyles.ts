/**
 * Bentuk visual tombol, dipisah dari komponennya.
 *
 * Dua alasan file ini berdiri sendiri:
 *
 * 1. **Tautan yang tampak seperti tombol.** Ajakan "Masuk" di halaman depan
 *    secara semantik adalah tautan, tetapi harus terlihat sama dengan tombol
 *    di dalam aplikasi. Tanpa sumber bersama ini, kelasnya harus disalin.
 * 2. **Aturan fast refresh.** `ui.tsx` hanya boleh mengekspor komponen; satu
 *    fungsi biasa di sana mematikan hot reload untuk seluruh modulnya.
 *
 * Warnanya sengaja hanya di sini — **jangan** menimpa `bg-*`/`text-*` lewat
 * `className` pemanggil: `cn` tidak melakukan dedupe, jadi dua utility yang
 * bertabrakan ditentukan urutan di stylesheet, bukan urutan penulisan. Tambah
 * varian baru bila butuh warna lain.
 */

import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "inverse";
export type ButtonSize = "sm" | "md";

export const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 focus-visible:outline-brand-600 shadow-sm",
  secondary:
    "bg-white text-slate-700 border border-slate-300 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-brand-400",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-brand-700 focus-visible:outline-brand-400",
  danger:
    "bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600",
  /** Tombol di atas permukaan gelap — mis. ajakan masuk di ujung halaman depan. */
  inverse:
    "bg-white text-brand-700 hover:bg-brand-50 focus-visible:outline-white shadow-sm",
};

export const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm gap-1.5",
  md: "px-4 py-2.5 text-sm gap-2",
};

/** Kelas lengkap sebuah tombol pada varian & ukuran tertentu. */
export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  className?: string,
) {
  return cn(
    "inline-flex items-center justify-center rounded-lg font-semibold transition-colors",
    "focus-visible:outline-2 focus-visible:outline-offset-2",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    BUTTON_VARIANTS[variant],
    BUTTON_SIZES[size],
    className,
  );
}
