# Product Requirements Document (PRD)


## Aplikasi "Pizza Snack Play"

---

| Field               | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Nama Produk**     | Pizza Snack Play                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Versi Dokumen**   | 1.10                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **Tanggal**         | 19 September 2026                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **Stack Teknologi** | BHVR — Bun + Hono + Vite + React (Cloudflare Workers + D1)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Status**          | Draft for Review                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Sumber Data**     | `data/output_jadwal_piket.txt` — Jadwal Piket Snack September 2026 (menu + penugasan siswa per kelas); `data/jadwal_piket_snack.txt` — arsip Agustus & September 2026 (menu saja)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **Perubahan v1.1**  | Akses orang tua diubah dari publik (tanpa login) menjadi wajib login (autentikasi)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Perubahan v1.2**  | Stack disesuaikan dengan template `bhvr-template` yang sebenarnya: React 19 (bukan Vue 3), Cloudflare Workers + D1 (bukan bun:sqlite lokal)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| **Perubahan v1.3**  | Phase 2 selesai: pencarian riwayat menu (`/schedules/search`) & duplikasi jadwal Sepekan (`/schedules/copy`); daftar endpoint diselaraskan dengan implementasi                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Perubahan v1.4**  | **Jadwal disimpan per kelas** (`schedules.class_name`, unik gabungan `tanggal + kelas`) dan role baru **`korlas`** (koordinator kelas): boleh mengelola katalog menu/kategori (sekolah-wide) + jadwal **kelasnya sendiri**. Endpoint baru `GET /classes`; semua pembacaan jadwal menerima `?class=`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **Perubahan v1.5**  | **Analisis ulang file sumber** `output_jadwal_piket.txt`: (a) koreksi pemetaan tanggal di §5 (1 Sep = Selasa, bukan 2 Sep — pergeseran 1 hari); (b) koreksi nama menu agar cocok dengan file sumber ("Roti coklat" bukan "Roti isi coklat", "naga" bukan "buah naga"); (c) **dimensi baru: Penugasan Piket Siswa** — file sumber memuat nama siswa piket per kelas per hari (38 siswa, 87 penugasan, kelas 3–5 per hari), yang sebelumnya tidak dimodelkan sama sekali; (d) fitur baru **F7** + tabel baru `piket_assignments` (13 tabel total); (e) koreksi rentang minggu pertama (1–4 Sep, bukan 1–5 Sep)                                                                                                                                                                                        |
| **Perubahan v1.6**  | **Fitur Kunci & Publikasi Jadwal (F8):** alur tiga-status `draft → locked → published`. Korlas dapat **mengunci** jadwal draft pada suatu rentang/bulan; setelah seluruh bulan terkunci, korlas dapat **memublikasi** ke semua orang tua. Orang tua hanya melihat jadwal `published`. Admin dapat **membuka kunci** (unlock) baris individual. Kolom baru di `schedules`: `status`, `locked_by`, `locked_at`, `published_by`, `published_at` + migrasi `0003_*.sql`. Endpoint baru: `POST /schedules/lock`, `POST /schedules/publish`, `POST /schedules/:id/unlock`. Perlindungan tulis: baris `locked`/`published` tidak dapat diedit/dihapus/ditimpa                                                                                                                                              |
| **Perubahan v1.7**  | **(a) Fitur Pilih Jadwal (F9):** orang tua berebut tanggal snack yang petugasnya sengaja dibiarkan kosong korlas — siapa cepat dia dapat. Tabel baru `schedule_claims` dengan `UNIQUE(schedule_id)` sebagai penjaga rebutan; endpoint `POST/DELETE /claims`, `GET /claims/mine`, `GET /claims`. Klaim **menulis balik** ke `schedules.petugas_name`/`petugas_parent_name` sehingga hanya ada satu sumber kebenaran soal petugas. **(b) PWA (F10):** aplikasi dapat dipasang ke layar utama + service worker. **(c) Koreksi:** tabel `piket_assignments` (v1.5, F7) **tidak pernah dibuat** — digantikan dua kolom `petugas_*` di `schedules`; F7 ditandai ulang sebagai ditinggalkan. **(d)** Migrasi kunci & publikasi dinomori ulang dari `0003` menjadi `0004`; `schedule_claims` menjadi `0005` |
| **Perubahan v1.8**  | **Kunci & publikasi menjadi operasi sekolah-wide (F8):** admin dapat mengunci **dan** mempublikasi jadwal untuk **semua kelas (1–6) sekaligus** dalam satu tindakan — `POST /schedules/lock` & `POST /schedules/publish` menerima `className` yang boleh dikosongkan (admin = semua kelas, korlas = kelasnya sendiri). Respons keduanya membawa `classes` + `lockedCount`; `409 drafts_remaining` kini menyebut **kelas penyebab** draft. UI `/jadwal` menampilkan penghitung status **lintas kelas** untuk admin dengan label "(semua kelas)". **Rebutan tanggal tetap per kelas** (F9): `UNIQUE(schedule_id)` mengikat satu baris (tanggal × kelas), jadi klaim orang tua kelas 1 tidak menghalangi orang tua kelas 2 pada tanggal yang sama — diuji lewat `scripts/test-claim-cross-class.mjs`   |
| **Perubahan v1.9**  | **Cakupan sekolah-wide kini terlihat + pembersihan (F8):** endpoint baru `GET /schedules/status` mengembalikan ringkasan **per kelas** (`perClass`, `totals`, `draftClasses`, `canPublish`) dalam **satu** query `GROUP BY class_name, status` — menggantikan pola lama UI yang memuat jadwal **setiap** kelas hanya untuk menghitung status (1+N permintaan per bulan). UI `/jadwal` menampilkan kartu **Status per kelas** sehingga cakupan "(semua kelas)" benar-benar tampak, bukan sekadar satu kalimat penghitung; banner kunci/publikasi kini menyebut **daftar kelas** yang tersentuh. Halaman dipecah ke `src/components/jadwal/*` (dari satu file 897 baris → shell + 7 komponen). Tiga method repository mati (`*AllClasses`) dihapus — sudah digantikan method ber-`className: string | null` yang ada. Dokumen dikoreksi: korlas **boleh mengunci kelasnya sendiri** (§3.3 sebelumnya keliru menyatakan `403`; perilaku teruji di `scripts/test-api.mjs`), dan frasa "`locked` — dikunci oleh korlas" pada F8 diperbaiki. Uji baru: `bun run test:status` (22 assertion)   |
| **Perubahan v1.10**  | **Petugas tanpa foreign key komposit (koreksi implementasi v1.8).** Rancangan FK komposit untuk `petugas_student_id`/`petugas_parent_id` dibatalkan: FK komposit menuntut indeks unik pada pasangan kolom target yang persis sehingga `schedules` harus dibangun ulang, sedangkan `PRAGMA foreign_keys=OFF` **diabaikan senyap di dalam transaksi** — dan `wrangler d1 migrations apply` membungkus migrasi dalam transaksi. Akibatnya migrasi `0007` gagal di produksi (`FOREIGN KEY constraint failed`) padahal berhasil di lokal, dan jalur yang "berhasil" menghasilkan tabel korup (292 pelanggaran `foreign_key_check`). Migrasi `0007` kini hanya `ALTER TABLE ... ADD COLUMN`; konsistensi petugas ditegakkan `resolvePetugas()` di `src/api/schedules/service.ts`. Detail di catatan desain `README.md` |

---

## 1. Ringkasan Produk (Executive Summary)

**Pizza Snack Play** adalah aplikasi manajemen dan informasi jadwal piket snack sekolah. Aplikasi ini memungkinkan pengelola sekolah (admin/guru piket) untuk mengelola jadwal menu snack harian beserta **penugasan siswa piket** (siswa yang bertugas membawa/menyiapkan snack per kelas per hari), sementara orang tua dan siswa dapat melihat jadwal snack yang akan disajikan setiap harinya setelah melakukan login. Data utama aplikasi berasal dari jadwal piket snack bulanan yang berisi menu snack untuk hari Senin–Jumat (makanan utama + buah pendamping) serta daftar siswa yang bertugas piket per kelas.

### Tujuan Utama

- **Digitalisasi jadwal piket snack** — mengganti dokumen fisik/manual menjadi aplikasi yang dapat diakses kapan saja.
- **Transparansi menu** — orang tua/siswa tahu menu snack hari ini dan minggu depan, dengan akses melalui login aman.
- **Manajemen menu** — admin dapat menambah, mengedit, dan mengatur menu snack per hari, minggu, dan bulan.
- **Penugasan piket siswa** — admin/korlas dapat menetapkan siswa yang bertugas piket per kelas per hari, sehingga orang tua tahu kapan anaknya giliran bertugas.
- **Katalogisasi menu** — membangun database menu snack yang dapat dipakai berulang (rotasi menu).
- **Keamanan akses** — setiap orang tua memiliki akun login pribadi untuk melihat jadwal snack, memastikan data hanya diakses oleh wali yang berwenang.

---

## 2. Latar Belakang & Masalah

Saat ini jadwal piket snack disusun dalam format teks manual (lihat lampiran), dengan struktur:

- Dikelompokkan per minggu (misal: 1–4 September, 7–11 September, dst.)
- Setiap hari Senin–Jumat memiliki 2 item: **makanan utama** + **buah pendamping**
- Setiap hari juga memuat **daftar siswa piket per kelas** (mis. "Kelas 1: Shezan", "Kelas 2: Uma")
- Contoh: "Selasa: Roti coklat + jeruk / Kelas 1: Shezan / Kelas 2: Uma / Kelas 3: Azkayra"

### Masalah yang Dihadapi

1. **Tidak ada pencarian** — sulit mencari kapan menu tertentu disajikan.
2. **Tidak ada notifikasi** — orang tua tidak tahu menu hari ini tanpa bertanya.
3. **Sulit diedit** — perubahan menu manual rawan kesalahan.
4. **Tidak ada riwayat** — tidak ada data menu bulan-bulan sebelumnya.
5. **Tidak ada katalog** — menu yang sudah pernah disusun tidak dapat dipakai ulang dengan mudah.
6. **Tidak ada pelacakan piket** — orang tua tidak tahu kapan anaknya giliran bertugas membawa snack; siswa bisa terlewat jadwal piketnya.

---

## 3. Target Pengguna (User Personas)

### 3.1 Admin / Guru Piket

- **Peran:** Mengelola jadwal snack (CRUD menu, atur jadwal harian/minggu/bulan).
- **Kebutuhan:** Form input cepat, duplikasi jadwal, template menu, preview Sepekan.
- **Akses:** Dashboard admin (web app React).

### 3.2 Orang Tua / Siswa

- **Peran:** Melihat jadwal snack hari ini, minggu ini, dan bulan ini.
- **Kebutuhan:** Tampilan kalender/list sederhana, notifikasi opsional, akses login pribadi.
- **Akses:** Wajib login (akun pribadi yang diberikan admin/sekolah). Setiap orang tua memiliki akun dengan username & password yang diatur oleh admin sekolah. Belum login hanya melihat halaman login, tidak dapat melihat jadwal.
- **Cakupan kelas:** Orang tua hanya melihat jadwal **kelas anaknya**. Bila punya anak di lebih dari satu kelas, muncul **pemilih kelas** di header; tanpa memilih, kelas anak pertama dipakai sebagai default.

### 3.3 Korlas (Koordinator Kelas)

- **Peran:** Perpanjangan tangan admin di tingkat kelas — menyusun jadwal snack untuk **kelasnya sendiri**, lalu **mempublikasikannya** tanpa perlu menunggu admin.
- **Kebutuhan:** Bisa mengubah jadwal menu per tanggal (termasuk memilih menu pada dropdown, mengisi petugas, dan menambah catatan) untuk kelasnya, lalu menerbitkannya sendiri setelah admin mengunci.
- **Akses:** Login seperti pengguna lain (role `korlas`), terhubung ke satu kelas lewat `users.class_name`. Kelasnya juga ikut sebagai claim `className` di JWT.
- **Wewenang:**
  - ✅ Tambah/ubah/hapus jadwal (termasuk Salin Sepekan) — **terbatas kelasnya sendiri**.
  - ✅ Mengunci jadwal kelasnya (`POST /schedules/lock`) — **terbatas kelasnya sendiri**. Mengunci kelas lain → `403`.
  - ✅ Mempublikasi jadwal (`POST /schedules/publish`) — **terbatas kelasnya sendiri**.
  - ✅ Menandai satu hari sebagai "libur kelas" lewat catatan jadwal kelasnya.
  - ✅ Mengambil tanggal piket yang kosong (`/claims`) karena ia tetap orang tua murid.
  - ❌ Membuka kunci jadwal (`POST /schedules/:id/unlock`) → `403`. Buka kunci adalah wewenang admin; korlas mengunci & mempublikasi jadwal kelasnya sendiri.
  - ❌ Mengubah katalog menu & kategori → `403` (katalog sekolah-wide, terpusat di admin).
  - ❌ Melihat atau mengubah jadwal kelas lain → `403`.
  - ❌ Menandai hari libur sekolah (`/holidays`) → `403` (tetap wewenang admin).
  - ❌ Kelola akun orang tua (`/parents`) dan statistik (`/stats`) → `403`.
- **Catatan:** Korlas **bukan** admin. Ia tetap melihat profil & daftar anaknya sendiri seperti orang tua, tetapi tidak melihat menu "Dashboard", "Kategori", maupun "Orang Tua" di navigasi. Alurnya: **korlas menyusun → korlas mengunci → korlas mempublikasi** untuk kelasnya sendiri; admin dapat melakukan ketiganya untuk seluruh sekolah sekaligus. Bila masih ada baris `draft`, API menjawab `409` dan kelas penyebabnya disebutkan. Baris yang sudah `locked`/`published` tidak dapat diubah lagi oleh siapa pun (`409 not_editable`) — admin harus membuka kuncinya lebih dulu bila ada perubahan mendadak.

### 3.4 Koperasi / Kantin

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

> Katalog menu bersifat **sekolah-wide** — dipakai bersama semua kelas, sehingga korlas ikut
> mengelolanya (bukan hanya admin). Ini yang membuat korlas bisa langsung memakai menu baru
> untuk kelasnya tanpa menunggu admin.

### F2: Manajemen Jadwal (Admin & Korlas — Per Kelas)

- **Atur jadwal harian** — pilih tanggal → pilih menu → simpan, **untuk kelas tertentu**.
- **Atur jadwal Sepekan** — input rentang tanggal (Senin–Jumat) → assign menu per hari.
- **Duplikasi jadwal** — copy jadwal minggu ke minggu lain (per kelas).
- **Template bulanan** — generate jadwal sebulan dari template.
- **Override** — ubah menu untuk tanggal tertentu tanpa mengganggu jadwal lain.
- **Jadwal per kelas** — setiap kelas memiliki baris jadwalnya sendiri; tanggal yang sama
    
  boleh punya menu berbeda antar kelas (`UNIQUE(schedule_date, class_name)`).
- **Penandaan libur kelas** — korlas dapat menandai satu hari sebagai libur lewat catatan
    
  jadwal kelasnya; **hari libur sekolah** tetap global dan hanya admin yang boleh mengubahnya.
- **Batas korlas** — korlas menyunting hanya kelas yang dikoordinasinya, dan hanya selama
  barisnya masih `draft`. Tombol **Kunci bulan** tidak muncul untuknya karena mengunci jadwal
  adalah wewenang admin; yang ia pegang adalah tombol **Publikasi**.

### F3: Tampilan Jadwal (User — Wajib Login)

- **Jadwal hari ini** — card menampilkan menu hari ini (makanan + buah). Hanya tampil setelah login.
- **Jadwal minggu ini** — list Senin–Jumat dengan menu masing-masing. Hanya tampil setelah login.
- **Jadwal bulanan** — kalender/komponen grid menampilkan semua hari di bulan tsb. Hanya tampil setelah login.
- **Pencarian menu** — cari berdasarkan nama makanan/buah, lihat kapan disajikan. Hanya tampil setelah login.
- **Terfilter per kelas** — semua halaman di atas menampilkan jadwal kelas yang sedang aktif
    
  (kelas sendiri untuk korlas, kelas anak untuk orang tua, kelas terpilih untuk admin).
- **Pemilih kelas (Class Switcher)** — muncul di header hanya bila user punya akses ke lebih
    
  dari satu kelas (admin, atau orang tua dengan anak di beberapa kelas); tersimpan di
    
  `localStorage` sehingga pilihan tidak hilang saat berpindah halaman.

### F3b: Autentikasi Orang Tua

- **Login** — halaman login dengan username & password.
- **Akun pribadi** — setiap orang tua memiliki akun yang diberikan oleh admin sekolah.
- **Satu akun, banyak anak** — seorang orang tua boleh memiliki lebih dari satu anak; setiap anak punya nama dan kelas sendiri. Profil menampilkan seluruh anak, dan daftar akun di halaman admin menampilkan semua anak dalam satu baris.
- **Manajemen akun (Admin)** — admin dapat membuat, edit, dan nonaktifkan akun orang tua beserta daftar anaknya (tambah/hapus anak di dalam satu formulir).
- **Profil** — orang tua dapat melihat profil (termasuk daftar anak) dan ubah password sendiri.
- **Session/Token** — login menghasilkan JWT token dengan masa berlaku tertentu, disimpan di cookie/localStorage.
- **Role-based access** — tiga role: `parent` (read-only), `korlas` (menyusun & mempublikasi jadwal kelasnya), `admin` (CRUD penuh). Pembatasan dilakukan **dua lapis**: API menolak dengan `403` (`requireRole(...)`), dan UI menyembunyikan tombol tambah/ubah/hapus lewat `<RoleGate need="...">` — `admin` untuk katalog/kategori/hari libur/akun/dashboard, `schedule` untuk halaman Kelola Jadwal (admin + korlas). Di dalam halaman jadwal, tombol **Kunci bulan** hanya dirender untuk admin karena `POST /schedules/lock` memang admin-only. API adalah penegak yang sebenarnya; UI hanya menyembunyikan kontrol.
- **Pengangkatan korlas** — korlas **tidak dibuat lewat halaman terpisah**, melainkan dengan mengubah `role` sebuah akun lewat `PUT /parents/:id` (`{"role":"korlas","className":"1"}`). Saat role dijadikan `korlas`, `className` **wajib** diisi; saat dikembalikan ke `parent`, `className` otomatis dikosongkan. Form di halaman "Kelola Akun" menampilkan pilihan **Peran** dan input **Kelas yang dikoordinasikan** (muncul hanya bila peran = korlas), dan daftar akun menampilkan badge `Korlas <kelas>`.
- **Cakupan kelas (`classScope`)** — pembacaan jadwal menerima `?class=` opsional; bila kosong, kelas default ditentukan dari peran (admin → kelas pertama tersedia, korlas → kelasnya, orang tua → kelas anak aktif pertama). Kelas di luar cakupan → `403`. Untuk penulisan, admin **wajib** menyebut kelas (`400 class_required`), sedangkan korlas terkunci ke `user.className` dan menyebut kelas lain dijawab `403 forbidden_class`. Pada `PUT`/`DELETE`, kelas diambil dari **baris database** (bukan input klien) lewat `canWriteClass(user, row.className)` sehingga korlas tidak bisa membajak baris kelas lain. Kunci/buka kunci jadwal tidak lewat `classScope` untuk korlas — endpoint-nya memang admin-only.
- **Daftar kelas tanpa tabel** — kelas sengaja tidak dijadikan tabel; daftarnya diturunkan dari `students.class_name` ∪ `users.class_name` (korlas) ∪ `schedules.class_name`, lalu disaring sesuai peran lewat `GET /classes`.

### F4: Kategori & Filtering

- **Filter by kategori** — mis. "menu gorengan saja minggu ini".
- **Filter by buah** — "kapan terakhir jeruk disajikan?"
- **Statistik ringan** — jumlah menu unik per bulan, distribusi kategori.

### F5: Ekspor & Cetak

- **Ekspor PDF** — jadwal Sepekan/bulanan untuk cetak/pengumuman.
- **Ekspor Excel** — untuk perencanaan koperasi.

### F6: Notifikasi (Opsional / Future)

- **Push notification** — pengingat menu hari ini (opsional, phase 2).
- **Broadcast WhatsApp** — integrasi opsional.

### F7: Penugasan Piket Siswa (Admin & Korlas — Per Kelas) — ⚠ DIREVISI, tabelnya tidak jadi dibuat

> **Status implementasi:** dimensi piketnya **terwujud**, tetapi pemodelannya tidak seperti
>   
> rancangan di bawah. Tabel `piket_assignments` **tidak pernah dibuat**. Sebagai gantinya
>   
> `schedules` mendapat dua kolom `petugas_name` dan `petugas_parent_name` (migrasi `0003`) —
>   
> karena satu kelas hanya punya satu petugas per hari, dan baris jadwalnya sudah per-kelas,
>   
> tabel terpisah tidak memberi apa pun selain satu join tambahan. Label "Kelas 1"–"Kelas 5"
>   
> dipetakan ke `class_name` saat seed, sehingga `class_label` juga tidak diperlukan.
>
> Sejak **F9**, kolom petugas ini punya dua sumber: diisi korlas dari daftar piket manual,
>   
> atau diisi otomatis ketika seorang orang tua mengambil tanggal itu.
>
> **Perubahan v1.8 — petugas jadi relasi, bukan teks bebas.** Kolom teks `petugas_name` /
>   
> `petugas_parent_name` kini **diturunkan** dari dua kolom baru `petugas_student_id` dan
>   
> `petugas_parent_id` (migrasi `0007`). Akibatnya:
>
> - Di halaman **Kelola Jadwal**, kolom *Petugas* berubah dari input teks menjadi **dropdown
>   berisi siswa kelas itu** (sumber: `GET /api/classes/:class/roster`), dan kolom *Orang tua*
>   menjadi **read-only** yang terisi otomatis dari siswa terpilih. Sebelumnya dua kolom itu
>   bisa diisi bebas dan tidak pernah dijamin cocok satu sama lain.
> - Nama di `petugas_name`/`petugas_parent_name` kini **selalu diturunkan server** dari
>   `petugas_student_id`. Body request yang menyelipkan nama sendiri akan ditimpa, sehingga
>   baris jadwal tidak mungkin memuat pasangan siswa–orang tua yang tidak ada di database.
> - Petugas wajib siswa **dari kelas baris itu**. Aturan ini ditegakkan `resolvePetugas()`
>   (`src/api/schedules/service.ts`) — satu tempat, dipakai bersama oleh
>   `createSchedule`/`updateSchedule`/`copyWeek`/`claims` — dan menolak dengan `petugas_not_found`
>   (400) bila id-nya bukan siswa kelas tersebut.
> - Kolomnya **nullable dan tanpa backfill**: jadwal lama (hasil impor `output_jadwal_piket.txt`)
>   tetap menampilkan namanya seperti semula, hanya id-nya kosong sampai korlas memilih ulang.
>
> **Catatan implementasi — kenapa tanpa foreign key.** Rancangan awal mengikat kedua kolom id itu
> dengan **dua FK komposit** ke `students` (`(class_name, petugas_student_id) → students(class_name, id)`
> dan `(petugas_student_id, petugas_parent_id) → students(id, parent_id)`). Rancangan itu dibatalkan
> karena tidak bisa dijalankan lewat migrasi D1: FK komposit menuntut indeks unik pada pasangan kolom
> target yang persis sehingga `schedules` harus dibangun ulang, sementara cara mematikan penegakan FK
> selama rebuild (`PRAGMA foreign_keys=OFF`) **diabaikan senyap di dalam transaksi** — dan
> `wrangler d1 migrations apply` membungkus migrasi dalam transaksi, sehingga di production muncul
> `FOREIGN KEY constraint failed` padahal di lokal berhasil. Jalur yang "berhasil" pun menghasilkan
> tabel korup (292 pelanggaran `foreign_key_check`). Jadi `0007` hanya `ALTER TABLE ... ADD COLUMN`.
> Rincian lengkap ada di catatan desain `README.md`.
>
> Rancangan asli dipertahankan di bawah sebagai catatan sejarah.

- **Tetapkan siswa piket** — pilih tanggal → pilih kelas → masukkan nama siswa yang bertugas membawa/menyiapkan snack hari itu.
- **Satu siswa per kelas per hari** — setiap kelas memiliki tepat satu siswa piket per hari (dapat diperluas di masa depan).
- **Label kelas fleksibel** — file sumber memakai label "Kelas 1", "Kelas 2", ..., "Kelas 5"; jumlah kelas yang piket bervariasi per hari (3–5 kelas). Label ini disimpan apa adanya di `piket_assignments.class_label`.
- **Tampilan untuk orang tua** — jadwal harian menampilkan nama siswa piket per kelas di samping menu, sehingga orang tua tahu kapan anaknya giliran bertugas.
- **Pencarian piket** — "kapan Shezan terakhir kali piket?" — mencari riwayat penugasan siswa.
- **Notifikasi piket** (future) — pengingat H-1 untuk siswa yang piket besok.
- **Korelasi dengan jadwal** — penugasan terhubung ke entri jadwal (`schedule_id`); bila jadwal dihapus, penugasan ikut terhapus (`ON DELETE CASCADE`).

> **Catatan pemodelan:** file sumber `output_jadwal_piket.txt` menggunakan label "Kelas 1"–"Kelas 5" yang berbeda dari `schedules.class_name`
>   
> (mis. "1A", "1B", "2A"). Keduanya disimpan terpisah: `piket_assignments.class_label` mempertahankan label asli file sumber,
>   
> sedangkan `piket_assignments.schedule_id` mengaitkan ke baris jadwal yang sesuai. Pemetaan antara "Kelas N" dan `class_name`
>   
> dilakukan saat impor/seed, bukan saat runtime.

### F8: Kunci & Publikasi Jadwal (Kunci: Admin · Publikasi: Admin & Korlas)

- **Tiga status jadwal** — setiap baris `schedules` memiliki `status`:
  - `draft` (default) — dapat diedit oleh korlas/admin
  - `locked` — dikunci oleh admin atau korlas (admin bisa seluruh kelas sekaligus); **tidak dapat** diedit/dihapus/ditimpa
  - `published` — dipublikasi ke semua orang tua; **tidak dapat** diedit/dihapus/ditimpa
- **Kunci (lock)** — admin mengunci semua jadwal `draft` pada suatu rentang tanggal
  (mis. satu bulan) **untuk semua kelas (kelas 1–6) sekaligus** dalam satu tindakan;
  `className` boleh diisi bila hanya ingin kelas tertentu. Korlas hanya bisa mengunci
  kelas yang dikoordinasinya. Baris yang sudah `locked`/`published` dilewati.
  Pencatat: `locked_by` + `locked_at`.
- **Publikasi (publish)** — admin memublikasi semua jadwal `locked` untuk satu bulan
  **untuk seluruh sekolah sekaligus** — orang tua kelas 1–6 melihat jadwalnya bersamaan.
  **Syarat:** tidak boleh ada baris `draft` tersisa di bulan tersebut (semua harus sudah
  dikunci). Pada operasi sekolah-wide, draft di kelas mana pun menahan publikasi seluruh
  sekolah, dan pesan `409` menyebut **kelas penyebabnya** agar admin tahu harus mengunci
  kelas mana. Pencatat: `published_by` + `published_at`.
- **Buka kunci (unlock)** — **hanya admin** yang dapat membuka kunci satu baris individual,

  mengembalikannya ke `draft`. Ini berguna bila ada perubahan mendadak setelah jadwal dikunci.
- **Orang tua hanya melihat `published`** — pembacaan jadwal oleh role `parent` difilter
    
  otomatis di repository (`WHERE status IN ('published')`); baris `draft`/`locked` tidak
    
  muncul. Admin dan korlas melihat semua status.
- **Badge status** — di halaman `/jadwal`, setiap baris hari menampilkan badge status
    
  (Draft / Terkunci / Dipublikasi), dan kontrol edit (menu, catatan, libur, hapus) dinonaktifkan
    
  untuk baris yang `locked`/`published`.

> **Alur kerja korlas:** susun jadwal (draft) → minta admin mengunci bulan (locked) →
> publikasi (published). Setelah publikasi, orang tua melihat jadwal. Bila perlu revisi,
> admin membuka kunci (unlock) baris tertentu → korlas mengedit → kunci ulang → publikasi ulang.
> **Skala sekolah:** kunci & publikasi dirancang sebagai operasi **satu tombol untuk seluruh
> sekolah**. Menu snack memang sama untuk semua kelas, dan jadwal ditetapkan serentak di
> lapangan — jadi admin tidak perlu mengulang kunci/publikasi enam kali. Yang tetap
> **per kelas** adalah kepemilikan tanggal: setiap kelas punya baris `schedules` sendiri
> (`UNIQUE(schedule_date, class_name)`), sehingga rebutan tanggal oleh orang tua berjalan
> per kelas (lihat F9).

### F9: Pilih Jadwal (Orang Tua — Siapa Cepat Dia Dapat)

Menjawab kebiasaan yang selama ini berjalan lewat grup WhatsApp: korlas mengumumkan tanggal mana
  
saja yang belum ada petugasnya, lalu orang tua saling mendahului menawarkan diri. Yang paling
  
sering jadi masalah bukan pembagiannya, melainkan **dua orang merasa sama-sama sudah dapat**.

- **Hanya tanggal terbuka** yang bisa diambil: sudah `published`, bukan hari libur, belum lewat,
    
  dan `petugas_name` masih kosong. Tanggal yang petugasnya sudah ditetapkan korlas dari daftar
    
  piket manual **tidak** ikut diperebutkan.
- **Satu klik langsung mengambil** — tanpa dialog konfirmasi, karena yang diperebutkan justru
    
  kecepatan. Pilihan "atas nama anak" ditetapkan sekali di atas halaman dan dipersempit otomatis
    
  ke anak yang ada di kelas tersebut.
- **Yang kalah cepat mendapat penolakan yang jelas** — modal "Yah, keduluan!" beserta **nama**
    
  orang tua yang lebih dulu mengambilnya, lalu papan jadwalnya langsung disegarkan.
- **Klaim menjadi sumber kebenaran petugas** — mengambil tanggal ikut mengisi
    
  `schedules.petugas_name` (nama anak) dan `petugas_parent_name` (nama orang tua); membatalkan
    
  mengosongkannya lagi. Jadi tidak ada dua daftar yang bisa berbeda isi.
- **Pembatalan** — oleh pemiliknya sendiri selama tanggalnya belum lewat, atau kapan saja oleh
    
  admin dan korlas kelas itu (mis. saat ada pergantian mendadak).
- **Batas kelas tetap berlaku** — orang tua hanya bisa mengambil tanggal di kelas anaknya.
- **Rebutan berjalan per kelas, bukan per tanggal sekolah.** Karena setiap kelas punya baris
    
  jadwalnya sendiri, klaim seorang **orang tua kelas 1** hanya menutup tanggal itu **bagi
    
  orang tua kelas 1 lain**. Orang tua **kelas 2** (dan kelas lain) tetap bisa mengambil tanggal
    
  yang sama pada baris kelasnya — menu memang sama, tetapi yang diperebutkan adalah giliran
    
  piket per kelas. Contoh: Bu Sari (kelas 1) mengambil Selasa 1 Sep → Bu Ani (kelas 1) ditolak
    
  `409`; Bu Dewi (kelas 2) tetap berhasil mengambil Selasa 1 Sep di kelas 2.
- **Korlas ikut boleh memilih** karena ia tetap orang tua murid. Admin tidak punya profil orang
    
  tua, sehingga hanya bisa membaca rekap dan membatalkan klaim.

> **Jaminan tidak ada klaim ganda ada di database, bukan di aplikasi.** `schedule_claims` punya
>   
> indeks unik pada `schedule_id`. Karena `schedule_id` menunjuk satu baris **(tanggal × kelas)**,
>   
> keunikan itu otomatis berarti "satu tanggal per kelas untuk satu orang tua" — bukan "satu
>   
> tanggal untuk seluruh sekolah". Dua permintaan yang tiba bersamaan pada baris yang sama
>   
> sama-sama lolos pengecekan di service — lalu salah satunya ditolak SQLite dan dijawab **409**.
>   
> Pengecekan di service hanya untuk pesan yang ramah; constraint-nyalah yang menegakkan aturan.
>
> **Konsekuensi alur kerja:** karena baris `published` tidak bisa diedit lagi, korlas harus
>   
> memutuskan tanggal mana yang dibiarkan terbuka **sebelum** memublikasi.

### F10: Progressive Web App (PWA)

- **Pasang ke layar utama** — banner "Pasang" muncul di Chrome/Edge; di iOS ditampilkan petunjuk
    
  manual "Add to Home Screen" karena Safari tidak mendukung `beforeinstallprompt`.
- **Service worker** — cache aset untuk pemuatan cepat, plus banner "Versi baru tersedia" ketika
    
  ada pembaruan yang menunggu.
- **Manifest** — nama, ikon 192px & 512px, `display: standalone`, tema ungu `#51277C`.
- **Bilah navigasi bawah (khusus PWA terpasang)** — begitu aplikasi dipasang, navigasi
  dipindahkan dari header ke bilah mengambang di bawah layar: kapsul putih berisi empat tab
  (Hari Ini, Pilih Jadwal, Cari Menu, Profil), masing-masing dengan ikon di atas label dan
  titik penanda tab aktif, plus tombol bulat ungu di tengah-atasnya. Tombol tengah membuka
  panel **Semua Menu** berisi seluruh tujuan navigasi yang tidak muat sebagai tab — termasuk
  yang bergantung peran (Dashboard, Kategori, Kelola Jadwal, Akun Orang Tua). Bilah menu di
  header disembunyikan saat bilah bawah aktif agar tujuan yang sama tidak tampil dua kali.
  Di browser biasa (belum dipasang) bilah ini **tidak dirender sama sekali** — deteksinya
  lewat `display-mode: standalone` (cadangan `navigator.standalone` untuk iOS).

> **Catatan implementasi:** `beforeinstallprompt` hanya menyala **sekali** dan terjadi jauh sebelum
>   
> komponen banner sempat dirender — banner itu ada di dalam `AppShell`, yang baru muncul setelah
>   
> sesi diverifikasi ke `/auth/me`. Karena itu event-nya ditangkap skrip inline di `<head>` lalu
>   
> dibaca kembali oleh hook. Tanpa penangkap itu tombol Pasang tidak pernah muncul.
>
> Daftar tujuan navigasi tinggal di `src/components/navItems.ts` sebagai **sumber tunggal**;
> `AppShell` (bilah atas) dan `BottomNav` (bilah bawah) menyaring daftar yang sama lewat
> `visibleNavItems()`, sehingga menu tidak bisa lepas sinkron antar keduanya.

---

## 5. Struktur Data dari File Sumber

Berdasarkan analisis file `data/output_jadwal_piket.txt`, data dapat dimodelkan sebagai:

```
Bulan → Minggu (rentang tanggal) → Hari → Menu (makanan utama + buah)
                                      ↓
                                Penugasan Piket (kelas → siswa)
```

### Contoh Pemetaan Data:

| Tanggal    | Hari   | Makanan Utama               | Buah Pendamping | Bulan     |
| ---------- | ------ | --------------------------- | --------------- | --------- |
| 1 Sep 2026 | Selasa | Roti coklat                 | Jeruk           | September |
| 2 Sep 2026 | Rabu   | Tahu isi sayur              | Melon           | September |
| 3 Sep 2026 | Kamis  | Pisang panggang coklat keju | Nanas madu      | September |
| 4 Sep 2026 | Jumat  | Urap jagung                 | Semangka        | September |
| 7 Sep 2026 | Senin  | Ubi cilembu                 | Jambu air       | September |
| ...        | ...    | ...                         | ...             | ...       |

### Contoh Penugasan Piket (1 Sep 2026 — Selasa):

| Kelas   | Siswa Piket |
| ------- | ----------- |
| Kelas 1 | Shezan      |
| Kelas 2 | Uma         |
| Kelas 3 | Azkayra     |

> **File sumber `output_jadwal_piket.txt` memuat dimensi penugasan siswa.** Setiap hari kerja mencantumkan
>   
> nama siswa yang bertugas piket per kelas. Jumlah kelas yang piket per hari bervariasi (3–5 kelas).
>   
> Berdasarkan analisis September 2026: **5 minggu, 22 hari, 87 penugasan, 38 siswa unik**.
>   
> Distribusi: 10 hari dengan 3 kelas, 11 hari dengan 5 kelas, 1 hari dengan 3 kelas (data quality issue:
>   
> "Kelas 3 Kia" tanpa titik dua — lihat Catatan).

> **File sumber belum memuat dimensi kelas pada menu.** Menu sama untuk seluruh kelas pada tanggal yang sama
>   
> (model lama "satu jadwal untuk seluruh sekolah"). Sejak v1.4 jadwal disimpan **per kelas**, sehingga setiap
>   
> baris di tabel di atas berkembang menjadi satu baris `schedules` **untuk setiap kelas** —
>   
> 43 tanggal × 3 kelas = **129 baris**. Bila sekolah ingin menu berbeda antar kelas, yang diubah
>   
> hanya pasangan `(tanggal, kelas)` tertentu; struktur tabelnya sudah siap tanpa migrasi baru.

### Catatan:

- Hari **Sabtu & Minggu** tidak ada jadwal (libur sekolah).
- Ada kemungkinan **hari libur** di tengah minggu (mis. "Senin: Libur" pada 17 Agustus 2026).
- Setiap hari kerja memiliki **tepat dua item menu**: makanan utama + buah.
- Beberapa item bersifat campuran, mis. "Pisang panggang coklat keju" (makanan olahan, bukan buah segar).
- **Koreksi v1.5:** Contoh pemetaan tabel sebelumnya menulis "2 Sep 2026 = Selasa" — salah. September 1, 2026 jatuh pada hari Selasa (verifikasi: `datetime.date(2026,9,1).strftime('%A') = 'Tuesday'`). Semua tanggal di tabel lama bergeser 1 hari. Juga "Roti isi coklat" dikoreksi menjadi "Roti coklat" dan "buah naga" menjadi "naga" agar cocok dengan `output_jadwal_piket.txt`.
- **Koreksi rentang minggu:** Minggu pertama September adalah "1–4 September 2026" (Selasa–Jumat), bukan "1–5 September" — Senin tidak masuk karena 31 Agustus milik minggu sebelumnya.

---

## 6. Arsitektur Teknis (Stack BHVR)

### 6.1 Komponen Stack

| Lapisan        | Teknologi                 | Penjelasan                                                                                                      |
| -------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **B**un        | Runtime & Package Manager | Runtime JavaScript/TypeScript cepat; dipakai untuk install, script, dan tooling. Bukan runtime server produksi. |
| **H**ono       | Backend API               | Web framework ultrafast, middleware-based. Berjalan di atas **Cloudflare Workers**.                             |
| **V**ite       | Build Tool                | Dev server dengan HMR instan + build produksi teroptimasi.                                                      |
| **R**eact      | Frontend                  | React 19 + **TanStack Router v7** untuk routing + **TanStack Query** untuk data fetching/caching.               |
| **Database**   | Cloudflare D1             | Serverless SQLite yang terintegrasi dengan Workers, diakses via **Drizzle ORM**.                                |
| **Styling**    | Tailwind CSS v4           | Utility-first CSS, via `@tailwindcss/vite` plugin.                                                              |
| **Deployment** | Cloudflare Workers        | Serverless edge runtime, aset statis disajikan dari `./dist/client` dengan SPA fallback.                        |

**Penting — koreksi dari v1.1:** Dokumen versi sebelumnya menyebut frontend **Vue 3** dan database **bun:sqlite lokal**. Setelah template `bhvr-template` di-scaffold, stack sebenarnya adalah **React 19** dan **Cloudflare D1**. Skema database tetap berlaku karena D1 adalah SQLite — hanya lapisan akses dan deployment yang berubah. Sejak v1.4 jumlah tabel menjadi **12** setelah tabel `students` dipisahkan dari `parents`. Sejak v1.5 ditambahkan tabel `piket_assignments` sehingga total menjadi **13** tabel.

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
│   │   ├── classes/              # Daftar kelas yang boleh diakses user (turunan, tanpa tabel)
│   │   ├── catalog/              # Menu + kategori (admin & korlas)
│   │   ├── schedules/            # Jadwal per kelas, minggu, hari libur (global)
│   │   ├── parents/              # CRUD akun orang tua + anak + pengangkatan korlas
│   │   ├── piket/                # Penugasan siswa piket per kelas per hari (Phase 4)
│   │   ├── stats/                # Ringkasan dashboard (admin)
│   │   ├── middleware/           # requireAuth, requireRole
│   │   └── utils/                # response, password, date, slug, params, sql, classScope
│   ├── database/
│   │   ├── db.ts                 # Inisialisasi Drizzle + D1 binding + tipe Db
│   │   └── schema.ts             # Drizzle schema (13 tabel)
│   ├── components/               # AppShell, ScheduleDayCard, ClassSwitcher, ui.tsx
│   ├── routes/                   # TanStack Router — halaman frontend
│   │   ├── __root.tsx            # Root + AuthProvider
│   │   ├── login.tsx             # Halaman login
│   │   └── _app/                 # Layout terproteksi
│   │       ├── index.tsx         # / → redirect ke /hari-ini
│   │       ├── dashboard.tsx     # Ringkasan (admin)
│   │       ├── hari-ini.tsx      # Jadwal hari ini (per kelas aktif)
│   │       ├── minggu-ini.tsx    # Jadwal Sepekan (per kelas aktif)
│   │       ├── bulan.tsx         # Jadwal bulanan (per kelas aktif)
│   │       ├── pencarian.tsx     # Cari riwayat menu (per kelas aktif)
│   │       ├── menu.tsx          # CRUD menu (admin & korlas)
│   │       ├── kategori.tsx      # CRUD kategori (admin & korlas)
│   │       ├── jadwal.tsx        # Kelola jadwal kelas (admin & korlas) + hari libur (admin)
│   │       ├── orang-tua.tsx     # CRUD akun orang tua + anak + role/kelas (admin)
│   │       └── profil.tsx        # Profil + daftar anak + ubah password
│   ├── lib/                      # api.ts, auth.tsx, auth-context.ts, active-class.ts, date.ts, ...
│   ├── types/                    # auth.ts, catalog.ts, schedule.ts, account.ts, class.ts
│   ├── index.css                 # Global styles (Tailwind)
│   ├── main.tsx                  # React + Router entry point
│   └── routeTree.gen.ts          # Auto-generated route tree
├── data/
│   ├── jadwal_piket_snack.txt      # Arssip — jadwal Agustus & September 2026 (menu saja)
│   └── output_jadwal_piket.txt     # Sumber utama — September 2026 (menu + penugasan siswa per kelas)
├── drizzle/
│   ├── migrations/               # Migrasi D1 (drizzle-kit) — termasuk 0002 jadwal per kelas
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

| Lapisan        | Tanggung Jawab                                           | Contoh File                  |
| -------------- | -------------------------------------------------------- | ---------------------------- |
| **Route**      | Definisi endpoint & HTTP method                          | `src/api/auth/route.ts`      |
| **Controller** | Terima request, validasi, kirim response                 | `src/api/auth/controller.ts` |
| **Service**    | Business logic (hash password, verifikasi, generate JWT) | `src/api/auth/service.ts`    |
| **Repository** | Akses data via Drizzle (query D1)                        | `src/api/auth/repository.ts` |

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

| Method | Path                 | Deskripsi                                                   | Role          |
| ------ | -------------------- | ----------------------------------------------------------- | ------------- |
| POST   | `/api/auth/login`    | Login (username + password) → JWT token + profil user       | Public        |
| POST   | `/api/auth/logout`   | Logout (titik keluar eksplisit; JWT stateless)              | Authenticated |
| GET    | `/api/auth/me`       | Profil user yang sedang login + daftar anak (bila `parent`) | Authenticated |
| PUT    | `/api/auth/password` | Ubah password sendiri                                       | Authenticated |

### 7.2 Parent (Orang Tua) Endpoints — Admin Only

| Method | Path                              | Deskripsi                                                                               | Role  |
| ------ | --------------------------------- | --------------------------------------------------------------------------------------- | ----- |
| GET    | `/api/parents`                    | List akun orang tua + seluruh anaknya (paginated, `search` mencocokkan nama/kelas anak) | Admin |
| GET    | `/api/parents/:id`                | Detail akun + daftar anak                                                               | Admin |
| POST   | `/api/parents`                    | Buat akun + profil + daftar anak (`students[]`, min. 1)                                 | Admin |
| PUT    | `/api/parents/:id`                | Edit akun; `students[]` menggantikan daftar lama bila dikirim                           | Admin |
| DELETE | `/api/parents/:id?hard=`          | Nonaktifkan akun (soft delete), atau hapus permanen                                     | Admin |
| POST   | `/api/parents/:id/reset-password` | Reset password akun orang tua                                                           | Admin |

> **Bentuk `students`:** array objek `{ id?, name, className? }`. Saat `PUT`, entri yang menyertakan `id` akan **diperbarui**, entri tanpa `id` **dibuat baru**, dan entri yang tidak disebut lagi **dihapus**. `id` hanya dipercaya bila anak tersebut memang milik orang tua itu.

> **Bentuk `role` / `className`:** `role` menerima `"parent"` atau `"korlas"`. Bila `role = "korlas"`,
>   
> `className` **wajib** diisi (mis. `"1"`); bila `role = "parent"`, `className` diabaikan dan
>   
> dikosongkan otomatis. Lihat §3.3 untuk wewenang korlas.

### 7.3 Kelas Endpoints

| Method | Path           | Deskripsi                                                                                                                                     | Role          |
| ------ | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| GET    | `/api/classes` | Daftar kelas yang **boleh diakses pemanggil** + kelas default. Admin → semua kelas; korlas → kelasnya sendiri; orang tua → kelas anak-anaknya | Authenticated |

> Response: `{ "classes": ["1","2","3","4","5","6"], "default": "1" }`. Daftar ini **sudah dipersempit**
>   
> sesuai peran, jadi UI bisa langsung memakainya untuk pemilih kelas tanpa logika tambahan.
>   
> Kelas diturunkan dari `students` ∪ korlas `users` ∪ `schedules` (tidak ada tabel `classes`),
>   
> dan diurutkan natural sehingga `2A` mendahului `10A`.

### 7.4 Menu Endpoints

| Method | Path                    | Deskripsi                                               | Role                  |
| ------ | ----------------------- | ------------------------------------------------------- | --------------------- |
| GET    | `/api/menus`            | List semua menu (paginated)                             | Admin, Korlas, Parent |
| GET    | `/api/menus/item-types` | Jenis komponen menu (`main`, `fruit`, `drink`, `other`) | Admin, Korlas, Parent |
| GET    | `/api/menus/:id`        | Detail menu                                             | Admin, Korlas, Parent |
| POST   | `/api/menus`            | Tambah menu baru                                        | **Admin**             |
| PUT    | `/api/menus/:id`        | Edit menu                                               | **Admin**             |
| DELETE | `/api/menus/:id`        | Soft-delete menu (arsip)                                | **Admin**             |

### 7.5 Schedule Endpoints

Semua pembacaan menerima query **`?class=`** opsional. Bila kosong, kelas default ditentukan dari peran
  
pemanggil (lihat §7.3). Kelas di luar cakupan → `403`.

| Method | Path                                            | Deskripsi                                                                                                                                                             | Role                  |
| ------ | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| GET    | `/api/schedules/today?class=`                   | Jadwal hari ini (WIB) + minggu berjalan                                                                                                                               | Admin, Korlas, Parent |
| GET    | `/api/schedules/today-all`                      | Jadwal hari ini untuk **semua kelas** sekaligus                                                                                                                       | **Admin**             |
| GET    | `/api/schedules/week?date=YYYY-MM-DD&class=`    | Jadwal Senin–Jumat pada minggu tersebut                                                                                                                               | Admin, Korlas, Parent |
| GET    | `/api/schedules/month?year=YYYY&month=M&class=` | Jadwal bulanan, dikelompokkan per minggu                                                                                                                              | Admin, Korlas, Parent |
| GET    | `/api/schedules/status?year=YYYY&month=M&class=` | Ringkasan status bulan per kelas (`perClass`, `totals`, `draftClasses`, `canPublish`); admin tanpa `class` = **seluruh sekolah**, korlas = kelasnya sendiri. Satu query `GROUP BY class_name, status` — menggantikan pemuatan jadwal tiap kelas di klien | Admin, Korlas, Parent |
| GET    | `/api/schedules/range?from=&to=&class=`         | Rentang bebas (maks. 92 hari)                                                                                                                                         | Admin, Korlas, Parent |
| GET    | `/api/schedules/search?q=&from=&to=&class=`     | Cari tanggal di mana menu/komponen pernah dijadwalkan (maks. 400 hari)                                                                                                | Admin, Korlas, Parent |
| GET    | `/api/schedules/:id`                            | Detail satu entri jadwal (kelas diambil dari barisnya)                                                                                                                | Admin, Korlas, Parent |
| POST   | `/api/schedules`                                | Set jadwal satu tanggal **untuk satu kelas** (`className` wajib)                                                                                                      | Admin, **Korlas**     |
| POST   | `/api/schedules/copy`                           | Salin jadwal Senin–Jumat ke minggu lain (`overwrite` opsional)                                                                                                        | Admin, **Korlas**     |
| PUT    | `/api/schedules/:id`                            | Ubah menu / libur / catatan (kelas dari baris)                                                                                                                        | Admin, **Korlas**     |
| DELETE | `/api/schedules/:id`                            | Hapus jadwal (kelas dari baris; ditolak bila `locked`/`published`)                                                                                                    | Admin, **Korlas**     |
| POST   | `/api/schedules/lock`                           | Kunci semua jadwal `draft` pada rentang tanggal (`fromDate`, `toDate`, `className?`); admin tanpa `className` = **semua kelas**                                       | Admin, **Korlas**     |
| POST   | `/api/schedules/publish`                        | Publikasi semua jadwal `locked` untuk satu bulan (`year`, `month`, `className?`); admin tanpa `className` = **seluruh sekolah**; gagal (`409`) bila masih ada `draft` | Admin, **Korlas**     |
| POST   | `/api/schedules/:id/unlock`                     | Buka kunci satu baris — kembalikan ke `draft` (hapus `locked_by`/`published_by` dll)                                                                                  | Admin                 |
| GET    | `/api/weeks?year=&month=`                       | Daftar minggu pada bulan tersebut                                                                                                                                     | Admin, Korlas, Parent |
| GET    | `/api/holidays?from=&to=`                       | Daftar hari libur (sekolah-wide)                                                                                                                                      | Admin, Korlas, Parent |
| POST   | `/api/holidays`                                 | Tambah hari libur                                                                                                                                                     | Admin                 |
| DELETE | `/api/holidays/:id`                             | Hapus hari libur                                                                                                                                                      | Admin                 |

> **Aturan tulis:** `POST /schedules` dan `POST /schedules/copy` menerima `className` di body.
> Admin **wajib** mengirimkannya (`400 class_required` bila kosong); korlas boleh mengirim
> kelasnya sendiri, dan mengirim kelas lain → `403 forbidden_class`. Pada `PUT`/`DELETE /schedules/:id`,
> `className` di body **diabaikan** — kelas ditentukan oleh baris yang ada di database, dan korlas
> yang menyentuh baris kelas lain ditolak `403` (`Kelas ini bukan cakupan Anda`).

> **Aturan kunci & publikasi:**

> - `POST /schedules/lock` menerima `className` di body. **Admin tanpa `className` mengunci
>   semua kelas (1–6) sekaligus** — satu panggilan untuk seluruh sekolah; bila `className`
>   diisi, hanya kelas itu. **Korlas** tidak perlu mengisi apa pun (otomatis kelasnya), dan
>   menyebut kelas lain dijawab `403 forbidden_class`.
>   Mengunci semua baris `draft` pada rentang `fromDate`–`toDate` → status `locked`.
>   Responsnya membawa `classes` (daftar kelas yang tersentuh) agar UI bisa melaporkan cakupannya.
> - `POST /schedules/publish` menerima `className` di body dengan aturan cakupan yang sama:
>   admin tanpa `className` = **publikasi seluruh sekolah**, korlas = kelasnya sendiri.
>   Memublikasi semua baris `locked` pada bulan `year`/`month` → status `published`.
>   **Gagal** (`409 drafts_remaining`) bila masih ada baris `draft` di bulan tersebut — semua
>   harus dikunci dulu. Pada operasi sekolah-wide pesannya menyebut **kelas penyebab**,
>   mis. `Masih ada jadwal draft di kelas 2 — kunci semua dahulu sebelum publikasi`.
> - `POST /schedules/:id/unlock` hanya untuk **admin**. Mengembalikan satu baris ke `draft`
>   (menghapus `locked_by`, `locked_at`, `published_by`, `published_at`).
> - `PUT`/`DELETE /schedules/:id` dan `POST /schedules/copy` (overwrite) **menolak** baris
>     
>   dengan status `locked`/`published` → `409 not_editable`.
> - **Kunci & publikasi berbeda dari penulisan jadwal per baris.** `POST /schedules` dan
>     
>   `POST /schedules/copy` tetap mewajibkan admin menyebut kelas (`400 class_required`);
>     
>   hanya `lock`/`publish` yang memperlakukan `className` kosong sebagai "semua kelas".

### 7.6 Category Endpoints

| Method | Path              | Deskripsi       | Role                  |
| ------ | ----------------- | --------------- | --------------------- |
| GET    | `/api/categories` | List kategori   | Admin, Korlas, Parent |
| POST   | `/api/categories` | Tambah kategori | **Admin**             |

### 7.7 Report Endpoints

| Method | Path                               | Deskripsi                                                                               | Role                  |
| ------ | ---------------------------------- | --------------------------------------------------------------------------------------- | --------------------- |
| GET    | `/api/stats/summary`               | Ringkasan: menu hari ini (`menuNames[]` + `classCount`), jumlah menu/orang tua/kategori | Admin                 |
| GET    | `/api/reports/week/:date/pdf`      | Ekspor PDF Sepekan                                                                      | Admin, Korlas, Parent |
| GET    | `/api/reports/month/:month/pdf`    | Ekspor PDF bulanan                                                                      | Admin, Korlas, Parent |
| GET    | `/api/reports/month/:month/excel`  | Ekspor Excel bulanan                                                                    | Admin                 |
| GET    | `/api/reports/stats?month=YYYY-MM` | Statistik menu bulanan                                                                  | Admin                 |

### 7.8 Claim Endpoints (Pilih Jadwal) — ✅ Terimplementasi

| Method | Path                           | Deskripsi                                                | Role               |
| ------ | ------------------------------ | -------------------------------------------------------- | ------------------ |
| POST   | `/api/claims`                  | Ambil satu tanggal (`scheduleId`, `studentId?`, `note?`) | **Parent, Korlas** |
| DELETE | `/api/claims/:id`              | Batalkan — pemiliknya, atau admin/korlas kelas itu       | Auth               |
| GET    | `/api/claims/mine?from=&to=`   | Tanggal yang sudah diambil sendiri                       | Parent, Korlas     |
| GET    | `/api/claims?from=&to=&class=` | Rekap klaim satu kelas                                   | Auth               |

**Kode kegagalan `POST /api/claims`:**

| Kode | Kondisi            | Pesan                                          |
| ---- | ------------------ | ---------------------------------------------- |
| 409  | `already_claimed`  | "Yah, sudah dipilih orang tua lain — {nama}"   |
| 409  | `already_mine`     | Sudah diambil sendiri sebelumnya               |
| 409  | `already_assigned` | Petugasnya sudah ditetapkan korlas             |
| 409  | `not_published`    | Jadwal belum dipublikasi korlas                |
| 409  | `past_date`        | Tanggalnya sudah lewat                         |
| 403  | `forbidden_class`  | Kelasnya bukan kelas anaknya                   |
| 403  | `not_parent`       | Akun tidak punya profil orang tua (mis. admin) |

> **Efek samping yang disengaja:** `POST /api/claims` ikut menulis `schedules.petugas_name` dan
>   
> `petugas_parent_name`; `DELETE /api/claims/:id` mengosongkannya kembali. Dengan begitu endpoint
>   
> jadwal yang sudah ada langsung menampilkan petugas hasil klaim tanpa perubahan apa pun.

---

### 7.9 Piket Endpoints (Penugasan Siswa) — ⚠ TIDAK DIIMPLEMENTASI

> Endpoint di bawah **tidak pernah dibuat** (lihat catatan F7). Petugas piket kini berupa dua kolom
>   
> di `schedules`, diisi lewat `PUT /api/schedules/:id` (korlas) atau otomatis oleh `POST /api/claims`
>   
> (orang tua). Bagian ini dipertahankan sebagai catatan rancangan.

Semua pembacaan menerima query **`?class=`** opsional seperti endpoint jadwal. Penugasan terkait
  
ke baris `schedules` lewat `schedule_id`; korlas hanya boleh mengelola penugasan untuk kelasnya sendiri.

| Method | Path                                | Deskripsi                                                                        | Role                  |
| ------ | ----------------------------------- | -------------------------------------------------------------------------------- | --------------------- |
| GET    | `/api/schedules/:id/piket`          | Daftar siswa piket untuk satu entri jadwal                                       | Admin, Korlas, Parent |
| GET    | `/api/piket/search?q=&from=&to=`    | Cari riwayat piket siswa berdasarkan nama (maks. 400 hari)                       | Admin, Korlas, Parent |
| POST   | `/api/schedules/:id/piket`          | Tetapkan/ubah siswa piket untuk satu entri jadwal (`classLabel` + `studentName`) | Admin, **Korlas**     |
| DELETE | `/api/schedules/:id/piket/:piketId` | Hapus penugasan piket                                                            | Admin, **Korlas**     |

> **Aturan tulis:** korlas hanya boleh mengelola penugasan pada baris `schedules` yang `class_name`
>   
> sama dengan kelasnya. Sistem memuat baris jadwal lebih dulu, lalu memanggil `canWriteClass(user, row.className)`
>   
> — sama seperti `PUT`/`DELETE /schedules/:id`. Admin boleh mengelola penugasan untuk kelas mana pun.

---

## 8. Alur Pengguna (User Flows)

### 8.1 Admin: Input Jadwal Sepekan

1. Login → Dashboard Admin
2. Klik "Atur Jadwal" → Pilih rentang tanggal (Senin–Jumat)
3. Untuk setiap hari → pilih menu dari dropdown (atau buat baru)
4. Simpan → jadwal tersimpan ke SQLite
5. Preview → lihat hasil tampilan Sepekan

### 8.2 Orang Tua: Lihat Jadwal Hari Ini

1. Buka aplikasi → halaman login
2. Masukkan username & password (diberikan admin sekolah)
3. Login berhasil → redirect ke halaman utama "Menu Hari Ini"
4. Card menampilkan: hari, tanggal, makanan utama, buah pendamping
5. Scroll ke bawah → "Minggu Ini" list
6. Bisa lihat "Bulan Ini" dan cari menu
7. Bisa ubah password sendiri di halaman profil

### 8.3 Admin: Duplikasi Jadwal — ✅ Terimplementasi

1. Buka `/jadwal` → klik **"Salin Sepekan"** di kanan atas
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

### 8.6 Admin/Korlas: Kelola Penugasan Piket Siswa

1. Buka `/jadwal` → pilih kelas → klik tanggal tertentu
2. Di samping menu, muncul bagian **"Siswa Piket"** dengan input nama siswa per kelas
3. Masukkan nama siswa (mis. "Shezan" untuk Kelas 1) → simpan
4. Bila ada penugasan sebelumnya, nama lama ditampilkan dan dapat diubah/dihapus
5. Orang tua melihat nama siswa piket di kartu jadwal hari ini/minggu ini/bulanan
6. Cari riwayat piket: "kapan Shezan terakhir piket?" — hasil dikelompokkan per bulan

### 8.7 Orang Tua: Lihat Anak Piket Hari Ini

1. Login → halaman "Hari Ini"
2. Card menampilkan menu + daftar siswa piket per kelas
3. Nama anak yang sedang piket disorot (mis. badge "Anak Anda piket hari ini!")
4. Bisa lihat jadwal piket Sepekan/bulanan untuk mengetahui giliran piket anak ke depan


### 8.8 Admin: Kunci & Publikasi Jadwal Bulanan — ✅ Terimplementasi

1. Buka `/jadwal` → pilih bulan yang akan dipublikasi
2. Susun/edit menu untuk setiap hari (status = `draft`) — tabel jadwal berjalan **per kelas**,
     
   ganti kelas lewat pemilih di header bila perlu
3. Klik tombol **"Kunci bulan (semua kelas)"** → **semua baris `draft` di seluruh kelas (1–6)**
     
   berubah menjadi `locked` dalam satu tindakan
   - Tombol nonaktif bila tidak ada baris `draft` (semua sudah terkunci/dipublikasi)
   - Ringkasan status di kartu bulanan menampilkan angka **lintas kelas** (ditandai "semua kelas")
4. Pastikan tidak ada baris `draft` tersisa. Baris peringatan menyebut **kelas mana** yang masih draft
5. Klik tombol **"Publikasi (semua kelas)"** → semua baris `locked` di semua kelas berubah
     
   menjadi `published`; orang tua kelas 1–6 melihat jadwalnya bersamaan
   - Tombol nonaktif bila masih ada `draft` (di kelas mana pun) atau belum ada `locked`
   - Bila ditolak, pesan `409` menyebut kelas penyebabnya
6. Bila perlu revisi: admin membuka kunci baris tertentu (tombol **🔓**) → status kembali `draft`
     
   → korlas mengedit → kunci ulang → publikasi ulang

> **Korlas** memakai tombol yang sama untuk kelasnya saja (label tanpa "semua kelas"), dan tetap
>   
> tidak bisa menyentuh kelas lain. **Salin Sepekan** tetap **per kelas** — itu memang operasi
>   
> penyusunan jadwal, bukan penerbitan.

> **Penting untuk F9:** tanggal yang ingin direbutkan orang tua harus dibiarkan **kosong petugasnya
>   
> sebelum langkah 5**. Setelah `published`, barisnya tidak bisa diedit lagi.


### 8.9 Orang Tua: Ambil Tanggal Snack — ✅ Terimplementasi

1. Login → menu **"Pilih Jadwal"**
2. Halaman menampilkan bulan berjalan: berapa tanggal yang masih kosong, dan mana yang sudah
     
   diambil sendiri
3. Bila punya lebih dari satu anak di kelas itu, pilih **"atas nama anak"** sekali di atas halaman
4. Klik **"Ambil tanggal ini"** pada kartu hari yang diinginkan — langsung tersimpan, tanpa dialog
     
   konfirmasi
5. **Berhasil:** kartunya disorot, berlabel "Pilihan Anda", dan nama anak + nama orang tua langsung
     
   muncul sebagai petugas di seluruh tampilan jadwal
6. **Keduluan:** muncul modal *"Yah, keduluan!"* dengan nama orang tua yang lebih dulu mengambil,
     
   dan papan jadwalnya langsung disegarkan sehingga terlihat tanggal mana yang masih tersisa
7. Berubah pikiran → **"Batalkan"** selama tanggalnya belum lewat; tanggal itu kembali terbuka
     
   untuk orang tua lain

> Kartu yang berlabel **"Ditetapkan korlas"** tidak bisa diambil — petugasnya sudah ditentukan
>   
> dari daftar piket manual.

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
┌──────────────────────────────────────────┐
│   🍕 Pizza Snack Play                    │
│   Halo, Ibu Sari  [Logout]               │
├──────────────────────────────────────────┤
│  MENU HARI INI                           │
│  Selasa, 1 September 2026               │
│                                          │
│  🍽️ Roti coklat                         │
│  🍊 Jeruk                                │
│                                          │
│  ── Siswa Piket Hari Ini ──              │
│  Kelas 1: Shezan                        │
│  Kelas 2: Uma                           │
│  Kelas 3: Azkayra                       │
│  ⭐ Anak Anda piket hari ini!           │
├──────────────────────────────────────────┤
│  MINGGU INI                              │
│  Senin  ❌ Libur                         │
│  Selasa ✅ Roti coklat + Jeruk           │
│  Rabu   ✅ Tahu isi sayur + Melon        │
│  Kamis  ✅ Pisang panggang + Nanas madu  │
│  Jumat  ✅ Urap jagung + Semangka        │
└──────────────────────────────────────────┘
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
│ Sari     │ sari     │ Aisyah Sari (1)        │Edit|Hps │
│ Budi     │ budi     │ Bagas Budi (1)         │Edit|Hps │
│ Dewi     │ dewi     │ Citra Dewi (2),        │Edit|Hps │
│          │          │ Raka Dewi (3)          │         │
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
- **Role-based access control (RBAC)** — tiga role: `admin` (CRUD penuh), `korlas` (kelola katalog menu/kategori + jadwal **kelasnya sendiri**), dan `parent` (read-only jadwal + ubah password sendiri). Ditegakkan di API lewat `requireRole(...)` → `403`.
- **Pembatasan cakupan kelas** — korlas dan orang tua hanya dapat membaca kelasnya/anaknya; percobaan membaca atau menulis kelas lain dijawab `403`. Untuk `PUT`/`DELETE`, kelas diambil dari **baris database** (bukan dari body) sehingga tidak bisa dipalsukan dari klien. Detail: `src/api/utils/classScope.ts`.
- **Orang tua wajib login** — sebelum login, hanya melihat halaman login. Setelah login, dapat melihat jadwal kelas anaknya.
- **Admin mengelola akun orang tua & mengangkat korlas** — admin membuat, edit, dan nonaktifkan akun orang tua, sekaligus menetapkan role `korlas` beserta kelasnya. Tidak ada registrasi mandiri.
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

| Script        | Perintah                                            | Fungsi                                     |
| ------------- | --------------------------------------------------- | ------------------------------------------ |
| `dev`         | `vite`                                              | Dev server dengan HMR                      |
| `build`       | `tsc -b && vite build`                              | Build produksi (frontend + worker)         |
| `preview`     | `vite preview`                                      | Preview hasil build secara lokal           |
| `deploy`      | `bun run build && wrangler deploy --env production` | Deploy ke Cloudflare Workers               |
| `check`       | `tsc && vite build && wrangler deploy --dry-run`    | Validasi penuh sebelum deploy              |
| `lint`        | `eslint .`                                          | Cek kualitas kode                          |
| `cf-typegen`  | `wrangler types`                                    | Generate tipe dari binding `wrangler.json` |
| `db:generate` | `drizzle-kit generate`                              | Generate file migrasi dari schema          |
| `db:migrate`  | `drizzle-kit migrate`                               | Terapkan migrasi ke D1                     |
| `db:push`     | `drizzle-kit push`                                  | Push schema langsung (dev)                 |
| `db:studio`   | `drizzle-kit studio`                                | GUI untuk inspeksi database                |

### 11.4 Secrets Produksi

```bash
bunx wrangler secret put JWT_SECRET
```

---

## 12. Fase Pengembangan (Roadmap)

### Phase 1: MVP (Core) — ✅ SELESAI

- [x] Scaffold project dari `bhvr-template` (Bun + Hono + Vite + React + D1)
- [x] Skema database di `src/database/schema.ts` (11 tabel saat MVP; **12** sejak v1.4 setelah `students` dipisah dari `parents`; **13** sejak v1.5 setelah `piket_assignments` ditambahkan)
- [x] File migrasi Drizzle ter-generate (`drizzle/migrations/0000_*.sql`) & diterapkan ke D1 lokal
- [x] Health check endpoint `GET /api/health`
- [x] Seed data dari file jadwal Agustus & September 2026 (`scripts/seed.ts`) — 10 minggu, 42 menu, 84 menu item, **129 jadwal** (43 tanggal × 3 kelas), 4 akun (1 admin, 1 korlas, 2 orang tua), 4 anak
- [ ] Seed data piket dari `output_jadwal_piket.txt` — 5 minggu (September), 22 hari, 87 penugasan, 38 siswa unik (kelas 3–5 per hari)
- [x] Autentikasi login (admin + orang tua) dengan JWT (`hono/jwt`, HS256)
- [x] Password hashing PBKDF2-SHA256 via Web Crypto (edge-native)
- [x] Endpoint auth: `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `PUT /auth/password`
- [x] Middleware `requireAuth` + RBAC `requireRole('admin' | 'korlas' | 'parent')`
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
- [x] Duplikasi jadwal Sepekan (`POST /schedules/copy` + dialog di `/jadwal`)
- [x] Pencarian riwayat menu ("kapan jeruk disajikan?") — `GET /schedules/search` + halaman `/pencarian`
- [x] Satu orang tua boleh punya **lebih dari satu anak** — tabel `students` + migrasi berpindah data (`0001_*.sql`)
- [x] RBAC digerbangi juga di UI — orang tua tidak melihat tombol CRUD menu/kategori/jadwal/orang tua
- [ ] Bulk import akun orang tua (CSV/Excel)

### Phase 3: Jadwal Per Kelas & Role Korlas — ✅ SELESAI

- [x] Jadwal disimpan **per kelas** — `schedules.class_name` + indeks unik gabungan `UNIQUE(schedule_date, class_name)`
- [x] Migrasi data lama `0002_*.sql` — baris global direplikasi ke setiap kelas (43 → 129 baris, 3 kelas)
- [x] Endpoint `GET /classes` — daftar kelas yang sudah dipersempit sesuai peran + kelas default
- [x] Pemilih kelas di header (`ClassSwitcher`), tersimpan di `localStorage`, muncul hanya bila > 1 kelas
- [x] Role baru **`korlas`** (`users.role`) + kolom `users.class_name`, ikut sebagai claim JWT
- [x] Cakupan baca/tulis kelas (`classScope.ts`) — `?class=` pada semua pembacaan, `403` di luar cakupan
- [x] Guard tingkat baris (`canWriteClass`) untuk `PUT`/`DELETE` agar kelas tidak bisa dibajak dari body
- [x] Korlas boleh kelola katalog menu & kategori (`requireRole("admin","korlas")`)
- [x] Hari libur tetap **global** — hanya admin yang boleh mengubah
- [x] Pengangkatan korlas lewat `PUT /parents/:id` (`role` + `className`) + form di `/orang-tua`
- [x] Ringkasan statistik harian menampilkan `menuNames[]` lintas kelas + `classCount`
- [x] Seed & test disesuaikan — `budi` jadi korlas 1; test API 211 (termasuk section 18–19 untuk cakupan kelas & wewenang korlas)

### Phase 4: Penugasan Piket Siswa

- [ ] Tabel baru `piket_assignments` — `schedule_id` (FK), `class_label`, `student_name`, `UNIQUE(schedule_id, class_label)`
- [ ] Migrasi `0004_*.sql` — membuat tabel `piket_assignments` + index
- [ ] Seed data piket dari `output_jadwal_piket.txt` — parse "Kelas N: <nama>" → 87 penugasan, 38 siswa
- [ ] Backend: `GET /schedules/:id/piket`, `POST /schedules/:id/piket`, `DELETE /schedules/:id/piket/:piketId`
- [ ] Backend: `GET /piket/search?q=` — cari riwayat piket siswa berdasarkan nama
- [ ] Frontend: bagian "Siswa Piket" di kartu jadwal (hari ini, minggu ini, bulanan)
- [ ] Frontend: form kelola piket di halaman `/jadwal` (admin & korlas)
- [ ] Frontend: sorot nama anak orang tua bila sedang piket
- [ ] Pemetaan label kelas "Kelas 1"–"Kelas 5" ↔ `class_name` saat impor/seed
- [ ] Test: piket CRUD + pencarian + RBAC (korlas hanya kelasnya)

### Phase 4b: Kunci & Publikasi Jadwal — ✅ SELESAI

- [x] Kolom baru di `schedules`: `status`, `locked_by`, `locked_at`, `published_by`, `published_at`
- [x] Migrasi `0003_schedule_lock_publish.sql` — `ALTER TABLE` + `UPDATE` existing rows ke `published`
- [x] Repository: `lockDraftSchedulesBetween`, `publishLockedSchedulesForMonth`, `countSchedulesByStatusForMonth`, `unlockSchedule` + `statusFilter` di `findSchedulesBetween`
- [x] Service: `lockSchedules`, `publishMonth`, `unlock` + perlindungan tulis (`not_editable`) + filter `published` untuk orang tua
- [x] Endpoint: `POST /schedules/lock`, `POST /schedules/publish`, `POST /schedules/:id/unlock`
- [x] Frontend: tombol "Kunci bulan" + "Publikasi" + badge status + tombol unlock (admin) + kontrol edit dinonaktifkan untuk `locked`/`published`
- [x] API client: `api.schedules.lock()`, `api.schedules.publish()`, `api.schedules.unlock()`
- [x] Test: lock + publish + unlock + filter orang tua + `not_editable`

#### Phase 4b-2: Kunci & Publikasi Sekolah-Wide (v1.8) — ✅ SELESAI

- [x] `className` boleh dikosongkan pada `lockDraftSchedulesBetween`, `publishLockedSchedulesForMonth`, `countSchedulesByStatusForMonth` (`null` = semua kelas)
- [x] `countSchedulesByStatusPerClassForMonth` — rincian draft per kelas untuk pesan 409
- [x] `resolveBulkClass` di controller: admin tanpa `className` = semua kelas (berbeda dari `resolveWriteClass` yang tetap mewajibkan kelas)
- [x] DTO `LockScheduleResultDto`/`PublishScheduleResultDto` membawa `classes` + `lockedCount`; `className` menjadi nullable
- [x] UI `/jadwal`: penghitung status lintas kelas + label "semua kelas" + pesan peringatan menyebut kelas yang masih draft
- [x] Test: korlas tetap per kelas (`403` untuk kelas lain), admin mengunci/mempublikasi semua kelas, 409 menyebut kelas penyebab

### Phase 4c: Pilih Jadwal (Rebutan Tanggal) — ✅ SELESAI

- [x] Tabel `schedule_claims` + migrasi `0005_schedule_claims.sql` dengan `UNIQUE(schedule_id)`
- [x] Repository/Service/Controller/Route modul `claims` — termasuk penangkapan `UNIQUE constraint failed` sebagai `already_claimed`
- [x] Klaim menulis balik `petugas_name`/`petugas_parent_name`; pembatalan mengosongkannya
- [x] `already_assigned` — tanggal yang petugasnya sudah ditetapkan korlas tidak ikut direbutkan
- [x] `ScheduleDayDto.claim` + `AuthUser.parentId` agar UI mengenali klaim miliknya sendiri
- [x] Halaman `/pilih-jadwal` + modal "Yah, keduluan!" + badge "Pilihan Anda" / "Ditetapkan korlas"
- [x] Test: 25 skenario termasuk race 5 permintaan serentak

### Phase 4d: PWA — ✅ SELESAI

- [x] `manifest.json` + ikon 192/512 + service worker (`public/sw.js`)
- [x] Banner pasang + petunjuk manual iOS + banner "Versi baru tersedia"
- [x] Penangkap `beforeinstallprompt` di `<head>` agar event tidak hilang sebelum React mount

### Phase 5: Ekspor & Cetak

- [ ] Ekspor PDF jadwal Sepekan/bulanan (termasuk daftar siswa piket)
- [ ] Ekspor Excel
- [ ] Cetak langsung dari browser

### Phase 6: Notifikasi (Opsional)

- [ ] Push notification (PWA)
- [ ] Pengingat piket H-1 untuk siswa/orang tua
- [ ] WhatsApp broadcast (opsional, integrasi pihak ketiga)

---


## 13. Acceptance Criteria

| ID    | Kriteria                                                                                                               | Status                                                                                                                                                                                                       |
| ----- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AC1   | Admin dapat input jadwal snack untuk satu minggu (5 hari kerja) dalam < 2 menit                                        | ✅ Done — dropdown menu per hari di `/jadwal`                                                                                                                                                                 |
| AC2   | Orang tua dapat login dengan username & password yang diberikan admin                                                  | ✅ Done — API + halaman login                                                                                                                                                                                 |
| AC3   | Orang tua yang belum login TIDAK dapat melihat jadwal — hanya melihat halaman login                                    | ✅ Done — halaman `/login` + guard route; endpoint 401 tanpa token                                                                                                                                            |
| AC4   | Admin dapat membuat, edit, dan menonaktifkan akun orang tua                                                            | ✅ Done — `/orang-tua` + API `/parents`                                                                                                                                                                       |
| AC5   | Orang tua dapat mengubah password sendiri dari halaman profil                                                          | ✅ Done — `/profil` + `PUT /auth/password`                                                                                                                                                                    |
| AC6   | Sistem dapat menyimpan jadwal untuk minimal 12 bulan ke depan                                                          | ✅ Done — tanpa batas periode; query rentang maks 92 hari                                                                                                                                                     |
| AC7   | Pencarian menu "jeruk" menampilkan semua tanggal di mana jeruk disajikan                                               | ✅ Done — `/pencarian` + `GET /schedules/search` (cocokkan nama menu *dan* komponen, dikelompokkan per bulan)                                                                                                 |
| AC8   | Ekspor PDF bulanan menampilkan semua jadwal dalam format yang dapat dicetak                                            | Pending — Phase 3                                                                                                                                                                                            |
| AC9   | Data seed dari file jadwal Agustus & September 2026 terinput dengan benar                                              | ✅ Done — 10 minggu, 42 menu, 84 menu item, **258 jadwal** (~42 tanggal × 6 kelas: 1–6), 22 tanggal dengan petugas (Kelas 1–5), 39 akun (1 admin, 1 korlas, 37 orang tua), 4 anak                             |
| AC10  | Schema berhasil dimigrasi ke Cloudflare D1 tanpa error                                                                 | ✅ Done (D1 lokal) — **13 tabel**: 12 dasar + `schedule_claims`. `piket_assignments` tidak dibuat, digantikan kolom `petugas_*` di `schedules`                                                                |
| AC11  | Aplikasi berhasil di-build dan di-deploy ke Cloudflare Workers (`bun run deploy`)                                      | Sebagian — build OK, deploy butuh kredensial                                                                                                                                                                 |
| AC12  | `bun run dev` menjalankan dev server lokal tanpa error                                                                 | ✅ Done                                                                                                                                                                                                       |
| AC13  | Autentikasi JWT menolak akses tanpa token / token invalid dengan 401                                                   | ✅ Done — terverifikasi 244 test (33 auth + 211 API)                                                                                                                                                          |
| AC14  | Password tersimpan sebagai hash PBKDF2, bukan plain text                                                               | ✅ Done                                                                                                                                                                                                       |
| AC15  | Orang tua TIDAK dapat mengakses endpoint admin (403)                                                                   | ✅ Done — `requireRole('admin')`, diuji di 17 operasi tulis + 2 bukti data tidak berubah                                                                                                                      |
| AC16  | Orang tua TIDAK melihat menu admin di navigasi maupun halaman admin                                                    | ✅ Done — navigasi sadar-kapabilitas (`need`) + pembatas `RoleGate` + gerbang `canManage*` pada halaman menu/kategori/jadwal/orang-tua                                                                        |
| AC17  | Admin dapat menyalin jadwal satu minggu ke minggu lain tanpa menimpa hari yang sudah terisi                            | ✅ Done — `POST /schedules/copy` + dialog "Salin Sepekan" di `/jadwal`                                                                                                                                        |
| AC18  | Pencarian aman dari wildcard SQL — `%` dan `_` diperlakukan literal                                                    | ✅ Done — `escapeLike()` di `utils/sql.ts`, diuji di 2 skenario                                                                                                                                               |
| AC19  | Satu akun orang tua dapat memiliki **lebih dari satu anak**                                                            | ✅ Done — tabel `students` (relasi 1 ── n); `dewi` di-seed dengan 2 anak; diuji di `test-auth` (section 5b) & `test-api` (section 15)                                                                         |
| AC20  | Admin dapat menambah/menghapus anak pada satu akun tanpa membuat akun baru                                             | ✅ Done — bagian "Anak — boleh lebih dari satu" di formulir `/orang-tua`; `students[]` pada `POST`/`PUT /parents`                                                                                             |
| AC21  | Orang tua tidak melihat tombol tambah/ubah/hapus pada halaman menu & kategori                                          | ✅ Done — gerbang `canManageCatalog` dari `useAuth()`; tombol Edit/Hapus tidak dirender untuk `parent`                                                                                                        |
| AC22  | Jadwal dapat disimpan **terpisah per kelas** pada tanggal yang sama                                                    | ✅ Done — `schedules.class_name` + `UNIQUE(schedule_date, class_name)`; diuji di `test-api` section 13 (tanggal sama + kelas berbeda → 201)                                                                   |
| AC23  | Data jadwal lama tidak hilang saat migrasi ke model per kelas                                                          | ✅ Done — migrasi `0002_*.sql` mereplikasi baris global ke tiap kelas: 43 → **129 baris**, 0 baris yatim (fallback kelas `'Umum'` bila belum ada kelas)                                                       |
| AC24  | Korlas dapat mengubah jadwal **kelasnya sendiri**                                                                      | ✅ Done — `resolveWriteClass` + guard baris `canWriteClass`; `budi` (korlas 1) berhasil create/update/copy kelas 1; diuji di `test-api` section 19                                                            |
| AC25  | Korlas **tidak dapat** menyentuh jadwal kelas lain (baca maupun tulis)                                                 | ✅ Done — `403 forbidden_class` / `Kelas ini bukan cakupan Anda`; diuji untuk read, create, update, delete, dan copy kelas lain (baris korban diverifikasi tidak berubah)                                     |
| AC26  | Korlas dapat mengelola katalog menu & kategori                                                                         | ✅ Done — `requireRole("admin","korlas")` di `/menus` & `/categories`; diuji di `test-api` section 19                                                                                                         |
| AC27  | Korlas **tidak** dapat mengubah hari libur, akun orang tua, atau statistik                                             | ✅ Done — `requireRole("admin")` tetap di `/holidays`, `/parents`, `/stats`; diuji `403` di section 19                                                                                                        |
| AC28  | Pengguna dengan akses > 1 kelas dapat berpindah kelas dari UI, dan pilihannya bertahan                                 | ✅ Done — `ClassSwitcher` di header (`GET /classes`), tersimpan di `localStorage.psp_class`; muncul hanya bila `classes.length > 1`; diverifikasi di browser (admin: 1–6, `dewi`: 2/3, `sari`: tanpa pemilih) |
| AC29  | Admin/korlas dapat menetapkan siswa piket per kelas per hari                                                           | ✅ Done — bukan lewat `piket_assignments`, melainkan kolom `petugas_name`/`petugas_parent_name` di `schedules`                                                                                                |
| AC30  | Orang tua dapat melihat nama siswa piket di kartu jadwal harian/Sepekan/bulanan                                        | ✅ Done — blok petugas di `ScheduleDayCard`                                                                                                                                                                   |
| AC31  | Pencarian riwayat piket siswa berfungsi ("kapan Shezan terakhir piket?")                                               | Pending — belum ada endpoint pencarian petugas                                                                                                                                                               |
| AC32  | Data piket dari `output_jadwal_piket.txt` ter-seed dengan benar                                                        | ✅ Done — 22 tanggal bertugas (September 2026, Kelas 1–5)                                                                                                                                                     |
| AC33  | Nama anak orang tua disorot bila sedang piket hari itu                                                                 | Pending — kartu menampilkan nama, tetapi belum menyorot anak sendiri                                                                                                                                         |
| AC34  | Admin dapat mengunci jadwal draft bulan ini untuk **semua kelas sekaligus** (`draft` → `locked`)                       | ✅ Done — `POST /schedules/lock` tanpa `className` + tombol "Kunci bulan (semua kelas)" di `/jadwal`; korlas tetap per kelas                                                                                  |
| AC35  | Admin dapat memublikasi jadwal yang sudah terkunci penuh satu bulan untuk **seluruh sekolah** (`locked` → `published`) | ✅ Done — `POST /schedules/publish` tanpa `className` + tombol "Publikasi (semua kelas)" di `/jadwal`                                                                                                         |
| AC36  | Publikasi ditolak bila masih ada baris `draft` di bulan tersebut, dengan menyebut kelas penyebabnya                    | ✅ Done — `409 drafts_remaining` berserta daftar kelas; tombol dinonaktifkan bila `draftCount > 0`                                                                                                            |
| AC37  | Orang tua hanya melihat jadwal `published`; baris `draft`/`locked` tidak muncul                                        | ✅ Done — filter `statusFilter = ["published"]` di repository untuk role `parent`                                                                                                                             |
| AC38  | Baris `locked`/`published` tidak dapat diedit, dihapus, atau ditimpa (copy)                                            | ✅ Done — `409 not_editable` di service; kontrol edit dinonaktifkan di UI                                                                                                                                     |
| AC39  | Admin dapat membuka kunci (unlock) baris individual kembali ke `draft`                                                 | ✅ Done — `POST /schedules/:id/unlock` (admin only) + tombol 🔓 di `/jadwal`                                                                                                                                  |
| AC40  | Orang tua dapat mengambil tanggal snack yang masih kosong                                                              | ✅ Done — `POST /claims` + halaman `/pilih-jadwal`                                                                                                                                                            |
| AC41  | **Dua orang tua tidak pernah bisa mendapat tanggal yang sama**, meski menekan tombol bersamaan                         | ✅ Done — `UNIQUE(schedule_id)` di `schedule_claims`; diuji dengan 5 permintaan serentak → tepat 1 berhasil, 4 dijawab `409`                                                                                  |
| AC41b | Rebutan berjalan **per kelas**: klaim orang tua kelas 1 tidak menghalangi orang tua kelas 2 pada tanggal yang sama     | ✅ Done — `UNIQUE(schedule_id)` menunjuk baris (tanggal × kelas); diuji di `test-claim-cross-class.mjs` → kelas 1 ditolak `409`, kelas 2 berhasil                                                             |
| AC42  | Yang kalah cepat melihat pesan jelas beserta nama orang tua yang lebih dulu                                            | ✅ Done — modal "Yah, keduluan!" + pesan `Yah, sudah dipilih orang tua lain — {nama}`                                                                                                                         |
| AC43  | Klaim mengisi kolom petugas, pembatalan mengosongkannya kembali                                                        | ✅ Done — satu sumber kebenaran; diverifikasi di tes klaim                                                                                                                                                    |
| AC44  | Tanggal yang petugasnya sudah ditetapkan korlas tidak bisa direbut                                                     | ✅ Done — `409 already_assigned` + badge "Ditetapkan korlas"                                                                                                                                                  |
| AC45  | Orang tua tidak bisa mengambil tanggal di kelas yang bukan kelas anaknya                                               | ✅ Done — `403 forbidden_class`                                                                                                                                                                               |
| AC46  | Pembatalan hanya oleh pemiliknya, admin, atau korlas kelas itu                                                         | ✅ Done — `403 not_owner` untuk orang lain                                                                                                                                                                    |
| AC47  | Aplikasi dapat dipasang ke layar utama (PWA)                                                                           | ✅ Done — manifest + service worker + banner Pasang; `beforeinstallprompt` ditangkap di `<head>` agar tidak hilang sebelum React mount                                                                        |

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
- Setiap hari kerja memiliki **1–5 kelas yang piket**, masing-masing dengan satu siswa bertugas.
- Data sumber utama: `data/output_jadwal_piket.txt` (September 2026 — menu + penugasan siswa).
- Data sumber arsip: `data/jadwal_piket_snack.txt` (Agustus & September 2026 — menu saja, tanpa penugasan).
- Label kelas pada file sumber ("Kelas 1"–"Kelas 5") perlu dipetakan ke `class_name` di database (mis. "1A", "1B", "2A") saat impor/seed.

---


## 15. Glossary

| Istilah                  | Definisi                                                                                                                                                                                                                                                                                            |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Piket Snack              | Tugas harian menyediakan snack untuk siswa                                                                                                                                                                                                                                                          |
| **Piket (Penugasan)**    | Penugasan siswa per kelas per hari untuk membawa/menyiapkan snack. Disimpan sebagai kolom `petugas_name` + `petugas_parent_name` di `schedules` — **bukan** tabel `piket_assignments`, yang tidak pernah dibuat. Satu petugas per kelas per hari                                                    |
| **Klaim (Pilih Jadwal)** | Pengambilan satu tanggal oleh seorang orang tua lewat `schedule_claims`. Siapa cepat dia dapat; `UNIQUE(schedule_id)` menjamin satu **baris (tanggal × kelas)** hanya untuk satu orang tua — jadi rebutan berjalan per kelas, bukan per tanggal sekolah. Klaim ikut mengisi kolom petugas. Lihat F9 |
| Makanan Utama            | Item makanan utama (mis. "Roti coklat", "Risol ayam")                                                                                                                                                                                                                                               |
| Buah Pendamping          | Buah segar/olahan buah yang menyertai makanan utama                                                                                                                                                                                                                                                 |
| **Kelas**                | Kelompok siswa (mis. `1`, `2`, `3`). Bukan tabel tersendiri — diturunkan dari `students.class_name`, `users.class_name` (korlas), dan `schedules.class_name`                                                                                                                                        |
| **Korlas**               | Koordinator Kelas — role `korlas`; boleh mengelola katalog menu/kategori (sekolah-wide) + jadwal **kelasnya sendiri**, ditautkan ke satu kelas lewat `users.class_name`                                                                                                                             |
| **Cakupan kelas**        | Batas kelas yang boleh dibaca/ditulis seorang user, dihitung di `src/api/utils/classScope.ts`. Admin = semua kelas; korlas = kelasnya; orang tua = kelas anak-anaknya. Di luar cakupan → `403`                                                                                                      |
| **Pemilih kelas**        | `ClassSwitcher` di header — memilih kelas aktif bila user punya akses ke lebih dari satu kelas; pilihan disimpan di `localStorage.psp_class`                                                                                                                                                        |
| **Hari libur global**    | Hari libur sekolah (`holidays`) yang berlaku untuk **semua** kelas dan hanya boleh diubah admin. Berbeda dari "libur kelas" yang ditandai korlas pada catatan jadwal kelasnya                                                                                                                       |
| **Status jadwal**        | Status baris `schedules`: `draft` (editable) → `locked` (dikunci korlas, tidak dapat diedit) → `published` (dipublikasi ke orang tua). Orang tua hanya melihat `published`. Lihat F8                                                                                                                |
| **Kunci (lock)**         | Operasi admin mengunci semua jadwal `draft` pada suatu rentang → `locked`, **untuk semua kelas sekaligus** bila `className` dikosongkan; korlas hanya kelasnya. Pencatat `locked_by` + `locked_at`                                                                                                  |
| **Publikasi (publish)**  | Operasi admin memublikasi semua jadwal `locked` untuk satu bulan → `published`, **untuk seluruh sekolah** bila `className` dikosongkan. Syarat: tidak ada `draft` tersisa (pesan 409 menyebut kelas penyebabnya). Orang tua langsung melihat jadwal setelah publikasi                               |
| **Buka kunci (unlock)**  | Operasi **admin** mengembalikan satu baris `locked`/`published` ke `draft`. Berguna bila perlu revisi setelah jadwal dikunci                                                                                                                                                                        |
| **Stack BHVR**           | **B**un + **H**ono + **V**ite + **R**eact — stack dari template `bhvr-template`                                                                                                                                                                                                                     |
| Bun                      | Runtime & package manager JavaScript/TypeScript (untuk tooling, bukan runtime server)                                                                                                                                                                                                               |
| Hono                     | Web framework ultrafast yang berjalan di Cloudflare Workers                                                                                                                                                                                                                                         |
| Vite                     | Build tool & dev server dengan HMR instan                                                                                                                                                                                                                                                           |
| React                    | Library UI (versi 19) untuk frontend                                                                                                                                                                                                                                                                |
| TanStack Router          | Library routing client-side (v7) — file-based di `src/routes/`, route tree auto-generate                                                                                                                                                                                                            |
| TanStack Query           | Library data fetching & caching untuk React                                                                                                                                                                                                                                                         |
| Tailwind CSS             | Utility-first CSS framework (v4)                                                                                                                                                                                                                                                                    |
| Cloudflare Workers       | Serverless edge runtime tempat backend berjalan                                                                                                                                                                                                                                                     |
| Cloudflare D1            | Database SQLite serverless milik Cloudflare                                                                                                                                                                                                                                                         |
| Drizzle ORM              | Type-safe ORM untuk TypeScript, bekerja dengan D1/SQLite                                                                                                                                                                                                                                            |
| Wrangler                 | CLI Cloudflare untuk dev, migrasi, dan deploy Worker                                                                                                                                                                                                                                                |
| N-Layered                | Pola arsitektur backend: Route → Controller → Service → Repository                                                                                                                                                                                                                                  |
| JWT                      | JSON Web Token — standar untuk autentikasi stateless                                                                                                                                                                                                                                                |
| RBAC                     | Role-Based Access Control — pembagian hak akses berdasarkan peran                                                                                                                                                                                                                                   |
| Orang Tua / Parent       | Role user dengan akses read-only ke jadwal setelah login                                                                                                                                                                                                                                            |
| Anak / Student           | Data anak milik seorang orang tua (nama + kelas). Satu orang tua boleh punya lebih dari satu — tabel `students`                                                                                                                                                                                     |
| Admin / Guru Piket       | Role user dengan akses CRUD penuh + kelola akun orang tua                                                                                                                                                                                                                                           |

---

*Dokumen ini akan diperbarui seiring perkembangan produk.*
