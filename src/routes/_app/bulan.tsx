import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { ScheduleDayCard } from "@/components/ScheduleDayCard";
import { ExportButton } from "@/components/jadwal/ExportButton";
import { Button, Card, ErrorState, Spinner } from "@/components/ui";
import { useActiveClass } from "@/lib/active-class";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { indonesianMonthName, monthOf, yearOf, todayInWib } from "@/lib/date";

export const Route = createFileRoute("/_app/bulan")({
  component: MonthPage,
});

function MonthPage() {
  const today = todayInWib();
  const [year, setYear] = useState(() => yearOf(today));
  const [month, setMonth] = useState(() => monthOf(today));
  const activeClass = useActiveClass();
  const { canManageSchedule } = useAuth();

  const monthQuery = useQuery({
    queryKey: ["schedules", "month", year, month, activeClass],
    queryFn: () => api.schedules.month(year, month, activeClass),
  });

  const shift = (delta: number) => {
    const next = month + delta;
    if (next < 1) {
      setMonth(12);
      setYear((value) => value - 1);
    } else if (next > 12) {
      setMonth(1);
      setYear((value) => value + 1);
    } else {
      setMonth(next);
    }
  };

  const totalDays =
    monthQuery.data?.weeks.reduce((sum, week) => sum + week.days.length, 0) ?? 0;
  const scheduledDays =
    monthQuery.data?.weeks.reduce(
      (sum, week) => sum + week.days.filter((day) => day.menu !== null).length,
      0,
    ) ?? 0;
  const holidayDays =
    monthQuery.data?.weeks.reduce(
      (sum, week) => sum + week.days.filter((day) => day.isHoliday).length,
      0,
    ) ?? 0;

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
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => shift(-1)}
              aria-label="Bulan sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-40 text-center font-semibold text-slate-900">
              {indonesianMonthName(month)} {year}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => shift(1)}
              aria-label="Bulan berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {monthQuery.data && (
            <div className="flex flex-wrap gap-4 text-sm">
              <Stat label="Hari sekolah" value={totalDays} />
              <Stat label="Ada menu" value={scheduledDays} tone="success" />
              <Stat label="Libur" value={holidayDays} tone="warning" />
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
          {monthQuery.data.weeks.map((week) => (
            <section key={week.startDate}>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
                {week.label}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {week.days.map((day) => (
                  <ScheduleDayCard key={day.date} day={day} compact />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
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
