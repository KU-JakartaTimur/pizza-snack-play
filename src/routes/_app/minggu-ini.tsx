import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { ScheduleDayCard } from "@/components/ScheduleDayCard";
import { ListReveal, RevealItem } from "@/components/motion/ListReveal";
import { ExportButton } from "@/components/jadwal/ExportButton";
import { Button, Card, ErrorState, Spinner } from "@/components/ui";
import { useActiveClass } from "@/lib/active-class";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { addDays, formatWeekLabel, todayInWib } from "@/lib/date";

export const Route = createFileRoute("/_app/minggu-ini")({
  component: WeekPage,
});

const WEEK_GRID = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5";

function WeekPage() {
  // `anchor` adalah tanggal mana pun dalam minggu yang sedang dilihat.
  const [anchor, setAnchor] = useState(todayInWib);
  const activeClass = useActiveClass();
  const { canManageSchedule } = useAuth();

  const weekQuery = useQuery({
    queryKey: ["schedules", "week", anchor, activeClass],
    queryFn: () => api.schedules.week(anchor, activeClass),
  });

  const shift = (weeks: number) => setAnchor((current) => addDays(current, weeks * 7));

  const shownClass = weekQuery.data?.className ?? activeClass;

  return (
    <>
      <PageHeader
        title="Jadwal Sepekan"
        description={
          shownClass
            ? `Menu snack Senin–Jumat untuk kelas ${shownClass}.`
            : "Menu snack Senin–Jumat untuk minggu yang dipilih."
        }
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
              className="text-xs text-brand-600 hover:text-brand-700 hover:underline"
            >
              Kembali ke pekan ini
            </button>
          </div>
        </div>

        {canManageSchedule && (
          <div className="border-t border-slate-200 px-5 py-3">
            {/* Kelas yang diunduh sengaja `shownClass` — persis yang tampil
                di layar, bukan sekadar kelas aktif di pemilih kelas. */}
            <ExportButton
              scope="week"
              date={anchor}
              className={shownClass}
              disabled={!weekQuery.data}
            />
          </div>
        )}
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
        <ListReveal className={WEEK_GRID}>
          {weekQuery.data.days.map((day) => (
            <RevealItem key={day.date}>
              <ScheduleDayCard day={day} compact />
            </RevealItem>
          ))}
        </ListReveal>
      )}
    </>
  );
}
