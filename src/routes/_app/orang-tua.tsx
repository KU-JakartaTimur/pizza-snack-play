import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  KeyRound,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserX,
  Users,
} from "lucide-react";
import { AdminOnly } from "@/components/AdminOnly";
import { PageHeader } from "@/components/AppShell";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Input,
  Modal,
  Select,
  Spinner,
} from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import type { ParentDto, ParentRelationship } from "@/types/account";

export const Route = createFileRoute("/_app/orang-tua")({
  component: ParentsPage,
});

const RELATIONSHIP_OPTIONS: { value: ParentRelationship; label: string }[] = [
  { value: "ibu", label: "Ibu" },
  { value: "ayah", label: "Ayah" },
  { value: "wali", label: "Wali" },
];

const PER_PAGE = 20;

interface ParentForm {
  username: string;
  password: string;
  parentName: string;
  studentName: string;
  studentClass: string;
  relationship: ParentRelationship;
  phone: string;
  email: string;
}

const EMPTY_FORM: ParentForm = {
  username: "",
  password: "",
  parentName: "",
  studentName: "",
  studentClass: "",
  relationship: "ibu",
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
        studentName: form.studentName.trim(),
        studentClass: form.studentClass.trim() || null,
        relationship: form.relationship,
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
      setFormError(
        error instanceof ApiError ? error.message : "Tidak bisa menyimpan akun",
      ),
  });

  const removeMutation = useMutation({
    mutationFn: (vars: { id: number; hard: boolean }) =>
      api.parents.remove(vars.id, vars.hard),
    onSuccess: async (result) => {
      setBanner({ kind: "ok", text: result.message });
      await invalidate();
    },
    onError: (error) =>
      setBanner({
        kind: "error",
        text: error instanceof ApiError ? error.message : "Gagal menghapus akun",
      }),
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
        text: error instanceof ApiError ? error.message : "Gagal mereset password",
      }),
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
      studentName: parent.studentName,
      studentClass: parent.studentClass ?? "",
      relationship: parent.relationship,
      phone: parent.phone ?? "",
      email: parent.email ?? "",
    });
    setFormError(null);
    setFormOpen(true);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (!form.username.trim()) return setFormError("Username wajib diisi");
    if (!form.parentName.trim()) return setFormError("Nama orang tua wajib diisi");
    if (!form.studentName.trim()) return setFormError("Nama siswa wajib diisi");

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
  const busy = removeMutation.isPending;

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
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
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
                  <th className="px-5 py-3 font-medium text-slate-500">Siswa</th>
                  <th className="px-5 py-3 font-medium text-slate-500">Kelas</th>
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
                    </td>
                    <td className="px-5 py-3 text-slate-800">
                      {parent.studentName}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {parent.studentClass ?? "—"}
                    </td>
                    <td className="px-5 py-3">
                      {parent.isActive ? (
                        <Badge tone="success">Aktif</Badge>
                      ) : (
                        <Badge tone="danger">Nonaktif</Badge>
                      )}
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
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-amber-600 hover:bg-amber-50"
                          disabled={busy}
                          onClick={() => {
                            if (confirm(`Nonaktifkan akun "${parent.username}"?`)) {
                              removeMutation.mutate({ id: parent.id, hard: false });
                            }
                          }}
                          title="Nonaktifkan"
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                          disabled={busy}
                          onClick={() => {
                            if (
                              confirm(
                                `Hapus permanen akun "${parent.username}"? Tindakan ini tidak bisa dibatalkan.`,
                              )
                            ) {
                              removeMutation.mutate({ id: parent.id, hard: true });
                            }
                          }}
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

            <Field label="Nama siswa">
              <Input
                value={form.studentName}
                onChange={(event) =>
                  setForm({ ...form, studentName: event.target.value })
                }
                placeholder="mis. Aisyah Sari"
              />
            </Field>

            <Field label="Kelas">
              <Input
                value={form.studentClass}
                onChange={(event) =>
                  setForm({ ...form, studentClass: event.target.value })
                }
                placeholder="mis. 1A"
              />
            </Field>

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
    </>
  );
}
