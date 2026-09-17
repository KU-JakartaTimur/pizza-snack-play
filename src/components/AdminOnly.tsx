import type { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { Card, EmptyState } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";

/** Tampilan saat pengguna tidak punya hak akses ke sebuah halaman. */
export function AccessDenied({ description }: { description?: string }) {
  return (
    <Card>
      <EmptyState
        icon={<ShieldAlert className="h-8 w-8" />}
        title="Akses ditolak"
        description={description ?? "Halaman ini hanya dapat diakses oleh admin."}
      />
    </Card>
  );
}

/** Kemampuan yang bisa dipakai untuk membatasi sebuah halaman. */
export type Capability = "admin" | "schedule" | "catalog";

const DENIED_MESSAGE: Record<Capability, string> = {
  admin: "Halaman ini hanya dapat diakses oleh admin.",
  schedule:
    "Halaman ini hanya dapat diakses oleh admin dan koordinator kelas (korlas).",
  catalog:
    "Halaman ini hanya dapat diakses oleh admin dan koordinator kelas (korlas).",
};

/**
 * Pembatas sisi klien untuk halaman berdasarkan kemampuan user.
 *
 * Ini hanya untuk pengalaman pengguna — penegakan sebenarnya tetap dilakukan
 * API lewat `requireRole(...)`, sehingga data tidak pernah bocor meskipun
 * pembatas ini dilewati.
 */
export function RoleGate({
  need,
  children,
}: {
  need: Capability;
  children: ReactNode;
}) {
  const { isAdmin, canManageSchedule, canManageCatalog } = useAuth();

  const allowed =
    need === "admin"
      ? isAdmin
      : need === "schedule"
        ? canManageSchedule
        : canManageCatalog;

  return allowed ? (
    <>{children}</>
  ) : (
    <AccessDenied description={DENIED_MESSAGE[need]} />
  );
}

/** Pintasan untuk halaman khusus admin. */
export function AdminOnly({ children }: { children: ReactNode }) {
  return <RoleGate need="admin">{children}</RoleGate>;
}
