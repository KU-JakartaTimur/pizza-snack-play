import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarOff,
  ChevronLeft,
  ChevronRight,
  Copy,
  Lock,
  Plus,
  Send,
  Trash2,
  Unlock,
} from "lucide-react";
import { RoleGate } from "@/components/AdminOnly";
import { PageHeader } from "@/components/AppShell";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Field,
  Input,
  Modal,
  Select,
  Spinner,
} from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { useActiveClass } from "@/lib/active-class";
import { useAuth } from "@/lib/auth-context";
import {
  addDays,
  endOfWeek,
  formatCompactDate,
  formatWeekLabel,
  indonesianMonthName,
  monthOf,
  startOfWeek,
  todayInWib,
  yearOf,
} from "@/lib/date";
import type { ScheduleDayDto, ScheduleStatus } from "@/types/schedule";

export const Route = createFileRoute("/_app/jadwal")({
  component: ScheduleAdminPage,
});

const NO_MENU = "";

/** Label dan warna badge untuk tiap status jadwal. */
const STATUS_META: Record<
  ScheduleStatus,
  { label: string; tone: "neutral" | "warning" | "success" }
> = {
  draft: { label: "Draft", tone: "neutral" },
  locked: { label: "Terkunci", tone: "warning" },
  published: { label: "Dipublikasi", tone: "success" },
};

/**
 * Halaman kelola jadwal — admin dan korlas.
 *
 * Admin memilih kelas lewat pemilih kelas di header; korlas terkunci ke
 * kelas yang dikoordinasinya (pembatasan sebenarnya tetap di API).
 *
 * Pembagiannya: korlas boleh menyusun jadwal kelasnya (menu, petugas, catatan,
 * Salin Sepekan) selama barisnya masih `draft`, lalu **mempublikasikannya**.
 * Kunci & buka kunci jadwal tetap di tangan admin, dan baris `locked`/
 * `published` tidak dapat diubah siapa pun.
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

  // Pemilih kelas di header menentukan kelas mana yang ditampilkan berbaris,
  // sementara kunci & publikasi admin berlaku untuk **semua kelas** (lihat
  // `lockMutation`/`publishMutation` di bawah). Karena itu tabel tetap dimuat
  // per kelas, tetapi penghitung status memakai `schoolQuery` lintas kelas.
  const [year, setYear] = useState(() => yearOf(today));
  const [month, setMonth] = useState(() => monthOf(today));
  const [banner, setBanner] = useState<{ kind: "ok" | "error"; text: string } | null>(
    null,
  );
  const [holidayModalOpen, setHolidayModalOpen] = useState(false);
  const [holidayForm, setHolidayForm] = useState({
    date: today,
    name: "",
    description: "",
  });
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  // Default: salin ahad ini ke ahad depan.
  const [copyForm, setCopyForm] = useState(() => ({
    fromDate: startOfWeek(today),
    toDate: addDays(startOfWeek(today), 7),
    overwrite: false,
  }));

  const monthQuery = useQuery({
    queryKey: ["schedules", "month", year, month, className],
    queryFn: () => api.schedules.month(year, month, className),
    // Tanpa kelas terpilih belum ada jadwal yang bisa ditampilkan.
    enabled: Boolean(className),
  });

  const menusQuery = useQuery({
    queryKey: ["menus", "active"],
    queryFn: () => api.menus.list({ active: true }),
  });

  const holidaysQuery = useQuery({
    queryKey: ["holidays"],
    queryFn: () => api.holidays.list(),
    // Kartu & tombol hari libur hanya tampil untuk admin.
    enabled: isAdmin,
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["schedules"] });
    await queryClient.invalidateQueries({ queryKey: ["holidays"] });
    await queryClient.invalidateQueries({ queryKey: ["stats"] });
  };
  const saveMutation = useMutation({
    mutationFn: async (vars: {
      day: ScheduleDayDto;
      patch: {
        menuId?: number | null;
        isHoliday?: boolean;
        petugasName?: string | null;
        petugasParentName?: string | null;
        notes?: string | null;
      };
    }) => {
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
    onSuccess: async (result) => {
      setBanner({ kind: "ok", text: result.message });
      await invalidate();
    },
    onError: (error) =>
      setBanner({
        kind: "error",
        text: error instanceof ApiError ? error.message : "Gagal menyimpan jadwal",
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.schedules.remove(id),
    onSuccess: async (result) => {
      setBanner({ kind: "ok", text: result.message });
      await invalidate();
    },
    onError: (error) =>
      setBanner({
        kind: "error",
        text: error instanceof ApiError ? error.message : "Gagal menghapus jadwal",
      }),
  });

  const holidayMutation = useMutation({
    mutationFn: () =>
      api.holidays.create({
        date: holidayForm.date,
        name: holidayForm.name.trim(),
        description: holidayForm.description.trim() || undefined,
      }),
    onSuccess: async (result) => {
      setBanner({ kind: "ok", text: result.message });
      setHolidayModalOpen(false);
      setHolidayForm({ date: today, name: "", description: "" });
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
    onSuccess: async (result) => {
      setBanner({ kind: "ok", text: result.message });
      await invalidate();
    },
    onError: (error) =>
      setBanner({
        kind: "error",
        text: error instanceof ApiError ? error.message : "Gagal menghapus",
      }),
  });

  const copyMutation = useMutation({
    mutationFn: () =>
      api.schedules.copy({
        fromDate: copyForm.fromDate,
        toDate: copyForm.toDate,
        className: className!,
        overwrite: copyForm.overwrite,
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

  // Minggu sumber & tujuan dianggap sama bila Senin-nya sama.
  const copySameWeek =
    startOfWeek(copyForm.fromDate) === startOfWeek(copyForm.toDate);

  // ── Kunci & Publikasi ────────────────────────────────────────
  // Rentang tanggal bulan yang sedang ditampilkan — dipakai untuk
  // mengunci seluruh bulan sekaligus.
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

  /**
   * Status jadwal bulan ini untuk **seluruh kelas**.
   *
   * Kunci & publikasi oleh admin menyentuh kelas 1–6 sekaligus, jadi
   * penghitungnya pun harus lintas kelas — kalau tidak, tombol "Publikasi"
   * bisa tampak aktif padahal masih ada kelas lain yang menyisakan draft.
   * Korlas tetap memakai data kelasnya sendiri (tanpa permintaan tambahan).
   */
  const schoolQuery = useQuery({
    queryKey: ["schedules", "school-status", year, month],
    queryFn: async () => {
      const classes = (await api.classes.list()).classes;
      const months = await Promise.all(
        classes.map((item) => api.schedules.month(year, month, item)),
      );

      const days = months.flatMap((data) =>
        data.weeks.flatMap((week) => week.days),
      );
      const scheduled = days.filter((day) => day.scheduleId !== null);

      return {
        classes,
        draftCount: scheduled.filter((day) => day.status === "draft").length,
        lockedCount: scheduled.filter((day) => day.status === "locked").length,
        publishedCount: scheduled.filter((day) => day.status === "published")
          .length,
        /** Kelas yang masih menyisakan draft — untuk pesan yang informatif. */
        draftClasses: [
          ...new Set(
            scheduled
              .filter((day) => day.status === "draft")
              .map((day) => day.className ?? "")
              .filter(Boolean),
          ),
        ],
      };
    },
    enabled: isAdmin,
  });

  // Hitung status jadwal dari data bulanan kelas yang sedang ditampilkan.
  const allDays = monthQuery.data?.weeks.flatMap((w) => w.days) ?? [];
  const schedDays = allDays.filter((d) => d.scheduleId !== null);

  // Admin melihat angka sekolah-wide; korlas cukup kelasnya sendiri.
  const draftCount = isAdmin
    ? (schoolQuery.data?.draftCount ?? 0)
    : schedDays.filter((d) => d.status === "draft").length;
  const lockedCount = isAdmin
    ? (schoolQuery.data?.lockedCount ?? 0)
    : schedDays.filter((d) => d.status === "locked").length;
  const publishedCount = isAdmin
    ? (schoolQuery.data?.publishedCount ?? 0)
    : schedDays.filter((d) => d.status === "published").length;

  // Kelas yang menahan publikasi — hanya bermakna untuk admin.
  const draftClasses = schoolQuery.data?.draftClasses ?? [];
  const canPublish = draftCount === 0 && lockedCount > 0;

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
      const scope = isAdmin
        ? `semua kelas (${classes.length} kelas)`
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
      const { published, classes } = result.data;
      const scope = isAdmin
        ? `semua kelas (${classes.length} kelas)`
        : `kelas ${classes[0] ?? className}`;
      setBanner({
        kind: "ok",
        text: `${published} jadwal dipublikasi untuk ${scope} — sekarang terlihat oleh orang tua semua kelas tersebut.`,
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
    onSuccess: async (result) => {
      setBanner({ kind: "ok", text: result.message });
      await invalidate();
    },
    onError: (error) =>
      setBanner({
        kind: "error",
        text: error instanceof ApiError ? error.message : "Gagal membuka kunci",
      }),
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

  const handleHolidaySubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!holidayForm.name.trim()) return;
    holidayMutation.mutate();
  };

  const menus = menusQuery.data ?? [];
  const busy =
    saveMutation.isPending ||
    deleteMutation.isPending ||
    lockMutation.isPending ||
    publishMutation.isPending ||
    unlockMutation.isPending;

  return (
    <>
      <PageHeader
        title="Kelola Jadwal"
        description={
          isAdmin
            ? "Tetapkan menu per kelas. Kunci & publikasi berlaku untuk semua kelas (1–6) sekaligus."
            : className
              ? `Tetapkan menu, tandai libur kelas, dan tambahkan catatan untuk kelas ${className}.`
              : "Tetapkan menu dan catatan per hari."
        }
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              disabled={!className || draftCount === 0 || busy}
              onClick={() => lockMutation.mutate()}
              loading={lockMutation.isPending}
              title={
                isAdmin
                  ? "Kunci semua jadwal draft bulan ini untuk semua kelas (kelas 1–6)"
                  : `Kunci semua jadwal draft bulan ini untuk kelas ${className ?? ""}`.trim()
              }
            >
              <Lock className="h-4 w-4" />
              {isAdmin ? "Kunci bulan (semua kelas)" : "Kunci bulan"}
            </Button>
            <Button
              disabled={!className || !canPublish || busy}
              onClick={() => publishMutation.mutate()}
              loading={publishMutation.isPending}
              title={
                draftCount > 0
                  ? isAdmin && draftClasses.length > 0
                    ? `Masih ada jadwal draft di ${draftClasses.map((cls) => `kelas ${cls}`).join(", ")} — kunci dulu`
                    : "Masih ada jadwal draft — kunci dulu"
                  : isAdmin
                    ? "Publikasi jadwal yang sudah dikunci ke orang tua semua kelas"
                    : "Publikasi jadwal yang sudah dikunci ke semua orang tua"
              }
            >
              <Send className="h-4 w-4" />
              {isAdmin ? "Publikasi (semua kelas)" : "Publikasi"}
            </Button>
            <Button
              variant="secondary"
              disabled={!className}
              onClick={() => setCopyModalOpen(true)}
              title="Salin jadwal Senin–Jumat untuk kelas yang sedang ditampilkan"
            >
              <Copy className="h-4 w-4" />
              Salin Sepekan
            </Button>
            {/* Hari libur di tabel `holidays` bersifat global (semua kelas). */}
            {isAdmin && (
              <Button variant="secondary" onClick={() => setHolidayModalOpen(true)}>
                <Plus className="h-4 w-4" />
                Hari libur
              </Button>
            )}
          </div>
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

      <Card className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => shift(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-40 text-center font-semibold text-slate-900">
              {indonesianMonthName(month)} {year}
            </span>
            <Button variant="secondary" size="sm" onClick={() => shift(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-slate-500">
            {menusQuery.isPending
              ? "Memuat menu…"
              : `${menus.length} menu aktif tersedia`}
          </p>
        </div>
        {className && (isAdmin ? publishedCount + lockedCount + draftCount > 0 : schedDays.length > 0) && (
          <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 px-5 py-2.5 text-xs">
            <span className="text-slate-500">
              Status{" "}
              {isAdmin && (
                <span className="font-medium text-slate-600">(semua kelas)</span>
              )}
              {": "}
              <span className="font-medium text-slate-700">{draftCount}</span> draft
              {" · "}
              <span className="font-medium text-slate-700">{lockedCount}</span> terkunci
              {" · "}
              <span className="font-medium text-slate-700">{publishedCount}</span> dipublikasi
            </span>
            {draftCount > 0 && (
              <span className="text-highlight-700">
                {isAdmin && draftClasses.length > 0
                  ? `Kunci dulu kelas ${draftClasses.join(", ")} sebelum publikasi`
                  : "Kunci dulu sebelum publikasi"}
              </span>
            )}
          </div>
        )}
      </Card>

      {className && monthQuery.isPending && <Spinner />}

      {monthQuery.isError && (
        <Card className="mb-6">
          <p className="px-5 py-6 text-sm text-red-600">
            {monthQuery.error.message}
          </p>
        </Card>
      )}

      <div className="space-y-6">
        {monthQuery.data?.weeks.map((week) => (
          <Card key={week.startDate}>
            <CardHeader title={week.label} />
            <ul className="divide-y divide-slate-100">
              {week.days.map((day) => {
                const dayLocked =
                  day.status === "locked" || day.status === "published";
                return (
                <li
                  key={day.date}
                  className="flex flex-wrap items-center gap-3 px-5 py-3"
                >
                  <div className="w-32 shrink-0">
                    <p
                      className={`text-sm font-medium ${
                        day.isToday ? "text-highlight-700" : "text-slate-800"
                      }`}
                    >
                      {day.dayName}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatCompactDate(day.date)}
                    </p>
                  </div>

                  {day.status && (
                    <Badge tone={STATUS_META[day.status].tone}>
                      {STATUS_META[day.status].label}
                    </Badge>
                  )}

                  {day.isHoliday ? (
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <Badge tone="warning">
                        <CalendarOff className="h-3 w-3" />
                        {day.holidayName ?? "Libur"}
                      </Badge>
                    </div>
                  ) : (
                    <Select
                      className="min-w-0 flex-1"
                      value={day.menu?.id ?? NO_MENU}
                      disabled={busy || dayLocked}
                      onChange={(event) => {
                        const value = event.target.value;
                        saveMutation.mutate({
                          day,
                          patch: {
                            menuId: value === NO_MENU ? null : Number(value),
                          },
                        });
                      }}
                    >
                      <option value={NO_MENU}>— belum ada menu —</option>
                      {menus.map((menu) => (
                        <option key={menu.id} value={menu.id}>
                          {menu.name}
                        </option>
                      ))}
                    </Select>
                  )}

                  {!day.isHoliday && (
                    <>
                      <Input
                        className="w-36 shrink-0"
                        placeholder="Petugas…"
                        defaultValue={day.petugasName ?? ""}
                        disabled={busy}
                        onBlur={(event) => {
                          const value = event.target.value.trim();
                          if (value === (day.petugasName ?? "")) return;
                          saveMutation.mutate({
                            day,
                            patch: { petugasName: value || null },
                          });
                        }}
                      />
                      <Input
                        className="w-36 shrink-0"
                        placeholder="Orang tua…"
                        defaultValue={day.petugasParentName ?? ""}
                        disabled={busy}
                        onBlur={(event) => {
                          const value = event.target.value.trim();
                          if (value === (day.petugasParentName ?? "")) return;
                          saveMutation.mutate({
                            day,
                            patch: { petugasParentName: value || null },
                          });
                        }}
                      />
                    </>
                  )}

                  <Input
                    className="w-48 shrink-0"
                    placeholder="Catatan…"
                    defaultValue={day.notes ?? ""}
                    disabled={busy || dayLocked}
                    onBlur={(event) => {
                      const value = event.target.value.trim();
                      if (value === (day.notes ?? "")) return;
                      saveMutation.mutate({
                        day,
                        patch: { notes: value || null },
                      });
                    }}
                  />

                  <div className="flex shrink-0 gap-1">
                    {dayLocked && isAdmin && day.scheduleId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onClick={() => {
                          if (confirm(`Buka kunci jadwal ${day.date}?`)) {
                            unlockMutation.mutate(day.scheduleId!);
                          }
                        }}
                        title="Buka kunci jadwal"
                      >
                        <Unlock className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busy || dayLocked}
                      onClick={() =>
                        saveMutation.mutate({
                          day,
                          patch: { isHoliday: !day.isHoliday },
                        })
                      }
                      title={
                        day.isHoliday
                          ? `Batalkan libur kelas ${className ?? ""}`.trim()
                          : `Tandai libur kelas ${className ?? ""}`.trim()
                      }
                    >
                      <CalendarOff
                        className={`h-4 w-4 ${
                          day.isHoliday ? "text-highlight-700" : "text-slate-400"
                        }`}
                      />
                    </Button>
                    {day.scheduleId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        disabled={busy || dayLocked}
                        onClick={() => {
                          if (confirm(`Hapus jadwal ${day.date}?`)) {
                            deleteMutation.mutate(day.scheduleId!);
                          }
                        }}
                        title="Hapus jadwal"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </li>
                );
              })}
            </ul>
          </Card>
        ))}
      </div>

      {isAdmin && (
        <Card className="mt-6">
          <CardHeader
            title="Hari Libur"
            description="Tanggal yang ditandai libur berlaku untuk semua kelas dan muncul di semua halaman jadwal."
          />
          {holidaysQuery.data && holidaysQuery.data.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {holidaysQuery.data.map((holiday) => (
                <li
                  key={holiday.id}
                  className="flex items-center justify-between gap-4 px-5 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {holiday.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatCompactDate(holiday.date)}
                      {holiday.description ? ` · ${holiday.description}` : ""}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => deleteHolidayMutation.mutate(holiday.id)}
                    title="Hapus"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-4 text-sm text-slate-500">
              Belum ada hari libur khusus.
            </p>
          )}
        </Card>
      )}

      <Modal
        open={holidayModalOpen}
        title="Tambah hari libur"
        onClose={() => setHolidayModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setHolidayModalOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleHolidaySubmit}
              loading={holidayMutation.isPending}
              type="submit"
            >
              Simpan
            </Button>
          </>
        }
      >
        <form onSubmit={handleHolidaySubmit} className="space-y-4">
          <Field label="Tanggal">
            <Input
              type="date"
              value={holidayForm.date}
              onChange={(event) =>
                setHolidayForm({ ...holidayForm, date: event.target.value })
              }
            />
          </Field>

          <Field label="Nama hari libur">
            <Input
              value={holidayForm.name}
              onChange={(event) =>
                setHolidayForm({ ...holidayForm, name: event.target.value })
              }
              placeholder="mis. Hari Kemerdekaan RI"
              autoFocus
            />
          </Field>

          <Field label="Keterangan" hint="Opsional.">
            <Input
              value={holidayForm.description}
              onChange={(event) =>
                setHolidayForm({ ...holidayForm, description: event.target.value })
              }
              placeholder="mis. Libur nasional"
            />
          </Field>
        </form>
      </Modal>

      <Modal
        open={copyModalOpen}
        title="Salin jadwal Sepekan"
        onClose={() => setCopyModalOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setCopyModalOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={() => copyMutation.mutate()}
              loading={copyMutation.isPending}
              disabled={copySameWeek}
            >
              Salin sekarang
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Menyalin menu Senin–Jumat dari minggu sumber ke minggu tujuan. Hari di
          minggu tujuan yang belum punya jadwal akan dibuatkan otomatis.
        </p>

        <Field
          label="Minggu sumber"
          hint={formatWeekLabel(
            startOfWeek(copyForm.fromDate),
            endOfWeek(copyForm.fromDate),
          )}
        >
          <Input
            type="date"
            value={copyForm.fromDate}
            onChange={(event) =>
              setCopyForm({ ...copyForm, fromDate: event.target.value })
            }
          />
        </Field>

        <Field
          label="Minggu tujuan"
          hint={formatWeekLabel(
            startOfWeek(copyForm.toDate),
            endOfWeek(copyForm.toDate),
          )}
        >
          <Input
            type="date"
            value={copyForm.toDate}
            onChange={(event) =>
              setCopyForm({ ...copyForm, toDate: event.target.value })
            }
          />
        </Field>

        {copySameWeek && (
          <p className="rounded-lg border border-highlight-200 bg-highlight-50 px-3 py-2 text-xs text-highlight-800">
            Minggu sumber dan tujuan sama — pilih tanggal di minggu yang berbeda.
          </p>
        )}

        <label className="flex items-start gap-2.5 rounded-lg border border-slate-200 px-3 py-2.5">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-brand-600"
            checked={copyForm.overwrite}
            onChange={(event) =>
              setCopyForm({ ...copyForm, overwrite: event.target.checked })
            }
          />
          <span>
            <span className="block text-sm font-medium text-slate-800">
              Timpa jadwal yang sudah ada
            </span>
            <span className="block text-xs text-slate-500">
              Bila tidak dicentang, hari yang sudah punya jadwal akan dilewati.
            </span>
          </span>
        </label>
      </Modal>
    </>
  );
}
