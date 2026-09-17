# Product Requirements Document (PRD)
## Aplikasi "Pizza Snack Play"

---

| Field | Value |
|-------|-------|
| **Nama Produk** | Pizza Snack Play |
| **Versi Dokumen** | 1.3 |
| **Tanggal** | 17 September 2026 |
| **Stack Teknologi** | BHVR — Bun + Hono + Vite + React (Cloudflare Workers + D1) |
| **Status** | Draft for Review |
| **Sumber Data** | Jadwal Piket Snack — Sekolah (Sept 2026 & Agustus 2026) |
| **Perubahan v1.1** | Akses orang tua diubah dari publik (tanpa login) menjadi wajib login (autentikasi) |
| **Perubahan v1.2** | Stack disesuaikan dengan template `bhvr-template` yang sebenarnya: React 19 (bukan Vue 3), Cloudflare Workers + D1 (bukan bun:sqlite lokal) |
| **Perubahan v1.3** | Phase 2 selesai: pencarian riwayat menu (`/schedules/search`) & duplikasi jadwal antar minggu (`/schedules/copy`); daftar endpoint diselaraskan dengan implementasi |

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
- **Satu akun, banyak anak** — seorang orang tua boleh memiliki lebih dari satu anak; setiap anak punya nama dan kelas sendiri. Profil menampilkan seluruh anak, dan daftar akun di halaman admin menampilkan semua anak dalam satu baris.
- **Manajemen akun (Admin)** — admin dapat membuat, edit, dan nonaktifkan akun orang tua beserta daftar anaknya (tambah/hapus anak di dalam satu formulir).
- **Profil** — orang tua dapat melihat profil (termasuk daftar anak) dan ubah password sendiri.
- **Session/Token** — login menghasilkan JWT token dengan masa berlaku tertentu, disimpan di cookie/localStorage.
- **Role-based access** — role `parent` hanya dapat melihat jadwal (read-only), role `admin` dapat CRUD. Pembatasan dilakukan **dua lapis**: API menolak dengan `403` (`requireRole("admin")`), dan UI menyembunyikan tombol tambah/ubah/hapus pada halaman menu, kategori, jadwal, dan orang tua.

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
| **R**eact | Frontend | React 19 + **TanStack Router v7** untuk routing + **TanStack Query** untuk data fetching/caching. |
| **Database** | Cloudflare D1 | Serverless SQLite yang terintegrasi dengan Workers, diakses via **Drizzle ORM**. |
| **Styling** | Tailwind CSS v4 | Utility-first CSS, via `@tailwindcss/vite` plugin. |
| **Deployment** | Cloudflare Workers | Serverless edge runtime, aset statis disajikan dari `./dist/client` dengan SPA fallback. |

**Penting — koreksi dari v1.1:** Dokumen versi sebelumnya menyebut frontend **Vue 3** dan database **bun:sqlite lokal**. Setelah template `bhvr-template` di-scaffold, stack sebenarnya adalah **React 19** dan **Cloudflare D1**. Skema database tetap berlaku karena D1 adalah SQLite — hanya lapisan akses dan deployment yang berubah. Sejak v1.4 jumlah tabel menjadi **12** setelah tabel `students` dipisahkan dari `parents`.

### 6.2 Arsitektur Sistem

```
┌─────────────────────────────────────────────┐
│              Browser / Client                │
│   React 19 + TanStack Router v7 + TanStack     │
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

### 6.3 Struktur Folder Proyek (Aktual)

```
pizza-snack-play/
├── public/                       # Static assets
├── src/
│   ├── api/                      # Cloudflare Worker — Hono backend
│   │   ├── index.ts              # Worker entry point (basePath /api)
│   │   ├── auth/                 # Login, logout, me, ubah password
│   │   ├── catalog/              # Menu + kategori
│   │   ├── schedules/            # Jadwal, minggu, hari libur
│   │   ├── parents/              # CRUD akun orang tua + daftar anak
│   │   ├── stats/                # Ringkasan dashboard
│   │   ├── middleware/           # requireAuth, requireRole
│   │   └── utils/                # response, password, date, slug, params, sql
│   ├── database/
│   │   ├── db.ts                 # Inisialisasi Drizzle + D1 binding + tipe Db
│   │   └── schema.ts             # Drizzle schema (12 tabel)
│   ├── components/               # AppShell, ScheduleDayCard, ui.tsx
│   ├── routes/                   # TanStack Router — halaman frontend
│   │   ├── __root.tsx            # Root + AuthProvider
│   │   ├── login.tsx             # Halaman login
│   │   └── _app/                 # Layout terproteksi
│   │       ├── index.tsx         # / → redirect ke /hari-ini
│   │       ├── dashboard.tsx     # Ringkasan (admin)
│   │       ├── hari-ini.tsx      # Jadwal hari ini
│   │       ├── minggu-ini.tsx    # Jadwal mingguan
│   │       ├── bulan.tsx         # Jadwal bulanan
│   │       ├── pencarian.tsx     # Cari riwayat menu
│   │       ├── menu.tsx          # CRUD menu (admin)
│   │       ├── kategori.tsx      # CRUD kategori (admin)
│   │       ├── jadwal.tsx        # Kelola jadwal + hari libur (admin)
│   │       ├── orang-tua.tsx     # CRUD akun orang tua + anak (admin)
│   │       └── profil.tsx        # Profil + daftar anak + ubah password
│   ├── lib/                      # api.ts, auth.tsx, auth-context.ts, date.ts, ...
│   ├── types/                    # auth.ts, catalog.ts, schedule.ts, account.ts
│   ├── index.css                 # Global styles (Tailwind)
│   ├── main.tsx                  # React + Router entry point
│   └── routeTree.gen.ts          # Auto-generated route tree
├── data/jadwal_piket_snack.txt   # Sumber data jadwal
├── drizzle/
│   ├── migrations/               # Migrasi D1 (drizzle-kit)
│   └── seed.sql                  # Seed SQL (di luar folder migrations)
├── scripts/                      # seed.ts, test-auth.mjs, test-api.mjs
├── docs/
│   ├── PRD_Pizza_Snack_Play.md
│   └── Struktur_Tabel_Pizza_Snack_Play.md
├── drizzle.config.ts
├── vite.config.ts
├── wrangler.json                 # Konfigurasi Cloudflare Worker + D1
└── package.json
```

> Struktur lengkap beserta keterangan tiap file ada di [`README.md`](../README.md).

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

## 7. API Endpoints

### 7.1 Auth Endpoints
| Method | Path | Deskripsi | Role |
|--------|------|-----------|------|
| POST | `/api/auth/login` | Login (username + password) → JWT token + profil user | Public |
| POST | `/api/auth/logout` | Logout (titik keluar eksplisit; JWT stateless) | Authenticated |
| GET | `/api/auth/me` | Profil user yang sedang login + daftar anak (bila `parent`) | Authenticated |
| PUT | `/api/auth/password` | Ubah password sendiri | Authenticated |

### 7.2 Parent (Orang Tua) Endpoints — Admin Only
| Method | Path | Deskripsi | Role |
|--------|------|-----------|------|
| GET | `/api/parents` | List akun orang tua + seluruh anaknya (paginated, `search` mencocokkan nama/kelas anak) | Admin |
| GET | `/api/parents/:id` | Detail akun + daftar anak | Admin |
| POST | `/api/parents` | Buat akun + profil + daftar anak (`students[]`, min. 1) | Admin |
| PUT | `/api/parents/:id` | Edit akun; `students[]` menggantikan daftar lama bila dikirim | Admin |
| DELETE | `/api/parents/:id?hard=` | Nonaktifkan akun (soft delete), atau hapus permanen | Admin |
| POST | `/api/parents/:id/reset-password` | Reset password akun orang tua | Admin |

> **Bentuk `students`:** array objek `{ id?, name, className? }`. Saat `PUT`, entri yang menyertakan `id` akan **diperbarui**, entri tanpa `id` **dibuat baru**, dan entri yang tidak disebut lagi **dihapus**. `id` hanya dipercaya bila anak tersebut memang milik orang tua itu.

### 7.3 Menu Endpoints
| Method | Path | Deskripsi | Role |
|--------|------|-----------|------|
| GET | `/api/menus` | List semua menu (paginated) | Admin, Parent |
| GET | `/api/menus/item-types` | Jenis komponen menu (`main`, `fruit`, `drink`, `other`) | Admin, Parent |
| GET | `/api/menus/:id` | Detail menu | Admin, Parent |
| POST | `/api/menus` | Tambah menu baru | Admin |
| PUT | `/api/menus/:id` | Edit menu | Admin |
| DELETE | `/api/menus/:id` | Soft-delete menu (arsip) | Admin |

### 7.4 Schedule Endpoints
| Method | Path | Deskripsi | Role |
|--------|------|-----------|------|
| GET | `/api/schedules/today` | Jadwal hari ini (WIB) + minggu berjalan | Admin, Parent |
| GET | `/api/schedules/week?date=YYYY-MM-DD` | Jadwal Senin–Jumat pada minggu tersebut | Admin, Parent |
| GET | `/api/schedules/month?year=YYYY&month=M` | Jadwal bulanan, dikelompokkan per minggu | Admin, Parent |
| GET | `/api/schedules/range?from=&to=` | Rentang bebas (maks. 92 hari) | Admin, Parent |
| GET | `/api/schedules/search?q=&from=&to=` | Cari tanggal di mana menu/komponen pernah dijadwalkan (maks. 400 hari) | Admin, Parent |
| GET | `/api/schedules/:id` | Detail satu entri jadwal | Admin, Parent |
| POST | `/api/schedules` | Set jadwal untuk satu tanggal | Admin |
| POST | `/api/schedules/copy` | Salin jadwal Senin–Jumat ke minggu lain (`overwrite` opsional) | Admin |
| PUT | `/api/schedules/:id` | Ubah menu / libur / catatan | Admin |
| DELETE | `/api/schedules/:id` | Hapus jadwal | Admin |
| GET | `/api/weeks?year=&month=` | Daftar minggu pada bulan tersebut | Admin, Parent |
| GET | `/api/holidays?from=&to=` | Daftar hari libur | Admin, Parent |
| POST | `/api/holidays` | Tambah hari libur | Admin |
| DELETE | `/api/holidays/:id` | Hapus hari libur | Admin |

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

### 8.3 Admin: Duplikasi Jadwal — ✅ Terimplementasi
1. Buka `/jadwal` → klik **"Salin minggu"** di kanan atas
2. Dialog terbuka dengan default: minggu berjalan → minggu berikutnya
3. Ubah tanggal bila perlu; label minggu (mis. `14 - 18 September 2026`) tampil langsung di bawah input
4. Opsional: centang **"Timpa jadwal yang sudah ada"** — bila tidak dicentang, hari yang sudah terisi di minggu tujuan dilewati
5. Klik **"Salin sekarang"** → banner menampilkan ringkasan:
   `Disalin 14 - 18 September 2026 → 21 - 25 September 2026: 2 dibuat, 0 diperbarui, 3 dilewati.`
6. Hari libur ikut tersalin (tanpa menu); hari tanpa jadwal di minggu sumber dilewati
7. Minggu sumber = minggu tujuan ditolak dengan pesan "Minggu sumber dan tujuan sama"

### 8.4 Admin: Kelola Akun Orang Tua — ✅ Terimplementasi
1. Dashboard → "Kelola Orang Tua"
2. Lihat daftar akun orang tua; kolom **Anak** menampilkan seluruh anak dalam satu baris
3. Klik "Tambah Akun" → isi username, password sementara, nama orang tua, hubungan
4. Isi bagian **Anak** — boleh lebih dari satu. Tombol **"Tambah anak"** menambah baris baru; ikon `x` menghapus baris. Minimal satu nama anak wajib diisi.
5. Simpan → akun dibuat, orang tua dapat login dan melihat seluruh anaknya di halaman profil & beranda
6. Bisa edit akun kapan saja — mengubah daftar anak akan **menggantikan** daftar lama (anak yang dihapus dari formulir ikut terhapus dari database)
7. Nonaktifkan (default) atau hapus permanen; reset password bila orang tua lupa password
8. Pencarian pada daftar akun juga mencocokkan **nama anak** dan **kelas anak**

### 8.5 Semua Role: Cari Riwayat Menu — ✅ Terimplementasi
1. Klik **"Cari Menu"** di navigasi (tersedia untuk admin *dan* orang tua)
2. Masukkan kata kunci (mis. `jeruk`) — pencarian mencocokkan **nama menu** maupun **komponennya**
3. Atur rentang tanggal, atau pakai tombol rentang cepat: **1 bulan / 3 bulan / 6 bulan / 1 tahun** (default: 6 bulan terakhir)
4. Klik **"Cari"** → ringkasan `Ditemukan 4 hari yang cocok dengan "jeruk".`
5. Hasil dikelompokkan per bulan (mis. `Agustus 2026 — 2 hari`), tiap baris menampilkan hari, tanggal, nama menu, dan badge komponen yang cocok beserta jenisnya (`jeruk · Buah`)
6. Kata kunci yang cocok disorot (highlight kuning) pada nama menu maupun nama komponen
7. Catatan harian ikut ditampilkan bila ada (mis. `Catatan: outing`)

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
┌───────────────────────────────────────────────────────┐
│  Kelola Orang Tua                        [Logout]      │
├───────────────────────────────────────────────────────┤
│  [+ Tambah Akun]                                       │
├──────────┬──────────┬────────────────────────┬─────────┤
│ Nama     │ Username │ Anak                   │ Aksi    │
│──────────┼──────────┼────────────────────────┼─────────│
│ Sari     │ sari     │ Aisyah Sari (1A)       │Edit|Hps │
│ Budi     │ budi     │ Bagas Budi (1A)        │Edit|Hps │
│ Dewi     │ dewi     │ Citra Dewi (1B),       │Edit|Hps │
│          │          │ Raka Dewi (2A)         │         │
└──────────┴──────────┴────────────────────────┴─────────┘

Formulir tambah/ubah akun:
┌──────────────────────────────────────────┐
│  Username        [_______________]        │
│  Password        [_______________]        │
│  Nama Orang Tua  [_______________]        │
│  Hubungan        [ibu ▾]                  │
│  ── Anak — boleh lebih dari satu ──       │
│  1. Nama [___________] Kelas [___]  [x]   │
│  2. Nama [___________] Kelas [___]  [x]   │
│  [+ Tambah anak]                          │
│                       [Batal] [Simpan]    │
└──────────────────────────────────────────┘
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
- **Password hashing** — **PBKDF2-SHA256, 100.000 iterasi** via Web Crypto API (`crypto.subtle`) yang edge-native, tanpa dependency native. Format tersimpan: `pbkdf2$<iterations>$<salt>$<hash>`. Perbandingan hash memakai constant-time compare. Implementasi: `src/api/utils/password.ts`.
- **JWT token** — signing **HS256** via `hono/jwt` dengan `JWT_SECRET` dari environment variable. Masa berlaku default 7 hari (`JWT_EXPIRES_IN`, dalam detik). Catatan: pada Hono 4.12+, `verify()` mewajibkan argumen algoritma ketiga.
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

### Phase 1: MVP (Core) — ✅ SELESAI
- [x] Scaffold project dari `bhvr-template` (Bun + Hono + Vite + React + D1)
- [x] Skema database di `src/database/schema.ts` (11 tabel saat MVP; **12** sejak v1.4 setelah `students` dipisah dari `parents`)
- [x] File migrasi Drizzle ter-generate (`drizzle/migrations/0000_*.sql`) & diterapkan ke D1 lokal
- [x] Health check endpoint `GET /api/health`
- [x] Seed data dari file jadwal Agustus & September 2026 (`scripts/seed.ts`) — 10 minggu, 42 menu, 43 jadwal, 3 orang tua, 4 anak
- [x] Autentikasi login (admin + orang tua) dengan JWT (`hono/jwt`, HS256)
- [x] Password hashing PBKDF2-SHA256 via Web Crypto (edge-native)
- [x] Endpoint auth: `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `PUT /auth/password`
- [x] Middleware `requireAuth` + RBAC `requireRole('admin' | 'parent')`
- [x] Test end-to-end auth — 33 skenario lolos
- [x] Backend: CRUD menu + kategori (pola Route → Controller → Service → Repository)
- [x] Backend: CRUD jadwal + hari libur (`/schedules`, `/weeks`, `/holidays`)
- [x] Backend: kelola akun orang tua (`/parents`) — create, update, nonaktifkan, hapus, reset password, daftar anak (`students[]`)
- [x] Backend: statistik dashboard (`/stats/summary`)
- [x] Frontend: halaman login + layout terproteksi (TanStack Router)
- [x] Frontend: halaman "Hari Ini", "Minggu Ini", dan "Bulanan"
- [x] Frontend: halaman admin (dashboard, menu, kategori, kelola jadwal, akun orang tua)
- [x] Frontend: halaman profil + ubah password
- [x] Test end-to-end API — 180 skenario lolos (total 213 dengan auth)
- [x] Verifikasi browser: alur login admin & orang tua, pembatas role
- [ ] Buat D1 database remote + isi kredensial produksi
- [ ] Deploy ke Cloudflare Workers

### Phase 2: Admin Dashboard (lanjutan) — ✅ SELESAI
- [x] Dashboard admin dengan ringkasan data
- [x] Manajemen jadwal bulanan (tetapkan menu, tandai libur, catatan per hari)
- [x] Kategori & tagging menu
- [x] Kelola akun orang tua
- [x] Duplikasi jadwal antar minggu (`POST /schedules/copy` + dialog di `/jadwal`)
- [x] Pencarian riwayat menu ("kapan jeruk disajikan?") — `GET /schedules/search` + halaman `/pencarian`
- [x] Satu orang tua boleh punya **lebih dari satu anak** — tabel `students` + migrasi berpindah data (`0001_*.sql`)
- [x] RBAC digerbangi juga di UI — orang tua tidak melihat tombol CRUD menu/kategori/jadwal/orang tua
- [ ] Bulk import akun orang tua (CSV/Excel)

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
| AC1 | Admin dapat input jadwal snack untuk satu minggu (5 hari kerja) dalam < 2 menit | ✅ Done — dropdown menu per hari di `/jadwal` |
| AC2 | Orang tua dapat login dengan username & password yang diberikan admin | ✅ Done — API + halaman login |
| AC3 | Orang tua yang belum login TIDAK dapat melihat jadwal — hanya melihat halaman login | ✅ Done — halaman `/login` + guard route; endpoint 401 tanpa token |
| AC4 | Admin dapat membuat, edit, dan menonaktifkan akun orang tua | ✅ Done — `/orang-tua` + API `/parents` |
| AC5 | Orang tua dapat mengubah password sendiri dari halaman profil | ✅ Done — `/profil` + `PUT /auth/password` |
| AC6 | Sistem dapat menyimpan jadwal untuk minimal 12 bulan ke depan | ✅ Done — tanpa batas periode; query rentang maks 92 hari |
| AC7 | Pencarian menu "jeruk" menampilkan semua tanggal di mana jeruk disajikan | ✅ Done — `/pencarian` + `GET /schedules/search` (cocokkan nama menu *dan* komponen, dikelompokkan per bulan) |
| AC8 | Ekspor PDF bulanan menampilkan semua jadwal dalam format yang dapat dicetak | Pending — Phase 3 |
| AC9 | Data seed dari file jadwal Agustus & September 2026 terinput dengan benar | ✅ Done — 10 minggu, 42 menu, 43 jadwal, 3 orang tua, 4 anak |
| AC10 | Schema 12 tabel berhasil dimigrasi ke Cloudflare D1 tanpa error | ✅ Done (D1 lokal) |
| AC11 | Aplikasi berhasil di-build dan di-deploy ke Cloudflare Workers (`bun run deploy`) | Sebagian — build OK, deploy butuh kredensial |
| AC12 | `bun run dev` menjalankan dev server lokal tanpa error | ✅ Done |
| AC13 | Autentikasi JWT menolak akses tanpa token / token invalid dengan 401 | ✅ Done — terverifikasi 213 test |
| AC14 | Password tersimpan sebagai hash PBKDF2, bukan plain text | ✅ Done |
| AC15 | Orang tua TIDAK dapat mengakses endpoint admin (403) | ✅ Done — `requireRole('admin')`, diuji di 17 operasi tulis + 2 bukti data tidak berubah |
| AC16 | Orang tua TIDAK melihat menu admin di navigasi maupun halaman admin | ✅ Done — navigasi sadar-role + pembatas `AdminOnly` + gerbang `isAdmin` pada halaman menu/kategori/jadwal/orang-tua |
| AC17 | Admin dapat menyalin jadwal satu minggu ke minggu lain tanpa menimpa hari yang sudah terisi | ✅ Done — `POST /schedules/copy` + dialog "Salin minggu" di `/jadwal` |
| AC18 | Pencarian aman dari wildcard SQL — `%` dan `_` diperlakukan literal | ✅ Done — `escapeLike()` di `utils/sql.ts`, diuji di 2 skenario |
| AC19 | Satu akun orang tua dapat memiliki **lebih dari satu anak** | ✅ Done — tabel `students` (relasi 1 ── n); `dewi` di-seed dengan 2 anak; diuji di `test-auth` (section 5b) & `test-api` (section 15) |
| AC20 | Admin dapat menambah/menghapus anak pada satu akun tanpa membuat akun baru | ✅ Done — bagian "Anak — boleh lebih dari satu" di formulir `/orang-tua`; `students[]` pada `POST`/`PUT /parents` |
| AC21 | Orang tua tidak melihat tombol tambah/ubah/hapus pada halaman menu & kategori | ✅ Done — gerbang `isAdmin` dari `useAuth()`; tombol Edit/Hapus tidak dirender untuk `parent` |

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
| TanStack Router | Library routing client-side (v7) — file-based di `src/routes/`, route tree auto-generate |
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
| Anak / Student | Data anak milik seorang orang tua (nama + kelas). Satu orang tua boleh punya lebih dari satu — tabel `students` |
| Admin / Guru Piket | Role user dengan akses CRUD penuh + kelola akun orang tua |

---

_Dokumen ini akan diperbarui seiring perkembangan produk._
