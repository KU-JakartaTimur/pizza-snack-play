import { motion, useReducedMotion } from "framer-motion";
import logo from "@/assets/logo.png";
import { QUICK } from "@/lib/motion";
import { MasukLink } from "./MasukLink";

/**
 * Bilah atas halaman depan: identitas aplikasi di kiri, ajakan masuk di kanan.
 *
 * Terpisah dari `routes/index.tsx` supaya berkas rute itu hanya berisi hal yang
 * memang urusan rute — pengalihan sesi dan urutan bagian. Semua yang terlihat
 * di halaman depan tinggal di `components/landing/`, satu tempat.
 *
 * Bilahnya turun sedikit saat halaman dibuka. Geraknya pendek dan sekali saja:
 * bilah yang terus bergerak mengikuti guliran membuat mata ikut tertarik pada
 * sesuatu yang tidak membawa kabar apa pun.
 */
export function LandingHeader() {
  const reduced = useReducedMotion();

  return (
    <motion.header
      className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur"
      initial={reduced ? false : { opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: QUICK, ease: "easeOut" }}
    >
      <div className="brand-stripe brand-stripe-anim" />
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        {/*
          Bukan tautan: pengunjung sudah berada di halaman ini, dan tautan ke
          diri sendiri hanya menambah satu tujuan tanpa isi bagi pembaca layar.
        */}
        <div className="flex shrink-0 items-center gap-2.5">
          <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl shadow-sm">
            <img
              src={logo}
              alt="Pizza Snack Play"
              className="h-full w-full object-cover"
            />
          </span>
          <span className="hidden sm:block">
            <span className="block font-bold leading-tight text-slate-900">
              Pizza Snack Play
            </span>
            <span className="block text-xs text-slate-500">
              Pilih Jadwal Snack Anak Itu Menyenangkan!
            </span>
          </span>
        </div>

        <MasukLink size="sm" />
      </div>
    </motion.header>
  );
}
