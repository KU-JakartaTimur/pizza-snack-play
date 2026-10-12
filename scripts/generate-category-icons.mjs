/**
 * Memanggang ikon kategori dari `scripts/category-icons.html` menjadi PNG, lalu
 * menulis SQL yang mengisi kolom `categories.image`.
 *
 * Latar masalah: kolom `categories.image` sudah ada dan halaman Kategori sudah
 * bisa mengunggah gambar, tetapi kedelapan kategori bawaan masih kosong —
 * daftarnya hanya menampilkan kotak warna. Skrip ini yang mengisinya.
 *
 * Kenapa lewat browser, bukan rasterizer Python: bentuk ikonnya sudah ada
 * sebagai SVG yang bisa dibaca manusia (satu ikon bisa diperbaiki tanpa
 * menyentuh kode ini), dan browser adalah perasterisasi SVG yang pasti ada di
 * mesin mana pun proyek ini dijalankan. Tidak ada dependensi baru.
 *
 * Ukuran akhir **256x256**: thumbnail kategori hanya 32px dan pratinjau
 * formulir 56px, jadi 256px sudah lega untuk layar beretina. Hasilnya ~26 KB
 * base64 per gambar — jauh di bawah batas 1000 KB di `validateCategoryImage`,
 * dan tetap ringan untuk kolom teks D1.
 *
 * Jalankan: bun run scripts/generate-category-icons.mjs
 *
 * Menulis:
 *   outputs/icons/<slug>.png             256x256, yang ditanam ke database
 *   outputs/icons/preview-512/<slug>.png  versi besar, hanya untuk diperiksa
 *   scripts/sql/kategori-icons.sql
 *   scripts/sql/kategori-icons-rollback.sql
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tmpdir } from "node:os";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const HTML = join(HERE, "category-icons.html");
const OUT_DIR = join(ROOT, "outputs", "icons");
const PREVIEW_DIR = join(OUT_DIR, "preview-512");
const SQL_DIR = join(ROOT, "scripts", "sql");
const SQL_FILE = join(SQL_DIR, "kategori-icons.sql");
const ROLLBACK_FILE = join(SQL_DIR, "kategori-icons-rollback.sql");

const PORT = 9333;
const FINAL_SIZE = 256;
const DESIGN_SIZE = 512;

/**
 * Urutan ini menentukan urutan blok di berkas SQL, bukan urutan di database.
 * Slug harus sama persis dengan `categories.slug` — perintah UPDATE-nya
 * mencocokkan lewat kolom itu.
 */
const ICONS = [
  { slug: "gorengan", label: "Gorengan" },
  { slug: "kukusan", label: "Kukusan" },
  { slug: "rebusan", label: "Rebusan" },
  { slug: "panggangan", label: "Panggangan" },
  { slug: "buah-segar", label: "Buah Segar" },
  { slug: "roti-bakery", label: "Roti/Bakery" },
  { slug: "kue-tradisional", label: "Kue Tradisional" },
  { slug: "lainnya", label: "Lainnya" },
];

const EDGE_CANDIDATES = [
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/microsoft-edge",
  "/usr/bin/google-chrome",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Klien CDP minimal: satu soket, id berurutan, sadar `sessionId`. */
class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
    ws.addEventListener("message", (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id !== undefined) {
        const entry = this.pending.get(msg.id);
        if (!entry) return;
        this.pending.delete(msg.id);
        if (msg.error) entry.reject(new Error(JSON.stringify(msg.error)));
        else entry.resolve(msg.result);
        return;
      }
      for (const fn of this.listeners.get(msg.method) ?? []) fn(msg.params);
    });
  }

  send(method, params = {}, sessionId) {
    const id = this.nextId++;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    this.ws.send(JSON.stringify(payload));
    return new Promise((resolve, reject) =>
      this.pending.set(id, { resolve, reject }),
    );
  }

  once(method) {
    return new Promise((resolve) => {
      const fn = (params) => {
        this.listeners.get(method).delete(fn);
        resolve(params);
      };
      if (!this.listeners.has(method)) this.listeners.set(method, new Set());
      this.listeners.get(method).add(fn);
    });
  }
}

async function waitForDebugger(deadlineMs) {
  const until = Date.now() + deadlineMs;
  while (Date.now() < until) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (res.ok) return await res.json();
    } catch {
      /* browser belum siap menerima koneksi */
    }
    await sleep(300);
  }
  throw new Error("Endpoint DevTools tidak pernah siap");
}

async function launch(edgePath, extraFlags) {
  const profile = join(tmpdir(), `wb-cat-icons-${Date.now()}`);
  mkdirSync(profile, { recursive: true });
  const child = spawn(
    edgePath,
    [
      ...extraFlags,
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${profile}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-extensions",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      "--window-size=600,600",
      "about:blank",
    ],
    { stdio: "ignore", windowsHide: true },
  );
  try {
    return { child, profile, version: await waitForDebugger(15_000) };
  } catch (error) {
    child.kill();
    throw error;
  }
}

/** Potong satu elemen `.icon` dari halaman dan kembalikan byte PNG-nya. */
async function rasterize(cdp, session, id, size) {
  const box = await cdp.send(
    "Runtime.evaluate",
    {
      returnByValue: true,
      expression: `(() => {
        const el = document.getElementById(${JSON.stringify(id)});
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, w: r.width, h: r.height };
      })()`,
    },
    session,
  );
  const rect = box.result.value;
  if (!rect || rect.w === 0) throw new Error(`Elemen #${id} tidak terukur`);

  // `scale` pada clip yang memperkecil: bentuknya tetap digambar pada 512 lalu
  // diturunkan browser, jadi tidak ada detail yang hilang sebelum dirasterkan.
  const shot = await cdp.send(
    "Page.captureScreenshot",
    {
      format: "png",
      captureBeyondViewport: true,
      clip: {
        x: rect.x,
        y: rect.y,
        width: rect.w,
        height: rect.h,
        scale: size / DESIGN_SIZE,
      },
    },
    session,
  );
  return Buffer.from(shot.data, "base64");
}

function sqlFor(entries) {
  const biggest = Math.max(...entries.map((e) => e.base64.length)) / 1024;
  const lines = [
    "-- Ikon kategori Pizza Snack Play",
    "-- Dibuat oleh scripts/generate-category-icons.mjs — jangan disunting tangan.",
    "--",
    `-- Mengisi kolom \`categories.image\` dengan data URI PNG ${FINAL_SIZE}x${FINAL_SIZE}`,
    "-- hasil memanggang scripts/category-icons.html.",
    "--",
    "-- Dicocokkan lewat `slug`, bukan `id`: slug punya indeks unik",
    "-- (`idx_categories_slug`), sedangkan nomor id bisa berbeda antara database",
    "-- lokal dan produksi. Karena itu perintah ini idempoten — aman diulang.",
    "--",
    "-- Jalankan:",
    "--   bunx wrangler d1 execute pizza-snack-play --local  --file=./scripts/sql/kategori-icons.sql",
    "--   bunx wrangler d1 execute pizza-snack-play --remote --file=./scripts/sql/kategori-icons.sql",
    "--",
    `-- Ukuran terbesar di bawah: ${biggest.toFixed(1)} KB base64 (batas aplikasi 1000 KB).`,
    "",
  ];

  for (const entry of entries) {
    const dash = "─".repeat(Math.max(4, 56 - entry.label.length));
    lines.push(
      `-- ── ${entry.label} ${dash}`,
      `UPDATE \`categories\` SET \`image\` = 'data:image/png;base64,${entry.base64}' WHERE \`slug\` = '${entry.slug}';`,
      "",
    );
  }

  return lines.join("\n");
}

function rollbackFor(entries) {
  const slugs = entries.map((e) => `'${e.slug}'`).join(", ");
  return [
    "-- ROLLBACK ikon kategori Pizza Snack Play",
    "-- Dibuat oleh scripts/generate-category-icons.mjs.",
    "--",
    "-- Mengosongkan kembali kolom `categories.image`.",
    "--",
    "-- Ini sah sebagai rollback **karena sebelum patch dijalankan seluruh baris",
    "-- masih NULL**. Begitu ada kategori yang gambarnya diunggah lewat halaman",
    "-- Kategori, perintah ini akan ikut menghapus gambar itu — persempit daftar",
    "-- slug-nya lebih dulu bila itu yang diinginkan.",
    "--",
    "-- Jalankan:",
    "--   bunx wrangler d1 execute pizza-snack-play --remote --file=./scripts/sql/kategori-icons-rollback.sql",
    "",
    `UPDATE \`categories\` SET \`image\` = NULL WHERE \`slug\` IN (${slugs});`,
    "",
  ].join("\n");
}

async function main() {
  const edgePath = EDGE_CANDIDATES.find((p) => existsSync(p));
  if (!edgePath) throw new Error("Tidak menemukan browser (Edge/Chrome)");
  if (!existsSync(HTML)) throw new Error(`Sumber ikon hilang: ${HTML}`);

  let launched;
  try {
    launched = await launch(edgePath, ["--headless=new"]);
  } catch {
    // Sebagian versi Edge hanya mengenal flag lama.
    launched = await launch(edgePath, ["--headless"]);
  }
  const { child, profile, version } = launched;

  try {
    const ws = new WebSocket(version.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener("open", resolve, { once: true });
      ws.addEventListener("error", reject, { once: true });
    });
    const cdp = new Cdp(ws);

    // Tanpa width/height: CDP hanya mengizinkan ukuran saat `newWindow`.
    const { targetId } = await cdp.send("Target.createTarget", {
      url: pathToFileURL(HTML).href,
    });
    const { sessionId } = await cdp.send("Target.attachToTarget", {
      targetId,
      flatten: true,
    });

    await cdp.send("Page.enable", {}, sessionId);
    const loaded = cdp.once("Page.loadEventFired");
    await cdp.send("Page.reload", {}, sessionId).catch(() => {});
    await Promise.race([loaded, sleep(3000)]);
    await sleep(400);

    mkdirSync(OUT_DIR, { recursive: true });
    mkdirSync(PREVIEW_DIR, { recursive: true });
    mkdirSync(SQL_DIR, { recursive: true });

    const entries = [];
    for (const { slug, label } of ICONS) {
      const id = `cat-${slug}`;
      writeFileSync(
        join(PREVIEW_DIR, `${slug}.png`),
        await rasterize(cdp, sessionId, id, DESIGN_SIZE),
      );
      const final = await rasterize(cdp, sessionId, id, FINAL_SIZE);
      writeFileSync(join(OUT_DIR, `${slug}.png`), final);
      entries.push({
        slug,
        label,
        base64: final.toString("base64"),
        bytes: final.length,
      });
    }

    writeFileSync(SQL_FILE, sqlFor(entries), "utf8");
    writeFileSync(ROLLBACK_FILE, rollbackFor(entries), "utf8");
    ws.close();

    const width = Math.max(...entries.map((e) => e.label.length));
    console.log(
      `${"kategori".padEnd(width)}  ${"png".padStart(7)}  ${"base64".padStart(8)}`,
    );
    for (const e of entries) {
      console.log(
        `${e.label.padEnd(width)}  ${String(e.bytes).padStart(7)}  ${String(
          e.base64.length,
        ).padStart(8)}`,
      );
    }
    const total = entries.reduce((sum, e) => sum + e.base64.length, 0);
    console.log(
      `\n${entries.length} ikon ${FINAL_SIZE}x${FINAL_SIZE} · total base64 ${(
        total / 1024
      ).toFixed(1)} KB`,
    );
    console.log(`SQL   : ${SQL_FILE}`);
    console.log(`balik : ${ROLLBACK_FILE}`);
  } finally {
    child.kill();
    await sleep(200);
    try {
      rmSync(profile, { recursive: true, force: true });
    } catch {
      /* profil sementara boleh tertinggal */
    }
  }
}

main().catch((error) => {
  console.error("GAGAL:", error.message);
  process.exitCode = 1;
});
