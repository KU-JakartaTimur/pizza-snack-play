import type { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { Card, EmptyState } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";

/** Tampilan saat pengguna tidak punya hak akses ke sebuah halaman. */
export function AccessDenied() {
  return (
    <Card>
      <EmptyState
        icon={<ShieldAlert className="h-8 w-8" />}
        title="Akses ditolak"
        description="Halaman ini hanya dapat diakses oleh admin."
      />
    </Card>
  );
}

/**
 * Pembatas sisi klien untuk halaman khusus admin.
 *
 * Ini hanya untuk pengalaman pengguna — penegakan sebenarnya tetap dilakukan
 * API lewat `requireRole("admin")`, sehingga data tidak pernah bocor
 * meskipun pembatas ini dilewati.
 */
export function AdminOnly({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();
  return isAdmin ? <>{children}</> : <AccessDenied />;
}
