import { formatIndonesianDate } from "../utils/date";

/**
 * Isi pesan WhatsApp.
 *
 * Dipisah dari `service.ts` karena teksnya adalah bagian yang paling sering
 * berubah dan paling mudah salah — dan karena bentuknya murni, ia bisa diuji
 * tanpa database maupun gateway.
 *
 * Aturan penulisannya:
 *
 * - **Bahasa Indonesia yang ramah**, sama seperti seluruh pesan error
 *   aplikasi. Penerimanya orang tua, bukan operator sistem.
 * - **Baris yang datanya kosong dihilangkan, bukan dikosongkan.** Baris
 *   "Menu : -" terbaca seperti aplikasi yang rusak.
 * - **Tidak memuat tautan atau data pribadi selain yang sudah diketahui
 *   penerimanya.** Pesan ini keluar dari server dan bisa diteruskan ke siapa
 *   saja, jadi nomor HP, alamat, dan nama anak lain tidak ikut.
 * - **Selalu diakhiri nama aplikasi**, supaya pesan dari nomor sekolah yang
 *   belum tersimpan di kontak tetap bisa dikenali.
 */

const SIGNATURE = "Pizza Snack Play";

/** "Halo Bapak/Ibu Rina," — atau sapaan umum bila namanya tidak diketahui. */
function greeting(parentName: string | null | undefined): string {
  const name = parentName?.trim();
  return name ? `Halo Bapak/Ibu ${name},` : "Halo Bapak/Ibu,";
}

/** Baris `Label : nilai` yang hilang seluruhnya bila nilainya kosong. */
function line(label: string, value: string | null | undefined): string | null {
  const text = value?.trim();
  return text ? `${label} : ${text}` : null;
}

/** Gabungkan baris-baris, buang yang kosong, dan rapikan baris kosong ganda. */
function compose(parts: Array<string | null>): string {
  return parts
    .filter((part): part is string => Boolean(part))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export interface PetugasReminderInput {
  parentName?: string | null;
  studentName?: string | null;
  className: string;
  /** Tanggal piket, `YYYY-MM-DD`. */
  date: string;
  menuName?: string | null;
  notes?: string | null;
}

/**
 * Pengingat piket untuk wali murid yang bertugas mengambil snack.
 *
 * Tanggalnya ditulis lengkap ("Kamis, 22 Oktober 2026") dan tidak pernah
 * disebut "besok": pengingat bisa dikirim untuk tanggal berapa pun, dan kata
 * "besok" yang keliru membuat wali datang di hari yang salah.
 */
export function petugasReminderMessage(input: PetugasReminderInput): string {
  return compose([
    "*Pengingat Piket Snack*",
    "",
    greeting(input.parentName),
    input.studentName
      ? `Ananda ${input.studentName.trim()} dijadwalkan piket mengambil snack pada:`
      : "Anda dijadwalkan piket mengambil snack pada:",
    "",
    line("Tanggal", formatIndonesianDate(input.date)),
    line("Kelas", input.className),
    line("Menu", input.menuName),
    line("Catatan", input.notes),
    "",
    "Mohon hadir tepat waktu agar snack bisa dibagikan sesuai jadwal. Bila berhalangan, mohon beri tahu koordinator kelas.",
    "",
    `— ${SIGNATURE}`,
  ]);
}

export interface ClaimConfirmationInput {
  parentName?: string | null;
  studentName?: string | null;
  className: string;
  /** Tanggal piket, `YYYY-MM-DD`. */
  date: string;
  menuName?: string | null;
}

/**
 * Konfirmasi setelah orang tua mengambil satu tanggal piket.
 *
 * Bagian terpentingnya bukan "terima kasih", melainkan **cara membatalkan**:
 * satu tanggal hanya bisa dipegang satu orang, jadi pilihan yang tidak jadi
 * dipakai harus dilepas supaya orang tua lain bisa mengambilnya.
 */
export function claimConfirmationMessage(
  input: ClaimConfirmationInput,
): string {
  return compose([
    "*Piket Snack Tercatat*",
    "",
    greeting(input.parentName),
    input.studentName
      ? `Terima kasih sudah mengambil jadwal piket untuk Ananda ${input.studentName.trim()}.`
      : "Terima kasih sudah mengambil jadwal piket.",
    "",
    line("Tanggal", formatIndonesianDate(input.date)),
    line("Kelas", input.className),
    line("Menu", input.menuName),
    "",
    "Bila berhalangan, silakan batalkan pilihan lewat aplikasi agar orang tua lain bisa mengambil tanggal ini.",
    "",
    `— ${SIGNATURE}`,
  ]);
}

/**
 * Pesan uji konfigurasi.
 *
 * Nama gateway ikut disebut karena tujuan satu-satunya pesan ini adalah
 * membuktikan gateway **mana** yang benar-benar dipakai — bukan sekadar
 * bahwa "ada yang terkirim".
 */
export function testMessage(provider: string): string {
  return compose([
    "*Uji Konfigurasi WhatsApp*",
    "",
    `Pesan ini dikirim lewat gateway ${provider}.`,
    "Bila Anda menerimanya, konfigurasi WhatsApp Pizza Snack Play sudah benar.",
    "",
    `— ${SIGNATURE}`,
  ]);
}
