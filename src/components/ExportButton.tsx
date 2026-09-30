import { useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui";
import { errorMessage } from "@/lib/api";
import { saveBlob } from "@/lib/download";

interface ExportButtonProps {
  /**
   * Ambil berkasnya dari server. Mengembalikan `blob` + `filename` yang siap
   * disimpan; melempar `ApiError` bila server menolak.
   */
  onExport: () => Promise<{ blob: Blob; filename: string }>;
  /** Teks tombol, mis. `Unduh Excel`. */
  label?: string;
  /** Keterangan tambahan saat kursor berhenti di tombol. */
  title?: string;
  /** Matikan tombol selama data halaman belum siap. */
  disabled?: boolean;
}

/**
 * Tombol "Unduh Excel" yang dipakai bersama halaman yang punya ekspor.
 *
 * Sengaja tidak tahu apa yang diekspor: pemanggil menyerahkan `onExport`,
 * sehingga perilakunya seragam di mana pun dipasang — berkasnya disimpan
 * lewat `saveBlob`, dan kegagalan apa pun (mis. `403` karena role tidak
 * berhak) muncul sebagai pesan di sebelah tombol, bukan menggagalkan halaman.
 */
export function ExportButton({
  onExport,
  label = "Unduh Excel",
  title,
  disabled = false,
}: ExportButtonProps) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = async () => {
    setDownloading(true);
    setError(null);
    try {
      const file = await onExport();
      saveBlob(file.blob, file.filename);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="secondary"
        size="sm"
        loading={downloading}
        disabled={disabled}
        onClick={() => void download()}
        title={title ?? label}
      >
        <FileSpreadsheet className="h-4 w-4" />
        {label}
      </Button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
