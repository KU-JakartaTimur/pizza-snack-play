import { Plus, X } from "lucide-react";
import {
  Button,
  Field,
  Input,
  Modal,
  Select,
} from "@/components/ui";
import type { ParentDto } from "@/types/account";
import {
  type FormStudent,
  type ParentForm,
  RELATIONSHIP_OPTIONS,
  ROLE_OPTIONS,
} from "./form";

interface ParentFormModalProps {
  open: boolean;
  /** Akun yang sedang diubah; `null` = membuat akun baru. */
  editing: ParentDto | null;
  form: ParentForm;
  formError: string | null;
  submitting: boolean;
  /** Perbarui satu atau beberapa field form. */
  onChange: (patch: Partial<ParentForm>) => void;
  onStudentChange: (index: number, patch: Partial<FormStudent>) => void;
  onAddStudent: () => void;
  onRemoveStudent: (index: number) => void;
  onSubmit: () => void;
  onClose: () => void;
}

/**
 * Modal pembuatan/perubahan akun orang tua.
 *
 * Tampilan murni: seluruh state (`form`) dan validasi tetap dipegang oleh
 * orchestrator `orang-tua`, sehingga modal ini hanya merender field dan
 * meneruskan perubahan lewat callback — tidak punya logic bisnis sendiri.
 */
export function ParentFormModal({
  open,
  editing,
  form,
  formError,
  submitting,
  onChange,
  onStudentChange,
  onAddStudent,
  onRemoveStudent,
  onSubmit,
  onClose,
}: ParentFormModalProps) {
  return (
    <Modal
      open={open}
      title={editing ? "Ubah akun orang tua" : "Akun orang tua baru"}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={onSubmit} loading={submitting} type="submit">
            Simpan
          </Button>
        </>
      }
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
        className="space-y-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Username" hint="Huruf kecil, angka, titik, - atau _">
            <Input
              value={form.username}
              onChange={(event) => onChange({ username: event.target.value })}
              placeholder="mis. sari"
              autoComplete="off"
            />
          </Field>

          <Field
            label={editing ? "Password baru" : "Password"}
            hint={editing ? "Kosongkan bila tidak diubah" : "Minimal 8 karakter"}
          >
            <Input
              type="password"
              value={form.password}
              onChange={(event) => onChange({ password: event.target.value })}
              autoComplete="new-password"
            />
          </Field>

          <Field label="Nama orang tua">
            <Input
              value={form.parentName}
              onChange={(event) => onChange({ parentName: event.target.value })}
              placeholder="mis. Sari Wulandari"
            />
          </Field>

          <Field label="Hubungan">
            <Select
              value={form.relationship}
              onChange={(event) =>
                onChange({
                  relationship: event.target
                    .value as ParentForm["relationship"],
                })
              }
            >
              {RELATIONSHIP_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Peran"
            hint="Korlas boleh mengubah jadwal kelasnya sendiri dan mengelola katalog menu."
          >
            <Select
              value={form.role}
              onChange={(event) =>
                onChange({ role: event.target.value as ParentForm["role"] })
              }
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>

          {form.role === "korlas" && (
            <Field
              label="Kelas yang dikoordinasi"
              hint="Mis. 1A. Korlas hanya dapat mengubah jadwal kelas ini."
            >
              <Input
                value={form.className}
                onChange={(event) => onChange({ className: event.target.value })}
                placeholder="1A"
              />
            </Field>
          )}

          <Field label="No. HP" hint="Opsional.">
            <Input
              value={form.phone}
              onChange={(event) => onChange({ phone: event.target.value })}
              placeholder="08xxxxxxxxxx"
            />
          </Field>

          <Field label="Email" hint="Opsional.">
            <Input
              type="email"
              value={form.email}
              onChange={(event) => onChange({ email: event.target.value })}
              placeholder="nama@contoh.com"
            />
          </Field>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-slate-700">
              Anak
              <span className="ml-1.5 text-xs font-normal text-slate-400">
                boleh lebih dari satu
              </span>
            </span>
            <Button variant="ghost" size="sm" type="button" onClick={onAddStudent}>
              <Plus className="h-3.5 w-3.5" />
              Tambah anak
            </Button>
          </div>

          <div className="space-y-2">
            {form.students.map((student, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={student.name}
                  onChange={(event) =>
                    onStudentChange(index, { name: event.target.value })
                  }
                  placeholder={`Nama anak ${index + 1}`}
                  className="min-w-0 flex-1"
                />
                <Input
                  value={student.className}
                  onChange={(event) =>
                    onStudentChange(index, { className: event.target.value })
                  }
                  placeholder="Kelas"
                  className="w-28 shrink-0"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  className="shrink-0 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  onClick={() => onRemoveStudent(index)}
                  disabled={form.students.length === 1}
                  title="Hapus anak"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {formError && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </p>
        )}
      </form>
    </Modal>
  );
}
