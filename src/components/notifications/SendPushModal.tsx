import { useState } from "react";
import { Send } from "lucide-react";
import { Modal, Field, Input, Textarea, Button, InlineAlert } from "@/components/ui";
import { api, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface SendPushModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Modal kirim push notification — admin & korlas.
 *
 * Admin bisa kirim ke semua subscriber atau kelas tertentu.
 * Korlas hanya ke kelasnya sendiri.
 */
export function SendPushModal({ open, onClose }: SendPushModalProps) {
  const { isAdmin, korlasClass } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("/");
  const [targetClass, setTargetClass] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) return;

    setIsSending(true);
    setResult(null);

    try {
      const { data } = await api.notifications.sendPush({
        title: title.trim(),
        body: body.trim(),
        url: url.trim() || "/",
        className: isAdmin && targetClass ? targetClass : undefined,
      });
      setResult({
        tone: "ok",
        text: `Notifikasi terkirim: ${data.sent} sukses, ${data.failed} gagal`,
      });
      setTitle("");
      setBody("");
    } catch (err) {
      setResult({ tone: "error", text: errorMessage(err, "Gagal mengirim notifikasi") });
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    if (isSending) return;
    setTitle("");
    setBody("");
    setResult(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      title="Kirim Push Notification"
      onClose={handleClose}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={isSending}>
            Batal
          </Button>
          <Button onClick={handleSend} loading={isSending} disabled={!title.trim() || !body.trim()}>
            <Send className="h-4 w-4 mr-1.5" />
            Kirim
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {isAdmin && (
          <Field label="Target Kelas (kosongkan untuk semua)">
            <Input
              value={targetClass}
              onChange={(e) => setTargetClass(e.target.value)}
              placeholder="Contoh: 1A"
            />
          </Field>
        )}
        {!isAdmin && korlasClass && (
          <p className="text-sm text-slate-500">
            Notifikasi akan dikirim ke kelas <strong>{korlasClass}</strong>.
          </p>
        )}

        <Field label="Judul">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Jadwal Terbaru"
          />
        </Field>

        <Field label="Isi Pesan">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="Contoh: Jadwal snack minggu depan sudah tersedia."
          />
        </Field>

        <Field label="Tautan saat diklik (opsional)" hint="Contoh: /hari-ini, /minggu-ini">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="/"
          />
        </Field>

        {result && <InlineAlert tone={result.tone}>{result.text}</InlineAlert>}
      </div>
    </Modal>
  );
}
