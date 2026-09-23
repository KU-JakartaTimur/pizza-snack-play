import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/AppShell";
import { MonthNavigator } from "@/components/MonthNavigator";
import { ScheduleDayCard } from "@/components/ScheduleDayCard";
import { ListReveal, RevealItem } from "@/components/motion/ListReveal";
import { ExportButton } from "@/components/jadwal/ExportButton";
import { Card, ErrorState, Spinner } from "@/components/ui";
import { useActiveClass } from "@/lib/active-class";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useMonthNavigator } from "@/hooks/useMonthNavigator";
import type { ScheduleDayDto } from "@/types/schedule";

export const Route = createFileRoute("/_app/bulan")({
  component: MonthPage,
});

const MONTH_GRID =
  "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5";

function MonthPage() {
  const { year, month, shift } = useMonthNavigator();
  const activeClass = useActiveClass();
  const { canManageSchedule } = useAuth();

  const monthQuery = useQuery({
    queryKey: ["schedules", "month", year, month, activeClass],
    queryFn: () => api.schedules.month(year, month, activeClass),
  });

  const weeks = monthQuery.data?.weeks ?? [];
  const allDays = weeks.flatMap((week) => week.days);

  return (
    <>
      <PageHeader
        title="Jadwal Bulanan"
        description={
          (monthQuery.data?.className ?? activeClass)
            ? `Rekap menu snack kelas ${monthQuery.data?.className ?? activeClass} per minggu dalam satu bulan.`
            : "Rekap menu snack per minggu dalam satu bulan."
        }
      />

      <Card className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <MonthNavigator year={year} month={month} onShift={shift} />

          {monthQuery.data && (
            <div className="flex flex-wrap gap-4 text-sm">
              <Stat label="Hari sekolah" value={allDays.length} />
              <Stat
                label="Ada menu"
                value={countDays(allDays, (day) => day.menu !== null)}
                tone="success"
              />
              <Stat
                label="Libur"
                value={countDays(allDays, (day) => day.isHoliday)}
                tone="warning"
              />
            </div>
          )}
        </div>

        {canManageSchedule && (
          <div className="border-t border-slate-200 px-5 py-3">
            {/* Kelas yang diunduh sengaja kelas yang tampil di layar, bukan
                sekadar kelas aktif di pemilih kelas. */}
            <ExportButton
              scope="month"
              year={year}
              month={month}
              className={monthQuery.data?.className ?? activeClass}
              disabled={!monthQuery.data}
            />
          </div>
        )}
      </Card>

      {monthQuery.isPending && <Spinner />}

      {monthQuery.isError && (
        <Card>
          <ErrorState
            message={monthQuery.error.message}
            onRetry={() => void monthQuery.refetch()}
          />
        </Card>
      )}

      {monthQuery.data && (
        <div className="space-y-8">
          {weeks.map((week) => (
            <section key={week.startDate}>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
                {week.label}
              </h2>
              <ListReveal className={MONTH_GRID}>
                {week.days.map((day) => (
                  <RevealItem key={day.date}>
                    <ScheduleDayCard day={day} compact />
                  </RevealItem>
                ))}
              </ListReveal>
            </section>
          ))}
        </div>
      )}
    </>
  );
}

/** Hitung hari yang memenuhi syarat — dipakai untuk tiga angka ringkasan. */
function countDays(
  days: ScheduleDayDto[],
  predicate: (day: ScheduleDayDto) => boolean,
): number {
  return days.filter(predicate).length;
}

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "success" | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "text-accent-700"
      : tone === "warning"
        ? "text-highlight-700"
        : "text-slate-700";

  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-lg font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}
