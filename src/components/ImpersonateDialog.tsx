import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Loader2, Search } from "lucide-react";
import { Badge, Input, Modal } from "@/components/ui";
import { api } from "@/lib/api";
import type { ParentDto } from "@/types/account";

/**
 * Batas satu halaman cukup longgar — daftar akun satu sekolah masih nyaman
 * digulir, dan kolom pencarian menutup kasus yang lebih besar.
 */
const PER_PAGE = 100;

function roleLabel(parent: ParentDto): string {
  if (parent.role !== "korlas") return "Orang tua";
  return parent.className ? `Korlas ${parent.className}` : "Korlas";
}

/** Kelas yang muncul dari anak-anaknya — dipakai sebagai baris kedua. */
function classLabel(parent: ParentDto): string {
  const classes = [
    ...new Set(parent.students.map((student) => student.className).filter(Boolean)),
  ];
  return classes.length > 0 ? `Kelas ${classes.join(", ")}` : "Kelas belum diisi";
}

/**
 * Pemilih akun untuk "Login as" — **khusus admin**.
 *
 * Sengaja memakai ulang daftar akun dari modul orang tua (`/api/parents`)
 * alih-alih endpoint baru: modul itu sudah memuat korlas maupun orang tua
 * beserta kelas dan anaknya, dan aksesnya sudah terbatas pada admin.
 */
export function ImpersonateDialog({
  open,
  busyUserId,
  error,
  onSelect,
  onClose,
}: {
  open: boolean;
  /** `userId` yang sedang diproses — barisnya menampilkan spinner. */
  busyUserId: number | null;
  /** Pesan kegagalan dari percobaan terakhir. */
  error: string | null;
  onSelect: (parent: ParentDto) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");

  const { data, isPending, isError } = useQuery({
    // Akun nonaktif tidak bisa dibuka sesinya (ditolak server), jadi tidak
    // perlu ikut ditawarkan.
    queryKey: ["parents", "impersonate", search],
    queryFn: () =>
      api.parents.list({
        search: search.trim() || undefined,
        active: true,
        perPage: PER_PAGE,
      }),
    enabled: open,
    staleTime: 30_000,
  });

  const items = data?.items ?? [];
  const searching = search.trim().length > 0;

  return (
    <Modal open={open} title="Login as" onClose={onClose}>
      <p className="text-sm text-slate-600">
        Masuk memakai akun korlas atau orang tua tanpa password, untuk melihat
        aplikasi persis seperti yang mereka lihat. Sesi admin Anda tetap
        tersimpan dan bisa dilanjutkan lagi kapan saja.
      </p>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari nama, username, atau kelas…"
          className="pl-9"
          autoFocus
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200">
        {isPending ? (
          <div className="flex items-center justify-center gap-2 py-10 text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Memuat akun…</span>
          </div>
        ) : isError ? (
          <p className="px-4 py-10 text-center text-sm text-slate-500">
            Daftar akun gagal dimuat. Tutup lalu coba lagi.
          </p>
        ) : items.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-500">
            {searching
              ? "Tidak ada akun yang cocok dengan pencarian itu."
              : "Belum ada akun orang tua. Tambahkan lewat menu Orang Tua."}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((parent) => {
              const busy = busyUserId === parent.userId;
              return (
                <li key={parent.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(parent)}
                    disabled={busyUserId !== null}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-slate-800">
                        {parent.parentName}
                      </span>
                      <span className="block truncate text-xs text-slate-500">
                        {parent.username} · {classLabel(parent)}
                      </span>
                    </span>

                    <span className="flex shrink-0 items-center gap-2">
                      <Badge tone={parent.role === "korlas" ? "info" : "neutral"}>
                        {roleLabel(parent)}
                      </Badge>
                      {busy && (
                        <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Modal>
  );
}
