import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, UserCircle } from "lucide-react";
import { ConfirmDialog } from "@/components/ui";
import { ClassSwitcher } from "./ClassSwitcher";
import { useAuth } from "@/lib/auth-context";

/**
 * Bagian kanan header: pemilih kelas, identitas pemakai, tautan Profil, dan
 * tombol keluar.
 *
 * Tombol keluar sengaja tidak langsung memutus sesi — ia membuka dialog
 * "Ingin keluar?" lebih dulu, supaya tidak ada yang terlempar ke halaman masuk
 * karena salah sentuh. Dialog itu juga yang menjadi satu-satunya tempat
 * `logout()` dipanggil dari antarmuka.
 */
export function AccountMenu() {
  const { user, students, isAdmin, isKorlas, korlasClass, logout } = useAuth();
  const navigate = useNavigate();
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  // Korlas tetap orang tua murid, tapi perannya ditampilkan tersendiri
  // beserta kelas yang dikoordinasinya.
  const roleLabel = isAdmin
    ? "Admin"
    : isKorlas
      ? `Korlas${korlasClass ? ` ${korlasClass}` : ""}`
      : "Orang tua";

  // Ringkas daftar anak agar muat di header; rinciannya lewat tooltip.
  const studentLabel =
    students.length === 0
      ? ""
      : students.length === 1
        ? ` · ${students[0].name}`
        : ` · ${students.length} anak`;

  const studentTooltip = students
    .map((s) => `${s.name}${s.className ? ` (${s.className})` : ""}`)
    .join(", ");

  const handleLogout = () => {
    setConfirmingLogout(false);
    logout();
    void navigate({ to: "/login" });
  };

  return (
    <>
      <ClassSwitcher />

      <div className="hidden text-right sm:block">
        <p className="text-sm font-medium text-slate-800 leading-tight">
          {user?.fullName ?? user?.username}
        </p>
        <p className="text-xs text-slate-500" title={studentTooltip || undefined}>
          {roleLabel}
          {studentLabel}
        </p>
      </div>

      <Link
        to="/profil"
        className="rounded-lg p-2 text-slate-500 hover:bg-brand-50 hover:text-brand-700"
        title="Profil & ubah password"
      >
        <UserCircle className="h-5 w-5" />
      </Link>

      <button
        type="button"
        onClick={() => setConfirmingLogout(true)}
        className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
        title="Keluar"
      >
        <LogOut className="h-5 w-5" />
      </button>

      <ConfirmDialog
        open={confirmingLogout}
        title="Ingin keluar?"
        description="Sesi Anda akan diakhiri dan Anda kembali ke halaman masuk."
        confirmLabel="Keluar"
        tone="danger"
        onConfirm={handleLogout}
        onClose={() => setConfirmingLogout(false)}
      />
    </>
  );
}
