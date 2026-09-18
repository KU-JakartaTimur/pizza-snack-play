import { CalendarOff, StickyNote, User, UtensilsCrossed } from "lucide-react";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/cn";
import { formatIndonesianDate, relativeDayLabel } from "@/lib/date";
import { ITEM_TYPE_LABELS, ITEM_TYPE_ORDER } from "@/lib/item-types";
import type { MenuItemType } from "@/types/catalog";
import type { ScheduleDayDto } from "@/types/schedule";

/** Kelompokkan komponen menu berdasarkan jenisnya, urutan tetap. */
function groupItems(items: { itemType: MenuItemType; name: string }[]) {
  return ITEM_TYPE_ORDER.map((type) => ({
    type,
    names: items.filter((item) => item.itemType === type).map((i) => i.name),
  })).filter((group) => group.names.length > 0);
}

export function ScheduleDayCard({
  day,
  compact = false,
}: {
  day: ScheduleDayDto;
  compact?: boolean;
}) {
  const isToday = day.isToday;

  return (
    <div
      className={cn(
        "card overflow-hidden transition-shadow",
        // "Hari ini" disorot persik agar langsung tertangkap mata.
        isToday && "ring-2 ring-highlight-400 ring-offset-1",
        !isToday && "hover:shadow-md",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between gap-3 border-b px-4 py-3",
          isToday
            ? "border-highlight-200 bg-highlight-50"
            : "border-slate-200 bg-slate-50",
        )}
      >
        <div className="min-w-0">
          <p
            className={cn(
              "font-semibold leading-tight",
              isToday ? "text-highlight-900" : "text-slate-900",
            )}
          >
            {day.dayName}
          </p>
          <p className="truncate text-xs text-slate-500">
            {formatIndonesianDate(day.date)}
          </p>
        </div>
        <Badge tone={isToday ? "highlight" : "neutral"}>
          {isToday ? "Hari ini" : relativeDayLabel(day.date)}
        </Badge>
      </div>

      <div className="px-4 py-3.5">
        {day.isHoliday ? (
          <div className="flex items-center gap-2.5 text-highlight-700">
            <CalendarOff className="h-4 w-4 shrink-0" />
            <div>
              <p className="text-sm font-medium">
                {day.holidayName ?? "Libur"}
              </p>
              <p className="text-xs text-highlight-700">Tidak ada jadwal snack</p>
            </div>
          </div>
        ) : day.menu ? (
          <div className="space-y-3">
            <div className="flex items-start gap-2.5">
              <UtensilsCrossed className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">
                  {day.menu.name}
                </p>
                {day.menu.description && !compact && (
                  <p className="mt-0.5 text-xs text-slate-500">
                    {day.menu.description}
                  </p>
                )}
              </div>
            </div>

            {day.menu.items.length > 0 && (
              <div className="space-y-1.5 pl-6">
                {groupItems(day.menu.items).map((group) => (
                  <div key={group.type} className="flex flex-wrap gap-1.5">
                    <span className="w-full text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      {ITEM_TYPE_LABELS[group.type]}
                    </span>
                    {group.names.map((name) => (
                      <span
                        key={name}
                        className="rounded-md border border-accent-200 bg-accent-50 px-2 py-0.5 text-xs text-accent-800"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            Belum ada menu untuk tanggal ini
          </p>
        )}

        {!day.isHoliday && (day.petugasName || day.petugasParentName) && (
          <div className="mt-3 flex items-start gap-2 text-sm text-slate-700">
            <User className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <div className="min-w-0">
              {day.petugasName && (
                <p className="font-medium text-slate-900">{day.petugasName}</p>
              )}
              {day.petugasParentName && (
                <p className="text-xs text-slate-500">{day.petugasParentName}</p>
              )}
            </div>
          </div>
        )}

        {day.notes && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-highlight-200 bg-highlight-50 px-2.5 py-2 text-xs text-highlight-800">
            <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{day.notes}</span>
          </div>
        )}
      </div>
    </div>
  );
}
