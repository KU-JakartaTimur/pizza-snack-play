/**
 * Kosakata animasi bersama.
 *
 * Semua durasi, pegas, dan varian kumpul di sini supaya gerak di seluruh
 * aplikasi terasa satu bahasa — bukan kumpulan angka yang berbeda-beda di
 * tiap komponen.
 */

import type { Transition, Variants } from "framer-motion";

/**
 * Pegas untuk elemen yang muncul — cukup kencang agar tidak terasa lembek
 * saat dipakai pada daftar panjang.
 */
export const SPRING: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 34,
  mass: 0.7,
};

/** Durasi singkat untuk perubahan kecil: warna, ukuran, opacity. */
export const QUICK = 0.18;

/**
 * Wadah daftar: anak-anaknya muncul berurutan.
 *
 * Dipakai pada grid kartu jadwal dan daftar baris — dengan jeda antar anak
 * yang kecil, sehingga daftar terasa "tumbuh" alih-alih berkedip sekaligus.
 */
export const listContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.035, delayChildren: 0.02 } },
};

/** Satu butir daftar: naik sedikit sambil memudar masuk. */
export const listItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: SPRING },
};

/** Elemen tunggal yang muncul tanpa perlu dijadwalkan berurutan. */
export const fadeIn: Variants = {
  hidden: { opacity: 0, y: -6 },
  visible: { opacity: 1, y: 0, transition: { duration: QUICK, ease: "easeOut" } },
};

/** Panel yang turun dari tepi layar, mis. panel "Semua Menu". */
export const slideUp: Variants = {
  hidden: { y: "100%" },
  visible: { y: 0, transition: { type: "spring", stiffness: 380, damping: 38 } },
};

/** Latar gelap di belakang panel. */
export const backdrop: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: QUICK } },
};
