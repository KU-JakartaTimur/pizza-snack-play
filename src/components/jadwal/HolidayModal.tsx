import { useState, type FormEvent } from "react";
import { Button, Field, Input, Modal } from "@/components/ui";

/** Nilai form hari libur. */
export interface HolidayFormValue {
  date: string;
  name: string;
  description: string;
}

interface HolidayModalProps {
  open: boolean;
  saving: boolean;
  /** Tanggal awal saat modal dibuka (hari ini). */
  defaultDate: string;
  onClose: () => void;
  onSubmit: (value: HolidayFormValue) => void;
}

/**
 * Modal tambah hari libur.
 *
 * Hari libur di tabel `holidays` bersifat **global** — berlaku untuk semua
 * kelas, karena itu hanya admin yang bisa membukanya.
 */
export function HolidayModal({
  open,
  saving,
  defaultDate,
  onClose,
  onSubmit,
}: HolidayModalProps) {
  const [form, setForm] = useState<HolidayFormValue>({
    date: defaultDate,
    name: "",
    description: "",
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    onSubmit({ ...form, name: form.name.trim(), description: form.description.trim() });
    setForm({ date: defaultDate, name: "", description: "" });
  };

  return (
    <Modal
      open={open}
      title="Tambah hari libur"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={handleSubmit} loading={saving} type="submit">
            Simpan
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Tanggal">
          <Input
            type="date"
            value={form.date}
            onChange={(event) => setForm({ ...form, date: event.target.value })}
          />
        </Field>

        <Field label="Nama hari libur">
          <Input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="mis. Hari Kemerdekaan RI"
            autoFocus
          />
        </Field>

        <Field label="Keterangan" hint="Opsional.">
          <Input
            value={form.description}
            onChange={(event) =>
              setForm({ ...form, description: event.target.value })
            }
            placeholder="mis. Libur nasional"
          />
        </Field>
      </form>
    </Modal>
  );
}
