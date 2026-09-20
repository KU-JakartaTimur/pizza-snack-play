import { useState } from "react";
import { Button, Field, Input, Modal } from "@/components/ui";
import { addDays, endOfWeek, formatWeekLabel, startOfWeek } from "@/lib/date";

/** Nilai form salin Sepekan. */
export interface CopyFormValue {
  fromDate: string;
  toDate: string;
  overwrite: boolean;
}

interface CopyWeekModalProps {
  open: boolean;
  saving: boolean;
  /** Hari ini (WIB) — dipakai sebagai titik awal minggu sumber. */
  today: string;
  onClose: () => void;
  onSubmit: (value: CopyFormValue) => void;
}

/**
 * Modal "Salin Sepekan" — menyalin menu Senin–Jumat antar minggu
 * untuk kelas yang sedang ditampilkan.
 */
export function CopyWeekModal({
  open,
  saving,
  today,
  onClose,
  onSubmit,
}: CopyWeekModalProps) {
  const [form, setForm] = useState<CopyFormValue>(() => ({
    fromDate: startOfWeek(today),
    toDate: addDays(startOfWeek(today), 7),
    overwrite: false,
  }));

  // Minggu sumber & tujuan dianggap sama bila Senin-nya sama.
  const sameWeek = startOfWeek(form.fromDate) === startOfWeek(form.toDate);

  return (
    <Modal
      open={open}
      title="Salin jadwal Sepekan"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button
            onClick={() => onSubmit(form)}
            loading={saving}
            disabled={sameWeek}
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
          startOfWeek(form.fromDate),
          endOfWeek(form.fromDate),
        )}
      >
        <Input
          type="date"
          value={form.fromDate}
          onChange={(event) => setForm({ ...form, fromDate: event.target.value })}
        />
      </Field>

      <Field
        label="Minggu tujuan"
        hint={formatWeekLabel(startOfWeek(form.toDate), endOfWeek(form.toDate))}
      >
        <Input
          type="date"
          value={form.toDate}
          onChange={(event) => setForm({ ...form, toDate: event.target.value })}
        />
      </Field>

      {sameWeek && (
        <p className="rounded-lg border border-highlight-200 bg-highlight-50 px-3 py-2 text-xs text-highlight-800">
          Minggu sumber dan tujuan sama — pilih tanggal di minggu yang berbeda.
        </p>
      )}

      <label className="flex items-start gap-2.5 rounded-lg border border-slate-200 px-3 py-2.5">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 accent-brand-600"
          checked={form.overwrite}
          onChange={(event) => setForm({ ...form, overwrite: event.target.checked })}
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
  );
}
