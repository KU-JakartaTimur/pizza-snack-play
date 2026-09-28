import type {
  CopyWeekResultDto,
  ImportScheduleResultDto,
  LockScheduleResultDto,
  PublishScheduleResultDto,
} from "@/types/schedule";

/**
 * Penyusun pesan banner untuk aksi massal jadwal.
 *
 * Dipisahkan dari halaman `/jadwal` supaya kalimatnya bisa dibaca dan diubah
 * tanpa menelusuri alur mutasi React — dulu ketiganya adalah template string
 * panjang yang tertanam di dalam `onSuccess`.
 */

/**
 * Sebutkan cakupan kelas dengan jelas.
 *
 * `classNames` `null`/kosong berarti operasi sekolah-wide, sehingga daftar
 * kelas yang benar-benar tersentuh ikut disebut — inilah yang membuat
 * cakupan "(semua kelas)" terlihat, bukan sekadar dijanjikan.
 */
export function scopeLabel(
  classNames: string[] | null,
  touched: string[],
): string {
  if (!classNames || classNames.length === 0) {
    return `semua kelas (${touched.length} kelas: ${touched.join(", ")})`;
  }
  if (classNames.length === 1) return `kelas ${classNames[0]}`;
  return `${classNames.length} kelas (${classNames.join(", ")})`;
}

/** Gabungkan bagian opsional menjadi satu kalimat berpemisah koma. */
function sentence(parts: string[]): string {
  return `${parts.filter(Boolean).join(", ")}.`;
}

export function lockMessage(result: LockScheduleResultDto): string {
  return sentence([
    `Terkunci ${result.locked} jadwal untuk ${scopeLabel(result.classNames, result.classes)}`,
    result.alreadyLocked > 0 ? `${result.alreadyLocked} sudah terkunci` : "",
    result.skipped > 0 ? `${result.skipped} dilewati (sudah dipublikasi)` : "",
  ]);
}

export function publishMessage(result: PublishScheduleResultDto): string {
  const scope = scopeLabel(result.classNames, result.classes);
  const tail =
    result.alreadyPublished > 0 ? `, ${result.alreadyPublished} sudah dipublikasi` : "";

  return `${result.published} jadwal dipublikasi untuk ${scope}${tail} — sekarang terlihat oleh orang tua kelas tersebut.`;
}

export function copyMessage(result: CopyWeekResultDto): string {
  const { created, updated, skipped, sourceLabel, targetLabel } = result;
  return `Disalin ${sourceLabel} → ${targetLabel}: ${created} dibuat, ${updated} diperbarui, ${skipped} dilewati.`;
}

/**
 * Pesan banner sesudah impor teks jadwal.
 *
 * Dua kalimat terpisah karena hasilnya bisa berarti dua hal yang sangat
 * berbeda: ada yang ditambahkan, atau teksnya sudah pernah diimpor. Yang
 * kedua bukan kegagalan — karena itu nadanya netral, bukan merah.
 */
export function importMessage(result: ImportScheduleResultDto): string {
  const scope =
    result.classes.length === 1
      ? `kelas ${result.classes[0]}`
      : `${result.classes.length} kelas (${result.classes.join(", ")})`;

  if (result.createdRows === 0) {
    return `Tidak ada yang ditambahkan: seluruh ${result.skippedRows} baris pada teks itu sudah ada di ${scope}.`;
  }

  return sentence([
    `Ditambahkan ${result.createdRows} baris draft untuk ${scope}`,
    result.createdMenus > 0 ? `${result.createdMenus} menu baru` : "",
    result.skippedRows > 0
      ? `${result.skippedRows} dilewati karena sudah ada`
      : "",
  ]);
}
