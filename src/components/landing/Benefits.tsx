import { ListReveal } from "@/components/motion/ListReveal";
import { LANDING_BENEFITS } from "./content";
import { IconTile, RevealCard } from "./parts";
import { LandingSection, SectionHeading } from "./Section";

/**
 * Bagian "manfaat" — alasan memakai aplikasi ini, bukan daftar tombolnya.
 *
 * Ditaruh sebelum daftar fitur dengan sengaja: orang tua yang belum punya akun
 * lebih dulu bertanya "apa untungnya bagi saya", baru "di mana tombolnya".
 */
export function Benefits() {
  return (
    <LandingSection id="manfaat">
      <SectionHeading
        eyebrow="Manfaat"
        title="Yang berubah setelah jadwalnya pindah ke aplikasi"
        lead="Hal-hal yang paling sering dikeluhkan dari jadwal berbentuk dokumen — dan bagaimana aplikasi ini menjawabnya."
      />

      <ListReveal className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LANDING_BENEFITS.map(({ icon, title, description }) => (
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
    </LandingSection>
  );
}
