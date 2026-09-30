# STORY.md — Panduan Korlas & Admin · Pizza Snack Play

## 1. Intent alignment

- **Audience / occasion:** **koordinator kelas (korlas)** dan **admin sekolah** — mereka orang tua
  juga, bukan staf IT. Dipakai pada **pembekalan korlas menjelang tahun ajaran** dan sebagai
  pegangan saat lupa. Ditayangkan di layar/proyektor, lalu dibagikan lewat grup WhatsApp.
- **Core goal:** setelah melihat, korlas **berani** mengurus jadwal kelasnya sendiri dari awal
  sampai terbit tanpa menelepon developer; **ingat** tiga hal — (1) susun dulu, baru dikunci,
  baru dipublikasikan, (2) tanggal yang petugasnya dibiarkan kosong akan direbut orang tua,
  (3) jadwal yang sudah terbit tidak bisa diedit sendiri — minta admin membuka kunci; dan
  **melakukan** — mencoba menempel jadwal dari teks sekolah pada kesempatan pertama.
- **Deck length:** 16 halaman → kuota hero 3–4 halaman (realisasi **5**: 01 / 09 / 12 / 14 / 16 — lihat
  catatan penyimpangan di *Self-check*).
- **Visual tone:** hangat · jelas · tidak menakutkan · warna brand sekolah. Sama dengan dek
  orang tua (satu keluarga desain), tetapi nadanya lebih "pegangan kerja" daripada "ajakan".
- **Content boundaries:**
  - **Must cover:** apa tugas korlas; beda wewenang admin vs korlas; tiga cara mengisi jadwal
    (pilih menu per hari · Salin Sepekan · tempel teks dari sekolah); menentukan petugas atau
    membiarkannya kosong; urutan kunci → publikasi; aksi massal; **membaca laporan piket**;
    empat hal yang perlu diingat.
  - **Do not cover:** arsitektur teknis, endpoint, nama tabel, migrasi, `dryRun`, JSON, kode HTTP.
    Istilah internal diterjemahkan ke bahasa kerja sehari-hari (`draft` → "masih bisa diubah",
    `locked` → "sudah dikunci", `published` → "sudah terbit ke orang tua").
  - **Off limits:** jangan menyebut harga/biaya; jangan menjanjikan fitur yang belum ada
    (notifikasi, cetak PDF); jangan menyebutkan nama sekolah atau nama siswa yang tidak diketahui.

## 2. Skeleton

**Total 16 halaman · 4 bagian**

| Bagian | Judul | Halaman isi | Halaman pembuka |
| :----- | :---- | :---------- | :-------------- |
| 01 | Peran Anda | 04 | **hlm 3** |
| 02 | Akun & wewenang | 06 | **hlm 5** |
| 03 | Menyusun jadwal | 08, 09, 10 | **hlm 7** |
| 04 | Kunci, publikasi & laporan | 12, 13, 14, 15 | **hlm 11** |

**Kontrak daftar isi ↔ halaman pembuka:** daftar isi (hlm 2) menyatakan 4 bagian → seluruh dek
tepat 4 halaman pembuka `type: section`, bernomor 01..04 berurutan, judul dan rentang halaman
sama persis.

**Penempatan hero:** 01 (sampul) / 09 (tempel teks) / 12 (terkunci lalu terbit) / **14 (laporan
piket)** / 16 (penutup) = 5/16 ≈ 31%. Di antara dua hero selalu ada ≥ 1 halaman Supporting
(12→14 dipisah 13; 14→16 dipisah 15).

**Kurva rhythm:**
`peak · valley · transition · valley · transition · valley · transition · valley · peak · valley · transition · peak · valley · peak · valley · peak`
Tidak ada ≥3 valley berurutan.

**Anggaran layout:** asimetris 7/16 ≈ 44% (≥40% ✓); `N kartu sebaris` hanya 1 kali (hlm 15);
`gambar besar kiri + teks kanan` + `dua kolom asimetris` total 3/16 ≈ 19% (≤40% ✓); tidak ada dua
halaman berturut-turut berlayout sama (14 *teks raksasa* sama dengan 12, tetapi tidak
berturutan — dipisah 13).

## 3. Page outline

| # | title | type | role | rhythm | layout | visual | visual_role | density | anti_pattern | description |
| :- | :---- | :--- | :--- | :----- | :----- | :----- | :---------- | :------ | :----------- | :---------- |
| 01 | Panduan Korlas & Admin | cover | hero | peak | Visual penuh + teks menumpuk garis | app_logo.png + SVG kalender + centang (kanan 45%) | anchor | ~35 kata / 2 gambar / ~38% ruang kosong | Jangan menumpuk teks di tengah seperti poster; jangan mengecilkan logo ke 200×70 di pojok | Sampul: siapa yang memakai panduan ini + satu kalimat janji |
| 02 | Isi panduan ini | catalog | supporting | valley | Judul kiri + isi kanan | L3: lencana nomor ungu | evidence | ~130 kata / 0 gambar / ~25% ruang kosong | Jangan pratinjau empat kartu; jangan hanya daftar judul tanpa kalimat penjelas | Daftar isi: 4 bagian + satu kalimat penjelas + rentang halaman |
| 03 | 01 · Peran Anda | section | transition | transition | Visual penuh + judul besar | L1: geometri SVG abstrak (lingkaran ungu semi-transparan + papan klip) | atmosphere | ~30 kata / 1 gambar / ~45% ruang kosong | Jangan isi dengan paragraf badan | Halaman pembuka 01 |
| 04 | Tiga tugas Anda | content | supporting | valley | Gambar besar kiri + teks kanan | L1: SVG alur tiga langkah (susun · tentukan petugas · umumkan, kiri 55%) | anchor | ~200 kata / 1 gambar / ~22% ruang kosong | Jangan bagi rata 50:50; jangan mengecilkan ilustrasi jadi ikon kecil | Tiga tugas korlas, diurutkan sesuai urutan kerjanya |
| 05 | 02 · Akun & wewenang | section | transition | transition | Visual penuh + judul besar | L1: geometri SVG abstrak (kunci + lencana) | atmosphere | ~30 kata / 1 gambar / ~45% ruang kosong | Jangan isi dengan paragraf | Halaman pembuka 02 |
| 06 | Admin & Korlas: bedanya | content | supporting | valley | Dua kolom asimetris 60:40 | L2: SVG dua kolom wewenang (kanan 40%) | evidence | ~210 kata / 1 gambar / ~22% ruang kosong | Jangan dua kartu sama lebar; jangan hanya menulis nama role tanpa contoh | Yang boleh & tidak boleh korlas — ini yang paling sering ditanyakan |
| 07 | 03 · Menyusun jadwal | section | transition | transition | Visual penuh + judul besar | L1: geometri SVG abstrak (sel kalender + pensil) | atmosphere | ~30 kata / 1 gambar / ~45% ruang kosong | Jangan isi dengan paragraf | Halaman pembuka 03 |
| 08 | Isi menu per hari | content | supporting | valley | Gambar besar atas + kartu bawah | L1: SVG tabel jadwal (atas 58%) + dua kartu 60:40 di bawah | evidence | ~200 kata / 1 gambar / ~20% ruang kosong | Jangan kartu bawah sama lebar; jangan memakai tangkapan layar sebagai latar | Pilih menu per tanggal + Salin Sepekan |
| 09 | Tempel teks dari sekolah | content | hero | peak | Gambar penuh + teks menumpuk garis | L1: SVG dialog teks → pratinjau → jadwal (kanan 55%) | anchor | ~110 kata / 1 gambar / ~40% ruang kosong | Jangan kartu sebaris sama lebar | **Fitur terbaru:** tidak perlu ketik ulang — tempel apa adanya |
| 10 | Petugas piket | content | supporting | valley | Judul kiri + isi kanan | L2: SVG dropdown + nama orang tua (kanan atas 300×220) | evidence | ~190 kata / 1 gambar / ~24% ruang kosong | Jangan empat kartu sama lebar; jangan hanya menulis nama fitur tanpa contoh pemakaian | Pilih dari daftar siswa, atau biarkan kosong supaya direbut orang tua |
| 11 | 04 · Kunci & publikasi | section | transition | transition | Visual penuh + judul besar | L1: geometri SVG abstrak (gembok + pengeras suara) | atmosphere | ~30 kata / 1 gambar / ~45% ruang kosong | Jangan isi dengan paragraf | Halaman pembuka 04 |
| 12 | Terkunci, lalu terbit | content | hero | peak | Teks raksasa + insight | L1: frasa raksasa "Kunci dulu, baru terbit" ≥60px + SVG tiga status | anchor | ~140 kata / 1 gambar / ~40% ruang kosong | Jangan menaruh frasa inti di pojok dengan huruf kecil | Puncak emosi kedua seluruh dek: urutan yang tidak bisa dibalik |
| 13 | Aksi massal | content | supporting | valley | Gambar besar kiri + teks kanan | L1: SVG tabel + kotak centang (kiri 55%) | anchor | ~190 kata / 1 gambar / ~22% ruang kosong | Jangan bagi rata 50:50 | Centang hari atau kelas, lalu satu klik |
| 14 | Laporan piket: sudah merata? | content | hero | peak | Teks raksasa + insight | L1: frasa raksasa "Merata, bukan sekadar penuh." ≥60px + SVG rekap batang per orang tua (kanan 45%) | anchor | ~120 kata / 1 gambar / ~40% ruang kosong | Jangan menaruh frasa inti di pojok dengan huruf kecil; jangan memakai angka karangan | **Fitur terbaru:** rekap berapa kali tiap orang tua ambil piket + daftar yang belum pernah ambil |
| 15 | Empat hal yang perlu diingat | content | supporting | valley | N kartu sebaris (satu-satunya di dek ini) | L3: satu ikon per kartu (32px, seragam) | evidence | ~230 kata (≥ 55 per kartu) / 0 gambar / ~22% ruang kosong | Jangan kartu yang hanya berisi judul; jangan ukuran ikon tidak seragam | Penutup: empat jebakan yang paling sering terjadi — **diperbaiki v1.13:** petugas masih bisa diisi setelah terbit, yang terkunci menu & catatannya |
| 16 | Terima kasih | ending | hero | peak | Visual penuh + judul besar | L1: app_logo.png (tengah 200×200) + SVG pendar cahaya | anchor | ~45 kata / 1 gambar / ~45% ruang kosong | Jangan menaruh placeholder kontak | Penutup: ajakan mencoba impor teks minggu ini, lalu memeriksa Laporannya |

### Di mana angka mendarat

Dek ini tidak memuat data KPI bisnis, jadi tidak ada persentase yang dikarang. Dua titik "terasa
angka" berasal dari fakta produk:

- Hlm 09: tidak memajang angka, melainkan perbandingan "satu kali tempel" melawan "ketik ulang
  20 hari". **Penilaian:** nilai fitur ini ada pada penghapusan pekerjaan ulang, bukan pada
  kecepatan.
- Hlm 12: frasa raksasa alih-alih angka. **Penilaian:** urutan tiga status tidak bisa dibalik, dan
  justru itu yang paling sering membuat korlas bingung.
- Hlm 14: **angka yang ditampilkan adalah contoh, bukan data nyata** — 4/3/2/1/0 pada ilustrasi
  rekap. Sengaja tidak dikarang dalam bentuk "78% orang tua sudah merata", karena dek ini tidak
  memuat data KPI. **Penilaian:** korlas hanya perlu melihat *bentuk* laporannya; angkanya akan
  terisi sendiri begitu ia membuka menunya.

### Self-check

- ⚠️ Hero = **5/16 ≈ 31%** — sedikit di atas rentang 20–30%. **Penyimpangan yang disengaja dan
  dicatat:** halaman 14 memperkenalkan fitur baru (Laporan piket) yang menjadi alasan dek ini
  diperbarui, sehingga diberi perlakuan hero. Menjadikannya Supporting akan melahirkan tiga
  valley berurutan (13·14·15), yang lebih merusak ritme daripada kelebihan satu hero.
- ✅ Tidak ada ≥3 valley berurutan
- ✅ `N kartu sebaris` hanya 1 kali
- ✅ Layout asimetris 7/16 ≈ 44% ≥ 40%
- ✅ Tidak ada dua halaman berturut-turut berlayout sama
- ✅ `gambar besar kiri + teks kanan` + `dua kolom asimetris` total 3/16 ≈ 19% ≤ 40%
- ✅ Setiap halaman punya role / rhythm / visual_role / anti_pattern
- ✅ 4 bagian ↔ 4 halaman pembuka, nomor 01..04 berurutan

## 5. Riwayat sinkronisasi

| Tanggal | Versi aplikasi | Yang disesuaikan |
| :------ | :------------- | :--------------- |
| 2026-09-29 | v1.12 | Dek dibuat: 15 halaman, 4 bagian, hero 4/15 |
| 2026-09-30 | v1.13 | **Dek diperluas ke 16 halaman.** **Hlm 14 baru — "Laporan piket: sudah merata?"** (hero): rekap jumlah ambil per orang tua + daftar *belum pernah ambil*. Bagian 04 diganti namanya menjadi "Kunci, publikasi & laporan" (hlm 12–15) dan daftar isi hlm 02 diperbarui. **Hlm 15** dikoreksi: kartu 1 sebelumnya menyatakan petugas "tidak bisa diubah lagi" setelah terbit — sejak v1.13 **petugas justru masih bisa diisi** pada jadwal terbit; yang terkunci tetap menu & catatan. **Hlm 16** ajakan penutup kini menyebut Laporan. Seluruh nomor halaman di bilah kaki menjadi `NN / 16`. |

## 4. Sumber fakta

Semua klaim di dek ini diambil dari kondisi aplikasi **v1.13** (30 September 2026):

- `README.md` § Fitur & § Catatan Teknis — wewenang role, siklus `draft → locked → published`.
- `src/api/schedules/route.ts` — `POST /schedules/lock` & `/publish` memakai `scheduleWriters`
  (admin **dan** korlas); `POST /schedules/:id/unlock` & `/bulk/unlock` khusus `admin`.
- `src/components/jadwal/MonthToolbar.tsx` — tombol **Kunci bulan**, **Publikasi**,
  **Salin Sepekan**, **Impor Jadwal** tampil untuk korlas; **Hari libur** hanya admin.
- `src/api/schedules/importParser.ts` — format teks yang diterima: blok rentang tanggal, lalu
  baris `Hari : menu`.
- `src/components/jadwal/ImportDialog.tsx` — dua langkah: Pratinjau → Impor.
- `src/routes/_app/pilih-jadwal.tsx` — badge "Ditetapkan korlas" untuk tanggal yang petugasnya
  sudah diisi korlas (tidak ikut direbutkan).
- `src/api/laporan/service.ts` — cakupan laporan: admin tanpa kelas = seluruh sekolah, korlas
  **hanya kelasnya sendiri** (kelas lain `403`). Dasar klaim hlm 14.
- `src/api/laporan/repository.ts` — `claimsBetween()` (rekap per orang tua, sumbernya
  `schedule_claims` yang sama dengan Pilih Jadwal) dan `parentsWithStudents()` (daftar *belum
  pernah ambil*, dihitung dari `students` bukan dari ketiadaan baris klaim).
- `src/api/schedules/service.ts` — pengecualian **patch petugas-murni** pada baris
  `locked`/`published`: `petugasStudentId` sendiri tetap diterapkan, patch campuran tetap
  `409 not_editable`. Dasar koreksi kartu 1 hlm 15.
- `src/components/jadwal/DayRow.tsx` — `DayRowPetugas` menerima `locked` hanya untuk teks
  `title`, bukan `disabled`; menu & catatan tetap mengikuti `dayLocked`.
