import { Trash2 } from "lucide-react";
import { Button, Card, CardHeader } from "@/components/ui";
import { formatCompactDate } from "@/lib/date";
import type { HolidayDto } from "@/types/schedule";

interface HolidayCardProps {
  holidays: HolidayDto[];
  onDelete: (id: number) => void;
}

/**
 * Daftar hari libur global. Hanya dirender untuk admin — entri di tabel
 * `holidays` berlaku untuk semua kelas dan semua halaman jadwal.
 */
export function HolidayCard({ holidays, onDelete }: HolidayCardProps) {
  return (
    <Card className="mt-6">
      <CardHeader
        title="Hari Libur"
        description="Tanggal yang ditandai libur berlaku untuk semua kelas dan muncul di semua halaman jadwal."
      />
      {holidays.length > 0 ? (
        <ul className="divide-y divide-slate-100">
          {holidays.map((holiday) => (
            <li
              key={holiday.id}
              className="flex items-center justify-between gap-4 px-5 py-3"
            >
              <div>
                <p className="text-sm font-medium text-slate-800">{holiday.name}</p>
                <p className="text-xs text-slate-400">
                  {formatCompactDate(holiday.date)}
                  {holiday.description ? ` · ${holiday.description}` : ""}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:bg-red-50"
                onClick={() => onDelete(holiday.id)}
                title="Hapus"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-5 py-4 text-sm text-slate-500">Belum ada hari libur khusus.</p>
      )}
    </Card>
  );
}
