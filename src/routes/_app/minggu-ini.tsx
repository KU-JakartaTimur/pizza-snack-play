import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { ScheduleDayCard } from "@/components/ScheduleDayCard";
import { Button, Card, ErrorState, Spinner } from "@/components/ui";
import { api } from "@/lib/api";
import { addDays, formatWeekLabel, todayInWib } from "@/lib/date";

export const Route = createFileRoute("/_app/minggu-ini")({
  component: WeekPage,
});

function WeekPage() {
  // `anchor` adalah tanggal mana pun dalam minggu yang sedang dilihat.
  const [anchor, setAnchor] = useState(todayInWib);

  const weekQuery = useQuery({
    queryKey: ["schedules", "week", anchor],
    queryFn: () => api.schedules.week(anchor),
  });

  const shift = (weeks: number) => setAnchor((current) => addDays(current, weeks * 7));

  return (
    <>
      <PageHeader
        title="Jadwal Mingguan"
        description="Menu snack Senin–Jumat untuk minggu yang dipilih."
      />

      <Card className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => shift(-1)}
              aria-label="Minggu sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
              Sebelumnya
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => shift(1)}
              aria-label="Minggu berikutnya"
            >
              Berikutnya
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="text-right">
            <p className="font-semibold text-slate-900">
              {weekQuery.data?.label ?? formatWeekLabel(anchor, anchor)}
            </p>
            <button
              type="button"
              onClick={() => setAnchor(todayInWib())}
              className="text-xs text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              Kembali ke minggu ini
            </button>
          </div>
        </div>
      </Card>

      {weekQuery.isPending && <Spinner />}

      {weekQuery.isError && (
        <Card>
          <ErrorState
            message={weekQuery.error.message}
            onRetry={() => void weekQuery.refetch()}
          />
        </Card>
      )}

      {weekQuery.data && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {weekQuery.data.days.map((day) => (
            <ScheduleDayCard key={day.date} day={day} compact />
          ))}
        </div>
      )}
    </>
  );
}
