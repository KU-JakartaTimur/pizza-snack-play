import { UserCheck, UserX, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui";
import type { ParentBulkAction } from "@/types/account";
import { canApplyBulk, type ParentSelectionSummary } from "./selection";

interface ParentBulkBarProps {
  summary: ParentSelectionSummary;
  /** Aksi massal sedang berjalan — menahan semua tombol. */
  busy: boolean;
  /** Aksi yang sedang diproses, agar spinner muncul di tombol yang tepat. */
  pendingAction: ParentBulkAction | null;
  /** Aksi selain hapus — langsung dijalankan. */
  onAction: (action: Exclude<ParentBulkAction, "delete">) => void;
  /** Hapus permanen — meminta konfirmasi dulu (aksi perusak). */
  onRequestDelete: () => void;
  /** Kosongkan pilihan. */
  onClear: () => void;
}

/**
 * Bilah aksi massal untuk akun orang tua yang dicentang.
 *
 * Menempel di bawah layar (`sticky bottom-4`) selama daftar lebih tinggi
 * daripada jendela — supaya pilihan yang dibuat di baris terakhir tetap punya
 * tombolnya. Tiap tombol hanya hidup bila memang ada akun tercentang dengan
 * keadaan yang cocok (`canApplyBulk`), jadi tidak ada aksi yang berakhir
 * "0 akun diaktifkan".
 */
export function ParentBulkBar({
  summary,
  busy,
  pendingAction,
  onAction,
  onRequestDelete,
  onClear,
}: ParentBulkBarProps) {
  const breakdown = [
    summary.active > 0 ? `${summary.active} aktif` : "",
    summary.inactive > 0 ? `${summary.inactive} nonaktif` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="sticky bottom-4 z-30">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-brand-700">
            {summary.count} akun dipilih
          </p>
          {breakdown && <p className="text-xs text-slate-500">{breakdown}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={busy || !canApplyBulk("activate", summary)}
            loading={pendingAction === "activate"}
            onClick={() => onAction("activate")}
            title="Aktifkan akun yang dipilih"
          >
            <UserCheck className="h-4 w-4" />
            Aktifkan
          </Button>

          <Button
            size="sm"
            variant="secondary"
            disabled={busy || !canApplyBulk("deactivate", summary)}
            loading={pendingAction === "deactivate"}
            onClick={() => onAction("deactivate")}
            title="Nonaktifkan akun yang dipilih"
          >
            <UserX className="h-4 w-4" />
            Nonaktifkan
          </Button>

          <Button
            size="sm"
            className="text-red-600 hover:bg-red-50"
            disabled={busy || summary.count === 0}
            loading={pendingAction === "delete"}
            onClick={onRequestDelete}
            title="Hapus permanen akun yang dipilih"
          >
            <Trash2 className="h-4 w-4" />
            Hapus
          </Button>

          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={onClear}
            title="Kosongkan pilihan"
          >
            <X className="h-4 w-4" />
            Bersihkan
          </Button>
        </div>
      </div>
    </div>
  );
}
