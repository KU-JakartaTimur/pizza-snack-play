# Pizza Snack Play

> Aplikasi manajemen dan informasi jadwal piket snack sekolah.
> Setiap orang tua memiliki akun login pribadi untuk melihat jadwal menu snack harian, mingguan, dan bulanan.

---

## Stack BHVR

| Lapisan | Teknologi | Keterangan |
|---------|-----------|-----------|
| **B**un | Runtime | JavaScript/TypeScript runtime cepat, built-in SQLite (`bun:sqlite`) |
| **H**ono | Backend | Web framework ringan, ultrafast, middleware-based |
| **V**ue 3 | Frontend | SPA reaktif, Composition API, Pinia state management |
| **R** SQLite | Database | Embedded single-file DB via `bun:sqlite` + Drizzle ORM |

---

## Fitur Utama

- **Manajemen Menu** — admin buat/edit/hapus menu snack (makanan utama + buah pendamping)
- **Manajemen Jadwal** — atur jadwal harian, mingguan, bulanan; duplikasi jadwal antar minggu
- **Autentikasi Wajib** — setiap orang tua login dengan akun pribadi yang dibuat admin
- **Role-Based Access** — `admin` (CRUD penuh + kelola akun) vs `parent` (read-only jadwal)
- **Kelola Akun Orang Tua** — admin buat, edit, nonaktifkan, reset password orang tua
- **Kategori & Filter** — filter menu by kategori (gorengan, kukusan, buah, dll.)
- **Pencarian Menu** — cari kapan menu/buah tertentu disajikan
- **Ekspor** — PDF jadwal mingguan/bulanan, Excel untuk perencanaan koperasi

---

## Struktur Proyek

```
pizza-snack-play/
├── docs/
│   ├── PRD_Pizza_Snack_Play.md           # Product Requirements Document v1.1
│   └── Struktur_Tabel_Pizza_Snack_Play.md # DDL + Drizzle schema + seed + queries
├── src/
│   ├── server/                           # Backend Hono + Bun
│   │   ├── index.ts                      # Entry point
│   │   ├── routes/
│   │   │   ├── auth.ts                   # Login, logout, me, ubah password
│   │   │   ├── parents.ts                # CRUD akun orang tua (admin)
│   │   │   ├── menus.ts                  # CRUD menu
│   │   │   ├── schedules.ts              # CRUD jadwal
│   │   │   ├── categories.ts            # CRUD kategori
│   │   │   └── reports.ts               # Ekspor PDF/Excel + statistik
│   │   ├── middleware/
│   │   │   ├── auth.ts                   # JWT/session auth (wajib)
│   │   │   ├── role.ts                  # RBAC (admin/parent)
│   │   │   └── error.ts                 # Error handler
│   │   ├── services/
│   │   ├── db/
│   │   │   ├── schema.ts                # Drizzle schema (11 tabel)
│   │   │   ├── connection.ts            # bun:sqlite init
│   │   │   └── migrations/
│   │   └── utils/
│   ├── client/                           # Frontend Vue 3
│   │   ├── src/
│   │   │   ├── views/
│   │   │   │   ├── LoginView.vue
│   │   │   │   ├── HomeView.vue
│   │   │   │   ├── TodayView.vue
│   │   │   │   ├── WeekView.vue
│   │   │   │   ├── MonthView.vue
│   │   │   │   ├── ProfileView.vue      # Orang tua: ubah password
│   │   │   │   ├── AdminDashboard.vue
│   │   │   │   ├── MenuManager.vue
│   │   │   │   ├── ScheduleManager.vue
│   │   │   │   └── ParentManager.vue    # Admin: kelola akun orang tua
│   │   │   ├── stores/                   # Pinia
│   │   │   ├── components/
│   │   │   └── api/                      # API client
│   │   └── vite.config.ts
│   └── shared/
│       └── types.ts
├── data/
│   └── pizza_snack_play.db               # SQLite database file
├── package.json
├── bunfig.toml
├── drizzle.config.ts
└── tsconfig.json
```

---

## Database Schema (11 Tabel)

| Tabel | Peran |
|-------|-------|
| `categories` | Kategori menu (gorengan, kukusan, buah segar, roti, dll.) |
| `menus` | Definisi menu (kombinasi main + fruit), dapat dipakai ulang |
| `menu_items` | Komponen individual dalam menu (makanan utama / buah) |
| `menu_categories` | Relasi many-to-many menu ↔ kategori |
| `weeks` | Periode mingguan (Senin–Jumat) |
| `schedules` | Tabel inti — tanggal → menu, dengan flag `is_holiday` |
| `holidays` | Daftar hari libur nasional/sekolah |
| `users` | Akun login (admin & orang tua), JWT auth, password hashing |
| `parents` | Profil orang tua (nama, nama siswa, kelas, hubungan) |
| `settings` | Konfigurasi global (nama sekolah, tahun ajaran) |
| `import_logs` | Audit trail impor data dari file teks |

Lihat detail DDL, Drizzle ORM schema, seed data, dan query contoh di [`docs/Struktur_Tabel_Pizza_Snack_Play.md`](docs/Struktur_Tabel_Pizza_Snack_Play.md).

---

## API Endpoints

| Grup | Endpoint | Role |
|------|----------|------|
| **Auth** | `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `PUT /api/auth/password` | Public → Authenticated |
| **Parents** | `GET/POST/PUT/DELETE /api/parents` | Admin |
| **Menus** | `GET/POST/PUT/DELETE /api/menus` | Admin (Parent: GET only) |
| **Schedules** | `GET /api/schedules/today`, `/week`, `/month`; `POST/DELETE` untuk set/hapus | Admin (Parent: GET only) |
| **Categories** | `GET/POST /api/categories` | Admin (Parent: GET only) |
| **Reports** | `GET /api/reports/.../pdf`, `/excel`, `/stats` | Admin, Parent |

Lihat detail lengkap di [`docs/PRD_Pizza_Snack_Play.md`](docs/PRD_Pizza_Snack_Play.md) section 7.

---

## Cara Menjalankan

### Prasyarat

- [Bun](https://bun.sh/) v1.x terinstall
- Node.js 18+ (untuk Vite build frontend)

### Instalasi

```bash
# Clone project
cd D:\REACT-DEV\pizza-snack-play

# Install dependencies
bun install

# Buat database & jalankan migrasi
bun run src/server/db/migrate.ts

# Seed data kategori
bun run src/server/db/seed-categories.ts

# Seed data jadwal dari file teks asli
bun run src/server/db/seed-from-file.ts --file="data/jadwal_piket_snack_pizza_snack_play.txt"
```

### Development

```bash
# Jalankan backend + frontend (dev mode)
bun dev

# Build frontend (Vue → dist)
bun run build

# Jalankan production
bun start
```

Server berjalan di `http://localhost:3000`

---

## Akun Default

Setelah seed, akun berikut tersedia untuk testing:

| Username | Role | Nama |
|----------|------|------|
| `admin` | admin | Bu Guru Sari |
| `sari` | parent | Ibu Sari (siswa: Aisyah Sari, kelas 1A) |
| `budi` | parent | Pak Budi (siswa: Bagas Budi, kelas 1A) |
| `dewi` | parent | Ibu Dewi (siswa: Citra Dewi, kelas 1B) |

> Password default: `snack123` (segera ubah setelah login pertama)

---

## Roadmap

| Phase | Scope | Status |
|-------|-------|--------|
| **1. MVP** | Skema DB, backend CRUD, autentikasi JWT, RBAC, kelola akun orang tua, frontend login + jadwal, seed data | Skema DB selesai |
| **2. Admin Dashboard** | Dashboard lengkap, manajemen jadwal mingguan/bulanan, duplikasi jadwal, kategori & tagging | Pending |
| **3. Ekspor & Cetak** | Ekspor PDF mingguan/bulanan, Excel, cetak dari browser | Pending |
| **4. Notifikasi** | Push notification (PWA), WhatsApp broadcast (opsional) | Pending |

---

## Dokumentasi

- [PRD — Product Requirements Document v1.1](docs/PRD_Pizza_Snack_Play.md)
- [Struktur Tabel — DDL + Drizzle + Seed + Queries](docs/Struktur_Tabel_Pizza_Snack_Play.md)

---

## Sumber Data

Data jadwal piket snack berasal dari file:
`D:\WORKS\1pis\sekolahku\jadwal_piket_snack_pizza_snack_play.txt`

Berisi jadwal snack untuk:
- **Agustus 2026** — 5 minggu (3–31 Agustus 2026)
- **September 2026** — 5 minggu (1–30 September 2026)

Setiap hari kerja (Senin–Jumat) memiliki kombinasi: **makanan utama + buah pendamping**.

---

## Lisensi

Private — untuk penggunaan internal sekolah.
