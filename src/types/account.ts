/** DTO akun orang tua & statistik dashboard. */

export type ParentRelationship = "ibu" | "ayah" | "wali";

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
  phone: string | null;
  address: string | null;
  email: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
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
    menuName: string | null;
    isHoliday: boolean;
  };
}
