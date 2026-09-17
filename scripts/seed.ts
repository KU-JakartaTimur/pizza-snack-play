/**
 * Seed generator untuk Pizza Snack Play.
 *
 * Membaca `data/jadwal_piket_snack.txt`, mem-parse jadwal piket snack,
 * lalu menghasilkan `drizzle/seed.sql` yang siap dieksekusi ke Cloudflare D1:
 *
 *   bun run scripts/seed.ts
 *   bunx wrangler d1 execute pizza-snack-play --local --file=./drizzle/seed.sql
 *
 * Script ini dijalankan di luar Worker (Bun), jadi boleh memakai API Node.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { hashPassword } from "../src/api/utils/password";

const ROOT = join(import.meta.dir, "..");
const SOURCE_FILE = join(ROOT, "data", "jadwal_piket_snack.txt");
const OUTPUT_FILE = join(ROOT, "drizzle", "seed.sql");

const DEFAULT_PASSWORD = "snack123";

// ─────────────────────────────────────────────────────────────
// Konstanta tanggal & nama
// ─────────────────────────────────────────────────────────────

const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

/** getUTCDay() → 0=Minggu .. 6=Sabtu */
const DAY_NAMES = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

const CATEGORIES = [
  { name: "Gorengan", slug: "gorengan", color: "#FF8C00" },
  { name: "Kukusan", slug: "kukusan", color: "#4169E1" },
  { name: "Rebusan", slug: "rebusan", color: "#20B2AA" },
  { name: "Panggangan", slug: "panggangan", color: "#CD853F" },
  { name: "Buah Segar", slug: "buah-segar", color: "#32CD32" },
  { name: "Roti/Bakery", slug: "roti-bakery", color: "#DAA520" },
  { name: "Kue Tradisional", slug: "kue-tradisional", color: "#FF69B4" },
  { name: "Lainnya", slug: "lainnya", color: "#A9A9A9" },
];

/** Kata kunci → slug kategori, dievaluasi berurutan (paling spesifik dulu). */
const CATEGORY_KEYWORDS: Array<[RegExp, string]> = [
  [/roti|sandwich|bolen|gabin|kue sus|kue lumpur|donat/i, "roti-bakery"],
  [/nagasari|klepon|lemet|sawut|kue|serabi|puding/i, "kue-tradisional"],
  [/panggang|bakar/i, "panggangan"],
  [/rebus|kukus|edamame|telur puyuh|telor rebus|jagung rebus/i, "rebusan"],
  [/risol|bakwan|misro|onde|pastel|kroket|sosis solo|tahu|ubi|pisang goreng/i, "gorengan"],
  [/bihun|urap|kroket/i, "lainnya"],
];

/**
 * Anak per orang tua: `[username orang tua, nama anak, kelas]`.
 * Satu orang tua boleh punya lebih dari satu anak.
 */
const STUDENTS: Array<[string, string, string]> = [
  ["sari", "Aisyah Sari", "1A"],
  ["budi", "Bagas Budi", "1A"],
  ["dewi", "Citra Dewi", "1B"],
  ["dewi", "Raka Dewi", "2A"],
];

/**
 * Kelas yang dikenal seed. Jadwal digandakan ke setiap kelas ini karena
 * `schedules` kini menyimpan satu baris per (tanggal × kelas).
 */
const CLASSES = [...new Set(STUDENTS.map(([, , className]) => className))].sort();

// ─────────────────────────────────────────────────────────────
// Tipe hasil parsing
// ─────────────────────────────────────────────────────────────

interface ParsedDay {
  dayName: string;
  menuText: string;
}

interface ParsedWeek {
  startDate: string;
  endDate: string;
  month: number;
  year: number;
  days: ParsedDay[];
}

// ─────────────────────────────────────────────────────────────
// Util
// ─────────────────────────────────────────────────────────────

function sqlString(value: string | null | undefined): string {
  if (value === null || value === undefined) return "NULL";
  return `'${value.replace(/'/g, "''")}'`;
}

function toIsoDate(year: number, month: number, day: number): string {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

function utcDayIndex(isoDate: string): number {
  return new Date(`${isoDate}T00:00:00Z`).getUTCDay();
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function monthIndexFromName(name: string): number {
  const idx = MONTHS.findIndex(
    (m) => m.toLowerCase() === name.toLowerCase(),
  );
  return idx + 1; // 1-based
}

function slugifyCategory(itemName: string, itemType: string): string {
  if (itemType === "fruit") return "buah-segar";
  for (const [pattern, slug] of CATEGORY_KEYWORDS) {
    if (pattern.test(itemName)) return slug;
  }
  return "lainnya";
}

// ─────────────────────────────────────────────────────────────
// Parser
// ─────────────────────────────────────────────────────────────

function parseScheduleFile(content: string): ParsedWeek[] {
  const lines = content.split(/\r?\n/);
  const weeks: ParsedWeek[] = [];

  let currentMonth = 0;
  let currentYear = 0;
  let currentWeek: ParsedWeek | null = null;

  const flushWeek = () => {
    if (currentWeek && currentWeek.days.length > 0) {
      weeks.push(currentWeek);
    }
    currentWeek = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Header blok bulan: "JADWAL Piket (SNACK) September 2026, ..."
    const headerMatch = line.match(
      new RegExp(`(${MONTHS.join("|")})\\s+(\\d{4})`, "i"),
    );
    if (/^JADWAL/i.test(line) && headerMatch) {
      flushWeek();
      currentMonth = monthIndexFromName(headerMatch[1]);
      currentYear = Number.parseInt(headerMatch[2], 10);
      continue;
    }

    // Rentang minggu: "1 - 4 September 2026"
    const rangeMatch = line.match(
      new RegExp(`^(\\d{1,2})\\s*-\\s*(\\d{1,2})\\s+(${MONTHS.join("|")})\\s+(\\d{4})$`, "i"),
    );
    if (rangeMatch) {
      flushWeek();
      const month = monthIndexFromName(rangeMatch[3]);
      const year = Number.parseInt(rangeMatch[4], 10);
      currentWeek = {
        startDate: toIsoDate(year, month, Number.parseInt(rangeMatch[1], 10)),
        endDate: toIsoDate(year, month, Number.parseInt(rangeMatch[2], 10)),
        month,
        year,
        days: [],
      };
      continue;
    }

    // Satu hari: "31 Agustus 2026"
    const singleMatch = line.match(
      new RegExp(`^(\\d{1,2})\\s+(${MONTHS.join("|")})\\s+(\\d{4})$`, "i"),
    );
    if (singleMatch) {
      flushWeek();
      const month = monthIndexFromName(singleMatch[2]);
      const year = Number.parseInt(singleMatch[3], 10);
      const date = toIsoDate(year, month, Number.parseInt(singleMatch[1], 10));
      currentWeek = {
        startDate: date,
        endDate: date,
        month,
        year,
        days: [],
      };
      continue;
    }

    // Baris hari: "Selasa   : Roti isi coklat + jeruk (outing)"
    const dayMatch = line.match(
      new RegExp(`^(${DAY_NAMES.join("|")})\\s*:\\s*(.+)$`, "i"),
    );
    if (dayMatch && currentWeek) {
      currentWeek.days.push({
        dayName: dayMatch[1],
        menuText: dayMatch[2].trim(),
      });
      continue;
    }

    // Fallback: bila blok bulan belum terdeteksi tapi ada baris hari
    if (dayMatch && !currentWeek && currentMonth && currentYear) {
      currentWeek = {
        startDate: "",
        endDate: "",
        month: currentMonth,
        year: currentYear,
        days: [{ dayName: dayMatch[1], menuText: dayMatch[2].trim() }],
      };
    }
  }

  flushWeek();
  return weeks;
}

interface ParsedMenu {
  main: string;
  fruit: string | null;
  notes: string | null;
}

function parseMenuText(text: string): ParsedMenu | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (/^libur/i.test(trimmed)) return null;

  let body = trimmed;
  let notes: string | null = null;

  // Ambil keterangan dalam tanda kurung, mis. "(outing)"
  const noteMatch = body.match(/\(([^)]+)\)/);
  if (noteMatch) {
    notes = noteMatch[1].trim();
    body = body.replace(noteMatch[0], "").trim();
  }

  const parts = body
    .split("+")
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length === 0) return null;

  return {
    main: parts[0],
    fruit: parts.length > 1 ? parts.slice(1).join(" + ") : null,
    notes,
  };
}

// ─────────────────────────────────────────────────────────────
// Bangun SQL
// ─────────────────────────────────────────────────────────────

async function main() {
  const content = readFileSync(SOURCE_FILE, "utf8");
  const weeks = parseScheduleFile(content);

  if (weeks.length === 0) {
    throw new Error("Tidak ada jadwal yang berhasil di-parse.");
  }

  const statements: string[] = [];
  const categoryIdBySlug = new Map<string, number>();

  statements.push("-- Seed Pizza Snack Play (dibuat otomatis oleh scripts/seed.ts)");
  statements.push("DELETE FROM schedules;");
  statements.push("DELETE FROM menu_items;");
  statements.push("DELETE FROM menu_categories;");
  statements.push("DELETE FROM menus;");
  statements.push("DELETE FROM weeks;");
  statements.push("DELETE FROM students;");
  statements.push("DELETE FROM parents;");
  statements.push("DELETE FROM users;");
  statements.push("DELETE FROM categories;");
  statements.push("DELETE FROM holidays;");
  statements.push("DELETE FROM settings;");

  // ── categories
  const categoryValues = CATEGORIES.map((cat, index) => {
    const id = index + 1;
    categoryIdBySlug.set(cat.slug, id);
    return `(${id}, ${sqlString(cat.name)}, ${sqlString(cat.slug)}, ${sqlString(cat.color)})`;
  });
  statements.push(
    `INSERT INTO categories (id, name, slug, color) VALUES\n  ${categoryValues.join(",\n  ")};`,
  );

  // ── menus + menu_items
  const menuIdByKey = new Map<string, number>();
  const menuRows: string[] = [];
  const menuItemRows: string[] = [];

  const menuKey = (m: ParsedMenu) =>
    `${m.main.toLowerCase()}|${(m.fruit ?? "").toLowerCase()}`;

  let nextMenuId = 1;
  let nextMenuItemId = 1;
  const scheduleRows: string[] = [];
  const weekRows: string[] = [];

  let nextWeekId = 1;
  const weekNumberByMonth = new Map<string, number>();
  let holidayCount = 0;

  for (const week of weeks) {
    const monthKey = `${week.year}-${week.month}`;
    const weekNumber = (weekNumberByMonth.get(monthKey) ?? 0) + 1;
    weekNumberByMonth.set(monthKey, weekNumber);

    const weekId = nextWeekId++;
    const monthName = MONTHS[week.month - 1];
    const label = `Minggu ${weekNumber} ${monthName} ${week.year}`;

    weekRows.push(
      `(${weekId}, ${sqlString(week.startDate)}, ${sqlString(week.endDate)}, ${week.month}, ${week.year}, ${sqlString(label)})`,
    );

    // Petakan nama hari → menu
    const dayMap = new Map<string, string>();
    for (const day of week.days) {
      dayMap.set(day.dayName.toLowerCase(), day.menuText);
    }

    // Iterasi setiap tanggal dalam rentang, cocokkan dengan nama hari
    let cursor = week.startDate;
    let steps = 0;
    while (cursor <= week.endDate && steps < 14) {
      const dayIdx = utcDayIndex(cursor);
      const dayName = DAY_NAMES[dayIdx];
      const menuText = dayMap.get(dayName.toLowerCase());

      if (menuText) {
        const parsed = parseMenuText(menuText);

        if (!parsed) {
          // Libur
          holidayCount++;
          // Satu baris per kelas — jadwal kini disimpan per (tanggal × kelas).
          for (const className of CLASSES) {
            scheduleRows.push(
              `(${weekId}, ${sqlString(cursor)}, ${dayIdx}, ${sqlString(className)}, NULL, 1, ${sqlString(menuText)})`,
            );
          }
        } else {
          const key = menuKey(parsed);
          let menuId = menuIdByKey.get(key);

          if (menuId === undefined) {
            menuId = nextMenuId++;
            menuIdByKey.set(key, menuId);

            const displayName = parsed.fruit
              ? `${parsed.main} + ${parsed.fruit}`
              : parsed.main;

            menuRows.push(
              `(${menuId}, ${sqlString(displayName)}, ${sqlString(parsed.notes)})`,
            );

            const mainSlug = slugifyCategory(parsed.main, "main");
            menuItemRows.push(
              `(${nextMenuItemId++}, ${menuId}, ${sqlString(parsed.main)}, 'main', ${categoryIdBySlug.get(mainSlug) ?? categoryIdBySlug.get("lainnya")})`,
            );

            if (parsed.fruit) {
              const fruitSlug = slugifyCategory(parsed.fruit, "fruit");
              menuItemRows.push(
                `(${nextMenuItemId++}, ${menuId}, ${sqlString(parsed.fruit)}, 'fruit', ${categoryIdBySlug.get(fruitSlug) ?? categoryIdBySlug.get("buah-segar")})`,
              );
            }
          }

          for (const className of CLASSES) {
            scheduleRows.push(
              `(${weekId}, ${sqlString(cursor)}, ${dayIdx}, ${sqlString(className)}, ${menuId}, 0, ${sqlString(parsed.notes)})`,
            );
          }
        }
      }

      cursor = addDays(cursor, 1);
      steps++;
    }
  }

  statements.push(
    `INSERT INTO weeks (id, week_start_date, week_end_date, month, year, label) VALUES\n  ${weekRows.join(",\n  ")};`,
  );

  if (menuRows.length > 0) {
    statements.push(
      `INSERT INTO menus (id, name, description) VALUES\n  ${menuRows.join(",\n  ")};`,
    );
  }

  if (menuItemRows.length > 0) {
    statements.push(
      `INSERT INTO menu_items (id, menu_id, name, item_type, category_id) VALUES\n  ${menuItemRows.join(",\n  ")};`,
    );
  }

  statements.push(
    `INSERT INTO schedules (week_id, schedule_date, day_of_week, class_name, menu_id, is_holiday, notes) VALUES\n  ${scheduleRows.join(",\n  ")};`,
  );

  // ── holidays
  statements.push(
    `INSERT INTO holidays (date, name, description) VALUES\n  ('2026-08-17', 'Hari Kemerdekaan RI', 'Libur nasional');`,
  );

  // ── settings
  statements.push(
    `INSERT INTO settings (key, value) VALUES\n  ('school_name', 'SD Contoh Jakarta'),\n  ('academic_year', '2026/2027'),\n  ('active_month', '2026-09');`,
  );

  // ── users + parents
  const adminHash = await hashPassword(DEFAULT_PASSWORD);
  const parentHash = await hashPassword(DEFAULT_PASSWORD);

  // `budi` sengaja dijadikan korlas kelas 1A sebagai contoh peran baru:
  // ia tetap orang tua murid, tetapi boleh mengubah jadwal kelas 1A.
  statements.push(
    `INSERT INTO users (id, username, password_hash, full_name, role, class_name, is_active) VALUES\n  (1, 'admin', ${sqlString(adminHash)}, 'Bu Guru Sari', 'admin', NULL, 1),\n  (2, 'sari', ${sqlString(parentHash)}, 'Ibu Sari', 'parent', NULL, 1),\n  (3, 'budi', ${sqlString(parentHash)}, 'Pak Budi', 'korlas', '1A', 1),\n  (4, 'dewi', ${sqlString(parentHash)}, 'Ibu Dewi', 'parent', NULL, 1);`,
  );

  statements.push(
    `INSERT INTO parents (user_id, parent_name, relationship, phone) VALUES\n  (2, 'Sari Wulandari', 'ibu', '081234567890'),\n  (3, 'Budi Santoso', 'ayah', '081234567891'),\n  (4, 'Dewi Lestari', 'ibu', '081234567892');`,
  );

  // ── students — satu orang tua boleh punya lebih dari satu anak.
  // `parent_id` diambil lewat subquery agar tidak bergantung pada nilai
  // AUTOINCREMENT yang bisa berubah setelah DELETE.
  const parentIdSubquery = (username: string) =>
    `(SELECT p.id FROM parents p JOIN users u ON u.id = p.user_id WHERE u.username = '${username}')`;

  const studentRows = STUDENTS.map(
    ([username, name, className]) =>
      `  (${parentIdSubquery(username)}, '${name}', '${className}', 1)`,
  ).join(",\n");

  statements.push(
    `INSERT INTO students (parent_id, name, class_name, is_active) VALUES\n${studentRows};`,
  );

  writeFileSync(OUTPUT_FILE, statements.join("\n\n") + "\n", "utf8");

  // ── ringkasan
  console.log("Seed berhasil dibuat.");
  console.log(`  File         : ${OUTPUT_FILE}`);
  console.log(`  Minggu       : ${weekRows.length}`);
  console.log(`  Menu unik    : ${menuRows.length}`);
  console.log(`  Menu item    : ${menuItemRows.length}`);
  console.log(`  Kelas        : ${CLASSES.join(", ")}`);
  console.log(
    `  Jadwal       : ${scheduleRows.length} baris (${holidayCount} hari libur × ${CLASSES.length} kelas)`,
  );
  console.log("  Users        : 4 (1 admin, 1 korlas 1A, 2 orang tua)");
  console.log(`  Password     : ${DEFAULT_PASSWORD}`);
}

await main();
