/** DTO akun orang tua & statistik dashboard. */

import type { Role } from "./auth";

export type ParentRelationship = "ibu" | "ayah" | "wali";

/**
 * Role yang boleh dikelola lewat modul akun orang tua.
 * `admin` sengaja tidak termasuk — akun admin tidak dibuat dari sini.
 */
export type ManagedRole = Extract<Role, "parent" | "korlas">;

/** Seorang anak dari orang tua. */
export interface StudentDto {
  id: number;
  name: string;
  className: string | null;
}

export interface ParentDto {
  id: number;
  userId: number;
  username: string;
  parentName: string;
  /** Bisa berisi lebih dari satu anak. */
  students: StudentDto[];
  relationship: ParentRelationship;
  /** `parent` untuk orang tua biasa, `korlas` untuk koordinator kelas. */
  role: ManagedRole;
  /** Kelas yang dikoordinasi — hanya terisi untuk korlas. */
  className: string | null;
  phone: string | null;
  address: string | null;
  email: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  /**
   * Waktu akun terkunci karena terlalu banyak percobaan masuk yang gagal
   * (`YYYY-MM-DD HH:MM:SS` UTC). `null` berarti tidak terkunci.
   *
   * Akun terkunci tidak bisa masuk sama sekali sampai admin membukanya —
   * jadi kolom ini yang membuat tombol "Buka kunci" tahu kapan harus muncul.
   */
  lockedAt: string | null;
  createdAt: string;
}

/**
 * Satu anak pada input pembuatan/perubahan akun.
 * `id` diisi bila mengubah anak yang sudah ada; kosongkan untuk menambah anak baru.
 */
export interface StudentInput {
  id?: number;
  name: string;
  className?: string | null;
}

export interface ParentInput {
  username: string;
  password?: string;
  parentName: string;
  /** Minimal satu anak. Daftar ini menggantikan daftar anak sebelumnya. */
  students: StudentInput[];
  relationship?: ParentRelationship;
  /**
   * `parent` (default) atau `korlas`. Korlas wajib menyertakan `className`
   * dan hanya boleh mengubah jadwal kelas tersebut.
   */
  role?: ManagedRole;
  /** Kelas yang dikoordinasi. Diabaikan bila role bukan `korlas`. */
  className?: string | null;
  phone?: string | null;
  address?: string | null;
  email?: string | null;
  isActive?: boolean;
}

// ─────────────────────────────────────────────────────────────
// Aksi massal atas akun terpilih (checkbox di tabel orang tua)
// ─────────────────────────────────────────────────────────────

/**
 * Aksi yang bisa dijalankan atas sekumpulan akun orang tua terpilih.
 *
 * Berbeda dari perubahan per-baris, aksi ini bekerja pada **daftar id**
 * hasil centang di tabel — admin tidak perlu mengubah satu akun satu klik.
 * Seluruh aksi bersifat idempoten dan (kecuali `delete`) dapat dibatalkan.
 */
export type ParentBulkAction = "activate" | "deactivate" | "delete";

/** Body untuk `POST /parents/bulk`. */
export interface ParentBulkInput {
  /** `parents.id` yang dicentang. Id duplikat/tidak valid diabaikan. */
  ids: number[];
  /** Aksi yang diterapkan ke seluruh id terpilih. */
  action: ParentBulkAction;
}

/** Hasil aksi massal — cukup untuk menyusun pesan banner. */
export interface ParentBulkResultDto {
  action: ParentBulkAction;
  /** Akun yang benar-benar berubah (diaktifkan/dinonaktifkan/dihapus). */
  changed: number;
  /** Akun yang dilewati karena keadaannya sudah cocok (mis. aktifkan akun yang sudah aktif). */
  skipped: number;
  /** Id yang diabaikan: tidak ditemukan. */
  ignored: number;
}

export interface PaginatedDto<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface StatsSummaryDto {
  parents: { total: number; active: number };
  menus: { total: number; active: number };
  schedules: { total: number; holidays: number };
  categories: number;
  currentWeek: {
    label: string;
    startDate: string;
    endDate: string;
  } | null;
  today: {
    date: string;
    /** Menu yang dijadwalkan hari ini, unik lintas kelas. */
    menuNames: string[];
    /** Jumlah kelas yang sudah punya entri jadwal hari ini. */
    classCount: number;
    isHoliday: boolean;
  };
}
