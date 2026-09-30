import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  BarChart3,
  CalendarCheck,
  ChevronDown,
  ClipboardList,
  UserRoundCheck,
} from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { RoleGate } from "@/components/AdminOnly";
import { ListReveal, RevealItem } from "@/components/motion/ListReveal";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Field,
  Input,
  Select,
  Spinner,
} from "@/components/ui";
import { useClasses } from "@/hooks/useClasses";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  addDays,
  formatShortDate,
  monthRange,
  todayInWib,
} from "@/lib/date";
import type { LaporanOrangTuaDto } from "@/types/laporan";

export const Route = createFileRoute("/_app/laporan")({
  component: LaporanPage,
});

/** Filter yang sudah dikirim ke server — dipisah agar query tidak ikut berubah saat mengetik. */
interface LaporanFilter {
  from: string;
  to: string;
  className: string | null;
}

/** Rentang cepat, dihitung mundur dari hari ini — sama seperti halaman Cari Menu. */
const QUICK_RANGES = [
  { label: "Bulan ini", days: 30 },
  { label: "3 bulan", days: 90 },
  { label: "6 bulan", days: 180 },
  { label: "1 tahun", days: 365 },
] as const;

function LaporanPage() {
  return (
    <>
      <PageHeader
        title="Laporan Jadwal"
        description="Rekap berapa kali setiap orang tua sudah mengambil jadwal piket snack."
      />
      <RoleGate need="schedule">
        <LaporanContent />
      </RoleGate>
    </>
  );
}

function LaporanContent() {
  const today = todayInWib();
  const { classes } = useClasses();
  const { isAdmin, korlasClass } = useAuth();

  // Korlas terkunci ke kelasnya sendiri; admin bebas memilih (termasuk semua kelas).
  const [dari, setDari] = useState(() => {
    const { from } = monthRange(new Date().getFullYear(), new Date().getMonth() + 1);
    return from;
  });
  const [sampai, setSampai] = useState(today);
  const [classChoice, setClassChoice] = useState<string>(
    () => korlasClass ?? "",
  );
  const [filter, setFilter] = useState<LaporanFilter | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const reportQuery = useQuery({
    queryKey: ["laporan", filter?.from, filter?.to, filter?.className],
    queryFn: () =>
      api.laporan.list({
        from: filter!.from,
        to: filter!.to,
        className: filter!.className,
      }),
    enabled: filter !== null,
  });

  const applyQuickRange = (days: number) => {
    setDari(addDays(today, -days));
    setSampai(today);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (dari > sampai) {
      setFormError("Tanggal awal tidak boleh melebihi tanggal akhir");
      return;
    }
    setFormError(null);
    setFilter({
      from: dari,
      to: sampai,
      // Korlas tidak boleh menyentuh kelas lain; kelasnya dipaksa di sini juga.
      className: isAdmin ? classChoice || null : (korlasClass ?? null),
    });
  };

  const data = reportQuery.data;

  return (
    <>
      <Card className="mb-6">
        <CardHeader
          title="Filter laporan"
          description="Pilih rentang tanggal dan kelas, lalu tekan Tampilkan."
        />

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Dari tanggal">
              <Input
                type="date"
                value={dari}
                max={sampai}
                onChange={(event) => setDari(event.target.value)}
              />
            </Field>
            <Field label="Sampai tanggal" error={formError ?? undefined}>
              <Input
                type="date"
                value={sampai}
                min={dari}
                onChange={(event) => setSampai(event.target.value)}
              />
            </Field>
            <Field
              label="Kelas"
              hint={isAdmin ? undefined : "Korlas hanya melihat kelasnya sendiri"}
            >
              {isAdmin ? (
                <Select
                  value={classChoice}
                  onChange={(event) => setClassChoice(event.target.value)}
                >
                  <option value="">Semua kelas</option>
                  {classes.map((className) => (
                    <option key={className} value={className}>
                      Kelas {className}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input
                  value={korlasClass ? `Kelas ${korlasClass}` : "Semua kelas"}
                  readOnly
                  disabled
                />
              )}
            </Field>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500">Rentang cepat:</span>
            {QUICK_RANGES.map((range) => (
              <Button
                key={range.label}
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => applyQuickRange(range.days)}
              >
                {range.label}
              </Button>
            ))}
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={reportQuery.isFetching}>
              <BarChart3 className="h-4 w-4" />
              Tampilkan
            </Button>
          </div>
        </form>
      </Card>

      {filter === null && (
        <Card>
          <EmptyState
            icon={<ClipboardList className="h-8 w-8" />}
            title="Belum ada laporan"
            description="Pilih rentang tanggal di atas, lalu tekan Tampilkan untuk melihat rekap."
          />
        </Card>
      )}

      {reportQuery.isPending && filter !== null && <Spinner label="Menyusun laporan…" />}

      {reportQuery.isError && (
        <Card>
          <p className="px-5 py-6 text-sm text-red-600">
            {reportQuery.error.message}
          </p>
        </Card>
      )}

      {data && <LaporanHasil data={data} />}
    </>
  );
}

function LaporanHasil({
  data,
}: {
  data: Awaited<ReturnType<typeof api.laporan.list>>;
}) {
  const { ringkasan, orangTua, from, to, className } = data;
  const scopeLabel = className ? `Kelas ${className}` : "Semua kelas";

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<CalendarCheck className="h-5 w-5" />}
          tone="brand"
          label="Total ambil"
          value={ringkasan.totalAmbil}
          hint={`${ringkasan.tanggalTerisi} tanggal terisi`}
        />
        <StatCard
          icon={<UserRoundCheck className="h-5 w-5" />}
          tone="accent"
          label="Orang tua aktif"
          value={ringkasan.orangTuaAktif}
          hint={`rata-rata ${ringkasan.rataRataAmbil}×`}
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5" />}
          tone="highlight"
          label="Belum pernah ambil"
          value={ringkasan.orangTuaKosong}
          hint="perlu diingatkan"
        />
        <StatCard
          icon={<ClipboardList className="h-5 w-5" />}
          tone="neutral"
          label="Periode"
          value={0}
          isText
          text={`${formatShortDate(from)} – ${formatShortDate(to)}`}
          hint={scopeLabel}
        />
      </div>

      {ringkasan.belumAmbil.length > 0 && (
        <Card>
          <CardHeader
            title="Belum pernah mengambil"
            description="Orang tua yang punya anak di kelas ini tetapi belum mengambil satu tanggal pun pada periode di atas."
          />
          <ul className="divide-y divide-slate-100">
            {ringkasan.belumAmbil.map((parent) => (
              <li
                key={parent.parentId}
                className="flex flex-wrap items-center justify-between gap-2 px-5 py-3"
              >
                <span className="font-medium text-slate-800">
                  {parent.parentName}
                </span>
                <span className="text-xs text-slate-500">
                  {parent.studentNames.join(", ")}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <CardHeader
          title="Rekap per orang tua"
          description={`${orangTua.length} orang tua sudah mengambil jadwal pada ${scopeLabel.toLowerCase()}, periode ${formatShortDate(from)} – ${formatShortDate(to)}.`}
        />

        {orangTua.length === 0 ? (
          <EmptyState
            icon={<BarChart3 className="h-8 w-8" />}
            title="Belum ada yang mengambil"
            description="Tidak ada orang tua yang mengambil jadwal pada rentang dan kelas ini."
          />
        ) : (
          <ListReveal className="divide-y divide-slate-100">
            {orangTua.map((entry) => (
              <RevealItem key={entry.parentId}>
                <ParentRow entry={entry} />
              </RevealItem>
            ))}
          </ListReveal>
        )}
      </Card>
    </div>
  );
}

/** Satu baris orang tua, dapat dibuka untuk melihat tanggal-tanggalnya. */
function ParentRow({ entry }: { entry: LaporanOrangTuaDto }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="px-5 py-3.5">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900">
            {entry.parentName}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {entry.classNames.map((name) => `Kelas ${name}`).join(" · ")}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Badge tone={entry.jumlahAmbil > 0 ? "brand" : "neutral"}>
            {entry.jumlahAmbil}× ambil
          </Badge>
          <ChevronDown
            className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {open && (
        <ul className="mt-3 space-y-1.5 border-l-2 border-brand-100 pl-3">
          {entry.tanggal.map((tanggal) => (
            <li
              key={tanggal.scheduleId}
              className="flex flex-wrap items-center gap-2 text-xs text-slate-600"
            >
              <span className="font-medium text-slate-800">
                {tanggal.dayName}, {formatShortDate(tanggal.scheduleDate)}
              </span>
              <span className="text-slate-400">· Kelas {tanggal.className}</span>
              {tanggal.menuName && (
                <span className="text-slate-500">{tanggal.menuName}</span>
              )}
              {tanggal.studentName && (
                <span className="text-slate-400">({tanggal.studentName})</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Warna ikon kartu statistik — memakai tiga warna palet aplikasi. */
const STAT_TONES = {
  brand: "bg-brand-50 text-brand-600",
  accent: "bg-accent-50 text-accent-700",
  highlight: "bg-highlight-50 text-highlight-700",
  neutral: "bg-slate-100 text-slate-500",
} as const;

function StatCard({
  icon,
  tone = "brand",
  label,
  value,
  text,
  isText = false,
  hint,
}: {
  icon: React.ReactNode;
  tone?: keyof typeof STAT_TONES;
  label: string;
  value: number;
  /** Ganti angka dengan teks — dipakai kartu "Periode". */
  text?: string;
  isText?: boolean;
  hint?: string;
}) {
  return (
    <Card className="p-5">
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${STAT_TONES[tone]}`}
      >
        {icon}
      </span>
      <p
        className={`mt-3 font-bold text-slate-900 ${isText ? "text-base" : "text-2xl"}`}
      >
        {isText ? text : value}
      </p>
      <p className="text-sm text-slate-600">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
    </Card>
  );
}
