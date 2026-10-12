import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, Lock } from "lucide-react";
import { AccessDenied } from "@/components/AdminOnly";
import { PageHeader } from "@/components/AppShell";
import { ScheduleDayCard } from "@/components/ScheduleDayCard";
import { ClaimAction } from "@/components/pilih-jadwal/ClaimAction";
import { ConflictDialog } from "@/components/pilih-jadwal/ConflictDialog";
import { MonthSnapshot } from "@/components/pilih-jadwal/MonthSnapshot";
import { PickToolbar } from "@/components/pilih-jadwal/PickToolbar";
import { isClaimableDay, summarizeMonth } from "@/components/pilih-jadwal/summary";
import { ListReveal, RevealItem } from "@/components/motion/ListReveal";
import { Badge, Card, EmptyState, ErrorState, Spinner } from "@/components/ui";
import { useActiveClass } from "@/lib/active-class";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useClaimActions } from "@/hooks/useClaimActions";
import { useMonthNavigator } from "@/hooks/useMonthNavigator";
import {
  formatIndonesianDate,
  indonesianMonthName,
  todayInWib,
} from "@/lib/date";
import type { ScheduleDayDto } from "@/types/schedule";

export const Route = createFileRoute("/_app/pilih-jadwal")({
  component: PickSchedulePage,
});

const PICK_GRID = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

/**
 * Orang tua berebut tanggal snack dari jadwal yang sudah dipublikasi korlas.
 *
 * Satu klik langsung mengambil tanggal — tidak ada dialog konfirmasi, karena
 * yang diperebutkan justru kecepatan. "Atas nama anak" dipilih sekali di atas
 * halaman dan berlaku untuk semua pengambilan berikutnya.
 *
 * Halaman ini juga memuat **keterangan bulan** (berapa snack yang sudah
 * diambil) yang hanya tampil untuk korlas & admin. Admin tidak ikut memilih —
 * ia tidak punya profil orang tua — jadi yang ia lihat hanya keterangannya.
 */
function PickSchedulePage() {
  const { user, students, isAdmin, isKorlas } = useAuth();
  const activeClass = useActiveClass();
  const { year, month, shift } = useMonthNavigator();
  const today = todayInWib();

  const [studentId, setStudentId] = useState<number | null>(null);

  const monthQuery = useQuery({
    queryKey: ["schedules", "month", year, month, activeClass],
    queryFn: () => api.schedules.month(year, month, activeClass),
  });

  const shownClass = monthQuery.data?.className ?? activeClass;

  // Anak di kelas lain tidak relevan untuk jadwal kelas ini, jadi pilihannya
  // dipersempit — dan pilihan yang tidak lagi cocok jatuh ke anak pertama.
  const classStudents = shownClass
    ? students.filter((student) => student.className === shownClass)
    : students;
  const effectiveStudentId = classStudents.some((s) => s.id === studentId)
    ? studentId
    : (classStudents[0]?.id ?? null);

  const claims = useClaimActions(effectiveStudentId);

  // Hanya jadwal terbit yang bisa direbut; hari libur dan hari tanpa entri
  // jadwal tidak ikut ditampilkan. Penyaring yang sama dipakai panel
  // keterangan, jadi kedua bagian halaman ini tidak mungkin berbeda angka.
  const days = (monthQuery.data?.weeks ?? [])
    .flatMap((week) => week.days)
    .filter(isClaimableDay);

  const myClaims = days.filter((day) => day.claim?.parentId === user?.parentId);
  const available = days.filter(
    (day) =>
      !day.claim &&
      !day.petugasName &&
      !day.petugasParentName &&
      day.date >= today,
  );

  // Pemantauan bulan ini untuk pengelola jadwal; orang tua tidak melihatnya.
  const showSnapshot = isAdmin || isKorlas;

  return (
    <>
      <PageHeader
        title="Pilih Jadwal"
        description={
          isAdmin
            ? "Pantau berapa tanggal snack yang sudah diambil pada bulan ini."
            : shownClass
              ? `Ambil tanggal snack kelas ${shownClass} — siapa cepat dia dapat.`
              : "Ambil tanggal snack dari jadwal yang sudah dipublikasi korlas."
        }
      />

      {showSnapshot && (
        <MonthSnapshot
          stats={summarizeMonth(days)}
          year={year}
          month={month}
          className={shownClass}
          isPending={monthQuery.isPending}
        />
      )}

      {isAdmin ? (
        <AccessDenied description="Admin tidak ikut mengambil tanggal — keterangan di atas menampilkan berapa snack yang sudah diambil, dan rincian per orang tua ada di Laporan Jadwal." />
      ) : (
        <>
          <PickToolbar
            year={year}
            month={month}
            onShift={shift}
            students={classStudents}
            studentId={effectiveStudentId}
            onStudentChange={setStudentId}
            availableCount={available.length}
            myClaimCount={myClaims.length}
          />

          {myClaims.length > 0 && <MyClaimsCard days={myClaims} />}

          {monthQuery.isPending && <Spinner />}

          {monthQuery.isError && (
            <Card>
              <ErrorState
                message={monthQuery.error.message}
                onRetry={() => void monthQuery.refetch()}
              />
            </Card>
          )}

          {monthQuery.data && days.length === 0 && (
            <Card>
              <EmptyState
                icon={<Lock className="h-8 w-8" />}
                title="Belum ada jadwal yang dipublikasi"
                description={`Korlas belum mempublikasi jadwal ${indonesianMonthName(month)} ${year}. Coba lagi nanti atau lihat bulan lain.`}
              />
            </Card>
          )}

          {days.length > 0 && (
            <ListReveal className={PICK_GRID}>
              {days.map((day) => (
                <RevealItem key={day.date}>
                  <ScheduleDayCard
                    day={day}
                    compact
                    highlight={day.claim?.parentId === user?.parentId}
                    footer={
                      <ClaimAction
                        day={day}
                        today={today}
                        myParentId={user?.parentId ?? null}
                        busy={claims.busy}
                        onTake={() => claims.take(day.scheduleId!)}
                        onRelease={claims.release}
                      />
                    }
                  />
                </RevealItem>
              ))}
            </ListReveal>
          )}

          <ConflictDialog
            message={claims.conflict}
            onClose={claims.dismissConflict}
          />
        </>
      )}
    </>
  );
}

/** Pengingat tanggal yang sudah diambil sendiri — daftar singkat di atas grid. */
function MyClaimsCard({ days }: { days: ScheduleDayDto[] }) {
  return (
    <Card className="mb-6">
      <div className="flex flex-wrap items-center gap-2 px-5 py-4">
        <CalendarCheck className="h-4 w-4 shrink-0 text-brand-600" />
        <span className="text-sm font-medium text-slate-700">
          Tanggal yang sudah Anda ambil:
        </span>
        {days.map((day) => (
          <Badge key={day.date} tone="info">
            {formatIndonesianDate(day.date)}
          </Badge>
        ))}
      </div>
    </Card>
  );
}
