import { useState, type ReactNode } from "react";
import { CalendarClock, History, Loader2, MessageCircle, Send } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Card,
  CardHeader,
  Field,
  InlineAlert,
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import { useClasses } from "@/hooks/useClasses";
import { api, errorMessage, type WhatsappBroadcast } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { addDays, todayInWib } from "@/lib/date";
import { cn } from "@/lib/cn";

/**
 * Kartu notifikasi WhatsApp untuk admin & korlas.
 *
 * Dua jenis pengiriman, satu kartu:
 *
 * - **Broadcast** — pesan bebas ke semua orang tua, satu kelas atau seluruh
 *   sekolah. Admin memilih kelasnya; korlas terkunci di kelasnya sendiri.
 * - **Pengingat piket** — pesan otomatis ke wali murid yang bertugas pada
 *   satu tanggal. Isinya disusun server (tanggal, kelas, menu), jadi tidak
 *   ada yang bisa salah tulis.
 *
 * Kesiapan gateway ditanyakan lebih dulu: bila `WHATSAPP_PROVIDER`/token
 * belum diisi, tombol kirim dimatikan dan alasannya ditampilkan — lebih baik
 * daripada pengguna menulis pesan panjang lalu ditolak server.
 */
export function WhatsAppBroadcastCard() {
  const [showHistory, setShowHistory] = useState(false);

  const statusQuery = useQuery({
    queryKey: ["whatsapp", "status"],
    queryFn: api.whatsapp.status,
    staleTime: 60_000,
  });

  const historyQuery = useQuery({
    queryKey: ["whatsapp", "history"],
    queryFn: api.whatsapp.history,
    enabled: showHistory,
  });

  const status = statusQuery.data;
  const configured = status?.configured ?? false;

  return (
    <Card>
      <CardHeader
        title="Notifikasi WhatsApp"
        description="Kirim pesan ke orang tua dan petugas piket lewat WhatsApp"
        action={
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="rounded-lg p-2 text-slate-500 hover:bg-brand-50 hover:text-brand-700"
            title="Riwayat pengiriman"
          >
            <History className="h-4 w-4" />
          </button>
        }
      />
      <div className="px-5 py-4 space-y-4">
        {status && !configured && (
          <InlineAlert tone="error">
            WhatsApp belum aktif — {status.reason ?? "hubungi admin sistem"}
          </InlineAlert>
        )}

        {showHistory ? (
          <BroadcastHistory query={historyQuery} />
        ) : (
          <SendPanels configured={configured} />
        )}
      </div>
    </Card>
  );
}

type Mode = "broadcast" | "petugas";

/**
 * Pemilih jenis pesan.
 *
 * Dua panel ditumpuk akan membuat kartu ini dua kali lebih tinggi daripada
 * kartu lain di dashboard, jadi hanya satu yang ditampilkan sekaligus.
 */
function SendPanels({ configured }: { configured: boolean }) {
  const [mode, setMode] = useState<Mode>("broadcast");

  return (
    <>
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
        <ModeTab
          active={mode === "broadcast"}
          onClick={() => setMode("broadcast")}
          icon={<MessageCircle className="h-3.5 w-3.5" />}
          label="Broadcast"
        />
        <ModeTab
          active={mode === "petugas"}
          onClick={() => setMode("petugas")}
          icon={<CalendarClock className="h-3.5 w-3.5" />}
          label="Pengingat piket"
        />
      </div>

      {mode === "broadcast" ? (
        <BroadcastForm configured={configured} />
      ) : (
        <PetugasReminderForm configured={configured} />
      )}
    </>
  );
}

function ModeTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "bg-white text-brand-700 shadow-sm"
          : "text-slate-500 hover:text-slate-700",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

/** Pilihan kelas untuk admin; korlas tidak melihat dropdown sama sekali. */
function ClassPicker({
  value,
  onChange,
  allowAll,
}: {
  value: string;
  onChange: (value: string) => void;
  allowAll: boolean;
}) {
  const { classes } = useClasses();

  return (
    <Field label="Kelas tujuan">
      <Select value={value} onChange={(e) => onChange(e.target.value)}>
        {allowAll && <option value="">Semua kelas</option>}
        {classes.map((className) => (
          <option key={className} value={className}>
            Kelas {className}
          </option>
        ))}
      </Select>
    </Field>
  );
}

function BroadcastForm({ configured }: { configured: boolean }) {
  const { isAdmin, korlasClass } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [targetClass, setTargetClass] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{ tone: "ok" | "error"; text: string } | null>(
    null,
  );

  const handleSend = async () => {
    if (!message.trim()) return;

    setIsSending(true);
    setResult(null);

    try {
      const { message: info } = await api.whatsapp.broadcast({
        message: message.trim(),
        targetScope: isAdmin && targetClass ? targetClass : undefined,
      });
      setResult({ tone: "ok", text: info });
      setMessage("");
      void queryClient.invalidateQueries({ queryKey: ["whatsapp", "history"] });
    } catch (err) {
      setResult({ tone: "error", text: errorMessage(err, "Gagal mengirim broadcast") });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {isAdmin ? (
        <ClassPicker value={targetClass} onChange={setTargetClass} allowAll />
      ) : (
        <p className="text-xs text-slate-500">
          Broadcast dikirim ke orang tua kelas {korlasClass ?? "Anda"}.
        </p>
      )}

      <Field
        label="Isi Pesan"
        hint="Dikirim ke nomor WhatsApp orang tua aktif yang punya nomor"
      >
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder="Contoh: Jadwal snack minggu ini sudah dipublikasikan. Silakan cek aplikasi."
        />
      </Field>

      {result && <InlineAlert tone={result.tone}>{result.text}</InlineAlert>}

      <div className="flex justify-end">
        <Button
          onClick={handleSend}
          loading={isSending}
          disabled={!configured || !message.trim()}
        >
          <Send className="h-4 w-4 mr-1.5" />
          Kirim Broadcast
        </Button>
      </div>
    </>
  );
}

/**
 * Pengingat piket untuk satu tanggal.
 *
 * Tanggal bawaannya **besok** (menurut WIB, bukan jam perangkat), karena
 * pengingat paling berguna dikirim sehari sebelum piket. Server memakai
 * bawaan yang sama bila tanggalnya tidak dikirim, jadi keduanya tidak bisa
 * berbeda maksud.
 */
function PetugasReminderForm({ configured }: { configured: boolean }) {
  const { isAdmin, korlasClass } = useAuth();
  const queryClient = useQueryClient();
  const [date, setDate] = useState(() => addDays(todayInWib(), 1));
  const [targetClass, setTargetClass] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{ tone: "ok" | "error"; text: string } | null>(
    null,
  );

  const handleSend = async () => {
    setIsSending(true);
    setResult(null);

    try {
      const { message: info } = await api.whatsapp.remindPetugas({
        date,
        className: isAdmin && targetClass ? targetClass : undefined,
      });
      setResult({ tone: "ok", text: info });
      void queryClient.invalidateQueries({ queryKey: ["whatsapp", "history"] });
    } catch (err) {
      setResult({
        tone: "error",
        text: errorMessage(err, "Gagal mengirim pengingat piket"),
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <Field label="Tanggal piket" hint="Hanya petugas pada jadwal yang sudah terbit">
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </Field>

      {isAdmin ? (
        <ClassPicker value={targetClass} onChange={setTargetClass} allowAll />
      ) : (
        <p className="text-xs text-slate-500">
          Pengingat dikirim ke petugas kelas {korlasClass ?? "Anda"}.
        </p>
      )}

      <p className="text-xs text-slate-500">
        Pesan berisi tanggal, kelas, dan menu disusun otomatis — Anda tidak
        perlu menulisnya.
      </p>

      {result && <InlineAlert tone={result.tone}>{result.text}</InlineAlert>}

      <div className="flex justify-end">
        <Button onClick={handleSend} loading={isSending} disabled={!configured || !date}>
          <Send className="h-4 w-4 mr-1.5" />
          Kirim Pengingat
        </Button>
      </div>
    </>
  );
}

/**
 * Label cakupan pengiriman.
 *
 * `targetScope` menyimpan dua bentuk: nama kelas (broadcast) atau
 * `petugas:<tanggal>[:<kelas>]` (pengingat). Yang kedua tidak boleh tampil
 * mentah — "petugas:2026-10-22" terbaca seperti bug, bukan riwayat. Tanggal
 * dan kelasnya tidak diulang di sini karena sudah tertulis di baris pesan
 * pengingat itu sendiri.
 */
function scopeLabel(scope: string): string {
  if (scope === "all") return "Semua kelas";
  if (scope.startsWith("petugas:")) return "Pengingat piket";
  return `Kelas ${scope}`;
}

function BroadcastHistory({
  query,
}: {
  query: ReturnType<typeof useQuery<WhatsappBroadcast[]>>;
}) {
  if (query.isPending) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Memuat riwayat…</span>
      </div>
    );
  }

  if (query.isError) {
    return (
      <InlineAlert tone="error">
        {query.error instanceof Error ? query.error.message : "Gagal memuat riwayat"}
      </InlineAlert>
    );
  }

  const history = query.data ?? [];

  if (!history.length) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-slate-500">
        <MessageCircle className="h-8 w-8" />
        <p className="text-sm">Belum ada pengiriman</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-80 overflow-y-auto">
      {history.map((item) => (
        <div
          key={item.id}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5"
        >
          <p className="text-sm text-slate-800 line-clamp-2">{item.message}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span
              className={`rounded-sm px-1.5 py-0.5 font-medium ${
                item.status === "completed"
                  ? "bg-accent-50 text-accent-700"
                  : item.status === "failed"
                    ? "bg-red-50 text-red-600"
                    : "bg-highlight-50 text-highlight-700"
              }`}
            >
              {item.status === "completed"
                ? "Selesai"
                : item.status === "failed"
                  ? "Gagal"
                  : "Mengirim"}
            </span>
            <span>
              {item.sentCount}/{item.targetCount} terkirim
            </span>
            <span>·</span>
            <span>{scopeLabel(item.targetScope)}</span>
            <span>·</span>
            <span>{new Date(item.createdAt).toLocaleDateString("id-ID")}</span>
          </div>
          {item.errorMessage && (
            <p className="mt-1 text-xs text-red-600 line-clamp-2">
              {item.errorMessage}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
