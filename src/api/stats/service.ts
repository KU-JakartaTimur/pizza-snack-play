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
    const todaySchedule = await scheduleRepository.findScheduleByDate(db, today);

    const todayMenu =
      todaySchedule?.menuId != null
        ? await catalogRepository.findMenuById(db, todaySchedule.menuId)
        : undefined;

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
        menuName: todayMenu?.name ?? null,
        isHoliday: todaySchedule?.isHoliday === 1,
      },
    };
  }
}

export const statsService = new StatsService();
