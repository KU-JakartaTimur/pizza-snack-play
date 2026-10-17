import { Boxes, Code2 } from "lucide-react";
import { ListReveal } from "@/components/motion/ListReveal";
import { Card } from "@/components/ui";
import {
  LANDING_ABOUT,
  LANDING_ABOUT_MODULES,
  LANDING_ABOUT_NOTE,
  LANDING_ABOUT_POINTS,
  LANDING_ABOUT_STATS,
  LANDING_TECH,
} from "./content";
import { IconTile, RevealCard } from "./parts";
import { LandingSection, SectionHeading } from "./Section";

/**
 * Bagian "Tentang": siapa yang membangun, dengan apa, dan dengan biaya berapa.
 *
 * Ditaruh setelah tanya-jawab, bukan sebelum manfaat, karena isinya bukan janji
 * kepada orang tua melainkan keterangan di balik layar. Orang tua yang datang
 * untuk melihat menu tidak perlu melewatinya lebih dulu; yang ingin tahu — atau
 * kepala sekolah yang menimbang biaya — menemukannya di ujung halaman.
 *
 * Angka-angka di sini diambil dari repositori (route API, migrasi Drizzle,
 * berkas uji) dan sengaja ditulis apa adanya. Bagian yang mengaku
 * "gratis" harus bisa diperiksa: yang gratis adalah kuota Cloudflare, bukan
 * klaim tanpa dasar.
 */
export function About() {
  return (
    <LandingSection id="tentang">
      <SectionHeading
        eyebrow={LANDING_ABOUT.eyebrow}
        title={LANDING_ABOUT.title}
        lead={LANDING_ABOUT.lead}
      />

      <ListReveal className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {LANDING_ABOUT_POINTS.map(({ icon, title, description }) => (
          <RevealCard
            key={title}
            className="transition-transform duration-200 hover:-translate-y-0.5"
          >
            <IconTile icon={icon} />
            <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
            <p className="mt-1.5 text-sm text-slate-600">{description}</p>
          </RevealCard>
        ))}
      </ListReveal>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/*
          Dua kartu, bukan satu daftar panjang: yang kiri menjawab "dengan apa
          dibangun", yang kanan "sebesar apa isinya". Membacanya berpasangan,
          dan tiap kartu tetap pendek di layar HP.
        */}
        <Card className="overflow-hidden">
          <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-5 py-3">
            <Code2 className="h-4 w-4 text-brand-600" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-slate-900">
              Tumpukan teknologi
            </h3>
          </div>

          <dl className="divide-y divide-slate-100">
            {LANDING_TECH.map(({ layer, items }) => (
              <div
                key={layer}
                className="grid gap-0.5 px-5 py-3 sm:grid-cols-[7.5rem_1fr] sm:gap-4"
              >
                <dt className="label-muted">{layer}</dt>
                <dd className="text-sm text-slate-700">{items}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-5 py-3">
            <Boxes className="h-4 w-4 text-brand-600" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-slate-900">
              Isi aplikasinya
            </h3>
          </div>

          <div className="p-5">
            <dl className="grid grid-cols-2 gap-4">
              {LANDING_ABOUT_STATS.map(({ value, label }) => (
                <div key={label}>
                  <dt className="sr-only">{label}</dt>
                  <dd>
                    <span className="block text-2xl font-bold leading-none text-brand-700">
                      {value}
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      {label}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>

            <p className="label-muted mt-5">Modul API</p>
            <ul className="mt-2 grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
              {LANDING_ABOUT_MODULES.map(({ name, label }) => (
                <li key={name} className="flex items-baseline gap-1.5">
                  <span className="text-sm text-slate-700">{label}</span>
                  <span className="font-mono text-[10px] text-slate-400">
                    {name}
                  </span>
                </li>
              ))}
            </ul>

            <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
              {LANDING_ABOUT_NOTE}
            </p>
          </div>
        </Card>
      </div>
    </LandingSection>
  );
}
