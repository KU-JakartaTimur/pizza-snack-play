import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarCheck,
  CalendarOff,
  Tags,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { Card, CardHeader, ErrorState, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { formatIndonesianDate } from "@/lib/date";

export const Route = createFileRoute("/_app/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const statsQuery = useQuery({
    queryKey: ["stats", "summary"],
    queryFn: api.stats.summary,
  });

  if (statsQuery.isPending) return <Spinner />;

  if (statsQuery.isError) {
    return (
      <Card>
        <ErrorState
          message={statsQuery.error.message}
          onRetry={() => void statsQuery.refetch()}
        />
      </Card>
    );
  }

  const stats = statsQuery.data;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Ringkasan data jadwal snack sekolah."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={<Users className="h-5 w-5" />}
          label="Akun orang tua"
          value={stats.parents.total}
          hint={`${stats.parents.active} aktif`}
        />
        <MetricCard
          icon={<UtensilsCrossed className="h-5 w-5" />}
          label="Menu"
          value={stats.menus.total}
          hint={`${stats.menus.active} aktif`}
        />
        <MetricCard
          icon={<CalendarCheck className="h-5 w-5" />}
          label="Entri jadwal"
          value={stats.schedules.total}
          hint="sepanjang periode"
        />
        <MetricCard
          icon={<CalendarOff className="h-5 w-5" />}
          label="Hari libur"
          value={stats.schedules.holidays}
          hint="tercatat"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Hari Ini" description={formatIndonesianDate(stats.today.date)} />
          <div className="px-5 py-4">
            {stats.today.isHoliday ? (
              <p className="text-sm font-medium text-amber-700">
                Hari libur — tidak ada jadwal snack
              </p>
            ) : stats.today.menuName ? (
              <p className="text-lg font-semibold text-slate-900">
                {stats.today.menuName}
              </p>
            ) : (
              <p className="text-sm text-slate-500">
                Belum ada menu untuk hari ini
              </p>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Minggu Berjalan"
            description={stats.currentWeek?.label ?? "—"}
          />
          <div className="px-5 py-4 text-sm text-slate-600">
            {stats.currentWeek
              ? `${stats.currentWeek.startDate} s/d ${stats.currentWeek.endDate}`
              : "Belum ada data minggu"}
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Kategori Menu" description={`${stats.categories} kategori terdaftar`} />
        <p className="flex items-center gap-2 px-5 py-4 text-sm text-slate-500">
          <Tags className="h-4 w-4" />
          Kelola kategori di menu <span className="font-medium text-slate-700">Kategori</span>.
        </p>
      </Card>
    </>
  );
}

function MetricCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          {icon}
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-600">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
    </Card>
  );
}
