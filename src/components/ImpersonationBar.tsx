import { useNavigate } from "@tanstack/react-router";
import { UserCog } from "lucide-react";
import { Button } from "@/components/ui";
import { usePWA } from "@/hooks/usePWA";
import { useAuth } from "@/lib/auth-context";

/**
 * Bilah pengingat selama "Login as" berlangsung, sekaligus jalan pulang ke
 * sesi admin.
 *
 * Perubahan wewenang yang dibawa sesi ini tidak terlihat dari halaman — admin
 * yang sedang menjelajah sebagai orang tua bisa lupa bahwa tombol-tombol
 * adminnya memang sedang tidak ada. Bilah ini yang membuat keadaan itu
 * kentara dan mudah dibatalkan.
 */
export function ImpersonationBar() {
  const { user, impersonator, isImpersonating, stopImpersonating } = useAuth();
  const { isInstalled } = usePWA();
  const navigate = useNavigate();

  if (!isImpersonating) return null;

  // Sama seperti notifikasi PWA: bilah bawah mengambang menempati bagian
  // bawah layar, jadi bilah ini digeser ke atasnya.
  const bottomOffset = isInstalled ? "bottom-28" : "bottom-0";

  const current = user?.fullName ?? user?.username ?? "akun ini";
  const admin = impersonator?.fullName ?? impersonator?.username ?? "admin";

  const handleBack = () => {
    // Sesi admin dipulihkan lebih dulu, baru berpindah halaman — kalau
    // dibalik, halaman yang hanya boleh dibuka admin sempat dirender tanpa
    // hak aksesnya.
    stopImpersonating();
    void navigate({ to: "/hari-ini" });
  };

  return (
    <div
      className={`fixed left-0 right-0 z-50 border-t border-brand-300 bg-brand-50 px-4 py-3 shadow-lg ${bottomOffset}`}
    >
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <UserCog className="h-5 w-5 shrink-0 text-brand-700" />
          <p className="text-sm text-brand-900">
            Anda masuk sebagai <strong>{current}</strong> — sesi{" "}
            <strong>{admin}</strong> masih tersimpan.
          </p>
        </div>

        <Button size="sm" onClick={handleBack}>
          Kembali ke admin
        </Button>
      </div>
    </div>
  );
}
