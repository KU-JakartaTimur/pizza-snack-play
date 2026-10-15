import { Card } from "@/components/ui";
import { ListReveal, RevealItem } from "@/components/motion/ListReveal";
import { LANDING_BENEFITS } from "./content";
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
        {LANDING_BENEFITS.map(({ icon: Icon, title, description }) => (
          <RevealItem key={title} className="h-full">
            <Card className="h-full p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
              <p className="mt-1.5 text-sm text-slate-600">{description}</p>
            </Card>
          </RevealItem>
        ))}
      </ListReveal>
    </LandingSection>
  );
}
