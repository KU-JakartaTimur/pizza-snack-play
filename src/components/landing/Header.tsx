import { useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import logo from "@/assets/logo.png";
import { QUICK } from "@/lib/motion";
import { MasukLink } from "./MasukLink";

const NAV = [
  { label: "Manfaat", href: "#manfaat" },
  { label: "Fitur", href: "#fitur" },
  { label: "Alur", href: "#alur" },
  { label: "Tanya jawab", href: "#tanya-jawab" },
];

/**
 * Bilah atas halaman depan: identitas aplikasi di kiri, menu tengah, ajakan
 * masuk di kanan.
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
  const [mobileOpen, setMobileOpen] = useState(false);

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

        <div className="flex items-center gap-2">
          <nav
            aria-label="Navigasi halaman depan"
            className="hidden items-center gap-1 md:flex"
          >
            {NAV.map(({ label, href }) => (
              <a
                key={href}
                href={href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                {label}
              </a>
            ))}
          </nav>

          <MasukLink size="sm" />

          <button
            type="button"
            aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            id="mobile-nav"
            aria-label="Navigasi halaman depan"
            initial={reduced ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduced ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden border-t border-slate-200 bg-white md:hidden"
          >
            <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
              {NAV.map(({ label, href }) => (
                <a
                  key={href}
                  href={href}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                  onClick={() => setMobileOpen(false)}
                >
                  {label}
                </a>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
