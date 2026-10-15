import { Card } from "@/components/ui";
import { ListReveal, RevealItem } from "@/components/motion/ListReveal";
import { LANDING_ROLES } from "./content";
import { LandingSection, SectionHeading } from "./Section";

/**
 * Daftar fitur, dikelompokkan menurut peran pemakainya.
 *
 * Dikelompokkan per peran — bukan satu daftar panjang — karena pengunjung
 * datang sebagai salah satu dari tiga orang: orang tua yang ingin melihat
 * jadwal, korlas yang menyusun jadwal kelasnya, dan admin yang menyiapkan
 * datanya. Satu daftar campur membuat masing-masing harus menyaring sendiri
 * mana yang berlaku baginya.
 */
export function Features() {
  return (
    <LandingSection id="fitur" tone="tint">
      <SectionHeading
        eyebrow="Fitur"
        title="Semua yang dibutuhkan, sesuai porsi masing-masing"
        lead="Hak aksesnya dibatasi di sisi server, bukan sekadar disembunyikan di tampilan — orang tua tidak bisa membuka halaman yang bukan miliknya."
      />

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {LANDING_ROLES.map(({ id, label, blurb, icon: RoleIcon, features }) => (
          <Card key={id} className="flex flex-col overflow-hidden">
            <div className="brand-stripe" />

            <div className="flex items-start gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
                <RoleIcon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h3 className="font-semibold text-slate-900">{label}</h3>
                <p className="mt-0.5 text-sm text-slate-500">{blurb}</p>
              </div>
            </div>

            <ListReveal as="ul" className="flex-1 divide-y divide-slate-100">
              {features.map(({ icon: Icon, title, description }) => (
                <RevealItem key={title} as="li" className="flex gap-3 px-5 py-3.5">
                  <Icon
                    className="mt-0.5 h-4 w-4 shrink-0 text-accent-600"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">{title}</p>
                    <p className="mt-0.5 text-sm text-slate-500">{description}</p>
                  </div>
                </RevealItem>
              ))}
            </ListReveal>
          </Card>
        ))}
      </div>
    </LandingSection>
  );
}
