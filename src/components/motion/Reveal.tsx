import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { sectionReveal, viewportOnce } from "@/lib/motion";

/**
 * Isi yang memudar masuk saat tergulir sampai ke layar.
 *
 * Dipakai **sekali** di `LandingSection`, bukan di tiap bagian: kalau setiap
 * bagian mengatur geraknya sendiri, cepat atau lambat durasinya berbeda-beda
 * dan halaman terasa tambal-sulam. Gerak anak-anaknya di dalam (mis. daftar
 * kartu) tetap diurus `ListReveal`.
 *
 * Hanya opasitas yang dianimasikan — tanpa geser. Bagian sepanjang satu layar
 * yang ikut bergeser membuat teks di dalamnya sulit dibaca tepat saat muncul.
 */
export function Reveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={sectionReveal}
      initial={reduced ? false : "hidden"}
      whileInView="visible"
      viewport={viewportOnce}
    >
      {children}
    </motion.div>
  );
}
