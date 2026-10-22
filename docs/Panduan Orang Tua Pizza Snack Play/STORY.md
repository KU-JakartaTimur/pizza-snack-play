# STORY.md — Panduan Orang Tua · Pizza Snack Play

## 1. Intent alignment

- **Audience / occasion:** orang tua murid SD (Bapak/Ibu wali murid), pada **pertemuan sosialisasi awal tahun ajaran**. Mereka bukan pengguna teknis — mayoritas memakai HP Android, sebagian belum pernah memasang aplikasi sendiri. Ditayangkan di layar/proyektor, lalu dibagikan lewat grup WhatsApp kelas.
- **Core goal:** setelah melihat, orang tua **percaya** bahwa aplikasi ini membuat hidup mereka lebih mudah; **ingat** tiga hal — (1) jadwal snack bisa dilihat kapan saja, (2) tanggal piket kosong bisa diambil sendiri, (3) butuh akun dari sekolah; dan **melakukan** — memasang aplikasi ke layar utama HP lalu login.
- **Deck length:** 16 halaman → kuota hero 3–4 halaman (realisasi 4: 01 / 05 / 11 / 16).
- **Visual tone:** hangat · ramah · sederhana · tidak menakutkan · warna brand sekolah.
- **Content boundaries:**
  - **Must cover:** masalah lama yang mereka rasakan sendiri; cara pasang & login; melihat jadwal;
    mengambil tanggal piket; **kabar otomatis lewat WhatsApp**; mencari menu; empat hal yang perlu
    diingat.
  - **Do not cover:** arsitektur teknis, endpoint, database, status `draft/locked/published`, role
    `admin/korlas/parent` secara teknis, migrasi, pengujian — semua ini membuat orang tua bingung.
    Istilah internal yang muncul di aplikasi diterjemahkan ke bahasa sehari-hari ("dipublikasi" →
    "sudah diumumkan"); nama penyedia gateway WhatsApp tidak pernah disebut.
  - **Off limits:** jangan menyebut harga/biaya; jangan menjanjikan fitur yang belum ada (pengingat
    terjadwal per jam, cetak PDF); jangan menyebutkan nama siswa/sekolah yang tidak diketahui.

## 2. Skeleton

**Total 16 halaman · 4 bagian**

| Bagian | Judul | Halaman isi | Halaman pembuka |
| :----- | :---- | :---------- | :-------------- |
| 01 | Kenapa ada aplikasi ini | 04, 05 | **hlm 3** |
| 02 | Cara mulai | 07, 08 | **hlm 6** |
| 03 | Dipakai tiap hari | 10, 11, 12, 13 | **hlm 9** |
| 04 | Yang perlu diingat | 15 | **hlm 14** |

**Kontrak daftar isi ↔ halaman pembuka:** daftar isi (hlm 2) menyatakan 4 bagian → seluruh dek
tepat 4 halaman pembuka `type: section`, bernomor 01..04 berurutan, judul dan rentang halaman
sama persis.

**Penempatan hero:** 01 (sampul) / 05 (satu aplikasi) / 11 (siapa cepat dia dapat) / 16 (penutup)
= 4/16 = 25%. Di antara dua hero selalu ada ≥ 1 halaman Supporting (1→5 berjarak 3 halaman;
5→11 berjarak 5 halaman; 11→16 berjarak 4 halaman).

**Kurva rhythm:**
`peak · valley · transition · valley · peak · transition · valley · valley · transition · valley · peak · valley · valley · transition · valley · peak`
Tidak ada ≥3 valley berurutan (07·08 dua valley, diputus 09 transition; 12·13 dua valley, diputus
14 transition).

**Anggaran layout:** asimetris 9/16 ≈ 56% (≥40% ✓); simetris 7 halaman dengan `N kartu sebaris`
hanya 1 kali (hlm 15); `gambar besar kiri + teks kanan` + `dua kolom asimetris` total 3 kali
≈ 19% (≤40% ✓); tidak ada dua halaman berturut-turut berlayout sama (hlm 07 dan 12 sama-sama
*gambar besar kiri + teks kanan*, tetapi dipisah 08–11).

## 3. Page outline

| # | title | type | role | rhythm | layout | visual | visual_role | density | anti_pattern | description |
| :- | :---- | :--- | :--- | :----- | :----- | :----- | :---------- | :------ | :----------- | :---------- |
| 01 | Pizza Snack Play | cover | hero | peak | Visual penuh + teks menumpuk garis | L1: app_logo.png + ilustrasi SVG pizza/kalender (kanan 45%) | anchor | ~30 kata / 2 gambar / ~38% ruang kosong | Jangan menumpuk teks di tengah seperti poster; jangan mengecilkan logo ke 200×70 di pojok | Sampul: nama brand + satu kalimat janji "jadwal snack anak, langsung kelihatan di HP" |
| 02 | Isi panduan ini | catalog | supporting | valley | Judul kiri + isi kanan | L3: lencana nomor ungu | evidence | ~130 kata / 0 gambar / ~25% ruang kosong | Jangan pratinjau empat kartu; jangan hanya daftar judul tanpa kalimat penjelas | Daftar isi: 4 bagian + satu kalimat penjelas + rentang halaman, supaya orang tua tahu urutannya |
| 03 | 01 · Kenapa ada aplikasi ini | section | transition | transition | Visual penuh + judul besar | L1: geometri SVG abstrak (lingkaran ungu semi-transparan + grid kalender) | atmosphere | ~30 kata / 1 gambar / ~45% ruang kosong | Jangan isi dengan paragraf badan; jangan pratinjau empat kartu | Halaman pembuka 01: akui dulu "selama ini repot", baru tawarkan solusi |
| 04 | Dulu, begini masalahnya | content | supporting | valley | Dua kolom asimetris 60:40 | L1: SVG grup chat kacau + jadwal kertas (kiri 60%) | anchor | ~190 kata / 1 gambar / ~22% ruang kosong | Jangan bagi rata 50:50; jangan mengecilkan ilustrasi jadi ikon kecil | Tiga masalah nyata yang mereka alami: tanya-tanya menu ke grup · tidak ada riwayat · rebutan tanggal piket yang bikin dua orang merasa sudah dapat |
| 05 | Sekarang: cukup satu aplikasi | content | hero | peak | Gambar penuh + teks menumpuk garis | L1: SVG papan ponsel (Hari Ini/Minggu Ini) kanan 55% | anchor | ~90 kata / 1 gambar / ~42% ruang kosong | Jangan kartu sebaris sama lebar; jangan mengecilkan ilustrasi ponsel jadi hiasan | Satu aplikasi menggantikan grup & kertas: menu jelas, giliran jelas, tidak perlu tanya — ini puncak emosi pertama seluruh dek |
| 06 | 02 · Cara mulai | section | transition | transition | Visual penuh + judul besar | L1: geometri SVG abstrak (siluet ponsel + panah unduh) | atmosphere | ~30 kata / 1 gambar / ~45% ruang kosong | Jangan isi dengan paragraf; jangan taruh daftar langkah yang mencuri posisi halaman pembuka | Halaman pembuka 02: masuk ke bagian paling praktis |
| 07 | Pasang ke layar utama HP | content | supporting | valley | Gambar besar kiri + teks kanan | L1: SVG ponsel + ikon muncul di home screen (kiri 55%) | anchor | ~200 kata / 1 gambar / ~22% ruang kosong | Jangan dua kolom 50:50; jangan hanya menulis "ketuk Pasang" tanpa konteks iOS | 4 langkah pasang PWA; Android satu tindakan, iOS manual "Add to Home Screen" — menghapus kekhawatiran "harus buka browser terus" |
| 08 | Masuk pakai akun sekolah | content | supporting | valley | Judul kiri + isi kanan | L2: SVG ikon gembok/kunci (96px) + L3 | evidence | ~250 kata / 1 gambar / ~20% ruang kosong | Jangan empat kartu sama lebar; jangan menggambar login sebagai diagram alur | Akun diberikan sekolah · satu akun untuk beberapa anak (anak bisa ditambah sendiri di Profil) · bisa ganti password sendiri · **peringatan**: salah 5 kali → akun terkunci, minta admin membuka · **kenapa** harus login: data anak aman |
| 09 | 03 · Dipakai tiap hari | section | transition | transition | Visual penuh + judul besar | L1: geometri SVG abstrak (kalender + centang) | atmosphere | ~30 kata / 1 gambar / ~45% ruang kosong | Jangan isi dengan paragraf; jangan pratinjau empat kartu | Halaman pembuka 03: bagian yang dipakai berulang-ulang |
| 10 | Lihat jadwal snack | content | supporting | valley | Gambar besar atas + kartu bawah | L1: SVG jadwal sepekan (5 kartu hari) + dua kartu 60:40 di bawah | evidence | ~210 kata / 1 gambar / ~20% ruang kosong | Jangan kartu bawah sama lebar; jangan ilustrasi memenuhi seluruh layar sebagai latar | Ilustrasi jadwal sebagai bukti: Hari Ini / Minggu Ini / Bulan Ini — supaya orang tua melihat gambaran tampilannya |
| 11 | Ambil tanggal piket | content | hero | peak | Teks raksasa + insight | L1: frasa raksasa "Siapa cepat, dia dapat" ≥64px + SVG kartu tanggal | anchor | ~150 kata / 1 gambar / ~40% ruang kosong | Jangan kartu sebaris sama lebar; jangan menaruh frasa inti di pojok dengan huruf kecil | Puncak emosi kedua seluruh dek: tanggal kosong bisa diambil sendiri, satu ketukan; keduluan → diberi tahu nama pengambil; bisa dibatalkan sendiri |
| 12 | Kabar otomatis lewat WhatsApp | content | supporting | valley | Gambar besar kiri + teks kanan | L1: SVG percakapan WhatsApp di badan ponsel (kiri 55%) | anchor | ~150 kata / 1 gambar / ~22% ruang kosong | Jangan bagi rata 50:50; jangan menyebut nama penyedia gateway atau istilah teknis | **Fitur terbaru:** konfirmasi masuk WhatsApp begitu tanggal diambil, dan pengingat sehari sebelum piket — nomornya diatur di Profil |
| 13 | Cari menu | content | supporting | valley | Judul kiri + isi kanan | L2: SVG kaca pembesar + piring (kanan atas 280×200) | evidence | ~190 kata / 1 gambar / ~24% ruang kosong | Jangan empat kartu sama lebar; jangan hanya menulis nama fitur tanpa contoh pemakaian | Ketik nama makanan/buah → tahu kapan disajikan; berguna untuk anak alergi & tahu rotasi menu |
| 14 | 04 · Yang perlu diingat | section | transition | transition | Visual penuh + judul besar | L1: geometri SVG abstrak (lingkaran centang + bintang) | atmosphere | ~30 kata / 1 gambar / ~45% ruang kosong | Jangan isi dengan paragraf; jangan pratinjau empat kartu | Halaman pembuka 04: empat aturan yang paling sering jadi pertanyaan |
| 15 | Empat hal yang perlu diingat | content | supporting | valley | N kartu sebaris (satu-satunya di dek ini) | L3: satu ikon per kartu (32px, seragam) | evidence | ~230 kata (≥ 55 per kartu) / 0 gambar / ~22% ruang kosong | Jangan kartu yang hanya berisi judul; jangan ukuran ikon tidak seragam | Penutup: jadwal muncul setelah diumumkan · satu akun bisa beberapa anak · ambil tanggal hanya di kelas anak sendiri · ada perubahan hubungi korlas |
| 16 | Terima kasih | ending | hero | peak | Visual penuh + judul besar | L1: app_logo.png (tengah 200×200) + SVG pendar cahaya | anchor | ~45 kata / 1 gambar / ~45% ruang kosong | Jangan menaruh placeholder kontak; jangan isi dengan paragraf | Penutup: ajakan pasang hari ini + pertanyaan dialihkan ke korlas/admin sekolah |

### Di mana angka mendarat

Dek ini tidak memuat data KPI bisnis, jadi tidak ada persentase yang dikarang. Dua titik "terasa
angka" berasal dari fakta produk, bukan karangan:

- Hlm 05: tidak memajang angka, melainkan perbandingan skala "satu aplikasi" (grup + kertas →
  satu layar). **Penilaian:** keribetan bukan karena orang tua tidak tertib, melainkan karena
  tidak ada satu tempat yang jadi rujukan.
- Hlm 11: frasa raksasa alih-alih angka. **Penilaian:** aturan "satu tanggal untuk satu orang tua
  per kelas" menjamin tidak ada lagi dua orang merasa sudah dapat.

### Self-check

- ✅ Hero = 4/16 = 25% (dalam rentang 20–30%)
- ✅ Tidak ada ≥3 valley berurutan
- ✅ `N kartu sebaris` hanya 1 kali (hlm 15)
- ✅ Layout asimetris 9/16 ≈ 56% ≥ 40%
- ✅ Tidak ada dua halaman berturut-turut berlayout sama (hlm 07 dan 12 sama-sama *gambar besar
  kiri + teks kanan*, dipisah 08–11)
- ✅ `gambar besar kiri + teks kanan` + `dua kolom asimetris` total 3/16 ≈ 19% ≤ 40%
- ✅ Setiap halaman punya role / rhythm / visual_role / anti_pattern
- ✅ 4 bagian ↔ 4 halaman pembuka, nomor 01..04 berurutan

## 4. Riwayat sinkronisasi

| Tanggal | Versi aplikasi | Yang disesuaikan |
| :------ | :------------- | :--------------- |
| 2026-09-27 | v1.10 | Dek dibuat: 15 halaman, 4 bagian, hero 4/15 |
| 2026-09-28 | v1.12 | **Hlm 10** — teks kartu "Hari ini & minggu ini" kini menyebut **nama anak yang piket** ikut tampil (kolom *Petugas* memang terlihat orang tua). **Hlm 14** — kartu 3 diperjelas: tanggal yang **sudah ditentukan korlas tidak ikut direbutkan** (badge "Ditetapkan korlas"). Ukuran teks isi kartu 18 → 17px agar keempat kartu tetap muat. |
| 2026-09-30 | v1.13 | **Diperiksa, sengaja tidak diubah.** Laporan jadwal, ekspor Excel akun, dan pengecualian petugas pada jadwal terbit semuanya wewenang admin & korlas — tidak ada satu pun layar orang tua yang berubah. Satu-satunya efek tidak langsung: bila korlas mengisi petugas **setelah** jadwal terbit, nama itu muncul di halaman orang tua tanpa perlu membuka kunci — itulah justru maksud perbaikannya, jadi tidak perlu halaman baru. |
| 2026-10-01 | v1.14 | **Diperiksa, sengaja tidak diubah.** Impor akun orang tua adalah wewenang admin saja dan tidak menyentuh satu pun layar orang tua — orang tua hanya merasakan efeknya bila admin memperbarui datanya. Dek ini tetap tentang empat hal: pasang, masuk, lihat jadwal, ambil tanggal. |
| 2026-10-12 | v1.16 | **Diperiksa, sengaja tidak diubah — dek tetap 15 halaman.** Gambar kategori (kolom `categories.image`) hanya tampil di halaman **Kategori**, yang tidak pernah dibuka orang tua, dan panel **Keterangan bulan** di `/pilih-jadwal` sengaja hanya untuk korlas & admin. Orang tua tetap melihat halaman `pilih-jadwal` yang sama: grid tanggal plus tombol **Ambil** — justru panel itulah yang menyembunyikan angka rekap supaya orang tua tidak melihat siapa sudah mengambil apa. Tidak ada satu pun kalimat, kartu, atau tangkapan layar di dek ini yang menyebut Kategori, gambar, atau Keterangan bulan. |
| 2026-10-15 | v1.18 | **Diperiksa, sengaja tidak diubah — dek tetap 15 halaman.** Daftar petugas piket semua kelas yang baru memang tampil di halaman orang tua, tetapi dek ini tidak pernah menggambarkan susunan kartu halaman Hari Ini: halaman 10 menyebutnya sebagai *gambaran tampilan* (Hari Ini / Minggu Ini / Bulan Ini), dan sejak v1.12 kartunya sudah menyebut kolom Petugas. Tidak ada satu pun kalimat, angka, atau tangkapan layar di dek ini yang menjadi keliru karena tambahan itu. |
| 2026-10-15 | v1.21 | **Diperiksa; satu kalimat masih menunggu di hlm 08.** Halaman depan publik (`/`) kini tampil lebih dulu bagi pengunjung yang membuka aplikasi lewat peramban, sebelum form masuk muncul; bagi yang sudah memasang PWA dan sesinya masih hidup, aplikasi tetap terbuka langsung di jadwal hari ini. Isi hlm 08 (username & password dari sekolah, lupa password lewat admin) tetap benar apa adanya — yang bertambah hanya satu langkah di depannya. **Dek belum diubah:** tambahan satu kalimat "halaman depan muncul lebih dulu — tekan Masuk" disiapkan untuk revisi dek berikutnya. |
| 2026-10-21 | v1.23 | **Dek diperluas ke 16 halaman.** **Hlm 12 baru — "Kabar otomatis lewat WhatsApp"** (supporting): konfirmasi masuk WhatsApp begitu orang tua mengambil tanggal, dan pengingat dikirim sekolah sehari sebelum giliran piket — nama anak, tanggal, dan menu yang dibawa. Satu butir mengingatkan bahwa nomornya diatur di **Profil** dan bisa diubah sendiri. Halaman ini masuk ke **bagian 03 (Dipakai tiap hari)**, tepat setelah "Ambil tanggal piket". Halaman 12–15 lama bergeser menjadi 13–16 dan seluruh nomor di bilah kaki menjadi `NN / 16`. Daftar isi hlm 02 menyebut rentang bagian 03 sebagai `9–13` dan bagian 04 sebagai `14–15`. **Batas isi dikoreksi:** larangan "jangan menjanjikan notifikasi" dicabut — notifikasinya kini ada dan justru menyentuh orang tua langsung. **Catatan v1.21 masih terbuka:** kalimat "halaman depan muncul lebih dulu — tekan Masuk" untuk hlm 08 belum masuk; hlm 08 sudah berisi lima baris setinggi 100 px dalam kotak 530 px, jadi menambah baris keenam akan memecahkan tata letaknya dan perlu dirancang ulang lebih dulu. |

> Hal yang **sengaja tidak diubah**: fitur v1.11 (aksi massal), v1.12 (impor jadwal), v1.14
> (impor akun), dan v1.16 (gambar kategori + panel Keterangan bulan) adalah wewenang admin &
> korlas, bukan orang tua — tidak ada satu pun alur orang tua yang berubah. Dek ini tetap tentang empat hal: pasang, masuk, lihat jadwal, ambil tanggal. Tambahan v1.18 (petugas semua kelas di halaman Hari Ini) memang terlihat orang tua, tetapi dek ini tidak pernah menggambarkan susunan kartu halaman itu — hlm 10 hanya menyebutnya sebagai *gambaran tampilan*.
