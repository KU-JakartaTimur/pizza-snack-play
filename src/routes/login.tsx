import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button, Card, Field, Input, SuccessDialog } from "@/components/ui";
import { errorMessage } from "@/lib/api";
import { useAuth, type LoginResult } from "@/lib/auth-context";
import { cn } from "@/lib/cn";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

/**
 * Halaman masuk.
 *
 * Dua aturan yang dijaga di sini:
 *
 * 1. Sesi yang masih hidup tidak perlu melihat form — pengguna yang sudah
 *    masuk langsung diarahkan ke halaman utama.
 * 2. Sesudah berhasil masuk, popup sambutan tampil lebih dulu. Selama popup
 *    itu terbuka, pengalihan otomatis pada aturan 1 **ditahan** (lewat
 *    `welcome`) supaya pengguna sempat membaca bahwa loginnya berhasil.
 */
function LoginPage() {
  const { user, isReady } = useAuth();
  const navigate = useNavigate();
  /** Hasil login yang belum dikonfirmasi pengguna — `null` bila tidak ada. */
  const [welcome, setWelcome] = useState<LoginResult | null>(null);

  useEffect(() => {
    if (isReady && user && !welcome) void navigate({ to: "/hari-ini" });
  }, [isReady, user, welcome, navigate]);

  const enterApp = () => void navigate({ to: "/hari-ini" });

  return (
    <LoginLayout>
      <LoginForm onSuccess={setWelcome} />

      <SuccessDialog
        open={welcome !== null}
        title={welcome?.message ?? "Login berhasil"}
        description={
          welcome
            ? `Selamat datang, ${welcome.user.fullName ?? welcome.user.username}.`
            : ""
        }
        actionLabel="Mulai"
        onClose={enterApp}
      />
    </LoginLayout>
  );
}

/**
 * Kerangka halaman: latar berhias, logo, dan catatan kaki. Isi form masuk
 * dititipkan sebagai `children` agar alurnya menonjol saat membaca kode.
 */
function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <div className="brand-canvas relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <Blob className="-top-24 -left-24 h-72 w-72 bg-brand-300/30" />
      <Blob className="-bottom-28 -right-20 h-80 w-80 bg-accent-300/35" />
      <Blob className="top-1/3 -right-16 h-56 w-56 bg-highlight-300/35" />

      <div className="relative w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="relative mx-auto mb-3 flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl shadow-md">
            <img
              src={logo}
              alt="Pizza Snack Play"
              className="h-full w-full object-cover"
            />
          </span>
          <h1 className="brand-text-gradient text-xl font-bold">
            Pizza Snack Play
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Masuk untuk melihat jadwal snack
          </p>
        </div>

        {children}

        <p className="mt-4 text-center text-xs text-slate-400">
          Setiap orang tua punya akun sendiri. Hubungi admin bila belum punya.
        </p>
      </div>
    </div>
  );
}

/** Bulatan kabur sebagai ornamen latar. */
function Blob({ className }: { className: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute rounded-full blur-3xl", className)}
    />
  );
}

/**
 * Form username + password. Ia hanya mengurus isian, validasi, dan pemanggilan
 * login; apa yang terjadi sesudah berhasil diserahkan ke `onSuccess` supaya
 * halaman ini tetap bisa menentukan sendiri (mis. memunculkan popup).
 */
function LoginForm({ onSuccess }: { onSuccess: (result: LoginResult) => void }) {
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const name = username.trim();
    if (!name || !password) {
      setError("Username dan password wajib diisi");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      onSuccess(await login(name, password));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
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
  );
}
