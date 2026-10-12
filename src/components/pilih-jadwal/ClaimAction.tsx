import { HandHeart } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import type { ScheduleDayDto } from "@/types/schedule";

/** Tombol ambil / batal untuk satu tanggal. */
export function ClaimAction({
  day,
  today,
  myParentId,
  busy,
  onTake,
  onRelease,
}: {
  day: ScheduleDayDto;
  today: string;
  myParentId: number | null;
  busy: boolean;
  onTake: () => void;
  onRelease: (claimId: number) => void;
}) {
  const isPast = day.date < today;
  const isMine = day.claim?.parentId === myParentId;

  // Urutannya penting: klaim sendiri diakui lebih dulu, karena tanggal yang
  // sudah lewat pun tetap boleh menampilkan milik siapa.
  if (isMine && day.claim) {
    return (
      <div className="flex items-center justify-between gap-2">
        <Badge tone="success">Pilihan Anda</Badge>
        {!isPast && (
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => onRelease(day.claim!.id)}
          >
            Batalkan
          </Button>
        )}
      </div>
    );
  }

  if (day.claim) {
    return <Badge tone="warning">Sudah dipilih orang tua lain</Badge>;
  }

  // Petugas terisi tanpa klaim = korlas menunjuknya dari daftar piket manual.
  if (day.petugasName || day.petugasParentName) {
    return <Badge tone="neutral">Ditetapkan korlas</Badge>;
  }

  if (isPast) {
    return <span className="text-xs text-slate-400">Tanggal sudah lewat</span>;
  }

  return (
    <Button size="sm" className="w-full" disabled={busy} onClick={onTake}>
      <HandHeart className="h-4 w-4" />
      Ambil tanggal ini
    </Button>
  );
}
