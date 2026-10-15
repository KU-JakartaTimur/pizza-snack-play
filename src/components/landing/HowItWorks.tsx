import { Card } from "@/components/ui";
import { ListReveal, RevealItem } from "@/components/motion/ListReveal";
import { LANDING_STEPS } from "./content";
import { LandingSection, SectionHeading } from "./Section";

/**
 * Alur pemakaian, dari menyiapkan data sampai orang tua mengambil giliran.
 *
 * Ditulis berurutan karena urutannya memang mengikat: orang tua baru bisa
 * membaca jadwal **setelah** korlas menerbitkannya. Tanpa bagian ini, daftar
 * fitur di atas mudah disalahpahami sebagai kumpulan menu yang berdiri sendiri.
 */
export function HowItWorks() {
  return (
    <LandingSection id="alur">
      <SectionHeading
        eyebrow="Alur"
        title="Dari menyiapkan akun sampai giliran diambil"
        lead="Empat langkah yang berjalan setiap bulan, dengan pembagian tugas yang jelas di tiap langkahnya."
      />

      <ListReveal as="ol" className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {LANDING_STEPS.map(({ icon: Icon, title, description }, index) => (
          <RevealItem key={title} as="li" className="h-full">
            <Card className="h-full p-5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                  {index + 1}
                </span>
                <Icon className="h-4 w-4 text-brand-600" aria-hidden="true" />
              </div>
              <h3 className="mt-3 font-semibold text-slate-900">{title}</h3>
              <p className="mt-1.5 text-sm text-slate-600">{description}</p>
            </Card>
          </RevealItem>
        ))}
      </ListReveal>
    </LandingSection>
  );
}
