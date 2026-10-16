import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/cn";

/**
 * Satu bagian halaman depan, dengan lebar dan jarak yang seragam.
 *
 * Halaman ini panjang — enam bagian berturut-turut. Jarak dan lebarnya diatur
 * di satu tempat saja; kalau tiap seksi menulis `py`-nya sendiri, ritmenya
 * pelan-pelan berbeda dan halaman terasa tambal-sulam.
 *
 * `tone` hanya membedakan latar putih dan latar kanvas, dipakai bergantian
 * supaya batas antar bagian terbaca tanpa perlu garis pemisah yang ramai.
 *
 * Animasi masuk bagian juga dipasang di sini, bukan di tiap seksi — satu
 * tempat, satu durasi. Lihat `Reveal`.
 */
export function LandingSection({
  id,
  tone = "plain",
  className,
  children,
}: {
  /** Jangkar untuk tautan lompat, mis. `#fitur`. */
  id?: string;
  tone?: "plain" | "tint";
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      // Header menempel di atas layar, jadi jangkar perlu ruang agar judulnya
      // tidak tertutup saat halaman melompat.
      className={cn(
        "scroll-mt-24 border-t border-slate-200",
        tone === "tint" && "bg-white",
        className,
      )}
    >
      <Reveal className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        {children}
      </Reveal>
    </section>
  );
}

/**
 * Judul bagian: garis aksen, label kecil, judul, dan kalimat pengantar.
 *
 * Susunannya meniru `PageHeader` di dalam aplikasi supaya halaman depan dan
 * halaman sesudah masuk terasa satu keluarga.
 */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  className,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", className)}>
      <span className="mb-3 block h-1 w-10 rounded-full bg-linear-to-r from-brand-600 via-accent-500 to-highlight-400" />
      {eyebrow && <p className="label-muted">{eyebrow}</p>}
      <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        {title}
      </h2>
      {lead && <p className="mt-3 text-slate-600">{lead}</p>}
    </div>
  );
}
