import { Reveal } from "@/components/motion/Reveal";
import { LANDING_ART } from "./content";
import {
  CrescentStar,
  HijabGirl,
  Lantern,
  MosqueSilhouette,
  PeciBoy,
  StarMotif,
} from "./IslamicArt";

/**
 * Jeda di tengah halaman depan: dua anak berkerudung dan berpeci, ditemani
 * ornamen masjid, bulan sabit, dan lentera.
 *
 * Ditaruh di antara "alur" dan "tanya jawab" karena di situlah halaman mulai
 * terasa seperti daftar — daftar manfaat, daftar fitur, daftar langkah. Bagian
 * ini bukan penjelasan baru, hanya napas sebelum tanya-jawab, jadi isinya
 * tidak menambah janji apa pun kepada orang tua.
 *
 * Hiasannya **tidak ikut terbaca pembaca layar** (`aria-hidden` di tiap
 * gambarnya); yang terbaca hanya kalimat di tengahnya.
 *
 * Hiasan latarnya sengaja diletakkan `-z-0`/`z-10` di dalam `isolate`, bukan
 * `-z-10`: tanpa `isolate`, lapisan negatif akan jatuh ke belakang latar
 * bagiannya sendiri dan hilang sama sekali.
 */
export function IslamicBand() {
  return (
    <section className="brand-canvas relative isolate overflow-hidden border-t border-slate-200">
      <MosqueSilhouette className="pointer-events-none absolute -bottom-1 left-1/2 h-32 w-[26rem] -translate-x-1/2 text-brand-600/15" />
      <StarMotif className="pointer-events-none absolute left-8 top-8 hidden h-14 w-14 text-accent-600/25 sm:block" />
      <StarMotif className="pointer-events-none absolute bottom-8 right-10 hidden h-10 w-10 text-highlight-600/30 sm:block" />
      <Lantern className="pointer-events-none absolute -top-1 left-4 hidden h-24 w-12 text-highlight-500/70 sm:block" />
      <Lantern className="pointer-events-none absolute -top-1 right-4 hidden h-20 w-10 text-brand-500/60 sm:block" />
      <CrescentStar className="pointer-events-none absolute right-10 top-6 hidden h-12 w-12 text-highlight-500/60 sm:right-24 sm:block" />

      <Reveal className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-4 py-14 sm:px-6 sm:py-16">
        <div className="flex w-full items-center justify-center gap-4 sm:gap-10">
          <HijabGirl className="h-28 w-20 shrink-0 sm:h-36 sm:w-26" />

          <div className="max-w-md text-center">
            <p className="label-muted">{LANDING_ART.eyebrow}</p>
            <p className="mt-2 text-lg font-semibold text-slate-900 sm:text-xl">
              {LANDING_ART.title}
            </p>
            <p className="mt-2 text-sm text-slate-600">{LANDING_ART.lead}</p>
          </div>

          <PeciBoy className="h-28 w-20 shrink-0 sm:h-36 sm:w-26" />
        </div>
      </Reveal>
    </section>
  );
}
