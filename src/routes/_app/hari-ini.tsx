import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarRange, GraduationCap, User } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { PetugasHariIni } from "@/components/PetugasHariIni";
import { ScheduleDayCard } from "@/components/ScheduleDayCard";
import { Card, CardHeader, ErrorState, Spinner } from "@/components/ui";
import { useActiveClass } from "@/lib/active-class";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { AuthUser, StudentProfile } from "@/types/auth";
import type {
  ScheduleDayDto,
  TodayScheduleDto,
  WeekScheduleDto,
} from "@/types/schedule";

export const Route = createFileRoute("/_app/hari-ini")({
  component: TodayPage,
});

function TodayPage() {
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

      {todayQuery.data && <TodayContent data={todayQuery.data} />}
    </>
  );
}

/**
 * Isi halaman sesudah jadwal hari ini turun.
 *
 * Dipisah dari `TodayPage` supaya permintaan petugas lintas kelas baru berjalan
 * ketika tanggalnya sudah pasti. Tanggal itu diambil dari jadwal yang dikirim
 * server, bukan dari jam perangkat — kalau keduanya berbeda (jam perangkat
 * meleset), panel petugas tidak akan menampilkan tanggal yang lain daripada
 * kartu di sebelahnya.
 *
 * Halaman dibagi dua kolom: **kolom utama** (kartu hari + petugas semua kelas)
 * dan **kolom samping** (konteks akun yang sedang dibuka). Tiap kartu kolom
 * samping berdiri sendiri sebagai komponen kecil di bawah ini supaya syarat
 * tampilnya — anak tertaut, peran, jumlah siswa — terbaca di satu tempat dan
 * tidak tercampur dengan tata letaknya.
 */
function TodayContent({ data }: { data: TodayScheduleDto }) {
  const { user, students, relationship } = useAuth();
  const date = data.day.date;

  const petugasQuery = useQuery({
    queryKey: ["schedules", "petugas", date],
    queryFn: () => api.schedules.petugas(date, date),
  });

  // Endpoint petugas hanya menyebut tanggal yang punya jadwal terbit, jadi
  // ketiadaan tanggalnya berarti "belum ada petugas" — bukan galat.
  const petugasToday =
    petugasQuery.data?.dates.find((item) => item.date === date)?.classes ?? [];

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Kolom utama, dua dari tiga lebar. Daftar petugas ikut di sini — isinya
          lintas kelas (satu baris per kelas), jadi di kolom samping yang sempit
          barisnya berdesakan dan justru mudah terlewat. */}
      <div className="space-y-6 lg:col-span-2">
        <ScheduleDayCard day={data.day} />
        <PetugasHariIni
          classes={petugasToday}
          isLoading={petugasQuery.isPending}
        />
      </div>

      <div className="space-y-4">
        <StudentListCard students={students} relationship={relationship} />
        {user && user.role !== "parent" && <AccountCard user={user} />}
        <WeekCard week={data.week} />
        {students.length === 0 && user?.role !== "admin" && (
          <MissingStudentCard />
        )}
      </div>
    </div>
  );
}

/**
 * Anak yang tertaut ke akun ini. Kartunya tidak muncul untuk admin, yang
 * `students`-nya memang selalu kosong.
 */
function StudentListCard({
  students,
  relationship,
}: {
  students: StudentProfile[];
  relationship: string | null;
}) {
  if (students.length === 0) return null;

  return (
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
          <li key={item.id} className="flex items-start gap-3 px-5 py-3">
            <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800">{item.name}</p>
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
  );
}

/**
 * Identitas akun yang sedang dipakai. Orang tua tidak memerlukannya — namanya
 * sudah tampil di header — jadi kartu ini hanya untuk admin dan korlas.
 */
function AccountCard({ user }: { user: AuthUser }) {
  return (
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
  );
}

/** Lima hari minggu berjalan — menu dan petugas kelas yang sedang dilihat. */
function WeekCard({ week }: { week: WeekScheduleDto }) {
  return (
    <Card>
      <CardHeader title="Minggu Berjalan" description={week.label} />
      <ul className="divide-y divide-slate-100">
        {week.days.map((day) => (
          <li
            key={day.date}
            className="flex items-start justify-between gap-3 px-5 py-2.5"
          >
            <span className="flex items-center gap-2 pt-0.5 text-sm">
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

            <span className="min-w-0 text-right">
              <span className="block truncate text-xs text-slate-500">
                {day.isHoliday
                  ? (day.holidayName ?? "Libur")
                  : (day.menu?.name ?? "—")}
              </span>
              <WeekPetugas day={day} />
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/**
 * Penutup untuk orang tua yang belum punya anak tertaut. Admin dikecualikan:
 * `students`-nya memang kosong, dan menyuruhnya menghubungi admin akan
 * menyesatkan.
 */
function MissingStudentCard() {
  return (
    <Card>
      <CardHeader title="Profil siswa" />
      <p className="flex items-start gap-2 px-5 py-4 text-sm text-slate-500">
        <GraduationCap className="mt-0.5 h-4 w-4 shrink-0" />
        Profil siswa belum ditautkan ke akun ini. Hubungi admin.
      </p>
    </Card>
  );
}

/**
 * Petugas piket pada satu baris "Minggu Berjalan".
 *
 * Yang tampil adalah petugas **kelas yang sedang dilihat** — barisnya hanya
 * selebar kartu samping. Daftar semua kelas ada di kartu "Petugas Piket" di
 * kolom utama halaman ini, yang memang disediakan untuk itu.
 *
 * Nama orang tua dipakai sebagai cadangan: jadwal lama bisa punya petugas
 * tanpa siswa yang tertaut, dan menyebut walinya masih lebih berguna daripada
 * baris yang tampak kosong.
 */
function WeekPetugas({ day }: { day: ScheduleDayDto }) {
  if (day.isHoliday) return null;

  const name = day.petugasName ?? day.petugasParentName;

  return (
    <span className="mt-0.5 flex items-center justify-end gap-1 text-xs text-slate-400">
      <User className="h-3 w-3 shrink-0" />
      <span className="truncate">{name ?? "—"}</span>
    </span>
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
