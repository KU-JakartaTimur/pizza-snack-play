import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AuthUser, StudentProfile } from "@/types/auth";
import { api } from "./api";
import { AuthContext, TOKEN_KEY, type AuthContextValue } from "./auth-context";

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  student: StudentProfile | null;
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
  return { token, user: null, student: null, isReady: token === null };
}

/**
 * Menyimpan sesi login di `localStorage` dan memverifikasinya ke server
 * saat aplikasi dimuat ulang (token bisa saja sudah kedaluwarsa).
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
        setState({
          token,
          user: profile.user,
          student: profile.student,
          isReady: true,
        });
      })
      .catch(() => {
        // Token tidak valid / kedaluwarsa — bersihkan sesi.
        if (cancelled) return;
        localStorage.removeItem(TOKEN_KEY);
        setState({ token: null, user: null, student: null, isReady: true });
      });

    return () => {
      cancelled = true;
    };
  }, [state]);

  const login = useCallback(async (username: string, password: string) => {
    const { data } = await api.auth.login({ username, password });
    localStorage.setItem(TOKEN_KEY, data.token);
    // Sesi sudah lengkap — tidak perlu verifikasi ulang.
    setState({
      token: data.token,
      user: data.user,
      student: data.student,
      isReady: true,
    });
  }, []);

  const logout = useCallback(() => {
    // JWT stateless — cukup buang token; panggilan server hanya untuk audit.
    void api.auth.logout().catch(() => undefined);
    localStorage.removeItem(TOKEN_KEY);
    setState({ token: null, user: null, student: null, isReady: true });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: state.user,
      student: state.student,
      token: state.token,
      isReady: state.isReady,
      isAdmin: state.user?.role === "admin",
      login,
      logout,
    }),
    [state, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
