/**
 * Generate VAPID keys untuk Push Notification PWA.
 *
 * Jalankan: bun run scripts/generate-vapid.mjs
 *
 * Skrip ini hanya membungkus CLI bawaan `@pushforge/builder` supaya outputnya
 * langsung disertai perintah `wrangler secret put` yang perlu dijalankan —
 * pasangan kuncinya sendiri dibuat oleh library, bukan dihitung ulang di sini
 * (kriptografi buatan sendiri adalah cara termudah membuat kunci yang salah).
 *
 * Yang dihasilkan:
 *   VAPID_PUBLIC_KEY  → base64url, dipakai browser saat subscribe
 *   VAPID_PRIVATE_KEY → JSON JWK satu baris, dipakai server saat mengirim
 *   VAPID_SUBJECT     → kontak admin, mis. mailto:admin@sekolah.id
 */
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const CLI = join(
  HERE,
  "..",
  "node_modules",
  "@pushforge",
  "builder",
  "dist",
  "lib",
  "commandLine",
  "keys.js",
);

let output;
try {
  output = execFileSync(process.execPath, [CLI, "vapid"], {
    encoding: "utf8",
  });
} catch (error) {
  console.error(
    "Gagal menjalankan generator VAPID. Pastikan dependensi sudah terpasang:\n" +
      "  bun install\n",
  );
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

// Ambil nilai dari keluaran CLI, bukan mencetak ulang seluruh bingkainya.
const publicKey = output.match(/Public Key:\s*\n\s*(\S+)/)?.[1];
const privateKey = output.match(/Private Key \(JWK\):\s*\n\s*(\{.*\})/)?.[1];

if (!publicKey || !privateKey) {
  console.error("Bentuk keluaran generator tidak dikenali:\n");
  console.error(output);
  process.exit(1);
}

console.log("\n=== VAPID keys untuk Pizza Snack Play ===\n");
console.log("VAPID_PUBLIC_KEY");
console.log(publicKey);
console.log("\nVAPID_PRIVATE_KEY (JSON JWK, satu baris — salin apa adanya)");
console.log(privateKey);
console.log("\nVAPID_SUBJECT");
console.log("mailto:admin@sekolah.id\n");

console.log("--- Simpan sebagai Worker Secret (production) ---");
console.log("bunx wrangler secret put VAPID_PUBLIC_KEY");
console.log("bunx wrangler secret put VAPID_PRIVATE_KEY");
console.log("bunx wrangler secret put VAPID_SUBJECT\n");

console.log("--- Untuk dev lokal ---");
console.log("Salin ketiganya ke .dev.vars (berkas ini tidak di-commit).\n");
