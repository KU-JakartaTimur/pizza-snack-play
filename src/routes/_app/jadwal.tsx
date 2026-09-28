import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RoleGate } from "@/components/AdminOnly";
import { PageHeader } from "@/components/AppShell";
import { FadeIn } from "@/components/motion/FadeIn";
import { ListReveal } from "@/components/motion/ListReveal";
import { BulkActionBar } from "@/components/jadwal/BulkActionBar";
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
import {
  copyMessage,
  lockMessage,
  publishMessage,
} from "@/components/jadwal/messages";
import {
  groupSelection,
  monthSelectableIds,
  summarizeSelection,
  weekSelectableIds,
} from "@/components/jadwal/selection";
import { Card, CardHeader, Checkbox, Spinner } from "@/components/ui";
import { errorMessage, api } from "@/lib/api";
import { useActiveClass } from "@/lib/active-class";
import { useAuth } from "@/lib/auth-context";
import { useMonthNavigator } from "@/hooks/useMonthNavigator";
import { useClassRoster } from "@/hooks/useClassRoster";
import { monthRange, todayInWib } from "@/lib/date";
import type { BulkRowAction, ScheduleDayDto, WeekScheduleDto } from "@/types/schedule";

export const Route = createFileRoute("/_app/jadwal")({
  component: ScheduleAdminPage,
});

/** Pesan banner sukses / gagal di atas toolbar. */
interface Banner {
  kind: "ok" | "error";
  text: string;
}

/** Array kosong yang identitasnya stabil — supaya `useMemo` tidak sia-sia. */
const NO_WEEKS: WeekScheduleDto[] = [];

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
 * Ada dua jalur aksi massal, keduanya lewat checkbox:
 * 1. **Per hari** — centang baris di tabel, lalu Kunci / Publikasi / Buka
 *    kunci hanya untuk hari-hari itu (`/schedules/bulk/*`).
 * 2. **Per kelas** — centang kelas di kartu status, lalu kunci/publikasi
 *    hanya kelas-kelas itu (mengirim `classNames`).
 *
 * Halaman ini hanya menyusun tata letak + query/mutasi. Rendering dipecah ke
 * `src/components/jadwal/*`; kalimat banner ke `messages.ts`; dan logika
 * pemilihan ke `selection.ts`.
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
  const { year, month, shift } = useMonthNavigator(today);

  // Korlas selalu memakai kelasnya sendiri, apa pun pilihan di header.
  const className = isAdmin ? activeClass : (korlasClass ?? activeClass);

  const [banner, setBanner] = useState<Banner | null>(null);
  const [holidayModalOpen, setHolidayModalOpen] = useState(false);
  const [copyModalOpen, setCopyModalOpen] = useState(false);

  /**
   * Pilihan checkbox disimpan mentah; penyaringan dilakukan saat membaca
   * (lihat `selectedIds` & `selectedClasses`). Dengan begitu berpindah bulan
   * atau kelas tidak perlu efek pembersih — id/kelas yang sudah tidak ada di
   * layar otomatis gugur.
   */
  const [rawSelectedIds, setRawSelectedIds] = useState<ReadonlySet<number>>(
    () => new Set(),
  );
  const [rawSelectedClasses, setRawSelectedClasses] = useState<
    ReadonlySet<string>
  >(() => new Set());

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

  /**
   * Siswa kelas yang sedang dilihat — bahan dropdown Petugas & Orang tua.
   * Dimuat sekali per kelas lalu dipakai seluruh baris, bukan per baris.
   */
  const rosterQuery = useClassRoster(className);

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
      setBanner({ kind: "error", text: errorMessage(error, fallback) }),
  });

  /**
   * Cakupan kelas untuk kunci/publikasi bulanan.
   *
   * Tanpa `classNames` → perilaku lama: admin tanpa kelas berarti "semua
   * kelas", korlas berarti kelasnya sendiri.
   */
  const scopeBody = (classNames?: string[]) =>
    classNames
      ? { classNames }
      : isAdmin
        ? {}
        : { className: className! };

  // ── Mutasi ──────────────────────────────────────────────────

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
        petugasStudentId: vars.patch.petugasStudentId ?? null,
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
        text: errorMessage(error, "Gagal menambah hari libur"),
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
      setBanner({ kind: "ok", text: copyMessage(result.data) });
      setCopyModalOpen(false);
      await invalidate();
    },
    onError: (error) =>
      setBanner({
        kind: "error",
        text: errorMessage(error, "Gagal menyalin jadwal"),
      }),
  });

  /**
   * Kunci sebulan penuh. Tanpa `classNames` → semua kelas (admin) atau kelas
   * korlas; dengan `classNames` → hanya kelas yang dicentang di kartu status.
   */
  const lockMutation = useMutation({
    mutationFn: (vars: { classNames?: string[] }) =>
      api.schedules.lock({
        fromDate: monthStart,
        toDate: monthEnd,
        ...scopeBody(vars.classNames),
      }),
    onSuccess: async (result) => {
      setBanner({ kind: "ok", text: lockMessage(result.data) });
      setRawSelectedClasses(new Set());
      await invalidate();
    },
    onError: (error) =>
      setBanner({
        kind: "error",
        text: errorMessage(error, "Gagal mengunci jadwal"),
      }),
  });

  /** Publikasi sebulan penuh — cakupannya sama dengan `lockMutation`. */
  const publishMutation = useMutation({
    mutationFn: (vars: { classNames?: string[] }) =>
      api.schedules.publish({
        year,
        month,
        ...scopeBody(vars.classNames),
      }),
    onSuccess: async (result) => {
      setBanner({ kind: "ok", text: publishMessage(result.data) });
      setRawSelectedClasses(new Set());
      await invalidate();
    },
    onError: (error) =>
      setBanner({
        kind: "error",
        text: errorMessage(error, "Gagal mempublikasi jadwal"),
      }),
  });

  const unlockMutation = useMutation({
    mutationFn: (id: number) => api.schedules.unlock(id),
    ...bannerHandlers("Gagal membuka kunci"),
  });

  /**
   * Aksi massal atas baris terpilih. Ketiga aksi berbagi satu mutasi karena
   * bentuk permintaan & jawabannya identik — yang berbeda hanya endpoint.
   */
  const bulkMutation = useMutation({
    mutationFn: (vars: { action: BulkRowAction; ids: number[] }) => {
      const body = { ids: vars.ids };
      switch (vars.action) {
        case "lock":
          return api.schedules.bulkLock(body);
        case "publish":
          return api.schedules.bulkPublish(body);
        case "unlock":
          return api.schedules.bulkUnlock(body);
      }
    },
    onSuccess: async (result) => {
      setBanner({ kind: "ok", text: result.message });
      // Barisnya sudah berpindah status — pilihan lama tidak lagi bermakna.
      setRawSelectedIds(new Set());
      await invalidate();
    },
    onError: (error) =>
      setBanner({
        kind: "error",
        text: errorMessage(error, "Gagal menjalankan aksi massal"),
      }),
  });

  const busy =
    saveMutation.isPending ||
    deleteMutation.isPending ||
    lockMutation.isPending ||
    publishMutation.isPending ||
    unlockMutation.isPending ||
    bulkMutation.isPending;

  // ── Turunan tampilan ────────────────────────────────────────

  const menus = menusQuery.data ?? [];
  const roster = rosterQuery;
  const weeks = monthQuery.data?.weeks ?? NO_WEEKS;
  const status = statusQuery.data;
  const hasDrafts = (status?.totals.draftCount ?? 0) > 0;

  /** Id yang masih ada di bulan yang tampil — sisa bulan lalu diabaikan. */
  const selectableIds = useMemo(() => monthSelectableIds(weeks), [weeks]);
  const selectedIds = useMemo(() => {
    const available = new Set(selectableIds);
    return new Set([...rawSelectedIds].filter((id) => available.has(id)));
  }, [rawSelectedIds, selectableIds]);

  /** Kelas yang masih ada di ringkasan status. */
  const selectedClasses = useMemo(() => {
    const available = new Set(
      (status?.perClass ?? []).map((item) => item.className),
    );
    return new Set([...rawSelectedClasses].filter((name) => available.has(name)));
  }, [rawSelectedClasses, status]);

  const selection = summarizeSelection(weeks, selectedIds);

  /** Aksi kelas yang sedang berjalan — dibedakan dari aksi bulanan lewat `classNames`. */
  const classActionPending: "lock" | "publish" | null =
    lockMutation.isPending && Boolean(lockMutation.variables?.classNames)
      ? "lock"
      : publishMutation.isPending &&
          Boolean(publishMutation.variables?.classNames)
        ? "publish"
        : null;

  const toggleSelectedId = (id: number) =>
    setRawSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  /** Centang semua baris bulan ini, atau kosongkan bila sudah penuh. */
  const toggleSelectAllDays = () =>
    setRawSelectedIds((prev) => {
      const allSelected =
        selectableIds.length > 0 && selectableIds.every((id) => prev.has(id));
      return allSelected ? new Set() : new Set(selectableIds);
    });

  /** Centang seluruh hari pada satu minggu, atau kosongkan minggu itu. */
  const toggleWeek = (week: WeekScheduleDto) => {
    const ids = weekSelectableIds(week);
    setRawSelectedIds((prev) => {
      const allSelected = ids.length > 0 && ids.every((id) => prev.has(id));
      const next = new Set(prev);
      for (const id of ids) {
        if (allSelected) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  };

  const toggleSelectedClass = (name: string) =>
    setRawSelectedClasses((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  const toggleAllClasses = () => {
    const names = (status?.perClass ?? []).map((item) => item.className);
    setRawSelectedClasses((prev) =>
      names.length > 0 && names.every((name) => prev.has(name))
        ? new Set()
        : new Set(names),
    );
  };

  const selectedClassNames = [...selectedClasses];

  return (
    <>
      <PageHeader
        title="Kelola Jadwal"
        description={
          isAdmin
            ? "Tetapkan menu per kelas. Centang hari atau kelas untuk mengunci & mempublikasi sekaligus — tidak perlu satu per satu."
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
        <FadeIn
          key={banner.text}
          className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
            banner.kind === "ok"
              ? "border-brand-200 bg-brand-50 text-brand-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {banner.text}
        </FadeIn>
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
        selectableCount={selectableIds.length}
        selectedCount={selection.count}
        busy={busy}
        lockPending={lockMutation.isPending}
        publishPending={publishMutation.isPending}
        onShift={shift}
        onLock={() => lockMutation.mutate({})}
        onPublish={() => publishMutation.mutate({})}
        onOpenCopy={() => setCopyModalOpen(true)}
        onOpenHoliday={() => setHolidayModalOpen(true)}
        onToggleSelectAll={toggleSelectAllDays}
      />

      <SchoolStatusSummary
        status={status}
        isPending={statusQuery.isPending}
        isAdmin={isAdmin}
        className={className}
        busy={busy}
        onPublish={() => publishMutation.mutate({})}
        publishing={publishMutation.isPending}
        selectedClasses={selectedClasses}
        onToggleClass={toggleSelectedClass}
        onToggleAllClasses={toggleAllClasses}
        onClearClasses={() => setRawSelectedClasses(new Set())}
        onBulkLock={() =>
          lockMutation.mutate({ classNames: selectedClassNames })
        }
        onBulkPublish={() =>
          publishMutation.mutate({ classNames: selectedClassNames })
        }
        classActionPending={classActionPending}
      />

      {className && monthQuery.isPending && <Spinner />}

      {monthQuery.isError && (
        <Card className="mb-6">
          <p className="px-5 py-6 text-sm text-red-600">{monthQuery.error.message}</p>
        </Card>
      )}

      {/*
        Bilah aksi massal berada **di dalam** wadah daftar minggu supaya
        `sticky bottom-4` benar-benar menempel selama daftar lebih tinggi
        daripada jendela — kalau diletakkan di luar, ia berhenti menempel
        begitu wadah pendeknya habis.
      */}
      <div className="space-y-6">
        {weeks.map((week) => {
          const weekSelection = groupSelection(
            weekSelectableIds(week),
            selectedIds,
          );

          return (
            <Card key={week.startDate}>
              <CardHeader
                title={week.label}
                action={
                  weekSelection.ids.length > 0 ? (
                    <Checkbox
                      label="Pilih minggu ini"
                      checked={weekSelection.allSelected}
                      indeterminate={weekSelection.someSelected}
                      disabled={busy}
                      onChange={() => toggleWeek(week)}
                    />
                  ) : undefined
                }
              />
              {/*
                `DayRow` menggambar `<li>`-nya sendiri sekaligus memakai varian
                animasi dari `ListReveal` — jadi jangan dibungkus `RevealItem`,
                itu akan menghasilkan `<li>` bersarang.
              */}
              <ListReveal as="ul" className="divide-y divide-slate-100">
                {week.days.map((day) => (
                  <DayRow
                    key={day.date}
                    day={day}
                    menus={menus}
                    roster={roster.students}
                    rosterLoading={roster.isLoading}
                    rosterEmpty={roster.isEmpty}
                    busy={busy}
                    canUnlock={isAdmin}
                    selected={
                      day.scheduleId !== null && selectedIds.has(day.scheduleId)
                    }
                    onToggleSelect={toggleSelectedId}
                    className={className}
                    onSave={(target, patch) =>
                      saveMutation.mutate({ day: target, patch })
                    }
                    onUnlock={(id) => unlockMutation.mutate(id)}
                    onDelete={(id) => deleteMutation.mutate(id)}
                  />
                ))}
              </ListReveal>
            </Card>
          );
        })}

        {selection.count > 0 && (
          <BulkActionBar
            summary={selection}
            busy={busy}
            canUnlock={isAdmin}
            pendingAction={
              bulkMutation.isPending ? (bulkMutation.variables?.action ?? null) : null
            }
            onAction={(action) =>
              bulkMutation.mutate({ action, ids: [...selectedIds] })
            }
            onClear={() => setRawSelectedIds(new Set())}
          />
        )}
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
