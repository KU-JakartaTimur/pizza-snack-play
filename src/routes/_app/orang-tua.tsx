import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  KeyRound,
  LockOpen,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserX,
  Users,
  X,
} from "lucide-react";
import { AdminOnly } from "@/components/AdminOnly";
import { PageHeader } from "@/components/AppShell";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  Input,
  Modal,
  Select,
  Spinner,
} from "@/components/ui";
import { api, errorMessage } from "@/lib/api";
import type { ManagedRole, ParentDto, ParentRelationship } from "@/types/account";

export const Route = createFileRoute("/_app/orang-tua")({
  component: ParentsPage,
});

const RELATIONSHIP_OPTIONS: { value: ParentRelationship; label: string }[] = [
  { value: "ibu", label: "Ibu" },
  { value: "ayah", label: "Ayah" },
  { value: "wali", label: "Wali" },
];

const ROLE_OPTIONS: { value: ManagedRole; label: string }[] = [
  { value: "parent", label: "Orang tua" },
  { value: "korlas", label: "Korlas (koordinator kelas)" },
];

const PER_PAGE = 20;

interface FormStudent {
  /** Ada bila anak sudah tersimpan (mode ubah); kosong = anak baru. */
  id?: number;
  name: string;
  className: string;
}

interface ParentForm {
  username: string;
  password: string;
  parentName: string;
  relationship: ParentRelationship;
  /** Satu orang tua boleh punya lebih dari satu anak. */
  students: FormStudent[];
  /** `parent` biasa, atau `korlas` (koordinator kelas). */
  role: ManagedRole;
  /** Kelas yang dikoordinasi — hanya dipakai bila role `korlas`. */
  className: string;
  phone: string;
  email: string;
}

const EMPTY_STUDENT: FormStudent = { name: "", className: "" };

const EMPTY_FORM: ParentForm = {
  username: "",
  password: "",
  parentName: "",
  relationship: "ibu",
  students: [{ ...EMPTY_STUDENT }],
  role: "parent",
  className: "",
  phone: "",
  email: "",
};

function ParentsPage() {
  return (
    <AdminOnly>
      <ParentsContent />
    </AdminOnly>
  );
}

function ParentsContent() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [banner, setBanner] = useState<{ kind: "ok" | "error"; text: string } | null>(
    null,
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ParentDto | null>(null);
  const [form, setForm] = useState<ParentForm>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  const [resetTarget, setResetTarget] = useState<ParentDto | null>(null);
  const [resetPassword, setResetPassword] = useState("");

  /**
   * Akun yang menunggu ditegaskan penghapusannya. Satu state untuk dua
   * tindakan yang berbeda kadarnya — `hard: false` menonaktifkan (bisa
   * dikembalikan), `hard: true` menghapus permanen.
   */
  const [pendingRemove, setPendingRemove] = useState<{
    parent: ParentDto;
    hard: boolean;
  } | null>(null);

  /** Akun terkunci yang menunggu ditegaskan pembukaan kuncinya. */
  const [pendingUnlock, setPendingUnlock] = useState<ParentDto | null>(null);

  const parentsQuery = useQuery({
    queryKey: ["parents", { search, page }],
    queryFn: () =>
      api.parents.list({
        search: search.trim() || undefined,
        page,
        perPage: PER_PAGE,
      }),
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["parents"] });
    await queryClient.invalidateQueries({ queryKey: ["stats"] });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const base = {
        parentName: form.parentName.trim(),
        students: form.students
          .filter((student) => student.name.trim())
          .map((student) => ({
            // `id` hanya dikirim untuk anak yang sudah tersimpan.
            ...(student.id !== undefined ? { id: student.id } : {}),
            name: student.name.trim(),
            className: student.className.trim() || null,
          })),
        relationship: form.relationship,
        // `className` hanya bermakna untuk korlas — backend mengabaikannya
        // untuk role `parent` dan membersihkannya saat role diturunkan.
        role: form.role,
        className: form.role === "korlas" ? form.className.trim() || null : null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
      };

      if (editing) {
        return api.parents.update(editing.id, {
          ...base,
          username: form.username.trim(),
          ...(form.password ? { password: form.password } : {}),
        });
      }

      return api.parents.create({
        ...base,
        username: form.username.trim(),
        password: form.password,
      });
    },
    onSuccess: async (result) => {
      setBanner({ kind: "ok", text: result.message });
      setFormOpen(false);
      await invalidate();
    },
    onError: (error) =>
      setFormError(errorMessage(error, "Tidak bisa menyimpan akun")),
  });

  const removeMutation = useMutation({
    mutationFn: (vars: { id: number; hard: boolean }) =>
      api.parents.remove(vars.id, vars.hard),
    onSuccess: async (result) => {
      setPendingRemove(null);
      setBanner({ kind: "ok", text: result.message });
      await invalidate();
    },
    onError: (error) => {
      setPendingRemove(null);
      setBanner({ kind: "error", text: errorMessage(error, "Gagal menghapus akun") });
    },
  });

  const resetMutation = useMutation({
    mutationFn: (vars: { id: number; password: string }) =>
      api.parents.resetPassword(vars.id, vars.password),
    onSuccess: async (result) => {
      setBanner({ kind: "ok", text: result.message });
      setResetTarget(null);
      setResetPassword("");
      await invalidate();
    },
    onError: (error) =>
      setBanner({
        kind: "error",
        text: errorMessage(error, "Gagal mereset password"),
      }),
  });

  const unlockMutation = useMutation({
    mutationFn: (id: number) => api.parents.unlock(id),
    onSuccess: async (result) => {
      setPendingUnlock(null);
      setBanner({ kind: "ok", text: result.message });
      await invalidate();
    },
    onError: (error) => {
      setPendingUnlock(null);
      setBanner({
        kind: "error",
        text: errorMessage(error, "Gagal membuka kunci akun"),
      });
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (parent: ParentDto) => {
    setEditing(parent);
    setForm({
      username: parent.username,
      password: "",
      parentName: parent.parentName,
      relationship: parent.relationship,
      role: parent.role,
      className: parent.className ?? "",
      students:
        parent.students.length > 0
          ? parent.students.map((student) => ({
              id: student.id,
              name: student.name,
              className: student.className ?? "",
            }))
          : [{ ...EMPTY_STUDENT }],
      phone: parent.phone ?? "",
      email: parent.email ?? "",
    });
    setFormError(null);
    setFormOpen(true);
  };

  const addStudent = () =>
    setForm((current) => ({
      ...current,
      students: [...current.students, { ...EMPTY_STUDENT }],
    }));

  const updateStudent = (index: number, patch: Partial<FormStudent>) =>
    setForm((current) => ({
      ...current,
      students: current.students.map((student, i) =>
        i === index ? { ...student, ...patch } : student,
      ),
    }));

  const removeStudent = (index: number) =>
    setForm((current) => ({
      ...current,
      students: current.students.filter((_, i) => i !== index),
    }));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (!form.username.trim()) return setFormError("Username wajib diisi");
    if (!form.parentName.trim()) return setFormError("Nama orang tua wajib diisi");
    if (!form.students.some((student) => student.name.trim())) {
      return setFormError("Minimal satu nama anak wajib diisi");
    }

    // Korlas tanpa kelas tidak punya cakupan apa pun.
    if (form.role === "korlas" && !form.className.trim()) {
      return setFormError("Kelas yang dikoordinasi wajib diisi untuk korlas");
    }

    if (!editing) {
      if (!form.password) return setFormError("Password wajib diisi");
      if (form.password.length < 8) {
        return setFormError("Password minimal 8 karakter");
      }
    } else if (form.password && form.password.length < 8) {
      return setFormError("Password minimal 8 karakter");
    }

    saveMutation.mutate();
  };

  const data = parentsQuery.data;
  const busy = removeMutation.isPending || unlockMutation.isPending;

  return (
    <>
      <PageHeader
        title="Akun Orang Tua"
        description="Setiap orang tua punya akun sendiri untuk melihat jadwal."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Akun baru
          </Button>
        }
      />

      {banner && (
        <div
          className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
            banner.kind === "ok"
              ? "border-brand-200 bg-brand-50 text-brand-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {banner.text}
        </div>
      )}

      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Cari nama, siswa, kelas, atau username…"
          className="pl-9"
        />
      </div>

      <Card>
        {parentsQuery.isPending && <Spinner />}

        {parentsQuery.isError && (
          <ErrorState
            message={parentsQuery.error.message}
            onRetry={() => void parentsQuery.refetch()}
          />
        )}

        {data && data.items.length === 0 && (
          <EmptyState
            icon={<Users className="h-8 w-8" />}
            title={search ? "Akun tidak ditemukan" : "Belum ada akun orang tua"}
            description={
              search
                ? `Tidak ada akun yang cocok dengan "${search}".`
                : "Tambahkan akun agar orang tua bisa login."
            }
            action={!search ? <Button onClick={openCreate}>Tambah akun</Button> : undefined}
          />
        )}

        {data && data.items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <th className="px-5 py-3 font-medium text-slate-500">Username</th>
                  <th className="px-5 py-3 font-medium text-slate-500">Orang tua</th>
                  <th className="px-5 py-3 font-medium text-slate-500">Anak</th>
                  <th className="px-5 py-3 font-medium text-slate-500">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((parent) => (
                  <tr key={parent.id} className="hover:bg-slate-50">
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
                          onClick={() => openEdit(parent)}
                          title="Ubah"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setResetTarget(parent);
                            setResetPassword("");
                          }}
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
                            onClick={() => setPendingUnlock(parent)}
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
                          onClick={() =>
                            setPendingRemove({ parent, hard: false })
                          }
                          title="Nonaktifkan"
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                          disabled={busy}
                          onClick={() => setPendingRemove({ parent, hard: true })}
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
        )}

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3">
            <p className="text-sm text-slate-500">
              Halaman {data.page} dari {data.totalPages} · {data.total} akun
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={data.page <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                Sebelumnya
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={data.page >= data.totalPages}
                onClick={() => setPage((value) => value + 1)}
              >
                Berikutnya
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Modal
        open={formOpen}
        title={editing ? "Ubah akun orang tua" : "Akun orang tua baru"}
        onClose={() => setFormOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmit} loading={saveMutation.isPending} type="submit">
              Simpan
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Username" hint="Huruf kecil, angka, titik, - atau _">
              <Input
                value={form.username}
                onChange={(event) =>
                  setForm({ ...form, username: event.target.value })
                }
                placeholder="mis. sari"
                autoComplete="off"
              />
            </Field>

            <Field
              label={editing ? "Password baru" : "Password"}
              hint={editing ? "Kosongkan bila tidak diubah" : "Minimal 8 karakter"}
            >
              <Input
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm({ ...form, password: event.target.value })
                }
                autoComplete="new-password"
              />
            </Field>

            <Field label="Nama orang tua">
              <Input
                value={form.parentName}
                onChange={(event) =>
                  setForm({ ...form, parentName: event.target.value })
                }
                placeholder="mis. Sari Wulandari"
              />
            </Field>

            <Field label="Hubungan">
              <Select
                value={form.relationship}
                onChange={(event) =>
                  setForm({
                    ...form,
                    relationship: event.target.value as ParentRelationship,
                  })
                }
              >
                {RELATIONSHIP_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Peran"
              hint="Korlas boleh mengubah jadwal kelasnya sendiri dan mengelola katalog menu."
            >
              <Select
                value={form.role}
                onChange={(event) =>
                  setForm({ ...form, role: event.target.value as ManagedRole })
                }
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>

            {form.role === "korlas" && (
              <Field
                label="Kelas yang dikoordinasi"
                hint="Mis. 1A. Korlas hanya dapat mengubah jadwal kelas ini."
              >
                <Input
                  value={form.className}
                  onChange={(event) =>
                    setForm({ ...form, className: event.target.value })
                  }
                  placeholder="1A"
                />
              </Field>
            )}

            <Field label="No. HP" hint="Opsional.">
              <Input
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                placeholder="08xxxxxxxxxx"
              />
            </Field>

            <Field label="Email" hint="Opsional.">
              <Input
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                placeholder="nama@contoh.com"
              />
            </Field>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-slate-700">
                Anak
                <span className="ml-1.5 text-xs font-normal text-slate-400">
                  boleh lebih dari satu
                </span>
              </span>
              <Button variant="ghost" size="sm" type="button" onClick={addStudent}>
                <Plus className="h-3.5 w-3.5" />
                Tambah anak
              </Button>
            </div>

            <div className="space-y-2">
              {form.students.map((student, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={student.name}
                    onChange={(event) =>
                      updateStudent(index, { name: event.target.value })
                    }
                    placeholder={`Nama anak ${index + 1}`}
                    className="min-w-0 flex-1"
                  />
                  <Input
                    value={student.className}
                    onChange={(event) =>
                      updateStudent(index, { className: event.target.value })
                    }
                    placeholder="Kelas"
                    className="w-28 shrink-0"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    className="shrink-0 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    onClick={() => removeStudent(index)}
                    disabled={form.students.length === 1}
                    title="Hapus anak"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {formError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </p>
          )}
        </form>
      </Modal>

      <Modal
        open={resetTarget !== null}
        title={`Reset password — ${resetTarget?.username ?? ""}`}
        onClose={() => setResetTarget(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setResetTarget(null)}>
              Batal
            </Button>
            <Button
              loading={resetMutation.isPending}
              onClick={() => {
                if (resetTarget) {
                  resetMutation.mutate({
                    id: resetTarget.id,
                    password: resetPassword,
                  });
                }
              }}
            >
              Reset
            </Button>
          </>
        }
      >
        <Field label="Password baru" hint="Minimal 8 karakter.">
          <Input
            type="password"
            value={resetPassword}
            onChange={(event) => setResetPassword(event.target.value)}
            autoComplete="new-password"
            autoFocus
          />
        </Field>
      </Modal>

      {/*
        Satu dialog untuk dua kadar tindakan: menonaktifkan akun masih bisa
        dibatalkan (akun tinggal diaktifkan lagi), menghapus permanen tidak.
        Teksnya dibedakan supaya bedanya tidak tersamar.
      */}
      <ConfirmDialog
        open={pendingRemove !== null}
        title={pendingRemove?.hard ? "Hapus permanen?" : "Nonaktifkan akun?"}
        description={
          pendingRemove?.hard ? (
            <>
              Akun <strong>{pendingRemove.parent.username}</strong> beserta
              seluruh datanya akan dihapus permanen. Tindakan ini tidak bisa
              dibatalkan.
            </>
          ) : (
            <>
              Akun <strong>{pendingRemove?.parent.username}</strong> akan
              dinonaktifkan sehingga tidak bisa masuk. Datanya tetap tersimpan
              dan bisa diaktifkan kembali kapan saja.
            </>
          )
        }
        confirmLabel={pendingRemove?.hard ? "Hapus permanen" : "Nonaktifkan"}
        tone={pendingRemove?.hard ? "danger" : "primary"}
        loading={removeMutation.isPending}
        onConfirm={() =>
          pendingRemove &&
          removeMutation.mutate({
            id: pendingRemove.parent.id,
            hard: pendingRemove.hard,
          })
        }
        onClose={() => setPendingRemove(null)}
      />

      {/*
        Konfirmasi sebelum membuka kunci. Bukan sekadar formalitas: akun yang
        terkunci berarti seseorang gagal masuk berkali-kali, dan admin perlu
        tahu itu sebelum mengembalikan aksesnya.
      */}
      <ConfirmDialog
        open={pendingUnlock !== null}
        title="Buka kunci akun?"
        description={
          <>
            Akun <strong>{pendingUnlock?.username}</strong> terkunci karena
            percobaan masuk yang gagal berulang kali. Setelah dibuka, ia bisa
            masuk lagi dengan password yang sama — passwordnya tidak berubah.
          </>
        }
        confirmLabel="Buka kunci"
        loading={unlockMutation.isPending}
        onConfirm={() =>
          pendingUnlock && unlockMutation.mutate(pendingUnlock.id)
        }
        onClose={() => setPendingUnlock(null)}
      />
    </>
  );
}
