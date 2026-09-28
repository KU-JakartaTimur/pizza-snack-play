/** DTO jadwal — dipakai bersama oleh API dan frontend. */

import type { MenuDto, MenuItemType } from "./catalog";
import type { ScheduleClaimSummaryDto } from "./claim";

/** Status jadwal: draft (editable) → locked (dikunci) → published (tampil ke orang tua). */
export type ScheduleStatus = "draft" | "locked" | "published";

export interface WeekDto {
  id: number;
  weekStartDate: string;
  weekEndDate: string;
  month: number;
  year: number;
  label: string | null;
}

/**
 * Satu hari pada jadwal. `scheduleId` null berarti belum ada entri jadwal
 * untuk tanggal tersebut (mis. akhir pekan atau data belum diimpor).
 *
 * Jadwal bersifat per kelas, jadi setiap hari selalu menyertakan kelas mana
 * yang sedang dilihat.
 *
 * `status` hanya diisi untuk admin/korlas; orang tua selalu melihat 'published'
 * (atau null bila jadwal belum dipublikasi).
 */
export interface ScheduleDayDto {
  date: string;
  dayOfWeek: number;
  dayName: string;
  /** Kelas yang sedang dilihat. `null` bila user belum punya kelas. */
  className: string | null;
  isToday: boolean;
  isHoliday: boolean;
  holidayName: string | null;
  notes: string | null;
  scheduleId: number | null;
  menu: MenuDto | null;
  /** Nama siswa yang bertugas piket (ambil snack) pada hari ini. */
  petugasName: string | null;
  /**
   * Siswa & orang tua yang jadi petugas — dipakai dropdown tabel jadwal untuk
   * menampilkan pilihan yang sedang aktif.
   *
   * Bernilai `null` untuk jadwal lama yang petugasnya masih berupa teks bebas
   * (diisi sebelum kolom id ada), atau bila siswanya sudah dihapus. Nama di
   * `petugasName` sengaja tetap dikirim dalam kasus itu supaya tampilan tidak
   * berubah — hanya pilihan dropdown-nya yang tampak kosong.
   */
  petugasStudentId: number | null;
  petugasParentId: number | null;
  /** Nama orang tua/wali petugas — bila diketahui. */
  petugasParentName: string | null;
  /** Status jadwal — hanya relevan untuk admin/korlas. */
  status: ScheduleStatus | null;
  /**
   * Orang tua yang sudah mengklaim tanggal ini, `null` bila masih kosong.
   * Hanya jadwal `published` yang bisa diklaim.
   */
  claim: ScheduleClaimSummaryDto | null;
}

export interface WeekScheduleDto {
  week: WeekDto | null;
  className: string | null;
  startDate: string;
  endDate: string;
  label: string;
  days: ScheduleDayDto[];
}

export interface MonthScheduleDto {
  year: number;
  month: number;
  monthName: string;
  className: string | null;
  weeks: WeekScheduleDto[];
}

/** Ringkasan untuk endpoint `/schedules/today`. */
export interface TodayScheduleDto {
  day: ScheduleDayDto;
  week: WeekScheduleDto;
}

/** Jadwal hari ini untuk SEMUA kelas — khusus admin. */
export interface TodayAllClassesDto {
  today: string;
  classes: Array<{
    className: string;
    day: ScheduleDayDto;
  }>;
  week: WeekScheduleDto;
}

/** Satu hari libur global (tabel `holidays`) — berlaku untuk semua kelas. */
export interface HolidayDto {
  id: number;
  date: string;
  name: string;
  description: string | null;
}

/**
 * Ringkasan status jadwal satu bulan, dipecah per kelas.
 *
 * Dipakai agar UI tidak perlu memuat jadwal penuh setiap kelas hanya untuk
 * menghitung berapa yang masih draft/terkunci/dipublikasi (pola 1+N).
 */
export interface MonthStatusClassDto {
  className: string;
  /** Baris jadwal dengan status draft — menahan publikasi. */
  draftCount: number;
  lockedCount: number;
  publishedCount: number;
  /** Total baris jadwal kelas ini pada bulan tersebut. */
  totalCount: number;
}

/** Jawaban endpoint `/schedules/status`. */
export interface MonthStatusDto {
  year: number;
  month: number;
  monthName: string;
  /** Cakupan data: `null` = seluruh kelas (admin), atau satu kelas (korlas). */
  className: string | null;
  /** Semua kelas yang dikenal sistem, urut alami (kelas 1, 2, …). */
  classes: string[];
  /** Rincian per kelas — termasuk kelas tanpa jadwal (semua angka 0). */
  perClass: MonthStatusClassDto[];
  /** Jumlah lintas kelas — untuk penghitung dan tombol kunci/publikasi. */
  totals: {
    draftCount: number;
    lockedCount: number;
    publishedCount: number;
    totalCount: number;
  };
  /**
   * Kelas yang masih menyisakan draft. Kosong berarti publikasi boleh
   * dijalankan. Dipakai untuk pesan "kunci dulu kelas X, Y".
   */
  draftClasses: string[];
  /**
   * `true` bila tombol publikasi sebaiknya aktif: tidak ada draft tersisa
   * dan setidaknya ada satu jadwal terkunci (pada cakupan ini).
   */
  canPublish: boolean;
}

export interface ScheduleInput {
  scheduleDate: string;
  /**
   * Kelas pemilik jadwal. Wajib untuk admin; untuk korlas diisi otomatis
   * dari kelas yang dikoordinasinya (bila dikirim, harus sama).
   */
  className?: string;
  menuId?: number | null;
  isHoliday?: boolean;
  /** Nama siswa yang bertugas piket mengambil snack. */
  petugasName?: string | null;
  /**
   * Siswa yang ditunjuk piket. Server **mengabaikan** ini dan menurunkannya
   * sendiri dari `petugasStudentId` bila dikirim — lihat `resolvePetugas` di
   * service jadwal. Dikirim oleh klien hanya sebagai sinyal maksud.
   */
  petugasParentId?: number | null;
  /** `students.id` siswa yang ditunjuk piket; `null` untuk membatalkan. */
  petugasStudentId?: number | null;
  /** Nama orang tua/wali petugas — ikut diturunkan server. */
  petugasParentName?: string | null;
  notes?: string | null;
}

// ─────────────────────────────────────────────────────────────
// Kunci & Publikasi jadwal
// ─────────────────────────────────────────────────────────────

export interface LockScheduleInput {
  /** Tanggal awal rentang yang dikunci (inklusif). */
  fromDate: string;
  /** Tanggal akhir rentang yang dikunci (inklusif). */
  toDate: string;
  /**
   * Kelas yang dikunci.
   *
   * - **Admin:** boleh dikosongkan → berlaku untuk **semua kelas** sekaligus
   *   (satu klik untuk seluruh sekolah). Bila diisi, hanya kelas itu.
   * - **Korlas:** tidak perlu diisi — otomatis kelas yang dikoordinasinya,
   *   dan kelas lain ditolak `403 forbidden_class`.
   */
  className?: string;
  /**
   * Beberapa kelas sekaligus — dipakai bilah aksi massal di kartu status.
   * Bila diisi, `className` diabaikan. `null`/kosong tetap berarti
   * "semua kelas" (admin).
   */
  classNames?: string[];
}

export interface LockClassResult {
  /** Kelas yang dihitung. */
  className: string;
  /** Baris `draft` yang berhasil dikunci untuk kelas ini. */
  locked: number;
  /** Baris yang sebelumnya sudah `locked` (dilewati). */
  alreadyLocked: number;
  /** Baris `published` yang dilewati karena tidak bisa dikunci ulang. */
  skipped: number;
}

export interface LockScheduleResultDto {
  /**
   * Kelas yang diminta; `null` berarti operasi berlaku untuk semua kelas.
   * Berisi satu elemen bila hanya satu kelas yang diminta (mis. korlas).
   */
  classNames: string[] | null;
  /** Kelas-kelas yang benar-benar tersentuh operasi, urut abjad-numerik. */
  classes: string[];
  fromDate: string;
  toDate: string;
  /** Total baris yang dikunci di seluruh kelas (atau satu kelas). */
  locked: number;
  alreadyLocked: number;
  /** Baris yang sudah published dilewati (tidak bisa dikunci ulang). */
  skipped: number;
  /** Rincian per kelas — hanya diisi saat kunci semua kelas. */
  perClass?: LockClassResult[];
}

export interface PublishScheduleInput {
  year: number;
  month: number;
  /**
   * Kelas yang dipublikasi.
   *
   * - **Admin:** boleh dikosongkan → publikasi **semua kelas** sekaligus.
   * - **Korlas:** otomatis kelas yang dikoordinasinya.
   */
  className?: string;
  /**
   * Beberapa kelas sekaligus — dipakai bilah aksi massal di kartu status.
   * Bila diisi, `className` diabaikan.
   */
  classNames?: string[];
}

/** Satu kelas yang masih menyisakan baris `draft` saat publikasi gagal. */
export interface PublishDraftBlockerDto {
  className: string;
  /** Jumlah baris `draft` yang membuat publikasi tertahan. */
  count: number;
}

export interface PublishClassResult {
  /** Kelas yang diproses. */
  className: string;
  /** Baris yang berhasil dipublikasi untuk kelas ini. */
  published: number;
  /** Baris `draft` yang tersisa (penyebab kelas ini tertahan bila > 0). */
  draftCount: number;
  /** Baris yang sebelumnya sudah `published` (dilewati). */
  alreadyPublished: number;
  /** `true` bila kelas ini tidak ikut terbit karena masih ada draft. */
  blocked: boolean;
}

export interface PublishScheduleResultDto {
  /**
   * Kelas yang diminta; `null` berarti publikasi seluruh sekolah.
   * Berisi satu elemen bila hanya satu kelas yang diminta (mis. korlas).
   */
  classNames: string[] | null;
  /** Kelas-kelas yang statusnya berubah menjadi `published`. */
  classes: string[];
  year: number;
  month: number;
  /** Total baris yang dipublikasi di seluruh kelas (atau satu kelas). */
  published: number;
  /** Jumlah baris `locked` yang jadi sumber publikasi (sebelum diubah). */
  lockedCount: number;
  /** Baris draft yang belum dikunci (menggagalkan publikasi bila > 0). */
  draftCount: number;
  /**
   * Rincian draft per kelas — hanya terisi bila publikasi gagal
   * (`409 drafts_remaining`) agar pesannya menyebut kelas penyebabnya.
   */
  draftByClass: PublishDraftBlockerDto[];
  /** Baris yang sudah published sebelumnya (dilewati). */
  alreadyPublished: number;
  /** Rincian per kelas — hanya diisi saat publikasi semua kelas. */
  perClass?: PublishClassResult[];
}

// ─────────────────────────────────────────────────────────────
// Aksi massal atas baris terpilih (checkbox di tabel jadwal)
// ─────────────────────────────────────────────────────────────

/**
 * Aksi yang bisa dijalankan atas sekumpulan baris jadwal terpilih.
 *
 * Berbeda dari `/schedules/lock` & `/schedules/publish` yang bekerja pada
 * **rentang tanggal** atau **kelas**, aksi ini bekerja pada **daftar id**
 * hasil centang di tabel — jadi admin/korlas tidak perlu mengulang satu
 * baris satu klik.
 */
export type BulkRowAction = "lock" | "publish" | "unlock";

/** Body untuk ketiga endpoint `POST /schedules/bulk/{action}`. */
export interface BulkRowScheduleInput {
  /** `schedules.id` yang dicentang. Id duplikat/tidak valid diabaikan. */
  ids: number[];
}

/** Hasil aksi massal — cukup untuk menyusun pesan banner. */
export interface BulkRowScheduleResultDto {
  action: BulkRowAction;
  /** Baris yang statusnya benar-benar berubah. */
  changed: number;
  /** Baris yang dilewati karena statusnya tidak cocok dengan aksinya. */
  skipped: number;
  /** Id yang diabaikan: tidak ditemukan, atau di luar cakupan kelas user. */
  ignored: number;
  /** Kelas yang benar-benar tersentuh, urut alami. */
  classes: string[];
}

// ─────────────────────────────────────────────────────────────
// Pencarian riwayat menu — "kapan jeruk disajikan?"
// ─────────────────────────────────────────────────────────────

export interface MenuHistoryItemMatch {
  name: string;
  itemType: MenuItemType;
}

export interface MenuHistoryMatchDto {
  date: string;
  dayName: string;
  menuId: number;
  menuName: string;
  /** Komponen menu yang cocok dengan kata kunci. */
  matchedItems: MenuHistoryItemMatch[];
  /** `true` bila nama menu itu sendiri yang cocok, bukan hanya komponennya. */
  menuNameMatched: boolean;
  notes: string | null;
}

export interface MenuHistoryDto {
  query: string;
  from: string;
  to: string;
  totalMatches: number;
  matches: MenuHistoryMatchDto[];
}

// ─────────────────────────────────────────────────────────────
// Duplikasi jadwal Sepekan
// ─────────────────────────────────────────────────────────────

export interface CopyWeekInput {
  /** Tanggal mana pun pada minggu sumber. */
  fromDate: string;
  /** Tanggal mana pun pada minggu tujuan. */
  toDate: string;
  /** Kelas yang disalin. Wajib untuk admin; korlas diisi otomatis. */
  className?: string;
  /** Timpa jadwal yang sudah ada di minggu tujuan (default: lewati). */
  overwrite?: boolean;
}

export interface CopyWeekResultDto {
  sourceLabel: string;
  targetLabel: string;
  created: number;
  updated: number;
  skipped: number;
}

// ─────────────────────────────────────────────────────────────
// Impor jadwal dari teks tempelan (admin & korlas)
//
// Sekolah mengirim jadwal sebagai teks biasa — blok rentang tanggal lalu
// baris "Hari : menu" — mis.
//
//     1 - 2 Oktober 2026
//     Kamis   : Puding Roti  + jeruk
//     Jumat   : Libur
//
// Fitur ini membacanya, mencocokkan nama hari dengan **kalender sungguhan**,
// lalu menambah baris jadwal yang belum ada. Baris yang sudah ada dilewati.
// ─────────────────────────────────────────────────────────────

/** Satu hari hasil pembacaan teks, sebelum menyentuh database. */
export interface ImportParsedDayDto {
  /** Tanggal ISO hasil pencocokan nama hari dengan kalender. */
  date: string;
  dayName: string;
  /** Teks menu apa adanya dari tempelan. */
  menuText: string;
  isHoliday: boolean;
  /** Menu utama hasil pemecahan "Utama + Buah". */
  menuMain: string | null;
  /** Buah pendamping; `null` bila tidak ada tanda `+`. */
  menuFruit: string | null;
  notes: string | null;
}

/** Satu blok rentang tanggal pada teks tempelan. */
export interface ImportParsedBlockDto {
  /** Rentang yang **tertulis** di teks. */
  rawStartDate: string;
  rawEndDate: string;
  /** Rentang yang akhirnya dipakai (sama, kecuali blok digeser). */
  startDate: string;
  endDate: string;
  /** `true` bila rentang digeser agar nama hari cocok dengan kalender. */
  shifted: boolean;
  days: ImportParsedDayDto[];
}

/** Baris teks yang tidak bisa diproses. */
export interface ImportParseIssueDto {
  /** Nomor baris pada teks tempelan (1-based). */
  line: number;
  message: string;
}

export interface ImportParseResultDto {
  blocks: ImportParsedBlockDto[];
  /** Masalah yang membuat sebagian teks tidak terbaca. */
  issues: ImportParseIssueDto[];
  /** Penyesuaian yang dilakukan tetapi tidak menggagalkan impor. */
  warnings: string[];
  dayCount: number;
}

export interface ImportScheduleInput {
  /** Teks tempelan dari sekolah. */
  text: string;
  /**
   * Kelas tujuan. Dikosongkan = semua kelas untuk admin, dan selalu
   * kelas korlas sendiri untuk korlas.
   */
  classNames?: string[] | null;
  /** `true` = hanya menghitung (pratinjau), tidak menulis apa pun. */
  dryRun?: boolean;
}

/** Nasib satu hari pada satu kelas. */
export type ImportRowOutcome = "create" | "skip";

export interface ImportDayOutcomeDto {
  date: string;
  dayName: string;
  menuText: string;
  isHoliday: boolean;
  /** Nama menu yang dipakai (menu baru maupun lama). */
  menuName: string | null;
  /** `true` bila menu itu baru dibuat, bukan dipakai ulang. */
  menuCreated: boolean;
  outcome: ImportRowOutcome;
  /** Alasan dilewati — `null` bila baris dibuat. */
  reason: string | null;
  classesCreated: string[];
  classesSkipped: string[];
}

export interface ImportScheduleResultDto {
  /** `true` bila ini hanya pratinjau. */
  dryRun: boolean;
  /** Jumlah hari yang terbaca dari teks. */
  parsedDays: number;
  /** Jumlah blok minggu yang terbaca. */
  blocks: number;
  /** Baris jadwal baru. */
  createdRows: number;
  /** Baris yang dilewati karena (tanggal, kelas) sudah ada. */
  skippedRows: number;
  /** Menu baru yang dibuat. */
  createdMenus: number;
  /** Menu lama yang dipakai ulang. */
  reusedMenus: number;
  /** Kelas yang jadi sasaran impor, urut alami. */
  classes: string[];
  days: ImportDayOutcomeDto[];
  warnings: string[];
  issues: ImportParseIssueDto[];
}
