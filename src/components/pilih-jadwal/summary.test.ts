import { describe, expect, test } from "bun:test";
import type { ScheduleClaimSummaryDto } from "@/types/claim";
import type { ScheduleDayDto } from "@/types/schedule";
import { isClaimableDay, summarizeMonth } from "./summary";

/** Hari jadwal dengan nilai wajar, siap ditimpa seperlunya per kasus uji. */
function day(overrides: Partial<ScheduleDayDto> = {}): ScheduleDayDto {
  return {
    date: "2026-10-01",
    dayOfWeek: 4,
    dayName: "Kamis",
    className: "1A",
    isToday: false,
    isHoliday: false,
    holidayName: null,
    notes: null,
    scheduleId: 1,
    menu: null,
    petugasName: null,
    petugasStudentId: null,
    petugasParentId: null,
    petugasParentName: null,
    status: "published",
    claim: null,
    ...overrides,
  };
}

function claim(parentId = 7): ScheduleClaimSummaryDto {
  return {
    id: parentId,
    parentId,
    parentName: `Orang tua ${parentId}`,
    studentName: null,
    note: null,
    claimedAt: "2026-10-01 03:00:00",
  };
}

describe("isClaimableDay", () => {
  test("hanya jadwal terbit yang bisa diambil", () => {
    expect(isClaimableDay(day({ status: "published" }))).toBe(true);
    expect(isClaimableDay(day({ status: "draft" }))).toBe(false);
    expect(isClaimableDay(day({ status: "locked" }))).toBe(false);
    expect(isClaimableDay(day({ status: null }))).toBe(false);
  });

  test("hari libur dan hari tanpa entri jadwal tidak dihitung", () => {
    expect(isClaimableDay(day({ isHoliday: true }))).toBe(false);
    expect(isClaimableDay(day({ scheduleId: null }))).toBe(false);
  });
});

describe("summarizeMonth", () => {
  test("memisahkan diambil, ditetapkan korlas, dan masih kosong", () => {
    const stats = summarizeMonth([
      day({ date: "2026-10-01", claim: claim() }),
      day({ date: "2026-10-02", claim: claim(8) }),
      day({ date: "2026-10-05", petugasName: "Budi", petugasParentName: "Pak Budi" }),
      day({ date: "2026-10-06" }),
    ]);

    expect(stats).toEqual({
      total: 4,
      taken: 2,
      assigned: 1,
      empty: 1,
      filledPercent: 75,
    });
  });

  test("mengabaikan draft, terkunci, libur, dan hari tanpa jadwal", () => {
    const stats = summarizeMonth([
      day({ date: "2026-10-01", claim: claim() }),
      day({ date: "2026-10-02", status: "draft" }),
      day({ date: "2026-10-03", status: "locked" }),
      day({ date: "2026-10-04", isHoliday: true }),
      day({ date: "2026-10-05", scheduleId: null, status: null }),
    ]);

    expect(stats).toEqual({
      total: 1,
      taken: 1,
      assigned: 0,
      empty: 0,
      filledPercent: 100,
    });
  });

  test("klaim diutamakan atas petugas, tidak dihitung dua kali", () => {
    const stats = summarizeMonth([
      day({ claim: claim(), petugasName: "Sari", petugasParentName: "Bu Sari" }),
    ]);

    expect(stats.taken).toBe(1);
    expect(stats.assigned).toBe(0);
    expect(stats.empty).toBe(0);
  });

  test("bulan tanpa jadwal terbit menghasilkan angka nol tanpa pembagian nol", () => {
    expect(summarizeMonth([])).toEqual({
      total: 0,
      taken: 0,
      assigned: 0,
      empty: 0,
      filledPercent: 0,
    });
  });
});
