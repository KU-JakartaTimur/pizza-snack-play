import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Pizza } from "lucide-react";import { Button, Card, Field, Input } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { login, user, isReady } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Sudah login → langsung ke halaman utama.
  useEffect(() => {
    if (isReady && user) void navigate({ to: "/hari-ini" });
  }, [isReady, user, navigate]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError("Username dan password wajib diisi");
      return;
    }

    setSubmitting(true);
    try {
      await login(username.trim(), password);
      await navigate({ to: "/hari-ini" });
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Tidak bisa menghubungi server",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white">
            <Pizza className="h-6 w-6" />
          </span>
          <h1 className="text-xl font-bold text-slate-900">Pizza Snack Play</h1>
          <p className="mt-1 text-sm text-slate-500">
            Masuk untuk melihat jadwal snack
          </p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Username">
              <Input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                autoFocus
                placeholder="mis. sari"
              />
            </Field>

            <Field label="Password">
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </Field>

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <Button type="submit" loading={submitting} className="w-full">
              {submitting ? "Memproses…" : "Masuk"}
            </Button>
          </form>
        </Card>

        <p className="mt-4 text-center text-xs text-slate-400">
          Setiap orang tua punya akun sendiri. Hubungi admin bila belum punya.
        </p>
      </div>
    </div>
  );
}
