/**
 * Perhitungan ringkasan pengambilan snack satu bulan.
 *
 * Sengaja dipisahkan dari komponennya: angkanya murni turunan dari data jadwal
 * yang sudah dimuat halaman, sehingga bisa diuji tanpa merender apa pun — dan
 * korlas/admin membaca angka yang sama persis dengan yang dilihat orang tua.
 */
import type { ScheduleDayDto } from "@/types/schedule";

/** Angka panel keterangan "sudah berapa snack yang diambil" satu bulan. */
export interface MonthSnapshotStats {
  /** Tanggal yang benar-benar bisa diambil (lihat `isClaimableDay`). */
  total: number;
  /** Tanggal yang sudah diambil orang tua — inilah "jumlah snack yang diambil". */
  taken: number;
  /** Tanggal yang ditetapkan korlas tanpa klaim (piket manual). */
  assigned: number;
  /** Tanggal yang masih kosong — belum ada klaim maupun petugas. */
  empty: number;
  /** Persentase tanggal yang sudah ada petugasnya, 0–100. */
  filledPercent: number;
}

/**
 * Tanggal yang boleh diperebutkan orang tua.
 *
 * Jadwal `draft`/`locked` belum terbit, jadi tanggalnya tidak dihitung —
 * menampilkannya sebagai "bisa diambil" hanya melahirkan tombol yang pasti
 * ditolak server (`409 not_published`). Orang tua tidak terpengaruh karena
 * jadwal yang ia terima memang sudah disaring `published` di server.
 */
export function isClaimableDay(day: ScheduleDayDto): boolean {
  return day.scheduleId !== null && !day.isHoliday && day.status === "published";
}

/** Sudah ada yang bertugas — entah dari klaim orang tua atau penunjukan korlas. */
function hasPetugas(day: ScheduleDayDto): boolean {
  return Boolean(day.petugasName) || Boolean(day.petugasParentName);
}

/**
 * Ringkas daftar hari jadwal menjadi angka-angka panel keterangan.
 *
 * Menerima daftar apa adanya (termasuk libur & draft) dan menyaringnya
 * sendiri, supaya aturan "tanggal mana yang bisa diambil" tidak perlu diulang
 * di setiap pemanggil.
 */
export function summarizeMonth(days: ScheduleDayDto[]): MonthSnapshotStats {
  let taken = 0;
  let assigned = 0;

  for (const day of days) {
    if (!isClaimableDay(day)) continue;

    if (day.claim) taken += 1;
    else if (hasPetugas(day)) assigned += 1;
  }

  const total = days.filter(isClaimableDay).length;
  const filled = taken + assigned;

  return {
    total,
    taken,
    assigned,
    empty: total - filled,
    filledPercent: total === 0 ? 0 : Math.round((filled / total) * 100),
  };
}
