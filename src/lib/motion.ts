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

/**
 * Pandangan yang memicu animasi **sekali saja**.
 *
 * Dipakai bersama `whileInView`. `amount` sengaja dibiarkan pada bawaannya
 * ("some" — sebagian kecil saja terlihat): menuntut sebagian besar elemen
 * terlihat akan membuat daftar yang lebih tinggi daripada layar ponsel tidak
 * pernah terpicu, dan isinya tinggal tak terlihat.
 */
export const viewportOnce = { once: true } as const;

/** Satu bagian halaman depan: memudar masuk saat tergulir ke layar. */
export const sectionReveal: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.45, ease: "easeOut" } },
};

/**
 * Wadah hero: anak-anaknya masuk berurutan, lebih longgar daripada daftar.
 *
 * Jarak 0,07 detik terasa seperti satu kalimat yang dibaca, bukan kedipan.
 */
export const heroContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

/** Satu baris hero: naik sedikit sambil memudar masuk. */
export const heroItem: Variants = {
  hidden: { opacity: 0, y: 14 },
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

/**
 * Latar belakang dialog (`Modal`, `ConfirmDialog`, `SuccessDialog`).
 *
 * Keluar lebih cepat daripada masuk: begitu pengguna menutup dialog, tidak ada
 * yang perlu ditunggu — menahan latarnya hanya membuat tindakan terasa lambat.
 */
export const modalBackdrop: Variants = {
  hidden: { opacity: 0, transition: { duration: QUICK, ease: "easeIn" } },
  visible: { opacity: 1, transition: { duration: QUICK, ease: "easeOut" } },
};

/**
 * Kotak dialog: naik sedikit sambil memudar masuk.
 *
 * Sengaja **tidak** memakai `scale` dari 0 — kartu yang menyusut dari titik
 * kosong terasa seperti efek, bukan dialog yang menghampiri pengguna. Jarak
 * angkatnya kecil (12px) supaya di layar ponsel tidak terlihat melompat.
 *
 * `exit` ditulis eksplisit agar durasinya sama dengan masuk; tanpa itu
 * framer-motion membalik varian `visible`, termasuk pegasnya, dan dialog
 * memantul saat ditutup.
 */
export const modalPanel: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: SPRING },
  exit: {
    opacity: 0,
    y: 8,
    scale: 0.98,
    transition: { duration: QUICK, ease: "easeIn" },
  },
};

/** Isi dialog yang menyusul panelnya — mis. baris tombol di kaki dialog. */
export const modalContent: Variants = {
  hidden: { opacity: 0, y: -4 },
  visible: { opacity: 1, y: 0, transition: { duration: QUICK, ease: "easeOut" } },
};
