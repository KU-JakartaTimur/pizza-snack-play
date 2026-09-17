# Struktur Tabel Database
## Aplikasi "Pizza Snack Play"

**Stack:** Bun + Hono + Vite + React (Cloudflare Workers)
**Database:** Cloudflare D1 (Serverless SQLite)
**ORM:** Drizzle ORM (`drizzle-orm/sqlite-core`)
**Binding:** `DB` (lihat `wrangler.json`)
**Migrations:** folder `drizzle/migrations/` via `drizzle-kit` (seed di `drizzle/seed.sql`)

> **Catatan versi:** Dokumen ini awalnya ditulis untuk `bun:sqlite` lokal. Setelah template `bhvr-template` di-scaffold, database target adalah **Cloudflare D1**. DDL di bawah tetap valid karena D1 adalah SQLite — yang berubah hanya cara koneksi (`drizzle(env.DB)`) dan cara migrasi (`drizzle-kit` + `wrangler d1`).
>
> **Revisi terakhir:** tabel `students` ditambahkan agar **satu orang tua dapat memiliki lebih dari satu anak**. Kolom `parents.student_name` / `parents.student_class` dihapus setelah datanya dipindahkan. Jumlah tabel kini **12**.
>
> **Revisi jadwal per kelas (migrasi `0002_*.sql`):** `schedules` sekarang menyimpan **satu baris per kelas**
> (`class_name NOT NULL`), dengan indeks unik gabungan `UNIQUE(schedule_date, class_name)` menggantikan
> `UNIQUE(schedule_date)`. Tabel `users` mendapat kolom `class_name` (nullable) untuk menautkan role baru
> **`korlas`** ke kelas yang dikoordinasinya. Karena SQLite menolak `ADD COLUMN ... NOT NULL` pada tabel
> berisi data, migrasi `0002` melakukan **rebuild tabel**: `schedules_new` → salin (`CROSS JOIN` daftar kelas)
> → drop → rename. Hasilnya **43 baris lama → 129 baris** (43 tanggal × 3 kelas: 1A, 1B, 2A), 0 baris yatim.
>
> **Tidak ada tabel `classes`:** kelas sengaja tetap berupa **teks bebas** (konsisten dengan `students.class_name`).
> Daftar kelas diturunkan dari `students.class_name` ∪ `users.class_name` (korlas) ∪ `schedules.class_name`
> dan disajikan lewat `GET /api/classes`.

---

## 0. Koneksi Database (Drizzle + D1)

```typescript
// src/database/db.ts
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export interface Env {
  DB: D1Database;   // binding D1 dari wrangler.json
}

export function createDb(env: Env) {
  return drizzle(env.DB, { schema });
}
```

Setiap Worker request menerima `env` melalui context Hono:

```typescript
// src/api/index.ts
import { Hono } from "hono";
import { createDb, type Env } from "@/database/db";

const app = new Hono<{ Bindings: Env }>().basePath("/api");

app.use("*", async (c, next) => {
  c.set("db", createDb(c.env));
  await next();
});

export default app;
```

> **Catatan:** D1 tidak mendukung transaksi interaktif panjang seperti SQLite lokal. Gunakan `db.batch([...])` untuk menjalankan beberapa statement secara atomik.

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
│ full_name        │   └──►│ relationship     │       │ description      │
│ role             │       │ phone            │       │ created_at       │
│ class_name (?)   │       │ address          │       └──────────────────┘
│ is_active        │       │ is_active        │          ▲ sekolah-wide,
│ last_login_at    │       │ created_at       │          │ hanya admin
│ created_at       │       └──────────────────┘
└──────────────────┘                │
        │                           │ 1 ──── n
        │ role = 'korlas'           ▼
        │ class_name = '1A' ┌──────────────────┐
        │                   │     students     │
        │                   ├──────────────────┤
        │                   │ id (PK)          │
        │                   │ parent_id (FK)   │
        │                   │ name             │
        │                   │ class_name       │
        │                   │ is_active        │
        │                   │ created_at       │
        │                   │ updated_at       │
        │                   └──────────────────┘
        │
        │  cakupan kelas (dicek di classScope.ts)
        ▼
┌──────────────────┐       ┌──────────────────┐
│      weeks       │       │    schedules     │
├──────────────────┤       ├──────────────────┤
│ id (PK)          │◄──┐   │ id (PK)          │
│ week_number      │   │   │ week_id (FK,?)   │
│ start_date       │   └───│ schedule_date    │
│ end_date         │       │ day_of_week      │
│ year, month      │       │ class_name  ★    │
│ created_at       │       │ menu_id (FK,?)   │
└──────────────────┘       │ is_holiday       │
                           │ notes            │
                           │ created_at       │
                           │ updated_at       │
                           └──────────────────┘
                           UNIQUE(schedule_date, class_name)
                           ★ = kelas pemilik baris; wajib diisi.
                             Satu tanggal boleh punya baris
                             berbeda untuk tiap kelas.
```

> Satu orang tua boleh memiliki **lebih dari satu anak** — relasi `parents 1 ── n students`.
>
> **Jadwal per kelas:** `schedules` tidak lagi berisi satu baris global per tanggal, melainkan
> **satu baris untuk setiap kelas**. Jadi 17 September 2026 punya 3 baris (1A, 1B, 2A) yang menunya
> boleh berbeda. Relasi ke `users` bukan foreign key, melainkan **kecocokan nilai** `schedules.class_name`
> = `users.class_name` milik korlas — dipakai untuk menentukan cakupan kelas, bukan untuk integritas referensial.
>
> **`holidays` tetap global:** berlaku untuk semua kelas, tidak punya `class_name`, dan hanya admin yang boleh mengubah.

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
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
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
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
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
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT NOT NULL DEFAULT (datetime('now')),

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
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),

    UNIQUE(week_start_date, week_end_date)
);

CREATE INDEX IF NOT EXISTS idx_weeks_month_year ON weeks(month, year);
```

### 2.6 Tabel: `schedules`
Jadwal harian **per kelas** — menghubungkan tanggal tertentu dengan menu yang disajikan untuk satu kelas.

```sql
CREATE TABLE IF NOT EXISTS schedules (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    week_id        INTEGER,                          -- FK ke weeks (opsional, untuk grouping)
    schedule_date  TEXT NOT NULL,                    -- YYYY-MM-DD
    day_of_week    INTEGER NOT NULL,                 -- 1=Senin .. 5=Jumat
    class_name     TEXT NOT NULL,                    -- ★ kelas pemilik baris, mis. '1A'
    menu_id        INTEGER,                          -- FK ke menus (NULL jika libur)
    is_holiday     INTEGER NOT NULL DEFAULT 0,       -- 1=libur, 0=ada snack
    notes          TEXT,                             -- catatan khusus
    created_at     TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at     TEXT NOT NULL DEFAULT (datetime('now')),

    FOREIGN KEY (week_id) REFERENCES weeks(id) ON DELETE SET NULL,
    FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE SET NULL
);

-- ★ Unik GABUNGAN: satu kelas hanya boleh punya satu baris per tanggal,
--   tetapi tanggal yang sama boleh muncul untuk kelas yang berbeda.
CREATE UNIQUE INDEX IF NOT EXISTS idx_schedules_date_class ON schedules(schedule_date, class_name);
CREATE INDEX IF NOT EXISTS idx_schedules_week  ON schedules(week_id);
CREATE INDEX IF NOT EXISTS idx_schedules_menu  ON schedules(menu_id);
CREATE INDEX IF NOT EXISTS idx_schedules_class ON schedules(class_name);
```

> **Kenapa `class_name` tidak jadi FK ke tabel `classes`?** Kelas sengaja tetap teks bebas agar
> konsisten dengan `students.class_name` dan tidak menambah tabel baru. Konsekuensinya penamaan
> kelas harus konsisten (`"1A"` bukan `"1a"` / `"1 A"`); daftar kelas diturunkan dari data yang ada
> dan disajikan lewat `GET /api/classes`.
>
> **Kenapa bukan satu baris global + pengecualian?** Model "baris global + penanda `'*'`" memaksa
> setiap pembacaan melakukan dua lapis resolusi (global vs override) dan rawan salah saat
> `UNIQUE` memperlakukan `NULL` sebagai nilai yang selalu berbeda. Model baris-per-kelas lebih
> sederhana dibaca dan langsung bisa di-`WHERE class_name = ?`.
>
> **Migrasi `0002_*.sql`:** SQLite tidak menerima `ADD COLUMN ... NOT NULL` pada tabel yang sudah
> berisi data, jadi migrasi membangun ulang tabel (`schedules_new` → `INSERT ... SELECT` dengan
> `CROSS JOIN` daftar kelas → `DROP TABLE schedules` → `RENAME`). Baris lama direplikasi ke setiap
> kelas yang dikenal (`students` ∪ korlas `users`); bila belum ada kelas sama sekali, baris
> dijatuhkan ke kelas `'Umum'` supaya tidak ada jadwal yang hilang.

### 2.7 Tabel: `holidays`
Daftar hari libur **sekolah-wide** (nasional, sekolah, dll.) untuk otomatis flag `is_holiday`.
Tidak punya `class_name` — berlaku untuk semua kelas, dan hanya admin yang boleh mengubah.

```sql
CREATE TABLE IF NOT EXISTS holidays (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    date        TEXT NOT NULL UNIQUE,                -- YYYY-MM-DD
    name        TEXT NOT NULL,                        -- mis. "Hari Kemerdekaan RI"
    description TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### 2.8 Tabel: `users` (Autentikasi — Admin, Korlas & Orang Tua)
Tabel untuk autentikasi semua pengguna: admin/guru piket, korlas (koordinator kelas), dan orang tua. Setiap orang tua wajib memiliki akun login.

```sql
CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,                     -- PBKDF2-SHA256, format pbkdf2$<iter>$<salt>$<hash>
    full_name     TEXT,                              -- nama lengkap
    email         TEXT,                               -- email opsional (untuk reset)
    phone         TEXT,                               -- nomor HP opsional
    role          TEXT NOT NULL DEFAULT 'parent',    -- 'admin' | 'korlas' | 'parent'
    class_name    TEXT,                               -- ★ kelas yang dikoordinasi (hanya untuk role 'korlas')
    is_active     INTEGER NOT NULL DEFAULT 1,         -- 1=aktif, 0=nonaktif
    last_login_at TEXT,                               -- timestamp login terakhir
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_role    ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active  ON users(is_active);
```

> **Kolom `class_name` (revisi jadwal per kelas):** nullable dan hanya bermakna untuk `role = 'korlas'`.
> Ditambahkan lewat `ALTER TABLE users ADD class_name TEXT` (aman karena nullable). Nilainya:
> - **wajib** diisi saat sebuah akun diangkat menjadi korlas (`PUT /parents/:id` dengan `role: "korlas"`);
> - **otomatis dikosongkan** saat role dikembalikan menjadi `parent`, supaya tidak ada kelas
>   "yatim" yang tertinggal dan membuat cakupan akses membingungkan;
> - ikut dikirim sebagai claim `className` di JWT, sehingga pengecekan cakupan kelas tidak perlu
>   query tambahan ke tabel ini setiap request.
>
> **Matriks wewenang per role:**
>
> | Aksi | admin | korlas | parent |
> |------|:-----:|:------:|:------:|
> | Baca jadwal kelas sendiri | ✅ | ✅ | ✅ |
> | Baca jadwal kelas lain | ✅ | ❌ 403 | ❌ 403 |
> | Tulis jadwal (kelas sendiri) | ✅ | ✅ | ❌ |
> | Tulis jadwal (kelas lain) | ✅ | ❌ 403 | ❌ |
> | Katalog menu & kategori | ✅ | ✅ | ❌ |
> | Hari libur sekolah | ✅ | ❌ 403 | ❌ |
> | Akun orang tua & statistik | ✅ | ❌ 403 | ❌ |

### 2.9 Tabel: `parents` (Profil Orang Tua)
Profil detail orang tua yang terhubung ke akun `users`. Daftar anak **tidak** disimpan di sini, melainkan di tabel `students` (relasi 1 ── n) agar satu orang tua bisa memiliki lebih dari satu anak.

```sql
CREATE TABLE IF NOT EXISTS parents (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL,                  -- FK ke users
    parent_name   TEXT NOT NULL,                     -- nama orang tua
    relationship  TEXT NOT NULL DEFAULT 'ibu',       -- 'ibu' | 'ayah' | 'wali'
    phone         TEXT,
    address       TEXT,
    is_active     INTEGER NOT NULL DEFAULT 1,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now')),

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_parents_user_id ON parents(user_id);
CREATE INDEX IF NOT EXISTS idx_parents_active  ON parents(is_active);
```

### 2.10 Tabel: `students` (Anak dari Orang Tua)
Menyimpan setiap anak milik seorang orang tua. Satu orang tua boleh punya **banyak** anak; setiap anak punya nama dan kelas sendiri. Menghapus orang tua akan menghapus anak-anaknya (`ON DELETE CASCADE`).

```sql
CREATE TABLE IF NOT EXISTS students (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    parent_id   INTEGER NOT NULL,                    -- FK ke parents
    name        TEXT NOT NULL,                       -- nama anak
    class_name  TEXT,                                -- kelas (mis. "1A", "2B")
    is_active   INTEGER NOT NULL DEFAULT 1,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now')),

    FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_students_parent_id ON students(parent_id);
CREATE INDEX IF NOT EXISTS idx_students_class     ON students(class_name);
```

> **Migrasi dari skema lama:** kolom `parents.student_name` / `parents.student_class` dipindahkan ke tabel `students` sebelum kolomnya dihapus — lihat `drizzle/migrations/0001_*.sql`. Setiap baris `parents` yang punya `student_name` tidak kosong menghasilkan satu baris `students` dengan `parent_id` yang sama.

### 2.11 Tabel: `settings` (Konfigurasi Aplikasi)
Pengaturan global (nama sekolah, tahun ajaran aktif, dll.).

```sql
CREATE TABLE IF NOT EXISTS settings (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    key   TEXT NOT NULL UNIQUE,
    value TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
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
    imported_at   TEXT NOT NULL DEFAULT (datetime('now'))
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
| `students` | `parents` | Many-to-One | `parent_id` |
| `schedules` | `users` (korlas) | **Logis, bukan FK** | `schedules.class_name` = `users.class_name` |
| `schedules` | `students` | **Logis, bukan FK** | `schedules.class_name` = `students.class_name` |

> **Catatan:** tabel `schedule_items` tidak dipakai pada implementasi ini. Komponen menu disimpan di `menu_items` (terikat ke `menus`), sedangkan `schedules` hanya menyimpan `menu_id` + `is_holiday` + `note`.
>
> **Dua relasi logis terakhir** sengaja bukan foreign key: kelas adalah teks bebas tanpa tabel master,
> jadi tidak ada yang bisa direferensikan. Kesamaannya hanya dipakai untuk **menentukan cakupan akses**
> (korlas ↔ kelasnya) dan **menentukan kelas anak** (orang tua ↔ kelas anaknya), bukan untuk integritas data.
> Inilah sebabnya penghapusan/rename kelas tidak bisa otomatis di-cascade dan konsistensi penamaan
> (`"1A"` vs `"1a"`) menjadi tanggung jawab admin.

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

-- Schedules for the week — SATU BARIS PER KELAS
-- Kolom class_name wajib diisi; tanggal yang sama boleh berulang untuk kelas berbeda.
INSERT INTO schedules (week_id, schedule_date, day_of_week, class_name, menu_id, is_holiday) VALUES
-- Kelas 1A
(1, '2026-09-01', 2, '1A', 1, 0),  -- Selasa: Roti isi coklat + Jeruk (outing)
(1, '2026-09-02', 3, '1A', 2, 0),  -- Rabu: Tahu isi sayur + Melon
(1, '2026-09-03', 4, '1A', 3, 0),  -- Kamis: Pisang panggang coklat keju + Nanas madu
(1, '2026-09-04', 5, '1A', 4, 0),  -- Jumat: Urap jagung + Semangka
-- Kelas 1B (menu boleh berbeda pada tanggal yang sama)
(1, '2026-09-01', 2, '1B', 1, 0),
(1, '2026-09-02', 3, '1B', 5, 0),
(1, '2026-09-03', 4, '1B', 3, 0),
(1, '2026-09-04', 5, '1B', 6, 0),
-- Kelas 2A
(1, '2026-09-01', 2, '2A', 7, 0),
(1, '2026-09-02', 3, '2A', 2, 0),
(1, '2026-09-03', 4, '2A', 8, 0),
(1, '2026-09-04', 5, '2A', 4, 0);
-- Catatan: 1 September 2026 adalah Selasa (hari Senin tidak ada di file, kemungkinan libur)

-- Boleh juga menandai libur hanya untuk satu kelas (korlas), mis. kelas 1A ikut kegiatan:
-- INSERT INTO schedules (week_id, schedule_date, day_of_week, class_name, menu_id, is_holiday, notes)
-- VALUES (1, '2026-09-04', 5, '1A', NULL, 1, 'Kelas 1A ikut kegiatan pramuka');
```

> **Volume data seed:** file sumber berisi **43 tanggal**; karena setiap tanggal dibuat untuk
> **3 kelas** (1A, 1B, 2A), `drizzle/seed.sql` menghasilkan **129 baris `schedules`** — sama persis
> dengan hasil migrasi `0002_*.sql` untuk data lama (43 → 129), sehingga data lokal dan hasil migrasi
> konsisten.

### 4.4 Holiday Sample (Agustus 2026)

```sql
INSERT INTO holidays (date, name, description) VALUES
('2026-08-17', 'Hari Kemerdekaan RI', 'Libur nasional — jadwal snack skip');
```

### 4.5 Sample Users, Parents & Students (Orang Tua)

```sql
-- Admin account
INSERT INTO users (username, password_hash, full_name, role, is_active) VALUES
('admin', 'pbkdf2$100000$<salt>$<hash>', 'Bu Guru Sari', 'admin', 1);

-- Parent accounts + satu korlas
-- class_name HANYA diisi untuk role 'korlas' (menunjukkan kelas yang dikoordinasikan).
INSERT INTO users (username, password_hash, full_name, role, class_name, is_active) VALUES
('sari', 'pbkdf2$100000$<salt>$<hash>', 'Ibu Sari', 'parent', NULL, 1),
('budi', 'pbkdf2$100000$<salt>$<hash>', 'Pak Budi', 'korlas', '1A', 1),
('dewi', 'pbkdf2$100000$<salt>$<hash>', 'Ibu Dewi', 'parent', NULL, 1);

-- Parent profiles (linked to users) — TANPA data anak
-- Korlas TETAP punya profil orang tua: ia juga orang tua dari siswa di kelasnya.
INSERT INTO parents (user_id, parent_name, relationship, phone) VALUES
(2, 'Sari Wulandari', 'ibu',  '081234567890'),
(3, 'Budi Santoso',   'ayah', '081234567891'),
(4, 'Dewi Lestari',   'ibu',  '081234567892');

-- Anak-anak (1 orang tua boleh >1 anak) — dewi punya dua anak
INSERT INTO students (parent_id, name, class_name, is_active) VALUES
((SELECT p.id FROM parents p JOIN users u ON u.id = p.user_id WHERE u.username = 'sari'), 'Aisyah Sari', '1A', 1),
((SELECT p.id FROM parents p JOIN users u ON u.id = p.user_id WHERE u.username = 'budi'), 'Bagas Budi',  '1A', 1),
((SELECT p.id FROM parents p JOIN users u ON u.id = p.user_id WHERE u.username = 'dewi'), 'Citra Dewi',  '1B', 1),
((SELECT p.id FROM parents p JOIN users u ON u.id = p.user_id WHERE u.username = 'dewi'), 'Raka Dewi',   '2A', 1);
```

> **Catatan hashing di Cloudflare Workers:** Runtime Worker tidak menyediakan `bcrypt` native.
> Gunakan salah satu pendekatan berikut:
> - **Web Crypto API** (edge-native, tanpa dependency) — PBKDF2 via `crypto.subtle.deriveBits()`
> - **`bcryptjs`** (pure JS) dengan `compatibility_flags: ["nodejs_compat"]`
> - **`@noble/hashes`** — implementasi hash ringan dan cepat untuk edge
>
> Placeholder `$2b$10$xxxhashxxx` di atas adalah format bcrypt. Jika memakai PBKDF2,
> simpan format `pbkdf2$<iterations>$<salt>$<hash>` agar algoritma dapat dibedakan saat verifikasi.
>
> **Password default seed:** `snack123` — wajib diganti saat login pertama.

---

## 5. Query Contoh (Useful Queries)

### 5.1 Jadwal Hari Ini

```sql
SELECT
    s.schedule_date,
    s.day_of_week,
    s.class_name,                -- ★ kelas pemilik baris
    m.name AS menu_name,
    mi.name AS item_name,
    mi.item_type
FROM schedules s
LEFT JOIN menus m ON s.menu_id = m.id
LEFT JOIN menu_items mi ON mi.menu_id = m.id
WHERE s.schedule_date = date('now', '+7 hours')   -- WIB
  AND s.class_name = '1A'                         -- ★ selalu filter kelas
ORDER BY mi.item_type;
```

> **⚠️ `class_name` wajib ikut di `WHERE`.** Sejak jadwal disimpan per kelas, query tanpa filter
> kelas akan mengembalikan baris dari **semua** kelas dan menampilkan menu yang salah. Di aplikasi,
> nilainya datang dari `resolveReadClass()` (`src/api/utils/classScope.ts`), bukan langsung dari
> query string, sehingga user tidak bisa membaca kelas di luar cakupannya.

> **⚠️ Timezone di Cloudflare Workers:** Runtime Worker berjalan pada **UTC**, sehingga
> `date('now', 'localtime')` menghasilkan tanggal UTC — bukan WIB (UTC+7). Antara pukul
> 00:00–07:00 WIB, tanggal UTC masih tertinggal satu hari.
>
> **Solusi:** hitung tanggal di aplikasi (bukan di SQL) dengan offset eksplisit:
>
> ```typescript
> // WIB = UTC+7
> const nowWib = new Date(Date.now() + 7 * 60 * 60 * 1000);
> const today = nowWib.toISOString().slice(0, 10); // YYYY-MM-DD
> ```
>
> Lalu teruskan sebagai parameter ke query Drizzle:
>
> ```typescript
> const rows = await db.select().from(schedules).where(eq(schedules.scheduleDate, today));
> ```
>
> Alternatif di SQL: `date('now', '+7 hours')`.

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
WHERE s.schedule_date >= date('now', '+7 hours', 'weekday 0', '-6 days')
  AND s.schedule_date <= date('now', '+7 hours', 'weekday 4')
  AND s.class_name = '1A'                          -- ★ filter kelas
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
    p.relationship
FROM users u
LEFT JOIN parents p ON p.user_id = u.id
WHERE u.username = 'sari'
  AND u.is_active = 1;
-- Password hash diverifikasi di aplikasi (PBKDF2-SHA256), bukan di SQL

-- Lalu ambil seluruh anak milik orang tua tersebut
SELECT st.id, st.name, st.class_name
FROM students st
JOIN parents p ON p.id = st.parent_id
JOIN users u ON u.id = p.user_id
WHERE u.username = 'sari'
  AND st.is_active = 1
ORDER BY st.id;
```

### 5.7 Daftar Akun Orang Tua (Admin View)

Karena satu orang tua bisa punya banyak anak, baris orang tua **tidak** boleh di-`JOIN` langsung ke `students` tanpa agregasi — kalau tidak, hasilnya berisi baris ganda. Dua pendekatan yang dipakai aplikasi:

```sql
-- (a) Agregasi anak jadi satu kolom
SELECT
    u.id,
    u.username,
    u.full_name,
    u.role,                                       -- ★ 'parent' | 'korlas'
    u.class_name,                                 -- ★ kelas yang dikoordinasi (korlas)
    p.parent_name,
    p.relationship,
    COALESCE(GROUP_CONCAT(st.name || ' (' || COALESCE(st.class_name, '-') || ')', ', '), '-') AS anak,
    u.is_active,
    u.last_login_at
FROM users u
JOIN parents p ON p.user_id = u.id                -- ★ JOIN, bukan filter role
LEFT JOIN students st ON st.parent_id = p.id
GROUP BY u.id
ORDER BY p.parent_name;

-- (b) Cari lewat nama/kelas anak tanpa baris ganda (dipakai `/parents?search=`)
SELECT u.id, u.username, p.parent_name
FROM users u
JOIN parents p ON p.user_id = u.id
WHERE EXISTS (
      SELECT 1 FROM students st
      WHERE st.parent_id = p.id
        AND (st.name LIKE '%Uji%' OR st.class_name LIKE '%Uji%')
  )
ORDER BY p.parent_name;
```

> **Kenapa `JOIN parents` dan bukan `WHERE u.role = 'parent'`?** Akun **korlas juga punya baris `parents`**
> (mereka tetap orang tua dari siswa di kelasnya), dan admin perlu melihat serta mengangkat mereka dari
> halaman yang sama. Menyaring dengan `role = 'parent'` akan menyembunyikan korlas dari daftar — jadi
> daftar akun diambil dari tabel `parents`, dan `role` hanya dipakai sebagai label/badge (`Korlas 1A`).
>
> Implementasi sebenarnya mengambil baris orang tua dulu, lalu **satu** query `WHERE parent_id IN (...)` untuk semua anak sekaligus, dan mengelompokkannya di memori — menghindari N+1 sekaligus menghindari baris ganda.

### 5.8 Cakupan Kelas (Daftar Kelas & Pemeriksaan Akses)

**Daftar kelas** tidak punya tabel — diturunkan dari tiga sumber sekaligus, lalu dinormalkan
(di-`TRIM`, dedupe) dan diurutkan natural (`2A` sebelum `10A`):

```sql
SELECT class_name FROM (
    SELECT class_name FROM students WHERE class_name IS NOT NULL AND TRIM(class_name) <> ''
    UNION
    SELECT class_name FROM users    WHERE class_name IS NOT NULL AND TRIM(class_name) <> ''
    UNION
    SELECT class_name FROM schedules WHERE TRIM(class_name) <> ''
)
ORDER BY class_name;   -- pengurutan natural dilakukan di aplikasi (localeCompare numeric)
```

**Kelas milik seorang anak (orang tua)** — dipakai untuk `GET /classes` dan pemilih kelas:

```sql
SELECT DISTINCT st.class_name
FROM students st
JOIN parents p ON p.id = st.parent_id
JOIN users   u ON u.id = p.user_id
WHERE u.id = ?            -- id user yang login
  AND st.is_active = 1
  AND st.class_name IS NOT NULL
ORDER BY st.class_name;
```

**Pemeriksaan akses kelas** (dijalankan di aplikasi, `src/api/utils/classScope.ts`):

| Role | Cakupan baca | Cakupan tulis |
|------|--------------|---------------|
| `admin` | semua kelas (`GET /classes` → seluruh daftar) | semua kelas, **wajib** menyebut `className` (jika kosong → `400 class_required`) |
| `korlas` | `[u.class_name]` | `[u.class_name]` saja; menyebut kelas lain → `403 forbidden_class` |
| `parent` | kelas semua anak aktifnya | tidak boleh menulis jadwal sama sekali |

```sql
-- Guard tingkat baris untuk PUT/DELETE /schedules/:id
-- Kelas diambil dari BARIS, bukan dari body request, supaya tidak bisa dipalsukan klien.
SELECT class_name FROM schedules WHERE id = ?;
-- lalu di aplikasi: canWriteClass(user, row.class_name) → admin: true, korlas: row == user.class_name
```

---

## 6. Drizzle ORM Schema (TypeScript)

Berikut adalah padanan skema SQL di atas dalam **Drizzle ORM** (`drizzle-orm/sqlite-core`) untuk Cloudflare D1:

```typescript
// src/database/schema.ts

import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ─── categories ───────────────────────────────────────
export const categories = sqliteTable('categories', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  name:      text('name').notNull().unique(),
  slug:      text('slug').notNull().unique(),
  color:     text('color').default('#CCCCCC'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

// ─── menus ───────────────────────────────────────────
export const menus = sqliteTable('menus', {
  id:          integer('id').primaryKey({ autoIncrement: true }),
  name:        text('name').notNull(),
  description: text('description'),
  isActive:    integer('is_active').notNull().default(1),
  isArchived:  integer('is_archived').notNull().default(0),
  createdAt:   text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt:   text('updated_at').notNull().default(sql`(datetime('now'))`),
});

// ─── menu_items ──────────────────────────────────────
export const menuItems = sqliteTable('menu_items', {
  id:          integer('id').primaryKey({ autoIncrement: true }),
  menuId:      integer('menu_id').notNull().references(() => menus.id, { onDelete: 'cascade' }),
  name:        text('name').notNull(),
  itemType:    text('item_type').notNull().default('main'), // 'main' | 'fruit' | 'drink' | 'other'
  categoryId:  integer('category_id').references(() => categories.id, { onDelete: 'set null' }),
  createdAt:   text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt:   text('updated_at').notNull().default(sql`(datetime('now'))`),
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
  createdAt:     text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ─── schedules (jadwal per kelas) ────────────────────
export const schedules = sqliteTable('schedules', {
  id:           integer('id').primaryKey({ autoIncrement: true }),
  weekId:       integer('week_id').references(() => weeks.id, { onDelete: 'set null' }),
  scheduleDate: text('schedule_date').notNull(),
  dayOfWeek:    integer('day_of_week').notNull(), // 1=Senin .. 5=Jumat
  /** ★ Kelas pemilik baris ini, mis. "1A". Wajib diisi. */
  className:    text('class_name').notNull(),
  menuId:       integer('menu_id').references(() => menus.id, { onDelete: 'set null' }),
  isHoliday:    integer('is_holiday').notNull().default(0),
  notes:        text('notes'),
  createdAt:    text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt:    text('updated_at').notNull().default(sql`(datetime('now'))`),
}, (table) => [
  // ★ Unik gabungan menggantikan .unique() pada schedule_date:
  //   satu kelas satu baris per tanggal, tetapi tanggal yang sama
  //   boleh muncul untuk kelas berbeda.
  uniqueIndex('idx_schedules_date_class').on(table.scheduleDate, table.className),
  index('idx_schedules_week').on(table.weekId),
  index('idx_schedules_menu').on(table.menuId),
  index('idx_schedules_class').on(table.className),
]);

// ─── holidays (global, sekolah-wide) ─────────────────
export const holidays = sqliteTable('holidays', {
  id:          integer('id').primaryKey({ autoIncrement: true }),
  date:        text('date').notNull().unique(),
  name:        text('name').notNull(),
  description: text('description'),
  createdAt:   text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ─── users (Admin, Korlas & Orang Tua) ───────────────
export const users = sqliteTable('users', {
  id:           integer('id').primaryKey({ autoIncrement: true }),
  username:     text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  fullName:     text('full_name'),
  email:        text('email'),
  phone:        text('phone'),
  role:         text('role').notNull().default('parent'), // 'admin' | 'korlas' | 'parent'
  /** ★ Kelas yang dikoordinasi — hanya bermakna untuk role 'korlas'. */
  className:    text('class_name'),
  isActive:     integer('is_active').notNull().default(1),
  lastLoginAt:  text('last_login_at'),
  createdAt:    text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt:    text('updated_at').notNull().default(sql`(datetime('now'))`),
});

// ─── parents (Profil Orang Tua) ─────────────────────
export const parents = sqliteTable('parents', {
  id:           integer('id').primaryKey({ autoIncrement: true }),
  userId:       integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  parentName:   text('parent_name').notNull(),
  relationship: text('relationship').notNull().default('ibu'), // 'ibu' | 'ayah' | 'wali'
  phone:        text('phone'),
  address:      text('address'),
  isActive:     integer('is_active').notNull().default(1),
  createdAt:    text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt:    text('updated_at').notNull().default(sql`(datetime('now'))`),
});

// ─── students (Anak — satu orang tua boleh banyak) ───
export const students = sqliteTable(
  'students',
  {
    id:        integer('id').primaryKey({ autoIncrement: true }),
    parentId:  integer('parent_id').notNull()
                 .references(() => parents.id, { onDelete: 'cascade' }),
    name:      text('name').notNull(),
    className: text('class_name'),
    isActive:  integer('is_active').notNull().default(1),
    createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
    updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
  },
  (table) => [
    index('idx_students_parent_id').on(table.parentId),
    index('idx_students_class').on(table.className),
  ],
);

// ─── settings ────────────────────────────────────────
export const settings = sqliteTable('settings', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  key:       text('key').notNull().unique(),
  value:     text('value'),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

// ─── import_logs ─────────────────────────────────────
export const importLogs = sqliteTable('import_logs', {
  id:           integer('id').primaryKey({ autoIncrement: true }),
  sourceFile:   text('source_file').notNull(),
  recordsAdded: integer('records_added').notNull().default(0),
  status:       text('status').notNull().default('success'),
  errorMessage: text('error_message'),
  importedAt:   text('imported_at').notNull().default(sql`(datetime('now'))`),
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
★ Satu tanggal                    →   schedules × jumlah kelas (satu baris per kelas)
★ Daftar kelas                    →   turunan students.class_name ∪ users.class_name ∪ schedules.class_name
```

> **★ Ekspansi per kelas:** file sumber **tidak** memuat informasi kelas — ia hanya berisi tanggal
> dan menu (model lama "satu jadwal untuk seluruh sekolah"). Sejak jadwal disimpan per kelas,
> `scripts/seed.ts` mendaftar kelas yang ada (diturunkan dari `STUDENTS`) lalu menulis **satu baris
> `schedules` untuk setiap kelas pada setiap tanggal**. Karena itu 43 tanggal menjadi **129 baris**
> (43 × 3 kelas). Bila kelak sekolah ingin jadwal berbeda antar kelas, yang perlu diubah hanya
> pasangan `(tanggal, kelas)` tertentu — struktur tabelnya sudah mendukung tanpa migrasi baru.

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
| `schedules` | `schedule_date`, `class_name` | `idx_schedules_date_class` (**UNIQUE**) | ★ Unik gabungan: satu kelas satu baris per tanggal, sekaligus index utama query "hari ini" & "minggu ini" **per kelas** |
| `schedules` | `class_name` | `idx_schedules_class` | Daftar kelas turunan + filter kelas pada semua pembacaan |
| `schedules` | `week_id` | `idx_schedules_week` | Filter by minggu |
| `schedules` | `menu_id` | `idx_schedules_menu` | Cari semua tanggal untuk menu tertentu |
| `menus` | `name` | `idx_menus_name` | Pencarian menu by nama |
| `menus` | `is_active` | `idx_menus_active` | Filter menu aktif |
| `menu_items` | `menu_id` | `idx_menu_items_menu_id` | Join ke parent menu |
| `menu_items` | `name` | `idx_menu_items_name` | Pencarian item by nama |
| `menu_items` | `item_type` | `idx_menu_items_type` | Filter main vs fruit |
| `categories` | `slug` | `idx_categories_slug` | Lookup kategori by slug |
| `weeks` | `month, year` | `idx_weeks_month_year` | Filter minggu by bulan |
| `users` | `role` | `idx_users_role` | Filter user by role (admin/korlas/parent) |
| `users` | `is_active` | `idx_users_active` | Filter user aktif/nonaktif |
| `parents` | `user_id` | `idx_parents_user_id` | Join parent → user |
| `parents` | `is_active` | `idx_parents_active` | Filter parent aktif/nonaktif |
| `students` | `parent_id` | `idx_students_parent_id` | Ambil semua anak satu orang tua (menghindari N+1) |
| `students` | `class_name` | `idx_students_class` | Filter/pencarian berdasarkan kelas anak |

> **Kenapa `idx_schedules_date` dihapus?** Index tunggal pada `schedule_date` menjadi mubazir setelah
> ada `idx_schedules_date_class` — kolom paling kiri dari index gabungan sudah melayani pencarian
> berbasis tanggal, dan SQLite bisa memakainya untuk prefix `schedule_date`. Migrasi `0002` karena itu
> `DROP INDEX idx_schedules_date` sebelum membuat index gabungan penggantinya.
>
> **Catatan `UNIQUE` + kelas:** karena `class_name` **`NOT NULL`**, keunikan gabungan berperilaku
> persis seperti yang diharapkan — tidak ada masalah "`NULL` selalu dianggap berbeda" yang membuat
> index unik bocor (inilah salah satu alasan model sentinel `'*'` nullable ditolak).

---

## 9. Migration Plan (Cloudflare D1)

### Step 1: Buat Database D1

```bash
bunx wrangler d1 create pizza-snack-play
```

Salin `database_id` yang dihasilkan ke `wrangler.json` pada bagian `d1_databases[0].database_id`,
lalu isi `.env`:

```
CLOUDFLARE_ACCOUNT_ID=<dari dashboard>
CLOUDFLARE_DATABASE_ID=<database_id>
CLOUDFLARE_D1_TOKEN=<API token dengan izin D1 edit>
```

### Step 2: Generate File Migrasi dari Drizzle Schema

```bash
bunx drizzle-kit generate
```

Perintah ini membaca `src/database/schema.ts` dan menghasilkan file SQL di folder `drizzle/migrations/`.

> **Penting:** `drizzle.config.ts` mengarahkan `out` ke `./drizzle/migrations` dan `wrangler.json`
> memakai `migrations_dir: "drizzle/migrations"`. `drizzle/seed.sql` **harus tetap di luar** folder
> itu — wrangler mengeksekusi setiap file `.sql` di dalam `migrations_dir` sebagai migrasi, sehingga
> seed yang diletakkan di sana akan ikut dijalankan sebagai migrasi dan gagal.

> **⚠️ Migrasi yang di-generate tidak selalu bisa dijalankan — periksa manual.** Kasus nyata terjadi
> pada migrasi jadwal per kelas: `drizzle-kit generate` menghasilkan
> `ALTER TABLE schedules ADD class_name text NOT NULL`, dan SQLite **menolak** perintah itu karena
> tabel `schedules` sudah berisi data (`Cannot add a NOT NULL column with default value NULL`).
> File migrasi `0002_*.sql` karena itu **ditulis ulang manual** menjadi rebuild tabel:
>
> ```sql
> -- 1) kolom baru di users (nullable → aman)
> ALTER TABLE users ADD COLUMN class_name text;
>
> -- 2) lepas index unik lama pada schedule_date
> DROP INDEX IF EXISTS idx_schedules_date;
>
> -- 3) bangun tabel baru dengan class_name NOT NULL
> CREATE TABLE schedules_new ( ... class_name text NOT NULL, ... );
>
> -- 4) salin data lama ke SETIAP kelas yang dikenal (students ∪ korlas users)
> INSERT INTO schedules_new (week_id, schedule_date, day_of_week, class_name, menu_id, is_holiday, notes, created_at, updated_at)
> SELECT s.week_id, s.schedule_date, s.day_of_week, c.class_name, s.menu_id, s.is_holiday, s.notes, s.created_at, s.updated_at
> FROM schedules s
> CROSS JOIN (
>     SELECT class_name FROM students WHERE class_name IS NOT NULL
>     UNION
>     SELECT class_name FROM users WHERE role = 'korlas' AND class_name IS NOT NULL
> ) c;
>
> -- 4b) jaring pengaman: bila belum ada kelas sama sekali, jangan buang data
> INSERT INTO schedules_new (...)
> SELECT ..., 'Umum', ... FROM schedules s
> WHERE NOT EXISTS (SELECT 1 FROM schedules_new);
>
> -- 5) tukar tabel & bangun ulang index
> DROP TABLE schedules;
> ALTER TABLE schedules_new RENAME TO schedules;
> CREATE UNIQUE INDEX idx_schedules_date_class ON schedules(schedule_date, class_name);
> CREATE INDEX idx_schedules_week  ON schedules(week_id);
> CREATE INDEX idx_schedules_menu  ON schedules(menu_id);
> CREATE INDEX idx_schedules_class ON schedules(class_name);
> ```
>
> **Pelajaran:** untuk perubahan kolom `NOT NULL` pada SQLite/D1, **selalu** rebuild tabel — dan
> periksa SQL hasil `drizzle-kit generate` sebelum diterapkan, karena generator tidak tahu apakah
> tabel sudah berisi data.

### Step 3: Terapkan Migrasi ke D1

```bash
# Remote (Cloudflare D1)
bunx drizzle-kit migrate

# Alternatif: terapkan langsung ke D1 lokal (untuk dev offline)
bunx wrangler d1 migrations apply pizza-snack-play --local
```

### Step 4: Seed Data

Seed dijalankan sebagai script yang memakai binding D1. Buat file `scripts/seed.ts` lalu jalankan
via `wrangler d1 execute`, atau lewat endpoint admin sementara.

```bash
# Opsi A: eksekusi SQL seed langsung ke D1
bunx wrangler d1 execute pizza-snack-play --remote --file=./drizzle/seed.sql

# Opsi B: seed lokal untuk development
bunx wrangler d1 execute pizza-snack-play --local --file=./drizzle/seed.sql
```

Isi `drizzle/seed.sql` diambil dari **Section 4 (Sample Data)** dokumen ini — kategori,
menu, menu_items, weeks, schedules, holidays, users, dan parents.

### Step 5: Verifikasi

```bash
# Cek tabel yang terbentuk
bunx wrangler d1 execute pizza-snack-play --remote --command="SELECT name FROM sqlite_master WHERE type='table'"

# Cek jumlah jadwal (harus 129 = 43 tanggal × 3 kelas)
bunx wrangler d1 execute pizza-snack-play --remote --command="SELECT COUNT(*) FROM schedules"

# ★ Cek sebaran per kelas — pastikan tidak ada kelas yang tertinggal
bunx wrangler d1 execute pizza-snack-play --remote --command="SELECT class_name, COUNT(*) FROM schedules GROUP BY class_name ORDER BY class_name"

# ★ Cek tidak ada baris yatim (tanggal yang tidak terwakili semua kelas)
bunx wrangler d1 execute pizza-snack-play --remote --command="SELECT schedule_date, COUNT(DISTINCT class_name) AS kelas FROM schedules GROUP BY schedule_date HAVING kelas < 3"

# ★ Daftar kelas turunan (yang dipakai GET /api/classes)
bunx wrangler d1 execute pizza-snack-play --remote --command="SELECT class_name FROM (SELECT class_name FROM students WHERE class_name IS NOT NULL UNION SELECT class_name FROM users WHERE class_name IS NOT NULL UNION SELECT class_name FROM schedules) ORDER BY class_name"
```

> **Baseline hasil migrasi `0002` (terverifikasi lokal):** 43 baris lama → **129 baris**,
> 3 kelas (1A, 1B, 2A), **0 baris yatim**, dan jumlahnya identik dengan `drizzle/seed.sql`
> yang di-generate ulang — jadi data lama dan data seed baru konsisten.

### Ringkasan Perintah

| Perintah | Fungsi |
|----------|--------|
| `bunx wrangler d1 create <name>` | Buat database D1 baru |
| `bunx drizzle-kit generate` | Generate file migrasi dari schema |
| `bunx drizzle-kit migrate` | Terapkan migrasi ke D1 remote |
| `bunx drizzle-kit push` | Push schema langsung (prototyping) |
| `bunx drizzle-kit studio` | GUI inspeksi database |
| `bunx wrangler d1 execute <name> --remote --command="..."` | Jalankan SQL di D1 remote |
| `bunx wrangler d1 execute <name> --local --command="..."` | Jalankan SQL di D1 lokal |
| `bunx wrangler d1 export <name> --output=backup.sql` | Backup isi database |

---

## 10. Catatan Khusus Cloudflare D1

| Aspek | Catatan |
|-------|---------|
| **Tipe SQLite** | D1 berbasis SQLite — DDL di Section 2 berlaku tanpa perubahan |
| **Foreign keys** | D1 mengaktifkan `PRAGMA foreign_keys` secara default |
| **Transaksi** | Tidak ada transaksi interaktif panjang; gunakan `db.batch([...])` |
| **Statement size** | Batas ukuran query ~100 KB per statement |
| **Parameter** | Maksimum ~100 bound parameter per query (gunakan batch untuk insert besar) |
| **Row size** | Maksimum ~1 MB per row |
| **Latency** | Query dari Worker ke D1 di region yang sama sangat rendah |
| **Backup** | Terkelola oleh Cloudflare; backup logis tambahan via `wrangler d1 export` |
| **Local dev** | `wrangler dev` menyediakan D1 lokal (miniflare) — data terpisah dari remote |
| **Timezone** | Worker berjalan di UTC. `datetime('now','localtime')` = UTC. Untuk WIB gunakan `date('now','+7 hours')` atau hitung di aplikasi |
| **Migration tracking** | `drizzle-kit` mencatat migrasi di tabel `d1_migrations` (dikelola wrangler) |
| **`ADD COLUMN ... NOT NULL`** | **Ditolak** bila tabel sudah berisi data (tanpa `DEFAULT`). Untuk kolom wajib baru: rebuild tabel (`CREATE ..._new` → `INSERT ... SELECT` → `DROP` → `RENAME`). Lihat catatan migrasi `0002` di Step 2 |
| **`UNIQUE` + kolom nullable** | SQLite menganggap setiap `NULL` **berbeda**, sehingga baris dengan kolom `NULL` tidak saling bentrok di index unik. Karena itu `schedules.class_name` dibuat `NOT NULL` — agar `UNIQUE(schedule_date, class_name)` benar-benar menegakkan "satu kelas satu baris per tanggal" |

---

_Dokumen ini melengkapi PRD Pizza Snack Play dan menjadi referensi teknis untuk implementasi database._
