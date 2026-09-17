# Product Requirements Document (PRD)
## Aplikasi "Pizza Snack Play"

---

| Field | Value |
|-------|-------|
| **Nama Produk** | Pizza Snack Play |
| **Versi Dokumen** | 1.1 |
| **Tanggal** | 17 September 2026 |
| **Stack Teknologi** | BHVR (Bun + Hono + Vue + SQLite) |
| **Status** | Draft for Review |
| **Sumber Data** | Jadwal Piket Snack — Sekolah (Sept 2026 & Agustus 2026) |
| **Perubahan v1.1** | Akses orang tua diubah dari publik (tanpa login) menjadi wajib login (autentikasi) |

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
- **Akses:** Dashboard admin (web app Vue).

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
| **Runtime** | Bun | JavaScript/TypeScript runtime cepat, built-in SQLite (`bun:sqlite`), bundler, test runner |
| **Backend Framework** | Hono | Web framework ringan, ultrafast, middleware-based, routing fleksibel |
| **Frontend Framework** | Vue 3 | SPA reaktif, Composition API, Pinia untuk state management |
| **Database** | SQLite | Embedded database via `bun:sqlite`, single-file, zero-config, cocok untuk skala sekolah |
| **ORM** | Drizzle ORM | Type-safe SQL builder untuk SQLite, integrasi原生 dengan Bun |

### 6.2 Arsitektur Sistem

```
┌─────────────────────────────────────────────┐
│              Browser / Client                │
│         (Vue 3 SPA — Vite build)            │
└──────────────────┬──────────────────────────┘
                   │ HTTP / JSON API
                   ▼
┌─────────────────────────────────────────────┐
│           Hono Backend (Bun)                │
│  ┌─────────┐ ┌──────────┐ ┌─────────────┐ │
│  │ Routing │ │Middleware│ │ Controllers │ │
│  └─────────┘ └──────────┘ └──────┬──────┘ │
│                                 │          │
│                   ┌─────────────▼────────┐  │
│                   │  Service Layer       │  │
│                   │  (Business Logic)    │  │
│                   └─────────────┬────────┘  │
│                                 │          │
│                   ┌─────────────▼────────┐  │
│                   │  Drizzle ORM          │  │
│                   └─────────────┬────────┘  │
└─────────────────────────────────┼──────────┘
                                  │
                   ┌─────────────▼────────┐
                   │  SQLite (bun:sqlite)  │
                   │  pizza_snack_play.db │
                   └──────────────────────┘
```

### 6.3 Struktur Folder Proyek (Disarankan)

```
pizza-snack-play/
├── package.json
├── bunfig.toml
├── drizzle.config.ts
├── tsconfig.json
├── src/
│   ├── server/                 # Backend Hono + Bun
│   │   ├── index.ts            # Entry point (serve)
│   │   ├── routes/
│   │   │   ├── menus.ts        # CRUD menu
│   │   │   ├── schedules.ts    # CRUD jadwal
│   │   │   ├── categories.ts   # CRUD kategori
│   │   │   ├── auth.ts        # Login, register, session/JWT
│   │   │   ├── parents.ts     # CRUD akun orang tua
│   │   │   └── reports.ts      # Ekspor & statistik
│   │   ├── middleware/
│   │   │   ├── auth.ts         # JWT/session auth (wajib untuk semua role)
│   │   │   ├── role.ts         # Role-based access control (admin/parent)
│   │   │   └── error.ts        # Error handler
│   │   ├── services/
│   │   │   ├── menuService.ts
│   │   │   ├── scheduleService.ts
│   │   │   └── exportService.ts
│   │   ├── db/
│   │   │   ├── schema.ts       # Drizzle schema
│   │   │   ├── connection.ts   # bun:sqlite init
│   │   │   └── migrations/
│   │   └── utils/
│   ├── client/                  # Frontend Vue 3
│   │   ├── index.html
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── App.vue
│   │   │   ├── router/
│   │   │   ├── stores/          # Pinia
│   │   │   ├── components/
│   │   │   │   ├── MenuCard.vue
│   │   │   │   ├── WeekSchedule.vue
│   │   │   │   └── MonthCalendar.vue
│   │   │   ├── views/
│   │   │   │   ├── LoginView.vue
│   │   │   │   ├── HomeView.vue
│   │   │   │   ├── TodayView.vue
│   │   │   │   ├── WeekView.vue
│   │   │   │   ├── MonthView.vue
│   │   │   │   ├── ProfileView.vue       # Orang tua: ubah password
│   │   │   │   ├── AdminDashboard.vue
│   │   │   │   ├── MenuManager.vue
│   │   │   │   ├── ScheduleManager.vue
│   │   │   │   └── ParentManager.vue    # Admin: kelola akun orang tua
│   │   │   └── api/            # API client (fetch wrapper)
│   │   └── vite.config.ts
│   └── shared/                  # Tipe & enum shared
│       └── types.ts
├── data/
│   └── pizza_snack_play.db     # SQLite database file
└── docs/
    └── PRD.md
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
- Halaman utama load < 500ms (server lokal).
- API response < 100ms untuk query single record.
- SQLite query dioptimalkan dengan index pada kolom `schedule_date`.

### 10.2 Security
- **Semua endpoint dilindungi autentikasi JWT/session** — tidak ada endpoint publik selain `/api/auth/login`.
- **Role-based access control (RBAC)** — role `admin` (CRUD penuh) dan role `parent` (read-only jadwal + ubah password sendiri).
- **Orang tua wajib login** — sebelum login, hanya melihat halaman login. Setelah login, dapat melihat jadwal.
- **Admin mengelola akun orang tua** — admin membuat, edit, dan nonaktifkan akun orang tua. Orang tua tidak bisa registrasi mandiri.
- **Password hashing** — password disimpan sebagai hash (bcrypt/argon2), tidak pernah plain text.
- **JWT token** — masa berlaku token dapat diatur (mis. 7 hari), dengan refresh mechanism.
- Input validation via Zod schema (Hono middleware).
- SQL injection prevention via Drizzle ORM parameterized queries.

### 10.3 Scalability
- SQLite cukup untuk skala sekolah (ribuan record jadwal).
- Jika multi-sekolah di kemudian hari → migrasi ke PostgreSQL.

### 10.4 Reliability
- Database backup otomatis harian (cron job via Bun).
- Soft delete untuk semua data — tidak ada hard delete.

---

## 11. Fase Pengembangan (Roadmap)

### Phase 1: MVP (Core)
- [x] Skema database (lihat dokumen Struktur Tabel)
- [ ] Backend: CRUD menu + jadwal
- [ ] Autentikasi login (admin + orang tua) dengan JWT
- [ ] Role-based access control (admin vs parent)
- [ ] Admin: kelola akun orang tua (CRUD)
- [ ] Frontend: halaman login + halaman "Hari Ini" + "Minggu Ini"
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

## 12. Acceptance Criteria

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

---

## 13. Risiko & Asumsi

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

## 14. Glossary

| Istilah | Definisi |
|---------|----------|
| Piket Snack | Tugas harian menyediakan snack untuk siswa |
| Makanan Utama | Item makanan utama (mis. "Roti isi coklat", "Risol ayam") |
| Buah Pendamping | Buah segar/olahan buah yang menyertai makanan utama |
| Stack BHVR | Bun + Hono + Vue + SQLite/React (varian) |
| Drizzle ORM | Type-safe ORM untuk TypeScript, bekerja dengan SQLite |
| Hono | Web framework ringan untuk Bun/Deno/Node |
| JWT | JSON Web Token — standar untuk autentikasi stateless |
| RBAC | Role-Based Access Control — pembagian hak akses berdasarkan peran |
| Orang Tua / Parent | Role user dengan akses read-only ke jadwal setelah login |
| Admin / Guru Piket | Role user dengan akses CRUD penuh + kelola akun orang tua |

---

_Dokumen ini akan diperbarui seiring perkembangan produk._
