import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarRange, GraduationCap } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { ScheduleDayCard } from "@/components/ScheduleDayCard";
import { Card, CardHeader, ErrorState, Spinner } from "@/components/ui";
import { useActiveClass } from "@/lib/active-class";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_app/hari-ini")({
  component: TodayPage,
});

function TodayPage() {
  const { user, students, relationship } = useAuth();
  const activeClass = useActiveClass();

  const todayQuery = useQuery({
    queryKey: ["schedules", "today", activeClass],
    queryFn: () => api.schedules.today(activeClass),
  });

  return (
    <>
      <PageHeader
        title="Jadwal Hari Ini"
        description="Menu snack yang dijadwalkan untuk hari ini."
      />

      {todayQuery.isPending && <Spinner />}

      {todayQuery.isError && (
        <Card>
          <ErrorState
            message={todayQuery.error.message}
            onRetry={() => void todayQuery.refetch()}
          />
        </Card>
      )}

      {todayQuery.data && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ScheduleDayCard day={todayQuery.data.day} />
          </div>

          <div className="space-y-4">
            {students.length > 0 && (
              <Card>
                <CardHeader
                  title="Data Siswa"
                  description={
                    students.length > 1
                      ? `${students.length} anak terdaftar pada akun ini`
                      : undefined
                  }
                />
                <ul className="divide-y divide-slate-100">
                  {students.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-start gap-3 px-5 py-3"
                    >
                      <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800">
                          {item.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          Kelas {item.className ?? "—"}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
                {relationship && (
                  <p className="border-t border-slate-100 px-5 py-2.5 text-xs text-slate-500">
                    Hubungan dengan siswa: {relationship}
                  </p>
                )}
              </Card>
            )}

            {user && user.role !== "parent" && (
              <Card>
                <CardHeader title="Akun" />
                <dl className="divide-y divide-slate-100 px-5">
                  <Row label="Username" value={user.username} />
                  <Row label="Nama" value={user.fullName ?? "-"} />
                  <Row
                    label="Peran"
                    value={
                      user.role === "admin"
                        ? "Admin"
                        : `Korlas ${user.className ?? ""}`.trim()
                    }
                  />
                </dl>
              </Card>
            )}

            <Card>
              <CardHeader
                title="Minggu Berjalan"
                description={todayQuery.data.week.label}
              />
              <ul className="divide-y divide-slate-100">
                {todayQuery.data.week.days.map((day) => (
                  <li
                    key={day.date}
                    className="flex items-center justify-between gap-3 px-5 py-2.5"
                  >
                    <span className="flex items-center gap-2 text-sm">
                      <CalendarRange className="h-3.5 w-3.5 text-slate-400" />
                      <span
                        className={
                          day.isToday
                            ? "font-semibold text-highlight-700"
                            : "text-slate-600"
                        }
                      >
                        {day.dayName}
                      </span>
                    </span>
                    <span className="truncate text-xs text-slate-500">
                      {day.isHoliday
                        ? (day.holidayName ?? "Libur")
                        : (day.menu?.name ?? "—")}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>

            {students.length === 0 && user?.role !== "admin" && (
              <Card>
                <CardHeader title="Profil siswa" />
                <p className="flex items-start gap-2 px-5 py-4 text-sm text-slate-500">
                  <GraduationCap className="mt-0.5 h-4 w-4 shrink-0" />
                  Profil siswa belum ditautkan ke akun ini. Hubungi admin.
                </p>
              </Card>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-sm font-medium text-slate-800">{value}</dd>
    </div>
  );
}
