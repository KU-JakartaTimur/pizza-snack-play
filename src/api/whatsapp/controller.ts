import type { Context } from "hono";
import { getDb } from "../../database/db";
import type { AuthEnv } from "../middleware/auth";
import { addDays, isIsoDate, todayInWib } from "../utils/date";
import {
  responseBadRequest,
  responseForbidden,
  responseInternalError,
  responseOK,
} from "../utils/response";
import { whatsappService, type WhatsappError } from "./service";

/**
 * Endpoint notifikasi WhatsApp.
 *
 * Pembatasan wewenang ditegakkan di sini, bukan hanya di UI: korlas hanya
 * boleh menyentuh kelasnya sendiri, dan pengiriman pesan uji adalah wewenang
 * admin karena menyangkut konfigurasi server.
 */

type WhatsappContext = Context<AuthEnv>;

function mapError(
  c: WhatsappContext,
  error: WhatsappError,
  subject: "broadcast" | "petugas",
) {
  switch (error) {
    case "gateway_not_configured":
      return responseInternalError(
        c,
        "Gateway WhatsApp belum dikonfigurasi — hubungi admin sistem",
      );
    case "message_empty":
      return responseBadRequest(c, "Pesan tidak boleh kosong");
    case "invalid_destination":
      return responseBadRequest(c, "Nomor tujuan tidak sah");
    case "no_targets":
      return responseBadRequest(
        c,
        subject === "petugas"
          ? "Tidak ada petugas piket pada tanggal itu yang punya nomor WhatsApp"
          : "Tidak ada orang tua aktif yang punya nomor WhatsApp",
      );
    case "send_failed":
      return responseInternalError(c, "Gagal mengirim pesan WhatsApp");
  }
}

/** Ringkas hasil kirim menjadi satu kalimat untuk UI. */
function deliverySummary(result: {
  sent: number;
  failed: number;
  skipped: number;
}): string {
  const base = `${result.sent} sukses, ${result.failed} gagal`;
  return result.skipped > 0
    ? `${base} (${result.skipped} nomor dilewati)`
    : base;
}

class WhatsappController {
  /** Kesiapan gateway — tidak memuat token. */
  status = async (c: WhatsappContext) => {
    return responseOK(
      c,
      "Status gateway WhatsApp",
      whatsappService.status(c.env),
    );
  };

  /** Kirim satu pesan uji ke nomor admin. `POST /whatsapp/test` */
  sendTest = async (c: WhatsappContext) => {
    let body: { destination?: unknown; message?: unknown };
    try {
      body = await c.req.json();
    } catch {
      return responseBadRequest(c, "Body harus berupa JSON");
    }

    if (typeof body.destination !== "string" || !body.destination.trim()) {
      return responseBadRequest(c, "`destination` wajib diisi");
    }
    if (body.message !== undefined && typeof body.message !== "string") {
      return responseBadRequest(c, "`message` harus berupa teks");
    }

    const result = await whatsappService.sendTest(c.env, {
      destination: body.destination,
      message: typeof body.message === "string" ? body.message : null,
    });

    if (result.ok) {
      return responseOK(
        c,
        `Pesan uji terkirim lewat ${result.provider}`,
        result,
      );
    }

    if (result.error === "invalid_destination") {
      return responseBadRequest(c, result.reason);
    }
    if (result.error === "gateway_not_configured") {
      return responseInternalError(c, result.reason);
    }
    return responseInternalError(
      c,
      `Gagal mengirim pesan uji — ${result.reason}`,
    );
  };

  /** Broadcast bebas ke orang tua. `POST /whatsapp/broadcast` */
  broadcast = async (c: WhatsappContext) => {
    const user = c.get("user");

    let body: { message?: unknown; targetScope?: unknown };
    try {
      body = await c.req.json();
    } catch {
      return responseBadRequest(c, "Body harus berupa JSON");
    }

    if (typeof body.message !== "string" || !body.message.trim()) {
      return responseBadRequest(c, "`message` wajib diisi");
    }

    let targetScope =
      typeof body.targetScope === "string" && body.targetScope
        ? body.targetScope
        : "all";

    if (user.role === "korlas") {
      if (targetScope !== "all" && targetScope !== user.className) {
        return responseForbidden(
          c,
          "Korlas hanya boleh broadcast ke kelasnya sendiri",
        );
      }
      targetScope = user.className ?? "all";
    }

    const result = await whatsappService.broadcast(getDb(c.env), c.env, {
      senderId: user.sub,
      message: body.message,
      className: targetScope === "all" ? null : targetScope,
    });

    if (typeof result === "string") return mapError(c, result, "broadcast");

    return responseOK(
      c,
      `Broadcast terkirim: ${deliverySummary(result)}`,
      result,
    );
  };

  /**
   * Pengingat piket untuk satu tanggal. `POST /whatsapp/petugas`
   *
   * Tanggal bawaannya **besok** — pengingat paling berguna dikirim sehari
   * sebelum piket, dan itu juga yang paling sering diminta.
   */
  remindPetugas = async (c: WhatsappContext) => {
    const user = c.get("user");

    let body: { date?: unknown; className?: unknown };
    try {
      body = await c.req.json();
    } catch {
      return responseBadRequest(c, "Body harus berupa JSON");
    }

    const date =
      typeof body.date === "string" && body.date
        ? body.date
        : addDays(todayInWib(), 1);

    if (!isIsoDate(date)) {
      return responseBadRequest(
        c,
        "`date` harus berformat YYYY-MM-DD, mis. 2026-10-22",
      );
    }

    let className: string | null =
      typeof body.className === "string" && body.className
        ? body.className
        : null;

    if (user.role === "korlas") {
      if (className && className !== user.className) {
        return responseForbidden(
          c,
          "Korlas hanya boleh mengingatkan kelasnya sendiri",
        );
      }
      className = user.className ?? null;
    }

    const result = await whatsappService.remindPetugas(getDb(c.env), c.env, {
      senderId: user.sub,
      date,
      className,
    });

    if (typeof result === "string") return mapError(c, result, "petugas");

    return responseOK(
      c,
      `Pengingat piket terkirim: ${deliverySummary(result)}`,
      result,
    );
  };

  /** Riwayat pengiriman (50 terakhir). `GET /whatsapp/history` */
  history = async (c: WhatsappContext) => {
    return responseOK(
      c,
      "Riwayat broadcast WhatsApp",
      await whatsappService.history(getDb(c.env)),
    );
  };
}

export const whatsappController = new WhatsappController();
