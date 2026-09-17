import { HTTPError } from "ky";
import type { ApiResponse } from "@/types/apiResponse";
import type {
  LoginResponse,
  ProfileResponse,
  AuthUser,
} from "@/types/auth";
import type {
  CategoryDto,
  CategoryInput,
  MenuDto,
  MenuInput,
  MenuItemType,
} from "@/types/catalog";
import type {
  CopyWeekInput,
  CopyWeekResultDto,
  MenuHistoryDto,
  MonthScheduleDto,
  ScheduleDayDto,
  ScheduleInput,
  TodayScheduleDto,
  WeekDto,
  WeekScheduleDto,
} from "@/types/schedule";
import type {
  PaginatedDto,
  ParentDto,
  ParentInput,
  StatsSummaryDto,
} from "@/types/account";
import { http } from "./http";

/** Error API yang membawa status HTTP + pesan dari server. */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** Ambil body JSON dari error response ky, fallback ke pesan generik. */
async function messageFrom(error: HTTPError): Promise<string> {
  try {
    const body = (await error.response.json()) as Partial<ApiResponse<unknown>>;
    if (typeof body?.message === "string" && body.message) return body.message;
  } catch {
    /* body bukan JSON */
  }
  return `Terjadi kesalahan (${error.response.status})`;
}

/** Buka envelope `{ message, data }` dan kembalikan `data` saja. */
async function unwrap<T>(promise: Promise<Response>): Promise<T> {
  try {
    const response = await promise;
    const body = (await response.json()) as ApiResponse<T>;
    return body.data as T;
  } catch (error) {
    if (error instanceof HTTPError) {
      throw new ApiError(await messageFrom(error), error.response.status);
    }
    throw error;
  }
}

/** Sama seperti `unwrap`, tetapi juga mengembalikan pesan sukses. */
async function unwrapFull<T>(
  promise: Promise<Response>,
): Promise<{ message: string; data: T }> {
  try {
    const response = await promise;
    const body = (await response.json()) as ApiResponse<T>;
    return { message: body.message, data: body.data as T };
  } catch (error) {
    if (error instanceof HTTPError) {
      throw new ApiError(await messageFrom(error), error.response.status);
    }
    throw error;
  }
}

function query(params: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export const api = {
  auth: {
    login: (body: { username: string; password: string }) =>
      unwrapFull<LoginResponse>(http.post("auth/login", { json: body })),

    logout: () => unwrap<null>(http.post("auth/logout")),

    me: () => unwrap<ProfileResponse>(http.get("auth/me")),

    changePassword: (body: { currentPassword: string; newPassword: string }) =>
      unwrapFull<null>(http.put("auth/password", { json: body })),
  },

  schedules: {
    today: () => unwrap<TodayScheduleDto>(http.get("schedules/today")),

    week: (date?: string) =>
      unwrap<WeekScheduleDto>(http.get(`schedules/week${query({ date })}`)),

    month: (year: number, month: number) =>
      unwrap<MonthScheduleDto>(
        http.get(`schedules/month${query({ year, month })}`),
      ),

    range: (from: string, to: string) =>
      unwrap<ScheduleDayDto[]>(
        http.get(`schedules/range${query({ from, to })}`),
      ),

    /** Cari kapan sebuah menu/komponen pernah dijadwalkan. */
    search: (q: string, from: string, to: string) =>
      unwrap<MenuHistoryDto>(
        http.get(`schedules/search${query({ q, from, to })}`),
      ),

    detail: (id: number) =>
      unwrap<ScheduleDayDto>(http.get(`schedules/${id}`)),

    create: (body: ScheduleInput) =>
      unwrapFull<ScheduleDayDto>(http.post("schedules", { json: body })),

    update: (id: number, body: Partial<ScheduleInput>) =>
      unwrapFull<ScheduleDayDto>(http.put(`schedules/${id}`, { json: body })),

    remove: (id: number) =>
      unwrapFull<null>(http.delete(`schedules/${id}`)),

    /** Salin jadwal Senin–Jumat dari satu minggu ke minggu lain. */
    copy: (body: CopyWeekInput) =>
      unwrapFull<CopyWeekResultDto>(
        http.post("schedules/copy", { json: body }),
      ),

    weeks: (year: number, month: number) =>
      unwrap<WeekDto[]>(http.get(`weeks${query({ year, month })}`)),
  },

  holidays: {
    list: (from?: string, to?: string) =>
      unwrap<{ id: number; date: string; name: string; description: string | null }[]>(
        http.get(`holidays${query({ from, to })}`),
      ),

    create: (body: { date: string; name: string; description?: string }) =>
      unwrapFull<unknown>(http.post("holidays", { json: body })),

    remove: (id: number) => unwrapFull<null>(http.delete(`holidays/${id}`)),
  },

  categories: {
    list: () => unwrap<CategoryDto[]>(http.get("categories")),

    create: (body: CategoryInput) =>
      unwrapFull<CategoryDto>(http.post("categories", { json: body })),

    update: (id: number, body: Partial<CategoryInput>) =>
      unwrapFull<CategoryDto>(http.put(`categories/${id}`, { json: body })),

    remove: (id: number) =>
      unwrapFull<null>(http.delete(`categories/${id}`)),
  },

  menus: {
    list: (options: { search?: string; active?: boolean; archived?: boolean } = {}) =>
      unwrap<MenuDto[]>(http.get(`menus${query(options)}`)),

    detail: (id: number) => unwrap<MenuDto>(http.get(`menus/${id}`)),

    itemTypes: () => unwrap<MenuItemType[]>(http.get("menus/item-types")),

    create: (body: MenuInput) =>
      unwrapFull<MenuDto>(http.post("menus", { json: body })),

    update: (id: number, body: Partial<MenuInput>) =>
      unwrapFull<MenuDto>(http.put(`menus/${id}`, { json: body })),

    remove: (id: number, force = false) =>
      unwrapFull<{ action: string }>(
        http.delete(`menus/${id}${query({ force: force ? "true" : undefined })}`),
      ),
  },

  parents: {
    list: (options: { search?: string; active?: boolean; page?: number; perPage?: number } = {}) =>
      unwrap<PaginatedDto<ParentDto>>(http.get(`parents${query(options)}`)),

    detail: (id: number) => unwrap<ParentDto>(http.get(`parents/${id}`)),

    create: (body: ParentInput) =>
      unwrapFull<ParentDto>(http.post("parents", { json: body })),

    update: (id: number, body: Partial<ParentInput>) =>
      unwrapFull<ParentDto>(http.put(`parents/${id}`, { json: body })),

    remove: (id: number, hard = false) =>
      unwrapFull<{ action: string }>(
        http.delete(`parents/${id}${query({ hard: hard ? "true" : undefined })}`),
      ),

    resetPassword: (id: number, newPassword: string) =>
      unwrapFull<null>(
        http.post(`parents/${id}/reset-password`, { json: { newPassword } }),
      ),
  },

  stats: {
    summary: () => unwrap<StatsSummaryDto>(http.get("stats/summary")),
  },
};

export type { AuthUser };
