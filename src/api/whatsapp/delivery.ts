/**
 * Pengiriman beruntun dengan kegagalan yang terisolasi.
 *
 * `sikuwa` punya dua jalur: satu pesan per request, atau satu batch berisi
 * banyak pesan. Untuk notifikasi sekolah, **satu per request** yang dipilih
 * dengan sengaja:
 *
 * - Satu nomor yang salah tidak menggagalkan seluruh kelas. Batch milik
 *   beberapa gateway (mis. Fonnte) ditolak seluruhnya bila ada satu tujuan
 *   yang tidak sah.
 * - Jumlah "terkirim" dan "gagal" bisa dilaporkan apa adanya. Batch hanya
 *   mengembalikan satu status, dan angka itu tidak bisa dipakai memutuskan
 *   siapa yang perlu dihubungi ulang.
 *
 * Modul ini tidak tahu apa-apa soal WhatsApp maupun database — ia hanya
 * memastikan satu kegagalan tidak menghentikan sisanya.
 */

/** Bagian `Client` yang dipakai — cukup `send`, supaya mudah diganti di uji. */
export interface MessageSender {
  send(message: { destination: string; message: string }): Promise<string>;
}

export interface OutgoingText {
  destination: string;
  message: string;
}

export interface DeliveryFailure {
  destination: string;
  /** Pesan kesalahan yang sudah dipotong — kolom `error_message` di D1 terbatas. */
  reason: string;
}

export interface DeliveryOutcome {
  sent: number;
  failed: number;
  failures: DeliveryFailure[];
}

/**
 * Batas panjang alasan kegagalan yang disimpan.
 *
 * Pesan exception dari gateway bisa memuat seluruh body respons. Kolom
 * `error_message` hanya perlu cukup untuk dibaca manusia, dan body panjang
 * di dalam baris riwayat justru menyulitkan tampilannya.
 */
const MAX_REASON_LENGTH = 300;

function reasonOf(error: unknown): string {
  const raw =
    error instanceof Error ? error.message : String(error ?? "Gagal dikirim");
  const text = raw.trim() || "Gagal dikirim";
  return text.length > MAX_REASON_LENGTH
    ? `${text.slice(0, MAX_REASON_LENGTH - 1)}…`
    : text;
}

/**
 * Kirim satu per satu, berhenti hanya bila daftarnya habis.
 *
 * Kegagalan dicatat lalu dilanjutkan. Pemanggil yang memutuskan artinya:
 * satu kegagalan dari sepuluh penerima bukan alasan membatalkan sembilan
 * sisanya, tetapi juga tidak boleh dilaporkan sebagai "terkirim semua".
 */
export async function deliver(
  sender: MessageSender,
  messages: OutgoingText[],
): Promise<DeliveryOutcome> {
  let sent = 0;
  let failed = 0;
  const failures: DeliveryFailure[] = [];

  for (const item of messages) {
    try {
      await sender.send({
        destination: item.destination,
        message: item.message,
      });
      sent++;
    } catch (error) {
      failed++;
      failures.push({ destination: item.destination, reason: reasonOf(error) });
    }
  }

  return { sent, failed, failures };
}
