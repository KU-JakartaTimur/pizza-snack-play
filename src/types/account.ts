/** DTO akun orang tua & statistik dashboard. */

export type ParentRelationship = "ibu" | "ayah" | "wali";

export interface ParentDto {
  id: number;
  userId: number;
  username: string;
  parentName: string;
  studentName: string;
  studentClass: string | null;
  relationship: ParentRelationship;
  phone: string | null;
  address: string | null;
  email: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface ParentInput {
  username: string;
  password?: string;
  parentName: string;
  studentName: string;
  studentClass?: string | null;
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
