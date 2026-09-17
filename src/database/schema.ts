import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/**
 * Skema database Pizza Snack Play — Cloudflare D1 (SQLite).
 *
 * Catatan timezone: Worker berjalan pada UTC, sehingga `datetime('now')`
 * menghasilkan timestamp UTC. Konversi ke WIB (UTC+7) dilakukan di aplikasi.
 */

const now = sql`(datetime('now'))`;

// ─────────────────────────────────────────────────────────────
// Kategori menu (gorengan, kukusan, buah segar, roti, dll.)
// ─────────────────────────────────────────────────────────────
export const categories = sqliteTable(
  "categories",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    color: text("color").default("#CCCCCC"),
    createdAt: text("created_at").notNull().default(now),
    updatedAt: text("updated_at").notNull().default(now),
  },
  (table) => [
    uniqueIndex("idx_categories_name").on(table.name),
    uniqueIndex("idx_categories_slug").on(table.slug),
  ],
);

// ─────────────────────────────────────────────────────────────
// Menu snack — kombinasi makanan utama + buah pendamping.
// Dapat dipakai ulang pada tanggal berbeda (rotasi menu).
// ─────────────────────────────────────────────────────────────
export const menus = sqliteTable(
  "menus",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    description: text("description"),
    isActive: integer("is_active").notNull().default(1),
    isArchived: integer("is_archived").notNull().default(0),
    createdAt: text("created_at").notNull().default(now),
    updatedAt: text("updated_at").notNull().default(now),
  },
  (table) => [
    index("idx_menus_name").on(table.name),
    index("idx_menus_active").on(table.isActive),
  ],
);

// ─────────────────────────────────────────────────────────────
// Komponen individual dalam satu menu.
// item_type: 'main' | 'fruit' | 'drink' | 'other'
// ─────────────────────────────────────────────────────────────
export const menuItems = sqliteTable(
  "menu_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    menuId: integer("menu_id")
      .notNull()
      .references(() => menus.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    itemType: text("item_type").notNull().default("main"),
    categoryId: integer("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    createdAt: text("created_at").notNull().default(now),
    updatedAt: text("updated_at").notNull().default(now),
  },
  (table) => [
    index("idx_menu_items_menu_id").on(table.menuId),
    index("idx_menu_items_name").on(table.name),
    index("idx_menu_items_type").on(table.itemType),
  ],
);

// ─────────────────────────────────────────────────────────────
// Relasi many-to-many menu ↔ kategori
// ─────────────────────────────────────────────────────────────
export const menuCategories = sqliteTable(
  "menu_categories",
  {
    menuId: integer("menu_id")
      .notNull()
      .references(() => menus.id, { onDelete: "cascade" }),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.menuId, table.categoryId] }),
  ],
);

// ─────────────────────────────────────────────────────────────
// Periode mingguan (Senin–Jumat)
// ─────────────────────────────────────────────────────────────
export const weeks = sqliteTable(
  "weeks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    weekStartDate: text("week_start_date").notNull(),
    weekEndDate: text("week_end_date").notNull(),
    month: integer("month").notNull(),
    year: integer("year").notNull(),
    label: text("label"),
    createdAt: text("created_at").notNull().default(now),
  },
  (table) => [
    uniqueIndex("idx_weeks_range").on(table.weekStartDate, table.weekEndDate),
    index("idx_weeks_month_year").on(table.month, table.year),
  ],
);

// ─────────────────────────────────────────────────────────────
// Jadwal harian — tabel inti.
// day_of_week: 1=Senin .. 5=Jumat
// menu_id NULL + is_holiday=1 berarti libur.
// ─────────────────────────────────────────────────────────────
export const schedules = sqliteTable(
  "schedules",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    weekId: integer("week_id").references(() => weeks.id, {
      onDelete: "set null",
    }),
    scheduleDate: text("schedule_date").notNull(),
    dayOfWeek: integer("day_of_week").notNull(),
    menuId: integer("menu_id").references(() => menus.id, {
      onDelete: "set null",
    }),
    isHoliday: integer("is_holiday").notNull().default(0),
    notes: text("notes"),
    createdAt: text("created_at").notNull().default(now),
    updatedAt: text("updated_at").notNull().default(now),
  },
  (table) => [
    uniqueIndex("idx_schedules_date").on(table.scheduleDate),
    index("idx_schedules_week").on(table.weekId),
    index("idx_schedules_menu").on(table.menuId),
  ],
);

// ─────────────────────────────────────────────────────────────
// Hari libur nasional / sekolah
// ─────────────────────────────────────────────────────────────
export const holidays = sqliteTable(
  "holidays",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    date: text("date").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: text("created_at").notNull().default(now),
  },
  (table) => [uniqueIndex("idx_holidays_date").on(table.date)],
);

// ─────────────────────────────────────────────────────────────
// Akun login — admin & orang tua.
// role: 'admin' | 'parent'
// ─────────────────────────────────────────────────────────────
export const users = sqliteTable(
  "users",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    username: text("username").notNull(),
    passwordHash: text("password_hash").notNull(),
    fullName: text("full_name"),
    email: text("email"),
    phone: text("phone"),
    role: text("role").notNull().default("parent"),
    isActive: integer("is_active").notNull().default(1),
    lastLoginAt: text("last_login_at"),
    createdAt: text("created_at").notNull().default(now),
    updatedAt: text("updated_at").notNull().default(now),
  },
  (table) => [
    uniqueIndex("idx_users_username").on(table.username),
    index("idx_users_role").on(table.role),
    index("idx_users_active").on(table.isActive),
  ],
);

// ─────────────────────────────────────────────────────────────
// Profil orang tua — terhubung ke akun users.
// relationship: 'ibu' | 'ayah' | 'wali'
//
// Satu orang tua dapat memiliki lebih dari satu anak; daftar anak
// disimpan pada tabel `students` (relasi satu-ke-banyak).
// ─────────────────────────────────────────────────────────────
export const parents = sqliteTable(
  "parents",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    parentName: text("parent_name").notNull(),
    relationship: text("relationship").notNull().default("ibu"),
    phone: text("phone"),
    address: text("address"),
    isActive: integer("is_active").notNull().default(1),
    createdAt: text("created_at").notNull().default(now),
    updatedAt: text("updated_at").notNull().default(now),
  },
  (table) => [
    index("idx_parents_user_id").on(table.userId),
    index("idx_parents_active").on(table.isActive),
  ],
);

// ─────────────────────────────────────────────────────────────
// Anak dari seorang orang tua (satu orang tua → banyak anak).
// ─────────────────────────────────────────────────────────────
export const students = sqliteTable(
  "students",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    parentId: integer("parent_id")
      .notNull()
      .references(() => parents.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    className: text("class_name"),
    isActive: integer("is_active").notNull().default(1),
    createdAt: text("created_at").notNull().default(now),
    updatedAt: text("updated_at").notNull().default(now),
  },
  (table) => [
    index("idx_students_parent_id").on(table.parentId),
    index("idx_students_class").on(table.className),
  ],
);

// ─────────────────────────────────────────────────────────────
// Konfigurasi global (nama sekolah, tahun ajaran aktif, dll.)
// ─────────────────────────────────────────────────────────────
export const settings = sqliteTable(
  "settings",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    key: text("key").notNull(),
    value: text("value"),
    updatedAt: text("updated_at").notNull().default(now),
  },
  (table) => [uniqueIndex("idx_settings_key").on(table.key)],
);

// ─────────────────────────────────────────────────────────────
// Audit trail impor data dari file teks manual.
// status: 'success' | 'partial' | 'failed'
// ─────────────────────────────────────────────────────────────
export const importLogs = sqliteTable("import_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sourceFile: text("source_file").notNull(),
  recordsAdded: integer("records_added").notNull().default(0),
  status: text("status").notNull().default("success"),
  errorMessage: text("error_message"),
  importedAt: text("imported_at").notNull().default(now),
});

// ─────────────────────────────────────────────────────────────
// Tipe inferensi
// ─────────────────────────────────────────────────────────────
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export type Menu = typeof menus.$inferSelect;
export type NewMenu = typeof menus.$inferInsert;

export type MenuItem = typeof menuItems.$inferSelect;
export type NewMenuItem = typeof menuItems.$inferInsert;

export type MenuCategory = typeof menuCategories.$inferSelect;
export type NewMenuCategory = typeof menuCategories.$inferInsert;

export type Week = typeof weeks.$inferSelect;
export type NewWeek = typeof weeks.$inferInsert;

export type Schedule = typeof schedules.$inferSelect;
export type NewSchedule = typeof schedules.$inferInsert;

export type Holiday = typeof holidays.$inferSelect;
export type NewHoliday = typeof holidays.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Parent = typeof parents.$inferSelect;
export type NewParent = typeof parents.$inferInsert;

export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;

export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;

export type ImportLog = typeof importLogs.$inferSelect;
export type NewImportLog = typeof importLogs.$inferInsert;
