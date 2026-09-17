# Struktur Tabel Database
## Aplikasi "Pizza Snack Play"

**Stack:** Bun + Hono + Vue + SQLite (via `bun:sqlite` + Drizzle ORM)
**Database File:** `data/pizza_snack_play.db`

---

## 1. ERD (Entity Relationship Diagram)

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────────┐
│  categories  │       │      menus       │       │   menu_items     │
├──────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (PK)      │◄──┐   │ id (PK)          │◄──┐  │ id (PK)          │
│ name         │   │   │ name             │   │  │ menu_id (FK)     │
│ slug         │   │   │ description     │   │  │ name             │
│ color        │   │   │ is_active        │   │  │ item_type        │
│ created_at   │   │   │ created_at       │   │  │ category_id (FK) │
└──────────────┘   │   └──────────────────┘   │  │ created_at       │
                   │                           │  └──────────────────┘
                   │                           │
                   │   ┌──────────────────┐    │
                   └───│ menu_categories  │    │
                       ├──────────────────┤    │
                       │ menu_id (FK)     │────┘
                       │ category_id (FK) │
                       └──────────────────┘

┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│      users       │       │     parents      │       │     holidays     │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (PK)          │◄──┐   │ id (PK)          │       │ id (PK)          │
│ username (UQ)    │   │   │ user_id (FK)     │       │ date (UQ)        │
│ password_hash    │   │   │ parent_name      │       │ name             │
│ full_name        │   └──►│ student_name     │       │ description      │
│ role             │       │ student_class    │       │ created_at       │
│ is_active        │       │ relationship     │       └──────────────────┘
│ last_login_at    │       │ is_active        │
│ created_at       │       │ created_at       │
└──────────────────┘       └──────────────────┘
                       │
                       │  ┌──────────────────┐
                       └──│  schedule_items  │
                          ├──────────────────┤
                          │ id (PK)          │
                          │ schedule_id (FK) │
                          │ menu_item_id(FK) │
                          │ serving_order    │
                          └──────────────────┘
```

---

## 2. DDL — Skema Lengkap (SQLite)

### 2.1 Tabel: `categories`
Kategori untuk mengelompokkan menu item (mis. "gorengan", "kukusan", "buah", "rebusan").

```sql
CREATE TABLE IF NOT EXISTS categories (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL UNIQUE,
    slug        TEXT NOT NULL UNIQUE,
    color       TEXT DEFAULT '#CCCCCC',   -- untuk UI badge
    created_at  TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
```

### 2.2 Tabel: `menus`
Definisi menu snack (kombinasi makanan utama + buah pendamping). Menu dapat dipakai ulang pada hari berbeda.

```sql
CREATE TABLE IF NOT EXISTS menus (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,                    -- mis. "Roti isi coklat + Jeruk"
    description TEXT,                              -- catatan opsional
    is_active   INTEGER NOT NULL DEFAULT 1,       -- 1=aktif, 0=arsip
    is_archived INTEGER NOT NULL DEFAULT 0,        -- soft delete
    created_at  TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX IF NOT EXISTS idx_menus_name ON menus(name);
CREATE INDEX IF NOT EXISTS idx_menus_active ON menus(is_active);
```

### 2.3 Tabel: `menu_items`
Komponen individual dalam satu menu (mis. "Roti isi coklat" = item utama, "Jeruk" = buah).

```sql
CREATE TABLE IF NOT EXISTS menu_items (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    menu_id      INTEGER NOT NULL,
    name         TEXT NOT NULL,                    -- mis. "Roti isi coklat", "Jeruk"
    item_type    TEXT NOT NULL DEFAULT 'main',     -- 'main' | 'fruit' | 'drink' | 'other'
    category_id  INTEGER,                          -- FK opsional ke categories
    created_at   TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at   TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),

    FOREIGN KEY (menu_id)     REFERENCES menus(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_menu_items_menu_id  ON menu_items(menu_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_name    ON menu_items(name);
CREATE INDEX IF NOT EXISTS idx_menu_items_type     ON menu_items(item_type);
```

### 2.4 Tabel: `menu_categories` (Many-to-Many)
Satu menu bisa memiliki multiple kategori (mis. "gorengan" + "sayur").

```sql
CREATE TABLE IF NOT EXISTS menu_categories (
    menu_id      INTEGER NOT NULL,
    category_id  INTEGER NOT NULL,
    PRIMARY KEY (menu_id, category_id),

    FOREIGN KEY (menu_id)      REFERENCES menus(id)      ON DELETE CASCADE,
    FOREIGN KEY (category_id)  REFERENCES categories(id)  ON DELETE CASCADE
);
```

### 2.5 Tabel: `weeks`
Periode mingguan (Senin–Jumat) untuk pengelompokan jadwal.

```sql
CREATE TABLE IF NOT EXISTS weeks (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    week_start_date TEXT NOT NULL,                  -- tanggal Senin (YYYY-MM-DD)
    week_end_date   TEXT NOT NULL,                  -- tanggal Jumat (YYYY-MM-DD)
    month           INTEGER NOT NULL,               -- 1–12
    year            INTEGER NOT NULL,               -- mis. 2026
    label           TEXT,                           -- mis. "Minggu 1 September 2026"
    created_at      TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),

    UNIQUE(week_start_date, week_end_date)
);

CREATE INDEX IF NOT EXISTS idx_weeks_month_year ON weeks(month, year);
```

### 2.6 Tabel: `schedules`
Jadwal harian — menghubungkan tanggal tertentu dengan menu yang disajikan.

```sql
CREATE TABLE IF NOT EXISTS schedules (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    week_id        INTEGER,                          -- FK ke weeks (opsional, untuk grouping)
    schedule_date  TEXT NOT NULL UNIQUE,             -- YYYY-MM-DD
    day_of_week    INTEGER NOT NULL,                 -- 1=Senin .. 5=Jumat
    menu_id        INTEGER,                          -- FK ke menus (NULL jika libur)
    is_holiday     INTEGER NOT NULL DEFAULT 0,       -- 1=libur, 0=ada snack
    notes          TEXT,                             -- catatan khusus
    created_at     TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at     TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),

    FOREIGN KEY (week_id) REFERENCES weeks(id) ON DELETE SET NULL,
    FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_schedules_date  ON schedules(schedule_date);
CREATE INDEX IF NOT EXISTS idx_schedules_week  ON schedules(week_id);
CREATE INDEX IF NOT EXISTS idx_schedules_menu  ON schedules(menu_id);
```

### 2.7 Tabel: `holidays`
Daftar hari libur (nasional, sekolah, dll.) untuk otomatis flag `is_holiday`.

```sql
CREATE TABLE IF NOT EXISTS holidays (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    date        TEXT NOT NULL UNIQUE,                -- YYYY-MM-DD
    name        TEXT NOT NULL,                        -- mis. "Hari Kemerdekaan RI"
    description TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);
```

### 2.8 Tabel: `users` (Autentikasi — Admin & Orang Tua)
Tabel untuk autentikasi semua pengguna: admin/guru piket dan orang tua. Setiap orang tua wajib memiliki akun login.

```sql
CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,                     -- bcrypt/argon2 hash
    full_name     TEXT,                              -- nama lengkap
    email         TEXT,                               -- email opsional (untuk reset)
    phone         TEXT,                               -- nomor HP opsional
    role          TEXT NOT NULL DEFAULT 'parent',    -- 'admin' | 'parent'
    is_active     INTEGER NOT NULL DEFAULT 1,         -- 1=aktif, 0=nonaktif
    last_login_at TEXT,                               -- timestamp login terakhir
    created_at    TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX IF NOT EXISTS idx_users_role    ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active  ON users(is_active);
```

### 2.9 Tabel: `parents` (Profil Orang Tua)
Profil detail orang tua yang terhubung ke akun `users`. Berisi informasi siswa/anak.

```sql
CREATE TABLE IF NOT EXISTS parents (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL,                  -- FK ke users
    parent_name   TEXT NOT NULL,                     -- nama orang tua
    student_name  TEXT NOT NULL,                     -- nama siswa/anak
    student_class TEXT,                               -- kelas siswa (mis. "1A", "2B")
    relationship  TEXT NOT NULL DEFAULT 'ibu',       -- 'ibu' | 'ayah' | 'wali'
    phone         TEXT,
    address       TEXT,
    is_active     INTEGER NOT NULL DEFAULT 1,
    created_at    TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_parents_user_id   ON parents(user_id);
CREATE INDEX IF NOT EXISTS idx_parents_class     ON parents(student_class);
CREATE INDEX IF NOT EXISTS idx_parents_active   ON parents(is_active);
```

### 2.11 Tabel: `settings` (Konfigurasi Aplikasi)
Pengaturan global (nama sekolah, tahun ajaran aktif, dll.).

```sql
CREATE TABLE IF NOT EXISTS settings (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    key   TEXT NOT NULL UNIQUE,
    value TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);
```

### 2.12 Tabel: `import_logs` (Audit Trail)
Mencatat impor data dari file teks manual.

```sql
CREATE TABLE IF NOT EXISTS import_logs (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    source_file   TEXT NOT NULL,
    records_added INTEGER NOT NULL DEFAULT 0,
    status        TEXT NOT NULL DEFAULT 'success',   -- 'success' | 'partial' | 'failed'
    error_message TEXT,
    imported_at   TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);
```

---

## 3. Relasi Antar Tabel (Summary)

| Dari | Ke | Jenis | Foreign Key |
|------|----|-------|-------------|
| `menu_items` | `menus` | Many-to-One | `menu_id` |
| `menu_items` | `categories` | Many-to-One (opsional) | `category_id` |
| `menu_categories` | `menus` | Many-to-Many | `menu_id` |
| `menu_categories` | `categories` | Many-to-Many | `category_id` |
| `schedules` | `weeks` | Many-to-One (opsional) | `week_id` |
| `schedules` | `menus` | Many-to-One (opsional) | `menu_id` |
| `parents` | `users` | Many-to-One | `user_id` |
| `schedule_items` | `schedules` | Many-to-One | `schedule_id` |
| `schedule_items` | `menu_items` | Many-to-One | `menu_item_id` |

---

## 4. Sample Data (Seed) — Dari File Terlampir

### 4.1 Kategori Awal

```sql
INSERT INTO categories (name, slug, color) VALUES
('Gorengan',     'gorengan',     '#FF8C00'),
('Kukusan',      'kukusan',      '#4169E1'),
('Rebusan',      'rebusan',      '#20B2AA'),
('Panggangan',   'panggangan',   '#CD853F'),
('Buah Segar',   'buah-segar',   '#32CD32'),
('Roti/Bakery',  'roti-bakery',  '#DAA520'),
('Kue Tradisional','kue-tradisional','#FF69B4'),
('Lainnya',      'lainnya',      '#A9A9A9');
```

### 4.2 Sample Menu & Items (September 2026 — Minggu 1)

```sql
-- Menu: Roti isi coklat + Jeruk
INSERT INTO menus (name, description) VALUES
('Roti isi coklat + Jeruk', 'Menu outing Selasa');

INSERT INTO menu_items (menu_id, name, item_type, category_id) VALUES
(1, 'Roti isi coklat', 'main', 6),  -- Roti/Bakery
(1, 'Jeruk',           'fruit', 5); -- Buah Segar

-- Menu: Tahu isi sayur + Melon
INSERT INTO menus (name, description) VALUES
('Tahu isi sayur + Melon', NULL);

INSERT INTO menu_items (menu_id, name, item_type, category_id) VALUES
(2, 'Tahu isi sayur', 'main', 1),  -- Gorengan
(2, 'Melon',          'fruit', 5); -- Buah Segar

-- Menu: Pisang panggang coklat keju + Nanas madu
INSERT INTO menus (name, description) VALUES
('Pisang panggang coklat keju + Nanas madu', NULL);

INSERT INTO menu_items (menu_id, name, item_type, category_id) VALUES
(3, 'Pisang panggang coklat keju', 'main', 4),  -- Panggangan
(3, 'Nanas madu',                  'fruit', 5); -- Buah Segar

-- Menu: Urap jagung + Semangka
INSERT INTO menus (name, description) VALUES
('Urap jagung + Semangka', NULL);

INSERT INTO menu_items (menu_id, name, item_type, category_id) VALUES
(4, 'Urap jagung', 'main', 8),     -- Lainnya
(4, 'Semangka',    'fruit', 5);    -- Buah Segar
```

### 4.3 Sample Week & Schedules (September 2026 — Minggu 1)

```sql
-- Week: 1-5 September 2026
INSERT INTO weeks (week_start_date, week_end_date, month, year, label) VALUES
('2026-09-01', '2026-09-05', 9, 2026, 'Minggu 1 September 2026');

-- Schedules for the week
INSERT INTO schedules (week_id, schedule_date, day_of_week, menu_id, is_holiday) VALUES
(1, '2026-09-01', 2, 1, 0),  -- Selasa: Roti isi coklat + Jeruk (outing)
(1, '2026-09-02', 3, 2, 0),  -- Rabu: Tahu isi sayur + Melon
(1, '2026-09-03', 4, 3, 0),  -- Kamis: Pisang panggang coklat keju + Nanas madu
(1, '6909-04', 5, 4, 0);     -- Jumat: Urap jagung + Semangka
-- Catatan: 1 September 2026 adalah Selasa (hari Senin tidak ada di file, kemungkinan libur)
```

### 4.4 Holiday Sample (Agustus 2026)

```sql
INSERT INTO holidays (date, name, description) VALUES
('2026-08-17', 'Hari Kemerdekaan RI', 'Libur nasional — jadwal snack skip');
```

### 4.5 Sample Users & Parents (Orang Tua)

```sql
-- Admin account
INSERT INTO users (username, password_hash, full_name, role, is_active) VALUES
('admin',   '$2b$10$xxxhashxxx', 'Bu Guru Sari', 'admin', 1);

-- Parent accounts
INSERT INTO users (username, password_hash, full_name, role, is_active) VALUES
('sari',    '$2b$10$xxxhashxxx', 'Ibu Sari',     'parent', 1),
('budi',    '$2b$10$xxxhashxxx', 'Pak Budi',     'parent', 1),
('dewi',    '$2b$10$xxxhashxxx', 'Ibu Dewi',     'parent', 1);

-- Parent profiles (linked to users)
INSERT INTO parents (user_id, parent_name, student_name, student_class, relationship, phone) VALUES
(2, 'Sari Wulandari',   'Aisyah Sari',  '1A', 'ibu',  '081234567890'),
(3, 'Budi Santoso',     'Bagas Budi',   '1A', 'ayah', '081234567891'),
(4, 'Dewi Lestari',     'Citra Dewi',   '1B', 'ibu',  '081234567892');
```

---

## 5. Query Contoh (Useful Queries)

### 5.1 Jadwal Hari Ini

```sql
SELECT
    s.schedule_date,
    s.day_of_week,
    m.name AS menu_name,
    mi.name AS item_name,
    mi.item_type
FROM schedules s
LEFT JOIN menus m ON s.menu_id = m.id
LEFT JOIN menu_items mi ON mi.menu_id = m.id
WHERE s.schedule_date = date('now', 'localtime')
ORDER BY mi.item_type;
```

### 5.2 Jadwal Minggu Ini

```sql
SELECT
    s.schedule_date,
    CASE s.day_of_week
        WHEN 1 THEN 'Senin'
        WHEN 2 THEN 'Selasa'
        WHEN 3 THEN 'Rabu'
        WHEN 4 THEN 'Kamis'
        WHEN 5 THEN 'Jumat'
    END AS hari,
    s.is_holiday,
    m.name AS menu_name,
    GROUP_CONCAT(mi.name, ' + ') AS items
FROM schedules s
LEFT JOIN menus m ON s.menu_id = m.id
LEFT JOIN menu_items mi ON mi.menu_id = m.id
WHERE s.schedule_date >= date('now', 'localtime', 'weekday 0', '-6 days')
  AND s.schedule_date <= date('now', 'localtime', 'weekday 4')
GROUP BY s.schedule_date
ORDER BY s.schedule_date;
```

### 5.3 Pencarian Menu (Kapan "Jeruk" Disajikan?)

```sql
SELECT DISTINCT
    s.schedule_date,
    m.name AS menu_name
FROM schedules s
JOIN menus m ON s.menu_id = m.id
JOIN menu_items mi ON mi.menu_id = m.id
WHERE mi.name LIKE '%jeruk%'
ORDER BY s.schedule_date DESC;
```

### 5.4 Statistik Menu per Bulan

```sql
SELECT
    strftime('%Y-%m', s.schedule_date) AS bulan,
    COUNT(DISTINCT s.menu_id) AS menu_unik,
    COUNT(*) AS total_hari,
    SUM(CASE WHEN s.is_holiday = 1 THEN 1 ELSE 0 END) AS hari_libur
FROM schedules s
WHERE strftime('%Y-%m', s.schedule_date) = '2026-09'
GROUP BY bulan;
```

### 5.5 Jadwal Bulanan Lengkap

```sql
SELECT
    s.schedule_date,
    CASE s.day_of_week
        WHEN 1 THEN 'Senin'
        WHEN 2 THEN 'Selasa'
        WHEN 3 THEN 'Rabu'
        WHEN 4 THEN 'Kamis'
        WHEN 5 THEN 'Jumat'
    END AS hari,
    CASE WHEN s.is_holiday = 1 THEN 'LIBUR' ELSE m.name END AS menu_name,
    GROUP_CONCAT(
        CASE mi.item_type
            WHEN 'main'  THEN mi.name
            WHEN 'fruit' THEN mi.name
            ELSE mi.name
        END, ' + '
    ) AS items_detail
FROM schedules s
LEFT JOIN menus m ON s.menu_id = m.id
LEFT JOIN menu_items mi ON mi.menu_id = m.id
WHERE strftime('%Y-%m', s.schedule_date) = '2026-09'
GROUP BY s.schedule_date
ORDER BY s.schedule_date;
```

### 5.6 Login Verifikasi (Cek Username & Password)

```sql
SELECT
    u.id,
    u.username,
    u.full_name,
    u.role,
    u.is_active,
    p.parent_name,
    p.student_name,
    p.student_class
FROM users u
LEFT JOIN parents p ON p.user_id = u.id
WHERE u.username = 'sari'
  AND u.is_active = 1;
-- Password hash diverifikasi di aplikasi (bcrypt/argon2), bukan di SQL
```

### 5.7 Daftar Akun Orang Tua (Admin View)

```sql
SELECT
    u.id,
    u.username,
    u.full_name,
    p.parent_name,
    p.student_name,
    p.student_class,
    p.relationship,
    u.is_active,
    u.last_login_at
FROM users u
LEFT JOIN parents p ON p.user_id = u.id
WHERE u.role = 'parent'
ORDER BY p.student_class, p.student_name;
```

---

## 6. Drizzle ORM Schema (TypeScript)

Berikut adalah padanan skema SQL di atas dalam **Drizzle ORM** untuk integrasi dengan Bun:

```typescript
// src/server/db/schema.ts

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ─── categories ───────────────────────────────────────
export const categories = sqliteTable('categories', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  name:      text('name').notNull().unique(),
  slug:      text('slug').notNull().unique(),
  color:     text('color').default('#CCCCCC'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now', 'localtime'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now', 'localtime'))`),
});

// ─── menus ───────────────────────────────────────────
export const menus = sqliteTable('menus', {
  id:          integer('id').primaryKey({ autoIncrement: true }),
  name:        text('name').notNull(),
  description: text('description'),
  isActive:    integer('is_active').notNull().default(1),
  isArchived:  integer('is_archived').notNull().default(0),
  createdAt:   text('created_at').notNull().default(sql`(datetime('now', 'localtime'))`),
  updatedAt:   text('updated_at').notNull().default(sql`(datetime('now', 'localtime'))`),
});

// ─── menu_items ──────────────────────────────────────
export const menuItems = sqliteTable('menu_items', {
  id:          integer('id').primaryKey({ autoIncrement: true }),
  menuId:      integer('menu_id').notNull().references(() => menus.id, { onDelete: 'cascade' }),
  name:        text('name').notNull(),
  itemType:    text('item_type').notNull().default('main'), // 'main' | 'fruit' | 'drink' | 'other'
  categoryId:  integer('category_id').references(() => categories.id, { onDelete: 'set null' }),
  createdAt:   text('created_at').notNull().default(sql`(datetime('now', 'localtime'))`),
  updatedAt:   text('updated_at').notNull().default(sql`(datetime('now', 'localtime'))`),
});

// ─── menu_categories (M2M) ───────────────────────────
export const menuCategories = sqliteTable('menu_categories', {
  menuId:     integer('menu_id').notNull().references(() => menus.id, { onDelete: 'cascade' }),
  categoryId: integer('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
});

// ─── weeks ───────────────────────────────────────────
export const weeks = sqliteTable('weeks', {
  id:            integer('id').primaryKey({ autoIncrement: true }),
  weekStartDate: text('week_start_date').notNull(),
  weekEndDate:   text('week_end_date').notNull(),
  month:         integer('month').notNull(),
  year:          integer('year').notNull(),
  label:         text('label'),
  createdAt:     text('created_at').notNull().default(sql`(datetime('now', 'localtime'))`),
});

// ─── schedules ───────────────────────────────────────
export const schedules = sqliteTable('schedules', {
  id:           integer('id').primaryKey({ autoIncrement: true }),
  weekId:       integer('week_id').references(() => weeks.id, { onDelete: 'set null' }),
  scheduleDate: text('schedule_date').notNull().unique(),
  dayOfWeek:    integer('day_of_week').notNull(), // 1=Senin .. 5=Jumat
  menuId:       integer('menu_id').references(() => menus.id, { onDelete: 'set null' }),
  isHoliday:    integer('is_holiday').notNull().default(0),
  notes:        text('notes'),
  createdAt:    text('created_at').notNull().default(sql`(datetime('now', 'localtime'))`),
  updatedAt:    text('updated_at').notNull().default(sql`(datetime('now', 'localtime'))`),
});

// ─── holidays ────────────────────────────────────────
export const holidays = sqliteTable('holidays', {
  id:          integer('id').primaryKey({ autoIncrement: true }),
  date:        text('date').notNull().unique(),
  name:        text('name').notNull(),
  description: text('description'),
  createdAt:   text('created_at').notNull().default(sql`(datetime('now', 'localtime'))`),
});

// ─── users (Admin & Orang Tua) ──────────────────────
export const users = sqliteTable('users', {
  id:           integer('id').primaryKey({ autoIncrement: true }),
  username:     text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  fullName:     text('full_name'),
  email:        text('email'),
  phone:        text('phone'),
  role:         text('role').notNull().default('parent'), // 'admin' | 'parent'
  isActive:     integer('is_active').notNull().default(1),
  lastLoginAt:  text('last_login_at'),
  createdAt:    text('created_at').notNull().default(sql`(datetime('now', 'localtime'))`),
  updatedAt:    text('updated_at').notNull().default(sql`(datetime('now', 'localtime'))`),
});

// ─── parents (Profil Orang Tua) ─────────────────────
export const parents = sqliteTable('parents', {
  id:           integer('id').primaryKey({ autoIncrement: true }),
  userId:       integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  parentName:   text('parent_name').notNull(),
  studentName:  text('student_name').notNull(),
  studentClass: text('student_class'),
  relationship: text('relationship').notNull().default('ibu'), // 'ibu' | 'ayah' | 'wali'
  phone:        text('phone'),
  address:      text('address'),
  isActive:     integer('is_active').notNull().default(1),
  createdAt:    text('created_at').notNull().default(sql`(datetime('now', 'localtime'))`),
  updatedAt:    text('updated_at').notNull().default(sql`(datetime('now', 'localtime'))`),
});

// ─── settings ────────────────────────────────────────
export const settings = sqliteTable('settings', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  key:       text('key').notNull().unique(),
  value:     text('value'),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now', 'localtime'))`),
});

// ─── import_logs ─────────────────────────────────────
export const importLogs = sqliteTable('import_logs', {
  id:           integer('id').primaryKey({ autoIncrement: true }),
  sourceFile:   text('source_file').notNull(),
  recordsAdded: integer('records_added').notNull().default(0),
  status:       text('status').notNull().default('success'),
  errorMessage: text('error_message'),
  importedAt:   text('imported_at').notNull().default(sql`(datetime('now', 'localtime'))`),
});
```

---

## 7. Pemetaan Data File → Tabel

### File: `jadwal_piket_snack_pizza_snack_play.txt`

```
Raw Data                          →   Tabel Target
─────────────────────────────────────────────────────
Bulan (September 2026)            →   settings / weeks.month + year
Minggu (1-4 September)            →   weeks (week_start_date, week_end_date)
Hari (Selasa)                     →   schedules.day_of_week
"Roti isi coklat + jeruk"         →   menus.name + menu_items (2 rows)
"Roti isi coklat"                 →   menu_items.name (item_type='main')
"jeruk"                           →   menu_items.name (item_type='fruit')
"Libur"                           →   schedules.is_holiday = 1
Tanggal implisit (2 Sep 2026)     →   schedules.schedule_date
```

### Parsing Logic (untuk script seed)

```
For each month block in file:
    For each week block:
        Create week record (start=Monday, end=Friday)
        For each day line:
            Parse "Hari : menu_text"
            If menu_text == "Libur":
                Create schedule with is_holiday=1
            Else:
                Split menu_text by "+" → [main_item, fruit_item]
                Create menu record
                Create 2 menu_items (main + fruit)
                Create schedule record linking date → menu
```

---

## 8. Index Strategy

| Tabel | Kolom | Index Name | Alasan |
|-------|-------|------------|--------|
| `schedules` | `schedule_date` | `idx_schedules_date` | Query "hari ini" & "minggu ini" sangat sering |
| `schedules` | `week_id` | `idx_schedules_week` | Filter by minggu |
| `schedules` | `menu_id` | `idx_schedules_menu` | Cari semua tanggal untuk menu tertentu |
| `menus` | `name` | `idx_menus_name` | Pencarian menu by nama |
| `menus` | `is_active` | `idx_menus_active` | Filter menu aktif |
| `menu_items` | `menu_id` | `idx_menu_items_menu_id` | Join ke parent menu |
| `menu_items` | `name` | `idx_menu_items_name` | Pencarian item by nama |
| `menu_items` | `item_type` | `idx_menu_items_type` | Filter main vs fruit |
| `categories` | `slug` | `idx_categories_slug` | Lookup kategori by slug |
| `weeks` | `month, year` | `idx_weeks_month_year` | Filter minggu by bulan |
| `users` | `role` | `idx_users_role` | Filter user by role (admin/parent) |
| `users` | `is_active` | `idx_users_active` | Filter user aktif/nonaktif |
| `parents` | `user_id` | `idx_parents_user_id` | Join parent → user |
| `parents` | `student_class` | `idx_parents_class` | Filter parent by kelas siswa |
| `parents` | `is_active` | `idx_parents_active` | Filter parent aktif/nonaktif |

---

## 9. Migration Plan

### Step 1: Create Database
```bash
bun run src/server/db/migrate.ts
```

### Step 2: Seed Categories
```bash
bun run src/server/db/seed-categories.ts
```

### Step 3: Seed Data from File
Script parser yang membaca `jadwal_piket_snack_pizza_snack_play.txt` dan mengisi tabel `weeks`, `menus`, `menu_items`, `schedules`.

```bash
bun run src/server/db/seed-from-file.ts --file="jadwal_piket_snack_pizza_snack_play.txt"
```

---

_Dokumen ini melengkapi PRD Pizza Snack Play dan menjadi referensi teknis untuk implementasi database._
