# Product Requirements Document (PRD)


## Aplikasi "Pizza Snack Play"

---

| Field               | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Nama Produk**     | Pizza Snack Play                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Versi Dokumen**   | 1.14                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Tanggal**         | 1 Oktober 2026                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
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
| **Perubahan v1.11**  | **Aksi massal lewat checkbox di modul jadwal (F8) + pembersihan halaman `/jadwal`.** Kunci/publikasi/buka kunci tidak lagi harus satu baris satu klik — ada **dua jalur aksi massal**. **(a) Per hari:** kotak centang di setiap baris tabel jadwal, ditambah "Pilih minggu ini" pada header tiap minggu dan "Pilih semua" di toolbar; bilah aksi muncul di bawah layar dan **hanya menghidupkan tombol yang cocok dengan status baris terpilih** (Kunci untuk `draft`, Publikasi untuk `locked`, Buka kunci untuk `locked`/`published`). Endpoint baru `POST /schedules/bulk/{lock,publish,unlock}` berisi `{ ids }`. Berbeda dari aksi berbasis rentang, baris yang statusnya tidak cocok **dilewati** dan dilaporkan (`changed`/`skipped`/`ignored`) alih-alih menggagalkan seluruh permintaan dengan `409` — sebab pemilihannya eksplisit per baris. Buka kunci massal tetap **khusus admin**; korlas hanya baris kelasnya (sisanya `ignored`). **(b) Per kelas:** kotak centang di kartu *Status per kelas*; `POST /schedules/lock` & `POST /schedules/publish` menerima `classNames` (daftar kelas) sehingga satu/beberapa kelas dapat terbit tanpa menunggu kelas lain yang jadwalnya belum siap. `className` lama tetap didukung dan `classNames` menang bila keduanya dikirim. `LockScheduleResultDto`/`PublishScheduleResultDto` kini membawa `classNames` (sebelumnya `className`). **Refactor:** kalimat banner pindah ke `src/components/jadwal/messages.ts`, logika pemilihan ke `selection.ts`, bilah aksi ke `BulkActionBar.tsx`, dan primitif `Checkbox` (dengan keadaan *indeterminate*) ditambahkan ke `src/components/ui.tsx`. Uji baru: section 23 `scripts/test-api.mjs` (19 assertion) — total suite 328 assertion hijau |
| **Perubahan v1.12**  | **Impor jadwal dari teks tempelan (F11).** Sekolah mengirim jadwal sebagai teks biasa (`1 - 2 Oktober 2026`, lalu baris `Kamis : Puding Roti + jeruk`). Endpoint baru `POST /schedules/import` (`{ text, classNames?, dryRun? }`) membacanya dari dalam aplikasi — menggantikan alur skrip Python + `wrangler d1 execute` yang dipakai untuk patch Oktober 2026. Parser murni di `src/api/schedules/importParser.ts` (tanpa DB, tanpa jam, tanpa throw) mencocokkan tiap label hari dengan tanggal aslinya; bila blok sepekan penuh dilabeli keliru, rentangnya **digeser** ke Senin–Jumat minggu itu dan pemakai diberi peringatan (kasus nyata: `14 - 18 Oktober 2026` ditulis Senin–Jumat padahal 14 Oktober 2026 hari Rabu). Impor **idempoten**: pasangan `(tanggal, kelas)` yang sudah ada dilewati, bukan ditimpa, sehingga jadwal `locked`/`published` tidak pernah berubah karena tempelan; baris baru selalu `draft`. Menu dikenali dari pasangan utama+buah (bukan nama persis), sehingga beda huruf besar/kecil tidak melahirkan menu kembar. `dryRun` mengembalikan pratinjau tanpa menulis apa pun — dialog `/jadwal` menampilkan pratinjau lebih dulu (mitigasi risiko salah input yang diminta §14). Admin menyasar **semua kelas**, korlas **kelasnya sendiri**. Jejak audit ditulis ke `import_logs` yang selama ini belum terpakai. Uji baru: section 24 `scripts/test-api.mjs` (38 assertion) — total suite 366 assertion hijau |
| **Perubahan v1.13**  | **Laporan jadwal (F12) + satu pengecualian pada jadwal terbit.** **(a) Fitur Laporan Jadwal:** `GET /api/laporan?from=&to=&class=` menjawab pertanyaan rapat koordinasi "beban piket sudah merata belum?" — rekap **berapa kali setiap orang tua mengambil jadwal piket** beserta rincian tanggal/menu/anak, ringkasan (total ambil, orang tua aktif, tanggal terisi, rata-rata ambil), dan **daftar orang tua yang belum pernah ambil**. Sumbernya tabel `schedule_claims` yang sama dengan F9, jadi angkanya tidak pernah berbeda dari yang dilihat orang tua. Daftar "belum ambil" **tidak bisa diturunkan dari tabel klaim** — justru ketiadaan barisnya yang bermakna — karena itu dihitung dari `students`. Modul baru `src/api/laporan/` (repository → service → controller → route). Cakupan: **admin** tanpa `class` melihat seluruh sekolah, dengan `class` melihat satu kelas; **korlas selalu terbatas kelasnya sendiri** (kelas lain → `403`) karena laporan memuat nama orang tua sekaligus kebiasaannya mengambil piket; **orang tua → `403`**. Rentang maksimum **92 hari** agar tidak ada query tanpa batas. **(b) Pengecualian petugas pada baris terbit:** `locked`/`published` tetap tidak dapat diubah, **kecuali `petugasStudentId` sendirian** — piket sering baru terisi setelah jadwal terbit, dan memaksa admin membuka kunci hanya untuk mengisi nama petugas terbukti mengganggu. Patch **campuran** (petugas + menu/catatan/libur dalam satu permintaan) tetap `409 not_editable`, baris `isHoliday=1` juga `409`. Wewenang tidak dilonggarkan: `canWriteClass` tetap berlaku. **(c) Ekspor Excel akun orang tua:** `GET /api/parents/export?active=` (admin only) melengkapi ekspor jadwal yang sudah ada, dipakai untuk rekap akun sekolah. Uji baru: section 25 `scripts/test-api.mjs` (§ laporan) — total suite **495 assertion hijau** (auth 33 · api 396 · status 33 · profile 33) |
| **Perubahan v1.14**  | **Impor akun orang tua dari Excel (F5).** Melengkapi ekspor akun v1.13: berkas hasil `GET /parents/export` kini bisa **disunting di Excel lalu diunggah kembali** lewat `POST /parents/import` (admin only) — satu format untuk dua arah, jadi tidak ada template kedua yang harus dijelaskan ke pengguna. Aturannya: **yang usernamenya sudah ada ditimpa, yang belum ada dibuat sebagai baris baru**. **(a) Pembaca `.xlsx` tanpa dependency** di `src/api/utils/xlsxRead.ts` — ZIP inflate lewat `DecompressionStream("deflate-raw")`, `sharedStrings.xml` + *inline string*, grid dibangun dari referensi sel (`r="C5"`) supaya baris/kolom kosong tidak menggeser data; Worker tidak punya pustaka spreadsheet, dan menambah satu dependency demi satu fitur berarti menambah bobot bundel. **(b) Kolom dicocokkan dari header, bukan posisi** — admin bebas mengurutkan ulang atau menambah kolom; yang wajib hanya *Nama orang tua*, *Username*, *Password*. **(c) Kunci pencocokan = username**, bukan nama orang tua: nama boleh kembar, username tidak (unik di skema). **(d) Sel kosong berarti "jangan sentuh"**, bukan "kosongkan" — berlaku untuk password, aktif, dan anak. Ini bukan detail kosmetik: tanpa aturan itu, mengunggah ulang berkas hasil ekspor akan menghapus password dan daftar anak seluruh akun, sebab sel *Password* pada ekspor memang sengaja kosong (hash tidak pernah keluar server). Id anak dipertahankan lewat pencocokan nama (`mergeStudentIds`), sehingga impor tidak menghapus-lalu-membuat ulang anak yang sebenarnya sama. **(e) Selalu lewat pratinjau** (`dryRun`) berisi ringkasan `{created, updated, skipped, errors[]}` + tabel keputusan per baris; penulisan baru terjadi setelah admin menekan "Terapkan". Baris baru tanpa username/password dilewati dan alasannya dilaporkan per baris (`rows[].reason`). **(f) Body dikirim sebagai JSON base64**, bukan `multipart/form-data`, karena klien memakai `ky` yang memaksa `Content-Type: application/json`. Uji: 34 uji unit (`bun test src/`, termasuk bundar ekspor → baca → tafsir) + `outputs/check-import-akun.mjs` (33 skenario API) + `outputs/check-import-akun-ui.mjs` (17 skenario browser) |
| **Perubahan v1.15**  | **Checkbox pilih-baris + aksi massal di modul akun orang tua (F3b) + pembersihan halaman `/orang-tua`.** Admin tidak lagi harus mengubah satu akun satu klik: tabel akun kini punya **kotak centang per baris** dan **"Pilih semua"** di kepala, serta bilah aksi di bawah layar (`Aktifkan` / `Nonaktifkan` / `Hapus` / `Bersihkan`) yang **hanya menghidupkan tombol yang cocok dengan keadaan akun terpilih** (Aktifkan untuk yang nonaktif, Nonaktifkan untuk yang aktif). Endpoint baru `POST /parents/bulk` (`{ ids, action }`, `action` = `activate` \| `deactivate` \| `delete`) mengikuti jalur aksi massal yang sama dengan jadwal v1.11: baris yang keadaannya sudah cocok **dilewati** (`skipped`), id tak ditemukan `ignored`, dan seluruhnya mengembalikan `200` beserta `{ changed, skipped, ignored }` — bukan `409`. Hapus permanen meminta konfirmasi terpisah karena tidak dapat dibatalkan. `isActive` disimpan di dua tabel (`users` + `parents`) dan kedua sisi seirama. **Refactor:** halaman `/orang-tua` (~800 baris, satu komponen) dipecah menjadi `ParentsContent` (orchestrator) + `ParentTable`, `ParentFormModal`, `ParentBulkBar`, `selection.ts`, dan `form.ts` di `src/components/parents/` — meminjam pola yang sudah mapan di `src/components/jadwal/`. Uji baru: section 25 `scripts/test-api.mjs` (aksi massal akun) |

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
  - ✅ Aksi massal lewat checkbox (`POST /schedules/bulk/lock` & `/schedules/bulk/publish`) —
    **hanya baris kelasnya**; baris kelas lain yang ikut terkirim dihitung `ignored` dan tidak
    berubah. Bilah aksi per hari tidak menyediakan tombol buka kunci untuk korlas.
  - ✅ Menandai satu hari sebagai "libur kelas" lewat catatan jadwal kelasnya.
  - ✅ Mengambil tanggal piket yang kosong (`/claims`) karena ia tetap orang tua murid.
  - ❌ Membuka kunci jadwal (`POST /schedules/:id/unlock` maupun `POST /schedules/bulk/unlock`) → `403`. Buka kunci adalah wewenang admin; korlas mengunci & mempublikasi jadwal kelasnya sendiri.
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
- **Jadwal per kelas** — setiap kelas memiliki baris jadwalnya sendiri; tanggal yang sama boleh punya menu berbeda antar kelas (`UNIQUE(schedule_date, class_name)`).
- **Penandaan libur kelas** — korlas dapat menandai satu hari sebagai libur lewat catatan jadwal kelasnya; **hari libur sekolah** tetap global dan hanya admin yang boleh mengubahnya.
- **Batas korlas** — korlas menyunting hanya kelas yang dikoordinasinya, dan hanya selama
  barisnya masih `draft`. Tombol **Kunci bulan** tidak muncul untuknya karena mengunci jadwal
  adalah wewenang admin; yang ia pegang adalah tombol **Publikasi**.

### F3: Tampilan Jadwal (User — Wajib Login)

- **Jadwal hari ini** — card menampilkan menu hari ini (makanan + buah). Hanya tampil setelah login.
- **Jadwal minggu ini** — list Senin–Jumat dengan menu masing-masing. Hanya tampil setelah login.
- **Jadwal bulanan** — kalender/komponen grid menampilkan semua hari di bulan tsb. Hanya tampil setelah login.
- **Pencarian menu** — cari berdasarkan nama makanan/buah, lihat kapan disajikan. Hanya tampil setelah login.
- **Terfilter per kelas** — semua halaman di atas menampilkan jadwal kelas yang sedang aktif (kelas sendiri untuk korlas, kelas anak untuk orang tua, kelas terpilih untuk admin).
- **Pemilih kelas (Class Switcher)** — muncul di header hanya bila user punya akses ke lebih dari satu kelas (admin, atau orang tua dengan anak di beberapa kelas); tersimpan di `localStorage` sehingga pilihan tidak hilang saat berpindah halaman.

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

### F5: Ekspor, Impor & Cetak — ✅ SEBAGIAN (Excel terimplementasi, PDF belum)

- **Ekspor PDF** — jadwal Sepekan/bulanan untuk cetak/pengumuman. **Belum dibuat**; yang sudah
  ada adalah `.xlsx`, dan tombolnya berada di halaman jadwal & akun.
- **Ekspor Excel — jadwal** ✅ `GET /api/schedules/export?scope=week|month&date=&class=`
  (admin & korlas). Isi lembar dirakit dari **DTO yang sama** dengan yang dipakai UI, jadi
  hasil unduhan tidak pernah berbeda dari yang tampil di layar. Tanpa kolom Status.
- **Ekspor Excel — akun orang tua** ✅ `GET /api/parents/export?active=` (admin only).
  9 kolom: nama orang tua, **username**, password, peran, kelas yang dikoordinasi, anak,
  aktif, terkunci, login terakhir. Sel **Password sengaja selalu kosong** — hash tidak pernah
  keluar dari server. Dipakai untuk rekap akun sekolah.
- **Impor Excel — akun orang tua** ✅ `POST /api/parents/import` (admin only). Berkas yang
  diunggah **layoutnya persis sama dengan hasil ekspor**, jadi berkas yang sama bisa disunting
  di Excel lalu diunggah kembali — tidak ada format kedua yang harus dijelaskan ke pengguna.
  **Data yang sudah ada ditimpa, yang belum ada dibuat sebagai baris baru.**
  - Kunci pencocokan adalah **username** (unik di skema), bukan nama orang tua: nama boleh
    kembar, username tidak.
  - Kolom dicocokkan **berdasarkan header, bukan posisi** — admin bebas mengurutkan ulang atau
    menambah kolom tanpa merusak impor. Wajib: *Nama orang tua*, *Username*, *Password*.
  - **Sel kosong berarti "jangan sentuh"**, bukan "kosongkan" — berlaku untuk Password, Aktif,
    dan Anak. Tanpa aturan ini, mengunggah ulang berkas hasil ekspor akan menghapus password
    dan daftar anak semua akun.
  - Baris baru tanpa username/password **dilewati** dan dilaporkan alasannya per baris.
  - Selalu ada **pratinjau** (`dryRun`) berisi ringkasan `{created, updated, skipped, errors[]}`
    plus tabel per baris; penulisan sebenarnya baru terjadi setelah admin menekan "Terapkan".
- Berkas ekspor ditulis oleh `src/api/utils/xlsx.ts` dan berkas impor dibaca oleh
  `src/api/utils/xlsxRead.ts` — keduanya **tanpa dependency**, karena `.xlsx` hanyalah ZIP
  berisi XML (lihat catatan teknis di `README.md`).

### F6: Notifikasi (Opsional / Future)

- **Push notification** — pengingat menu hari ini (opsional, phase 2).
- **Broadcast WhatsApp** — integrasi opsional.

### F7: Penugasan Piket Siswa (Admin & Korlas — Per Kelas) — ⚠ DIREVISI, tabelnya tidak jadi dibuat

> **Status implementasi:** dimensi piketnya **terwujud**, tetapi pemodelannya tidak seperti rancangan di bawah. Tabel `piket_assignments` **tidak pernah dibuat**. Sebagai gantinya `schedules` mendapat dua kolom `petugas_name` dan `petugas_parent_name` (migrasi `0003`) — karena satu kelas hanya punya satu petugas per hari, dan baris jadwalnya sudah per-kelas, tabel terpisah tidak memberi apa pun selain satu join tambahan. Label "Kelas 1"–"Kelas 5" dipetakan ke `class_name` saat seed, sehingga `class_label` juga tidak diperlukan.
>
> Sejak **F9**, kolom petugas ini punya dua sumber: diisi korlas dari daftar piket manual, atau diisi otomatis ketika seorang orang tua mengambil tanggal itu.
>
> **Perubahan v1.8 — petugas jadi relasi, bukan teks bebas.** Kolom teks `petugas_name` / `petugas_parent_name` kini **diturunkan** dari dua kolom baru `petugas_student_id` dan `petugas_parent_id` (migrasi `0007`). Akibatnya:
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

> **Catatan pemodelan:** file sumber `output_jadwal_piket.txt` menggunakan label "Kelas 1"–"Kelas 5" yang berbeda dari `schedules.class_name` (mis. "1A", "1B", "2A"). Keduanya disimpan terpisah: `piket_assignments.class_label` mempertahankan label asli file sumber, sedangkan `piket_assignments.schedule_id` mengaitkan ke baris jadwal yang sesuai. Pemetaan antara "Kelas N" dan `class_name` dilakukan saat impor/seed, bukan saat runtime.

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
- **Aksi massal lewat checkbox** (sejak v1.11) — tersedia dua jalur, supaya tidak ada lagi
  pekerjaan "satu baris satu klik":
  - **Per hari** — setiap baris tabel jadwal punya kotak centang (ditambah "Pilih minggu ini"
    di header minggu dan "Pilih semua" di toolbar). Bilah aksi menempel di bawah layar dan
    **hanya menghidupkan tombol yang masuk akal** untuk pilihan saat ini: **Kunci** bila ada
    baris `draft`, **Publikasi** bila ada baris `locked`, **Buka kunci** (admin) bila ada baris
    `locked`/`published`. Dijalankan lewat `POST /schedules/bulk/{lock,publish,unlock}` berisi
    `{ ids }`.
  - **Per kelas** — kartu *Status per kelas* punya kotak centang per kelas, dengan tombol
    "Kunci kelas terpilih" / "Publikasi kelas terpilih". Dikirim sebagai `classNames` pada
    `POST /schedules/lock` & `POST /schedules/publish`.
  - **Perbedaan aturan yang disengaja:** aksi per baris **tidak** memakai `409`. Karena barisnya
    dipilih satu per satu, baris yang statusnya tidak cocok hanya **dilewati** dan dilaporkan
    (`changed` / `skipped` / `ignored`) — memblokir seluruh permintaan hanya karena satu baris
    akan membuat pilihan yang sah ikut gagal. Aturan "draft menahan publikasi" tetap berlaku
    pada aksi **berbasis rentang/kelas** (satu tombol untuk sebulan), karena di sana
    pemakainya tidak menyebut baris satu per satu.
- **Orang tua hanya melihat `published`** — pembacaan jadwal oleh role `parent` difilter otomatis di repository (`WHERE status IN ('published')`); baris `draft`/`locked` tidak muncul. Admin dan korlas melihat semua status.
- **Badge status** — di halaman `/jadwal`, setiap baris hari menampilkan badge status (Draft / Terkunci / Dipublikasi), dan kontrol edit (menu, catatan, libur, hapus) dinonaktifkan untuk baris yang `locked`/`published`.

> **Alur kerja korlas:** susun jadwal (draft) → minta admin mengunci bulan (locked) →
> publikasi (published). Setelah publikasi, orang tua melihat jadwal. Bila perlu revisi,
> admin membuka kunci (unlock) baris tertentu → korlas mengedit → kunci ulang → publikasi ulang.
> **Skala sekolah:** kunci & publikasi dirancang sebagai operasi **satu tombol untuk seluruh
> sekolah**. Menu snack memang sama untuk semua kelas, dan jadwal ditetapkan serentak di
> lapangan — jadi admin tidak perlu mengulang kunci/publikasi enam kali. Sejak v1.11 admin
> juga bisa **mempersempit** operasinya bila memang perlu: centang kelas tertentu di kartu
> status (`classNames`), atau centang hari tertentu di tabel (`/schedules/bulk/*`). Yang tetap
> **per kelas** adalah kepemilikan tanggal: setiap kelas punya baris `schedules` sendiri
> (`UNIQUE(schedule_date, class_name)`), sehingga rebutan tanggal oleh orang tua berjalan
> per kelas (lihat F9).

### F9: Pilih Jadwal (Orang Tua — Siapa Cepat Dia Dapat)

Menjawab kebiasaan yang selama ini berjalan lewat grup WhatsApp: korlas mengumumkan tanggal mana saja yang belum ada petugasnya, lalu orang tua saling mendahului menawarkan diri. Yang paling sering jadi masalah bukan pembagiannya, melainkan **dua orang merasa sama-sama sudah dapat**.

- **Hanya tanggal terbuka** yang bisa diambil: sudah `published`, bukan hari libur, belum lewat, dan `petugas_name` masih kosong. Tanggal yang petugasnya sudah ditetapkan korlas dari daftar piket manual **tidak** ikut diperebutkan.
- **Satu klik langsung mengambil** — tanpa dialog konfirmasi, karena yang diperebutkan justru kecepatan. Pilihan "atas nama anak" ditetapkan sekali di atas halaman dan dipersempit otomatis ke anak yang ada di kelas tersebut.
- **Yang kalah cepat mendapat penolakan yang jelas** — modal "Yah, keduluan!" beserta **nama** orang tua yang lebih dulu mengambilnya, lalu papan jadwalnya langsung disegarkan.
- **Klaim menjadi sumber kebenaran petugas** — mengambil tanggal ikut mengisi `schedules.petugas_name` (nama anak) dan `petugas_parent_name` (nama orang tua); membatalkan mengosongkannya lagi. Jadi tidak ada dua daftar yang bisa berbeda isi.
- **Pembatalan** — oleh pemiliknya sendiri selama tanggalnya belum lewat, atau kapan saja oleh admin dan korlas kelas itu (mis. saat ada pergantian mendadak).
- **Batas kelas tetap berlaku** — orang tua hanya bisa mengambil tanggal di kelas anaknya.
- **Rebutan berjalan per kelas, bukan per tanggal sekolah.** Karena setiap kelas punya baris jadwalnya sendiri, klaim seorang **orang tua kelas 1** hanya menutup tanggal itu **bagi orang tua kelas 1 lain**. Orang tua **kelas 2** (dan kelas lain) tetap bisa mengambil tanggal yang sama pada baris kelasnya — menu memang sama, tetapi yang diperebutkan adalah giliran piket per kelas. Contoh: Bu Sari (kelas 1) mengambil Selasa 1 Sep → Bu Ani (kelas 1) ditolak `409`; Bu Dewi (kelas 2) tetap berhasil mengambil Selasa 1 Sep di kelas 2.
- **Korlas ikut boleh memilih** karena ia tetap orang tua murid. Admin tidak punya profil orang tua, sehingga hanya bisa membaca rekap dan membatalkan klaim.

> **Jaminan tidak ada klaim ganda ada di database, bukan di aplikasi.** `schedule_claims` punya indeks unik pada `schedule_id`. Karena `schedule_id` menunjuk satu baris **(tanggal × kelas)**, keunikan itu otomatis berarti "satu tanggal per kelas untuk satu orang tua" — bukan "satu tanggal untuk seluruh sekolah". Dua permintaan yang tiba bersamaan pada baris yang sama sama-sama lolos pengecekan di service — lalu salah satunya ditolak SQLite dan dijawab **409**. Pengecekan di service hanya untuk pesan yang ramah; constraint-nyalah yang menegakkan aturan.
>
> **Konsekuensi alur kerja:** karena baris `published` tidak bisa diedit lagi, korlas harus memutuskan tanggal mana yang dibiarkan terbuka **sebelum** memublikasi.

### F10: Progressive Web App (PWA)

- **Pasang ke layar utama** — banner "Pasang" muncul di Chrome/Edge; di iOS ditampilkan petunjuk manual "Add to Home Screen" karena Safari tidak mendukung `beforeinstallprompt`.
- **Service worker** — cache aset untuk pemuatan cepat, plus banner "Versi baru tersedia" ketika ada pembaruan yang menunggu.
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

> **Catatan implementasi:** `beforeinstallprompt` hanya menyala **sekali** dan terjadi jauh sebelum komponen banner sempat dirender — banner itu ada di dalam `AppShell`, yang baru muncul setelah sesi diverifikasi ke `/auth/me`. Karena itu event-nya ditangkap skrip inline di `<head>` lalu dibaca kembali oleh hook. Tanpa penangkap itu tombol Pasang tidak pernah muncul.
>
> Daftar tujuan navigasi tinggal di `src/components/navItems.ts` sebagai **sumber tunggal**;
> `AppShell` (bilah atas) dan `BottomNav` (bilah bawah) menyaring daftar yang sama lewat
> `visibleNavItems()`, sehingga menu tidak bisa lepas sinkron antar keduanya.

### F11: Impor Jadwal dari Teks Tempelan (Admin & Korlas)

Menjawab cara sekolah sebenarnya mengirim jadwal: **teks di WhatsApp**, bukan berkas
terstruktur. Sebelum ini, satu-satunya jalan memasukkannya adalah menjalankan skrip Python
lalu `wrangler d1 execute` terhadap produksi — pekerjaan yang hanya bisa dilakukan developer.
F11 memindahkannya ke dalam aplikasi, sehingga admin dan korlas bisa melakukannya sendiri.

**Bentuk teks yang diterima** — blok dibuka rentang tanggal, lalu baris `Hari : menu`:

```text
1 - 2 Oktober 2026
Kamis   : Puding Roti + jeruk
Jumat   : Libur

5 - 9 Oktober 2026
Senin   : Pisang kukus + Melon
Selasa  : Bubur kacang hijau + pisang
```

- **Tanggal tidak perlu ditulis satu per satu.** Tiap baris `Hari : menu` dicocokkan dengan
  tanggal aslinya di dalam rentang. `+` memisahkan makanan utama dan buah; teks di dalam
  `(...)` menjadi catatan; baris `Libur` menghasilkan jadwal bertanda libur tanpa menu.
- **Nama hari dipercaya kalender, bukan labelnya.** Bila blok sepekan penuh dilabeli keliru,
  rentangnya digeser ke Senin–Jumat minggu itu **dan pemakai diberi peringatan** — bukan
  ditolak. Ini mereproduksi keputusan yang sudah diambil untuk patch Oktober 2026
  (`14 - 18 Oktober 2026` dilabeli Senin–Jumat padahal 14 Oktober 2026 hari Rabu).
- **Idempoten — tempelan ulang aman.** Pasangan `(tanggal, kelas)` yang sudah punya jadwal
  **dilewati, bukan ditimpa**. Jadwal yang sudah `locked`/`published` tidak pernah berubah
  karena tempelan, sehingga teks yang sama (atau yang diperluas) boleh ditempel berulang.
- **Baris baru selalu `draft`** — masih melewati kunci & publikasi seperti jadwal yang
  disusun lewat layar, jadi impor tidak bisa diam-diam menayangkan menu ke orang tua.
- **Dua langkah di UI:** *Pratinjau* dulu (jumlah hari, baris baru, baris yang dilewati,
  peringatan, dan tabel tanggal hasil pencocokan), baru *Impor*. Tombol Impor mati selama
  belum ada pratinjau, dan pratinjau dibuang begitu teksnya diubah — yang diterapkan selalu
  sesuai dengan yang terlihat. Ini mitigasi risiko yang diminta §14.
- **Cakupan mengikuti peran:** admin menyasar **semua kelas**, korlas **kelasnya sendiri**.
  Ditegakkan di server lewat `resolveBulkClasses`, bukan hanya disembunyikan di UI.
- **Menu yang belum ada dibuat otomatis** — kategorinya ditebak dengan kata kunci yang sama
  seperti `scripts/seed.ts`, sehingga menu hasil impor tidak berbeda perlakuan dari menu seed.
- **Jejak audit** ditulis ke tabel `import_logs` (sumber, jumlah baris, status) — tabel yang
  sudah ada sejak skema awal tetapi belum pernah dipakai.

> **Kenapa bukan hanya di produksi lewat SQL.** Patch Oktober 2026 dikerjakan dengan skrip
> Python + SQL inkremental + rollback yang diuji di replika — prosedur yang benar, tetapi
> berat dan hanya bisa dijalankan developer. F11 tidak menggantikan kehati-hatian itu; ia
> memindahkan pekerjaan berulangnya ke tempat yang bisa dilakukan pemakainya sendiri.

### F12: Laporan Jadwal (Admin & Korlas — Rekap Piket)

Menjawab satu pertanyaan rapat koordinasi: **"beban piket sudah merata belum?"**

- **Rekap per orang tua** — berapa kali setiap orang tua mengambil jadwal piket dalam rentang
  yang dipilih, beserta rincian tiap ambil (tanggal, kelas, menu, anak, catatan).
- **Ringkasan** — total ambil, jumlah orang tua aktif, jumlah tanggal terisi, rata-rata ambil,
  dan daftar orang tua yang **belum pernah ambil**.
- **Filter** — rentang tanggal (`from`/`to`) dan kelas (`class`).

**Sumber data:** tabel `schedule_claims` — **sama persis** dengan yang dipakai F9 (Pilih
Jadwal). Konsekuensinya, angka di laporan tidak pernah berbeda dari yang dilihat orang tua di
halaman Pilih Jadwal; tidak ada perhitungan paralel yang bisa menyimpang.

> **Kenapa daftar "belum ambil" tidak dihitung dari tabel klaim.** Ketidakterlibatan seorang
> orang tua justru ditandai oleh **ketiadaan baris** di `schedule_claims`. Karena itu daftar
> ini diturunkan dari `students` (siapa yang punya anak di kelas itu) lewat
> `parentsWithStudents()`, lalu dikurangi dengan yang sudah punya klaim.

**Aturan cakupan** (modul `src/api/laporan/`):

| Role       | Cakupan                                                          | Menyebut kelas lain |
| ---------- | ---------------------------------------------------------------- | ------------------- |
| Admin      | tanpa `class` = **seluruh sekolah**; dengan `class` = satu kelas  | `403`               |
| Korlas     | **selalu kelasnya sendiri**, tidak peduli apa yang diminta       | `403`               |
| Orang tua  | —                                                                | `403`               |

> **Kenapa korlas dibatasi padahal halaman jadwal mengizinkannya membaca semua kelas.**
> Laporan memuat **nama orang tua sekaligus kebiasaannya mengambil piket**. Membaca jadwal
> kelas lain untuk koordinasi itu wajar; membaca rekap kehadiran orang tua kelas lain tidak.

- **Rentang maksimum 92 hari** — memakai konstanta yang sama dengan `utils/params.ts`, supaya
  tidak ada query tanpa batas yang menghabiskan kuota D1.
- **Bukan laporan keuangan** — tidak ada nominal, tidak ada peringkat yang dihukum; tujuannya
  semata-mata meratakan giliran.

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

> **File sumber `output_jadwal_piket.txt` memuat dimensi penugasan siswa.** Setiap hari kerja mencantumkan nama siswa yang bertugas piket per kelas. Jumlah kelas yang piket per hari bervariasi (3–5 kelas). Berdasarkan analisis September 2026: **5 minggu, 22 hari, 87 penugasan, 38 siswa unik**. Distribusi: 10 hari dengan 3 kelas, 11 hari dengan 5 kelas, 1 hari dengan 3 kelas (data quality issue: "Kelas 3 Kia" tanpa titik dua — lihat Catatan).

> **File sumber belum memuat dimensi kelas pada menu.** Menu sama untuk seluruh kelas pada tanggal yang sama (model lama "satu jadwal untuk seluruh sekolah"). Sejak v1.4 jadwal disimpan **per kelas**, sehingga setiap baris di tabel di atas berkembang menjadi satu baris `schedules` **untuk setiap kelas** — 43 tanggal × 3 kelas = **129 baris**. Bila sekolah ingin menu berbeda antar kelas, yang diubah hanya pasangan `(tanggal, kelas)` tertentu; struktur tabelnya sudah siap tanpa migrasi baru.

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
| **R**eact      | Frontend                  | React 19 + **TanStack Router v1** untuk routing + **TanStack Query v5** untuk data fetching/caching.           |
| **Database**   | Cloudflare D1             | Serverless SQLite yang terintegrasi dengan Workers, diakses via **Drizzle ORM**.                                |
| **Styling**    | Tailwind CSS v4           | Utility-first CSS, via `@tailwindcss/vite` plugin.                                                              |
| **Deployment** | Cloudflare Workers        | Serverless edge runtime, aset statis disajikan dari `./dist/client` dengan SPA fallback.                        |

**Penting — koreksi dari v1.1:** Dokumen versi sebelumnya menyebut frontend **Vue 3** dan database **bun:sqlite lokal**. Setelah template `bhvr-template` di-scaffold, stack sebenarnya adalah **React 19** dan **Cloudflare D1**. Skema database tetap berlaku karena D1 adalah SQLite — hanya lapisan akses dan deployment yang berubah. Jumlah tabel: **11** saat MVP, menjadi **12** sejak v1.4 setelah `students` dipisahkan dari `parents`, lalu **13** sejak v1.7 setelah `schedule_claims` ditambahkan. (`piket_assignments` dari rencana v1.5 **tidak pernah dibuat** — lihat F7.)

### 6.2 Arsitektur Sistem

```
┌─────────────────────────────────────────────┐
│              Browser / Client                │
│   React 19 + TanStack Router v1 + TanStack     │
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
│   │   ├── parents/              # CRUD akun orang tua + anak + korlas + ekspor/impor Excel
│   │   ├── piket/                # Penugasan siswa piket per kelas per hari (Phase 4)
│   │   ├── stats/                # Ringkasan dashboard (admin)
│   │   ├── middleware/           # requireAuth, requireRole
│   │   └── utils/                # response, password, date, slug, params, sql, classScope, xlsx, xlsxRead, base64
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
| POST   | `/api/parents/bulk`               | **Aksi massal** atas akun tercentang: `{ ids, action }` dengan `action` = `activate` \| `deactivate` \| `delete`. Baris yang keadaannya sudah cocok **dilewati** (`skipped`) alih-alih menggagalkan seluruh permintaan | Admin |
| POST   | `/api/parents/import`             | Impor/upsert akun massal dari berkas `.xlsx` hasil ekspor                              | Admin |

> **Bentuk `students`:** array objek `{ id?, name, className? }`. Saat `PUT`, entri yang menyertakan `id` akan **diperbarui**, entri tanpa `id` **dibuat baru**, dan entri yang tidak disebut lagi **dihapus**. `id` hanya dipercaya bila anak tersebut memang milik orang tua itu.

> **Aksi massal (`POST /parents/bulk`):** memungkinkan admin mengaktifkan/menonaktifkan/menghapus banyak akun sekaligus dari kotak centang di tabel (lihat F3b). Body `{ ids: number[], action }`. Berbeda dari perubahan per-baris, di sini pemilihannya **eksplisit per akun**, sehingga tidak ada operasi yang gagal seluruhnya: akun yang keadaannya sudah cocok dengan aksi (mis. mengaktifkan akun yang sudah aktif) **dilewati** dan dilaporkan lewat `skipped`; id yang tidak ditemukan masuk `ignored`. Respons `{ action, changed, skipped, ignored }`. `isActive` disimpan di dua tabel (`users` + `parents`) dan kedua sisi seirama. Hapus permanen (`delete`) menarik profil & anak via `ON DELETE CASCADE`. Endpoint khusus admin — tidak ada pembatasan kelas seperti pada jadwal.

> **Bentuk `role` / `className`:** `role` menerima `"parent"` atau `"korlas"`. Bila `role = "korlas"`, `className` **wajib** diisi (mis. `"1"`); bila `role = "parent"`, `className` diabaikan dan dikosongkan otomatis. Lihat §3.3 untuk wewenang korlas.

> **`POST /parents/import`** — body JSON `{ file: "<base64>", filename?, dryRun? }`. Isinya
> berkas `.xlsx` (layout = hasil `GET /parents/export`) yang dikirim sebagai **base64**, bukan
> `multipart/form-data`; klien memakai `ky` yang memaksa `Content-Type: application/json`,
> sehingga base64 adalah satu-satunya jalur tanpa menambah dependency parser multipart.
> Batas 6 MB untuk string base64. Respons:
> `{ dryRun, created, updated, skipped, errors[], rows[] }`, dengan `rows[]` memuat keputusan
> per baris (`create` / `update` / `skip` + alasannya). `dryRun: true` tidak menulis apa pun.
> Aturan lengkapnya ada di **F5**. Route ini didaftarkan **sebelum** `/:id` agar `/import`
> tidak ditangkap sebagai id.

### 7.3 Kelas Endpoints

| Method | Path           | Deskripsi                                                                                                                                     | Role          |
| ------ | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| GET    | `/api/classes` | Daftar kelas yang **boleh diakses pemanggil** + kelas default. Admin → semua kelas; korlas → kelasnya sendiri; orang tua → kelas anak-anaknya | Authenticated |

> Response: `{ "classes": ["1","2","3","4","5","6"], "default": "1" }`. Daftar ini **sudah dipersempit** sesuai peran, jadi UI bisa langsung memakainya untuk pemilih kelas tanpa logika tambahan. Kelas diturunkan dari `students` ∪ korlas `users` ∪ `schedules` (tidak ada tabel `classes`), dan diurutkan natural sehingga `2A` mendahului `10A`.

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

Semua pembacaan menerima query **`?class=`** opsional. Bila kosong, kelas default ditentukan dari peran pemanggil (lihat §7.3). Kelas di luar cakupan → `403`.

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
| POST   | `/api/schedules/import`                         | Impor jadwal dari **teks tempelan** (`text`, `classNames?`, `dryRun?`) — baris `(tanggal, kelas)` yang sudah ada **dilewati**, hasilnya `draft`                                                      | Admin, **Korlas**     |
| PUT    | `/api/schedules/:id`                            | Ubah menu / libur / catatan (kelas dari baris)                                                                                                                        | Admin, **Korlas**     |
| DELETE | `/api/schedules/:id`                            | Hapus jadwal (kelas dari baris; ditolak bila `locked`/`published`)                                                                                                    | Admin, **Korlas**     |
| POST   | `/api/schedules/lock`                           | Kunci semua jadwal `draft` pada rentang tanggal (`fromDate`, `toDate`, `className?` / `classNames?`); admin tanpa kelas = **semua kelas**, `classNames` = hanya kelas terpilih | Admin, **Korlas**     |
| POST   | `/api/schedules/publish`                        | Publikasi semua jadwal `locked` untuk satu bulan (`year`, `month`, `className?` / `classNames?`); admin tanpa kelas = **seluruh sekolah**; gagal (`409`) bila masih ada `draft` | Admin, **Korlas**     |
| POST   | `/api/schedules/bulk/lock`                      | Kunci **baris terpilih** (`ids: number[]`) — hanya baris `draft` yang berubah, sisanya `skipped`; korlas hanya baris kelasnya (`ignored`)                                     | Admin, **Korlas**     |
| POST   | `/api/schedules/bulk/publish`                   | Publikasi **baris terpilih** (`ids`) — hanya baris `locked`; **tidak** memakai `409`, sisanya dilaporkan `skipped`                                                       | Admin, **Korlas**     |
| POST   | `/api/schedules/bulk/unlock`                    | Buka kunci **baris terpilih** (`ids`) — `locked`/`published` kembali ke `draft`                                                                                          | Admin                 |
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

> **Aturan impor teks (`POST /schedules/import`):**
>
> - Body `{ text, classNames?, dryRun? }`. `text` kosong atau tanpa blok tanggal → `400 import_empty`.
> - **`classNames` kosong berarti berbeda per peran:** admin → **semua kelas**, korlas →
>   **kelasnya sendiri**. Korlas yang menyebut kelas lain → `403 forbidden_class`; orang tua → `403`.
> - **`dryRun: true`** (atau `?dryRun=1`) mengembalikan laporan yang sama **tanpa menulis apa pun**.
> - **Idempoten:** kunci `(schedule_date, class_name)` yang sudah terisi **dilewati**, bukan
>   ditimpa; baris `locked`/`published` tidak pernah berubah karena tempelan. Hasilnya dilaporkan
>   sebagai `skippedRows`, bukan kegagalan.
> - **Baris baru selalu `status: draft`.**
> - Menu yang belum ada dibuat otomatis (kategori ditebak `guessCategorySlug`); menu yang sudah
>   ada dipakai ulang berdasarkan pasangan utama+buah, bukan nama yang persis sama.
> - Respons: `{ dryRun, parsedDays, blocks, createdRows, skippedRows, createdMenus, reusedMenus,
>   classes, days, warnings, issues }`. `days[]` memuat hasil per tanggal (`classesCreated`,
>   `classesSkipped`) untuk ditampilkan di pratinjau.
> - Impor yang berhasil menulis satu baris ke `import_logs`. Bila penyisipan jadwal gagal, menu
>   yang terlanjur dibuat **dihapus kembali** supaya katalog tidak menyimpan menu yatim — D1 tidak
>   punya transaksi interaktif, jadi pembersihannya eksplisit.
>
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
>
> **Aksi massal per baris (`POST /schedules/bulk/{lock,publish,unlock}`)** — dipakai checkbox
> di tabel jadwal. Body-nya `{ ids: number[] }`; kelas **tidak** dikirim klien melainkan
> diturunkan dari tiap baris, sehingga korlas tidak bisa menyentuh kelas lain lewat `ids`.
> Aturan statusnya sama dengan aksi berbasis rentang (`lock` hanya dari `draft`, `publish`
> hanya dari `locked`, `unlock` dari `locked`/`published`), tetapi baris yang statusnya tidak
> cocok **tidak** menggagalkan permintaan — hanya dihitung `skipped`. Id yang tidak ditemukan
> atau di luar cakupan kelas dihitung `ignored`. Responsnya
> `{ action, changed, skipped, ignored, classes }`. Buka kunci massal khusus **admin**
> (`403` untuk korlas).
>
> **Memilih beberapa kelas (`classNames`)** — `POST /schedules/lock` & `/publish` menerima
> `classNames: string[]` sebagai alternatif `className`; bila keduanya dikirim, `classNames`
> yang dipakai. Admin tanpa keduanya tetap berarti "semua kelas"; korlas yang menyebut kelas
> lain di dalam `classNames` dijawab `403 forbidden_class`. Pada `publish`, aturan "draft
> menahan publikasi" berlaku untuk **kelas yang dipilih saja** — kelas yang tidak dipilih
> tidak ikut menghalangi, sehingga satu kelas bisa terbit lebih dulu.
> - `PUT`/`DELETE /schedules/:id` dan `POST /schedules/copy` (overwrite) **menolak** baris dengan status `locked`/`published` → `409 not_editable`.
> - **Kunci & publikasi berbeda dari penulisan jadwal per baris.** `POST /schedules` dan `POST /schedules/copy` tetap mewajibkan admin menyebut kelas (`400 class_required`); hanya `lock`/`publish` yang memperlakukan `className` kosong sebagai "semua kelas".

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

### 7.7b Laporan Jadwal (F12) — ✅ Terimplementasi

| Method | Path                             | Deskripsi                                                                    | Role          |
| ------ | -------------------------------- | ---------------------------------------------------------------------------- | ------------- |
| GET    | `/api/laporan?from=&to=&class=`  | Rekap ambil per orang tua + ringkasan + daftar yang belum pernah ambil       | Admin, Korlas |

**Kode kegagalan:**

| Kode | Kondisi           | Keterangan                                                            |
| ---- | ----------------- | --------------------------------------------------------------------- |
| 400  | Rentang tidak sah | `from`/`to` wajib; rentang maksimum **92 hari**; format tanggal salah |
| 401  | Tanpa token       | —                                                                     |
| 403  | Di luar cakupan   | Orang tua selalu `403`; korlas & admin yang menyebut kelas lain `403` |

**Bentuk jawaban** (`src/types/laporan.ts`):

- `ringkasan` — `totalAmbil`, `orangTuaAktif`, `tanggalTerisi`, `orangTuaKosong`,
  `rataAmbil`, `belumAmbil[]`.
- `orangTua[]` — per orang tua: `jumlahAmbil` + `tanggal[]` (tanggal, kelas, menu, anak, catatan).

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

> **Efek samping yang disengaja:** `POST /api/claims` ikut menulis `schedules.petugas_name` dan `petugas_parent_name`; `DELETE /api/claims/:id` mengosongkannya kembali. Dengan begitu endpoint jadwal yang sudah ada langsung menampilkan petugas hasil klaim tanpa perubahan apa pun.

---

### 7.9 Piket Endpoints (Penugasan Siswa) — ⚠ TIDAK DIIMPLEMENTASI

> Endpoint di bawah **tidak pernah dibuat** (lihat catatan F7). Petugas piket kini berupa dua kolom di `schedules`, diisi lewat `PUT /api/schedules/:id` (korlas) atau otomatis oleh `POST /api/claims` (orang tua). Bagian ini dipertahankan sebagai catatan rancangan.

Semua pembacaan menerima query **`?class=`** opsional seperti endpoint jadwal. Penugasan terkait ke baris `schedules` lewat `schedule_id`; korlas hanya boleh mengelola penugasan untuk kelasnya sendiri.

| Method | Path                                | Deskripsi                                                                        | Role                  |
| ------ | ----------------------------------- | -------------------------------------------------------------------------------- | --------------------- |
| GET    | `/api/schedules/:id/piket`          | Daftar siswa piket untuk satu entri jadwal                                       | Admin, Korlas, Parent |
| GET    | `/api/piket/search?q=&from=&to=`    | Cari riwayat piket siswa berdasarkan nama (maks. 400 hari)                       | Admin, Korlas, Parent |
| POST   | `/api/schedules/:id/piket`          | Tetapkan/ubah siswa piket untuk satu entri jadwal (`classLabel` + `studentName`) | Admin, **Korlas**     |
| DELETE | `/api/schedules/:id/piket/:piketId` | Hapus penugasan piket                                                            | Admin, **Korlas**     |

> **Aturan tulis:** korlas hanya boleh mengelola penugasan pada baris `schedules` yang `class_name` sama dengan kelasnya. Sistem memuat baris jadwal lebih dulu, lalu memanggil `canWriteClass(user, row.className)` — sama seperti `PUT`/`DELETE /schedules/:id`. Admin boleh mengelola penugasan untuk kelas mana pun.

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
5. Klik **"Salin sekarang"** → banner menampilkan ringkasan: `Disalin 14 - 18 September 2026 → 21 - 25 September 2026: 2 dibuat, 0 diperbarui, 3 dilewati.`
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

**Impor massal dari Excel:**

9. Klik **"Impor"** di header halaman → pilih berkas `.xlsx` yang layoutnya sama dengan hasil
   **Ekspor** (nama orang tua, username, password, peran, kelas dikoordinasi, anak, aktif,
   terkunci, login terakhir). Berkasnya boleh langsung dari hasil ekspor, atau diisi manual
   selama header kolomnya sama.
10. Sistem membaca berkas lalu menampilkan **pratinjau**: ringkasan `Dibuat / Diperbarui /
    Dilewati`, daftar baris yang tidak terbaca, dan tabel per baris berisi keputusan
    (`Akun baru` / `Diperbarui` / `Dilewati` + alasan). **Belum ada yang ditulis** pada tahap ini.
11. Tekan **"Terapkan"** → akun yang usernamenya sudah ada **ditimpa**, yang belum ada
    **dibuat baru**. Selesai → dialog sukses berisi jumlah perubahan.
12. Yang perlu diketahui sebelum menekan Terapkan:
    - Kolom yang **dikosongkan** pada suatu baris **tidak diubah** — password, status aktif, dan
      daftar anak yang selnya kosong akan dipertahankan apa adanya. Jadi mengunggah ulang berkas
      ekspor tidak akan menghapus data.
    - Baris **baru** wajib punya username **dan** password; tanpa itu baris dilewati dan
      alasannya dilaporkan.
    - Sel *Password* pada hasil ekspor selalu kosong (hash tidak pernah keluar server), jadi
      password hanya terisi bila admin mengetiknya sendiri di berkas.
    - Mengimpor berkas yang sama dua kali aman: putaran kedua hanya melaporkan `Diperbarui`
      dengan nilai yang sama.

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
2. Susun/edit menu untuk setiap hari (status = `draft`) — tabel jadwal berjalan **per kelas**, ganti kelas lewat pemilih di header bila perlu
3. Klik tombol **"Kunci bulan (semua kelas)"** → **semua baris `draft` di seluruh kelas (1–6)** berubah menjadi `locked` dalam satu tindakan
   - Tombol nonaktif bila tidak ada baris `draft` (semua sudah terkunci/dipublikasi)
   - Ringkasan status di kartu bulanan menampilkan angka **lintas kelas** (ditandai "semua kelas")
4. Pastikan tidak ada baris `draft` tersisa. Baris peringatan menyebut **kelas mana** yang masih draft
5. Klik tombol **"Publikasi (semua kelas)"** → semua baris `locked` di semua kelas berubah menjadi `published`; orang tua kelas 1–6 melihat jadwalnya bersamaan
   - Tombol nonaktif bila masih ada `draft` (di kelas mana pun) atau belum ada `locked`
   - Bila ditolak, pesan `409` menyebut kelas penyebabnya
6. Bila perlu revisi: admin membuka kunci baris tertentu (tombol **🔓**) → status kembali `draft` → korlas mengedit → kunci ulang → publikasi ulang

> **Korlas** memakai tombol yang sama untuk kelasnya saja (label tanpa "semua kelas"), dan tetap tidak bisa menyentuh kelas lain. **Salin Sepekan** tetap **per kelas** — itu memang operasi penyusunan jadwal, bukan penerbitan.

> **Penting untuk F9:** tanggal yang ingin direbutkan orang tua harus dibiarkan **kosong petugasnya sebelum langkah 5**. Setelah `published`, barisnya tidak bisa diedit lagi.

### 8.8b Admin & Korlas: Aksi Massal lewat Checkbox — ✅ Terimplementasi

Melengkapi 8.8 untuk pekerjaan yang memang hanya menyentuh **sebagian** jadwal. Ada dua jalur,
keduanya menghapus keharusan mengulang satu baris satu klik.

**A. Per hari (tabel jadwal)**

1. Centang hari yang diinginkan — tiap baris punya kotaknya sendiri, header tiap minggu punya **"Pilih minggu ini"**, dan toolbar punya **"Pilih semua"** untuk sebulan penuh
2. Bilah aksi muncul menempel di bawah layar, menyebut jumlah hari terpilih beserta rinciannya (mis. "6 hari dipilih · 3 draft · 3 terkunci")
3. Tombol yang tampil hanya yang masuk akal untuk status pilihan itu:
   - **Kunci** — aktif bila ada baris `draft`
   - **Publikasi** — aktif bila ada baris `locked`
   - **Buka kunci** — hanya untuk admin, aktif bila ada baris `locked`/`published`
4. Jalankan → banner menyebut hasilnya (mis. "3 jadwal dikunci, 1 dilewati (status tidak cocok).") dan pilihan otomatis dikosongkan karena barisnya sudah berpindah status

**B. Per kelas (kartu Status per kelas)**

1. Centang kelas pada kartu *Status per kelas* (tersedia juga **"Pilih semua kelas"**)
2. Klik **Kunci kelas terpilih** atau **Publikasi kelas terpilih**
3. Hanya kelas yang dicentang yang tersentuh. Tombol Publikasi mati selama salah satu kelas terpilih masih menyisakan `draft`, dengan alasan yang tampil sebagai tooltip

> **Hubungannya dengan 8.8:** tombol "Kunci bulan" / "Publikasi (semua kelas)" tetap ada dan
> tetap berguna untuk penerbitan serentak. Checkbox bukan penggantinya, melainkan jalan pintas
> ketika hanya sebagian jadwal yang sudah siap — mis. kelas 3 sudah selesai sementara kelas 5
> masih menyusun menu.



### 8.9 Orang Tua: Ambil Tanggal Snack — ✅ Terimplementasi

1. Login → menu **"Pilih Jadwal"**
2. Halaman menampilkan bulan berjalan: berapa tanggal yang masih kosong, dan mana yang sudah diambil sendiri
3. Bila punya lebih dari satu anak di kelas itu, pilih **"atas nama anak"** sekali di atas halaman
4. Klik **"Ambil tanggal ini"** pada kartu hari yang diinginkan — langsung tersimpan, tanpa dialog konfirmasi
5. **Berhasil:** kartunya disorot, berlabel "Pilihan Anda", dan nama anak + nama orang tua langsung muncul sebagai petugas di seluruh tampilan jadwal
6. **Keduluan:** muncul modal *"Yah, keduluan!"* dengan nama orang tua yang lebih dulu mengambil, dan papan jadwalnya langsung disegarkan sehingga terlihat tanggal mana yang masih tersisa
7. Berubah pikiran → **"Batalkan"** selama tanggalnya belum lewat; tanggal itu kembali terbuka untuk orang tua lain

> Kartu yang berlabel **"Ditetapkan korlas"** tidak bisa diambil — petugasnya sudah ditentukan dari daftar piket manual.

### 8.10 Admin & Korlas: Impor Jadwal dari Teks — ✅ Terimplementasi

1. Buka `/jadwal` → tombol **Impor Jadwal** di toolbar
2. Tempel jadwal apa adanya dari sekolah ke kotak teks — blok rentang tanggal, lalu baris `Hari : menu`
3. Klik **Pratinjau** → muncul jumlah blok & hari terbaca, berapa baris baru, berapa yang
   **dilewati karena sudah ada**, berapa menu baru dibuat, daftar peringatan/masalah baca,
   dan tabel tanggal hasil pencocokan
4. Periksa tabelnya — terutama tanggal hasil pencocokan nama hari
5. Klik **Impor** → baris tersimpan sebagai `draft`, dan banner menyebut hasilnya
   (mis. *"Ditambahkan 132 baris draft untuk 6 kelas (1, 2, 3, 4, 5, 6), 21 menu baru."*)
6. Lanjutkan alur biasa: admin mengunci bulan → korlas mempublikasi

> **Menempel ulang aman.** Tanggal yang sudah punya jadwal dilewati, bukan ditimpa. Kalau
> sekolah mengirim ulang teks yang sama, atau teks yang diperluas dengan minggu berikutnya,
> pemakai bisa menempelkannya langsung tanpa takut merusak jadwal yang sudah dikunci.

### 8.11 Admin & Korlas: Lihat Laporan Piket — ✅ Terimplementasi

1. Login → menu **Laporan** (ikon grafik; hanya tampil untuk admin & korlas)
2. Tentukan rentang tanggal (Dari / Sampai) — maksimum 92 hari
3. Pilih kelas — admin bisa mengosongkannya untuk melihat **seluruh sekolah**; korlas otomatis
   terkunci pada kelasnya sendiri (kolomnya *read-only*)
4. Kartu ringkasan menyajikan total ambil, orang tua aktif, tanggal terisi, dan rata-rata ambil
5. Tabel rekap memperlihatkan jumlah ambil per orang tua; rincian tiap tanggal bisa dibuka
6. Daftar **"Belum pernah ambil"** dipakai untuk mengajak orang tua yang belum pernah piket

> **Yang dilakukan korlas memakai laporan ini:** mengecek apakah giliran sudah merata sebelum
> menyusun jadwal bulan berikutnya, bukan untuk mencari siapa yang "kurang berpartisipasi".

### 8.12 Admin & Korlas: Isi Petugas pada Jadwal yang Sudah Terbit — ✅ Terimplementasi

1. Buka `/jadwal`, temukan tanggal berstatus **Dipublikasi** yang petugasnya masih kosong
2. Dropdown **Petugas** tetap aktif — menu, catatan, dan tombol libur/hapus yang mati
3. Pilih nama siswanya → tersimpan langsung, meski barisnya sudah `published`
4. Mengubah **menu** atau **catatan** pada baris yang sama tetap ditolak (`409 not_editable`) —
   minta admin membuka kunci lebih dulu

> **Kenapa ada pengecualian ini.** Piket sering baru terisi setelah jadwal terbit: korlas
> mengumumkan dulu, baru orang tua mendaftar. Tanpa pengecualian, satu nama petugas memaksa
> seluruh jadwal dibuka kuncinya. Pengecualiannya **sempit**: hanya `petugasStudentId`, dan
> hanya bila tidak digabung dengan perubahan lain.

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

Pratinjau impor (setelah memilih berkas `.xlsx`, sebelum menekan Terapkan):
```
┌──────────────────────────────────────────────────────────────┐
│  Impor akun orang tua                                    [x]  │
├──────────────────────────────────────────────────────────────┤
│  Dari akun-2026-10-01.xlsx                                   │
│  Dibuat 2 · Diperbarui 34 · Dilewati 1                       │
│                                                              │
│  ⚠ 1 baris tidak terbaca (lihat daftar di bawah)             │
│                                                              │
│  Baris │ Nama      │ Username │ Keputusan                    │
│  ──────┼───────────┼──────────┼─────────────────────────────│
│  3     │ Sari      │ sari     │ Diperbarui                   │
│  4     │ Budi      │ budi     │ Diperbarui                   │
│  5     │ Rina      │ rina     │ Akun baru                    │
│  6     │ —         │ dewi     │ Dilewati · password kosong   │
│                                                              │
│  Sel kosong pada password/aktif/anak tidak mengubah data.    │
│                                     [Batal] [Terapkan]       │
└──────────────────────────────────────────────────────────────┘
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
- [x] Skema database di `src/database/schema.ts` (11 tabel saat MVP; **12** sejak v1.4 setelah `students` dipisah dari `parents`; **13** sejak v1.7 setelah `schedule_claims` ditambahkan — `piket_assignments` dari rencana v1.5 tidak pernah dibuat, lihat Phase 4)
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

### Phase 4: Penugasan Piket Siswa — ⚠ DIREVISI (tabel `piket_assignments` tidak dibuat)

> **Status: tidak dikerjakan seperti rencana.** Dimensi "siapa yang piket" **terwujud**, tetapi
> tidak lewat tabel `piket_assignments`. Karena baris jadwal sudah per kelas dan satu kelas hanya
> punya satu petugas per hari, tabel terpisah hanya menambah satu join tanpa memberi apa pun.
> Sebagai gantinya `schedules` memakai kolom `petugas_name`/`petugas_parent_name` (migrasi
> `0003_quiet_nitro.sql`), lalu sejak v1.10 pasangan id `petugas_student_id`/`petugas_parent_id`
> (migrasi `0007_petugas_link.sql`). Rinciannya di **F7**.
>
> Daftar di bawah dipertahankan sebagai catatan sejarah rencana. Perhatikan nomor migrasi
> `0004_*.sql` di dalamnya **tidak jadi dipakai** — nomor itu akhirnya terpakai untuk kunci &
> publikasi (`0004_noisy_whiplash.sql`, Phase 4b).

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

**Yang benar-benar dikerjakan sebagai gantinya** — tercentang:

- [x] Petugas disimpan sebagai kolom di `schedules` (`petugas_name`, `petugas_parent_name`) — migrasi `0003_quiet_nitro.sql`
- [x] Petugas menjadi **relasi ke siswa**, bukan teks bebas — `petugas_student_id` + `petugas_parent_id`, migrasi `0007_petugas_link.sql`; nama diturunkan server lewat `resolvePetugas()`
- [x] Seed data piket dari `output_jadwal_piket.txt` — 22 tanggal bertugas (September 2026, Kelas 1–5)
- [x] Backend: petugas diisi lewat `PUT /schedules/:id` (korlas) atau otomatis oleh `POST /claims` (orang tua)
- [x] Frontend: blok petugas di kartu jadwal (`ScheduleDayCard`) + kolom *Petugas* berupa dropdown siswa kelas itu di `/jadwal`
- [x] Pemetaan label kelas "Kelas 1"–"Kelas 5" ↔ `class_name` dilakukan saat seed
- [x] Test: cakupan kelas korlas atas petugas (`test-api` section 19) + dropdown petugas diuji di browser
- [ ] Pencarian riwayat piket ("kapan Shezan terakhir piket?") — belum ada endpointnya
- [ ] Sorot nama anak sendiri bila sedang piket — kartu menampilkan nama, tetapi belum menyorot

### Phase 4b: Kunci & Publikasi Jadwal — ✅ SELESAI

- [x] Kolom baru di `schedules`: `status`, `locked_by`, `locked_at`, `published_by`, `published_at`
- [x] Migrasi `0004_noisy_whiplash.sql` — `ALTER TABLE` + `UPDATE` existing rows ke `published`
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

#### Phase 4b-3: Aksi Massal lewat Checkbox (v1.11) — ✅ SELESAI

- [x] Repository: `findSchedulesByIds`, `lockDraftSchedulesByIds`, `publishLockedSchedulesByIds`, `unlockSchedulesByIds` — semuanya lewat satu helper `setStatusByIds` yang menaruh syarat status di `WHERE` (bukan hanya di aplikasi)
- [x] Service: `bulkRows()` — menyaring cakupan kelas + status per baris, melaporkan `changed`/`skipped`/`ignored`; `lockSchedules`/`publishMonth` menerima `classNames: string[] | null`
- [x] Controller: `resolveBulkClasses` + `requestedClasses` (menggantikan `resolveBulkClass`), pabrik handler `bulkByRows`, pesan `bulkMessage`
- [x] Endpoint: `POST /schedules/bulk/lock`, `POST /schedules/bulk/publish`, `POST /schedules/bulk/unlock` (buka kunci khusus admin)
- [x] DTO: `BulkRowAction`, `BulkRowScheduleInput`, `BulkRowScheduleResultDto`; `classNames` pada input & hasil `lock`/`publish` (`className` di hasil → `classNames`)
- [x] UI: primitif `Checkbox` (dengan keadaan *indeterminate*), kotak per baris + "Pilih minggu ini" + "Pilih semua", `BulkActionBar` lengket di bawah layar, checkbox per kelas di `SchoolStatusSummary`
- [x] Refactor `/jadwal`: `messages.ts` (kalimat banner), `selection.ts` (logika pemilihan murni), `BulkActionBar.tsx`; halaman tinggal menyusun query/mutasi
- [x] Test: section 23 `scripts/test-api.mjs` (19 assertion) — penjagaan akses, validasi `ids`, kunci/publikasi/buka kunci massal, cakupan kelas korlas, `classNames`

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

### Phase 4e: Impor Jadwal dari Teks Tempelan (v1.12) — ✅ SELESAI

- [x] Parser murni `src/api/schedules/importParser.ts` — tanpa DB, tanpa jam, tanpa throw; `DAY_INDEX`/`MONTH_INDEX`, `datesBetween` (menolak tanggal meluber seperti 31 Feb), `splitMenuText` (mencerminkan `parseMenuText()` di `scripts/seed.ts`), `menuKey` (mengabaikan beda huruf besar/kecil)
- [x] Aturan pergeseran: blok sepekan penuh yang label harinya tidak cocok dengan kalender digeser ke Senin–Jumat minggu itu **beserta peringatan** — mereproduksi keputusan patch Oktober 2026
- [x] Repository: `findOccupiedDateClassKeys` (satu query untuk seluruh rentang), `insertSchedules` (satu baris per pernyataan lewat `db.batch()`, 40 per giliran — menghindari batas 100 parameter D1), `insertImportLog`; katalog: `loadAllMenus`, `deleteMenus`
- [x] Service: `importSchedule()` — `dryRun`, menulis `import_logs`, dan menghapus menu yatim bila penyisipan jadwal gagal
- [x] Kategori menu hasil impor ditebak `src/api/catalog/categorize.ts` (`guessCategorySlug`), dengan kata kunci yang sama seperti `scripts/seed.ts`
- [x] Controller/Route: `POST /schedules/import` (admin + korlas) memakai `resolveBulkClasses`; error `import_empty` → `400`
- [x] DTO: `ImportScheduleInput`, `ImportScheduleResultDto`, `ImportDayOutcomeDto`, `ImportParseResultDto`
- [x] UI: `ImportDialog.tsx` (dua langkah: Pratinjau → Impor; pratinjau dibuang saat teks berubah), tombol "Impor Jadwal" di `MonthToolbar`, `importMessage()` di `messages.ts`
- [x] Test: section 24 `scripts/test-api.mjs` (38 assertion) — akses, validasi teks, pratinjau tanpa tulis, idempotensi, jadwal terkunci tidak tersentuh, cakupan korlas, pergeseran rentang, pembersihan

### Phase 4f: Laporan Jadwal (v1.13) — ✅ SELESAI

- [x] `GET /laporan?from=&to=&class=` — rekap ambil per orang tua + ringkasan + daftar yang belum pernah ambil
- [x] Cakupan: admin = sekolah-wide atau satu kelas; korlas = kelasnya sendiri; orang tua `403`
- [x] Rentang maksimum 92 hari
- [x] Halaman `/laporan` + item navigasi (admin & korlas), diuji di `outputs/check-laporan.mjs`
- [x] Pengecualian petugas pada baris `locked`/`published` (patch petugas-murni tetap diterapkan)

### Phase 5: Ekspor, Impor & Cetak — 🔶 SEBAGIAN

- [ ] Ekspor PDF jadwal Sepekan/bulanan (termasuk daftar siswa piket)
- [x] Ekspor Excel — jadwal: `GET /schedules/export?scope=week|month` (admin & korlas), diuji di section 21 `scripts/test-api.mjs`
- [x] Ekspor Excel — akun orang tua: `GET /parents/export?active=` (admin only)
- [x] Impor Excel — akun orang tua (v1.14): `POST /parents/import` (admin only); pembaca `.xlsx`
      tanpa dependency di `src/api/utils/xlsxRead.ts`; diuji di `outputs/check-import-akun.mjs`
      (33 skenario) + `outputs/check-import-akun-ui.mjs` (17 skenario)
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
| AC38  | Baris `locked`/`published` tidak dapat diedit, dihapus, atau ditimpa (copy)                                            | ✅ Done — `409 not_editable` di service; kontrol edit dinonaktifkan di UI. **Satu pengecualian sejak v1.13:** patch `petugasStudentId`-murni tetap diterapkan (lihat AC62 & AC63)     |
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
| AC48  | Kunci/publikasi/buka kunci dapat dijalankan untuk **banyak baris sekaligus** lewat checkbox di tabel jadwal             | ✅ Done — kotak centang per baris + "Pilih minggu ini" + "Pilih semua"; `POST /schedules/bulk/{lock,publish,unlock}` (`ids`); bilah aksi hanya menghidupkan tombol yang cocok dengan status terpilih; diuji di `test-api` section 23 |
| AC49  | Aksi massal per baris **tidak** menggagalkan seluruh permintaan karena satu baris berstatus tidak cocok                  | ✅ Done — baris yang tidak cocok dihitung `skipped`, id di luar cakupan kelas `ignored`; respons `{ action, changed, skipped, ignored, classes }` (berbeda sengaja dari `409 drafts_remaining` pada aksi berbasis rentang) |
| AC50  | Satu/beberapa **kelas** dapat dipublikasi tanpa menunggu kelas lain yang jadwalnya belum siap                            | ✅ Done — `classNames: string[]` pada `POST /schedules/lock` & `/publish`; aturan "draft menahan publikasi" hanya berlaku untuk kelas yang dipilih; checkbox per kelas di kartu *Status per kelas* |
| AC51  | Buka kunci massal tetap **khusus admin** — korlas tidak dapat memakainya                                                 | ✅ Done — `POST /schedules/bulk/unlock` memakai `requireRole("admin")`; korlas yang mengirim `ids` kelasnya dijawab `403` (diuji di `test-api` section 23)                                                      |
| AC52  | Admin dapat memasukkan jadwal sebulan dengan **menempel teks dari sekolah**, tanpa skrip manual  | ✅ Done — `POST /schedules/import` + dialog dua langkah di `/jadwal`; parser `src/api/schedules/importParser.ts`; diuji di `test-api` section 24                                                                          |
| AC53  | Impor **tidak pernah menimpa** jadwal yang sudah ada — `(tanggal, kelas)` yang terisi dilewati        | ✅ Done — `findOccupiedDateClassKeys` + `skippedRows`; baris `locked`/`published` tetap utuh setelah tempelan ulang (diuji section 24)                                                                                      |
| AC54  | Menempel teks yang sama dua kali **tidak menggandakan** baris maupun menu                              | ✅ Done — idempoten: tempelan kedua melaporkan `createdRows: 0`, `createdMenus: 0`, dan katalog tetap 5 menu (diuji section 24)                                                                                             |
| AC55  | Baris hasil impor berstatus **`draft`**, sehingga masih melewati kunci & publikasi                     | ✅ Done — service selalu menulis `status: "draft"`; diverifikasi lewat `GET /schedules/range` (diuji section 24)                                                                                                            |
| AC56  | Cakupan impor mengikuti peran: admin = semua kelas, korlas = kelasnya sendiri                          | ✅ Done — `resolveBulkClasses` + `requestedClasses`; korlas menyebut kelas lain → `403`, orang tua → `403` (diuji section 24)                                                                                               |
| AC57  | Rentang tanggal yang salah tulis **digeser** mengikuti kalender dan diberitahukan, bukan ditolak       | ✅ Done — `isFullSchoolWeek` + percobaan ulang `assignDays`; `15 - 19 Oktober 2036` dilabeli Senin–Jumat → digeser ke `13 - 17 Oktober 2036` + peringatan (diuji section 24)                                                |
| AC58  | Admin & korlas dapat melihat **rekap berapa kali setiap orang tua mengambil piket** dalam satu rentang | ✅ Done — `GET /laporan`; rekap per orang tua + rincian tanggal/menu/anak; halaman `/laporan` (diuji section 25 `test-api.mjs` & `outputs/check-laporan.mjs` 14/14)                                                          |
| AC59  | Laporan menyertakan **daftar orang tua yang belum pernah ambil**                                       | ✅ Done — dihitung dari `students` lewat `parentsWithStudents()`, bukan dari ketiadaan baris klaim (yang tidak bisa di-query)                                                                                                |
| AC60  | Cakupan laporan mengikuti peran: admin sekolah-wide, korlas kelasnya sendiri, orang tua `403`         | ✅ Done — `laporanService.resolveScope`; kelas di luar cakupan dijawab `403` (diuji section 25)                                                                                                                            |
| AC61  | Rentang laporan dibatasi agar tidak ada query tanpa batas                                             | ✅ Done — maksimum **92 hari**, konstanta yang sama dengan `utils/params.ts`; rentang lebih panjang dijawab `400`                                                                                                            |
| AC62  | **Petugas** dapat diisi pada jadwal yang sudah `locked`/`published`                                   | ✅ Done — patch `petugasStudentId`-murni diterapkan; dropdown Petugas tidak mengikuti `dayLocked` (diuji section 6 `test-api.mjs` & `outputs/check-petugas-terkunci.mjs` 9/9)                                                |
| AC63  | Pengecualian petugas **tidak** menjadi celah untuk mengubah menu/catatan pada jadwal terbit           | ✅ Done — patch campuran tetap `409 not_editable`; baris `isHoliday=1` juga `409`; korlas kelas lain tetap `403` (diuji section 6)                                                                                          |
| AC64  | Admin dapat mengunduh **rekap akun orang tua** sebagai Excel                                           | ✅ Done — `GET /parents/export?active=` (admin only); nama ortu, peran, kelas, anak, aktif, terkunci, login terakhir                                                                                                        |

| AC65  | Admin dapat **mengunggah kembali** berkas hasil ekspor akun orang tua sebagai impor                   | ✅ Done — `POST /parents/import` (admin only); layout impor = layout ekspor (diuji `outputs/check-import-akun.mjs` 33/33 + `check-import-akun-ui.mjs` 17/17)                                                                  |
| AC66  | Impor **menimpa** akun yang sudah ada dan **membuat baris baru** untuk yang belum ada                  | ✅ Done — upsert per **username** (unik di skema), bukan nama; hasil dilaporkan `{created, updated, skipped}`                                                                                                                 |
| AC67  | Mengunggah ulang berkas ekspor **tidak menghapus** password, status aktif, atau daftar anak            | ✅ Done — sel kosong = "jangan sentuh"; id anak dipertahankan lewat pencocokan nama (`mergeStudentIds`); diuji khusus untuk akun tanpa anak                                                                                   |
| AC68  | Impor selalu melewati **pratinjau** sebelum menulis, dan alasannya dilaporkan per baris                | ✅ Done — `dryRun: true` tidak menulis apa pun; `rows[].reason` memuat alasan tiap baris yang dilewati                                                                                                                        |
| AC69  | Impor akun tertutup bagi selain admin                                                                  | ✅ Done — `requireRole("admin")`; korlas & orang tua dijawab `403` (diuji di `check-import-akun.mjs`)                                                                                                                         |

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
| TanStack Router          | Library routing client-side (v1) — file-based di `src/routes/`, route tree auto-generate                                                                                                                                                                                                            |
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
