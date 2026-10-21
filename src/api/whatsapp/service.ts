import type { Client } from "sikuwa";
import type { Db } from "../../database/db";
import type { WhatsappBroadcast } from "../../database/schema";
import { formatIndonesianDate } from "../utils/date";
import { normalizePhone } from "../utils/phone";
import {
  createWhatsappClient,
  whatsappStatus,
  WhatsappNotConfiguredError,
  type WhatsappBindings,
} from "./client";
import { deliver } from "./delivery";
import { collectRecipients } from "./recipients";
import { whatsappRepository } from "./repository";
import {
  claimConfirmationMessage,
  petugasReminderMessage,
  testMessage,
} from "./templates";

/**
 * Notifikasi WhatsApp ke orang tua & petugas piket.
 *
 * Tiga jenis pesan, satu jalur kirim:
 *
 * | Jenis | Pemicu | Penerima |
 * | --- | --- | --- |
 * | Broadcast | admin/korlas menulis bebas | orang tua aktif satu kelas/semua |
 * | Pengingat piket | admin/korlas, satu tanggal | wali petugas pada tanggal itu |
 * | Konfirmasi klaim | orang tua mengambil tanggal | orang tua yang mengambil |
 *
 * Semuanya memakai `sikuwa` lewat `createWhatsappClient()`. Bila gateway
 * belum dikonfigurasi, ketiganya **tidak melempar** ke pemanggil yang tidak
 * mengharapkannya: broadcast dan pengingat mengembalikan
 * `"gateway_not_configured"` (supaya UI bisa menjelaskan), sedangkan
 * konfirmasi klaim diam saja — klaim yang berhasil tidak boleh gagal karena
 * WhatsApp.
 */

export type WhatsappError =
  | "gateway_not_configured"
  | "no_targets"
  | "message_empty"
  | "invalid_destination"
  | "send_failed";

export interface BroadcastInput {
  senderId: number;
  message: string;
  /** `null` = semua kelas. */
  className: string | null;
}

export interface BroadcastResult {
  broadcastId: number;
  targetCount: number;
  sent: number;
  failed: number;
  /** Baris yang dibuang karena nomornya kosong/tidak sah atau duplikat. */
  skipped: number;
}

export interface PetugasReminderInput {
  senderId: number;
  /** Tanggal piket, `YYYY-MM-DD`. */
  date: string;
  /** `null` = semua kelas. */
  className: string | null;
}

export interface PetugasReminderResult extends BroadcastResult {
  date: string;
}

export interface ClaimConfirmationInput {
  parentId: number;
  parentName: string;
  studentName: string | null;
  className: string;
  date: string;
  menuName: string | null;
}

/** Status gateway yang aman ditampilkan ke UI. */
export type WhatsappStatusResult = ReturnType<typeof whatsappStatus>;

/**
 * Rangkum kegagalan pertama untuk kolom `error_message`.
 *
 * Hanya kegagalan **pertama** yang disimpan: yang ingin diketahui pembaca
 * riwayat adalah "kenapa gagal", bukan tiga ratus salinan alasan yang sama.
 */
function firstFailure(
  failures: Array<{ destination: string; reason: string }>,
): string | null {
  const first = failures[0];
  return first ? `${first.destination}: ${first.reason}` : null;
}

/**
 * Bangun `Client`, atau kembalikan alasan belum siap.
 *
 * Tiga jalur kirim membutuhkannya dengan bentuk yang sama, dan yang berbeda
 * hanya cara melaporkannya: broadcast & pengingat mengembalikan kode error,
 * pesan uji mengembalikan teks alasan. Kesalahannya sendiri hanya satu jenis,
 * jadi tidak perlu ditulis ulang tiga kali.
 */
function buildClient(
  env: WhatsappBindings,
): { ok: true; client: Client } | { ok: false; error: WhatsappNotConfiguredError } {
  try {
    return { ok: true, client: createWhatsappClient(env) };
  } catch (error) {
    if (error instanceof WhatsappNotConfiguredError) {
      return { ok: false, error };
    }
    throw error;
  }
}

class WhatsappService {
  status(env: WhatsappBindings): WhatsappStatusResult {
    return whatsappStatus(env);
  }

  /**
   * Kirim satu pesan uji.
   *
   * Alasan kegagalan dikembalikan apa adanya — bukan disamarkan menjadi
   * "gagal" — karena satu-satunya gunanya endpoint ini adalah membantu admin
   * menemukan token atau URL yang salah.
   */
  async sendTest(
    env: WhatsappBindings,
    input: { destination: string; message?: string | null },
  ): Promise<
    | { ok: true; provider: string; destination: string; detail: string }
    | { ok: false; error: WhatsappError; reason: string }
  > {
    const destination = normalizePhone(input.destination);
    if (!destination || destination === "invalid") {
      return {
        ok: false,
        error: "invalid_destination",
        reason:
          "Nomor tujuan tidak sah. Tulis nomor Indonesia, mis. 081234567890.",
      };
    }

    const built = buildClient(env);
    if (!built.ok) {
      return {
        ok: false,
        error: "gateway_not_configured",
        reason: built.error.message,
      };
    }

    const { client } = built;

    try {
      const detail = await client.send({
        destination,
        message: input.message?.trim() || testMessage(client.providerName()),
      });
      return {
        ok: true,
        provider: client.providerName(),
        destination,
        detail,
      };
    } catch (error) {
      return {
        ok: false,
        error: "send_failed",
        reason: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /** Broadcast bebas ke orang tua aktif, satu kelas atau seluruh sekolah. */
  async broadcast(
    db: Db,
    env: WhatsappBindings,
    input: BroadcastInput,
  ): Promise<BroadcastResult | WhatsappError> {
    const message = input.message.trim();
    if (!message) return "message_empty";

    const built = buildClient(env);
    if (!built.ok) return "gateway_not_configured";

    const { client } = built;

    const rows = await whatsappRepository.listParentsWithPhone(
      db,
      input.className,
    );
    const { recipients, skipped } = collectRecipients(rows);
    if (recipients.length === 0) return "no_targets";

    const targetScope = input.className ?? "all";
    const broadcast = await whatsappRepository.insertBroadcast(db, {
      senderId: input.senderId,
      message,
      targetScope,
      targetCount: recipients.length,
      sentCount: 0,
      status: "sending",
    });

    const outcome = await deliver(
      client,
      recipients.map((recipient) => ({
        destination: recipient.phone,
        message,
      })),
    );

    await whatsappRepository.updateBroadcast(db, broadcast.id, {
      sentCount: outcome.sent,
      status: outcome.sent === 0 ? "failed" : "completed",
      errorMessage: firstFailure(outcome.failures),
    });

    return {
      broadcastId: broadcast.id,
      targetCount: recipients.length,
      sent: outcome.sent,
      failed: outcome.failed,
      skipped,
    };
  }

  /**
   * Pengingat piket untuk satu tanggal.
   *
   * Isi pesannya disusun **per penerima**, bukan sekali untuk semua: menu dan
   * nama anak berbeda antar kelas, dan pengingat yang menyebut nama anak orang
   * lain lebih buruk daripada tidak ada pengingat.
   */
  async remindPetugas(
    db: Db,
    env: WhatsappBindings,
    input: PetugasReminderInput,
  ): Promise<PetugasReminderResult | WhatsappError> {
    const built = buildClient(env);
    if (!built.ok) return "gateway_not_configured";

    const { client } = built;

    const rows = await whatsappRepository.listPetugasByDate(
      db,
      input.date,
      input.className,
    );
    const { recipients, skipped } = collectRecipients(rows);
    if (recipients.length === 0) return "no_targets";

    const label = `Pengingat piket ${formatIndonesianDate(input.date)}${
      input.className ? ` kelas ${input.className}` : ""
    }`;

    const broadcast = await whatsappRepository.insertBroadcast(db, {
      senderId: input.senderId,
      message: label,
      targetScope: input.className
        ? `petugas:${input.date}:${input.className}`
        : `petugas:${input.date}`,
      targetCount: recipients.length,
      sentCount: 0,
      status: "sending",
    });

    const outcome = await deliver(
      client,
      recipients.map((recipient) => ({
        destination: recipient.phone,
        message: petugasReminderMessage({
          parentName: recipient.parentName,
          studentName: recipient.studentName,
          className: recipient.className ?? input.className ?? "-",
          date: recipient.scheduleDate,
          menuName: recipient.menuName,
          notes: recipient.notes,
        }),
      })),
    );

    await whatsappRepository.updateBroadcast(db, broadcast.id, {
      sentCount: outcome.sent,
      status: outcome.sent === 0 ? "failed" : "completed",
      errorMessage: firstFailure(outcome.failures),
    });

    return {
      broadcastId: broadcast.id,
      date: input.date,
      targetCount: recipients.length,
      sent: outcome.sent,
      failed: outcome.failed,
      skipped,
    };
  }

  /**
   * Konfirmasi ke orang tua yang baru mengambil satu tanggal piket.
   *
   * **Tidak pernah melempar.** Klaim sudah tersimpan di database dan sudah
   * dijawab ke pengguna; WhatsApp hanya pelengkap. Kegagalan apa pun — nomor
   * kosong, gateway mati, token kedaluwarsa — dicatat sebagai peringatan lalu
   * dilewati.
   */
  async confirmClaimQuietly(
    db: Db,
    env: WhatsappBindings,
    input: ClaimConfirmationInput,
  ): Promise<void> {
    if (!whatsappStatus(env).configured) return;

    try {
      const contact = await whatsappRepository.findParentContact(
        db,
        input.parentId,
      );
      const destination = normalizePhone(contact?.phone ?? "");
      if (!destination || destination === "invalid") return;

      const client = createWhatsappClient(env);
      await client.send({
        destination,
        message: claimConfirmationMessage({
          parentName: contact?.parentName ?? input.parentName,
          studentName: input.studentName,
          className: input.className,
          date: input.date,
          menuName: input.menuName,
        }),
      });
    } catch (error) {
      console.warn(
        "[whatsapp] konfirmasi klaim tidak terkirim",
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  async history(db: Db): Promise<WhatsappBroadcast[]> {
    return whatsappRepository.listBroadcasts(db);
  }
}

export const whatsappService = new WhatsappService();
