import { TriangleAlert } from "lucide-react";
import { Button, Modal } from "@/components/ui";

/**
 * Dialog "kalah cepat" — muncul saat tanggal yang baru direbut ternyata sudah
 * diambil orang tua lain. Isinya pesan dari server (sudah menyebut nama
 * pemiliknya), jadi tidak ada teks yang perlu dirakit di sini.
 */
export function ConflictDialog({
  message,
  onClose,
}: {
  message: string | null;
  onClose: () => void;
}) {
  return (
    <Modal
      open={message !== null}
      title="Yah, keduluan!"
      onClose={onClose}
      footer={<Button onClick={onClose}>Mengerti</Button>}
    >
      <div className="flex items-start gap-3">
        <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-highlight-600" />
        <div>
          <p className="text-sm text-slate-700">{message}</p>
          <p className="mt-1 text-xs text-slate-500">
            Silakan pilih tanggal lain yang masih kosong.
          </p>
        </div>
      </div>
    </Modal>
  );
}
