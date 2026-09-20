import type { ScheduleStatus } from "@/types/schedule";

/** Nilai sentinel untuk opsi "belum ada menu" pada `<Select>`. */
export const NO_MENU = "";

/** Label dan warna badge untuk tiap status jadwal. */
export const STATUS_META: Record<
  ScheduleStatus,
  { label: string; tone: "neutral" | "warning" | "success" }
> = {
  draft: { label: "Draft", tone: "neutral" },
  locked: { label: "Terkunci", tone: "warning" },
  published: { label: "Dipublikasi", tone: "success" },
};

/** Baris `locked` dan `published` tidak dapat diubah siapa pun. */
export function isDayLocked(status: ScheduleStatus | null): boolean {
  return status === "locked" || status === "published";
}
