import type { AuthUser } from "@/types/auth";

/**
 * Bentuk form & penamaan label untuk kartu "Informasi Akun".
 *
 * Dipisah dari komponennya supaya bentuk form dan turunan tampilannya bisa
 * dibaca — dan diuji — tanpa JSX. Polanya sama dengan
 * `components/parents/form.ts` untuk form akun di sisi admin.
 */

/** Isi form ubah akun. Seluruhnya teks, agar bisa diikat langsung ke `<Input>`. */
export interface AccountForm {
  fullName: string;
  /** `ibu` | `ayah` | `wali`. */
  relationship: string;
  /** Nomor WhatsApp; teks kosong berarti nomornya dikosongkan. */
  phone: string;
}

export const EMPTY_ACCOUNT_FORM: AccountForm = {
  fullName: "",
  relationship: "ibu",
  phone: "",
};

/** Susun isi form dari profil yang sedang login. */
export function accountFormFrom(user: AuthUser): AccountForm {
  return {
    fullName: user.fullName ?? "",
    relationship: user.relationship ?? EMPTY_ACCOUNT_FORM.relationship,
    phone: user.phone ?? "",
  };
}

/**
 * Label peran yang dibaca pengguna.
 *
 * Selain admin, semuanya disebut "Orang tua" — termasuk korlas. Korlas memang
 * orang tua murid yang diberi tugas tambahan, dan kewenangannya sudah terlihat
 * dari menu yang tersedia, bukan dari kartu identitas ini.
 *
 * Peta ini sengaja bertipe `Record<string, string>` dan punya nilai cadangan:
 * `role` datang dari server sebagai teks, sehingga role yang belum dikenal
 * harus tetap tampil sebagai sesuatu yang masuk akal, bukan kosong.
 */
const ROLE_LABELS: Record<string, string> = { admin: "Admin" };

export function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? "Orang tua";
}

/** Label hubungan yang dibaca pengguna, mis. `ibu` → "Ibu". */
const RELATIONSHIP_LABELS: Record<string, string> = {
  ibu: "Ibu",
  ayah: "Ayah",
  wali: "Wali",
};

export function relationshipLabel(relationship: string): string {
  return RELATIONSHIP_LABELS[relationship] ?? relationship;
}
