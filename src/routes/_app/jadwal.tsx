import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarOff,
  ChevronLeft,
  ChevronRight,
  Copy,
  Plus,
  Trash2,
} from "lucide-react";
import { AdminOnly } from "@/components/AdminOnly";
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
import type { ScheduleDayDto } from "@/types/schedule";

export const Route = createFileRoute("/_app/jadwal")({
  component: ScheduleAdminPage,
});

const NO_MENU = "";

function ScheduleAdminPage() {
  return (
    <AdminOnly>
      <ScheduleAdminContent />
    </AdminOnly>
  );
}

function ScheduleAdminContent() {
  const queryClient = useQueryClient();
  const today = todayInWib();

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
  // Default: salin minggu ini ke minggu depan.
  const [copyForm, setCopyForm] = useState(() => ({
    fromDate: startOfWeek(today),
    toDate: addDays(startOfWeek(today), 7),
    overwrite: false,
  }));

  const monthQuery = useQuery({
    queryKey: ["schedules", "month", year, month],
    queryFn: () => api.schedules.month(year, month),
  });

  const menusQuery = useQuery({
    queryKey: ["menus", "active"],
    queryFn: () => api.menus.list({ active: true }),
  });

  const holidaysQuery = useQuery({
    queryKey: ["holidays"],
    queryFn: () => api.holidays.list(),
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["schedules"] });
    await queryClient.invalidateQueries({ queryKey: ["holidays"] });
    await queryClient.invalidateQueries({ queryKey: ["stats"] });
  };

  const saveMutation = useMutation({
    mutationFn: async (vars: {
      day: ScheduleDayDto;
      patch: { menuId?: number | null; isHoliday?: boolean; notes?: string | null };
    }) => {
      // Hari yang belum punya entri → buat baru; selebihnya → perbarui.
      if (vars.day.scheduleId) {
        return api.schedules.update(vars.day.scheduleId, vars.patch);
      }
      return api.schedules.create({
        scheduleDate: vars.day.date,
        menuId: vars.patch.menuId ?? null,
        isHoliday: vars.patch.isHoliday ?? false,
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
  const busy = saveMutation.isPending || deleteMutation.isPending;

  return (
    <>
      <PageHeader
        title="Kelola Jadwal"
        description="Tetapkan menu, tandai hari libur, dan tambahkan catatan per hari."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setCopyModalOpen(true)}>
              <Copy className="h-4 w-4" />
              Salin minggu
            </Button>
            <Button variant="secondary" onClick={() => setHolidayModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Hari libur
            </Button>
          </div>
        }
      />

      {banner && (
        <div
          className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
            banner.kind === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
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
      </Card>

      {monthQuery.isPending && <Spinner />}

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
              {week.days.map((day) => (
                <li
                  key={day.date}
                  className="flex flex-wrap items-center gap-3 px-5 py-3"
                >
                  <div className="w-32 shrink-0">
                    <p
                      className={`text-sm font-medium ${
                        day.isToday ? "text-emerald-700" : "text-slate-800"
                      }`}
                    >
                      {day.dayName}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatCompactDate(day.date)}
                    </p>
                  </div>

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
                      disabled={busy}
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

                  <Input
                    className="w-48 shrink-0"
                    placeholder="Catatan…"
                    defaultValue={day.notes ?? ""}
                    disabled={busy}
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
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busy}
                      onClick={() =>
                        saveMutation.mutate({
                          day,
                          patch: { isHoliday: !day.isHoliday },
                        })
                      }
                      title={day.isHoliday ? "Batalkan libur" : "Tandai libur"}
                    >
                      <CalendarOff
                        className={`h-4 w-4 ${
                          day.isHoliday ? "text-amber-600" : "text-slate-400"
                        }`}
                      />
                    </Button>
                    {day.scheduleId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        disabled={busy}
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
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Hari Libur"
          description="Tanggal yang ditandai libur akan muncul di semua halaman jadwal."
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
        title="Salin jadwal antar minggu"
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
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Minggu sumber dan tujuan sama — pilih tanggal di minggu yang berbeda.
          </p>
        )}

        <label className="flex items-start gap-2.5 rounded-lg border border-slate-200 px-3 py-2.5">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-emerald-600"
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
