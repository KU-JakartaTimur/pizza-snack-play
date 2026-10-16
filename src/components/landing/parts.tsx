import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { RevealItem } from "@/components/motion/ListReveal";
import { Card } from "@/components/ui";
import { cn } from "@/lib/cn";

/**
 * Bagian kecil halaman depan yang dipakai lebih dari satu seksi.
 *
 * Ketiganya (manfaat, fitur per peran, alur) menampilkan bentuk yang sama:
 * ikon di dalam kotak, judul, penjelasan. Bentuk itu ditulis sekali di sini
 * supaya ukuran kotak, warnanya, dan jarak di dalam kartunya tidak perlahan
 * berbeda antar bagian saat salah satunya disunting.
 */

const ICON_TONES = {
  /** Kotak ungu muda — ikon yang berdiri sendiri di dalam kartu putih. */
  soft: "bg-brand-50 text-brand-700",
  /** Kotak ungu tua — ikon yang menandai kepala kartu. */
  solid: "bg-brand-600 text-white",
} as const;

/**
 * Ikon di dalam kotak bersudut.
 *
 * Ukuran ikonnya tetap (`h-5 w-5`) meski kotaknya mengecil; yang berubah hanya
 * ruang di sekelilingnya. Mengubah keduanya sekaligus membuat ikon di kartu
 * kepala terlihat lebih kecil daripada di kartu biasa.
 */
export function IconTile({
  icon: Icon,
  tone = "soft",
  size = "md",
  className,
}: {
  icon: LucideIcon;
  tone?: keyof typeof ICON_TONES;
  size?: "md" | "sm";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg",
        size === "md" ? "h-10 w-10" : "h-9 w-9",
        ICON_TONES[tone],
        className,
      )}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </span>
  );
}

/**
 * Kartu yang ikut muncul berurutan di dalam `ListReveal`.
 *
 * `h-full` dipasang di dua tingkat sekaligus — pembungkus gerak dan kartunya —
 * karena keduanya ikut menentukan tinggi baris grid; tanpa itu kartu yang
 * isinya lebih pendek tidak ikut memanjang dan barisnya terlihat patah.
 */
export function RevealCard({
  children,
  as = "div",
  className,
}: {
  children: ReactNode;
  as?: "div" | "li";
  className?: string;
}) {
  return (
    <RevealItem as={as} className="h-full">
      <Card className={cn("h-full p-5", className)}>{children}</Card>
    </RevealItem>
  );
}
