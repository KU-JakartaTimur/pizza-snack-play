import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RoleGate } from "@/components/AdminOnly";
import { PageHeader } from "@/components/AppShell";
import {
  CopyWeekModal,
  type CopyFormValue,
} from "@/components/jadwal/CopyWeekModal";
import { DayRow, type DayPatch } from "@/components/jadwal/DayRow";
import { HolidayCard } from "@/components/jadwal/HolidayCard";
import {
  HolidayModal,
  type HolidayFormValue,
} from "@/components/jadwal/HolidayModal";
import { MonthToolbar } from "@/components/jadwal/MonthToolbar";
import { SchoolStatusSummary } from "@/components/jadwal/SchoolStatusSummary";
import { Card, CardHeader, Spinner } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { useActiveClass } from "@/lib/active-class";
import { useAuth } from "@/lib/auth-context";
import { monthOf, monthRange, todayInWib, yearOf } from "@/lib/date";
import type { ScheduleDayDto } from "@/types/schedule";

export const Route = createFileRoute("/_app/jadwal")({
  component: ScheduleAdminPage,
});

/** Pesan banner sukses / gagal di atas toolbar. */
interface Banner {
  kind: "ok" | "error";
  text: string;
}

/**
 * Halaman kelola jadwal — admin dan korlas.
 *
 * Pembagian hak (lihat PRD §7.5 & F8):
 * - **Korlas**: menyusun jadwal kelasnya selama masih `draft` (menu, petugas,
 *   catatan, Salin Sepekan), lalu mengunci & **mempublikasikannya** untuk
 *   kelasnya sendiri.
 * - **Admin**: hal yang sama, tetapi cakupannya **semua kelas sekaligus**
 *   (mengirim permintaan tanpa `className`), plus buka kunci & hari libur.
 *
 * Halaman ini hanya menyusun tata letak + query/mutasi. Rendering dipecah ke
 * `src/components/jadwal/*`.
 */
function ScheduleAdminPage() {
  return (
    <RoleGate need="schedule">
      <ScheduleAdminContent />
    </RoleGate>
  );
}

function ScheduleAdminContent() {
  const queryClient = useQueryClient();
  const today = todayInWib();
  const { isAdmin, korlasClass } = useAuth();
  const activeClass = useActiveClass();

  // Korlas selalu memakai kelasnya sendiri, apa pun pilihan di header.
  const className = isAdmin ? activeClass : (korlasClass ?? activeClass);

  const [year, setYear] = useState(() => yearOf(today));
  const [month, setMonth] = useState(() => monthOf(today));
  const [banner, setBanner] = useState<Banner | null>(null);
  const [holidayModalOpen, setHolidayModalOpen] = useState(false);
  const [copyModalOpen, setCopyModalOpen] = useState(false);

  const { from: monthStart, to: monthEnd } = monthRange(year, month);

  /**
   * Tabel berbaris untuk **kelas yang sedang dipilih**.
   * Kunci & publikasi menyentuh lebih banyak kelas — status cakupannya
   * diambil dari `statusQuery` di bawah.
   */
  const monthQuery = useQuery({
    queryKey: ["schedules", "month", year, month, className],
    queryFn: () => api.schedules.month(year, month, className),
    enabled: Boolean(className),
  });

  /**
   * Ringkasan status per kelas — satu permintaan, bukan satu per kelas.
   *
   * Admin mengirim tanpa `className` → seluruh sekolah, karena tombol kunci &
   * publikasi admin berlaku untuk semua kelas. Korlas dibatasi ke kelasnya.
   */
  const statusQuery = useQuery({
    queryKey: ["schedules", "status", year, month, isAdmin ? null : className],
    queryFn: () => api.schedules.status(year, month, isAdmin ? null : className),
    enabled: isAdmin || Boolean(className),
  });

  const menusQuery = useQuery({
    queryKey: ["menus", "active"],
    queryFn: () => api.menus.list({ active: true }),
  });

  const holidaysQuery = useQuery({
    queryKey: ["holidays"],
    queryFn: () => api.holidays.list(),
    enabled: isAdmin,
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["schedules"] });
    await queryClient.invalidateQueries({ queryKey: ["holidays"] });
    await queryClient.invalidateQueries({ queryKey: ["stats"] });
  };

  /** Pembungkus seragam: sukses → banner hijau, gagal → banner merah. */
  const bannerHandlers = (fallback: string) => ({
    onSuccess: async (result: { message: string }) => {
      setBanner({ kind: "ok", text: result.message });
      await invalidate();
    },
    onError: (error: unknown) =>
      setBanner({
        kind: "error",
        text: error instanceof ApiError ? error.message : fallback,
      }),
  });

  const saveMutation = useMutation({
    mutationFn: async (vars: { day: ScheduleDayDto; patch: DayPatch }) => {
      // Hari yang belum punya entri → buat baru; selebihnya → perbarui.
      if (vars.day.scheduleId) {
        return api.schedules.update(vars.day.scheduleId, vars.patch);
      }
      return api.schedules.create({
        scheduleDate: vars.day.date,
        className: className!,
        menuId: vars.patch.menuId ?? null,
        isHoliday: vars.patch.isHoliday ?? false,
        petugasName: vars.patch.petugasName ?? null,
        petugasParentName: vars.patch.petugasParentName ?? null,
        notes: vars.patch.notes ?? null,
      });
    },
    ...bannerHandlers("Gagal menyimpan jadwal"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.schedules.remove(id),
    ...bannerHandlers("Gagal menghapus jadwal"),
  });

  const holidayMutation = useMutation({
    mutationFn: (value: HolidayFormValue) =>
      api.holidays.create({
        date: value.date,
        name: value.name,
        description: value.description || undefined,
      }),
    onSuccess: async (result) => {
      setBanner({ kind: "ok", text: result.message });
      setHolidayModalOpen(false);
      await invalidate();
    },
    onError: (error) =>
      setBanner({
        kind: "error",
        text: error instanceof ApiError ? error.message : "Gagal menambah hari libur",
      }),
  });

  const deleteHolidayMutation = useMutation({
    mutationFn: (id: number) => api.holidays.remove(id),
    ...bannerHandlers("Gagal menghapus"),
  });

  const copyMutation = useMutation({
    mutationFn: (value: CopyFormValue) =>
      api.schedules.copy({
        fromDate: value.fromDate,
        toDate: value.toDate,
        className: className!,
        overwrite: value.overwrite,
      }),
    onSuccess: async (result) => {
      const { created, updated, skipped, sourceLabel, targetLabel } = result.data;
      setBanner({
        kind: "ok",
        text: `Disalin ${sourceLabel} → ${targetLabel}: ${created} dibuat, ${updated} diperbarui, ${skipped} dilewati.`,
      });
      setCopyModalOpen(false);
      await invalidate();
    },
    onError: (error) =>
      setBanner({
        kind: "error",
        text: error instanceof ApiError ? error.message : "Gagal menyalin jadwal",
      }),
  });

  /**
   * Admin mengirim tanpa `className` → server memperlakukan sebagai
   * "semua kelas" (kelas 1–6 sekaligus). Korlas selalu menyertakan kelasnya.
   */
  const lockMutation = useMutation({
    mutationFn: () =>
      api.schedules.lock({
        fromDate: monthStart,
        toDate: monthEnd,
        ...(isAdmin ? {} : { className: className! }),
      }),
    onSuccess: async (result) => {
      const { locked, alreadyLocked, skipped, classes } = result.data;
      // Sebutkan kelasnya satu per satu supaya cakupan sekolah-wide terlihat.
      const scope = isAdmin
        ? `semua kelas (${classes.length} kelas: ${classes.join(", ")})`
        : `kelas ${classes[0] ?? className}`;
      setBanner({
        kind: "ok",
        text: `Terkunci ${locked} jadwal untuk ${scope}${alreadyLocked ? `, ${alreadyLocked} sudah terkunci` : ""}${skipped ? `, ${skipped} dilewati (sudah dipublikasi)` : ""}.`,
      });
      await invalidate();
    },
    onError: (error) =>
      setBanner({
        kind: "error",
        text: error instanceof ApiError ? error.message : "Gagal mengunci jadwal",
      }),
  });

  const publishMutation = useMutation({
    mutationFn: () =>
      api.schedules.publish({
        year,
        month,
        ...(isAdmin ? {} : { className: className! }),
      }),
    onSuccess: async (result) => {
      const { published, classes, alreadyPublished } = result.data;
      const scope = isAdmin
        ? `semua kelas (${classes.length} kelas: ${classes.join(", ")})`
        : `kelas ${classes[0] ?? className}`;
      setBanner({
        kind: "ok",
        text: `${published} jadwal dipublikasi untuk ${scope}${alreadyPublished ? `, ${alreadyPublished} sudah dipublikasi` : ""} — sekarang terlihat oleh orang tua kelas tersebut.`,
      });
      await invalidate();
    },
    onError: (error) =>
      setBanner({
        kind: "error",
        text: error instanceof ApiError ? error.message : "Gagal mempublikasi jadwal",
      }),
  });

  const unlockMutation = useMutation({
    mutationFn: (id: number) => api.schedules.unlock(id),
    ...bannerHandlers("Gagal membuka kunci"),
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

  const busy =
    saveMutation.isPending ||
    deleteMutation.isPending ||
    lockMutation.isPending ||
    publishMutation.isPending ||
    unlockMutation.isPending;

  const menus = menusQuery.data ?? [];
  const weeks = monthQuery.data?.weeks ?? [];
  const status = statusQuery.data;
  const hasDrafts = (status?.totals.draftCount ?? 0) > 0;

  return (
    <>
      <PageHeader
        title="Kelola Jadwal"
        description={
          isAdmin
            ? "Tetapkan menu per kelas. Kunci & publikasi berlaku untuk semua kelas (1–6) sekaligus."
            : className
              ? `Tetapkan menu, tandai libur kelas, dan tambahkan catatan untuk kelas ${className}. Anda juga dapat mempublikasikan jadwal kelas Anda.`
              : "Tetapkan menu dan catatan per hari."
        }
      />

      {!className && (
        <Card className="mb-6">
          <p className="px-5 py-6 text-sm text-slate-500">
            Belum ada kelas terpilih. Tambahkan data siswa terlebih dahulu, atau
            pilih kelas pada pemilih di bagian atas halaman.
          </p>
        </Card>
      )}

      {banner && (
        <div
          className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
            banner.kind === "ok"
              ? "border-brand-200 bg-brand-50 text-brand-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {banner.text}
        </div>
      )}

      <MonthToolbar
        year={year}
        month={month}
        menuCount={menus.length}
        menusLoading={menusQuery.isPending}
        isAdmin={isAdmin}
        className={className}
        hasDrafts={hasDrafts}
        canPublish={status?.canPublish ?? false}
        draftClasses={status?.draftClasses ?? []}
        busy={busy}
        lockPending={lockMutation.isPending}
        publishPending={publishMutation.isPending}
        onShift={shift}
        onLock={() => lockMutation.mutate()}
        onPublish={() => publishMutation.mutate()}
        onOpenCopy={() => setCopyModalOpen(true)}
        onOpenHoliday={() => setHolidayModalOpen(true)}
      />

      <SchoolStatusSummary
        status={status}
        isPending={statusQuery.isPending}
        isAdmin={isAdmin}
        className={className}
        busy={busy}
        onPublish={() => publishMutation.mutate()}
        publishing={publishMutation.isPending}
      />

      {className && monthQuery.isPending && <Spinner />}

      {monthQuery.isError && (
        <Card className="mb-6">
          <p className="px-5 py-6 text-sm text-red-600">{monthQuery.error.message}</p>
        </Card>
      )}

      <div className="space-y-6">
        {weeks.map((week) => (
          <Card key={week.startDate}>
            <CardHeader title={week.label} />
            <ul className="divide-y divide-slate-100">
              {week.days.map((day) => (
                <DayRow
                  key={day.date}
                  day={day}
                  menus={menus}
                  busy={busy}
                  canUnlock={isAdmin}
                  className={className}
                  onSave={(target, patch) =>
                    saveMutation.mutate({ day: target, patch })
                  }
                  onUnlock={(id) => unlockMutation.mutate(id)}
                  onDelete={(id) => deleteMutation.mutate(id)}
                />
              ))}
            </ul>
          </Card>
        ))}
      </div>

      {isAdmin && (
        <HolidayCard
          holidays={holidaysQuery.data ?? []}
          onDelete={(id) => deleteHolidayMutation.mutate(id)}
        />
      )}

      <HolidayModal
        open={holidayModalOpen}
        saving={holidayMutation.isPending}
        defaultDate={today}
        onClose={() => setHolidayModalOpen(false)}
        onSubmit={(value) => holidayMutation.mutate(value)}
      />

      <CopyWeekModal
        open={copyModalOpen}
        saving={copyMutation.isPending}
        today={today}
        onClose={() => setCopyModalOpen(false)}
        onSubmit={(value) => copyMutation.mutate(value)}
      />
    </>
  );
}
