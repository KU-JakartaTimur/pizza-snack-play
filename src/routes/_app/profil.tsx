import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { KeyRound } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import {
  Button,
  Card,
  CardHeader,
  Field,
  Input,
} from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_app/profil")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user, students, relationship } = useAuth();

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
      setMessage({
        kind: "error",
        text:
          error instanceof ApiError ? error.message : "Tidak bisa menghubungi server",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader title="Profil" description="Informasi akun dan pengaturan password." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Informasi Akun" />
          <dl className="divide-y divide-slate-100 px-5">
            <Row label="Username" value={user?.username ?? "-"} />
            <Row label="Nama" value={user?.fullName ?? "-"} />
            <Row label="Peran" value={user?.role === "admin" ? "Admin" : "Orang tua"} />
            {relationship && <Row label="Hubungan" value={relationship} />}
            {students.map((item) => (
              <Row
                key={item.id}
                label={students.length > 1 ? "Anak" : "Siswa"}
                value={`${item.name}${item.className ? ` (${item.className})` : ""}`}
              />
            ))}
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
                    ? "rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
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
    </>
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
