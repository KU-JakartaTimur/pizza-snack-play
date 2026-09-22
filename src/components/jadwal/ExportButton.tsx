import { useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui";
import { api, errorMessage } from "@/lib/api";
import { saveBlob } from "@/lib/download";

interface ExportButtonProps {
  /** `week` = halaman Sepekan, `month` = halaman Bulanan. */
  scope: "week" | "month";
  /** Tanggal mana pun pada pekan yang sedang dilihat — hanya untuk `week`. */
  date?: string;
  /** Bulan yang sedang dilihat — hanya untuk `month`. */
  year?: number;
  month?: number;
  /** Kelas yang sedang tampil di layar; berkasnya dibuat untuk kelas ini. */
  className: string | null;
  /** Matikan tombol selama data halaman belum siap. */
  disabled?: boolean;
}

/**
 * Tombol "Unduh Excel" untuk halaman Sepekan & Bulanan.
 *
 * Sengaja satu komponen untuk dua halaman: keduanya harus berperilaku sama —
 * kelas yang diunduh adalah kelas yang sedang tampil, dan kegagalan apa pun
 * (mis. `403` karena role-nya bukan admin/korlas) muncul sebagai pesan di
 * sebelah tombol, bukan menggagalkan halaman.
 */
export function ExportButton({
  scope,
  date,
  year,
  month,
  className,
  disabled = false,
}: ExportButtonProps) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = async () => {
    setDownloading(true);
    setError(null);
    try {
      const file = await api.schedules.exportXlsx({
        scope,
        date,
        year,
        month,
        className,
      });
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
        title={`Unduh jadwal ${scope === "week" ? "sepekan" : "bulanan"} ini sebagai berkas Excel`}
      >
        <FileSpreadsheet className="h-4 w-4" />
        Unduh Excel
      </Button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
