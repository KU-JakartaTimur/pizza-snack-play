import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui";
import { useClasses } from "@/hooks/useClasses";
import { useAuth } from "@/lib/auth-context";

interface Notice {
  message: string;
  /** Tindakan yang bisa dilakukan user; kosong bila hanya admin yang bisa. */
  action?: { label: string; to: "/profil" | "/orang-tua" };
}

/**
 * Notifikasi "kelas belum ada" — banner bawah, mengikuti pola notifikasi PWA.
 *
 * Muncul hanya bila user tidak punya satu kelas pun untuk dilihat: orang tua
 * yang belum mendaftarkan anaknya (atau anaknya belum diisi kelasnya), atau
 * sistem yang memang belum punya kelas sama sekali. Tanpa ini halaman jadwal
 * hanya tampak kosong tanpa penjelasan apa yang kurang.
 */
export function ClassNotice() {
  const { isAdmin, isKorlas } = useAuth();
  const { classes, isLoading } = useClasses();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  // Jangan berkedip saat daftar kelas masih diambil, dan jangan menahan
  // user yang sudah menutupnya.
  if (isLoading || dismissed || classes.length > 0) return null;

  const notice: Notice = isAdmin
    ? {
        message:
          "Belum ada kelas di sistem. Daftarkan orang tua beserta anaknya lebih dulu.",
        action: { label: "Kelola Orang Tua", to: "/orang-tua" },
      }
    : isKorlas
      ? // Korlas melihat semua kelas, jadi daftar kosong berarti sistemnya belum
        // punya kelas — bukan sesuatu yang bisa ia perbaiki sendiri.
        { message: "Belum ada kelas di sistem. Hubungi admin untuk melengkapinya." }
      : {
          message:
            "Kelas anak Anda belum diisi. Lengkapi data anak di menu Profil agar jadwal snack bisa tampil.",
          action: { label: "Lengkapi di Profil", to: "/profil" },
        };

  const { action } = notice;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-highlight-300 bg-highlight-50 px-4 py-3 shadow-lg">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <GraduationCap className="h-5 w-5 shrink-0 text-highlight-700" />
          <p className="text-sm text-highlight-900">{notice.message}</p>
        </div>

        <div className="flex shrink-0 gap-2">
          <Button variant="ghost" size="sm" onClick={() => setDismissed(true)}>
            Nanti
          </Button>
          {action && (
            <Button size="sm" onClick={() => void navigate({ to: action.to })}>
              {action.label}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
