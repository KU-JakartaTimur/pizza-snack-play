import { Send } from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";
import type { MonthStatusDto } from "@/types/schedule";

interface SchoolStatusSummaryProps {
  status: MonthStatusDto | undefined;
  isPending: boolean;
  isAdmin: boolean;
  className: string | null;
  /** Kunci tombol karena ada mutasi berjalan. */
  busy: boolean;
  onPublish: () => void;
  publishing: boolean;
}

/**
 * Ringkasan status bulan ini **per kelas**.
 *
 * Ini pengganti baris penghitung lama yang hanya menampilkan satu kalimat
 * "(semua kelas)". Masalah yang diperbaiki: setelah admin mempublikasi
 * seluruh sekolah, tabel harian tetap menampilkan satu kelas saja — sehingga
 * perubahan di kelas lain tak terlihat dan terasa seperti "tidak kena ke
 * semua kelas". Di sini setiap kelas punya barisnya sendiri, jadi cakupan
 * publikasi benar-benar terlihat.
 */
export function SchoolStatusSummary({
  status,
  isPending,
  isAdmin,
  className,
  busy,
  onPublish,
  publishing,
}: SchoolStatusSummaryProps) {
  if (isPending) {
    return (
      <Card className="mb-6">
        <p className="px-5 py-4 text-sm text-slate-500">Memuat status…</p>
      </Card>
    );
  }

  if (!status || status.perClass.length === 0) return null;

  const { totals, perClass, draftClasses, canPublish } = status;

  return (
    <Card className="mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Status bulan ini {isAdmin ? "— semua kelas" : `— kelas ${className ?? ""}`}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {isAdmin
              ? "Kunci & publikasi di sini berlaku untuk seluruh kelas sekaligus."
              : "Publikasi berlaku untuk kelas Anda saja."}
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <Counter label="draft" value={totals.draftCount} />
          <Counter label="terkunci" value={totals.lockedCount} />
          <Counter label="dipublikasi" value={totals.publishedCount} />
        </div>
      </div>

      {/* Rincian per kelas — inilah bukti visual bahwa cakupannya semua kelas. */}
      {perClass.length > 1 && (
        <ul className="divide-y divide-slate-100 border-t border-slate-100">
          {perClass.map((item) => (
            <li
              key={item.className}
              className="flex flex-wrap items-center justify-between gap-2 px-5 py-2.5 text-xs"
            >
              <span className="min-w-24 font-medium text-slate-700">
                Kelas {item.className}
              </span>
              <div className="flex items-center gap-3">
                {item.totalCount === 0 ? (
                  <span className="text-slate-400">belum ada jadwal</span>
                ) : (
                  <>
                    <Counter label="draft" value={item.draftCount} muted />
                    <Counter label="kunci" value={item.lockedCount} muted />
                    <Counter label="publikasi" value={item.publishedCount} muted />
                  </>
                )}
                {item.draftCount > 0 && <Badge tone="warning">menahan publikasi</Badge>}
              </div>
            </li>
          ))}
        </ul>
      )}

      {(draftClasses.length > 0 || canPublish) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3">
          {draftClasses.length > 0 ? (
            <p className="text-xs text-highlight-700">
              Kunci dulu kelas {draftClasses.join(", ")} sebelum publikasi.
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              Semua kelas siap dipublikasi.
            </p>
          )}

          <Button
            size="sm"
            disabled={!canPublish || busy}
            loading={publishing}
            onClick={onPublish}
            title={
              draftClasses.length > 0
                ? `Masih ada draft di kelas ${draftClasses.join(", ")}`
                : "Publikasi jadwal terkunci ke orang tua"
            }
          >
            <Send className="h-4 w-4" />
            {isAdmin ? "Publikasi semua kelas" : "Publikasi kelas saya"}
          </Button>
        </div>
      )}
    </Card>
  );
}

function Counter({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: number;
  muted?: boolean;
}) {
  return (
    <span className={muted ? "text-slate-400" : "text-slate-500"}>
      <span className="font-medium text-slate-700">{value}</span> {label}
    </span>
  );
}
