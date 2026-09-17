# Product Requirements Document (PRD)
## Aplikasi "Pizza Snack Play"

---

| Field | Value |
|-------|-------|
| **Nama Produk** | Pizza Snack Play |
| **Versi Dokumen** | 1.2 |
| **Tanggal** | 17 September 2026 |
| **Stack Teknologi** | BHVR — Bun + Hono + Vite + React (Cloudflare Workers + D1) |
| **Status** | Draft for Review |
| **Sumber Data** | Jadwal Piket Snack — Sekolah (Sept 2026 & Agustus 2026) |
| **Perubahan v1.1** | Akses orang tua diubah dari publik (tanpa login) menjadi wajib login (autentikasi) |
| **Perubahan v1.2** | Stack disesuaikan dengan template `bhvr-template` yang sebenarnya: React 19 (bukan Vue 3), Cloudflare Workers + D1 (bukan bun:sqlite lokal) |

---

## 1. Ringkasan Produk (Executive Summary)

**Pizza Snack Play** adalah aplikasi manajemen dan informasi jadwal piket snack sekolah. Aplikasi ini memungkinkan pengelola sekolah (admin/guru piket) untuk mengelola jadwal menu snack harian, sementara orang tua dan siswa dapat melihat jadwal snack yang akan disajikan setiap harinya setelah melakukan login. Data utama aplikasi berasal dari jadwal piket snack bulanan yang berisi menu snack untuk hari Senin–Jumat, mencakup kombinasi makanan utama dan buah pendamping.

### Tujuan Utama
- **Digitalisasi jadwal piket snack** — mengganti dokumen fisik/manual menjadi aplikasi yang dapat diakses kapan saja.
- **Transparansi menu** — orang tua/siswa tahu menu snack hari ini dan minggu depan, dengan akses melalui login aman.
- **Manajemen menu** — admin dapat menambah, mengedit, dan mengatur menu snack per hari, minggu, dan bulan.
- **Katalogisasi menu** — membangun database menu snack yang dapat dipakai berulang (rotasi menu).
- **Keamanan akses** — setiap orang tua memiliki akun login pribadi untuk melihat jadwal snack, memastikan data hanya diakses oleh wali yang berwenang.

---

## 2. Latar Belakang & Masalah

Saat ini jadwal piket snack disusun dalam format teks manual (lihat lampiran), dengan struktur:
- Dikelompokkan per minggu (misal: 1–4 September, 7–11 September, dst.)
- Setiap hari Senin–Jumat memiliki 2 item: **makanan utama** + **buah pendamping**
- Contoh: "Selasa: Roti isi coklat + jeruk"

### Masalah yang Dihadapi
1. **Tidak ada pencarian** — sulit mencari kapan menu tertentu disajikan.
2. **Tidak ada notifikasi** — orang tua tidak tahu menu hari ini tanpa bertanya.
3. **Sulit diedit** — perubahan menu manual rawan kesalahan.
4. **Tidak ada riwayat** — tidak ada data menu bulan-bulan sebelumnya.
5. **Tidak ada katalog** — menu yang sudah pernah disusun tidak dapat dipakai ulang dengan mudah.

---

## 3. Target Pengguna (User Personas)

### 3.1 Admin / Guru Piket
- **Peran:** Mengelola jadwal snack (CRUD menu, atur jadwal harian/minggu/bulan).
- **Kebutuhan:** Form input cepat, duplikasi jadwal, template menu, preview mingguan.
- **Akses:** Dashboard admin (web app React).

### 3.2 Orang Tua / Siswa
- **Peran:** Melihat jadwal snack hari ini, minggu ini, dan bulan ini.
- **Kebutuhan:** Tampilan kalender/list sederhana, notifikasi opsional, akses login pribadi.
- **Akses:** Wajib login (akun pribadi yang diberikan admin/sekolah). Setiap orang tua memiliki akun dengan username & password yang diatur oleh admin sekolah. Belum login hanya melihat halaman login, tidak dapat melihat jadwal.

### 3.3 Koperasi / Kantin
- **Peran:** Mengetahui menu yang harus disiapkan.
- **Kebutuhan:** Daftar belanja/persiapan per minggu.
- **Akses:** View-only dengan ekspor PDF/Excel.

---

## 4. Fitur Utama (Features)

### F1: Manajemen Menu Snack (Admin)
- **Tambah menu** — input nama makanan utama + buah pendamping.
- **Edit menu** — ubah komponen menu.
- **Hapus menu** — soft delete (arsip).
- **Katalog menu** — semua menu yang pernah dibuat, bisa dipakai ulang.
- **Tagging** — kategori: "rebus", "goreng", "kukus", "panggang", "buah", dll.

### F2: Manajemen Jadwal (Admin)
- **Atur jadwal harian** — pilih tanggal → pilih menu → simpan.
- **Atur jadwal mingguan** — input rentang tanggal (Senin–Jumat) → assign menu per hari.
- **Duplikasi jadwal** — copy jadwal minggu ke minggu lain.
- **Template bulanan** — generate jadwal sebulan dari template.
- **Override** — ubah menu untuk tanggal tertentu tanpa mengganggu jadwal lain.

### F3: Tampilan Jadwal (User — Wajib Login)
- **Jadwal hari ini** — card menampilkan menu hari ini (makanan + buah). Hanya tampil setelah login.
- **Jadwal minggu ini** — list Senin–Jumat dengan menu masing-masing. Hanya tampil setelah login.
- **Jadwal bulanan** — kalender/komponen grid menampilkan semua hari di bulan tsb. Hanya tampil setelah login.
- **Pencarian menu** — cari berdasarkan nama makanan/buah, lihat kapan disajikan. Hanya tampil setelah login.

### F3b: Autentikasi Orang Tua
- **Login** — halaman login dengan username & password.
- **Akun pribadi** — setiap orang tua memiliki akun yang diberikan oleh admin sekolah.
- **Manajemen akun (Admin)** — admin dapat membuat, edit, dan nonaktifkan akun orang tua.
- **Profil** — orang tua dapat melihat profil dan ubah password sendiri.
- **Session/Token** — login menghasilkan JWT token dengan masa berlaku tertentu, disimpan di cookie/localStorage.
- **Role-based access** — role `parent` hanya dapat melihat jadwal (read-only), role `admin` dapat CRUD.

### F4: Kategori & Filtering
- **Filter by kategori** — mis. "menu gorengan saja minggu ini".
- **Filter by buah** — "kapan terakhir jeruk disajikan?"
- **Statistik ringan** — jumlah menu unik per bulan, distribusi kategori.

### F5: Ekspor & Cetak
- **Ekspor PDF** — jadwal mingguan/bulanan untuk cetak/pengumuman.
- **Ekspor Excel** — untuk perencanaan koperasi.

### F6: Notifikasi (Opsional / Future)
- **Push notification** — pengingat menu hari ini (opsional, phase 2).
- **Broadcast WhatsApp** — integrasi opsional.

---

## 5. Struktur Data dari File Sumber

Berdasarkan analisis file `jadwal_piket_snack_pizza_snack_play.txt`, data dapat dimodelkan sebagai:

```
Bulan → Minggu (rentang tanggal) → Hari → Menu (makanan utama + buah)
```

### Contoh Pemetaan Data:
| Tanggal | Hari | Makanan Utama | Buah Pendamping | Bulan |
|---------|------|---------------|-----------------|-------|
| 2 Sep 2026 | Selasa | Roti isi coklat | Jeruk | September |
| 3 Sep 2026 | Rabu | Tahu isi sayur | Melon | September |
| 4 Sep 2026 | Kamis | Pisang panggang coklat keju | Nanas madu | September |
| 5 Sep 2026 | Jumat | Urap jagung | Semangka | September |
| 7 Sep 2026 | Senin | Ubi cilembu | Jambu air | September |
| ... | ... | ... | ... | ... |

### Catatan:
- Hari **Sabtu & Minggu** tidak ada jadwal (libur sekolah).
- Ada kemungkinan **hari libur** di tengah minggu (mis. "Senin: Libur" pada 17 Agustus 2026).
- Setiap hari kerja memiliki **tepat dua item**: makanan utama + buah.
- Beberapa item bersifat campuran, mis. "Pisang panggang coklat keju" (makanan olahan, bukan buah segar).

---

## 6. Arsitektur Teknis (Stack BHVR)

### 6.1 Komponen Stack

| Lapisan | Teknologi | Penjelasan |
|---------|-----------|------------|
| **B**un | Runtime & Package Manager | Runtime JavaScript/TypeScript cepat; dipakai untuk install, script, dan tooling. Bukan runtime server produksi. |
| **H**ono | Backend API | Web framework ultrafast, middleware-based. Berjalan di atas **Cloudflare Workers**. |
| **V**ite | Build Tool | Dev server dengan HMR instan + build produksi teroptimasi. |
| **R**eact | Frontend | React 19 + **React Router v7** untuk routing + **TanStack Query** untuk data fetching/caching. |
| **Database** | Cloudflare D1 | Serverless SQLite yang terintegrasi dengan Workers, diakses via **Drizzle ORM**. |
| **Styling** | Tailwind CSS v4 | Utility-first CSS, via `@tailwindcss/vite` plugin. |
| **Deployment** | Cloudflare Workers | Serverless edge runtime, aset statis disajikan dari `./dist/client` dengan SPA fallback. |

**Penting — koreksi dari v1.1:** Dokumen versi sebelumnya menyebut frontend **Vue 3** dan database **bun:sqlite lokal**. Setelah template `bhvr-template` di-scaffold, stack sebenarnya adalah **React 19** dan **Cloudflare D1**. Skema database (11 tabel) tetap berlaku karena D1 adalah SQLite — hanya lapisan akses dan deployment yang berubah.

### 6.2 Arsitektur Sistem

```
┌─────────────────────────────────────────────┐
│              Browser / Client                │
│   React 19 + React Router v7 + TanStack     │
│              Query (Vite build)             │
└──────────────────┬──────────────────────────┘
                   │ HTTP / JSON API
                   ▼
┌─────────────────────────────────────────────┐
│        Cloudflare Workers (Edge)            │
│  ┌───────────────────────────────────────┐  │
│  │         Hono App (basePath /api)      │  │
│  │   Routes → Controllers → Services     │  │
│  │              → Repositories           │  │
│  └───────────────────┬───────────────────┘  │
│                      │                      │
│  ┌───────────────────▼───────────────────┐  │
│  │        Drizzle ORM (sqlite-core)      │  │
│  └───────────────────┬───────────────────┘  │
│                      │ binding: "bhvr"      │
│  ┌───────────────────▼───────────────────┐  │
│  │   Cloudflare D1 (Serverless SQLite)   │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  Static Assets: ./dist/client (SPA)         │
└─────────────────────────────────────────────┘
```

### 6.3 Struktur Folder Proyek (Sesuai Template)

```
pizza-snack-play/
├── public/                       # Static assets (favicon, screenshot)
├── src/
│   ├── api/                      # Cloudflare Worker — Hono backend
│   │   ├── index.ts              # Worker entry point (basePath /api)
│   │   ├── auth/                 # Fitur auth (BARU)
│   │   │   ├── route.ts
│   │   │   ├── controller.ts
│   │   │   ├── service.ts
│   │   │   └── repository.ts
│   │   ├── parents/              # Fitur kelola orang tua (BARU)
│   │   │   ├── route.ts
│   │   │   ├── controller.ts
│   │   │   ├── service.ts
│   │   │   └── repository.ts
│   │   ├── menus/                # Fitur menu snack (BARU)
│   │   ├── schedules/            # Fitur jadwal (BARU)
│   │   ├── categories/           # Fitur kategori (BARU)
│   │   ├── reports/              # Ekspor PDF/Excel (BARU)
│   │   └── utils/
│   │       └── response.ts       # Helper responseOK / responseError
│   ├── database/
│   │   ├── db.ts                 # Inisialisasi Drizzle + D1 binding + tipe Db
│   │   └── schema.ts             # Drizzle schema (11 tabel) ✅
│   ├── routes/                   # TanStack Router — halaman frontend
│   │   ├── __root.tsx            # Root layout
│   │   ├── index.tsx             # Landing page + cek koneksi ✅
│   │   ├── login.tsx             # Halaman login (BARU)
│   │   ├── week.tsx              # Jadwal mingguan (BARU)
│   │   ├── month.tsx             # Jadwal bulanan (BARU)
│   │   ├── profile.tsx           # Profil orang tua — ubah password (BARU)
│   │   └── admin/                # Halaman admin (BARU)
│   │       ├── dashboard.tsx
│   │       ├── menus.tsx
│   │       ├── schedules.tsx
│   │       └── parents.tsx       # Kelola akun orang tua
│   ├── services/                 # Service layer frontend (API client)
│   │   ├── authService.tsx       # (BARU)
│   │   ├── menuService.tsx       # (BARU)
│   │   └── scheduleService.tsx   # (BARU)
│   ├── lib/
│   │   └── http.ts               # HTTP client (ky) + injeksi JWT
│   ├── types/
│   │   └── apiResponse.ts        # Tipe ApiResponse
│   ├── assets/                   # SVG / gambar
│   ├── index.css                 # Global styles (Tailwind)
│   ├── main.tsx                  # React + Router entry point
│   └── routeTree.gen.ts          # Auto-generated route tree
├── drizzle/                      # Folder migrasi D1 (drizzle-kit)
├── docs/
│   ├── PRD_Pizza_Snack_Play.md
│   └── Struktur_Tabel_Pizza_Snack_Play.md
├── .env.example                  # CLOUDFLARE_ACCOUNT_ID, DATABASE_ID, D1_TOKEN
├── bun.lock
├── drizzle.config.ts
├── eslint.config.js
├── index.html
├── package.json
├── tsconfig.json                 # Project references
├── tsconfig.app.json             # Frontend (DOM, React)
├── tsconfig.worker.json          # Backend (Cloudflare, Node compat)
├── tsconfig.node.json            # Build tools
├── vite.config.ts                # Cloudflare + Tailwind + path alias
├── worker-configuration.d.ts     # Tipe binding auto-generated
└── wrangler.json                 # Konfigurasi Cloudflare Worker + D1
```

### 6.4 Pola Arsitektur Backend (N-Layered)

Setiap fitur backend mengikuti pola berlapis yang sama seperti contoh `user/`:

| Lapisan | Tanggung Jawab | Contoh File |
|---------|----------------|-------------|
| **Route** | Definisi endpoint & HTTP method | `src/api/auth/route.ts` |
| **Controller** | Terima request, validasi, kirim response | `src/api/auth/controller.ts` |
| **Service** | Business logic (hash password, verifikasi, generate JWT) | `src/api/auth/service.ts` |
| **Repository** | Akses data via Drizzle (query D1) | `src/api/auth/repository.ts` |

Path alias: `@/*` untuk frontend, `@api/*` untuk backend.

### 6.5 Konfigurasi Wrangler

```json
{
  "name": "pizza-snack-play",
  "main": "./src/api/index.ts",
  "compatibility_date": "2025-10-08",
  "compatibility_flags": ["nodejs_compat"],
  "observability": { "enabled": true },
  "assets": {
    "directory": "./dist/client",
    "not_found_handling": "single-page-application"
  },
  "d1_databases": [
    {
      "binding": "bhvr",
      "database_name": "pizza-snack-play",
      "database_id": "<DATABASE_ID>",
      "migrations_dir": "drizzle"
    }
  ]
}
```

> `compatibility_flags: ["nodejs_compat"]` diperlukan agar `bcrypt`/`argon2` dan API Node.js lain tersedia di runtime Worker. Alternatif edge-native: **Web Crypto API** (`crypto.subtle`) untuk hashing, atau library `@noble/hashes`.

### 6.6 Environment Variables

```
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_DATABASE_ID=
CLOUDFLARE_D1_TOKEN=
JWT_SECRET=              # (BARU) untuk signing JWT
```

---

## 7. API Endpoints (Rencana)

### 7.1 Auth Endpoints
| Method | Path | Deskripsi | Role |
|--------|------|-----------|------|
| POST | `/api/auth/login` | Login (username + password) → JWT token | Public |
| POST | `/api/auth/logout` | Logout (invalidate token) | Authenticated |
| GET | `/api/auth/me` | Profil user yang sedang login | Authenticated |
| PUT | `/api/auth/password` | Ubah password sendiri | Authenticated |

### 7.2 Parent (Orang Tua) Endpoints — Admin Only
| Method | Path | Deskripsi | Role |
|--------|------|-----------|------|
| GET | `/api/parents` | List semua akun orang tua | Admin |
| POST | `/api/parents` | Buat akun orang tua baru | Admin |
| PUT | `/api/parents/:id` | Edit akun orang tua | Admin |
| DELETE | `/api/parents/:id` | Nonaktifkan akun orang tua (soft delete) | Admin |

### 7.3 Menu Endpoints
| Method | Path | Deskripsi | Role |
|--------|------|-----------|------|
| GET | `/api/menus` | List semua menu (paginated) | Admin |
| GET | `/api/menus/:id` | Detail menu | Admin, Parent |
| POST | `/api/menus` | Tambah menu baru | Admin |
| PUT | `/api/menus/:id` | Edit menu | Admin |
| DELETE | `/api/menus/:id` | Soft-delete menu (arsip) | Admin |

### 7.4 Schedule Endpoints
| Method | Path | Deskripsi | Role |
|--------|------|-----------|------|
| GET | `/api/schedules/today` | Jadwal hari ini | Admin, Parent |
| GET | `/api/schedules/week?date=YYYY-MM-DD` | Jadwal minggu ini | Admin, Parent |
| GET | `/api/schedules/month?month=YYYY-MM` | Jadwal bulanan | Admin, Parent |
| POST | `/api/schedules` | Set jadwal untuk tanggal | Admin |
| POST | `/api/schedules/week` | Set jadwal untuk rentang minggu | Admin |
| POST | `/api/schedules/duplicate` | Duplikasi jadwal minggu ke minggu lain | Admin |
| DELETE | `/api/schedules/:id` | Hapus jadwal | Admin |

### 7.5 Category Endpoints
| Method | Path | Deskripsi | Role |
|--------|------|-----------|------|
| GET | `/api/categories` | List kategori | Admin, Parent |
| POST | `/api/categories` | Tambah kategori | Admin |

### 7.6 Report Endpoints
| Method | Path | Deskripsi | Role |
|--------|------|-----------|------|
| GET | `/api/reports/week/:date/pdf` | Ekspor PDF mingguan | Admin, Parent |
| GET | `/api/reports/month/:month/pdf` | Ekspor PDF bulanan | Admin, Parent |
| GET | `/api/reports/month/:month/excel` | Ekspor Excel bulanan | Admin |
| GET | `/api/reports/stats?month=YYYY-MM` | Statistik menu bulanan | Admin |

---

## 8. Alur Pengguna (User Flows)

### 8.1 Admin: Input Jadwal Mingguan
1. Login → Dashboard Admin
2. Klik "Atur Jadwal" → Pilih rentang tanggal (Senin–Jumat)
3. Untuk setiap hari → pilih menu dari dropdown (atau buat baru)
4. Simpan → jadwal tersimpan ke SQLite
5. Preview → lihat hasil tampilan mingguan

### 8.2 Orang Tua: Lihat Jadwal Hari Ini
1. Buka aplikasi → halaman login
2. Masukkan username & password (diberikan admin sekolah)
3. Login berhasil → redirect ke halaman utama "Menu Hari Ini"
4. Card menampilkan: hari, tanggal, makanan utama, buah pendamping
5. Scroll ke bawah → "Minggu Ini" list
6. Bisa lihat "Bulan Ini" dan cari menu
7. Bisa ubah password sendiri di halaman profil

### 8.3 Admin: Duplikasi Jadwal
1. Dashboard → "Duplikasi Jadwal"
2. Pilih minggu sumber (mis. minggu 1 September)
3. Pilih minggu tujuan (mis. minggu 8 September)
4. Konfirmasi → sistem copy semua jadwal, geser tanggal sesuai selisih

### 8.4 Admin: Kelola Akun Orang Tua
1. Dashboard → "Kelola Orang Tua"
2. Lihat list akun orang tua yang sudah dibuat
3. Klik "Tambah Akun" → input nama, username, password sementara
4. Simpan → akun dibuat, orang tua dapat login
5. Bisa edit/nonaktifkan akun kapan saja
6. Reset password jika orang tua lupa password

---

## 9. Tampilan / UI Screenshots (Wireframe Konsep)

### 9.1 Halaman Login (Orang Tua & Admin)
```
┌──────────────────────────────┐
│   🍕 Pizza Snack Play        │
├──────────────────────────────┤
│         LOGIN                │
│                              │
│  Username: [____________]     │
│  Password: [____________]     │
│                              │
│       [ Masuk ]              │
│                              │
│  Lupa password? Hubungi admin│
└──────────────────────────────┘
```

### 9.2 Halaman Utama (Orang Tua — Setelah Login)
```
┌──────────────────────────────┐
│   🍕 Pizza Snack Play        │
│   Halo, Ibu Sari  [Logout]   │
├──────────────────────────────┤
│  MENU HARI INI               │
│  Kamis, 17 September 2026    │
│                              │
│  🍽️ Pisang panggang coklat   │
│     + keju                   │
│  🍍 Nanas madu               │
│                              │
├──────────────────────────────┤
│  MINGGU INI                  │
│  Senin  ❌ Libur              │
│  Selasa ✅ Roti bakar + Pepaya│
│  Rabu   ✅ Gabin tape + Pir   │
│  Kamis  ✅ Telor rebus + Jeruk│
│  Jumat  ✅ Kue sus + Strawberry│
└──────────────────────────────┘
```

### 9.3 Dashboard Admin
```
┌──────────────────────────────────────────┐
│  Dashboard Admin          [Logout]        │
├──────────┬───────────────────────────────┤
│ Menu     │  Jadwal Bulan Ini             │
│ Jadwal   │  ┌─────┬─────┬─────┬─────┐   │
│ Kategori │  │ Sen │ Sel │ Rab │ Kam │   │
│ Orang Tua│  │ ... │ ... │ ... │ ... │   │
│ Laporan  │  └─────┴─────┴─────┴─────┘   │
│          │  [+ Tambah Jadwal]            │
│          │  [Duplikasi Minggu]            │
└──────────┴───────────────────────────────┘
```

### 9.4 Admin: Kelola Akun Orang Tua
```
┌──────────────────────────────────────────┐
│  Kelola Orang Tua         [Logout]        │
├──────────────────────────────────────────┤
│  [+ Tambah Akun]                          │
├──────────┬──────────┬────────┬──────────┤
│ Nama     │ Username  │ Status │ Aksi     │
│──────────┼──────────┼────────┼──────────│
│ Sari     │ sari      │ Aktif  │Edit|Hapus│
│ Budi     │ budi      │ Aktif  │Edit|Hapus│
│ Dewi     │ dewi      │ Nonaktif│Edit|Hapus│
└──────────┴──────────┴────────┴──────────┘
```

---

## 10. Non-Functional Requirements

### 10.1 Performance
- Halaman utama load < 500ms — aset statis disajikan dari edge Cloudflare (CDN global).
- API response < 100ms untuk query single record (Worker dieksekusi di edge terdekat).
- Query D1 dioptimalkan dengan index pada kolom `schedule_date`.
- Caching data fetching di frontend via TanStack Query (stale-while-revalidate).

### 10.2 Security
- **Semua endpoint dilindungi autentikasi JWT** — tidak ada endpoint publik selain `POST /api/auth/login`.
- **Role-based access control (RBAC)** — role `admin` (CRUD penuh) dan role `parent` (read-only jadwal + ubah password sendiri).
- **Orang tua wajib login** — sebelum login, hanya melihat halaman login. Setelah login, dapat melihat jadwal.
- **Admin mengelola akun orang tua** — admin membuat, edit, dan nonaktifkan akun orang tua. Orang tua tidak bisa registrasi mandiri.
- **Password hashing** — password disimpan sebagai hash. Gunakan **Web Crypto API** (`crypto.subtle`, PBKDF2) yang edge-native, atau `bcryptjs` dengan flag `nodejs_compat`.
- **JWT token** — signing via `hono/jwt` (HS256) dengan `JWT_SECRET` dari environment variable. Masa berlaku token mis. 7 hari.
- **Secrets** — `JWT_SECRET` dan token Cloudflare disimpan sebagai Worker Secret (`wrangler secret put`), bukan di repo.
- Input validation via **Zod** schema (sudah tersedia di dependency template).
- SQL injection prevention via Drizzle ORM parameterized queries.

### 10.3 Scalability
- Cloudflare D1 + Workers menskalakan otomatis di edge — tidak perlu manajemen server.
- D1 cukup untuk skala sekolah (ribuan record jadwal; limit D1 jauh lebih besar).
- Arsitektur multi-sekolah di masa depan: tambah kolom `school_id` + D1 multi-tenant, atau migrasi ke PostgreSQL (Hyperdrive).

### 10.4 Reliability
- D1 menyediakan replikasi dan backup terkelola oleh Cloudflare.
- Backup logis tambahan: `wrangler d1 export` berkala (cron job / GitHub Actions).
- Soft delete untuk semua data — tidak ada hard delete.
- Observability Worker diaktifkan (`observability.enabled: true`) untuk log & metrik.

---

## 11. Setup & Deployment

### 11.1 Prasyarat
- [Bun](https://bun.sh/) v1.x
- Akun Cloudflare + `wrangler` (sudah termasuk sebagai devDependency)

### 11.2 Langkah Setup

```bash
# 1. Install dependencies
bun install

# 2. Salin environment template
cp .env.example .env

# 3. Buat database D1
bunx wrangler d1 create pizza-snack-play

# 4. Isi .env dengan kredensial dari Cloudflare Dashboard:
#    CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_DATABASE_ID, CLOUDFLARE_D1_TOKEN

# 5. Generate & jalankan migrasi
bunx drizzle-kit generate
bunx drizzle-kit migrate

# 6. Jalankan dev server
bun run dev        # → http://localhost:5173
```

### 11.3 Scripts Penting

| Script | Perintah | Fungsi |
|--------|----------|--------|
| `dev` | `vite` | Dev server dengan HMR |
| `build` | `tsc -b && vite build` | Build produksi (frontend + worker) |
| `preview` | `vite preview` | Preview hasil build secara lokal |
| `deploy` | `bun run build && wrangler deploy --env production` | Deploy ke Cloudflare Workers |
| `check` | `tsc && vite build && wrangler deploy --dry-run` | Validasi penuh sebelum deploy |
| `lint` | `eslint .` | Cek kualitas kode |
| `cf-typegen` | `wrangler types` | Generate tipe dari binding `wrangler.json` |
| `db:generate` | `drizzle-kit generate` | Generate file migrasi dari schema |
| `db:migrate` | `drizzle-kit migrate` | Terapkan migrasi ke D1 |
| `db:push` | `drizzle-kit push` | Push schema langsung (dev) |
| `db:studio` | `drizzle-kit studio` | GUI untuk inspeksi database |

### 11.4 Secrets Produksi

```bash
bunx wrangler secret put JWT_SECRET
```

---

## 12. Fase Pengembangan (Roadmap)

### Phase 1: MVP (Core)
- [x] Scaffold project dari `bhvr-template` (Bun + Hono + Vite + React + D1)
- [x] Skema database 11 tabel di `src/database/schema.ts` (lihat dokumen Struktur Tabel)
- [x] File migrasi Drizzle ter-generate (`drizzle/0000_*.sql`)
- [x] Health check endpoint `GET /api/health` + landing page cek koneksi
- [ ] Buat D1 database + isi kredensial di `.env` & `wrangler.json`
- [ ] Terapkan migrasi ke D1 (`drizzle-kit migrate` / `wrangler d1 migrations apply`)
- [ ] Backend: CRUD menu + jadwal (pola Route → Controller → Service → Repository)
- [ ] Autentikasi login (admin + orang tua) dengan JWT (`hono/jwt`)
- [ ] Middleware RBAC (admin vs parent)
- [ ] Admin: kelola akun orang tua (CRUD)
- [ ] Frontend: halaman login + halaman "Hari Ini" + "Minggu Ini" (TanStack Router)
- [ ] Seed data dari file jadwal Agustus & September 2026

### Phase 2: Admin Dashboard
- [ ] Dashboard admin lengkap
- [ ] Manajemen jadwal mingguan/bulanan
- [ ] Duplikasi jadwal
- [ ] Kategori & tagging menu

### Phase 3: Ekspor & Cetak
- [ ] Ekspor PDF jadwal mingguan/bulanan
- [ ] Ekspor Excel
- [ ] Cetak langsung dari browser

### Phase 4: Notifikasi (Opsional)
- [ ] Push notification (PWA)
- [ ] WhatsApp broadcast (opsional, integrasi pihak ketiga)

---

## 13. Acceptance Criteria

| ID | Kriteria | Status |
|----|----------|--------|
| AC1 | Admin dapat input jadwal snack untuk satu minggu (5 hari kerja) dalam < 2 menit | Pending |
| AC2 | Orang tua dapat login dengan username & password yang diberikan admin | Pending |
| AC3 | Orang tua yang belum login TIDAK dapat melihat jadwal — hanya melihat halaman login | Pending |
| AC4 | Admin dapat membuat, edit, dan menonaktifkan akun orang tua | Pending |
| AC5 | Orang tua dapat mengubah password sendiri dari halaman profil | Pending |
| AC6 | Sistem dapat menyimpan jadwal untuk minimal 12 bulan ke depan | Pending |
| AC7 | Pencarian menu "jeruk" menampilkan semua tanggal di mana jeruk disajikan | Pending |
| AC8 | Ekspor PDF bulanan menampilkan semua jadwal dalam format yang dapat dicetak | Pending |
| AC9 | Data seed dari file jadwal Agustus & September 2026 terinput dengan benar | Pending |
| AC10 | Schema 11 tabel berhasil dimigrasi ke Cloudflare D1 tanpa error | Pending |
| AC11 | Aplikasi berhasil di-build dan di-deploy ke Cloudflare Workers (`bun run deploy`) | Pending |
| AC12 | `bun run dev` menjalankan dev server lokal tanpa error | ✅ Done |

---

## 14. Risiko & Asumsi

### Risiko
1. **Akurasi data input** — jika admin salah input, orang tua melihat info salah. Mitigasi: preview sebelum simpan.
2. **Libur nasional** — jadwal otomatis skip hari libur. Mitigasi: tabel `holidays` atau flag `is_holiday` pada schedule.
3. **Menu duplikat** — menu yang sama disajikan terlalu sering. Mitigasi: warning di UI admin.
4. **Manajemen akun orang tua** — admin harus membuat akun untuk setiap orang tua. Jika banyak siswa, pembuatan akun bisa jadi beban. Mitigasi: bulk import via CSV/Excel.
5. **Lupa password** — orang tua mungkin lupa password. Mitigasi: fitur reset password oleh admin, atau email/SMS reset (phase 2).

### Asumsi
- Aplikasi digunakan oleh **satu sekolah** pada Phase 1.
- Jadwal snack hanya untuk **hari kerja** (Senin–Jumat).
- Setiap hari memiliki **tepat satu makanan utama + satu buah** (dapat diperluas di masa depan).
- Data sumber: jadwal Agustus 2026 & September 2026 dari file terlampir.

---

## 15. Glossary

| Istilah | Definisi |
|---------|----------|
| Piket Snack | Tugas harian menyediakan snack untuk siswa |
| Makanan Utama | Item makanan utama (mis. "Roti isi coklat", "Risol ayam") |
| Buah Pendamping | Buah segar/olahan buah yang menyertai makanan utama |
| **Stack BHVR** | **B**un + **H**ono + **V**ite + **R**eact — stack dari template `bhvr-template` |
| Bun | Runtime & package manager JavaScript/TypeScript (untuk tooling, bukan runtime server) |
| Hono | Web framework ultrafast yang berjalan di Cloudflare Workers |
| Vite | Build tool & dev server dengan HMR instan |
| React | Library UI (versi 19) untuk frontend |
| React Router | Library routing client-side (v7) |
| TanStack Query | Library data fetching & caching untuk React |
| Tailwind CSS | Utility-first CSS framework (v4) |
| Cloudflare Workers | Serverless edge runtime tempat backend berjalan |
| Cloudflare D1 | Database SQLite serverless milik Cloudflare |
| Drizzle ORM | Type-safe ORM untuk TypeScript, bekerja dengan D1/SQLite |
| Wrangler | CLI Cloudflare untuk dev, migrasi, dan deploy Worker |
| N-Layered | Pola arsitektur backend: Route → Controller → Service → Repository |
| JWT | JSON Web Token — standar untuk autentikasi stateless |
| RBAC | Role-Based Access Control — pembagian hak akses berdasarkan peran |
| Orang Tua / Parent | Role user dengan akses read-only ke jadwal setelah login |
| Admin / Guru Piket | Role user dengan akses CRUD penuh + kelola akun orang tua |

---

_Dokumen ini akan diperbarui seiring perkembangan produk._
