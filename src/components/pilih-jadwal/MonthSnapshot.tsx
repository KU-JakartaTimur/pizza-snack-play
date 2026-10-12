import type { ReactNode } from "react";
import { CalendarCheck, CalendarOff, HandHeart, UserCheck } from "lucide-react";
import { Card } from "@/components/ui";
import { indonesianMonthName } from "@/lib/date";
import type { MonthSnapshotStats } from "./summary";

/** Warna ikon tiap kotak angka — memakai palet yang sama dengan Laporan. */
const TILE_TONES = {
  brand: "bg-brand-50 text-brand-600",
  accent: "bg-accent-50 text-accent-700",
  highlight: "bg-highlight-50 text-highlight-700",
  neutral: "bg-slate-100 text-slate-500",
} as const;

/**
 * Panel keterangan pengambilan snack satu bulan.
 *
 * Hanya untuk korlas & admin: angkanya menjawab "sudah berapa tanggal yang
 * terisi?" tanpa perlu membuka Laporan. Orang tua tidak melihat panel ini —
 * yang ia butuhkan cuma tanggal mana yang masih kosong, dan itu sudah
 * terjawab oleh penghitung di bilah atas.
 */
export function MonthSnapshot({
  stats,
  year,
  month,
  className,
  isPending,
}: {
  stats: MonthSnapshotStats;
  year: number;
  month: number;
  /** Kelas yang sedang dilihat; `null` bila user belum punya kelas. */
  className: string | null;
  isPending: boolean;
}) {
  const scope = className ? `Kelas ${className}` : "Semua kelas";

  return (
    <Card className="mb-6">
      <div className="px-5 py-4">
        <h2 className="text-sm font-semibold text-slate-900">
          Keterangan {indonesianMonthName(month)} {year}
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          {scope} · jumlah snack yang sudah diambil pada bulan ini
        </p>
      </div>

      {isPending ? (
        <p className="px-5 pb-4 text-sm text-slate-500">Memuat keterangan…</p>
      ) : (
        <div className="px-5 pb-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Tile
              icon={<HandHeart className="h-4 w-4" />}
              tone="brand"
              label="Sudah diambil"
              value={stats.taken}
            />
            <Tile
              icon={<UserCheck className="h-4 w-4" />}
              tone="accent"
              label="Ditetapkan korlas"
              value={stats.assigned}
            />
            <Tile
              icon={<CalendarOff className="h-4 w-4" />}
              tone="highlight"
              label="Masih kosong"
              value={stats.empty}
            />
            <Tile
              icon={<CalendarCheck className="h-4 w-4" />}
              tone="neutral"
              label="Total tanggal"
              value={stats.total}
            />
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                {stats.taken + stats.assigned} dari {stats.total} tanggal sudah
                ada petugas
              </span>
              <span className="font-medium text-slate-700">
                {stats.filledPercent}%
              </span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-brand-500 transition-all"
                style={{ width: `${stats.filledPercent}%` }}
              />
            </div>
            {stats.total === 0 && (
              <p className="mt-2 text-xs text-slate-400">
                Belum ada jadwal yang dipublikasi untuk bulan ini.
              </p>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

/** Satu kotak angka: ikon berwarna, label kecil, lalu nilai besar. */
function Tile({
  icon,
  tone,
  label,
  value,
}: {
  icon: ReactNode;
  tone: keyof typeof TILE_TONES;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 px-4 py-3">
      <div className="flex items-center gap-2">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-lg ${TILE_TONES[tone]}`}
        >
          {icon}
        </span>
        <span className="text-xs text-slate-500">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
