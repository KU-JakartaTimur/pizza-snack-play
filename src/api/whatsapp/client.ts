import { Client, type ConfigOptions, type FetchLike } from "sikuwa";
import type { Env } from "../../database/db";

/**
 * Konfigurasi `sikuwa` untuk Worker.
 *
 * Sebelumnya WhatsApp dikirim dengan `fetch` mentah ke satu URL gateway
 * generik, sehingga bentuk payload-nya harus disesuaikan sendiri untuk tiap
 * provider. Modul ini menyerahkan urusan itu ke `sikuwa`, yang menyatukan
 * tujuh gateway di balik satu antarmuka — mengganti gateway cukup mengganti
 * nilai environment, tanpa menyentuh kode pemanggil.
 *
 * Tiga keputusan yang penting di sini:
 *
 * 1. **Konfigurasi dibangun per request, bukan sekali di modul.** Binding
 *    Worker hanya tersedia lewat `c.env`; menyimpannya di variabel modul
 *    berarti nilai dari request pertama yang menempel selamanya di isolate
 *    yang dipakai ulang.
 * 2. **`Config.useResolver()` tidak dipakai.** Ia memasang resolver global
 *    yang sama untuk seluruh isolate, padahal environment di sini per
 *    pemanggilan — persis jebakan yang ingin dihindari poin 1.
 * 3. **Tidak dikonfigurasi bukan kesalahan fatal.** Sekolah yang belum punya
 *    gateway tetap bisa memakai seluruh aplikasi; pemanggil memeriksa
 *    `whatsappStatus()` lebih dulu dan melewati pengiriman.
 */

/** Nama gateway yang dikenal `sikuwa`, persis seperti kunci `Client.providers()`. */
export const WHATSAPP_PROVIDERS = [
  "Fonnte",
  "OpenWA",
  "ApiMe",
  "EvolutionAPI",
  "Wuzapi",
  "Wwebjs",
  "Waxum",
] as const;

export type WhatsappProvider = (typeof WHATSAPP_PROVIDERS)[number];

/**
 * Ejaan lain yang lazim ditulis operator. Nilai environment tidak pernah
 * divalidasi saat disimpan, jadi salah huruf besar-kecil atau tanda hubung
 * akan tampak seperti "gateway tidak dikenal" padahal maksudnya jelas.
 */
const PROVIDER_ALIASES: Record<string, WhatsappProvider> = {
  fonnte: "Fonnte",
  openwa: "OpenWA",
  "open-wa": "OpenWA",
  apime: "ApiMe",
  "api-me": "ApiMe",
  evolutionapi: "EvolutionAPI",
  "evolution-api": "EvolutionAPI",
  evolution: "EvolutionAPI",
  wuzapi: "Wuzapi",
  wwebjs: "Wwebjs",
  "wweb-js": "Wwebjs",
  waxum: "Waxum",
};

/** Pengaturan yang dibaca dari binding Worker. */
export type WhatsappBindings = Pick<
  Env,
  | "WHATSAPP_PROVIDER"
  | "WHATSAPP_TOKEN"
  | "WHATSAPP_URL"
  | "WHATSAPP_SESSION"
  | "WHATSAPP_PACING_CYCLE"
  | "WHATSAPP_TYPING"
  | "WHATSAPP_RETRIES"
  | "WHATSAPP_CHECK_NUMBERS"
  | "WHATSAPP_GATEWAY_URL"
>;

/**
 * Gateway belum siap dipakai.
 *
 * Dibedakan dari kegagalan kirim: yang ini terjadi **sebelum** ada request
 * apa pun, dan pemanggil biasanya cukup menampilkan pesan "hubungi admin
 * sistem" tanpa mencoba lagi.
 */
export class WhatsappNotConfiguredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WhatsappNotConfiguredError";
  }
}

/**
 * Baca satu binding sebagai teks yang sudah dirapikan.
 *
 * Kunci per-provider (`WHATSAPP_TOKEN_OpenWA`) tidak bisa ditulis di tipe
 * `Env` satu per satu tanpa menduplikasi tujuh baris untuk tiga kunci, jadi
 * jalurnya lewat indeks dinamis — satu tempat, dengan pemeriksaan tipe.
 */
function readBinding(
  env: WhatsappBindings,
  key: string,
): string | null {
  const raw = (env as unknown as Record<string, unknown>)[key];
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

/** `"1"`, `"true"`, `"ya"` → aktif. Kunci kosong berarti mati. */
function isEnabled(value: string | undefined): boolean {
  if (!value) return false;
  return ["1", "true", "ya", "on"].includes(value.trim().toLowerCase());
}

/**
 * Nama gateway yang dipakai, atau `null` bila belum diisi/diisi nama yang
 * tidak dikenal.
 *
 * Nama yang tidak dikenal sengaja **tidak** dilempar di sini: fungsi ini juga
 * dipakai `whatsappStatus()` yang harus tetap bisa menjawab "belum siap"
 * tanpa melempar exception. Kesalahannya baru dilaporkan saat pengiriman,
 * lengkap dengan daftar nama yang sah.
 */
export function resolveProvider(
  env: WhatsappBindings,
): WhatsappProvider | null {
  const raw = env.WHATSAPP_PROVIDER?.trim();
  if (!raw) return null;

  const exact = WHATSAPP_PROVIDERS.find(
    (name) => name.toLowerCase() === raw.toLowerCase(),
  );
  if (exact) return exact;

  return PROVIDER_ALIASES[raw.toLowerCase()] ?? null;
}

/** Token efektif: kunci per-provider menang atas `WHATSAPP_TOKEN`. */
export function resolveToken(
  env: WhatsappBindings,
  provider: WhatsappProvider,
): string | null {
  return (
    readBinding(env, `WHATSAPP_TOKEN_${provider}`) ??
    env.WHATSAPP_TOKEN?.trim() ??
    null
  );
}

/** URL efektif: kunci per-provider menang atas `WHATSAPP_URL`. */
function resolveUrl(
  env: WhatsappBindings,
  provider: WhatsappProvider,
): string | null {
  return (
    readBinding(env, `WHATSAPP_URL_${provider}`) ??
    env.WHATSAPP_URL?.trim() ??
    null
  );
}

/** Session efektif: kunci per-provider menang atas `WHATSAPP_SESSION`. */
function resolveSession(
  env: WhatsappBindings,
  provider: WhatsappProvider,
): string | null {
  return (
    readBinding(env, `WHATSAPP_SESSION_${provider}`) ??
    env.WHATSAPP_SESSION?.trim() ??
    null
  );
}

/**
 * Ringkasan kesiapan gateway — aman ditampilkan ke UI karena tidak memuat
 * token. Dipakai untuk mematikan tombol kirim sebelum admin menekannya.
 */
export function whatsappStatus(env: WhatsappBindings): {
  configured: boolean;
  provider: WhatsappProvider | null;
  session: string | null;
  reason: string | null;
} {
  const provider = resolveProvider(env);
  const session = provider ? resolveSession(env, provider) : null;

  if (!provider) {
    return {
      configured: false,
      provider: null,
      session: null,
      reason: env.WHATSAPP_PROVIDER?.trim()
        ? `Gateway "${env.WHATSAPP_PROVIDER}" tidak dikenal`
        : "WHATSAPP_PROVIDER belum diisi",
    };
  }

  const token = resolveToken(env, provider);
  if (!token) {
    return {
      configured: false,
      provider,
      session,
      reason: `Token ${provider} belum diisi (WHATSAPP_TOKEN_${provider})`,
    };
  }

  return { configured: true, provider, session, reason: null };
}

/**
 * Pesan untuk operator yang masih memakai kunci lama.
 *
 * Tanpa ini, kegagalan pertama yang terlihat hanya "gateway belum
 * dikonfigurasi" padahal `WHATSAPP_GATEWAY_URL` sudah lama terisi — dan
 * pemiliknya akan mengira aplikasinya rusak, bukan bahwa kuncinya berganti.
 */
function migrationHint(env: WhatsappBindings): string {
  return env.WHATSAPP_GATEWAY_URL?.trim()
    ? " Kunci lama WHATSAPP_GATEWAY_URL sudah tidak dipakai — ganti dengan WHATSAPP_PROVIDER + WHATSAPP_TOKEN_<Provider>."
    : "";
}

/**
 * Susun opsi `sikuwa` dari binding Worker.
 *
 * Pacing dan typing hanya diteruskan bila kuncinya memang diisi: `sikuwa`
 * sengaja mematikannya secara bawaan, dan mengirim `{ cycle: "" }` akan
 * membuatnya tampak "diatur" padahal tidak.
 */
export function buildConfigOptions(env: WhatsappBindings): ConfigOptions {
  const provider = resolveProvider(env);
  if (!provider) {
    // Nama yang salah ketik dibedakan dari yang belum diisi: keduanya sama-sama
    // "belum siap", tetapi hanya yang pertama butuh perbaikan ejaan.
    const raw = env.WHATSAPP_PROVIDER?.trim();
    throw new WhatsappNotConfiguredError(
      raw
        ? `Gateway "${raw}" tidak dikenal. Pilih salah satu dari: ${WHATSAPP_PROVIDERS.join(", ")}.${migrationHint(env)}`
        : `Gateway WhatsApp belum dikonfigurasi. Isi WHATSAPP_PROVIDER dengan salah satu dari: ${WHATSAPP_PROVIDERS.join(", ")}.${migrationHint(env)}`,
    );
  }

  const token = resolveToken(env, provider);
  if (!token) {
    throw new WhatsappNotConfiguredError(
      `Token gateway ${provider} belum diisi. Simpan sebagai Worker Secret: WHATSAPP_TOKEN_${provider} (atau WHATSAPP_TOKEN bila hanya ada satu gateway).`,
    );
  }

  const url = resolveUrl(env, provider);
  const session = resolveSession(env, provider);
  const pacing = env.WHATSAPP_PACING_CYCLE?.trim();

  return {
    provider,
    tokens: { [provider]: token },
    ...(url ? { urls: { [provider]: url } } : {}),
    ...(session ? { session } : {}),
    ...(pacing ? { pacing: { cycle: pacing } } : {}),
    ...(env.WHATSAPP_TYPING?.trim()
      ? { typing: { enabled: env.WHATSAPP_TYPING } }
      : {}),
    ...(env.WHATSAPP_RETRIES?.trim()
      ? { retries: env.WHATSAPP_RETRIES }
      : {}),
    check_numbers: isEnabled(env.WHATSAPP_CHECK_NUMBERS),
    logger: workerLogger,
  };
}

/**
 * Logger untuk `wrangler tail`.
 *
 * Hanya peristiwa yang tadinya senyap yang sampai ke sini — indikator ketik
 * yang gagal dan percobaan ulang setelah gateway menolak sementara. Jalur
 * sukses tidak dicatat supaya log tidak tenggelam oleh lalu lintas normal.
 */
const workerLogger = {
  log(level: string, message: string, context?: Record<string, unknown>) {
    if (level === "debug") return;
    const line = `[whatsapp] ${message}`;
    if (level === "warning" || level === "error") {
      console.warn(line, context ?? {});
      return;
    }
    console.log(line, context ?? {});
  },
};

/**
 * Bangun `Client` sikuwa untuk satu request.
 *
 * @param httpClient transport pengganti — dipakai unit test supaya tidak ada
 *                   satu pun request jaringan sungguhan.
 */
export function createWhatsappClient(
  env: WhatsappBindings,
  httpClient?: FetchLike,
): Client {
  return new Client(buildConfigOptions(env), httpClient ?? null);
}
