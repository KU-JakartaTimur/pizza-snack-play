import { useState } from "react";
import { AlertTriangle, ClipboardPaste, Info } from "lucide-react";
import { Badge, Button, Field, Modal, Textarea } from "@/components/ui";
import type { ImportScheduleResultDto } from "@/types/schedule";

/** Bentuk teks yang diharapkan, dipakai sebagai contoh di dalam kotak tempel. */
const PLACEHOLDER = `1 - 2 Oktober 2026
Kamis   : Puding Roti + jeruk
Jumat   : Libur

3 - 9 Oktober 2026
Senin   : Pisang kukus + Melon
Selasa  : Bubur kacang hijau + pisang`;

interface ImportDialogProps {
  open: boolean;
  isAdmin: boolean;
  /** Kelas yang sedang ditampilkan — dipakai menyebut cakupan korlas. */
  className: string | null;
  previewing: boolean;
  applying: boolean;
  /** Hasil pratinjau terakhir; `null` sebelum ada pratinjau. */
  preview: ImportScheduleResultDto | null;
  onClose: () => void;
  onPreview: (text: string) => void;
  onApply: (text: string) => void;
}

/**
 * Modal impor jadwal dari teks tempelan (admin & korlas).
 *
 * Sengaja **dua langkah**: "Pratinjau" dulu, baru "Impor". Teks yang salah
 * baca tidak boleh langsung mengubah jadwal yang dilihat seluruh orang tua —
 * jadi hasil pembacaannya ditampilkan lebih dulu (tanggal hasil pencocokan
 * nama hari, menu yang dikenali, dan baris yang akan dilewati). Pratinjau
 * dibuang begitu teksnya diubah, supaya yang diterapkan selalu sesuai dengan
 * yang terlihat.
 */
export function ImportDialog({
  open,
  isAdmin,
  className,
  previewing,
  applying,
  preview,
  onClose,
  onPreview,
  onApply,
}: ImportDialogProps) {
  const [text, setText] = useState("");

  const scopeLabel = isAdmin
    ? "semua kelas (1–6)"
    : `kelas ${className ?? "Anda"}`;

  const handleText = (value: string) => {
    setText(value);
    // Pratinjau lama tidak lagi mewakili teks ini.
    if (preview) onPreview("");
  };

  const hasText = text.trim().length > 0;

  return (
    <Modal
      open={open}
      title="Impor jadwal dari teks"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Tutup
          </Button>
          <Button
            variant="secondary"
            disabled={!hasText || applying}
            loading={previewing}
            onClick={() => onPreview(text)}
          >
            Pratinjau
          </Button>
          <Button
            disabled={!hasText || !preview || previewing}
            loading={applying}
            onClick={() => onApply(text)}
            title={
              preview
                ? undefined
                : "Jalankan Pratinjau lebih dulu untuk melihat apa yang akan terjadi"
            }
          >
            <ClipboardPaste className="h-4 w-4" />
            Impor
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-600">
        Tempel jadwal apa adanya dari sekolah. Baris masuk sebagai{" "}
        <strong>draft</strong> untuk {scopeLabel}, lalu dikunci dan
        dipublikasikan seperti biasa. Tanggal yang sudah punya jadwal{" "}
        <strong>dilewati</strong>, jadi teks yang sama boleh ditempel berulang.
      </p>

      <Field
        label="Teks jadwal"
        hint="Format: blok rentang tanggal, lalu baris “Hari : menu”. Tulis “Libur” untuk hari libur."
      >
        <Textarea
          value={text}
          onChange={(event) => handleText(event.target.value)}
          placeholder={PLACEHOLDER}
          rows={10}
          spellCheck={false}
          className="font-mono text-xs"
          autoFocus
        />
      </Field>

      {preview && <PreviewPanel preview={preview} isAdmin={isAdmin} />}
    </Modal>
  );
}

/** Ringkasan hasil pratinjau — jumlah, peringatan, dan daftar harinya. */
function PreviewPanel({
  preview,
  isAdmin,
}: {
  preview: ImportScheduleResultDto;
  isAdmin: boolean;
}) {
  const nothingToDo = preview.createdRows === 0 && preview.skippedRows > 0;

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Info className="h-4 w-4 text-brand-700" />
        <span className="text-sm font-medium text-slate-800">
          {preview.blocks} blok · {preview.parsedDays} hari terbaca
        </span>
        <Badge tone={preview.createdRows > 0 ? "success" : "neutral"}>
          {preview.createdRows} baris baru
        </Badge>
        {preview.skippedRows > 0 && (
          <Badge tone="neutral">{preview.skippedRows} dilewati</Badge>
        )}
        {preview.createdMenus > 0 && (
          <Badge tone="info">{preview.createdMenus} menu baru</Badge>
        )}
        {preview.reusedMenus > 0 && (
          <Badge tone="neutral">{preview.reusedMenus} menu dipakai ulang</Badge>
        )}
      </div>

      <p className="text-xs text-slate-500">
        {isAdmin
          ? `Sasaran: semua kelas (${preview.classes.join(", ")})`
          : `Sasaran: kelas ${preview.classes.join(", ")}`}
      </p>

      {nothingToDo && (
        <p className="text-xs text-slate-600">
          Semua tanggal pada teks ini sudah punya jadwal — tidak ada yang perlu
          ditambahkan.
        </p>
      )}

      {preview.warnings.length > 0 && (
        <ul className="space-y-1">
          {preview.warnings.map((warning) => (
            <li
              key={warning}
              className="flex gap-2 text-xs text-highlight-800"
            >
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{warning}</span>
            </li>
          ))}
        </ul>
      )}

      {preview.issues.length > 0 && (
        <ul className="space-y-1">
          {preview.issues.map((issue, index) => (
            <li
              key={`${issue.line}-${index}`}
              className="flex gap-2 text-xs text-red-600"
            >
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                {issue.line > 0 && (
                  <span className="font-medium">Baris {issue.line}: </span>
                )}
                {issue.message}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="max-h-56 overflow-y-auto rounded-md border border-slate-200 bg-white">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-slate-50 text-slate-500">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Tanggal</th>
              <th className="px-3 py-2 text-left font-medium">Menu</th>
              <th className="px-3 py-2 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {preview.days.map((day) => (
              <tr key={day.date} className="border-t border-slate-100">
                <td className="whitespace-nowrap px-3 py-1.5 text-slate-600">
                  {day.date}
                </td>
                <td className="px-3 py-1.5 text-slate-800">
                  {day.isHoliday ? (
                    <span className="text-highlight-800">Libur</span>
                  ) : (
                    day.menuName
                  )}
                </td>
                <td className="px-3 py-1.5">
                  {day.outcome === "create" ? (
                    <span className="text-accent-800">
                      tambah {day.classesCreated.length} kelas
                    </span>
                  ) : (
                    <span className="text-slate-400">
                      dilewati — sudah ada
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
