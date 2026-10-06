import type { Db } from "../../database/db";
import type { JwtPayload } from "../../types/auth";
import type {
  LaporanJadwalDto,
  LaporanOrangTuaDto,
  LaporanRingkasanDto,
  LaporanTanggalDto,
} from "../../types/laporan";
import { classService } from "../classes/service";
import { indonesianDayName } from "../utils/date";
import { laporanRepository, type LaporanClaimRow } from "./repository";

/**
 * Laporan jadwal — rekap siapa mengambil tanggal piket berapa kali.
 *
 * Modul ini murni pembacaan; seluruh penegakan wewenang ada di controller
 * (role) dan di `resolveClassScope` di bawah (cakupan kelas). Di sini hanya
 * perakitan angka supaya laporan yang tampil di layar tidak dihitung ulang
 * oleh klien dan tidak pernah berbeda dengan sumbernya.
 */

/** Kelas yang dilaporkan, hasil penentuan cakupan sesuai role. */
export type LaporanScope = { classNames: string[]; className: string | null };

class LaporanService {
  /**
   * Susun laporan lengkap untuk rentang tanggal & cakupan kelas.
   *
   * `classNames` kosong = semua kelas dalam cakupan user. Perhatikan bahwa
   * korlas **bukan** "semua kelas": controller mempersempitnya lebih dulu
   * (lihat `resolveClassScope`).
   */
  async build(
    db: Db,
    from: string,
    to: string,
    scope: LaporanScope,
  ): Promise<LaporanJadwalDto> {
    const [claimRows, parentRows] = await Promise.all([
      laporanRepository.claimsBetween(db, from, to, scope.classNames),
      laporanRepository.parentsWithStudents(db, scope.classNames),
    ]);

    return {
      from,
      to,
      className: scope.className,
      ringkasan: buildRingkasan(claimRows, parentRows),
      orangTua: groupByParent(claimRows),
    };
  }

  /**
   * Tentukan kelas yang boleh masuk laporan untuk user ini.
   *
   * - Admin tanpa `?class=` → seluruh kelas (`classNames` kosong = tanpa saringan).
   * - Admin dengan `?class=` → kelas itu saja, dan wajib termasuk kelas yang dikenal.
   * - Korlas → **kelasnya sendiri saja**, walau ia boleh membaca kelas lain di
   *   halaman jadwal. Laporan memuat nama orang tua beserta kebiasaannya
   *   mengambil piket, jadi tidak pantas dibuka lintas kelas.
   *
   * Mengembalikan `null` bila user meminta kelas di luar cakupannya.
   */
  async resolveScope(
    db: Db,
    user: JwtPayload,
    requested?: string | null,
  ): Promise<LaporanScope | null> {
    const wanted = requested?.trim() || null;

    if (user.role === "admin") {
      const known = await classService.allowedClasses(db, user);
      if (!wanted) return { classNames: [], className: null };
      if (!known.includes(wanted)) return null;
      return { classNames: [wanted], className: wanted };
    }

    // Korlas: selalu kelasnya sendiri, tanpa memandang `?class=`.
    const own = user.className?.trim() || null;
    if (!own) return { classNames: [], className: null };
    if (wanted && wanted !== own) return null;
    return { classNames: [own], className: own };
  }
}

/** Kelompokkan baris klaim menjadi satu entri per orang tua, urut terbanyak. */
function groupByParent(rows: LaporanClaimRow[]): LaporanOrangTuaDto[] {
  const byParent = new Map<number, LaporanOrangTuaDto>();

  for (const row of rows) {
    const tanggal: LaporanTanggalDto = {
      scheduleId: row.scheduleId,
      scheduleDate: row.scheduleDate,
      dayName: indonesianDayName(row.scheduleDate),
      className: row.className,
      menuName: row.menuName,
      studentName: row.studentName,
      note: row.note,
      claimedAt: row.claimedAt,
    };

    const existing = byParent.get(row.parentId);
    if (existing) {
      existing.jumlahAmbil += 1;
      existing.tanggal.push(tanggal);
      if (!existing.classNames.includes(row.className)) {
        existing.classNames.push(row.className);
      }
      continue;
    }

    byParent.set(row.parentId, {
      parentId: row.parentId,
      parentName: row.parentName,
      classNames: [row.className],
      jumlahAmbil: 1,
      tanggal: [tanggal],
    });
  }

  return [...byParent.values()]
    .map((entry) => ({
      ...entry,
      classNames: [...entry.classNames].sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true }),
      ),
    }))
    .sort(
      (a, b) =>
        b.jumlahAmbil - a.jumlahAmbil || a.parentName.localeCompare(b.parentName),
    );
}

/** Angka ringkasan + daftar orang tua yang belum pernah mengambil. */
function buildRingkasan(
  claimRows: LaporanClaimRow[],
  parentRows: Array<{
    parentId: number;
    parentName: string;
    studentNames: string[];
  }>,
): LaporanRingkasanDto {
  const activeParentIds = new Set(claimRows.map((row) => row.parentId));
  const scheduledIds = new Set(claimRows.map((row) => row.scheduleId));

  const belumAmbil = parentRows
    .filter((parent) => !activeParentIds.has(parent.parentId))
    .map((parent) => ({
      parentId: parent.parentId,
      parentName: parent.parentName,
      studentNames: parent.studentNames,
    }));

  const totalAmbil = claimRows.length;
  const orangTuaAktif = activeParentIds.size;

  return {
    totalAmbil,
    orangTuaAktif,
    tanggalTerisi: scheduledIds.size,
    orangTuaKosong: belumAmbil.length,
    rataRataAmbil:
      orangTuaAktif === 0 ? 0 : Math.round((totalAmbil / orangTuaAktif) * 10) / 10,
    belumAmbil,
  };
}

export const laporanService = new LaporanService();
