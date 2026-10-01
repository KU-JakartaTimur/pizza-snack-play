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

export interface PaginatedDto<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

// ── Impor akun dari berkas Excel ────────────────────────────────

/** Nasib satu baris pada impor akun. */
export type ParentImportOutcome = "create" | "update" | "skip";

export interface ParentImportRowDto {
  /** Nomor baris di lembar Excel (1-based) — memudahkan admin mencarinya. */
  row: number;
  parentName: string;
  username: string;
  /**
   * `create` = akun baru, `update` = akun lama ditimpa,
   * `skip` = dilewati (sebabnya di `reason`).
   */
  outcome: ParentImportOutcome;
  /** Alasan dilewati — `null` bila barisnya diproses. */
  reason: string | null;
  /** Nama anak yang ditulis, sesuai urutan di berkas. */
  students: string[];
}

export interface ParentImportIssueDto {
  /** Nomor baris di lembar Excel (1-based). */
  row: number;
  message: string;
}

export interface ParentImportResultDto {
  /** `true` bila ini hanya pratinjau — belum ada yang ditulis. */
  dryRun: boolean;
  /** Jumlah baris data yang terbaca dari berkas. */
  totalRows: number;
  created: number;
  updated: number;
  skipped: number;
  /** Nasib tiap baris yang bentuknya sudah sah — termasuk yang dilewati. */
  rows: ParentImportRowDto[];
  /**
   * Baris yang **tidak terbaca** dari lembar (username tidak sah, anak
   * kosong, dsb.). Baris yang terbaca tetapi tidak diproses — mis. username
   * kembar atau akun baru tanpa password — tidak di sini, melainkan pada
   * `rows` dengan `outcome: "skip"` beserta `reason`-nya.
   */
  issues: ParentImportIssueDto[];
}

export interface ParentImportInput {
  /** Nama berkas asli — hanya untuk jejak, tidak dipakai membuka apa pun. */
  filename: string;
  /** Isi berkas `.xlsx` dalam base64 (tanpa awalan `data:`). */
  content: string;
  /** `true` = hanya menghitung, tidak menulis apa pun. */
  dryRun?: boolean;
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
