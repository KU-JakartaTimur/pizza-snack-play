import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { listContainer, listItem, viewportOnce } from "@/lib/motion";

/**
 * Wadah daftar yang menampilkan anak-anaknya satu per satu.
 *
 * Nilai bawaan `as="div"` cocok untuk grid kartu; pakai `as="ul"` bila
 * anaknya `<li>` supaya struktur daftarnya tetap benar.
 *
 * Urutannya berjalan saat daftarnya **sampai ke layar**, bukan saat halaman
 * dibuka: daftar yang berada jauh di bawah sudah selesai beranimasi sebelum
 * pengguna sempat melihatnya, sehingga geraknya tidak pernah terpakai. Karena
 * itu `whileInView`, dan hanya sekali (`once`).
 *
 * Saat pengguna meminta gerak dikurangi (`prefers-reduced-motion`), animasinya
 * dimatikan seluruhnya — bukan sekadar dipercepat.
 */
export function ListReveal({
  children,
  className,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "ul" | "ol";
}) {
  const reduced = useReducedMotion();
  const Tag = motion[as];

  return (
    <Tag
      className={cn(className)}
      variants={listContainer}
      initial={reduced ? false : "hidden"}
      whileInView="visible"
      viewport={viewportOnce}
    >
      {children}
    </Tag>
  );
}

/**
 * Satu butir di dalam `ListReveal`.
 *
 * Hanya berguna bila induknya benar-benar `ListReveal` (variannya diwarisi);
 * di luar itu ia sekadar elemen biasa yang tampil apa adanya.
 */
export function RevealItem({
  children,
  className,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "li";
}) {
  const Tag = motion[as];

  return (
    <Tag className={cn(className)} variants={listItem}>
      {children}
    </Tag>
  );
}
