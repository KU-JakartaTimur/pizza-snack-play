import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Pencil, Plus, Trash2, Users } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  Input,
  Modal,
  Spinner,
} from "@/components/ui";
import { api, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { StudentProfile } from "@/types/auth";

export const Route = createFileRoute("/_app/profil")({
  component: ProfilePage,
});

/** Referensi tetap agar tidak membuat array baru setiap render. */
const EMPTY_CLASSES: string[] = [];
const EMPTY_STUDENTS: StudentProfile[] = [];
/** Id `datalist` saran kelas — dipakai bersama oleh kolom kelas di modal. */
const CLASS_DATALIST_ID = "psp-kelas-tersedia";

function ProfilePage() {
  const { user, isAdmin, relationship } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);

    if (newPassword.length < 8) {
      setMessage({ kind: "error", text: "Password baru minimal 8 karakter" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ kind: "error", text: "Konfirmasi password tidak cocok" });
      return;
    }

    setSubmitting(true);
    try {
      const result = await api.auth.changePassword({
        currentPassword,
        newPassword,
      });
      setMessage({ kind: "ok", text: result.message });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setMessage({ kind: "error", text: errorMessage(error) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader title="Profil" description="Informasi akun dan pengaturan password." />

      <div className="space-y-6">
        {/* Admin tidak punya profil orang tua, jadi tidak ada anak yang dikelola. */}
        {!isAdmin && <ChildrenCard />}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Informasi Akun" />
            <dl className="divide-y divide-slate-100 px-5">
              <Row label="Username" value={user?.username ?? "-"} />
              <Row label="Nama" value={user?.fullName ?? "-"} />
              <Row
                label="Peran"
                value={user?.role === "admin" ? "Admin" : "Orang tua"}
              />
              {relationship && <Row label="Hubungan" value={relationship} />}
            </dl>
          </Card>

          <Card>
            <CardHeader
              title="Ubah Password"
              description="Minimal 8 karakter dan berbeda dari password lama."
            />
            <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
              <Field label="Password saat ini">
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
              </Field>

              <Field label="Password baru">
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  autoComplete="new-password"
                  required
                />
              </Field>

              <Field label="Konfirmasi password baru">
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  required
                />
              </Field>

              {message && (
                <p
                  className={
                    message.kind === "ok"
                      ? "rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-700"
                      : "rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                  }
                >
                  {message.text}
                </p>
              )}

              <Button type="submit" loading={submitting}>
                <KeyRound className="h-4 w-4" />
                Simpan password
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}

/**
 * Kartu "Data Anak" — orang tua mendaftarkan anaknya sendiri dari menu Profil.
 *
 * Daftarnya diambil dari `/api/profile/students` (bukan hanya dari sesi) supaya
 * selalu segar, dengan daftar di sesi dipakai sebagai tampilan awal. Setiap
 * perubahan juga menyegarkan `useAuth()`, agar pemilih kelas dan halaman jadwal
 * langsung mengenal kelas baru tanpa perlu login ulang.
 */
function ChildrenCard() {
  const queryClient = useQueryClient();
  const { students, refresh } = useAuth();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StudentProfile | null>(null);
  // Anak yang menunggu ditegaskan penghapusannya — dialog konfirmasi
  // menggantikan `confirm()` bawaan peramban.
  const [pendingDelete, setPendingDelete] = useState<StudentProfile | null>(null);
  const [form, setForm] = useState({ name: "", className: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ kind: "ok" | "error"; text: string } | null>(
    null,
  );

  const studentsQuery = useQuery({
    queryKey: ["profile", "students"],
    queryFn: api.profile.students,
    // Tampilkan dulu daftar dari sesi agar kartu tidak berkedip kosong.
    placeholderData: students,
  });

  const classesQuery = useQuery({
    queryKey: ["profile", "classes"],
    queryFn: api.profile.classOptions,
    // Hanya untuk saran isian — tidak perlu sering diambil ulang.
    staleTime: 5 * 60 * 1000,
  });

  const list = studentsQuery.data ?? EMPTY_STUDENTS;
  const suggestions = classesQuery.data?.classes ?? EMPTY_CLASSES;

  /** Segarkan daftar anak, saran kelas, dan profil di konteks sesi. */
  const syncAfterChange = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["profile", "students"] }),
      // Kelas baru bisa muncul bila anak didaftarkan ke kelas yang belum ada.
      queryClient.invalidateQueries({ queryKey: ["classes"] }),
    ]);

    // Kegagalan di sini tidak fatal: daftar di kartu ini berasal dari query
    // di atas — `refresh()` hanya menyamakan sesi (pemilih kelas, header).
    await refresh().catch(() => undefined);
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", className: suggestions[0] ?? "" });
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (student: StudentProfile) => {
    setEditing(student);
    setForm({ name: student.name, className: student.className ?? "" });
    setFormError(null);
    setFormOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const name = form.name.trim();
      const className = form.className.trim();

      return editing
        ? api.profile.updateStudent(editing.id, { name, className })
        : api.profile.addStudent({ name, className });
    },
    onSuccess: async (result) => {
      setFormOpen(false);
      setBanner({ kind: "ok", text: result.message });
      await syncAfterChange();
    },
    onError: (error) => {
      setFormError(errorMessage(error));
    },
  });

  const removeMutation = useMutation({
    mutationFn: (student: StudentProfile) => api.profile.removeStudent(student.id),
    onSuccess: async (result) => {
      setPendingDelete(null);
      setBanner({ kind: "ok", text: result.message });
      await syncAfterChange();
    },
    onError: (error) => {
      setPendingDelete(null);
      setBanner({ kind: "error", text: errorMessage(error) });
    },
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (!form.name.trim()) {
      setFormError("Nama anak wajib diisi");
      return;
    }
    if (!form.className.trim()) {
      setFormError("Kelas wajib diisi");
      return;
    }

    saveMutation.mutate();
  };

  return (
    <Card>
      <CardHeader
        title="Data Anak"
        description="Daftarkan anak Anda di sini agar jadwal kelasnya bisa dilihat dan tanggal piketnya bisa diambil."
        action={
          <Button size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Tambah anak
          </Button>
        }
      />

      {banner && (
        <p
          className={
            banner.kind === "ok"
              ? "mx-5 mt-4 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-700"
              : "mx-5 mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          }
        >
          {banner.text}
        </p>
      )}

      {studentsQuery.isPending ? (
        <Spinner label="Memuat data anak…" />
      ) : studentsQuery.isError ? (
        <ErrorState
          message={errorMessage(studentsQuery.error, "Tidak bisa memuat data anak")}
          onRetry={() => void studentsQuery.refetch()}
        />
      ) : list.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title="Belum ada anak terdaftar"
          description="Tambahkan anak Anda beserta kelasnya agar jadwal kelas tersebut muncul di aplikasi."
          action={
            <Button size="sm" onClick={openAdd}>
              <Plus className="h-4 w-4" />
              Tambah anak
            </Button>
          }
        />
      ) : (
        <ul className="divide-y divide-slate-100 px-5">
          {list.map((student) => (
            <li
              key={student.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800">{student.name}</p>
                {!student.className && (
                  <p className="text-xs text-slate-500">Kelas belum diisi</p>
                )}
              </div>

              <div className="flex items-center gap-1">
                {student.className && (
                  <Badge tone="info">Kelas {student.className}</Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEdit(student)}
                  title="Ubah data anak"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:bg-red-50"
                  disabled={removeMutation.isPending}
                  onClick={() => setPendingDelete(student)}
                  title="Hapus data anak"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={formOpen}
        title={editing ? "Ubah data anak" : "Tambah anak"}
        onClose={() => setFormOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmit} loading={saveMutation.isPending}>
              Simpan
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nama anak">
            <Input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="mis. Aisyah Sari"
              autoComplete="off"
            />
          </Field>

          <Field
            label="Kelas"
            hint="Harus sama dengan kelas yang dipakai sekolah, mis. 1 atau 1A."
          >
            <Input
              value={form.className}
              onChange={(event) => setForm({ ...form, className: event.target.value })}
              list={CLASS_DATALIST_ID}
              placeholder="mis. 1"
              autoComplete="off"
            />
          </Field>

          {/* Saran dari kelas yang sudah dikenal sistem — kolomnya tetap bebas diisi. */}
          <datalist id={CLASS_DATALIST_ID}>
            {suggestions.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>

          {formError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </p>
          )}
        </form>
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Hapus data anak?"
        description={
          <>
            Data <strong>{pendingDelete?.name}</strong> akan dihapus dari daftar
            Anda. Anak terakhir tidak bisa dihapus — minimal satu anak harus
            terdaftar.
          </>
        }
        confirmLabel="Hapus"
        tone="danger"
        loading={removeMutation.isPending}
        onConfirm={() =>
          pendingDelete && removeMutation.mutate(pendingDelete)
        }
        onClose={() => setPendingDelete(null)}
      />
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-sm font-medium text-slate-800">{value}</dd>
    </div>
  );
}
