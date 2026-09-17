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

Jadwal piket snack sekolah sebelumnya disusun dalam dokumen teks manual — sulit dicari, tidak ada riwayat, dan orang tua harus bertanya untuk tahu menu hari ini. **Pizza Snack Play** mendigitalkan seluruh proses tersebut: admin mengelola menu & jadwal, orang tua login untuk melihat jadwal harian, mingguan, dan bulanan.

---

## Fitur

| Fitur | Deskripsi | Role | Status |
|-------|-----------|------|--------|
| **Autentikasi Wajib** | Setiap orang tua login dengan akun pribadi yang dibuat admin | Semua | ✅ |
| **Role-Based Access** | `admin` (penuh), `korlas` (koordinator kelas), `parent` (read-only) | Semua | ✅ |
| **Jadwal Per Kelas** | Setiap kelas punya jadwalnya sendiri — menu 1A boleh beda dari 1B | Semua | ✅ |
| **Pemilih Kelas** | Admin & orang tua multi-kelas memilih kelas yang ditampilkan | Admin, Parent | ✅ |
| **Jadwal Hari Ini** | Menu snack hari ini + ringkasan minggu berjalan | Semua | ✅ |
| **Jadwal Mingguan** | Senin–Jumat dengan navigasi antar minggu | Semua | ✅ |
| **Jadwal Bulanan** | Rekap per minggu dengan statistik hari sekolah/libur | Semua | ✅ |
| **Manajemen Menu** | CRUD menu (makanan utama + buah pendamping) + kategori | Admin, Korlas | ✅ |
| **Kelola Jadwal** | Tetapkan menu per tanggal, tandai libur kelas, tambah catatan | Admin, Korlas | ✅ |
| **Salin Jadwal Antar Minggu** | Duplikasi jadwal Senin–Jumat ke minggu lain, opsional timpa | Admin, Korlas | ✅ |
| **Kelola Hari Libur** | Tambah/hapus hari libur bernama (berlaku semua kelas) | Admin | ✅ |
| **Pencarian Riwayat Menu** | "Kapan jeruk pernah disajikan?" — cari menu/komponen lintas bulan | Semua | ✅ |
| **Kelola Akun Orang Tua** | Buat, ubah, nonaktifkan, hapus, reset password — satu akun boleh punya **lebih dari satu anak**, dan dapat diangkat menjadi **korlas** | Admin | ✅ |
| **Dashboard** | Ringkasan jumlah akun, menu, jadwal, dan hari libur | Admin | ✅ |
| **Ubah Password** | Setiap pengguna dapat mengganti password sendiri | Semua | ✅ |
| **Ekspor PDF/Excel** | Cetak jadwal mingguan/bulanan | Admin, Parent | ⏳ Rencana |

---

## Tech Stack

Aplikasi ini dibangun dengan **BHVR** — **B**un + **H**ono + **V**ite + **R**eact.

| Lapisan | Teknologi | Keterangan |
|---------|-----------|-----------|
| **Runtime & Package Manager** | [Bun](https://bun.sh/) | Runtime cepat untuk tooling, install, dan script |
| **Backend API** | [Hono](https://hono.dev/) | Web framework ultrafast, berjalan di Cloudflare Workers |
| **Build Tool** | [Vite](https://vitejs.dev/) | Dev server dengan HMR instan + build produksi teroptimasi |
| **Frontend** | [React 19](https://react.dev/) | Library UI |
| **Routing** | [TanStack Router v1](https://tanstack.com/router) | File-based routing + type-safe navigation |
| **Data Fetching** | [TanStack Query v5](https://tanstack.com/query) | Cache, refetch, dan mutation state |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Utility-first CSS via `@tailwindcss/vite` |
| **Ikon** | [Lucide React](https://lucide.dev/) | Ikon SVG konsisten |
| **Database** | [Cloudflare D1](https://developers.cloudflare.com/d1/) | Serverless SQLite terintegrasi dengan Workers |
| **ORM** | [Drizzle ORM](https://orm.drizzle.team/) | Type-safe ORM (`drizzle-orm/sqlite-core`) |
| **Deployment** | [Cloudflare Workers](https://workers.cloudflare.com/) | Serverless edge runtime, aset statis dari `./dist/client` |
| **HTTP Client** | [ky](https://github.com/sindresorhus/ky) | Fetch wrapper dengan injeksi JWT otomatis |
| **Auth** | `hono/jwt` + Web Crypto | JWT HS256 + PBKDF2-SHA256 (edge-native) |

---

## Palet Warna

Layout memakai tiga warna dasar yang didefinisikan sebagai token di `src/index.css` (`@theme`),
masing-masing punya skala lengkap 50–950:

| Token | Warna | Peran |
|-------|-------|-------|
| `brand` | `#51277C` ungu tua | **Struktur** — logo, navigasi aktif, tombol utama, fokus input, ikon menu |
| `accent` | `#AFC440` hijau limau | **Positif** — badge "Aktif", hari sekolah, chip komponen menu |
| `highlight` | `#f3b26c` oranye persik | **Sorotan** — "Hari ini", libur, catatan, reset password |

```tsx
// Contoh pemakaian
<Button>Simpan</Button>                     {/* bg-brand-600 */}
<Badge tone="success">Aktif</Badge>         {/* accent / limau */}
<Badge tone="warning">Libur</Badge>         {/* highlight / persik */}
<div className="brand-stripe" />            {/* garis gradien 3 warna */}
```

Warna semantik **merah tetap merah** untuk aksi destruktif dan pesan error.
Warna kategori menu (`categories.color`) adalah **data**, bukan bagian tema.

Kelas util kustom: `.brand-stripe`, `.brand-canvas`, `.brand-text-gradient`.

---

## Struktur Proyek

```
pizza-snack-play/
├── public/                       # Static assets
├── src/
│   ├── api/                      # Cloudflare Worker — Hono backend
│   │   ├── index.ts              # Worker entry point (basePath /api)
│   │   ├── auth/                 # Login, logout, me, ubah password
│   │   ├── catalog/              # Menu + kategori (katalog bersama)
│   │   ├── classes/              # Daftar kelas yang boleh diakses user
│   │   ├── schedules/            # Jadwal per kelas, minggu, hari libur
│   │   ├── parents/              # CRUD akun orang tua (termasuk angkat korlas)
│   │   ├── stats/                # Ringkasan dashboard
│   │   ├── middleware/           # requireAuth, requireRole
│   │   └── utils/                # response, password, date, slug, params, classScope
│   ├── database/
│   │   ├── db.ts                 # Inisialisasi Drizzle + D1 binding + tipe Db
│   │   └── schema.ts             # Drizzle schema (12 tabel)
│   ├── components/               # Komponen UI bersama
│   │   ├── AppShell.tsx          # Header, navigasi, footer
│   │   ├── AdminOnly.tsx         # RoleGate (admin / schedule / catalog)
│   │   ├── ClassSwitcher.tsx     # Pemilih kelas di header
│   │   ├── ScheduleDayCard.tsx   # Kartu satu hari jadwal
│   │   └── ui.tsx                # Button, Card, Input, Modal, Badge, dll.
│   ├── routes/                   # TanStack Router — halaman frontend
│   │   ├── __root.tsx            # Root + AuthProvider
│   │   ├── login.tsx             # Halaman masuk
│   │   └── _app/                 # Layout terproteksi (butuh login)
│   │       ├── index.tsx         # / → redirect ke /hari-ini
│   │       ├── dashboard.tsx     # Ringkasan (admin)
│   │       ├── hari-ini.tsx      # Jadwal hari ini
│   │       ├── minggu-ini.tsx    # Jadwal mingguan
│   │       ├── bulan.tsx         # Jadwal bulanan
│   │       ├── pencarian.tsx     # Cari riwayat menu (semua role)
│   │       ├── menu.tsx          # CRUD menu (admin, korlas)
│   │       ├── kategori.tsx      # CRUD kategori (admin, korlas)
│   │       ├── jadwal.tsx        # Kelola jadwal per kelas (admin, korlas)
│   │       ├── orang-tua.tsx     # CRUD akun orang tua (admin)
│   │       └── profil.tsx        # Profil + ubah password
│   ├── lib/
│   │   ├── api.ts                # Klien API bertipe (semua endpoint)
│   │   ├── auth.tsx              # AuthProvider (sesi + verifikasi token)
│   │   ├── auth-context.ts       # Context + hook useAuth
│   │   ├── active-class.ts       # Kelas aktif (store + localStorage)
│   │   ├── date.ts               # Utilitas tanggal WIB (sisi klien)
│   │   ├── item-types.ts         # Label & urutan jenis komponen menu
│   │   ├── cn.ts                 # Penggabung class Tailwind
│   │   └── http.ts               # HTTP client (ky) + injeksi JWT
│   ├── types/                    # Tipe bersama API ↔ frontend
│   │   ├── apiResponse.ts        # Envelope { message, data }
│   │   ├── auth.ts               # Role, JwtPayload, AuthUser, StudentProfile
│   │   ├── catalog.ts            # CategoryDto, MenuDto, MenuItemDto
│   │   ├── class.ts              # ClassListDto
│   │   ├── schedule.ts           # ScheduleDayDto, WeekScheduleDto, dll.
│   │   └── account.ts            # ParentDto, StatsSummaryDto, PaginatedDto
│   ├── index.css                 # Global styles (Tailwind)
│   ├── main.tsx                  # React + Router entry point
│   └── routeTree.gen.ts          # Auto-generated route tree
├── data/
│   └── jadwal_piket_snack.txt    # Sumber data jadwal (Agustus & September 2026)
├── drizzle/
│   ├── migrations/               # Migrasi D1 (drizzle-kit generate)
│   └── seed.sql                  # Seed SQL (di luar folder migrations)
├── scripts/
│   ├── seed.ts                   # Parser jadwal -> drizzle/seed.sql
│   ├── test-auth.mjs             # 33 test end-to-end auth
│   └── test-api.mjs              # 211 test end-to-end API
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

Middleware dipasang berurutan: `requireAuth` (401 bila tanpa token) lalu
`requireRole("admin")` (403 bila role tidak sesuai).

**Utilitas bersama:**

| File | Fungsi |
|------|--------|
| `utils/response.ts` | `responseOK`, `responseCreated`, `responseBadRequest`, `responseUnauthorized`, `responseForbidden`, `responseConflict`, `responseNotFound`, `responseInternalError` |
| `utils/password.ts` | PBKDF2-SHA256 via Web Crypto, format `pbkdf2$<iterasi>$<salt>$<hash>` |
| `utils/date.ts` | Perhitungan tanggal berbasis WIB (UTC+7) |
| `utils/params.ts` | Parsing ID, validasi rentang tanggal |
| `utils/sql.ts` | `escapeLike` / `likePattern` — membuat pola `LIKE` aman dari wildcard user |
| `utils/slug.ts` | Pembuat slug dari nama kategori |

---

## Database Schema (12 Tabel)

| Tabel | Peran |
|-------|-------|
| `categories` | Kategori menu (gorengan, kukusan, buah segar, roti, dll.) |
| `menus` | Definisi menu (kombinasi main + fruit), dapat dipakai ulang |
| `menu_items` | Komponen individual dalam menu (makanan utama / buah) |
| `menu_categories` | Relasi many-to-many menu ↔ kategori |
| `weeks` | Periode mingguan (Senin–Jumat) |
| `schedules` | Tabel inti — **(tanggal × kelas)** → menu, dengan flag `is_holiday` |
| `holidays` | Daftar hari libur nasional/sekolah — berlaku untuk **semua kelas** |
| `users` | Akun login (`admin` / `korlas` / `parent`), JWT auth, password hashing, `class_name` untuk korlas |
| `parents` | Profil orang tua (nama, hubungan, kontak) — 1 baris per orang tua |
| `students` | Anak dari orang tua (nama + kelas) — **satu orang tua boleh punya banyak anak** |
| `settings` | Konfigurasi global (nama sekolah, tahun ajaran) |
| `import_logs` | Audit trail impor data dari file teks |

Detail DDL, Drizzle schema, seed data, dan query contoh: [`docs/Struktur_Tabel_Pizza_Snack_Play.md`](docs/Struktur_Tabel_Pizza_Snack_Play.md)

---

## API Endpoints

Semua endpoint berada di bawah `basePath /api`. Kecuali `POST /api/auth/login`, seluruh endpoint memerlukan header `Authorization: Bearer <token>`.

### Publik & Auth

| Method | Endpoint | Role | Keterangan |
|--------|----------|------|-----------|
| `GET` | `/health` | Publik | Cek Worker + binding D1 |
| `POST` | `/auth/login` | Publik | Terbitkan JWT + profil user |
| `POST` | `/auth/logout` | Auth | Titik keluar eksplisit (JWT stateless) |
| `GET` | `/auth/me` | Auth | Profil user + data siswa (bila `parent`) |
| `PUT` | `/auth/password` | Auth | Ubah password sendiri |

### Kelas

| Method | Endpoint | Role | Keterangan |
|--------|----------|------|-----------|
| `GET` | `/classes` | Auth | Kelas yang boleh diakses user — admin: semua, korlas: kelasnya, orang tua: kelas anaknya |

### Jadwal

Semua endpoint **baca** menerima `?class=` opsional. Bila dikosongkan, kelas default user
yang dipakai: orang tua → kelas anaknya, korlas → kelas yang dikoordinasinya, admin → kelas pertama.
Meminta kelas di luar cakupan dijawab **403**.

| Method | Endpoint | Role | Keterangan |
|--------|----------|------|-----------|
| `GET` | `/schedules/today?class=` | Auth | Jadwal hari ini (WIB) + minggu berjalan |
| `GET` | `/schedules/week?date=&class=` | Auth | Senin–Jumat pada minggu tersebut |
| `GET` | `/schedules/month?year=&month=&class=` | Auth | Rekap bulanan, dikelompokkan per minggu |
| `GET` | `/schedules/range?from=&to=&class=` | Auth | Rentang bebas (maks. 92 hari) |
| `GET` | `/schedules/search?q=&from=&to=&class=` | Auth | Cari tanggal di mana menu/komponen pernah dijadwalkan (maks. 400 hari) |
| `GET` | `/schedules/:id` | Auth | Detail satu entri jadwal |
| `POST` | `/schedules` | Admin, Korlas | Buat entri jadwal — `className` **wajib** untuk admin, otomatis untuk korlas |
| `POST` | `/schedules/copy` | Admin, Korlas | Salin jadwal Senin–Jumat antar minggu, untuk satu kelas |
| `PUT` | `/schedules/:id` | Admin, Korlas | Ubah menu / libur / catatan — korlas hanya baris kelasnya |
| `DELETE` | `/schedules/:id` | Admin, Korlas | Hapus entri jadwal — korlas hanya baris kelasnya |
| `GET` | `/weeks?year=&month=` | Auth | Daftar minggu pada bulan tersebut |
| `GET` | `/holidays?from=&to=` | Auth | Daftar hari libur (global — berlaku semua kelas) |
| `POST` | `/holidays` | Admin | Tambah hari libur |
| `DELETE` | `/holidays/:id` | Admin | Hapus hari libur |

### Katalog

Katalog menu bersifat **sekolah-wide** (dipakai bersama semua kelas), sehingga korlas ikut mengelolanya.

| Method | Endpoint | Role | Keterangan |
|--------|----------|------|-----------|
| `GET` | `/categories` | Auth | Daftar kategori |
| `GET` | `/categories/:id` | Auth | Detail kategori |
| `POST` | `/categories` | Admin, Korlas | Tambah kategori |
| `PUT` | `/categories/:id` | Admin, Korlas | Ubah kategori |
| `DELETE` | `/categories/:id` | Admin, Korlas | Hapus (409 bila masih dipakai menu) |
| `GET` | `/menus?search=&active=&archived=` | Auth | Daftar menu + komponen + kategori |
| `GET` | `/menus/item-types` | Auth | Jenis komponen: `main`, `fruit`, `drink`, `other` |
| `GET` | `/menus/:id` | Auth | Detail menu |
| `POST` | `/menus` | Admin, Korlas | Buat menu (beserta komponen) |
| `PUT` | `/menus/:id` | Admin, Korlas | Ubah menu (komponen diganti bila dikirim) |
| `DELETE` | `/menus/:id?force=` | Admin, Korlas | Hapus, atau arsipkan bila masih dipakai jadwal |

### Akun & Statistik

| Method | Endpoint | Role | Keterangan |
|--------|----------|------|-----------|
| `GET` | `/parents?search=&active=&page=&perPage=` | Admin | Daftar akun orang tua (paginated); `search` juga mencocokkan nama/kelas anak |
| `GET` | `/parents/:id` | Admin | Detail akun + daftar anak |
| `POST` | `/parents` | Admin | Buat akun + profil orang tua + daftar anak (min. 1) |
| `PUT` | `/parents/:id` | Admin | Ubah akun; daftar anak **menggantikan** yang lama bila dikirim |
| `DELETE` | `/parents/:id?hard=` | Admin | Nonaktifkan, atau hapus permanen bila `hard=true` |
| `POST` | `/parents/:id/reset-password` | Admin | Reset password |
| `GET` | `/stats/summary` | Admin | Ringkasan dashboard |

### Contoh

```bash
# Login — mengembalikan JWT + profil user (termasuk `className` untuk korlas)
curl -X POST http://localhost:5173/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"snack123"}'

# Kelas yang boleh diakses user ini
curl http://localhost:5173/api/classes \
  -H "Authorization: Bearer <token>"

# Jadwal hari ini (kelas default user)
curl http://localhost:5173/api/schedules/today \
  -H "Authorization: Bearer <token>"

# Jadwal hari ini untuk kelas tertentu
curl "http://localhost:5173/api/schedules/today?class=1B" \
  -H "Authorization: Bearer <token>"

# Jadwal bulan September 2026
curl "http://localhost:5173/api/schedules/month?year=2026&month=9" \
  -H "Authorization: Bearer <token>"

# Kapan "jeruk" pernah disajikan di kelas 1A? (6 bulan terakhir)
curl "http://localhost:5173/api/schedules/search?q=jeruk&from=2026-03-21&to=2026-09-17&class=1A" \
  -H "Authorization: Bearer <token>"

# Salin jadwal kelas 1A dari minggu 14–18 Sep ke minggu 21–25 Sep (lewati hari yang sudah terisi)
curl -X POST http://localhost:5173/api/schedules/copy \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"fromDate":"2026-09-14","toDate":"2026-09-21","className":"1A"}'

# Tetapkan menu untuk kelas 1B pada satu tanggal (admin)
curl -X POST http://localhost:5173/api/schedules \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"scheduleDate":"2026-09-18","className":"1B","menuId":3}'

# Buat akun orang tua dengan dua anak sekaligus
curl -X POST http://localhost:5173/api/parents \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{
    "username": "rina",
    "password": "rahasia123",
    "parentName": "Ibu Rina",
    "relationship": "ibu",
    "students": [
      { "name": "Dita Rina", "className": "1A" },
      { "name": "Damar Rina", "className": "3B" }
    ]
  }'

# Angkat orang tua menjadi korlas kelas 1A (role + kelas wajib)
curl -X PUT http://localhost:5173/api/parents/3 \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"role":"korlas","className":"1A"}'
```

Token JWT berlaku 7 hari (dapat diatur via `JWT_EXPIRES_IN` dalam detik). Algoritma **HS256** via `hono/jwt`.

Detail lengkap: [`docs/PRD_Pizza_Snack_Play.md`](docs/PRD_Pizza_Snack_Play.md) section 7.

---

## Cara Menjalankan

### Prasyarat

- [Bun](https://bun.sh/) v1.x — `curl -fsSL https://bun.sh/install | bash`
- Akun Cloudflare (hanya untuk D1 remote & deploy)

### Instalasi

```bash
# 1. Install dependencies
bun install

# 2. Salin environment template
cp .env.example .env
```

### Migrasi & Seed (lokal — tanpa akun Cloudflare)

D1 lokal berjalan lewat miniflare dan dipakai bersama oleh dev server dan
`wrangler d1 execute --local`:

```bash
bun run db:migrate:local   # buat 12 tabel di D1 lokal
bun run db:seed:local      # isi data dari data/jadwal_piket_snack.txt
bun run dev                # http://localhost:5173
```

### D1 Remote (produksi)

```bash
# 1. Buat database
bunx wrangler d1 create pizza-snack-play
```

Salin `database_id` hasil perintah di atas ke `wrangler.json`, lalu isi `.env`:

```
CLOUDFLARE_ACCOUNT_ID=<dari Cloudflare Dashboard → Workers & Pages → Overview>
CLOUDFLARE_DATABASE_ID=<database_id dari langkah 1>
CLOUDFLARE_D1_TOKEN=<API token dengan izin D1 edit>
JWT_SECRET=<random string untuk signing JWT>
```

```bash
# 2. Terapkan migrasi + seed ke D1 remote
bunx drizzle-kit migrate
bunx wrangler d1 execute pizza-snack-play --remote --file=./drizzle/seed.sql

# 3. Simpan JWT_SECRET sebagai Worker Secret
bunx wrangler secret put JWT_SECRET
```

**Regenerate seed** (bila file jadwal diubah):

```bash
bun run db:seed            # tulis ulang drizzle/seed.sql dari data/jadwal_piket_snack.txt
```

### Development

```bash
bun run dev
```

Dev server berjalan di **http://localhost:5173** — logika Worker terintegrasi langsung di dalam Vite dev server, jadi API dan UI berjalan pada satu port.

### Test

```bash
bun run dev                # test butuh dev server berjalan
bun run test               # auth (33) + API (211)
bun run test:auth          # hanya test autentikasi
bun run test:api           # hanya test API (jadwal, katalog, RBAC, CRUD)
```

Test API membuat dan menghapus datanya sendiri, jadi aman dijalankan berulang.

### Build & Deploy

```bash
bun run build      # TypeScript check + Vite build
bun run preview    # Preview hasil build secara lokal
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
| `db:migrate` | `drizzle-kit migrate` | Terapkan migrasi ke D1 remote |
| `db:migrate:local` | `wrangler d1 migrations apply pizza-snack-play --local` | Terapkan migrasi ke D1 lokal |
| `db:seed` | `bun run scripts/seed.ts` | Regenerate `drizzle/seed.sql` dari file jadwal |
| `db:seed:local` | `wrangler d1 execute ... --local --file=./drizzle/seed.sql` | Seed D1 lokal |
| `db:push` | `drizzle-kit push` | Push schema langsung (dev) |
| `db:studio` | `drizzle-kit studio` | GUI inspeksi database |
| `test` | `test:auth && test:api` | Semua test end-to-end |
| `test:auth` | `bun run scripts/test-auth.mjs` | Test auth (33 skenario) |
| `test:api` | `bun run scripts/test-api.mjs` | Test API (180 skenario) |

---

## Akun Default (Seed)

| Username | Role | Nama | Kelas | Anak |
|----------|------|------|-------|------|
| `admin` | admin | Bu Guru Sari | — | — |
| `sari` | parent | Ibu Sari | — | Aisyah Sari (1A) |
| `budi` | **korlas** | Pak Budi | **1A** | Bagas Budi (1A) |
| `dewi` | parent | Ibu Dewi | — | Citra Dewi (1B), Raka Dewi (2A) |

> Password default: `snack123` — **wajib diganti** saat login pertama.
> Akun `dewi` sengaja dibuat dengan **dua anak** untuk menguji tampilan multi-anak.
> Akun `budi` sengaja dibuat sebagai **korlas kelas 1A** untuk menguji batas wewenang:
> ia bisa mengelola katalog menu/kategori dan jadwal kelas 1A, tetapi ditolak (403)
> saat menyentuh kelas lain, hari libur, akun orang tua, atau statistik.

---

## Roadmap

| Phase | Scope | Status |
|-------|-------|--------|
| **1. MVP** | Scaffold, skema DB (12 tabel), migrasi D1, seed data, auth JWT, RBAC, backend CRUD, frontend jadwal + admin | ✅ Selesai |
| **2. Pencarian & Duplikasi** | Pencarian riwayat menu lintas bulan, salin jadwal antar minggu | ✅ Selesai |
| **3. Jadwal Per Kelas & Korlas** | Jadwal disimpan **per kelas**, pemilih kelas, role `korlas` (kelola katalog menu/kategori + jadwal kelasnya sendiri) | ✅ Selesai |
| **4. Ekspor & Cetak** | Halaman cetak ramah printer + ekspor CSV mingguan/bulanan | ⏳ Berikutnya |
| **5. Notifikasi** | Push notification (PWA), WhatsApp broadcast (opsional) | ⏳ Rencana |

---

## Catatan Teknis

- **Timezone:** Worker berjalan di UTC, sedangkan sekolah memakai WIB (UTC+7). Semua perhitungan "hari ini" memakai offset +7 (`todayInWib()` di `src/api/utils/date.ts`), bukan waktu server — agar jadwal tidak bergeser satu hari antara pukul 00:00–07:00 WIB. Kolom timestamp database memakai `datetime('now')` (UTC eksplisit, bukan `localtime`).
- **Pemisahan utilitas tanggal:** `src/api/utils/date.ts` (backend) dan `src/lib/date.ts` (frontend) dipisah karena `tsconfig.app.json` mengecualikan folder `src/api` dari kompilasi frontend. Logikanya dijaga identik.
- **Tipe bersama:** DTO di `src/types/` diimpor oleh backend maupun frontend, sehingga bentuk response API selalu sinkron dengan yang dipakai UI.
- **Password hashing:** PBKDF2-SHA256 (100.000 iterasi) via Web Crypto API — edge-native, tanpa dependency native. Format tersimpan: `pbkdf2$<iterations>$<salt>$<hash>`. Lihat `src/api/utils/password.ts`.
- **JWT:** HS256 via `hono/jwt`. Catatan: pada Hono 4.12+, `verify()` mewajibkan argumen algoritma ketiga — `verify(token, secret, "HS256")`.
- **Pencegahan N+1:** Menampilkan jadwal sebulan hanya butuh 4 query — jadwal, hari libur, minggu, dan menu dimuat sekali lalu dirakit di memori (`ScheduleService.loadContext`). Pencarian riwayat hanya 1 query ber-`JOIN` yang hasilnya dikelompokkan per tanggal di memori.
- **Pencarian aman wildcard:** `%` dan `_` pada kata kunci pencarian di-escape (`utils/sql.ts`) sehingga diperlakukan sebagai karakter literal, bukan pola `LIKE`. Rentang pencarian dibatasi 400 hari (satu tahun ajaran) untuk membatasi beban query.
- **Duplikasi minggu:** `POST /schedules/copy` menyalin Senin–Jumat berdasarkan **offset hari**, bukan tanggal absolut. Hari di minggu tujuan yang sudah terisi dilewati kecuali `overwrite: true`. Hari libur ikut tersalin tanpa menu.
- **Banyak anak per orang tua:** Relasi `parents 1 ── n students` (kunci `students.parent_id`, `ON DELETE CASCADE`). Saat `PUT /parents/:id`, daftar `students` bersifat **menggantikan**: entri ber-`id` yang masih dikirim akan diperbarui, entri tanpa `id` dibuat baru, dan entri yang tidak disebut lagi dihapus. `id` hanya dipercaya bila anak itu memang milik orang tua tersebut, sehingga id milik orang tua lain tidak bisa dibajak (`syncStudents` di `src/api/parents/service.ts`).
- **RBAC juga di UI:** Selain `requireRole(...)` di API, setiap halaman yang punya `useMutation` (`menu`, `kategori`, `jadwal`, `orang-tua`) digerbangi lewat `<RoleGate need="...">` — `need="catalog"` (admin + korlas) untuk menu/kategori, `need="schedule"` (admin + korlas) untuk kelola jadwal, dan `need="admin"` untuk halaman orang tua/dashboard. Orang tua tidak melihat tombol tambah/ubah/hapus sama sekali, bukan sekadar ditolak server.
- **Jadwal per kelas = baris sendiri:** Setiap kelas memiliki **baris jadwalnya sendiri** (bukan satu baris global dengan pengecualian). Karena itu `schedules` memakai indeks unik gabungan `UNIQUE(schedule_date, class_name)` — tanggal yang sama boleh muncul beberapa kali selama kelasnya berbeda. Konsekuensinya `class_name` **wajib** diisi, dan tanggal yang belum diisi untuk suatu kelas memang tampil kosong. Alternatif "satu baris global + penanda `'*'`" sengaja **tidak** dipakai agar tidak ada dua lapis resolusi (global vs override) di setiap pembacaan.
- **Penentuan kelas saat baca/tulis (`classScope.ts`):** Semua pembacaan jadwal menerima `?class=` opsional. Bila kosong, kelas ditentukan dari peran: admin → kelas pertama yang tersedia, korlas → kelasnya sendiri, orang tua → kelas anak aktif pertamanya. Kelas di luar cakupan menghasilkan **403**. Saat menulis, admin **wajib** menyebut kelas (`class_required` → 400) agar tidak ada penulisan lintas kelas yang tidak disengaja, sedangkan korlas terkunci ke `user.className` dan menyebut kelas lain → 403.
- **Guard tingkat baris:** Untuk `PUT`/`DELETE /schedules/:id`, kelas ditentukan oleh **baris yang ada di database**, bukan oleh input klien. Handler memuat baris lebih dulu lalu memanggil `canWriteClass(user, row.className)` — sehingga korlas tidak bisa membajak baris kelas lain dengan menghilangkan atau memalsukan `className`.
- **Daftar kelas tidak punya tabel:** Kelas sengaja **tidak** dijadikan tabel tersendiri (konsisten dengan `students.class_name` yang sudah berupa teks bebas). Daftarnya **diturunkan** dari gabungan `students.class_name`, `users.class_name` (korlas), dan `schedules.class_name`, lalu dinormalkan + diurutkan natural (`localeCompare(..., { numeric: true })`, sehingga `2A` mendahului `10A`). Endpoint `GET /classes` mengembalikan daftar yang **sudah dipersempit sesuai peran** pemanggil, plus `default`.
- **Hari libur tetap global:** Tabel `holidays` berlaku sekolah-wide dan **hanya admin** yang boleh mengubahnya. Korlas bisa menandai satu hari sebagai "libur kelas" lewat catatan jadwal kelasnya, tetapi tidak bisa menambah/mengubah hari libur sekolah. Statistik harian (`/stats/summary`) menghitung `isHoliday` bila ada hari libur global **atau** seluruh baris kelas pada tanggal itu bertanda libur.
- **Kelas ikut di JWT:** `className` korlas disertakan sebagai claim di JWT (selain di response login), sehingga pengecekan cakupan kelas tidak perlu query tambahan ke tabel `users`.
- **Soft delete:** Menghapus menu yang masih dipakai jadwal akan mengarsipkannya (bukan menghapus), agar jadwal lama tidak kehilangan referensi. Akun orang tua dinonaktifkan secara default; hapus permanen butuh `?hard=true`.
- **Utilitas class:** `cn()` di `src/lib/cn.ts` hanya menggabung string — **tidak** melakukan dedupe seperti `tailwind-merge`. Bila dua utility menyentuh properti sama (mis. `w-full` bawaan kontrol form vs `w-28` dari pemanggil), pemenangnya ditentukan urutan di stylesheet dan `w-full` selalu menang. Karena itu `Input`/`Select`/`Textarea` memakai **`cnControl(base, className)`**, yang membuang `w-full` ketika pemanggil memberi utility lebar (`w-*`, `min-w-*`, `basis-*`). Gunakan `cnControl` untuk kontrol form baru, bukan `cn`.
- **Folder migrasi terpisah dari seed:** `seed.sql` diletakkan di `drizzle/seed.sql`, **bukan** di `drizzle/migrations/`. Wrangler mengeksekusi setiap file `.sql` di dalam `migrations_dir` sebagai migrasi — menaruh seed di sana membuat seed dijalankan dua kali dan gagal dengan `table parents has no column named ...`.
- **Transaksi D1:** Tidak ada transaksi interaktif panjang — gunakan `db.batch([...])`.
- **Secrets:** `JWT_SECRET` dan token Cloudflare disimpan sebagai Worker Secret, bukan di repo.
- **Local vs Remote D1:** `wrangler dev` memakai D1 lokal (miniflare) di `.wrangler/state/` — datanya terpisah dari remote, tapi dipakai bersama oleh `wrangler d1 execute --local` dan dev server.

---

## Dokumentasi

- [PRD — Product Requirements Document v1.4](docs/PRD_Pizza_Snack_Play.md)
- [Struktur Tabel — DDL + Drizzle + Seed + Queries](docs/Struktur_Tabel_Pizza_Snack_Play.md)

## Sumber Data

Salinan file sumber ada di repo: [`data/jadwal_piket_snack.txt`](data/jadwal_piket_snack.txt)
(asal: `D:\WORKS\1pis\sekolahku\jadwal_piket_snack_pizza_snack_play.txt`).

- **Agustus 2026** — 5 minggu (3–31 Agustus 2026)
- **September 2026** — 5 minggu (1–30 September 2026)

Setiap hari kerja (Senin–Jumat): **makanan utama + buah pendamping**.

`scripts/seed.ts` mem-parse file ini dan menghasilkan **10 minggu, 42 menu, 84 menu item, 129 jadwal, 4 akun (1 admin, 1 korlas, 2 orang tua), 4 anak** (1 hari libur: 17 Agustus 2026).

> **129 jadwal = 43 tanggal × 3 kelas** (1A, 1B, 2A). Sejak jadwal disimpan per kelas, setiap tanggal
> di file sumber menghasilkan satu baris untuk **setiap** kelas. Migrasi `0002` melakukan hal yang sama
> untuk data lama: baris global yang sudah ada direplikasi ke seluruh kelas yang terdaftar di
> `students` ∪ korlas `users` (43 → 129 baris), dengan kelas `'Umum'` sebagai jaring pengaman bila
> belum ada kelas sama sekali — jadi tidak ada jadwal yang hilang.

**Cara kerja parser:** setiap blok minggu dibaca sebagai rentang tanggal, lalu setiap tanggal dalam rentang dicocokkan dengan nama harinya (Senin–Jumat) — jadi tanggal tidak perlu ditulis eksplisit di file sumber.

---

## Kredit

Di-scaffold dari template [ZulfiFazhar/bhvr-template](https://github.com/ZulfiFazhar/bhvr-template).

## Lisensi

Private — untuk penggunaan internal sekolah.
