import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { AuthUser } from "@/types/auth";
import { api } from "./api";
import {
  AuthContext,
  IMPERSONATOR_KEY,
  TOKEN_KEY,
  type AuthContextValue,
  type LoginResult,
} from "./auth-context";

/** Sesi admin yang dititipkan selama "Login as" — jalan pulangnya. */
interface Impersonator {
  token: string;
  user: AuthUser;
}

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
 * Baca jejak sesi admin dari `localStorage`. Isi yang rusak diperlakukan
 * sebagai tidak ada — lebih baik meminta admin masuk ulang daripada
 * memulihkan token yang tidak bisa dipercaya.
 */
function readImpersonator(): Impersonator | null {
  if (typeof localStorage === "undefined") return null;

  const raw = localStorage.getItem(IMPERSONATOR_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<Impersonator>;
    if (typeof parsed?.token === "string" && parsed.user) {
      return { token: parsed.token, user: parsed.user as AuthUser };
    }
  } catch {
    /* isi bukan JSON — dianggap tidak ada */
  }

  localStorage.removeItem(IMPERSONATOR_KEY);
  return null;
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
 *
 * Modul ini juga memegang **"Login as"**: admin dapat membuka sesi korlas/
 * orang tua tanpa password. Sesi adminnya tidak dibuang, melainkan disimpan
 * di kunci `psp_impersonator`, sehingga bisa dilanjutkan lagi kapan saja.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);
  const [impersonator, setImpersonator] = useState<Impersonator | null>(() =>
    readStoredToken() ? readImpersonator() : null,
  );

  const { token, isReady } = state;
  const queryClient = useQueryClient();

  /**
   * Cermin state terakhir yang sudah di-commit. `impersonate()` perlu tahu
   * siapa yang sedang masuk untuk menyimpan jalan pulangnya, sementara
   * `useCallback` sengaja tidak ikut berubah tiap kali state berganti.
   */
  const sessionRef = useRef(state);
  useEffect(() => {
    sessionRef.current = state;
  }, [state]);

  /**
   * Ganti sesi **dan** buang cache query. Data di cache terikat pada cakupan
   * kelas dan role pemiliknya — membiarkannya berarti orang tua sempat
   * melihat daftar kelas milik admin (atau sebaliknya).
   */
  const switchSession = useCallback(
    (next: AuthState) => {
      queryClient.clear();
      setState(next);
    },
    [queryClient],
  );

  // Token yang tersimpan belum dipercaya begitu saja: verifikasi ke server
  // sekali saat aplikasi dimuat, lalu bersihkan sesi bila ditolak.
  useEffect(() => {
    if (!token || isReady) return;

    let cancelled = false;

    api.auth
      .me()
      .then((profile) => {
        if (cancelled) return;
        setState({ token, user: profile.user, isReady: true });
      })
      .catch(() => {
        if (cancelled) return;

        // Token yang dititipkan bisa kedaluwarsa lebih dulu daripada sesi
        // adminnya. Bila jejak admin masih ada, kembalikan ke sesi itu alih-alih
        // melempar admin ke halaman masuk.
        const fallback = readImpersonator();
        if (fallback) {
          localStorage.setItem(TOKEN_KEY, fallback.token);
          localStorage.removeItem(IMPERSONATOR_KEY);
          setImpersonator(null);
          // `isReady: false` menahan halaman sampai profil admin terambil lagi.
          switchSession({ token: fallback.token, user: null, isReady: false });
          return;
        }

        localStorage.removeItem(TOKEN_KEY);
        switchSession({ token: null, user: null, isReady: true });
      });

    return () => {
      cancelled = true;
    };
  }, [token, isReady, switchSession]);

  const login = useCallback(
    async (username: string, password: string): Promise<LoginResult> => {
      const { message, data } = await api.auth.login({ username, password });

      // Login manual selalu memulai sesi yang bersih — jejak "Login as"
      // sebelumnya tidak boleh menggantung di perangkat.
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.removeItem(IMPERSONATOR_KEY);
      setImpersonator(null);
      // Sesi sudah lengkap — tidak perlu verifikasi ulang.
      switchSession({ token: data.token, user: data.user, isReady: true });

      return { message, user: data.user };
    },
    [switchSession],
  );

  const impersonate = useCallback(
    async (userId: number): Promise<LoginResult> => {
      const { message, data } = await api.auth.impersonate(userId);

      // Jejak admin disimpan sekali saja: rangkaian "Login as" beruntun tidak
      // boleh menimpa jalan pulang ke sesi admin yang sebenarnya.
      const { token: currentToken, user: currentUser } = sessionRef.current;
      const admin =
        readImpersonator() ??
        (currentToken && currentUser
          ? { token: currentToken, user: currentUser }
          : null);

      if (admin) {
        localStorage.setItem(IMPERSONATOR_KEY, JSON.stringify(admin));
        setImpersonator(admin);
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      switchSession({ token: data.token, user: data.user, isReady: true });

      return { message, user: data.user };
    },
    [switchSession],
  );

  const stopImpersonating = useCallback(() => {
    const admin = readImpersonator();
    if (!admin) return;

    localStorage.setItem(TOKEN_KEY, admin.token);
    localStorage.removeItem(IMPERSONATOR_KEY);
    setImpersonator(null);
    // Profil admin sengaja diambil ulang lewat `/auth/me` (efek verifikasi di
    // atas) supaya data anak & kelasnya ikut segar, bukan salinan lama.
    switchSession({ token: admin.token, user: null, isReady: false });
  }, [switchSession]);

  const logout = useCallback(() => {
    // JWT stateless — cukup buang token; panggilan server hanya untuk audit.
    void api.auth.logout().catch(() => undefined);
    localStorage.removeItem(TOKEN_KEY);
    // Keluar berarti mengakhiri keduanya: sesi admin yang dititipkan tidak
    // boleh tertinggal di perangkat yang mungkin dipakai orang lain.
    localStorage.removeItem(IMPERSONATOR_KEY);
    setImpersonator(null);
    switchSession({ token: null, user: null, isReady: true });
  }, [switchSession]);

  /**
   * Segarkan profil dari server. Dipanggil setelah user mengubah datanya
   * sendiri (mis. menambah anak di menu Profil) supaya `students` di konteks
   * tidak tertinggal. Tidak melakukan apa-apa bila tidak ada sesi.
   */
  const refresh = useCallback(async () => {
    const token = readStoredToken();
    if (!token) return;

    const profile = await api.auth.me();
    setState({ token, user: profile.user, isReady: true });
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
      // Yang dibagikan ke UI hanya identitasnya; tokennya tetap di dalam.
      impersonator: impersonator?.user ?? null,
      isImpersonating: impersonator !== null,
      impersonate,
      stopImpersonating,
      refresh,
      logout,
    };
  }, [
    state,
    impersonator,
    login,
    impersonate,
    stopImpersonating,
    refresh,
    logout,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
