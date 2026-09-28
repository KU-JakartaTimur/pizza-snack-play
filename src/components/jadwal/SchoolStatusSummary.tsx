import { Lock, Send } from "lucide-react";
import { Badge, Button, Card, Checkbox } from "@/components/ui";
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
  /** Kelas yang tercentang — bahan aksi massal per kelas. */
  selectedClasses: ReadonlySet<string>;
  onToggleClass: (className: string) => void;
  onToggleAllClasses: () => void;
  onClearClasses: () => void;
  /** Kunci sebulan penuh untuk kelas-kelas terpilih. */
  onBulkLock: () => void;
  onBulkPublish: () => void;
  /** Aksi per kelas yang sedang berjalan — spinner pada tombol yang tepat. */
  classActionPending: "lock" | "publish" | null;
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
 *
 * Sejak aksi massal per kelas ditambahkan, tiap baris kelas juga bisa
 * **dicentang**: memilih dua dari enam kelas lalu mengunci/mempublikasi
 * hanya keduanya — inilah yang membuat satu kelas bisa terbit tanpa
 * menunggu kelas lain yang jadwalnya belum siap.
 */
export function SchoolStatusSummary({
  status,
  isPending,
  isAdmin,
  className,
  busy,
  onPublish,
  publishing,
  selectedClasses,
  onToggleClass,
  onToggleAllClasses,
  onClearClasses,
  onBulkLock,
  onBulkPublish,
  classActionPending,
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

  /** Baris kelas bisa dicentang hanya bila ada lebih dari satu kelas. */
  const selectable = perClass.length > 1;
  const classNames = perClass.map((item) => item.className);
  const selectedCount = classNames.filter((name) =>
    selectedClasses.has(name),
  ).length;

  const selectedItems = perClass.filter((item) =>
    selectedClasses.has(item.className),
  );
  // Kunci masuk akal bila ada draft; publikasi hanya bila tak ada draft yang
  // menahan — aturan yang sama dengan tombol publikasi bulanan.
  const canLockSelected = selectedItems.some((item) => item.draftCount > 0);
  const canPublishSelected =
    selectedItems.some((item) => item.lockedCount > 0) &&
    selectedItems.every((item) => item.draftCount === 0);
  const blockedSelected = selectedItems
    .filter((item) => item.draftCount > 0)
    .map((item) => item.className);

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

      {/*
        Rincian per kelas — inilah bukti visual bahwa cakupannya semua kelas,
        sekaligus tempat memilih kelas untuk aksi massal.
      */}
      {selectable && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-2.5">
            <Checkbox
              label="Pilih semua kelas"
              checked={selectedCount === classNames.length && classNames.length > 0}
              indeterminate={selectedCount > 0 && selectedCount < classNames.length}
              disabled={busy}
              onChange={onToggleAllClasses}
            />
            {selectedCount > 0 && (
              <span className="text-xs text-slate-500">
                {selectedCount} dari {classNames.length} kelas dipilih
              </span>
            )}
          </div>

          <ul className="divide-y divide-slate-100 border-t border-slate-100">
            {perClass.map((item) => (
              <li
                key={item.className}
                className="flex flex-wrap items-center justify-between gap-2 px-5 py-2.5 text-xs"
              >
                <Checkbox
                  checked={selectedClasses.has(item.className)}
                  disabled={busy}
                  onChange={() => onToggleClass(item.className)}
                  label={
                    <span className="min-w-24 font-medium text-slate-700">
                      Kelas {item.className}
                    </span>
                  }
                />

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
                  {item.draftCount > 0 && (
                    <Badge tone="warning">menahan publikasi</Badge>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Aksi massal untuk kelas terpilih. */}
      {selectable && selectedCount > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-brand-50/40 px-5 py-3">
          <p className="text-xs text-brand-700">
            Kunci atau publikasi hanya kelas yang dicentang — kelas lain tidak
            tersentuh.
          </p>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={!canLockSelected || busy}
              loading={classActionPending === "lock"}
              onClick={onBulkLock}
              title={
                canLockSelected
                  ? "Kunci semua jadwal draft bulan ini untuk kelas terpilih"
                  : "Tidak ada jadwal draft pada kelas terpilih"
              }
            >
              <Lock className="h-4 w-4" />
              Kunci kelas terpilih
            </Button>

            <Button
              size="sm"
              disabled={!canPublishSelected || busy}
              loading={classActionPending === "publish"}
              onClick={onBulkPublish}
              title={
                blockedSelected.length > 0
                  ? `Masih ada draft di kelas ${blockedSelected.join(", ")} — kunci dulu`
                  : "Publikasi jadwal terkunci kelas terpilih ke orang tua"
              }
            >
              <Send className="h-4 w-4" />
              Publikasi kelas terpilih
            </Button>

            <Button
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={onClearClasses}
              title="Kosongkan pilihan kelas"
            >
              Bersihkan
            </Button>
          </div>
        </div>
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
