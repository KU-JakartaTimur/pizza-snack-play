import { Lock, Send, Unlock, X } from "lucide-react";
import { Button } from "@/components/ui";
import type { BulkRowAction } from "@/types/schedule";
import { canApplyBulk, type SelectionSummary } from "./selection";

interface BulkActionBarProps {
  summary: SelectionSummary;
  /** Aksi massal sedang berjalan — menahan semua tombol. */
  busy: boolean;
  /** `true` bila pengguna berhak membuka kunci (admin). */
  canUnlock: boolean;
  /** Aksi yang sedang diproses, agar spinner muncul di tombol yang tepat. */
  pendingAction: BulkRowAction | null;
  onAction: (action: BulkRowAction) => void;
  onClear: () => void;
}

/**
 * Bilah aksi massal untuk baris jadwal yang dicentang.
 *
 * Menempel di bawah layar (`sticky bottom-4`) selama daftar minggu lebih
 * tinggi daripada jendela — supaya pilihan yang dibuat di minggu terakhir
 * tetap punya tombolnya, tanpa menutupi header aplikasi yang juga lengket.
 *
 * Tiap tombol hanya hidup bila memang ada baris tercentang dengan status yang
 * cocok (`canApplyBulk`), jadi tidak ada aksi yang bisa berakhir "0 dikunci".
 */
export function BulkActionBar({
  summary,
  busy,
  canUnlock,
  pendingAction,
  onAction,
  onClear,
}: BulkActionBarProps) {
  const breakdown = [
    summary.draft > 0 ? `${summary.draft} draft` : "",
    summary.locked > 0 ? `${summary.locked} terkunci` : "",
    summary.published > 0 ? `${summary.published} dipublikasi` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="sticky bottom-4 z-30">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-brand-700">
            {summary.count} hari dipilih
          </p>
          {breakdown && <p className="text-xs text-slate-500">{breakdown}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={busy || !canApplyBulk("lock", summary)}
            loading={pendingAction === "lock"}
            onClick={() => onAction("lock")}
            title="Kunci jadwal draft yang dipilih"
          >
            <Lock className="h-4 w-4" />
            Kunci
          </Button>

          <Button
            size="sm"
            disabled={busy || !canApplyBulk("publish", summary)}
            loading={pendingAction === "publish"}
            onClick={() => onAction("publish")}
            title="Publikasi jadwal terkunci yang dipilih — langsung terlihat orang tua"
          >
            <Send className="h-4 w-4" />
            Publikasi
          </Button>

          {canUnlock && (
            <Button
              size="sm"
              variant="secondary"
              disabled={busy || !canApplyBulk("unlock", summary)}
              loading={pendingAction === "unlock"}
              onClick={() => onAction("unlock")}
              title="Kembalikan jadwal yang dipilih ke status draft"
            >
              <Unlock className="h-4 w-4" />
              Buka kunci
            </Button>
          )}

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
