import { createContext, useContext } from "react";
import type { AuthUser, StudentProfile } from "@/types/auth";

/** Kunci `localStorage` untuk JWT. Dipakai juga oleh `lib/http.ts`. */
export const TOKEN_KEY = "psp_token";

export interface AuthContextValue {
  user: AuthUser | null;
  student: StudentProfile | null;
  token: string | null;
  /** `false` selama sesi tersimpan masih diverifikasi ke server. */
  isReady: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<void>;
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
