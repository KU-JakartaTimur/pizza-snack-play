import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { QUICK } from "@/lib/motion";

/**
 * Bungkus isi yang muncul setelah data siap — mis. banner hasil tindakan.
 *
 * Tidak dipakai untuk daftar; daftar memakai `ListReveal` agar anak-anaknya
 * masuk berurutan.
 */
export function FadeIn({
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
      initial={reduced ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: QUICK, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
