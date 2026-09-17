import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Database,
  Loader2,
  UtensilsCrossed,
  Users,
} from "lucide-react";
import { http } from "@/lib/http";

export const Route = createFileRoute("/")({
  component: Index,
});

type HealthResponse = {
  message: string;
  data: {
    app: string;
    db: string;
    timestamp: string;
  };
};

const FEATURES = [
  {
    icon: UtensilsCrossed,
    title: "Manajemen Menu",
    desc: "Admin mengelola menu snack — makanan utama + buah pendamping — dengan katalog yang dapat dipakai ulang.",
  },
  {
    icon: CalendarDays,
    title: "Jadwal Snack",
    desc: "Atur jadwal harian, mingguan, dan bulanan. Duplikasi jadwal antar minggu, tandai hari libur.",
  },
  {
    icon: Users,
    title: "Akun Orang Tua",
    desc: "Setiap orang tua login dengan akun pribadi untuk melihat jadwal. Admin mengelola akun tersebut.",
  },
];

const TABLES = [
  "categories",
  "menus",
  "menu_items",
  "menu_categories",
  "weeks",
  "schedules",
  "holidays",
  "users",
  "parents",
  "settings",
  "import_logs",
];

function Index() {
  const [health, setHealth] = useState<HealthResponse["data"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = () => {
    setLoading(true);
    setError(null);
    http
      .get("health")
      .json<HealthResponse>()
      .then((res) => setHealth(res.data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  };

  return (
    <div className="min-h-screen selection:bg-emerald-500/30">
      <main className="max-w-5xl mx-auto px-6 pt-24 pb-20">
        <header className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-sm font-medium mb-6">
            <CheckCircle2 className="w-4 h-4" />
            Bun · Hono · Vite · React · Cloudflare D1
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Pizza <span className="gradient-text">Snack Play</span>
          </h1>
          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Aplikasi manajemen dan informasi jadwal piket snack sekolah.
            Orang tua login untuk melihat jadwal menu harian, mingguan, dan
            bulanan.
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="glass p-6 rounded-2xl flex flex-col gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <Icon className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="text-zinc-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </section>

        <section className="glass p-6 rounded-2xl mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
              <Database className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Status Backend</h2>
              <p className="text-zinc-500 text-sm">
                Verifikasi koneksi Worker dan binding D1.
              </p>
            </div>
          </div>

          <button
            onClick={checkHealth}
            disabled={loading}
            className="bg-emerald-500 text-black px-6 py-3 rounded-lg font-bold hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Memeriksa..." : "Cek Koneksi"}
          </button>

          {error && (
            <div className="mt-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-mono break-all">
              {error}
            </div>
          )}

          {health && (
            <dl className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                ["Aplikasi", health.app],
                ["Database", health.db],
                ["Waktu", new Date(health.timestamp).toLocaleString("id-ID")],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="p-4 rounded-lg bg-black/40 border border-emerald-500/20"
                >
                  <dt className="text-zinc-500 text-xs uppercase tracking-wide mb-1">
                    {label}
                  </dt>
                  <dd className="text-emerald-400 font-mono text-sm break-all">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </section>

        <section className="glass p-6 rounded-2xl">
          <h2 className="text-lg font-semibold mb-2">
            Skema Database — {TABLES.length} tabel
          </h2>
          <p className="text-zinc-500 text-sm mb-6">
            Didefinisikan di{" "}
            <code className="font-mono text-cyan-400">
              src/database/schema.ts
            </code>{" "}
            dan dimigrasikan ke Cloudflare D1.
          </p>
          <div className="flex flex-wrap gap-2">
            {TABLES.map((name) => (
              <span
                key={name}
                className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-zinc-300 font-mono text-xs"
              >
                {name}
              </span>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
