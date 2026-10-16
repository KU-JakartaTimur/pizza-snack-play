import { motion, useReducedMotion } from "framer-motion";
import { User, UtensilsCrossed } from "lucide-react";
import { Badge } from "@/components/ui";
import { heroContainer, heroItem } from "@/lib/motion";
import { LANDING_FACTS, LANDING_HERO, LANDING_PREVIEW } from "./content";
import { CrescentStar, StarMotif } from "./IslamicArt";
import { MasukLink } from "./MasukLink";

/**
 * Bagian pembuka: janji aplikasinya di sebelah kiri, gambaran tampilannya di
 * sebelah kanan.
 *
 * Kartu di sebelah kanan **bukan data sungguhan** — hanya contoh bentuk
 * halaman "Hari Ini" bagi pengunjung yang belum punya akun. Isinya sengaja
 * memakai menu, komponen, dan nama petugas yang benar-benar ada di katalog
 * sekolah (dijaga `content.test.ts`), supaya contohnya tidak menjanjikan
 * sesuatu yang tidak pernah muncul di aplikasi.
 *
 * Baris-barisnya masuk berurutan seperti kalimat yang dibaca, bukan sekaligus
 * — itulah sebabnya tiap baris dibungkus `motion` dengan varian `heroItem`,
 * sementara urutannya diatur `heroContainer` di induknya.
 *
 * Hiasan bulan sabit dan bintang diletakkan di **ruang kosong** di luar kolom
 * isi (`lg:` ke atas, tempat tepi halaman menyisakan ruang). Di layar sempit
 * keduanya disembunyikan: menaruhnya di belakang teks membuat judul besarnya
 * sulit dibaca, dan judul itulah yang harus paling jelas di halaman ini.
 */
export function Hero() {
  const reduced = useReducedMotion();

  return (
    <section className="brand-canvas relative isolate overflow-hidden border-b border-slate-200">
      <CrescentStar className="pointer-events-none absolute right-6 top-2 hidden h-16 w-16 text-highlight-500/35 lg:block" />
      <StarMotif className="pointer-events-none absolute bottom-3 left-8 hidden h-16 w-16 text-accent-600/25 lg:block" />

      <motion.div
        className="relative z-10 mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-center lg:gap-14"
        variants={heroContainer}
        initial={reduced ? false : "hidden"}
        animate="visible"
      >
        <div>
          <motion.p variants={heroItem} className="label-muted">
            {LANDING_HERO.eyebrow}
          </motion.p>

          <motion.h1
            variants={heroItem}
            className="brand-text-gradient-strong mt-2 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
          >
            {LANDING_HERO.title}
          </motion.h1>

          <motion.p
            variants={heroItem}
            className="mt-4 max-w-xl text-slate-600 sm:text-lg"
          >
            {LANDING_HERO.lead}
          </motion.p>

          <motion.div
            variants={heroItem}
            className="mt-7 flex flex-wrap items-center gap-4"
          >
            <MasukLink />
            <p className="text-xs text-slate-500">{LANDING_HERO.note}</p>
          </motion.div>

          <motion.ul
            variants={heroItem}
            className="mt-8 flex flex-wrap gap-2 border-t border-slate-200 pt-6"
          >
            {LANDING_FACTS.map((fact) => (
              <li key={fact}>
                <Badge tone="neutral">{fact}</Badge>
              </li>
            ))}
          </motion.ul>
        </div>

        <HeroPreview />
      </motion.div>
    </section>
  );
}

/** Kartu contoh halaman "Hari Ini", disusun seperti kartu aslinya. */
function HeroPreview() {
  const { dayLabel, dateLabel, menuName, components, petugas, caption } =
    LANDING_PREVIEW;

  return (
    <motion.figure
      variants={heroItem}
      className="w-full max-w-sm justify-self-start lg:justify-self-end"
    >
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-highlight-200 bg-highlight-50 px-4 py-3">
          <p className="font-semibold text-slate-900">
            {dayLabel}, {dateLabel}
          </p>
          <Badge tone="highlight">Hari ini</Badge>
        </div>

        <div className="px-4 py-4">
          <div className="flex items-start gap-3">
            <UtensilsCrossed
              className="mt-0.5 h-4 w-4 shrink-0 text-brand-600"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="font-medium text-slate-900">{menuName}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {components.map((component) => (
                  <Badge key={component.name} tone="success">
                    {component.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-slate-200 pt-3">
            <p className="label-muted">Petugas piket</p>
            <ul className="mt-2 space-y-1.5">
              {petugas.map((item) => (
                <li
                  key={item.className}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="text-slate-500">{item.className}</span>
                  <span className="flex items-center gap-1.5 font-medium text-slate-900">
                    <User className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                    {item.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <figcaption className="mt-2 text-center text-xs text-slate-400">
        {caption}
      </figcaption>
    </motion.figure>
  );
}
