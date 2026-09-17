<div align="center">

# Pizza Snack Play

**Aplikasi manajemen & informasi jadwal piket snack sekolah**

Setiap orang tua memiliki akun login pribadi untuk melihat jadwal menu snack harian, mingguan, dan bulanan.

![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white)
![Hono](https://img.shields.io/badge/Hono-v4.12-E36002?style=for-the-badge&logo=hono&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-v6.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![React](https://img.shields.io/badge/React-v19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)

</div>

---

## Tentang Aplikasi

Jadwal piket snack sekolah sebelumnya disusun dalam dokumen teks manual — sulit dicari, tidak ada riwayat, dan orang tua harus bertanya untuk tahu menu hari ini. **Pizza Snack Play** mendigitalkan seluruh proses tersebut: admin mengelola menu & jadwal, orang tua login untuk melihat jadwal, dan koperasi dapat mengekspor daftar persiapan.

---

## Fitur Utama

| Fitur | Deskripsi | Role |
|-------|-----------|------|
| **Manajemen Menu** | Buat/edit/hapus menu snack (makanan utama + buah pendamping), dengan katalog untuk dipakai ulang | Admin |
| **Manajemen Jadwal** | Atur jadwal harian, mingguan, bulanan; duplikasi jadwal antar minggu; override per tanggal | Admin |
| **Autentikasi Wajib** | Setiap orang tua login dengan akun pribadi yang dibuat admin | Semua |
| **Role-Based Access** | `admin` (CRUD penuh + kelola akun) vs `parent` (read-only jadwal) | Semua |
| **Kelola Akun Orang Tua** | Admin membuat, edit, menonaktifkan, dan reset password akun orang tua | Admin |
| **Kategori & Filter** | Filter menu by kategori (gorengan, kukusan, buah, dll.) | Semua |
| **Pencarian Menu** | Cari kapan menu/buah tertentu disajikan | Semua |
| **Ekspor** | PDF jadwal mingguan/bulanan, Excel untuk perencanaan koperasi | Admin, Parent |

---

## Tech Stack

Aplikasi ini dibangun dengan **BHVR** — **B**un + **H**ono + **V**ite + **R**eact.

| Lapisan | Teknologi | Keterangan |
|---------|-----------|-----------|
| **Runtime & Package Manager** | [Bun](https://bun.sh/) | Runtime cepat untuk tooling, install, dan script |
| **Backend API** | [Hono](https://hono.dev/) | Web framework ultrafast, berjalan di Cloudflare Workers |
| **Build Tool** | [Vite](https://vitejs.dev/) | Dev server dengan HMR instan + build produksi teroptimasi |
| **Frontend** | [React 19](https://react.dev/) | Library UI + [React Router v7](https://reactrouter.com/) + [TanStack Query](https://tanstack.com/query) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Utility-first CSS via `@tailwindcss/vite` |
| **Database** | [Cloudflare D1](https://developers.cloudflare.com/d1/) | Serverless SQLite terintegrasi dengan Workers |
| **ORM** | [Drizzle ORM](https://orm.drizzle.team/) | Type-safe ORM (`drizzle-orm/sqlite-core`) |
| **Deployment** | [Cloudflare Workers](https://workers.cloudflare.com/) | Serverless edge runtime, aset statis dari `./dist/client` |
| **Validasi** | [Zod](https://zod.dev/) | Schema validation untuk input API |
| **HTTP Client** | [ky](https://github.com/sindresorhus/ky) | Fetch wrapper untuk service layer frontend |

---

## Struktur Proyek

```
pizza-snack-play/
├── public/                       # Static assets
├── src/
│   ├── api/                      # Cloudflare Worker — Hono backend
│   │   ├── index.ts              # Worker entry point (basePath /api)
│   │   ├── auth/                 # Login, logout, me, ubah password
│   │   ├── parents/              # CRUD akun orang tua
│   │   ├── menus/                # CRUD menu snack
│   │   ├── schedules/            # CRUD jadwal
│   │   ├── categories/           # CRUD kategori
│   │   ├── reports/              # Ekspor PDF/Excel + statistik
│   │   ├── user/                 # Contoh fitur dari template
│   │   └── utils/response.ts     # Helper responseOK / responseError
│   ├── database/
│   │   ├── db.ts                 # Inisialisasi Drizzle + D1 binding
│   │   └── schema.ts             # Drizzle schema (11 tabel)
│   ├── routes/                   # React Router — halaman frontend
│   │   ├── __root.tsx            # Root layout
│   │   ├── index.tsx             # Menu hari ini
│   │   ├── login.tsx             # Halaman login
│   │   ├── week.tsx              # Jadwal mingguan
│   │   ├── month.tsx             # Jadwal bulanan
│   │   ├── profile.tsx           # Profil — ubah password
│   │   └── admin/                # Dashboard, menu, jadwal, kelola orang tua
│   ├── services/                 # Service layer frontend (API client)
│   ├── lib/http.ts               # HTTP client (ky) wrapper
│   ├── types/apiResponse.ts      # Tipe ApiResponse
│   ├── assets/                   # SVG / gambar
│   ├── index.css                 # Global styles (Tailwind)
│   ├── main.tsx                  # React + Router entry point
│   └── routeTree.gen.ts          # Auto-generated route tree
├── drizzle/                      # Folder migrasi D1
├── docs/
│   ├── PRD_Pizza_Snack_Play.md
│   └── Struktur_Tabel_Pizza_Snack_Play.md
├── .env.example
├── drizzle.config.ts
├── vite.config.ts
├── wrangler.json                 # Konfigurasi Cloudflare Worker + D1
└── package.json
```

### Pola Arsitektur Backend

Setiap fitur backend mengikuti pola **N-Layered**:

```
route.ts → controller.ts → service.ts → repository.ts
   │            │              │              │
 endpoint   validasi &    business      akses data
 & method   response      logic         via Drizzle
```

Path alias: `@/*` (frontend) dan `@api/*` (backend).

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

Detail DDL, Drizzle schema, seed data, dan query contoh: [`docs/Struktur_Tabel_Pizza_Snack_Play.md`](docs/Struktur_Tabel_Pizza_Snack_Play.md)

---

## API Endpoints

Semua endpoint berada di bawah `basePath /api`. Kecuali `POST /api/auth/login`, seluruh endpoint memerlukan JWT.

| Grup | Endpoint | Role |
|------|----------|------|
| **Auth** | `POST /auth/login` · `POST /auth/logout` · `GET /auth/me` · `PUT /auth/password` | Public → Authenticated |
| **Parents** | `GET/POST/PUT/DELETE /parents` | Admin |
| **Menus** | `GET/POST/PUT/DELETE /menus` | Admin (Parent: GET) |
| **Schedules** | `GET /schedules/today` · `/week` · `/month` · `POST/DELETE` | Admin (Parent: GET) |
| **Categories** | `GET/POST /categories` | Admin (Parent: GET) |
| **Reports** | `GET /reports/.../pdf` · `/excel` · `/stats` | Admin, Parent |

Detail lengkap: [`docs/PRD_Pizza_Snack_Play.md`](docs/PRD_Pizza_Snack_Play.md) section 7.

---

## Cara Menjalankan

### Prasyarat

- [Bun](https://bun.sh/) v1.x — `curl -fsSL https://bun.sh/install | bash`
- Akun Cloudflare (untuk D1 & deploy)

### Instalasi

```bash
# 1. Install dependencies
bun install

# 2. Salin environment template
cp .env.example .env

# 3. Buat database D1
bunx wrangler d1 create pizza-snack-play
```

### Konfigurasi D1

Setelah `d1 create`, salin `database_id` ke `wrangler.json`, lalu isi `.env`:

```
CLOUDFLARE_ACCOUNT_ID=<dari Cloudflare Dashboard → Workers & Pages → Overview>
CLOUDFLARE_DATABASE_ID=<database_id dari langkah 3>
CLOUDFLARE_D1_TOKEN=<API token dengan izin D1 edit>
JWT_SECRET=<random string untuk signing JWT>
```

> `JWT_SECRET` untuk produksi disimpan sebagai Worker Secret: `bunx wrangler secret put JWT_SECRET`

### Migrasi & Seed

```bash
# Generate file migrasi dari Drizzle schema
bunx drizzle-kit generate

# Terapkan ke D1
bunx drizzle-kit migrate

# Seed data awal
bunx wrangler d1 execute pizza-snack-play --remote --file=./drizzle/seed.sql
```

### Development

```bash
bun run dev
```

Dev server berjalan di **http://localhost:5173** — logika Worker terintegrasi langsung di dalam Vite dev server.

### Build & Preview

```bash
bun run build      # TypeScript check + Vite build
bun run preview    # Preview hasil build secara lokal
```

### Deploy

```bash
bun run deploy     # Build + deploy ke Cloudflare Workers
```

### Validasi Penuh

```bash
bun run check      # tsc + vite build + wrangler deploy --dry-run
bun run lint       # ESLint
```

---

## Scripts

| Script | Perintah | Fungsi |
|--------|----------|--------|
| `dev` | `vite` | Dev server dengan HMR |
| `build` | `tsc -b && vite build` | Build produksi |
| `preview` | `vite preview` | Preview hasil build |
| `deploy` | `bun run build && wrangler deploy --env production` | Deploy ke Cloudflare |
| `check` | `tsc && vite build && wrangler deploy --dry-run` | Validasi penuh |
| `lint` | `eslint .` | Cek kualitas kode |
| `cf-typegen` | `wrangler types` | Generate tipe dari binding |
| `db:generate` | `drizzle-kit generate` | Generate migrasi |
| `db:migrate` | `drizzle-kit migrate` | Terapkan migrasi |
| `db:push` | `drizzle-kit push` | Push schema langsung (dev) |
| `db:studio` | `drizzle-kit studio` | GUI inspeksi database |

---

## Akun Default (Seed)

| Username | Role | Nama |
|----------|------|------|
| `admin` | admin | Bu Guru Sari |
| `sari` | parent | Ibu Sari — siswa: Aisyah Sari (1A) |
| `budi` | parent | Pak Budi — siswa: Bagas Budi (1A) |
| `dewi` | parent | Ibu Dewi — siswa: Citra Dewi (1B) |

> Password default: `snack123` — **wajib diganti** saat login pertama.

---

## Roadmap

| Phase | Scope | Status |
|-------|-------|--------|
| **1. MVP** | Scaffold project, skema DB, migrasi D1, backend CRUD, autentikasi JWT, RBAC, kelola akun orang tua, frontend login + jadwal, seed data | Scaffold & skema selesai |
| **2. Admin Dashboard** | Dashboard lengkap, manajemen jadwal mingguan/bulanan, duplikasi jadwal, kategori & tagging | Pending |
| **3. Ekspor & Cetak** | Ekspor PDF mingguan/bulanan, Excel, cetak dari browser | Pending |
| **4. Notifikasi** | Push notification (PWA), WhatsApp broadcast (opsional) | Pending |

---

## Catatan Teknis

- **Timezone:** Worker berjalan di UTC. Untuk WIB (UTC+7) gunakan `date('now','+7 hours')` atau hitung offset di aplikasi — jangan andalkan `localtime`.
- **Password hashing:** Gunakan Web Crypto API (PBKDF2) yang edge-native, atau `bcryptjs` dengan flag `nodejs_compat`.
- **Transaksi D1:** Tidak ada transaksi interaktif panjang — gunakan `db.batch([...])`.
- **Secrets:** `JWT_SECRET` dan token Cloudflare disimpan sebagai Worker Secret, bukan di repo.
- **Local vs Remote D1:** `wrangler dev` memakai D1 lokal (miniflare) yang datanya terpisah dari remote.

---

## Dokumentasi

- [PRD — Product Requirements Document v1.2](docs/PRD_Pizza_Snack_Play.md)
- [Struktur Tabel — DDL + Drizzle + Seed + Queries](docs/Struktur_Tabel_Pizza_Snack_Play.md)

## Sumber Data

Jadwal piket snack berasal dari `D:\WORKS\1pis\sekolahku\jadwal_piket_snack_pizza_snack_play.txt`:

- **Agustus 2026** — 5 minggu (3–31 Agustus 2026)
- **September 2026** — 5 minggu (1–30 September 2026)

Setiap hari kerja (Senin–Jumat): **makanan utama + buah pendamping**.

---

## Kredit

Di-scaffold dari template [ZulfiFazhar/bhvr-template](https://github.com/ZulfiFazhar/bhvr-template).

## Lisensi

Private — untuk penggunaan internal sekolah.
