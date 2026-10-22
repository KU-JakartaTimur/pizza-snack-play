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
- **Deck length:** 19 halaman → kuota hero 3–4 halaman (realisasi **5**: 01 / 10 / 13 / 16 / 19 — lihat
  catatan penyimpangan di *Self-check*).
- **Visual tone:** hangat · jelas · tidak menakutkan · warna brand sekolah. Sama dengan dek
  orang tua (satu keluarga desain), tetapi nadanya lebih "pegangan kerja" daripada "ajakan".
- **Content boundaries:**
  - **Must cover:** apa tugas korlas; beda wewenang admin vs korlas; tiga cara mengisi jadwal
    (pilih menu per hari · Salin Sepekan · tempel teks dari sekolah); menentukan petugas atau
    membiarkannya kosong; **memperbarui banyak akun orang tua sekaligus lewat berkas Excel**;
    urutan kunci → publikasi; aksi massal; **memantau keterisian bulan berjalan**; **membaca laporan
    piket**; **mengirim pengingat piket lewat WhatsApp**; empat hal yang perlu diingat.
  - **Do not cover:** arsitektur teknis, endpoint, nama tabel, migrasi, `dryRun`, JSON, kode HTTP.
    Istilah internal diterjemahkan ke bahasa kerja sehari-hari (`draft` → "masih bisa diubah",
    `locked` → "sudah dikunci", `published` → "sudah terbit ke orang tua"); penyedia gateway
    WhatsApp tidak pernah disebut namanya — cukup "nomor sekolah sudah tersambung".
  - **Off limits:** jangan menyebut harga/biaya; jangan menjanjikan fitur yang belum ada
    (pengingat otomatis terjadwal, cetak PDF); jangan menyebutkan nama sekolah atau nama siswa
    yang tidak diketahui.

## 2. Skeleton

**Total 19 halaman · 4 bagian**

| Bagian | Judul | Halaman isi | Halaman pembuka |
| :----- | :---- | :---------- | :-------------- |
| 01 | Peran Anda | 04 | **hlm 3** |
| 02 | Akun & wewenang | 06, 07 | **hlm 5** |
| 03 | Menyusun jadwal | 09, 10, 11 | **hlm 8** |
| 04 | Kunci, publikasi & laporan | 13, 14, 15, 16, 17, 18 | **hlm 12** |

**Kontrak daftar isi ↔ halaman pembuka:** daftar isi (hlm 2) menyatakan 4 bagian → seluruh dek
tepat 4 halaman pembuka `type: section`, bernomor 01..04 berurutan, judul dan rentang halaman
sama persis.

**Penempatan hero:** 01 (sampul) / 10 (tempel teks) / 13 (terkunci lalu terbit) / **16 (laporan
piket)** / 19 (penutup) = 5/19 ≈ 26%. Di antara dua hero selalu ada ≥ 1 halaman Supporting
(13→16 dipisah 14 dan 15; 16→19 dipisah 17 dan 18).

**Kurva rhythm:**
`peak · valley · transition · valley · transition · valley · valley · transition · valley · peak · valley · transition · peak · valley · valley · peak · valley · valley · peak`
Tidak ada ≥3 valley berurutan — ada **tiga** pasang valley bersebelahan (hlm 06–07, hlm 14–15,
dan hlm 17–18), semuanya masih di batas.

**Anggaran layout:** asimetris 9/19 ≈ 47% (≥40% ✓); `N kartu sebaris` **sebagai layout halaman**
tetap 1 kali (hlm 18) — hlm 15 memang memuat empat kotak angka sebaris, tetapi itu isi **tiruan
panel aplikasi**, bukan layout halamannya, jadi tidak dihitung; `gambar besar kiri + teks kanan`
+ `dua kolom asimetris` total 5/19 ≈ 26% (≤40% ✓); tidak ada dua halaman berturut-turut
berlayout sama (16 *teks raksasa* sama dengan 13, tetapi tidak berturutan — dipisah 14 dan 15;
17 *gambar besar kiri + teks kanan* sama dengan 14, dipisah 15 dan 16).

## 3. Page outline

| # | title | type | role | rhythm | layout | visual | visual_role | density | anti_pattern | description |
| :- | :---- | :--- | :--- | :----- | :----- | :----- | :---------- | :------ | :----------- | :---------- |
| 01 | Panduan Korlas & Admin | cover | hero | peak | Visual penuh + teks menumpuk garis | app_logo.png + SVG kalender + centang (kanan 45%) | anchor | ~35 kata / 2 gambar / ~38% ruang kosong | Jangan menumpuk teks di tengah seperti poster; jangan mengecilkan logo ke 200×70 di pojok | Sampul: siapa yang memakai panduan ini + satu kalimat janji |
| 02 | Isi panduan ini | catalog | supporting | valley | Judul kiri + isi kanan | L3: lencana nomor ungu | evidence | ~130 kata / 0 gambar / ~25% ruang kosong | Jangan pratinjau empat kartu; jangan hanya daftar judul tanpa kalimat penjelas | Daftar isi: 4 bagian + satu kalimat penjelas + rentang halaman |
| 03 | 01 · Peran Anda | section | transition | transition | Visual penuh + judul besar | L1: geometri SVG abstrak (lingkaran ungu semi-transparan + papan klip) | atmosphere | ~30 kata / 1 gambar / ~45% ruang kosong | Jangan isi dengan paragraf badan | Halaman pembuka 01 |
| 04 | Tiga tugas Anda | content | supporting | valley | Gambar besar kiri + teks kanan | L1: SVG alur tiga langkah (susun · tentukan petugas · umumkan, kiri 55%) | anchor | ~200 kata / 1 gambar / ~22% ruang kosong | Jangan bagi rata 50:50; jangan mengecilkan ilustrasi jadi ikon kecil | Tiga tugas korlas, diurutkan sesuai urutan kerjanya |
| 05 | 02 · Akun & wewenang | section | transition | transition | Visual penuh + judul besar | L1: geometri SVG abstrak (kunci + lencana) | atmosphere | ~30 kata / 1 gambar / ~45% ruang kosong | Jangan isi dengan paragraf | Halaman pembuka 02 |
| 06 | Admin & Korlas: bedanya | content | supporting | valley | Dua kolom asimetris 60:40 | L2: SVG dua kolom wewenang (kanan 40%) | evidence | ~210 kata / 1 gambar / ~22% ruang kosong | Jangan dua kartu sama lebar; jangan hanya menulis nama role tanpa contoh | Yang boleh & tidak boleh korlas — ini yang paling sering ditanyakan |
| 07 | Kelola akun orang tua sekaligus | content | supporting | valley | Gambar besar kiri + teks kanan | L1: SVG berkas Excel → pratinjau → daftar akun (kiri 55%) | anchor | ~190 kata / 1 gambar / ~22% ruang kosong | Jangan bagi rata 50:50; jangan menyebut nama kolom teknis, JSON, atau istilah mesin | **Fitur terbaru:** admin memperbarui banyak akun sekaligus dari berkas hasil Ekspor — yang ada ditimpa, yang baru ditambah |
| 08 | 03 · Menyusun jadwal | section | transition | transition | Visual penuh + judul besar | L1: geometri SVG abstrak (sel kalender + pensil) | atmosphere | ~30 kata / 1 gambar / ~45% ruang kosong | Jangan isi dengan paragraf | Halaman pembuka 03 |
| 09 | Isi menu per hari | content | supporting | valley | Gambar besar atas + kartu bawah | L1: SVG tabel jadwal (atas 58%) + dua kartu 60:40 di bawah | evidence | ~200 kata / 1 gambar / ~20% ruang kosong | Jangan kartu bawah sama lebar; jangan memakai tangkapan layar sebagai latar | Pilih menu per tanggal + Salin Sepekan |
| 10 | Tempel teks dari sekolah | content | hero | peak | Gambar penuh + teks menumpuk garis | L1: SVG dialog teks → pratinjau → jadwal (kanan 55%) | anchor | ~110 kata / 1 gambar / ~40% ruang kosong | Jangan kartu sebaris sama lebar | **Fitur terbaru:** tidak perlu ketik ulang — tempel apa adanya |
| 11 | Petugas piket | content | supporting | valley | Judul kiri + isi kanan | L2: SVG dropdown + nama orang tua (kanan atas 300×220) | evidence | ~190 kata / 1 gambar / ~24% ruang kosong | Jangan empat kartu sama lebar; jangan hanya menulis nama fitur tanpa contoh pemakaian | Pilih dari daftar siswa, atau biarkan kosong supaya direbut orang tua |
| 12 | 04 · Kunci & publikasi | section | transition | transition | Visual penuh + judul besar | L1: geometri SVG abstrak (gembok + pengeras suara) | atmosphere | ~30 kata / 1 gambar / ~45% ruang kosong | Jangan isi dengan paragraf | Halaman pembuka 04 |
| 13 | Terkunci, lalu terbit | content | hero | peak | Teks raksasa + insight | L1: frasa raksasa "Kunci dulu, baru terbit" ≥60px + SVG tiga status | anchor | ~140 kata / 1 gambar / ~40% ruang kosong | Jangan menaruh frasa inti di pojok dengan huruf kecil | Puncak emosi kedua seluruh dek: urutan yang tidak bisa dibalik |
| 14 | Aksi massal | content | supporting | valley | Gambar besar kiri + teks kanan | L1: SVG tabel + kotak centang (kiri 55%) | anchor | ~190 kata / 1 gambar / ~22% ruang kosong | Jangan bagi rata 50:50 | Centang hari atau kelas, lalu satu klik |
| 15 | Keterangan bulan: sudah berapa yang terisi? | content | supporting | valley | Kartu putih lebar (tiruan panel) + jalur bawah | L1: empat kotak angka + bilah kemajuan di dalam tiruan panel Keterangan | evidence | ~150 kata / 1 gambar / ~22% ruang kosong | Jangan menjadikan empat kartu sebaris sebagai layout halaman; jangan menyiratkan panel ini untuk orang tua | **Fitur terbaru:** panel Keterangan bulan di halaman Pilih Jadwal — hanya korlas & admin |
| 16 | Laporan piket: sudah merata? | content | hero | peak | Teks raksasa + insight | L1: frasa raksasa "Merata, bukan sekadar penuh." ≥60px + SVG rekap batang per orang tua (kanan 45%) | anchor | ~120 kata / 1 gambar / ~40% ruang kosong | Jangan menaruh frasa inti di pojok dengan huruf kecil; jangan memakai angka karangan | **Fitur terbaru:** rekap berapa kali tiap orang tua ambil piket + daftar yang belum pernah ambil |
| 17 | Mengabari orang tua lewat WhatsApp | content | supporting | valley | Gambar besar kiri + teks kanan | L1: SVG tiruan kartu Notifikasi WhatsApp (kiri 55%) + empat butir di kanan | anchor | ~200 kata / 1 gambar / ~20% ruang kosong | Jangan bagi rata 50:50; jangan menyebut nama penyedia gateway, token, atau istilah mesin | **Fitur terbaru:** pengingat piket H-1 dan konfirmasi otomatis lewat WhatsApp — korlas hanya kelasnya, riwayat menyimpan alasan gagal |
| 18 | Empat hal yang perlu diingat | content | supporting | valley | N kartu sebaris (satu-satunya di dek ini) | L3: satu ikon per kartu (32px, seragam) | evidence | ~230 kata (≥ 55 per kartu) / 0 gambar / ~22% ruang kosong | Jangan kartu yang hanya berisi judul; jangan ukuran ikon tidak seragam | Penutup: empat jebakan yang paling sering terjadi — **diperbaiki v1.13:** petugas masih bisa diisi setelah terbit, yang terkunci menu & catatannya |
| 19 | Terima kasih | ending | hero | peak | Visual penuh + judul besar | L1: app_logo.png (tengah 200×200) + SVG pendar cahaya | anchor | ~45 kata / 1 gambar / ~45% ruang kosong | Jangan menaruh placeholder kontak | Penutup: ajakan mencoba impor teks minggu ini, lalu memeriksa Laporannya |

### Di mana angka mendarat

Dek ini tidak memuat data KPI bisnis, jadi tidak ada persentase yang dikarang. Dua titik "terasa
angka" berasal dari fakta produk:

- Hlm 10: tidak memajang angka, melainkan perbandingan "satu kali tempel" melawan "ketik ulang
  20 hari". **Penilaian:** nilai fitur ini ada pada penghapusan pekerjaan ulang, bukan pada
  kecepatan.
- Hlm 13: frasa raksasa alih-alih angka. **Penilaian:** urutan tiga status tidak bisa dibalik, dan
  justru itu yang paling sering membuat korlas bingung.
- Hlm 16: **angka yang ditampilkan adalah contoh, bukan data nyata** — 4/3/2/1/0 pada ilustrasi
  rekap. Sengaja tidak dikarang dalam bentuk "78% orang tua sudah merata", karena dek ini tidak
  memuat data KPI. **Penilaian:** korlas hanya perlu melihat *bentuk* laporannya; angkanya akan
  terisi sendiri begitu ia membuka menunya.
- Hlm 07: **angka pada ilustrasi pratinjau (Dibuat 2 · Diperbarui 34 · Dilewati 1) juga contoh,
  bukan data sekolah.** **Penilaian:** yang perlu ditangkap admin adalah *bentuk* pratinjaunya —
  ada tiga angka yang muncul sebelum apa pun tersimpan.
- Hlm 15: **angka pada tiruan panel (12 · 5 · 3 · 20 → 85%) juga contoh, bukan data
  sekolah.** **Penilaian:** yang perlu ditangkap korlas adalah *bentuk* panelnya — empat angka yang
  langsung menjawab "sudah berapa yang terisi", lalu satu bilah kemajuan yang menutupnya.
- Hlm 17: **"1 terkirim · 0 gagal", "1 Sep 2026", dan "30 Agu 2026" juga contoh, bukan data
  sekolah.** **Penilaian:** yang perlu ditangkap korlas adalah bahwa hasil kirim **dihitung**, dan
  bahwa baris yang gagal **menyebut alasannya** — bukan sekadar tulisan "gagal".

### Self-check

- ⚠️ Hero = **5/19 ≈ 26%** — masih di dalam rentang 20–30%, dan justru **membaik** setelah halaman
  baru masuk. **Catatan lama tetap berlaku:** halaman **16** (Laporan piket) diberi perlakuan hero
  karena ia memperkenalkan fitur baru; menjadikannya Supporting akan melahirkan tiga valley
  berurutan, yang lebih merusak ritme daripada kelebihan satu hero.
- ⚠️ Tiga pasang valley bersebelahan: hlm **06–07** (halaman baru masuk ke bagian 02, yang
  sebelumnya hanya punya satu halaman isi), hlm **14–15** (hlm 15 baru masuk ke bagian 04, tepat
  di antara "Aksi massal" dan hero "Laporan piket"), dan hlm **17–18** (hlm 17 baru masuk setelah
  hero "Laporan piket"). **Penyimpangan yang dicatat:** menaikkan hlm 07, 15, atau 17 menjadi hero
  akan melewati kuota hero yang sudah di ambang, dan menandainya `transition` tidak jujur —
  ketiganya memuat isi, bukan membuka bagian. Tiga valley masih di dalam batas (larangan hanya ≥3).
- ✅ Tidak ada ≥3 valley berurutan
- ✅ `N kartu sebaris` sebagai layout halaman hanya 1 kali (hlm 18)
- ✅ Layout asimetris 9/19 ≈ 47% ≥ 40%
- ✅ Tidak ada dua halaman berturut-turut berlayout sama
- ✅ `gambar besar kiri + teks kanan` + `dua kolom asimetris` total 5/19 ≈ 26% ≤ 40%
- ✅ Setiap halaman punya role / rhythm / visual_role / anti_pattern
- ✅ 4 bagian ↔ 4 halaman pembuka, nomor 01..04 berurutan

## 5. Riwayat sinkronisasi

| Tanggal | Versi aplikasi | Yang disesuaikan |
| :------ | :------------- | :--------------- |
| 2026-09-29 | v1.12 | Dek dibuat: 15 halaman, 4 bagian, hero 4/15 |
| 2026-09-30 | v1.13 | **Dek diperluas ke 16 halaman.** **Hlm 14 baru — "Laporan piket: sudah merata?"** (hero): rekap jumlah ambil per orang tua + daftar *belum pernah ambil*. Bagian 04 diganti namanya menjadi "Kunci, publikasi & laporan" (hlm 12–15) dan daftar isi hlm 02 diperbarui. **Hlm 15** dikoreksi: kartu 1 sebelumnya menyatakan petugas "tidak bisa diubah lagi" setelah terbit — sejak v1.13 **petugas justru masih bisa diisi** pada jadwal terbit; yang terkunci tetap menu & catatan. **Hlm 16** ajakan penutup kini menyebut Laporan. Seluruh nomor halaman di bilah kaki menjadi `NN / 16`. |
| 2026-10-01 | v1.14 | **Dek diperluas ke 17 halaman.** **Hlm 07 baru — "Kelola akun orang tua sekaligus"** (supporting): cara admin memperbarui banyak akun sekaligus dari berkas Excel — unduh daftar lewat Ekspor, sunting, unggah kembali; yang usernamenya sudah ada **ditimpa**, yang belum **ditambah**; sel kosong tidak mengubah data; selalu ada pratinjau sebelum apa pun tersimpan. Halaman ini masuk ke **bagian 02 (Akun & wewenang)**, yang sebelumnya hanya punya satu halaman isi. Halaman 07–16 lama bergeser menjadi 08–17 dan seluruh nomor di bilah kaki menjadi `NN / 17`. Daftar isi hlm 02, tabel *Page outline*, kurva ritme, dan anggaran layout di dokumen ini ikut disesuaikan. |
| 2026-10-12 | v1.16 | **Dek diperluas ke 18 halaman.** **Hlm 15 baru — "Keterangan bulan: sudah berapa yang terisi?"** (supporting): panel **Keterangan <bulan>** di halaman Pilih Jadwal yang hanya dirender untuk **korlas & admin** — empat angka (sudah diambil · ditetapkan korlas · masih kosong · total tanggal) plus bilah kemajuan "x dari y tanggal sudah ada petugas". Halaman 15–17 lama bergeser menjadi 16–18 dan seluruh nomor di bilah kaki menjadi `NN / 18`. **Hlm 06** dikoreksi: kartu "Tetap wewenang admin" kini menyebut katalog menu, kategori, **dan gambarnya**. Daftar isi hlm 02 menyebut rentang bagian 04 sebagai `13–17` dengan ringkasan "Kunci–terbit, aksi massal, pantauan, lalu rekap piket". |
| 2026-10-15 | v1.18 | **Diperiksa, sengaja tidak diubah — dek tetap 18 halaman.** Fitur barunya (kartu "Petugas Piket" di `/hari-ini`, daftar petugas **semua kelas** untuk setiap role) memang menyentuh halaman yang paling dekat dengan admin, tetapi dek ini **tidak pernah menyebut halaman Hari Ini sama sekali** — tidak ada satu pun kata "Hari Ini" di 18 halaman ini. Hlm 11 ("Petugas piket") mengajarkan cara **menentukan** petugas dari halaman Pilih Jadwal, dan itu tidak berubah: yang baru hanyalah tempat **melihat** hasilnya. Tidak ada kalimat, angka, atau tangkapan layar di dek ini yang menjadi keliru. Tabel riwayat di dokumen ini sekaligus dirapikan: baris kosong yang membelah tabel sejak v1.16 dihapus. |
| 2026-10-15 | v1.21 | **Diperiksa, sengaja tidak diubah — dek tetap 18 halaman.** Halaman depan publik (`/`) hanya menyentuh pengunjung yang belum punya akun; seluruh alur korlas & admin di dek ini berjalan sesudah masuk, dan tidak ada satu pun halaman di sini yang membahas layar sebelum login. |
| 2026-10-21 | v1.23 | **Dek diperluas ke 19 halaman.** **Hlm 17 baru — "Mengabari orang tua lewat WhatsApp"** (supporting): kartu **Notifikasi WhatsApp** di Dashboard — pilih tanggal lalu tekan Kirim, pengingat berangkat ke wali petugas hari itu; korlas hanya bisa mengirim untuk kelasnya, admin boleh semua kelas; konfirmasi terkirim sendiri begitu orang tua mengambil tanggal; dan riwayat menyimpan **alasan** kegagalan. Halaman ini masuk ke **bagian 04 (Kunci, publikasi & laporan)**, tepat setelah hero "Laporan piket". Halaman 17–18 lama bergeser menjadi 18–19 dan seluruh nomor di bilah kaki menjadi `NN / 19`. Daftar isi hlm 02 menyebut rentang bagian 04 sebagai `13–18` dengan tambahan "lalu pengingat WhatsApp". **Batas isi dikoreksi:** larangan lama "jangan menjanjikan notifikasi" dicabut — notifikasinya kini ada; yang masih dilarang adalah menjanjikan pengingat **terjadwal otomatis**, yang memang belum dibuat. |

## 4. Sumber fakta

Semua klaim di dek ini diambil dari kondisi aplikasi **v1.23** (21 Oktober 2026):

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
- `src/api/parents/route.ts` — `POST /parents/import` memakai `requireAuth` + `requireRole("admin")`.
  Dasar klaim "khusus admin" pada kartu 1 hlm 07.
- `src/api/parents/service.ts` — `importAccounts()`: akun dicocokkan per **username** (unik di
  skema), bukan nama orang tua; password, status aktif, dan daftar anak hanya ditulis bila kolomnya
  **berisi** — sel kosong dilewati. Dasar klaim kartu 2 hlm 07.
- `src/api/parents/controller.ts` — respons pratinjau memuat `{created, updated, skipped}` dan
  `dryRun: true` tidak menulis apa pun. Dasar klaim kartu 3 hlm 07.
- `src/components/ImportButton.tsx` & `src/routes/_app/orang-tua.tsx` — tombol **Impor** ada di
  header halaman Akun Orang Tua; alurnya pilih berkas → pratinjau → **Terapkan**.
- `src/routes/_app/pilih-jadwal.tsx` — `showSnapshot = isAdmin || isKorlas`: panel Keterangan
  hanya dirender untuk korlas & admin, dan admin melihatnya **tanpa** papan tanggal karena ia tidak
  ikut mengambil. Dasar hlm 15.
- `src/components/pilih-jadwal/MonthSnapshot.tsx` — judul `Keterangan {bulan} {tahun}`, empat kotak
  angka (Sudah diambil · Ditetapkan korlas · Masih kosong · Total tanggal), lalu bilah kemajuan
  "x dari y tanggal sudah ada petugas". Dasar tata letak tiruan panel di hlm 15.
- `src/components/pilih-jadwal/summary.ts` — `isClaimableDay()` (hanya `published`, bukan libur,
  punya entri jadwal) dan `summarizeMonth()` yang menghitung `taken`/`assigned`/`empty`/
  `filledPercent`. Angka contoh di hlm 15 (12 · 5 · 3 · 20 → 85%) mengikuti rumus itu.
- `src/api/catalog/route.ts` — `catalogWriters = requireRole("admin")`: katalog menu & kategori
  hanya dapat **diubah** admin; korlas membacanya. Dasar kartu "Tetap wewenang admin" di hlm 06.
- `src/components/kategori/CategoryThumb.tsx` — gambar kategori dipakai bila ada, kalau belum jatuh
  ke kotak warna. Dasar kata "dan gambarnya" pada kartu yang sama.
- `src/components/notifications/WhatsAppBroadcastCard.tsx` — bentuk kartu **Notifikasi WhatsApp**:
  status gateway di kepala kartu, dua tab (**Broadcast** / **Pengingat piket**), pemilih kelas,
  tanggal bawaan besok, ringkasan "x sukses, y gagal", lalu riwayat yang menampilkan
  `errorMessage`. Dasar tata letak tiruan kartu di hlm 17.
- `src/api/whatsapp/route.ts` — `requireRole("admin", "korlas")` untuk `broadcast`/`petugas`,
  `requireRole("admin")` hanya untuk pesan uji. Dasar klaim "korlas hanya kelasnya, admin semua
  kelas" pada butir kedua hlm 17.
- `src/api/whatsapp/service.ts` — `remindPetugas()` menyusun satu pesan per penerima; `broadcast()`
  dan `remindPetugas()` sama-sama menyimpan `sentCount` hasil nyata. Dasar kalimat "1 terkirim ·
  0 gagal" pada tiruan hlm 17.
- `src/api/whatsapp/templates.ts` — isi pesan: sapaan wali, nama anak, tanggal panjang, dan nama
  menu. Dasar contoh pesan pada hlm 17.
- `src/api/claims/controller.ts` — konfirmasi dikirim lewat `c.executionCtx.waitUntil()` sesudah
  klaim tersimpan. Dasar kalimat "konfirmasi berjalan sendiri" pada hlm 17.
- `src/api/whatsapp/recipients.ts` — nomor dinormalkan dan dideduplikasi sebelum dikirim, sehingga
  wali yang tercatat dua kali hanya menerima satu pesan.
