import type { Db } from "../../database/db";
import type { StatsSummaryDto } from "../../types/account";
import { catalogRepository } from "../catalog/repository";
import { parentRepository } from "../parents/repository";
import { scheduleRepository } from "../schedules/repository";
import { endOfWeek, formatWeekLabel, startOfWeek, todayInWib } from "../utils/date";

class StatsService {
  /** Ringkasan untuk dashboard admin. */
  async summary(db: Db): Promise<StatsSummaryDto> {
    const today = todayInWib();
    const weekStart = startOfWeek(today);
    const weekEnd = endOfWeek(today);

    const [parentCounts, menuCounts, scheduleTotal, holidayTotal, categoryTotal] =
      await Promise.all([
        parentRepository.countAll(db),
        catalogRepository.countMenus(db),
        scheduleRepository.countSchedules(db),
        scheduleRepository.countHolidays(db),
        catalogRepository.countCategories(db),
      ]);

    const [weekRow] = await scheduleRepository.findWeeksOverlapping(
      db,
      today,
      today,
    );

    // Jadwal kini per kelas, jadi "menu hari ini" dirangkum lintas kelas.
    const [todaySchedules, globalHoliday] = await Promise.all([
      scheduleRepository.findSchedulesByDate(db, today),
      scheduleRepository.findHolidayByDate(db, today),
    ]);

    const menuIds = [
      ...new Set(
        todaySchedules
          .map((row) => row.menuId)
          .filter((id): id is number => id !== null),
      ),
    ];

    const menusById = await catalogRepository.loadMenusByIds(db, menuIds);

    const menuNames = menuIds
      .map((id) => menusById.get(id)?.name)
      .filter((name): name is string => Boolean(name));

    return {
      parents: parentCounts,
      menus: menuCounts,
      schedules: { total: scheduleTotal, holidays: holidayTotal },
      categories: categoryTotal,
      currentWeek: weekRow
        ? {
            label: weekRow.label ?? formatWeekLabel(weekStart, weekEnd),
            startDate: weekStart,
            endDate: weekEnd,
          }
        : {
            label: formatWeekLabel(weekStart, weekEnd),
            startDate: weekStart,
            endDate: weekEnd,
          },
      today: {
        date: today,
        menuNames,
        classCount: todaySchedules.length,
        // Libur bila tanggalnya libur nasional, atau seluruh kelas diliburkan.
        isHoliday:
          Boolean(globalHoliday) ||
          (todaySchedules.length > 0 &&
            todaySchedules.every((row) => row.isHoliday === 1)),
      },
    };
  }
}

export const statsService = new StatsService();
