import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button, Card, Field, Input } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import logo from "@/assets/logo.png";

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
    <div className="brand-canvas relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      {/* Ornamen latar — tiga warna palet sebagai blob lembut. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-brand-300/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-accent-300/35 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/3 -right-16 h-56 w-56 rounded-full bg-highlight-300/35 blur-3xl"
      />

      <div className="relative w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="relative mx-auto mb-3 flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl shadow-md">
            <img src={logo} alt="Pizza Snack Play" className="h-full w-full object-cover" />
          </span>
          <h1 className="brand-text-gradient text-xl font-bold">
            Pizza Snack Play
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Masuk untuk melihat jadwal snack
          </p>
        </div>

        <Card className="overflow-hidden">
          <div className="brand-stripe" />
          <form onSubmit={handleSubmit} className="space-y-4 p-6">
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
