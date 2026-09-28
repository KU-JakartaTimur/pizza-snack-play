<div align="center">

# Pizza Snack Play

**Aplikasi manajemen & informasi jadwal piket snack sekolah**

Setiap orang tua memiliki akun login pribadi untuk melihat jadwal menu snack harian, Sepekan, dan bulanan.

![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white)
![Hono](https://img.shields.io/badge/Hono-v4.12-E36002?style=for-the-badge&logo=hono&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-v6.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![React](https://img.shields.io/badge/React-v19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)

</div>

---

## Tentang Aplikasi

Jadwal piket snack sekolah sebelumnya disusun dalam dokumen teks manual — sulit dicari, tidak ada riwayat, dan orang tua harus bertanya untuk tahu menu hari ini. **Pizza Snack Play** mendigitalkan seluruh proses tersebut: admin mengelola menu & jadwal, orang tua login untuk memilih menu, melihat jadwal harian, Sepekan, dan bulanan, sedangkan admin & korlas dapat mengunduh jadwal itu sebagai berkas Excel untuk dibagikan atau dicetak.

---

## Fitur

| Fitur                        | Deskripsi                                                                                                                              | Role           | Status     |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ---------- |
| **Autentikasi Wajib**        | Setiap orang tua login dengan akun pribadi yang dibuat admin                                                                           | Semua          | ✅         |
| **Role-Based Access**        | `admin` (penuh), `korlas` (koordinator kelas — susun & publikasi jadwal kelasnya), `parent` (read-only)                                 | Semua          | ✅         |
| **Jadwal Per Kelas**         | Menu bersifat sekolah-wide (sama untuk semua kelas); yang berbeda tiap kelas adalah **petugas piket** (siapa yang ambil snack)         | Semua          | ✅         |
| **Pemilih Kelas**            | Admin & orang tua multi-kelas memilih kelas yang ditampilkan                                                                           | Admin, Parent  | ✅         |
| **Jadwal Hari Ini**          | Menu snack hari ini + ringkasan minggu berjalan                                                                                        | Semua          | ✅         |
| **Jadwal Sepekan**           | Senin–Jumat dengan navigasi Sepekan                                                                                                    | Semua          | ✅         |
| **Jadwal Bulanan**           | Rekap per minggu dengan statistik hari sekolah/libur                                                                                   | Semua          | ✅         |
| **Manajemen Menu**           | CRUD menu (makanan utama + buah pendamping) + kategori                                                                                 | Admin          | ✅         |
| **Kelola Jadwal**            | Tetapkan menu per tanggal, tandai libur kelas, tambah catatan                                                                          | Admin, Korlas  | ✅         |
| **Salin Jadwal Sepekan**     | Duplikasi jadwal Senin–Jumat ke minggu lain, opsional timpa                                                                            | Admin, Korlas  | ✅         |
| **Kunci & Publikasi Jadwal** | `draft` → `locked` → `published`. **Admin** yang mengunci (dan boleh membuka kunci); korlas mempublikasi kelasnya. Setelah `locked`/`published` jadwal tidak dapat diubah lagi | Admin, Korlas  | ✅         |
| **Pilih Jadwal**             | Orang tua berebut tanggal snack yang dibiarkan kosong korlas — siapa cepat dia dapat                                                   | Parent, Korlas | ✅         |
| **PWA**                      | Pasang ke layar utama + service worker (cache offline)                                                                                 | Semua          | ✅         |
| **Kelola Hari Libur**        | Tambah/hapus hari libur bernama (berlaku semua kelas)                                                                                  | Admin          | ✅         |
| **Pencarian Riwayat Menu**   | "Kapan jeruk pernah disajikan?" — cari menu/komponen lintas bulan                                                                      | Semua          | ✅         |
| **Kelola Akun Orang Tua**    | Buat, ubah, nonaktifkan, hapus, reset password, **buka kunci** — satu akun boleh punya **lebih dari satu anak**, dan dapat diangkat menjadi **korlas** | Admin          | ✅         |
| **Dashboard**                | Ringkasan jumlah akun, menu, jadwal, dan hari libur                                                                                    | Admin          | ✅         |
| **Ubah Password**            | Setiap pengguna dapat mengganti password sendiri                                                                                       | Semua          | ✅         |
| **Ekspor Excel**             | Unduh jadwal Sepekan/bulanan sebagai `.xlsx` — kolomnya sama dengan yang tampil di layar, siap dibagikan atau dicetak                | Admin, Korlas  | ✅         |
| **Batas Percobaan Masuk**    | 5 kali salah password berturut-turut dalam 15 menit → akun terkunci (`423`); admin membukanya dari halaman Akun Orang Tua            | Semua          | ✅         |
| **Kelola Anak Sendiri**      | Orang tua & korlas menambah, mengubah, dan menghapus **anaknya sendiri** dari menu Profil — tanpa menunggu admin                     | Parent, Korlas | ✅         |
| **Mode Tiru**                | Admin masuk sebagai orang tua tertentu tanpa password untuk membantu, ditandai bilah kuning selama sesi berlangsung                  | Admin          | ✅         |

---

## Tech Stack

Aplikasi ini dibangun dengan **BHVR** — **B**un + **H**ono + **V**ite + **R**eact.

| Lapisan                       | Teknologi                                              | Keterangan                                                |
| ----------------------------- | ------------------------------------------------------ | --------------------------------------------------------- |
| **Runtime & Package Manager** | [Bun](https://bun.sh/)                                 | Runtime cepat untuk tooling, install, dan script          |
| **Backend API**               | [Hono](https://hono.dev/)                              | Web framework ultrafast, berjalan di Cloudflare Workers   |
| **Build Tool**                | [Vite](https://vitejs.dev/)                            | Dev server dengan HMR instan + build produksi teroptimasi |
| **Frontend**                  | [React 19](https://react.dev/)                         | Library UI                                                |
| **Routing**                   | [TanStack Router v1](https://tanstack.com/router)      | File-based routing + type-safe navigation                 |
| **Data Fetching**             | [TanStack Query v5](https://tanstack.com/query)        | Cache, refetch, dan mutation state                        |
| **Styling**                   | [Tailwind CSS v4](https://tailwindcss.com/)            | Utility-first CSS via `@tailwindcss/vite`                 |
| **Ikon**                      | [Lucide React](https://lucide.dev/)                    | Ikon SVG konsisten                                        |
| **Database**                  | [Cloudflare D1](https://developers.cloudflare.com/d1/) | Serverless SQLite terintegrasi dengan Workers             |
| **ORM**                       | [Drizzle ORM](https://orm.drizzle.team/)               | Type-safe ORM (`drizzle-orm/sqlite-core`)                 |
| **Deployment**                | [Cloudflare Workers](https://workers.cloudflare.com/)  | Serverless edge runtime, aset statis dari `./dist/client` |
| **HTTP Client**               | [ky](https://github.com/sindresorhus/ky)               | Fetch wrapper dengan injeksi JWT otomatis                 |
| **Auth**                      | `hono/jwt` + Web Crypto                                | JWT HS256 + PBKDF2-SHA256 (edge-native)                   |
| **PWA**                       | Web App Manifest + Service Worker                      | Ditulis tangan di `public/`, tanpa library                |

---

## Palet Warna

Layout memakai tiga warna dasar yang didefinisikan sebagai token di `src/index.css` (`@theme`),
masing-masing punya skala lengkap 50–950:

| Token       | Warna                   | Peran                                                                     |
| ----------- | ----------------------- | ------------------------------------------------------------------------- |
| `brand`     | `#51277C` ungu tua      | **Struktur** — logo, navigasi aktif, tombol utama, fokus input, ikon menu |
| `accent`    | `#AFC440` hijau limau   | **Positif** — badge "Aktif", hari sekolah, chip komponen menu             |
| `highlight` | `#f3b26c` oranye persik | **Sorotan** — "Hari ini", libur, catatan, reset password                  |

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

### Sudut

Skala `--radius-*` bawaan Tailwind ikut di-override di `@theme` agar kotak terlihat tegas —
sedikit tumpul di keempat sudut, bukan membulat:

| Utility       | Nilai | Dipakai                            |
| ------------- | ----- | ---------------------------------- |
| `rounded-sm`  | 2px   | Lencana (`Badge`), chip kategori   |
| `rounded-md`  | 3px   | Chip komponen menu                 |
| `rounded-lg`  | 4px   | Tombol, input, select, kotak kecil |
| `rounded-2xl` | 6px   | Kartu (`.card`) & modal            |

Diubah di **satu tempat**, bukan per komponen, supaya seluruh UI tetap seragam.
`rounded-full` hanya tersisa untuk yang memang bulat: titik penanda minggu, garis aksen
`PageHeader`, dan lingkaran latar halaman masuk.

---

## Struktur Proyek

```
pizza-snack-play/
├── public/                       # Static assets
│   ├── logo.png                  # Sumber ikon (diolah scripts/generate-pwa-icons.py)
│   ├── manifest.json             # Web App Manifest (PWA)
│   ├── sw.js                     # Service Worker (cache + update)
│   └── pwa/                      # Ikon PWA 192px & 512px
├── src/
│   ├── api/                      # Cloudflare Worker — Hono backend
│   │   ├── index.ts              # Worker entry point (basePath /api)
│   │   ├── auth/                 # Login, logout, me, ubah password
│   │   ├── catalog/              # Menu + kategori (katalog bersama)
│   │   ├── claims/               # Pilih jadwal — klaim tanggal oleh orang tua
│   │   ├── classes/              # Daftar kelas yang boleh diakses user
│   │   ├── schedules/            # Jadwal per kelas, minggu, hari libur, kunci & publikasi, ekspor Excel
│   │   ├── parents/              # CRUD akun orang tua (termasuk angkat korlas & buka kunci)
│   │   ├── profile/              # Layanan mandiri: orang tua kelola anaknya sendiri
│   │   ├── stats/                # Ringkasan dashboard
│   │   ├── middleware/           # requireAuth, requireRole
│   │   └── utils/                # response, password, date, slug, params, classScope, sql, xlsx
│   ├── database/
│   │   ├── db.ts                 # Inisialisasi Drizzle + D1 binding + tipe Db
│   │   └── schema.ts             # Drizzle schema (13 tabel)
│   ├── components/               # Komponen UI bersama
│   │   ├── AppShell.tsx          # Header, navigasi, footer
│   │   ├── AdminOnly.tsx         # RoleGate (admin / schedule / catalog)
│   │   ├── BottomNav.tsx         # Bilah bawah (hanya saat PWA terpasang)
│   │   ├── navItems.ts           # Sumber tunggal daftar tujuan navigasi
│   │   ├── ClassSwitcher.tsx     # Pemilih kelas di header
│   │   ├── PWAInstallPrompt.tsx  # Banner pasang PWA + notifikasi update SW
│   │   ├── ScheduleDayCard.tsx   # Kartu satu hari jadwal
│   │   ├── jadwal/               # Bagian jadwal: ExportButton, CopyWeekModal, MonthToolbar, …
│   │   └── ui.tsx                # Button, Card, Input, Modal, Badge, dll.
│   ├── hooks/
│   │   └── usePWA.ts             # State installability + update service worker
│   ├── routes/                   # TanStack Router — halaman frontend
│   │   ├── __root.tsx            # Root + AuthProvider
│   │   ├── login.tsx             # Halaman masuk
│   │   └── _app/                 # Layout terproteksi (butuh login)
│   │       ├── index.tsx         # / → redirect ke /hari-ini
│   │       ├── dashboard.tsx     # Ringkasan (admin)
│   │       ├── hari-ini.tsx      # Jadwal hari ini
│   │       ├── minggu-ini.tsx    # Jadwal Sepekan
│   │       ├── bulan.tsx         # Jadwal bulanan
│   │       ├── pilih-jadwal.tsx  # Ambil tanggal snack (orang tua, korlas)
│   │       ├── pencarian.tsx     # Cari riwayat menu (semua role)
│   │       ├── menu.tsx          # Katalog menu — baca untuk semua, ubah hanya admin
│   │       ├── kategori.tsx      # CRUD kategori (admin)
│   │       ├── jadwal.tsx        # Kelola jadwal & publikasi (admin, korlas)
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
│   │   ├── download.ts           # Simpan blob hasil unduhan ke berkas
│   │   └── http.ts               # HTTP client (ky) + injeksi JWT
│   ├── types/                    # Tipe bersama API ↔ frontend
│   │   ├── apiResponse.ts        # Envelope { message, data }
│   │   ├── auth.ts               # Role, JwtPayload, AuthUser, StudentProfile
│   │   ├── catalog.ts            # CategoryDto, MenuDto, MenuItemDto
│   │   ├── claim.ts              # ScheduleClaimDto, ClaimInput
│   │   ├── class.ts              # ClassListDto
│   │   ├── schedule.ts           # ScheduleDayDto, WeekScheduleDto, dll.
│   │   └── account.ts            # ParentDto, StatsSummaryDto, PaginatedDto
│   ├── index.css                 # Global styles (Tailwind)
│   ├── main.tsx                  # React + Router entry point
│   └── routeTree.gen.ts          # Auto-generated route tree
├── data/
│   ├── jadwal_piket_snack.txt    # Sumber data menu (Agustus & September 2026)
│   └── output_jadwal_piket.txt   # Sumber data petugas piket per kelas
├── drizzle/
│   ├── migrations/               # Migrasi D1 (drizzle-kit generate)
│   └── seed.sql                  # Seed SQL (di luar folder migrations)
├── scripts/
│   ├── seed.ts                   # Parser jadwal -> drizzle/seed.sql
│   ├── generate-pwa-icons.py     # Bangkitkan ikon PWA + favicon dari logo.png
│   ├── test-auth.mjs             # 33 uji end-to-end auth
│   ├── test-api.mjs              # 309 uji end-to-end API
│   ├── test-status.mjs           # 22 uji status jadwal bulanan
│   ├── test-profile-students.mjs # 33 uji layanan mandiri anak (idempoten)
│   ├── test-claim-cross-class.mjs# Uji klaim tanggal lintas kelas
│   └── run-uat.mjs               # Skenario UAT
├── docs/
│   ├── PRD_Pizza_Snack_Play.md
│   ├── Struktur_Tabel_Pizza_Snack_Play.md
│   └── UAT_Result.md
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

| File                | Fungsi                                                                                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `utils/response.ts` | `responseOK`, `responseCreated`, `responseBadRequest`, `responseUnauthorized`, `responseForbidden`, `responseConflict`, `responseNotFound`, `responseInternalError` |
| `utils/password.ts` | PBKDF2-SHA256 via Web Crypto, format `pbkdf2$<iterasi>$<salt>$<hash>`                                                                                               |
| `utils/date.ts`     | Perhitungan tanggal berbasis WIB (UTC+7)                                                                                                                            |
| `utils/params.ts`   | Parsing ID, validasi rentang tanggal                                                                                                                                |
| `utils/sql.ts`      | `escapeLike` / `likePattern` — membuat pola `LIKE` aman dari wildcard user                                                                                          |
| `utils/classScope.ts` | `resolveReadClass` / `resolveWriteClass` / `canWriteClass` — menentukan cakupan kelas user saat baca & tulis                                                       |
| `utils/xlsx.ts`     | Penulis berkas `.xlsx` **tanpa dependency** (ZIP mode store + SpreadsheetML) — dipakai `schedules/export.ts`                                                        |
| `utils/slug.ts`     | Pembuat slug dari nama kategori                                                                                                                                     |

---

## Database Schema (13 Tabel)

| Tabel             | Peran                                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------------------- |
| `categories`      | Kategori menu (gorengan, kukusan, buah segar, roti, dll.)                                                           |
| `menus`           | Definisi menu (kombinasi main + fruit), dapat dipakai ulang                                                         |
| `menu_items`      | Komponen individual dalam menu (makanan utama / buah)                                                               |
| `menu_categories` | Relasi many-to-many menu ↔ kategori                                                                                 |
| `weeks`           | Periode Sepekan (Senin–Jumat)                                                                                       |
| `schedules`       | Tabel inti — **(tanggal × kelas)** → menu, `is_holiday`, petugas piket (`petugas_student_id`/`petugas_parent_id` + nama yang diturunkan; relasi, bukan FK), dan `status` (`draft`/`locked`/`published`) |
| `schedule_claims` | Klaim satu tanggal oleh satu orang tua — **`UNIQUE(schedule_id)`** yang menjadi penjaga rebutan                     |
| `holidays`        | Daftar hari libur nasional/sekolah — berlaku untuk **semua kelas**                                                  |
| `users`           | Akun login (`admin` / `korlas` / `parent`), JWT auth, password hashing, `class_name` untuk korlas, **penghitung gagal masuk** (`failed_login_attempts`, `last_failed_login_at`, `locked_at`) |
| `parents`         | Profil orang tua (nama, hubungan, kontak) — 1 baris per orang tua                                                   |
| `students`        | Anak dari orang tua (nama + kelas) — **satu orang tua boleh punya banyak anak**                                     |
| `settings`        | Konfigurasi global (nama sekolah, tahun ajaran)                                                                     |
| `import_logs`     | Audit trail impor data dari file teks                                                                               |

Detail DDL, Drizzle schema, seed data, dan query contoh: [`docs/Struktur_Tabel_Pizza_Snack_Play.md`](docs/Struktur_Tabel_Pizza_Snack_Play.md)

---

## API Endpoints

Semua endpoint berada di bawah `basePath /api`. Kecuali `POST /api/auth/login`, seluruh endpoint memerlukan header `Authorization: Bearer <token>`.

### Publik & Auth

| Method | Endpoint         | Role   | Keterangan                               |
| ------ | ---------------- | ------ | ---------------------------------------- |
| `GET`  | `/health`        | Publik | Cek Worker + binding D1                  |
| `POST` | `/auth/login`    | Publik | Terbitkan JWT + profil user              |
| `POST` | `/auth/logout`   | Auth   | Titik keluar eksplisit (JWT stateless)   |
| `GET`  | `/auth/me`       | Auth   | Profil user + data siswa (bila `parent`) |
| `PUT`  | `/auth/password` | Auth   | Ubah password sendiri                    |
| `POST` | `/auth/impersonate` | Admin | **Mode tiru** — masuk sebagai orang tua tertentu tanpa password, untuk membantu dari layar yang sama |

### Kelas

| Method | Endpoint                  | Role           | Keterangan                                                                               |
| ------ | ------------------------- | -------------- | ---------------------------------------------------------------------------------------- |
| `GET`  | `/classes`                | Auth           | Kelas yang boleh diakses user — admin: semua, korlas: kelasnya, orang tua: kelas anaknya |
| `GET`  | `/classes/:class/roster`  | Admin, Korlas  | Siswa satu kelas + orang tuanya — bahan dropdown *Petugas* & *Orang tua* di tabel jadwal |

> **`/roster` sengaja tidak dibuka untuk orang tua.** Isinya bukan sekadar nama siswa: ada
> nama orang tua dan `id` akunnya. Orang tua lain tidak punya urusan dengan data itu, jadi
> role-nya dibatasi di `route.ts` (403), sementara cakupan kelasnya ditegakkan di service —
> admin boleh kelas mana pun, korlas mengikuti `allowedClasses` (boleh membaca kelas lain,
> karena wewenang *mengubah* sudah dikunci terpisah oleh `canWriteClass`).
> Kelas yang tidak dikenal dijawab **404**, bukan 403, supaya kolom kelas yang salah ketik
> tidak terbaca sebagai masalah hak akses.

### Jadwal

Semua endpoint **baca** menerima `?class=` opsional. Bila dikosongkan, kelas default user
yang dipakai: orang tua → kelas anaknya, korlas → kelas yang dikoordinasinya, admin → kelas pertama.
Meminta kelas di luar cakupan dijawab **403**.

| Method   | Endpoint                                | Role          | Keterangan                                                                                        |
| -------- | --------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------- |
| `GET`    | `/schedules/today?class=`               | Auth          | Jadwal hari ini (WIB) + minggu berjalan                                                           |
| `GET`    | `/schedules/today-all`                  | Admin         | Jadwal hari ini untuk **semua kelas** sekaligus                                                   |
| `GET`    | `/schedules/week?date=&class=`          | Auth          | Senin–Jumat pada minggu tersebut                                                                  |
| `GET`    | `/schedules/month?year=&month=&class=`  | Auth          | Rekap bulanan, dikelompokkan per minggu                                                           |
| `GET`    | `/schedules/status?year=&month=&class=` | Auth          | Status penyusunan per minggu pada bulan itu; admin tanpa `class` = seluruh sekolah               |
| `GET`    | `/schedules/export?scope=&class=`       | Admin, Korlas | Unduh jadwal sebagai `.xlsx` — `scope=week` (+`date`) atau `scope=month` (+`year`,`month`)       |
| `GET`    | `/schedules/range?from=&to=&class=`     | Auth          | Rentang bebas (maks. 92 hari)                                                                     |
| `GET`    | `/schedules/search?q=&from=&to=&class=` | Auth          | Cari tanggal di mana menu/komponen pernah dijadwalkan (maks. 400 hari)                            |
| `GET`    | `/schedules/:id`                        | Auth          | Detail satu entri jadwal                                                                          |
| `POST`   | `/schedules`                            | Admin, Korlas | Buat entri jadwal — `className` **wajib** untuk admin, otomatis untuk korlas                      |
| `POST`   | `/schedules/copy`                       | Admin, Korlas | Salin jadwal Senin–Jumat Sepekan, untuk satu kelas                                                |
| `POST`   | `/schedules/lock`                       | Admin         | Kunci semua baris `draft` pada rentang tanggal — hanya admin yang boleh membekukan jadwal          |
| `POST`   | `/schedules/publish`                    | Admin, Korlas | Publikasi sebulan — gagal **409** bila masih ada `draft`. Korlas hanya untuk kelasnya sendiri     |
| `POST`   | `/schedules/:id/unlock`                 | Admin         | Kembalikan satu baris ke `draft`                                                                  |
| `PUT`    | `/schedules/:id`                        | Admin, Korlas | Ubah menu / libur / catatan — korlas hanya baris kelasnya; **409** bila sudah dikunci/dipublikasi |
| `DELETE` | `/schedules/:id`                        | Admin, Korlas | Hapus entri jadwal — korlas hanya baris kelasnya; **409** bila sudah dikunci/dipublikasi          |
| `GET`    | `/weeks?year=&month=`                   | Auth          | Daftar minggu pada bulan tersebut                                                                 |
| `GET`    | `/holidays?from=&to=`                   | Auth          | Daftar hari libur (global — berlaku semua kelas)                                                  |
| `POST`   | `/holidays`                             | Admin         | Tambah hari libur                                                                                 |
| `DELETE` | `/holidays/:id`                         | Admin         | Hapus hari libur                                                                                  |

### Pilih Jadwal (Klaim)

Setelah korlas mempublikasi jadwal, tanggal yang **petugasnya dibiarkan kosong** boleh direbut
orang tua — siapa cepat dia dapat. Korlas ikut boleh memilih karena ia tetap orang tua murid;
admin tidak punya profil orang tua sehingga hanya bisa membaca rekap dan membatalkan klaim.

| Method   | Endpoint                   | Role           | Keterangan                                                                    |
| -------- | -------------------------- | -------------- | ----------------------------------------------------------------------------- |
| `POST`   | `/claims`                  | Parent, Korlas | Ambil satu tanggal — **409** bila keduluan, pesannya menyebut nama pemiliknya |
| `DELETE` | `/claims/:id`              | Auth           | Batalkan — pemiliknya sendiri, atau admin/korlas kelas itu                    |
| `GET`    | `/claims/mine?from=&to=`   | Parent, Korlas | Tanggal yang sudah diambil sendiri                                            |
| `GET`    | `/claims?from=&to=&class=` | Auth           | Rekap klaim satu kelas                                                        |

Kode konflik `POST /claims`: **409** `already_claimed` (keduluan orang tua lain),
`already_mine` (sudah diambil sendiri), `already_assigned` (petugasnya sudah ditetapkan korlas),
`not_published` (jadwal belum dipublikasi), `past_date`; **403** bila kelasnya bukan kelas anaknya.

### Katalog

Katalog menu bersifat **sekolah-wide** (dipakai bersama semua kelas), sehingga perubahannya terpusat
di tangan admin. Korlas hanya membaca katalog — wewenang tulisnya ada di jadwal kelasnya sendiri.

| Method   | Endpoint                           | Role  | Keterangan                                        |
| -------- | ---------------------------------- | ----- | ------------------------------------------------- |
| `GET`    | `/categories`                      | Auth  | Daftar kategori                                   |
| `GET`    | `/categories/:id`                  | Auth  | Detail kategori                                   |
| `POST`   | `/categories`                      | Admin | Tambah kategori                                   |
| `PUT`    | `/categories/:id`                  | Admin | Ubah kategori                                     |
| `DELETE` | `/categories/:id`                  | Admin | Hapus (409 bila masih dipakai menu)               |
| `GET`    | `/menus?search=&active=&archived=` | Auth  | Daftar menu + komponen + kategori                 |
| `GET`    | `/menus/item-types`                | Auth  | Jenis komponen: `main`, `fruit`, `drink`, `other` |
| `GET`    | `/menus/:id`                       | Auth  | Detail menu                                       |
| `POST`   | `/menus`                           | Admin | Buat menu (beserta komponen)                      |
| `PUT`    | `/menus/:id`                       | Admin | Ubah menu (komponen diganti bila dikirim)         |
| `DELETE` | `/menus/:id?force=`                | Admin | Hapus, atau arsipkan bila masih dipakai jadwal    |

### Akun & Statistik

| Method   | Endpoint                                  | Role  | Keterangan                                                                   |
| -------- | ----------------------------------------- | ----- | ---------------------------------------------------------------------------- |
| `GET`    | `/parents?search=&active=&page=&perPage=` | Admin | Daftar akun orang tua (paginated); `search` juga mencocokkan nama/kelas anak |
| `GET`    | `/parents/:id`                            | Admin | Detail akun + daftar anak                                                    |
| `POST`   | `/parents`                                | Admin | Buat akun + profil orang tua + daftar anak (min. 1)                          |
| `PUT`    | `/parents/:id`                            | Admin | Ubah akun; daftar anak **menggantikan** yang lama bila dikirim               |
| `DELETE` | `/parents/:id?hard=`                      | Admin | Nonaktifkan, atau hapus permanen bila `hard=true`                            |
| `POST`   | `/parents/:id/reset-password`             | Admin | Reset password (sekaligus membuka kunci akun)                                |
| `POST`   | `/parents/:id/unlock`                     | Admin | Buka kunci akun akibat percobaan masuk yang gagal                            |
| `GET`    | `/stats/summary`                          | Admin | Ringkasan dashboard                                                          |

### Profil (layanan mandiri)

Modul ini dipakai **orang tua & korlas untuk mengurus anaknya sendiri** dari menu Profil — terpisah
dari `/api/parents` yang khusus admin. `parentId` selalu diambil dari **token**, bukan dari request,
sehingga satu orang tua tidak mungkin menyentuh anak milik orang tua lain: anak orang lain dijawab
**404** (bukan 403) agar keberadaannya tidak terbocorkan.

| Method   | Endpoint                  | Role           | Keterangan                                                       |
| -------- | ------------------------- | -------------- | ---------------------------------------------------------------- |
| `GET`    | `/profile/students`       | Parent, Korlas | Daftar anak sendiri                                              |
| `POST`   | `/profile/students`       | Parent, Korlas | Tambah anak — nama & kelas **wajib**                             |
| `PUT`    | `/profile/students/:id`   | Parent, Korlas | Ubah nama/kelas; kelas dikosongkan dengan `className: null`      |
| `DELETE` | `/profile/students/:id`   | Parent, Korlas | Hapus anak — **anak terakhir tidak boleh dihapus** (`400`)       |
| `GET`    | `/profile/classes`        | Parent, Korlas | Saran kelas untuk `datalist` di form (bukan pembatas)            |

### Batas percobaan masuk

Setelah **5 kali gagal berturut-turut dalam 15 menit**, akun dikunci dan login
dijawab `423` dengan pesan agar menghubungi admin. Password yang benar pun
ditolak selama akun masih terkunci. Login yang berhasil mengosongkan
penghitungnya, dan admin membuka kunci lewat tombol **buka kunci** di halaman
Akun Orang Tua (atau `POST /parents/:id/unlock`).

> **Kalau pesan `423` muncul padahal baru sekali salah password**, penyebabnya
> bukan penguncian melainkan skema database yang tertinggal — kolom
> `locked_at`/`failed_login_attempts` belum ada, dan SQLite mengembalikan nama
> kolomnya sebagai teks (lihat Catatan Teknis). Perbaikannya:
> `bun run db:migrate`, lalu deploy ulang.

> **Bila akun admin sendiri terkunci**, tidak ada admin lain yang bisa
> membukanya dari dalam aplikasi. Bukalah langsung di database:
>
> ```bash
> # lokal
> bunx wrangler d1 execute pizza-snack-play --local --command \
>   "UPDATE users SET failed_login_attempts = 0, last_failed_login_at = NULL, locked_at = NULL WHERE username = 'admin'"
>
> # produksi — tambahkan --remote
> bunx wrangler d1 execute pizza-snack-play --remote --command \
>   "UPDATE users SET failed_login_attempts = 0, last_failed_login_at = NULL, locked_at = NULL WHERE username = 'admin'"
> ```

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
curl "http://localhost:5173/api/schedules/today?class=2" \
  -H "Authorization: Bearer <token>"

# Jadwal bulan September 2026
curl "http://localhost:5173/api/schedules/month?year=2026&month=9" \
  -H "Authorization: Bearer <token>"

# Kapan "jeruk" pernah disajikan di kelas 1? (6 bulan terakhir)
curl "http://localhost:5173/api/schedules/search?q=jeruk&from=2026-03-21&to=2026-09-17&class=1" \
  -H "Authorization: Bearer <token>"

# Unduh jadwal September 2026 kelas 1 sebagai Excel (admin/korlas)
curl -L "http://localhost:5173/api/schedules/export?scope=month&year=2026&month=9&class=1" \
  -H "Authorization: Bearer <token>" \
  -o jadwal-bulanan-2026-09-kelas-1.xlsx

# …atau Sepekan yang berisi tanggal tertentu
curl -L "http://localhost:5173/api/schedules/export?scope=week&date=2026-09-21&class=1" \
  -H "Authorization: Bearer <token>" \
  -o jadwal-sepekan-kelas-1-2026-09-21.xlsx

# Salin jadwal kelas 1 dari minggu 14–18 Sep ke minggu 21–25 Sep (lewati hari yang sudah terisi)
curl -X POST http://localhost:5173/api/schedules/copy \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"fromDate":"2026-09-14","toDate":"2026-09-21","className":"1"}'

# Tetapkan menu untuk kelas 2 pada satu tanggal (admin)
curl -X POST http://localhost:5173/api/schedules \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"scheduleDate":"2026-09-18","className":"2","menuId":3}'

# Admin mengunci jadwal kelas 1 untuk September
curl -X POST http://localhost:5173/api/schedules/lock \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"fromDate":"2026-09-01","toDate":"2026-09-30","className":"1"}'

# Korlas mempublikasikan jadwal terkunci itu ke orang tua kelasnya
curl -X POST http://localhost:5173/api/schedules/publish \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"year":2026,"month":9}'

# Orang tua mengambil satu tanggal — 409 bila keduluan orang tua lain
curl -X POST http://localhost:5173/api/claims \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"scheduleId":42}'

# Buat akun orang tua dengan dua anak sekaligus
curl -X POST http://localhost:5173/api/parents \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{
    "username": "rina",
    "password": "rahasia123",
    "parentName": "Ibu Rina",
    "relationship": "ibu",
    "students": [
      { "name": "Dita Rina", "className": "1" },
      { "name": "Damar Rina", "className": "3" }
    ]
  }'

# Angkat orang tua menjadi korlas kelas 1 (role + kelas wajib)
curl -X PUT http://localhost:5173/api/parents/3 \
  -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"role":"korlas","className":"1"}'
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
bun run db:migrate:local   # buat 13 tabel di D1 lokal
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
bun run db:migrate
bunx wrangler d1 execute pizza-snack-play --remote --file=./drizzle/seed.sql

# 3. Simpan JWT_SECRET sebagai Worker Secret
bunx wrangler secret put JWT_SECRET
```

> **Migrasi selalu lewat `bun run db:migrate` (wrangler), bukan `drizzle-kit push`.**
> Keduanya memakai mekanisme yang sama untuk lokal dan remote — pencatatannya di
> tabel `d1_migrations` — sehingga `bun run db:migrate:local` dan
> `bun run db:migrate` tidak bisa lagi berbeda status. `bun run db:push`
> menembak **langsung ke D1 remote** tanpa mencatat apa pun, jadi jangan dipakai
> untuk perubahan skema produksi (lihat Catatan Teknis).
>
> Urutannya penting: **migrasi dulu, kode kemudian**. `bun run deploy` sudah
> menjalankan migrasi sebelum mengunggah Worker, jadi jalur ini tidak bisa
> terlewat.

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
bun run deploy     # Migrasi D1 remote + build + deploy ke Cloudflare Workers
```

### Validasi Penuh

```bash
bun run check      # tsc + vite build + wrangler deploy --dry-run
bun run lint       # ESLint
```

---

## Scripts

| Script             | Perintah                                                    | Fungsi                                         |
| ------------------ | ----------------------------------------------------------- | ---------------------------------------------- |
| `dev`              | `vite`                                                      | Dev server dengan HMR                          |
| `build`            | `tsc -b && vite build`                                      | Build produksi                                 |
| `preview`          | `vite preview`                                              | Preview hasil build                            |
| `deploy`           | `bun run build && bun run db:migrate && wrangler deploy …`  | Migrasi D1 remote, build, lalu deploy          |
| `check`            | `tsc && vite build && wrangler deploy --dry-run`            | Validasi penuh                                 |
| `lint`             | `eslint .`                                                  | Cek kualitas kode                              |
| `cf-typegen`       | `wrangler types`                                            | Generate tipe dari binding                     |
| `db:generate`      | `drizzle-kit generate`                                      | Generate migrasi                               |
| `db:migrate`       | `drizzle-kit migrate`                                       | Terapkan migrasi ke D1 remote                  |
| `db:migrate:local` | `wrangler d1 migrations apply pizza-snack-play --local`     | Terapkan migrasi ke D1 lokal                   |
| `db:seed`          | `bun run scripts/seed.ts`                                   | Regenerate `drizzle/seed.sql` dari file jadwal |
| `db:seed:local`    | `wrangler d1 execute ... --local --file=./drizzle/seed.sql` | Seed D1 lokal                                  |
| `db:push`          | `drizzle-kit push`                                          | Push schema **langsung ke D1 remote**, tanpa catatan migrasi |
| `db:studio`        | `drizzle-kit studio`                                        | GUI inspeksi database                          |
| `dev:prod`         | `tsc -b && vite build && wrangler dev --remote`             | Dev server memakai D1 **remote**               |
| `test`             | `test:auth && test:api && test:status && test:profile`      | Semua test end-to-end                          |
| `test:auth`        | `bun run scripts/test-auth.mjs`                             | Test auth (33 skenario)                        |
| `test:api`         | `bun run scripts/test-api.mjs`                              | Test API (309 skenario)                        |
| `test:status`      | `bun run scripts/test-status.mjs`                           | Test status jadwal bulanan (22 skenario)       |
| `test:profile`     | `bun run scripts/test-profile-students.mjs`                 | Test layanan mandiri anak (33 skenario)        |

---

## Akun Default (Seed)

| Username | Role       | Nama         | Kelas | Anak                          |
| -------- | ---------- | ------------ | ----- | ----------------------------- |
| `admin`  | admin      | Bu Guru Sari | —     | —                             |
| `sari`   | parent     | Ibu Sari     | —     | Aisyah Sari (1)               |
| `budi`   | **korlas** | Pak Budi     | **1** | Bagas Budi (1)                |
| `dewi`   | parent     | Ibu Dewi     | —     | Citra Dewi (2), Raka Dewi (3) |

Di luar keempat akun demo di atas, seed juga membuat **35 akun wali murid** dari daftar kontak
manual sekolah (`aditya`, `aprino`, `dafid`, … — lihat `EXTRA_PARENTS` di `scripts/seed.ts`),
semuanya ber-role `parent` dengan password yang sama. Akun-akun itu **belum punya anak
terdaftar**, jadi belum terhubung ke kelas mana pun: mereka bisa login tetapi belum melihat
jadwal maupun memakai Pilih Jadwal sampai `students`-nya diisi.

> **Nomor telepon di seed adalah dummy** (`081234567890` dan seterusnya, berurutan). Repo ini
> publik, jadi kontak asli sengaja tidak ikut ter-commit dan diisi langsung di database produksi.

> Password default: `snack123` — **wajib diganti** saat login pertama.
> Akun `dewi` sengaja dibuat dengan **dua anak** untuk menguji tampilan multi-anak.
> Akun `budi` sengaja dibuat sebagai **korlas kelas 1** untuk menguji batas wewenang:
> ia bisa mengelola katalog menu/kategori dan jadwal kelas 1, tetapi ditolak (403)
> saat menyentuh kelas lain, hari libur, akun orang tua, atau statistik.

---

## Roadmap

| Phase                            | Scope                                                                                                                                | Status        |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| **1. MVP**                       | Scaffold, skema DB (13 tabel), migrasi D1, seed data, auth JWT, RBAC, backend CRUD, frontend jadwal + admin                          | ✅ Selesai    |
| **2. Pencarian & Duplikasi**     | Pencarian riwayat menu lintas bulan, salin jadwal Sepekan                                                                            | ✅ Selesai    |
| **3. Jadwal Per Kelas & Korlas** | Jadwal disimpan **per kelas**, pemilih kelas, role `korlas` (kelola katalog menu/kategori + jadwal kelasnya sendiri)                 | ✅ Selesai    |
| **4. Kunci, Publikasi & PWA**    | Siklus `draft` → `locked` → `published`, petugas piket per kelas, ringkasan semua kelas untuk admin, pemasangan PWA + service worker | ✅ Selesai    |
| **5. Pilih Jadwal**              | Orang tua berebut tanggal yang dibiarkan kosong korlas; klaim menjadi sumber kebenaran petugas                                       | ✅ Selesai    |
| **6. Ekspor Excel**              | Unduh jadwal Sepekan/bulanan sebagai `.xlsx` (admin & korlas) — ditulis sendiri, tanpa dependency                   | ✅ Selesai    |
| **7. Keamanan Akun**             | Batas percobaan masuk (5× gagal → terkunci) + tombol buka kunci di halaman Akun Orang Tua                            | ✅ Selesai    |
| **8. Ekspor & Cetak lanjutan**   | Halaman cetak ramah printer + ekspor CSV Sepekan/bulanan                                                            | ⏳ Berikutnya |
| **9. Notifikasi**                | Push notification (PWA), WhatsApp broadcast (opsional)                                                               | ⏳ Rencana    |

---

## Catatan Teknis

- **Timezone:** Worker berjalan di UTC, sedangkan sekolah memakai WIB (UTC+7). Semua perhitungan "hari ini" memakai offset +7 (`todayInWib()` di `src/api/utils/date.ts`), bukan waktu server — agar jadwal tidak bergeser satu hari antara pukul 00:00–07:00 WIB. Kolom timestamp database memakai `datetime('now')` (UTC eksplisit, bukan `localtime`).
- **Pemisahan utilitas tanggal:** `src/api/utils/date.ts` (backend) dan `src/lib/date.ts` (frontend) dipisah karena `tsconfig.app.json` mengecualikan folder `src/api` dari kompilasi frontend. Logikanya dijaga identik.
- **Tipe bersama:** DTO di `src/types/` diimpor oleh backend maupun frontend, sehingga bentuk response API selalu sinkron dengan yang dipakai UI.
- **Password hashing:** PBKDF2-SHA256 (100.000 iterasi) via Web Crypto API — edge-native, tanpa dependency native. Format tersimpan: `pbkdf2$<iterations>$<salt>$<hash>`. Lihat `src/api/utils/password.ts`.
- **JWT:** HS256 via `hono/jwt`. Catatan: pada Hono 4.12+, `verify()` mewajibkan argumen algoritma ketiga — `verify(token, secret, "HS256")`.
- **Pencegahan N+1:** Menampilkan jadwal sebulan hanya butuh 4 query — jadwal, hari libur, minggu, dan menu dimuat sekali lalu dirakit di memori (`ScheduleService.loadContext`). Pencarian riwayat hanya 1 query ber-`JOIN` yang hasilnya dikelompokkan per tanggal di memori.
- **Pencarian aman wildcard:** `%` dan `_` pada kata kunci pencarian di-escape (`utils/sql.ts`) sehingga diperlakukan sebagai karakter literal, bukan pola `LIKE`. Rentang pencarian dibatasi 400 hari (satu tahun ajaran) untuk membatasi beban query.
- **Rebutan tanggal dijaga database, bukan aplikasi:** `schedule_claims` punya indeks unik pada `schedule_id`. Pengecekan "sudah diambil belum?" di service hanya untuk pesan yang ramah — dua orang tua yang menekan tombol pada detik yang sama sama-sama lolos pengecekan itu, lalu salah satunya ditolak SQLite dan ditangkap sebagai `already_claimed` (409) beserta nama pemenangnya. Diuji dengan 5 permintaan serentak: tepat satu berhasil.
- **Klaim = sumber kebenaran petugas:** Mengambil tanggal ikut menulis `schedules.petugas_name` (nama anak) dan `petugas_parent_name` (nama orang tua); membatalkan mengosongkannya lagi. Dengan begitu seluruh tampilan yang sudah merender petugas ikut terisi tanpa perubahan tambahan, dan tidak ada dua sumber kebenaran soal siapa yang bertugas. Sebaliknya, tanggal yang petugasnya **sudah terisi tanpa klaim** berarti ditunjuk korlas dari daftar piket manual — tanggal itu tidak ikut diperebutkan (`already_assigned`).
- **Petugas = relasi ke siswa, bukan teks bebas:** Kolom *Petugas* pada tabel jadwal kini dropdown
  berisi siswa kelas itu, dan kolom *Orang tua* terisi otomatis (read-only) dari siswa terpilih.
  Sumbernya `GET /classes/:class/roster`. Yang tersimpan adalah `petugas_student_id` +
  `petugas_parent_id`; nama di `petugas_name`/`petugas_parent_name` **diturunkan server** dari id
  itu, sehingga body request yang menyelipkan nama sendiri akan ditimpa (`resolvePetugas` di
  `src/api/schedules/service.ts`). Konsistensi petugas ditegakkan **di satu tempat itu saja**,
  bukan oleh foreign key: petugas dicari di roster kelas baris yang bersangkutan, sehingga
  `petugas_not_found` (400) tetap muncul bila id-nya bukan siswa kelas itu. Kenapa FK komposit
  dilepas — lihat catatan *"Foreign key komposit tidak dipakai untuk petugas"* di bawah.
  Kolomnya **nullable tanpa backfill** — jadwal lama hasil impor tetap
  menampilkan namanya, hanya id-nya kosong sampai korlas memilih ulang, dan `PUT` tanpa menyebut
  `petugasStudentId` tidak mengubah apa pun. `petugasStudentId: null` berarti "kosongkan".
- **Siklus hidup jadwal:** `draft` (bisa diedit) → `locked` (dibekukan **admin**) → `published` (tampil ke orang tua). Orang tua hanya melihat baris `published`; admin/korlas melihat semua. Kunci & buka kunci adalah wewenang admin, sehingga korlas tidak bisa membekukan maupun mencairkan jadwal. Baris `locked`/`published` menolak `PUT`/`DELETE` dengan 409, dan publikasi sebulan gagal selama masih ada `draft`. Konsekuensi praktisnya: korlas harus meninggalkan petugas kosong **sebelum** publikasi bila ingin tanggal itu direbutkan — setelah terbit, barisnya tidak bisa diedit lagi (admin pun harus membuka kuncinya dulu lewat `unlock`).
- **`beforeinstallprompt` ditangkap sedini mungkin:** Event pemasangan PWA hanya menyala **sekali**, segera setelah Chrome memvalidasi manifest + service worker — jauh sebelum `PWAInstallPrompt` sempat dirender, karena komponen itu ada di dalam `AppShell` yang baru muncul setelah sesi diverifikasi ke `/auth/me`. Karena itu event-nya ditangkap skrip klasik inline di `<head>` `index.html` dan disimpan di `window.__pwaInstallPrompt`; `usePWA` membacanya saat mount. Tanpa ini tombol "Pasang" tidak pernah muncul. Skripnya harus klasik dan di `<head>`, sebab bundel aplikasi bertipe module dan otomatis ditunda.
- **Duplikasi minggu:** `POST /schedules/copy` menyalin Senin–Jumat berdasarkan **offset hari**, bukan tanggal absolut. Hari di minggu tujuan yang sudah terisi dilewati kecuali `overwrite: true`. Hari libur ikut tersalin tanpa menu.
- **Banyak anak per orang tua:** Relasi `parents 1 ── n students` (kunci `students.parent_id`, `ON DELETE CASCADE`). Saat `PUT /parents/:id`, daftar `students` bersifat **menggantikan**: entri ber-`id` yang masih dikirim akan diperbarui, entri tanpa `id` dibuat baru, dan entri yang tidak disebut lagi dihapus. `id` hanya dipercaya bila anak itu memang milik orang tua tersebut, sehingga id milik orang tua lain tidak bisa dibajak (`syncStudents` di `src/api/parents/service.ts`).
- **RBAC juga di UI:** Selain `requireRole(...)` di API, setiap halaman yang punya `useMutation` (`menu`, `kategori`, `jadwal`, `orang-tua`) digerbangi lewat `<RoleGate need="...">` — `need="catalog"` (admin saja) untuk menu/kategori, `need="schedule"` (admin + korlas) untuk kelola jadwal, dan `need="admin"` untuk halaman orang tua/dashboard. Orang tua tidak melihat tombol tambah/ubah/hapus sama sekali, bukan sekadar ditolak server; di halaman jadwal, korlas tetap melihat kontrol penyuntingan kelasnya tetapi tombol **Kunci bulan** disembunyikan karena itu wewenang admin.
- **Jadwal per kelas = baris sendiri:** Setiap kelas memiliki **baris jadwalnya sendiri** (bukan satu baris global dengan pengecualian). Karena itu `schedules` memakai indeks unik gabungan `UNIQUE(schedule_date, class_name)` — tanggal yang sama boleh muncul beberapa kali selama kelasnya berbeda. Konsekuensinya `class_name` **wajib** diisi, dan tanggal yang belum diisi untuk suatu kelas memang tampil kosong. Alternatif "satu baris global + penanda `'*'`" sengaja **tidak** dipakai agar tidak ada dua lapis resolusi (global vs override) di setiap pembacaan.
- **Penentuan kelas saat baca/tulis (`classScope.ts`):** Semua pembacaan jadwal menerima `?class=` opsional. Bila kosong, kelas ditentukan dari peran: admin → kelas pertama yang tersedia, korlas → kelasnya sendiri, orang tua → kelas anak aktif pertamanya. Kelas di luar cakupan menghasilkan **403**. Saat menulis, admin **wajib** menyebut kelas (`class_required` → 400) agar tidak ada penulisan lintas kelas yang tidak disengaja, sedangkan korlas terkunci ke `user.className` dan menyebut kelas lain → 403.
- **Guard tingkat baris:** Untuk `PUT`/`DELETE /schedules/:id`, kelas ditentukan oleh **baris yang ada di database**, bukan oleh input klien. Handler memuat baris lebih dulu lalu memanggil `canWriteClass(user, row.className)` — sehingga korlas tidak bisa membajak baris kelas lain dengan menghilangkan atau memalsukan `className`.
- **Daftar kelas tidak punya tabel:** Kelas sengaja **tidak** dijadikan tabel tersendiri (konsisten dengan `students.class_name` yang sudah berupa teks bebas). Daftarnya **diturunkan** dari gabungan `students.class_name`, `users.class_name` (korlas), dan `schedules.class_name`, lalu dinormalkan + diurutkan natural (`localeCompare(..., { numeric: true })`, sehingga `'2'` mendahului `'10'`). Endpoint `GET /classes` mengembalikan daftar yang **sudah dipersempit sesuai peran** pemanggil, plus `default`.
- **Hari libur tetap global:** Tabel `holidays` berlaku sekolah-wide dan **hanya admin** yang boleh mengubahnya. Korlas bisa menandai satu hari sebagai "libur kelas" lewat catatan jadwal kelasnya, tetapi tidak bisa menambah/mengubah hari libur sekolah. Statistik harian (`/stats/summary`) menghitung `isHoliday` bila ada hari libur global **atau** seluruh baris kelas pada tanggal itu bertanda libur.
- **Kelas ikut di JWT:** `className` korlas disertakan sebagai claim di JWT (selain di response login), sehingga pengecekan cakupan kelas tidak perlu query tambahan ke tabel `users`.
- **Soft delete:** Menghapus menu yang masih dipakai jadwal akan mengarsipkannya (bukan menghapus), agar jadwal lama tidak kehilangan referensi. Akun orang tua dinonaktifkan secara default; hapus permanen butuh `?hard=true`.
- **Utilitas class:** `cn()` di `src/lib/cn.ts` hanya menggabung string — **tidak** melakukan dedupe seperti `tailwind-merge`. Bila dua utility menyentuh properti sama (mis. `w-full` bawaan kontrol form vs `w-28` dari pemanggil), pemenangnya ditentukan urutan di stylesheet dan `w-full` selalu menang. Karena itu `Input`/`Select`/`Textarea` memakai **`cnControl(base, className)`**, yang membuang `w-full` ketika pemanggil memberi utility lebar (`w-*`, `min-w-*`, `basis-*`). Gunakan `cnControl` untuk kontrol form baru, bukan `cn`.
- **Folder migrasi terpisah dari seed:** `seed.sql` diletakkan di `drizzle/seed.sql`, **bukan** di `drizzle/migrations/`. Wrangler mengeksekusi setiap file `.sql` di dalam `migrations_dir` sebagai migrasi — menaruh seed di sana membuat seed dijalankan dua kali dan gagal dengan `table parents has no column named ...`.
- **Transaksi D1:** Tidak ada transaksi interaktif panjang — gunakan `db.batch([...])`.
- **Secrets:** `JWT_SECRET` dan token Cloudflare disimpan sebagai Worker Secret, bukan di repo.
- **Local vs Remote D1:** `wrangler dev` memakai D1 lokal (miniflare) di `.wrangler/state/` — datanya terpisah dari remote, tapi dipakai bersama oleh `wrangler d1 execute --local` dan dev server.
- **Ekspor Excel tanpa dependency:** `.xlsx` hanyalah sebuah ZIP berisi XML, jadi `src/api/utils/xlsx.ts` menulisnya sendiri — ZIP mode **store** (tanpa DEFLATE, karena `CompressionStream` tidak selalu ada di runtime edge), tabel CRC-32, dan SpreadsheetML dengan string inline. Alasannya: Worker tidak perlu paket tambahan, dan berkasnya tetap terbuka di Excel, LibreOffice, maupun Google Sheets. Isi lembar dirakit di `src/api/schedules/export.ts` dari **DTO yang sama** dengan yang dipak UI, jadi hasil unduhan tidak pernah berbeda dari yang tampil di layar — termasuk hari dari bulan sebelah yang ikut tampil pada blok pekan pertama/terakhir.
- **Penghitung gagal masuk dihitung di SQL, bukan dibaca dulu:** `registerFailedLogin` memakai `CASE WHEN last_failed_login_at < datetime('now','-900 seconds') THEN 1 ELSE failed_login_attempts + 1 END`. Kalau penghitungnya dibaca lalu ditulis dari aplikasi, dua percobaan yang berbarengan bisa sama-sama membaca nilai lama dan lolos. Kuncinya **tidak kedaluwarsa sendiri** — sengaja, karena yang bisa memastikan pemiliknya sah hanya admin sekolah.
- **Mode tiru menyimpan sesi admin:** sebelum token orang tua dipakai, token admin dipindahkan ke `psp_impersonator` di `localStorage`, sehingga `stopImpersonating()` bisa mengembalikan sesi aslinya. Bilah kuning di atas layar menandakan sesi tiru sedang aktif — tanpa penanda itu mudah lupa sedang masuk sebagai orang lain.
- **Kolom yang belum dimigrasi tidak melempar galat di SQLite:** nama kolom berkutip ganda yang **tidak ada** diperlakukan sebagai **string literal**, bukan error. Jadi `SELECT "locked_at"` pada database yang migrasinya belum diterapkan mengembalikan teks `"locked_at"` — nilai yang selalu truthy. Inilah yang pernah membuat **seluruh** akun dijawab `423 "Akun terkunci"` padahal baru sekali salah password: kode sudah memakai kolom yang belum ada di produksi. Karena itu `isLocked()` di `src/api/auth/service.ts` memeriksa **bentuk** nilainya (`YYYY-MM-DD HH:MM:SS`), bukan sekadar "ada isinya"; dengan begitu skema yang tertinggal gagal dengan `500` yang jujur, bukan pesan menyesatkan.
- **Foreign key komposit tidak dipakai untuk petugas:** Rancangan awal `0007` mengikat `petugas_student_id` ke `students` lewat **dua FK komposit** — `(class_name, petugas_student_id) → students(class_name, id)` agar petugas wajib siswa kelas baris itu, dan `(petugas_student_id, petugas_parent_id) → students(id, parent_id)` agar pasangan siswa–orang tua dijamin ada. Rancangan itu **dibatalkan** setelah terbukti tidak bisa dijalankan lewat migrasi D1:
  1. FK komposit menuntut indeks **unik** pada pasangan kolom target yang **persis, dalam urutan itu** (`UNIQUE(class_name, id)`, `UNIQUE(id, parent_id)`) — indeks non-unik atau unik pada pasangan lain tidak diterima, dan galatnya baru muncul sebagai `foreign key mismatch - "__new_schedules" referencing "students"` pada `PRAGMA foreign_key_check`, bukan saat `CREATE TABLE`. Karena itu tabel `schedules` harus dibangun ulang.
  2. Cara lazim mematikan penegakan FK selama rebuild — `PRAGMA foreign_keys=OFF` — **diabaikan secara senyap di dalam transaksi**, dan `wrangler d1 migrations apply` membungkus setiap migrasi dalam transaksi. Di production ini muncul sebagai `FOREIGN KEY constraint failed: SQLITE_CONSTRAINT_FOREIGNKEY` pada `INSERT INTO __new_schedules`, padahal lokal berhasil — lokal mengeksekusi pernyataan satu per satu, sehingga PRAGMA-nya benar-benar berlaku. Yang berbeda **semantik transaksi**, bukan datanya. (`PRAGMA defer_foreign_keys=ON` *memang* bekerja di dalam transaksi, tapi hanya menunda pemeriksaan sampai `COMMIT` — tidak menyelesaikan baris lama yang FK-nya sudah tidak cocok.)
  3. Bahkan pada jalur yang "berhasil" tabel hasilnya **korup**: karena penegakan FK tidak pernah benar-benar kembali aktif, `PRAGMA foreign_key_check` melaporkan **292 pelanggaran** terhadap `students`.
  4. `ON UPDATE cascade` pada FK yang menyertakan `class_name` menimbulkan efek samping nyata: memindahkan anak ke kelas lain ikut menulis `class_name` pada baris jadwalnya, dan itu menabrak `UNIQUE(schedule_date, class_name)` bila baris tujuan sudah ada.
  Karena itu `0007` hanya menambahkan kolom (`ALTER TABLE ... ADD COLUMN`), tanpa FK dan tanpa rebuild; keempat FK `schedules` yang tersisa (`week_id`, `menu_id`, `locked_by`, `published_by`) adalah FK kolom tunggal yang sudah ada sejak `0000`. Kejujuran relasi petugas dijaga `resolvePetugas()` di `src/api/schedules/service.ts` — satu tempat, dipakai bersama oleh `createSchedule`/`updateSchedule`/`copyWeek`/`claims`.
- **`PRAGMA foreign_keys` adalah no-op di dalam transaksi:** SQLite mendokumentasikannya sendiri — PRAGMA ini **diabaikan tanpa peringatan** bila ada transaksi aktif. Praktisnya: membungkus `PRAGMA foreign_keys=OFF` + rebuild tabel + `PRAGMA foreign_keys=ON` dalam satu `BEGIN`/`COMMIT` **tidak** mematikan FK sama sekali. Diuji langsung: di dalam `BEGIN`, `PRAGMA foreign_keys` masih melaporkan `1` sesudah diset `OFF`. Inilah yang membuat migrasi berjalan di lokal (autocommit per pernyataan) tetapi gagal di D1 (satu transaksi untuk seluruh file). Yang bekerja di dalam transaksi adalah `PRAGMA defer_foreign_keys=ON` — menunda pemeriksaan sampai `COMMIT`.
- **Migrasi gagal = Worker lama tetap melayani, dan itu tidak kelihatan:** `bun run deploy` menjalankan `bun run build` → `bun run db:migrate` sebelum `wrangler deploy --env production`. Kalau `db:migrate` keluar dengan kode ≠ 0, `wrangler deploy` **tidak pernah dijalankan** — jadi produksi tetap melayani bundel terakhir yang pernah terunggah, tanpa tanda apa pun di UI bahwa yang berjalan adalah versi lama. Akibatnya sebuah fitur bisa "sudah diperbaiki" di `main` tapi masih hidup sebagai bug di produksi. Bila ada perubahan yang tidak muncul padahal commit-nya sudah di-`push`, periksa dulu **apakah migrasi terakhir berhasil** — jangan mencari bug di kode frontend.
- **Jangan menyimpulkan dari keluaran wrangler yang dipotong pipe:** keluaran JSON `wrangler d1 execute --json` harus diurai **utuh**. Memipenya ke `head` / `paste - - -` / `tr` memotong baris terakhir secara senyap, dan sisa yang tampil terlihat seperti fakta yang sah. Pernah terjadi: `pragma_table_info('schedules')` disimpulkan tidak memuat `petugas_name`/`petugas_parent_name`, padahal kolom itu ada (total 17 kolom) — yang hilang hanya baris terakhir. Selalu tulis keluaran ke berkas lebih dulu, baru urai dengan parser JSON.
- **Bundel Worker dibangun oleh `vite build`, bukan oleh `wrangler`:** plugin Cloudflare menulis `dist/pizza_snack_play/index.js` beserta `wrangler.json`-nya, plus `.wrangler/deploy/config.json` yang mengarahkan `wrangler deploy` ke berkas itu (`main: index.js`, `no_bundle: true`). Mengunggah berkas itu memang benar — asalkan `bun run build` sudah jalan, karena di situlah berkas tersebut **dibangun ulang dari `src/`**. Konsekuensinya satu hal yang perlu diingat: `wrangler deploy` **tanpa** `bun run build` lebih dulu akan mengunggah bundel terakhir yang ada di `dist/`, bukan kode terkini. Selalu lewat `bun run deploy`.
- **Satu mekanisme migrasi untuk lokal dan remote:** pencatatannya di tabel `d1_migrations` lewat `wrangler d1 migrations apply` (`db:migrate:local` / `db:migrate`), sesuai `migrations_dir` di `wrangler.json`. Sebelumnya remote memakai `drizzle-kit migrate` (`__drizzle_migrations`) sedangkan lokal memakai wrangler, sehingga migrasi 0006 hanya tercatat di sisi lokal — akar bug "akun terkunci" di atas. `drizzle-kit push` menembak langsung ke D1 remote tanpa mencatat apa pun, jadi perubahan skema produksi tidak boleh lewat situ. `bun run deploy` kini menjalankan `db:migrate` sebelum mengunggah Worker.

---

## Dokumentasi

- [PRD — Product Requirements Document v1.10](docs/PRD_Pizza_Snack_Play.md)
- [Struktur Tabel — DDL + Drizzle + Seed + Queries](docs/Struktur_Tabel_Pizza_Snack_Play.md)
- [UAT Result](docs/UAT_Result.md)
- [Panduan Orang Tua — dek sosialisasi 15 halaman](Panduan%20Orang%20Tua%20Pizza%20Snack%20Play/STORY.md) (`.pptx` + sumber `slides/*.slide`)

## Testing

Uji end-to-end memakai dev server yang hidup dan D1 lokal ter-seed
(`bun run dev` + `bun run db:migrate:local` + `bun run db:seed:local`).

```bash
bun run test              # keempat suite di bawah, berurutan
bun run test:auth         # 33 skenario  — login, JWT, role, ubah password
bun run test:api          # 309 skenario — jadwal, klaim, katalog, akun, ekspor Excel, batas masuk
bun run test:status       # 22 skenario  — status jadwal bulanan
bun run test:profile      # 33 skenario  — layanan mandiri anak (idempoten)
```

Semua suite idempoten: aman dijalankan berulang, dan membersihkan data buatan
ujinya sendiri. Port dev server ditulis di konstanta `BASE` masing-masing script
(default `http://localhost:5173/api`) — sesuaikan bila portnya bergeser.

Skenario UAT manual (daftar peran & langkah) terpisah:

```bash
bun run scripts/run-uat.mjs
```

## Sumber Data

Salinan file sumber ada di repo: [`data/jadwal_piket_snack.txt`](data/jadwal_piket_snack.txt)
(asal: `D:\WORKS\1pis\sekolahku\jadwal_piket_snack_pizza_snack_play.txt`).

- **Agustus 2026** — 5 minggu (3–31 Agustus 2026)
- **September 2026** — 5 minggu (1–30 September 2026)

Setiap hari kerja (Senin–Jumat): **makanan utama + buah pendamping**.

`scripts/seed.ts` mem-parse `data/jadwal_piket_snack.txt` (menu) dan `data/output_jadwal_piket.txt` (petugas) menghasilkan **10 minggu, 42 menu, 84 menu item, 258 jadwal, 39 akun (1 admin, 1 korlas, 37 orang tua), 4 anak** (1 hari libur: 17 Agustus 2026).

> **258 jadwal = ~42 tanggal × 6 kelas** (1, 2, 3, 4, 5, 6). Menu bersifat sekolah-wide — satu menu
> per hari disalin ke semua kelas. Yang membedakan tiap kelas adalah **petugas piket** (nama siswa
> yang ambil snack), dibaca dari `data/output_jadwal_piket.txt` untuk September 2026 (Kelas 1–5).
> Kelas 6 dan Agustus belum ada data petugas — kolomnya dibiarkan kosong.

**Cara kerja parser:** setiap blok minggu dibaca sebagai rentang tanggal, lalu setiap tanggal dalam rentang dicocokkan dengan nama harinya (Senin–Jumat) — jadi tanggal tidak perlu ditulis eksplisit di file sumber.

---

## Kredit

Di-scaffold dari template [ZulfiFazhar/bhvr-template](https://github.com/ZulfiFazhar/bhvr-template).

Belajar HONO dan Cloudflare di [Fullstack Cloudflare & Hono](https://youtube.com/playlist?list=PLLCXhfggeqE97wnuesWK9UHkYEv2-b8FB&si=lccp16MRfge1kgW6)

## Lisensi

Private — untuk penggunaan internal sekolah.
