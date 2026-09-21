import { createContext, useContext } from "react";
import type { AuthUser, StudentProfile } from "@/types/auth";

/** Kunci `localStorage` untuk JWT. Dipakai juga oleh `lib/http.ts`. */
export const TOKEN_KEY = "psp_token";

export interface AuthContextValue {
  user: AuthUser | null;
  /**
   * Anak dari orang tua yang sedang login. Selalu array —
   * satu orang tua dapat memiliki lebih dari satu anak.
   */
  students: StudentProfile[];
  /** Hubungan orang tua dengan siswa (`ibu` | `ayah` | `wali`). */
  relationship: string | null;
  token: string | null;
  /** `false` selama sesi tersimpan masih diverifikasi ke server. */
  isReady: boolean;
  isAdmin: boolean;
  /** `true` bila user adalah korlas (koordinator kelas). */
  isKorlas: boolean;
  /**
   * Kelas yang dikoordinasi — hanya terisi untuk korlas.
   * Dipakai untuk mengunci pemilih kelas di halaman kelola jadwal.
   */
  korlasClass: string | null;
  /**
   * Boleh menyunting jadwal (buat/ubah/hapus/salin) — admin (semua kelas)
   * atau korlas (kelasnya). Kunci & buka kunci jadwal bukan bagian dari
   * kemampuan ini; keduanya khusus admin.
   */
  canManageSchedule: boolean;
  /** Boleh mengelola katalog menu & kategori: **admin saja**. */
  canManageCatalog: boolean;
  login: (username: string, password: string) => Promise<void>;
  /**
   * Ambil ulang profil dari server (`/auth/me`) dan perbarui `user` beserta
   * `students` di konteks. Dipakai setelah user mengubah datanya sendiri —
   * mis. menambah anak dari menu Profil — agar header, pemilih kelas, dan
   * halaman lain ikut menyesuaikan tanpa perlu login ulang.
   */
  refresh: () => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth harus dipakai di dalam <AuthProvider>");
  }
  return context;
}
