import { useEffect } from "react";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { FullPageSpinner } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";

/**
 * Layout untuk semua halaman yang butuh login.
 * Guard di sisi klien: token diverifikasi lewat `/auth/me`, lalu bila
 * tidak valid pengguna diarahkan ke halaman masuk.
 */
export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, isReady } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isReady && !user) void navigate({ to: "/login" });
  }, [isReady, user, navigate]);

  if (!isReady) return <FullPageSpinner label="Memeriksa sesi…" />;
  if (!user) return <FullPageSpinner label="Mengalihkan ke halaman masuk…" />;

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
