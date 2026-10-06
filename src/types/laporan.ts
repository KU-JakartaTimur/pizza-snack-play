/**
 * DTO laporan jadwal — dipakai bersama oleh API dan frontend.
 *
 * Laporan ini menjawab pertanyaan yang paling sering muncul saat rapat
 * koordinasi: **berapa kali setiap orang tua sudah mengambil jadwal piket
 * snack**, supaya beban antar wali murid kelihatan dan yang belum kebagian
 * bisa diingatkan. Sumbernya adalah tabel `schedule_claims` — klaim yang sama
 * yang dipakai fitur "Pilih Jadwal", jadi angkanya tidak pernah berbeda dari
 * yang dilihat orang tua.
 *
 * Cakupan kelas mengikuti aturan baca jadwal yang sudah ada (`resolveReadClass`):
 * admin boleh semua kelas, korlas boleh membaca semua kelas — tetapi pada
 * laporan, korlas sengaja dipersempit ke kelasnya sendiri lewat `classNames`
 * agar daftar orang tua kelas lain tidak ikut terbaca.
 */

/** Satu tanggal yang diambil seorang orang tua. */
export interface LaporanTanggalDto {
  scheduleId: number;
  /** `YYYY-MM-DD`. */
  scheduleDate: string;
  /** Nama hari Indonesia, mis. `Selasa`. */
  dayName: string;
  className: string;
  menuName: string | null;
  /** Nama anak yang diwakili, bila orang tua memilih anak saat mengambil. */
  studentName: string | null;
  note: string | null;
  /** Waktu klaim tersimpan (`YYYY-MM-DD HH:MM:SS` UTC). */
  claimedAt: string;
}

/** Rekap ambil jadwal oleh satu orang tua. */
export interface LaporanOrangTuaDto {
  parentId: number;
  parentName: string;
  /** Kelas anak-anaknya — dasar pengelompokan di laporan. */
  classNames: string[];
  /** Banyak tanggal yang sudah diambil pada rentang & kelas yang diminta. */
  jumlahAmbil: number;
  /** Rincian tanggal, urut menaik — dipakai untuk membuka detail baris. */
  tanggal: LaporanTanggalDto[];
}

/** Ringkasan angka di atas daftar, supaya laporan bisa dibaca sekali lihat. */
export interface LaporanRingkasanDto {
  totalAmbil: number;
  /** Banyak orang tua yang **punya minimal satu** tanggal. */
  orangTuaAktif: number;
  /** Tanggal berbeda yang terisi klaim (bisa < `totalAmbil` lintas kelas). */
  tanggalTerisi: number;
  /**
   * Banyak orang tua yang terdaftar punya anak di kelas yang diminta tetapi
   * **belum pernah** mengambil satu tanggal pun — merekalah yang perlu
   * diingatkan.
   */
  orangTuaKosong: number;
  /** Rata-rata ambil per orang tua aktif; `0` bila belum ada klaim. */
  rataRataAmbil: number;
  /**
   * Orang tua yang sama sekali belum mengambil, walau punya anak di kelas
   * yang diminta. Berguna langsung sebagai daftar tindak lanjut.
   */
  belumAmbil: Array<{
    parentId: number;
    parentName: string;
    studentNames: string[];
  }>;
}

/** Isi laporan lengkap yang dikirim server. */
export interface LaporanJadwalDto {
  from: string;
  to: string;
  /**
   * Kelas yang dilaporkan. `null` = seluruh kelas dalam cakupan user
   * (dipakai admin yang mengosongkan pemilih kelas).
   */
  className: string | null;
  ringkasan: LaporanRingkasanDto;
  /** Satu baris per orang tua yang punya klaim, urut dari terbanyak. */
  orangTua: LaporanOrangTuaDto[];
}
