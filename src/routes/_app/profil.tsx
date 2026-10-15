import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { AccountInfoCard } from "@/components/profile/AccountInfoCard";
import { ChangePasswordCard } from "@/components/profile/ChangePasswordCard";
import { ChildrenCard } from "@/components/profile/ChildrenCard";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_app/profil")({
  component: ProfilePage,
});

/**
 * Halaman Profil.
 *
 * Isinya tiga kartu mandiri yang masing-masing mengurus datanya sendiri —
 * informasi akun, data anak (khusus orang tua), dan password. Berkas ini
 * hanya menyusun tata letaknya, sehingga menambah atau memindahkan kartu tidak
 * perlu menyentuh logika kartu yang sudah ada.
 */
function ProfilePage() {
  const { isAdmin } = useAuth();

  return (
    <>
      <PageHeader
        title="Profil"
        description="Informasi akun dan pengaturan password."
      />

      <div className="space-y-6">
        {/* Admin tidak punya profil orang tua, jadi tidak ada anak yang dikelola. */}
        {!isAdmin && <ChildrenCard />}

        <div className="grid gap-6 lg:grid-cols-2">
          <AccountInfoCard />
          <ChangePasswordCard />
        </div>
      </div>
    </>
  );
}
