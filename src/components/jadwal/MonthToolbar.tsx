import { CalendarOff, Copy, Lock, Send } from "lucide-react";
import { MonthNavigator } from "@/components/MonthNavigator";
import { Button, Card } from "@/components/ui";

interface MonthToolbarProps {
  year: number;
  month: number;
  menuCount: number;
  menusLoading: boolean;
  isAdmin: boolean;
  className: string | null;
  /** Ada jadwal berstatus draft pada cakupan ini. */
  hasDrafts: boolean;
  /** Tidak ada draft tersisa & ada jadwal terkunci. */
  canPublish: boolean;
  /** Kelas yang masih menahan publikasi — untuk tooltip. */
  draftClasses: string[];
  busy: boolean;
  lockPending: boolean;
  publishPending: boolean;
  onShift: (delta: number) => void;
  onLock: () => void;
  onPublish: () => void;
  onOpenCopy: () => void;
  onOpenHoliday: () => void;
}

/**
 * Bilah atas: navigasi bulan + tombol aksi massal (kunci, publikasi,
 * salin Sepekan, hari libur).
 */
export function MonthToolbar({
  year,
  month,
  menuCount,
  menusLoading,
  isAdmin,
  className,
  hasDrafts,
  canPublish,
  draftClasses,
  busy,
  lockPending,
  publishPending,
  onShift,
  onLock,
  onPublish,
  onOpenCopy,
  onOpenHoliday,
}: MonthToolbarProps) {
  const scopeLabel = isAdmin ? "semua kelas" : `kelas ${className ?? ""}`.trim();

  const lockTitle = isAdmin
    ? "Kunci semua jadwal draft bulan ini untuk semua kelas (kelas 1–6)"
    : `Kunci semua jadwal draft bulan ini untuk kelas ${className ?? ""}`.trim();

  const publishTitle = hasDrafts
    ? draftClasses.length > 0
      ? `Masih ada jadwal draft di ${draftClasses
          .map((cls) => `kelas ${cls}`)
          .join(", ")} — kunci dulu`
      : "Masih ada jadwal draft — kunci dulu"
    : `Publikasi jadwal yang sudah dikunci ke orang tua ${scopeLabel}`;

  return (
    <Card className="mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <MonthNavigator year={year} month={month} onShift={onShift} />
          <p className="text-xs text-slate-500">
            {menusLoading ? "Memuat menu…" : `${menuCount} menu aktif tersedia`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            disabled={!className || !hasDrafts || busy}
            onClick={onLock}
            loading={lockPending}
            title={lockTitle}
          >
            <Lock className="h-4 w-4" />
            {isAdmin ? "Kunci bulan (semua kelas)" : "Kunci bulan"}
          </Button>

          <Button
            disabled={!className || !canPublish || busy}
            onClick={onPublish}
            loading={publishPending}
            title={publishTitle}
          >
            <Send className="h-4 w-4" />
            {isAdmin ? "Publikasi (semua kelas)" : "Publikasi kelas saya"}
          </Button>

          <Button
            variant="secondary"
            disabled={!className}
            onClick={onOpenCopy}
            title="Salin jadwal Senin–Jumat untuk kelas yang sedang ditampilkan"
          >
            <Copy className="h-4 w-4" />
            Salin Sepekan
          </Button>

          {/* Hari libur bersifat global (semua kelas) → hanya admin. */}
          {isAdmin && (
            <Button variant="secondary" onClick={onOpenHoliday}>
              <CalendarOff className="h-4 w-4" />
              Hari libur
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
