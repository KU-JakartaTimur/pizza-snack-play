import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarCheck, HandHeart, Lock, TriangleAlert } from "lucide-react";
import { AccessDenied } from "@/components/AdminOnly";
import { PageHeader } from "@/components/AppShell";
import { MonthNavigator } from "@/components/MonthNavigator";
import { ScheduleDayCard } from "@/components/ScheduleDayCard";
import { ListReveal, RevealItem } from "@/components/motion/ListReveal";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Modal,
  Select,
  Spinner,
} from "@/components/ui";
import { useActiveClass } from "@/lib/active-class";
import { api, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useMonthNavigator } from "@/hooks/useMonthNavigator";
import { formatIndonesianDate, indonesianMonthName, todayInWib } from "@/lib/date";
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
 */
function PickSchedulePage() {
  const { user, students } = useAuth();
  const activeClass = useActiveClass();
  const queryClient = useQueryClient();
  const { year, month, shift } = useMonthNavigator();

  const today = todayInWib();
  const [studentId, setStudentId] = useState<number | null>(null);
  const [conflict, setConflict] = useState<string | null>(null);

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

  /** Jadwal berubah setelah tindakan apa pun, termasuk saat kalah cepat. */
  const refreshSchedules = () =>
    void queryClient.invalidateQueries({ queryKey: ["schedules"] });

  const takeMutation = useMutation({
    mutationFn: (scheduleId: number) =>
      api.claims.take({ scheduleId, studentId: effectiveStudentId }),
    onSuccess: refreshSchedules,
    onError: (error) => {
      // 409 = kalah cepat dari orang tua lain. Pesannya sudah menyebut nama
      // pemiliknya, jadi tinggal ditampilkan apa adanya — tetapi datanya tetap
      // disegarkan supaya tanggal itu langsung terlihat sudah terisi.
      setConflict(errorMessage(error));
      refreshSchedules();
    },
  });

  const releaseMutation = useMutation({
    mutationFn: (claimId: number) => api.claims.release(claimId),
    onSuccess: refreshSchedules,
    onError: (error) => setConflict(errorMessage(error)),
  });

  // Admin tidak punya profil orang tua, jadi tidak bisa ikut memilih.
  if (user?.role === "admin") {
    return (
      <AccessDenied description="Halaman ini untuk orang tua. Admin dapat melihat siapa yang sudah memilih lewat Jadwal Bulanan." />
    );
  }

  // Hanya jadwal terbit yang bisa direbut; hari libur dan hari tanpa entri
  // jadwal tidak ikut ditampilkan.
  const days = (monthQuery.data?.weeks ?? [])
    .flatMap((week) => week.days)
    .filter((day) => day.scheduleId !== null && !day.isHoliday);

  const myClaims = days.filter((day) => day.claim?.parentId === user?.parentId);
  const available = days.filter(
    (day) => !day.claim && !day.petugasName && !day.petugasParentName && day.date >= today,
  );
  const busy = takeMutation.isPending || releaseMutation.isPending;

  return (
    <>
      <PageHeader
        title="Pilih Jadwal"
        description={
          shownClass
            ? `Ambil tanggal snack kelas ${shownClass} — siapa cepat dia dapat.`
            : "Ambil tanggal snack dari jadwal yang sudah dipublikasi korlas."
        }
      />

      <Card className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
          <MonthNavigator year={year} month={month} onShift={shift} />

          <div className="flex flex-wrap items-end gap-4">
            {classStudents.length > 1 && (
              <div className="w-48">
                <Field label="Atas nama anak">
                  <Select
                    value={effectiveStudentId ?? ""}
                    onChange={(event) =>
                      setStudentId(
                        event.target.value ? Number(event.target.value) : null,
                      )
                    }
                  >
                    {classStudents.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            )}

            <div className="flex gap-4 text-sm">
              <Counter label="Masih kosong" value={available.length} tone="accent" />
              <Counter label="Pilihan saya" value={myClaims.length} tone="brand" />
            </div>
          </div>
        </div>
      </Card>

      {myClaims.length > 0 && (
        <Card className="mb-6">
          <div className="flex flex-wrap items-center gap-2 px-5 py-4">
            <CalendarCheck className="h-4 w-4 shrink-0 text-brand-600" />
            <span className="text-sm font-medium text-slate-700">
              Tanggal yang sudah Anda ambil:
            </span>
            {myClaims.map((day) => (
              <Badge key={day.date} tone="info">
                {formatIndonesianDate(day.date)}
              </Badge>
            ))}
          </div>
        </Card>
      )}

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
                    busy={busy}
                    onTake={() => takeMutation.mutate(day.scheduleId!)}
                    onRelease={(claimId) => releaseMutation.mutate(claimId)}
                  />
                }
              />
            </RevealItem>
          ))}
        </ListReveal>
      )}

      <Modal
        open={conflict !== null}
        title="Yah, keduluan!"
        onClose={() => setConflict(null)}
        footer={<Button onClick={() => setConflict(null)}>Mengerti</Button>}
      >
        <div className="flex items-start gap-3">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-highlight-600" />
          <div>
            <p className="text-sm text-slate-700">{conflict}</p>
            <p className="mt-1 text-xs text-slate-500">
              Silakan pilih tanggal lain yang masih kosong.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
}

/** Angka ringkasan di toolbar: nilai besar + label kecil di bawahnya. */
function Counter({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "accent" | "brand";
}) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p
        className={
          tone === "accent"
            ? "text-lg font-bold text-accent-700"
            : "text-lg font-bold text-brand-700"
        }
      >
        {value}
      </p>
    </div>
  );
}

/** Tombol ambil / batal untuk satu tanggal. */
function ClaimAction({
  day,
  today,
  myParentId,
  busy,
  onTake,
  onRelease,
}: {
  day: ScheduleDayDto;
  today: string;
  myParentId: number | null;
  busy: boolean;
  onTake: () => void;
  onRelease: (claimId: number) => void;
}) {
  const isPast = day.date < today;
  const isMine = day.claim?.parentId === myParentId;

  // Urutannya penting: klaim sendiri diakui lebih dulu, karena tanggal yang
  // sudah lewat pun tetap boleh menampilkan milik siapa.
  if (isMine && day.claim) {
    return (
      <div className="flex items-center justify-between gap-2">
        <Badge tone="success">Pilihan Anda</Badge>
        {!isPast && (
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => onRelease(day.claim!.id)}
          >
            Batalkan
          </Button>
        )}
      </div>
    );
  }

  if (day.claim) {
    return <Badge tone="warning">Sudah dipilih orang tua lain</Badge>;
  }

  // Petugas terisi tanpa klaim = korlas menunjuknya dari daftar piket manual.
  if (day.petugasName || day.petugasParentName) {
    return <Badge tone="neutral">Ditetapkan korlas</Badge>;
  }

  if (isPast) {
    return <span className="text-xs text-slate-400">Tanggal sudah lewat</span>;
  }

  return (
    <Button size="sm" className="w-full" disabled={busy} onClick={onTake}>
      <HandHeart className="h-4 w-4" />
      Ambil tanggal ini
    </Button>
  );
}
