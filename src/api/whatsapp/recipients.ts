import { normalizePhone } from "../utils/phone";

/**
 * Penyaringan daftar penerima WhatsApp.
 *
 * Dua hal yang selalu terjadi pada data orang tua di sekolah dan tidak boleh
 * sampai ke gateway:
 *
 * 1. **Nomor kosong atau salah ketik.** Gateway akan menerima requestnya lalu
 *    gagal di sisi mereka, dan kita hanya melihat "gagal" tanpa tahu sebabnya.
 * 2. **Nomor yang sama muncul lebih dari sekali.** Satu orang tua bisa punya
 *    dua anak di kelas yang sama, dan query yang join ke `students` akan
 *    mengembalikan dua baris untuk satu nomor. Mengirim dua kali ke orang yang
 *    sama bukan hanya mengganggu — ia juga pola yang memicu pemblokiran.
 *
 * Modul ini murni supaya bisa diuji tanpa database.
 */

/** Kolom minimum yang dibutuhkan untuk menentukan satu tujuan. */
export interface RecipientRow {
  parentId: number;
  parentName: string;
  phone: string | null;
  className: string | null;
}

/** Baris asal yang lolos saringan, dengan nomor yang sudah pasti terisi. */
export type Recipient<T extends RecipientRow> = T & { phone: string };

export interface CollectedRecipients<T extends RecipientRow> {
  recipients: Recipient<T>[];
  /** Baris yang dibuang: nomor tidak sah atau duplikat. */
  skipped: number;
}

/**
 * Kunci pembanding duplikat dalam bentuk internasional.
 *
 * Menyalin aturan `PhoneNumber.normalize()` milik `sikuwa` dengan sengaja:
 * `081234567890` dan `+62 812 3456 7890` adalah **orang yang sama**, dan SDK
 * akan mengirim keduanya ke WID yang sama. Tanpa penyamaan ini, data orang tua
 * yang nomornya tercatat dua kali akan menerima pesan dua kali — dan itulah
 * pola yang paling cepat memicu pemblokiran nomor sekolah.
 */
function canonicalKey(digits: string): string {
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("8")) return `62${digits}`;
  return digits;
}

/**
 * Saring dan rapikan daftar penerima.
 *
 * Nomor yang tersimpan dibiarkan dalam bentuk aslinya (`0812…` tetap `0812…`)
 * karena `sikuwa` menormalkannya sendiri untuk tiap gateway. Yang dipakai di
 * sini hanya **digitnya**, sebagai kunci pembanding duplikat.
 *
 * Baris duplikat mempertahankan yang **pertama**, sehingga kelas dan nama anak
 * yang terpilih bisa ditebak pembaca: urutan query sudah diatur pemanggil.
 */
export function collectRecipients<T extends RecipientRow>(
  rows: T[],
): CollectedRecipients<T> {
  const recipients: Recipient<T>[] = [];
  const seen = new Set<string>();
  let skipped = 0;

  for (const row of rows) {
    const digits = normalizePhone(row.phone ?? "");
    const key = digits && digits !== "invalid" ? canonicalKey(digits) : null;

    if (!key || seen.has(key)) {
      skipped++;
      continue;
    }

    seen.add(key);
    recipients.push({ ...row, phone: row.phone!.trim() });
  }

  return { recipients, skipped };
}
