import { ChevronDown } from "lucide-react";
import { LANDING_FAQ } from "./content";
import { LandingSection, SectionHeading } from "./Section";

/**
 * Tanya-jawab singkat sebelum ajakan masuk.
 *
 * Memakai `<details>` bawaan peramban, bukan akordeon buatan sendiri: perilaku
 * buka-tutupnya sudah benar tanpa JavaScript, bisa dicari peramban, dan tetap
 * bekerja bila skripnya gagal dimuat. Pertanyaannya pun sengaja berupa
 * pertanyaan yang benar-benar menghalangi orang untuk memakai aplikasi —
 * soal akun, menu, dan tanggal yang sudah diambil orang lain.
 */
export function Faq() {
  return (
    <LandingSection id="tanya-jawab" tone="tint">
      <SectionHeading
        eyebrow="Tanya jawab"
        title="Pertanyaan yang paling sering muncul"
        lead="Bila jawabannya belum ada di sini, hubungi admin atau korlas kelas."
      />

      <div className="mt-8 max-w-3xl space-y-3">
        {LANDING_FAQ.map(({ question, answer }) => (
          <details key={question} className="card group overflow-hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-medium text-slate-900 hover:text-brand-700 [&::-webkit-details-marker]:hidden">
              {question}
              <ChevronDown
                className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <p className="border-t border-slate-200 px-5 py-4 text-sm text-slate-600">
              {answer}
            </p>
          </details>
        ))}
      </div>
    </LandingSection>
  );
}
