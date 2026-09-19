import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AuthUser } from "@/types/auth";
import { api } from "./api";
import { AuthContext, TOKEN_KEY, type AuthContextValue } from "./auth-context";

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  /** `false` selama token tersimpan masih diverifikasi ke server. */
  isReady: boolean;
}

function readStoredToken(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * State awal diturunkan langsung dari `localStorage`, bukan disinkronkan
 * lewat effect — bila tidak ada token, sesi dianggap sudah siap.
 */
function initialState(): AuthState {
  const token = readStoredToken();
  return { token, user: null, isReady: token === null };
}

/**
 * Menyimpan sesi login di `localStorage` dan memverifikasinya ke server
 * saat aplikasi dimuat ulang (token bisa saja sudah kedaluwarsa).
 *
 * Profil anak (`students`) menempel pada `user`, bukan state terpisah —
 * satu orang tua dapat memiliki lebih dari satu anak.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);

  useEffect(() => {
    const { token, isReady } = state;
    if (!token || isReady) return;

    let cancelled = false;

    api.auth
      .me()
      .then((profile) => {
        if (cancelled) return;
        setState({ token, user: profile.user, isReady: true });
      })
      .catch(() => {
        // Token tidak valid / kedaluwarsa — bersihkan sesi.
        if (cancelled) return;
        localStorage.removeItem(TOKEN_KEY);
        setState({ token: null, user: null, isReady: true });
      });

    return () => {
      cancelled = true;
    };
  }, [state]);

  const login = useCallback(async (username: string, password: string) => {
    const { data } = await api.auth.login({ username, password });
    localStorage.setItem(TOKEN_KEY, data.token);
    // Sesi sudah lengkap — tidak perlu verifikasi ulang.
    setState({ token: data.token, user: data.user, isReady: true });
  }, []);

  const logout = useCallback(() => {
    // JWT stateless — cukup buang token; panggilan server hanya untuk audit.
    void api.auth.logout().catch(() => undefined);
    localStorage.removeItem(TOKEN_KEY);
    setState({ token: null, user: null, isReady: true });
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const role = state.user?.role;
    const isAdmin = role === "admin";
    const isKorlas = role === "korlas";

    return {
      user: state.user,
      students: state.user?.students ?? [],
      relationship: state.user?.relationship ?? null,
      token: state.token,
      isReady: state.isReady,
      isAdmin,
      isKorlas,
      korlasClass: isKorlas ? (state.user?.className ?? null) : null,
      // Korlas boleh menyusun jadwal kelasnya (menu, petugas, catatan, salin)
      // dan mempublikasikannya — pembatasan kelasnya ditegakkan API, bukan
      // di sini. Kunci jadwal sendiri khusus admin.
      canManageSchedule: isAdmin || isKorlas,
      // Katalog menu bersifat sekolah-wide — perubahannya terpusat di admin.
      canManageCatalog: isAdmin,
      login,
      logout,
    };
  }, [state, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
