import { useState } from "react";
import { CalendarOff, Trash2, Unlock } from "lucide-react";
import { Badge, Button, ConfirmDialog, Input, Select } from "@/components/ui";
import { formatCompactDate } from "@/lib/date";
import type { MenuDto } from "@/types/catalog";
import type { ScheduleDayDto } from "@/types/schedule";
import { NO_MENU, STATUS_META, isDayLocked } from "./shared";

/** Perubahan yang bisa dikirim ke `POST/PUT /schedules`. */
export interface DayPatch {
  menuId?: number | null;
  isHoliday?: boolean;
  petugasName?: string | null;
  petugasParentName?: string | null;
  notes?: string | null;
}

interface DayRowProps {
  day: ScheduleDayDto;
  menus: MenuDto[];
  /** Ada mutasi berjalan — tombol dinonaktifkan. */
  busy: boolean;
  /** `true` bila pengguna berhak membuka kunci (admin). */
  canUnlock: boolean;
  className: string | null;
  onSave: (day: ScheduleDayDto, patch: DayPatch) => void;
  onUnlock: (scheduleId: number) => void;
  onDelete: (scheduleId: number) => void;
}

/**
 * Satu baris hari pada tabel jadwal bulanan.
 *
 * Menyimpan nilai input teks saat `onBlur` alih-alih tiap ketikan — jadwal
 * hanya ditulis bila nilainya benar-benar berubah.
 */
export function DayRow({
  day,
  menus,
  busy,
  canUnlock,
  className,
  onSave,
  onUnlock,
  onDelete,
}: DayRowProps) {
  const dayLocked = isDayLocked(day.status);

  /**
   * Tindakan yang menunggu ditegaskan. Keduanya mengubah jadwal secara
   * merusak — satu membuka kunci, satu membuang barisnya — jadi keduanya
   * lewat dialog konfirmasi, bukan `confirm()` bawaan peramban.
   */
  const [pending, setPending] = useState<"unlock" | "delete" | null>(null);

  /** Kirim perubahan hanya bila nilai teksnya berubah. */
  const saveText = (
    key: "petugasName" | "petugasParentName" | "notes",
    raw: string,
  ) => {
    const value = raw.trim();
    if (value === (day[key] ?? "")) return;
    onSave(day, { [key]: value || null });
  };

  return (
    <li className="flex flex-wrap items-center gap-3 px-5 py-3">
      <div className="w-32 shrink-0">
        <p
          className={`text-sm font-medium ${
            day.isToday ? "text-highlight-700" : "text-slate-800"
          }`}
        >
          {day.dayName}
        </p>
        <p className="text-xs text-slate-400">{formatCompactDate(day.date)}</p>
      </div>

      {day.status && (
        <Badge tone={STATUS_META[day.status].tone}>
          {STATUS_META[day.status].label}
        </Badge>
      )}

      {day.isHoliday ? (
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Badge tone="warning">
            <CalendarOff className="h-3 w-3" />
            {day.holidayName ?? "Libur"}
          </Badge>
        </div>
      ) : (
        <Select
          className="min-w-0 flex-1"
          value={day.menu?.id ?? NO_MENU}
          disabled={busy || dayLocked}
          onChange={(event) => {
            const value = event.target.value;
            onSave(day, { menuId: value === NO_MENU ? null : Number(value) });
          }}
        >
          <option value={NO_MENU}>— belum ada menu —</option>
          {menus.map((menu) => (
            <option key={menu.id} value={menu.id}>
              {menu.name}
            </option>
          ))}
        </Select>
      )}

      {!day.isHoliday && (
        <>
          <Input
            className="w-36 shrink-0"
            placeholder="Petugas…"
            defaultValue={day.petugasName ?? ""}
            disabled={busy}
            onBlur={(event) => saveText("petugasName", event.target.value)}
          />
          <Input
            className="w-36 shrink-0"
            placeholder="Orang tua…"
            defaultValue={day.petugasParentName ?? ""}
            disabled={busy}
            onBlur={(event) => saveText("petugasParentName", event.target.value)}
          />
        </>
      )}

      <Input
        className="w-48 shrink-0"
        placeholder="Catatan…"
        defaultValue={day.notes ?? ""}
        disabled={busy || dayLocked}
        onBlur={(event) => saveText("notes", event.target.value)}
      />

      <div className="flex shrink-0 gap-1">
        {dayLocked && canUnlock && day.scheduleId && (
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => setPending("unlock")}
            title="Buka kunci jadwal"
          >
            <Unlock className="h-4 w-4" />
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          disabled={busy || dayLocked}
          onClick={() => onSave(day, { isHoliday: !day.isHoliday })}
          title={
            day.isHoliday
              ? `Batalkan libur kelas ${className ?? ""}`.trim()
              : `Tandai libur kelas ${className ?? ""}`.trim()
          }
        >
          <CalendarOff
            className={`h-4 w-4 ${
              day.isHoliday ? "text-highlight-700" : "text-slate-400"
            }`}
          />
        </Button>

        {day.scheduleId && (
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:bg-red-50"
            disabled={busy || dayLocked}
            onClick={() => setPending("delete")}
            title="Hapus jadwal"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={pending !== null}
        title={pending === "unlock" ? "Buka kunci jadwal?" : "Hapus jadwal?"}
        description={
          pending === "unlock" ? (
            <>
              Jadwal <strong>{formatCompactDate(day.date)}</strong> akan kembali
              ke status draf sehingga bisa disunting lagi.
            </>
          ) : (
            <>
              Jadwal <strong>{formatCompactDate(day.date)}</strong>
              {className ? ` kelas ${className}` : ""} akan dihapus, termasuk
              menu, petugas, dan catatannya.
            </>
          )
        }
        confirmLabel={pending === "unlock" ? "Buka kunci" : "Hapus"}
        tone={pending === "unlock" ? "primary" : "danger"}
        loading={busy}
        onConfirm={() => {
          const scheduleId = day.scheduleId;
          if (!scheduleId) return;
          setPending(null);
          if (pending === "unlock") onUnlock(scheduleId);
          else onDelete(scheduleId);
        }}
        onClose={() => setPending(null)}
      />
    </li>
  );
}
