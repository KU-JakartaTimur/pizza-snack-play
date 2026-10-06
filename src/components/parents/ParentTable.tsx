import {
  KeyRound,
  LockOpen,
  Pencil,
  Trash2,
  UserX,
} from "lucide-react";
import { Badge, Button, Checkbox } from "@/components/ui";
import type { ParentDto } from "@/types/account";
import { groupSelection, pageSelectableIds } from "./selection";

interface ParentTableProps {
  items: ParentDto[];
  selected: ReadonlySet<number>;
  /** Aksi baris sedang berjalan — menahan tombol per-baris. */
  busy: boolean;
  onToggleRow: (id: number) => void;
  onToggleAll: (checked: boolean) => void;
  onEdit: (parent: ParentDto) => void;
  onResetPassword: (parent: ParentDto) => void;
  onUnlock: (parent: ParentDto) => void;
  onDeactivate: (parent: ParentDto) => void;
  onDelete: (parent: ParentDto) => void;
}

/**
 * Tabel daftar akun orang tua dengan kotak centang per baris dan kotak
 * "pilih semua" di kepala. Centang menggerakkan aksi massal (lihat
 * `ParentBulkBar`); tombol per-baris tetap ada untuk tindakan cepat.
 *
 * Keadaan kosong/muat/error ditangani oleh pemanggil (pembatas halaman),
 * sehingga komponen ini murni menampilkan baris yang sudah ada.
 */
export function ParentTable({
  items,
  selected,
  busy,
  onToggleRow,
  onToggleAll,
  onEdit,
  onResetPassword,
  onUnlock,
  onDeactivate,
  onDelete,
}: ParentTableProps) {
  const header = groupSelection(pageSelectableIds(items), selected);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left">
            <th className="w-10 px-3 py-3">
              <Checkbox
                aria-label="Pilih semua"
                checked={header.allSelected}
                indeterminate={header.someSelected}
                disabled={header.ids.length === 0}
                onChange={(event) => onToggleAll(event.target.checked)}
              />
            </th>
            <th className="px-5 py-3 font-medium text-slate-500">Username</th>
            <th className="px-5 py-3 font-medium text-slate-500">Orang tua</th>
            <th className="px-5 py-3 font-medium text-slate-500">Anak</th>
            <th className="px-5 py-3 font-medium text-slate-500">Status</th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((parent) => (
            <tr key={parent.id} className="hover:bg-slate-50">
              <td className="px-3 py-3">
                <Checkbox
                  aria-label={`Pilih ${parent.username}`}
                  checked={selected.has(parent.id)}
                  onChange={() => onToggleRow(parent.id)}
                />
              </td>
              <td className="px-5 py-3 font-mono text-xs text-slate-600">
                {parent.username}
              </td>
              <td className="px-5 py-3 text-slate-800">
                {parent.parentName}
                <span className="ml-2 text-xs text-slate-400">
                  ({parent.relationship})
                </span>
                {parent.role === "korlas" && (
                  <Badge tone="brand" className="ml-2">
                    Korlas {parent.className ?? "—"}
                  </Badge>
                )}
              </td>
              <td className="px-5 py-3">
                {parent.students.length === 0 ? (
                  <span className="text-slate-400">—</span>
                ) : (
                  <ul className="space-y-0.5">
                    {parent.students.map((student) => (
                      <li key={student.id} className="text-slate-800">
                        {student.name}
                        {student.className && (
                          <span className="ml-1.5 text-xs text-slate-400">
                            {student.className}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </td>
              <td className="px-5 py-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {parent.isActive ? (
                    <Badge tone="success">Aktif</Badge>
                  ) : (
                    <Badge tone="danger">Nonaktif</Badge>
                  )}
                  {/* Akun bisa aktif sekaligus terkunci: penguncian
                      datang dari percobaan masuk yang gagal, bukan
                      dari admin, jadi keduanya ditampilkan terpisah. */}
                  {parent.lockedAt && <Badge tone="warning">Terkunci</Badge>}
                </div>
              </td>
              <td className="px-5 py-3">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(parent)}
                    title="Ubah"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onResetPassword(parent)}
                    title="Reset password"
                  >
                    <KeyRound className="h-4 w-4" />
                  </Button>
                  {/* Hanya muncul untuk akun yang benar-benar terkunci,
                      supaya deretan tombol tidak penuh tindakan yang
                      tidak berlaku untuk sebagian besar baris. */}
                  {parent.lockedAt && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-accent-700 hover:bg-accent-50"
                      disabled={busy}
                      onClick={() => onUnlock(parent)}
                      title="Buka kunci akun"
                    >
                      <LockOpen className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-highlight-700 hover:bg-highlight-50"
                    disabled={busy}
                    onClick={() => onDeactivate(parent)}
                    title="Nonaktifkan"
                  >
                    <UserX className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                    disabled={busy}
                    onClick={() => onDelete(parent)}
                    title="Hapus permanen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
