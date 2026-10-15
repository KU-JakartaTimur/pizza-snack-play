import { LANDING_CLOSING } from "./content";
import { MasukLink } from "./MasukLink";

/**
 * Ajakan terakhir di ujung halaman.
 *
 * Sengaja diulang dari hero: pengunjung yang membaca sampai bawah biasanya baru
 * memutuskan di sini, dan menaikkan halaman hanya untuk menemukan tombolnya
 * kembali adalah kerja yang tidak perlu.
 */
export function Closing() {
  return (
    <section className="border-t border-brand-700 bg-brand-600">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-5 px-4 py-14 sm:px-6 sm:py-16">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {LANDING_CLOSING.title}
          </h2>
          <p className="mt-2 max-w-xl text-brand-100">{LANDING_CLOSING.lead}</p>
        </div>
        <MasukLink variant="inverse" />
      </div>
    </section>
  );
}
