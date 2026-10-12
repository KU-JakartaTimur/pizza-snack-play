import { MonthNavigator } from "@/components/MonthNavigator";
import { Card, Field, Select } from "@/components/ui";
import type { StudentProfile } from "@/types/auth";

/**
 * Bilah atas halaman Pilih Jadwal: navigasi bulan, pilihan "atas nama anak",
 * dan dua penghitung cepat (masih kosong / pilihan saya).
 *
 * Anak hanya bisa dipilih bila ada lebih dari satu di kelas yang tampil —
 * satu anak berarti pemilihnya cuma menambah baris tanpa pilihan.
 */
export function PickToolbar({
  year,
  month,
  onShift,
  students,
  studentId,
  onStudentChange,
  availableCount,
  myClaimCount,
}: {
  year: number;
  month: number;
  onShift: (delta: number) => void;
  /** Anak di kelas yang sedang tampil. */
  students: StudentProfile[];
  /** Anak yang sedang diwakili; `null` bila belum ada pilihan yang cocok. */
  studentId: number | null;
  onStudentChange: (studentId: number | null) => void;
  availableCount: number;
  myClaimCount: number;
}) {
  return (
    <Card className="mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
        <MonthNavigator year={year} month={month} onShift={onShift} />

        <div className="flex flex-wrap items-end gap-4">
          {students.length > 1 && (
            <div className="w-48">
              <Field label="Atas nama anak">
                <Select
                  value={studentId ?? ""}
                  onChange={(event) =>
                    onStudentChange(
                      event.target.value ? Number(event.target.value) : null,
                    )
                  }
                >
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          )}

          <div className="flex gap-4 text-sm">
            <Counter label="Masih kosong" value={availableCount} tone="accent" />
            <Counter label="Pilihan saya" value={myClaimCount} tone="brand" />
          </div>
        </div>
      </div>
    </Card>
  );
}

/** Angka ringkasan di bilah atas: nilai besar + label kecil di bawahnya. */
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
