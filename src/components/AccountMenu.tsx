import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, UserCircle, UserCog } from "lucide-react";
import { ConfirmDialog } from "@/components/ui";
import { ImpersonateDialog } from "./ImpersonateDialog";
import { ClassSwitcher } from "./ClassSwitcher";
import { useAuth } from "@/lib/auth-context";
import { errorMessage } from "@/lib/api";
import type { ParentDto } from "@/types/account";

/**
 * Bagian kanan header: pemilih kelas, identitas pemakai, tautan Profil, dan
 * tombol keluar — plus pintasan "Login as" bagi admin.
 *
 * Tombol keluar sengaja tidak langsung memutus sesi — ia membuka dialog
 * "Ingin keluar?" lebih dulu, supaya tidak ada yang terlempar ke halaman masuk
 * karena salah sentuh. Dialog itu juga yang menjadi satu-satunya tempat
 * `logout()` dipanggil dari antarmuka.
 */
export function AccountMenu() {
  const {
    user,
    students,
    isAdmin,
    isKorlas,
    isImpersonating,
    impersonate,
    korlasClass,
    logout,
  } = useAuth();
  const navigate = useNavigate();
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const [pickingAccount, setPickingAccount] = useState(false);
  const [busyUserId, setBusyUserId] = useState<number | null>(null);
  const [pickError, setPickError] = useState<string | null>(null);

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

  const handlePickAccount = async (parent: ParentDto) => {
    setBusyUserId(parent.userId);
    setPickError(null);

    try {
      await impersonate(parent.userId);
      setPickingAccount(false);
      // Halaman yang sedang dibuka bisa saja khusus admin (mis. Kelola Orang
      // Tua) dan tidak berlaku lagi untuk sesi baru ini.
      void navigate({ to: "/hari-ini" });
    } catch (error) {
      setPickError(errorMessage(error, "Tidak bisa masuk sebagai akun ini"));
    } finally {
      setBusyUserId(null);
    }
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

      {/*
        "Login as" hanya untuk admin, dan disembunyikan selama sesi yang aktif
        adalah hasil Login as — dari dalam akun orang lain tidak ada yang perlu
        dibuka lagi, yang ada hanya jalan pulang (bilah di bawah layar).
      */}
      {isAdmin && !isImpersonating && (
        <button
          type="button"
          onClick={() => {
            setPickError(null);
            setPickingAccount(true);
          }}
          className="rounded-lg p-2 text-slate-500 hover:bg-brand-50 hover:text-brand-700"
          title="Login as — masuk sebagai korlas atau orang tua"
        >
          <UserCog className="h-5 w-5" />
        </button>
      )}

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

      <ImpersonateDialog
        open={pickingAccount}
        busyUserId={busyUserId}
        error={pickError}
        onSelect={handlePickAccount}
        onClose={() => setPickingAccount(false)}
      />

      <ConfirmDialog
        open={confirmingLogout}
        title="Ingin keluar?"
        description={
          isImpersonating
            ? "Sesi ini dan sesi admin yang tersimpan akan sama-sama diakhiri. Bila hanya ingin kembali sebagai admin, pakai tombol “Kembali ke admin” di bawah layar."
            : "Sesi Anda akan diakhiri dan Anda kembali ke halaman masuk."
        }
        confirmLabel="Keluar"
        tone="danger"
        onConfirm={handleLogout}
        onClose={() => setConfirmingLogout(false)}
      />
    </>
  );
}
