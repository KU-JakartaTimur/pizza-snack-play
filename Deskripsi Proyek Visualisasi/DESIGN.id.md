# DESIGN.id.md — Deskripsi Proyek Visualisasi · Pizza Snack Play

> Pasangan bahasa Indonesia dari `DESIGN.md`. Dek Indonesia dihasilkan dengan
> menerjemahkan simpul teks pada dek Inggris, jadi seluruh angka kanvas, warna,
> ukuran huruf, dan tata letak di bawah ini **berlaku sama** untuk kedua dek.
> Yang diukur ulang hanya dua hal: jumlah kata per halaman (lihat `STORY.id.md`)
> dan sebaran warna pada §2.

## 0. Posisi desain (tanpa cabang vertikal preset)

Skenario = **penyerahan untuk tinjauan proyek / pameran** bagi penilai yang belum
pernah melihat aplikasinya. Ini tidak masuk cabang preset mana pun (riset
akademik, konsultansi profesional, merah-emas partai/pemerintahan) → pakai
**prinsip desain umum**.

**Kata kunci nada:** analitis · berbasis bukti · terkendali · netral-hangat

**Hubungan dengan dek yang sudah ada:** dek ini adalah **saudara** dari
`Panduan Korlas dan Admin Pizza Snack Play` dan `Panduan Orang Tua Pizza Snack
Play`, memakai token merek yang sama (diambil dari blok `@theme` di
`src/index.css` aplikasinya sendiri). Register-nya berbeda: dek Panduan
*instruksional*, dek ini *membuktikan*.

---

## 1. Kanvas dan master (px konkret)

- **Kanvas:** `1280 × 720` (16:9) — terverifikasi di 16 dari 16 berkas slide
- **Padding halaman:** atas 20px / bawah 20px / kiri 64px / kanan 64px
  (padding kiri 64px terverifikasi di 16 dari 16 slide)

### Master tiga zona bawaan (halaman sampul / section / penutup boleh tanpa zona C)

| Zona | Posisi vertikal | Tinggi | Isi |
| :--- | :---------------- | :----- | :------ |
| **A · Blok judul** | 20 – 130px | 110px | Judul utama 34px bold; garis ungu setinggi 6px selebar 72px di bawahnya (limau `secondary` di halaman section) |
| **B · Area isi** | 130 – 660px | 530px | Isi / kartu / ilustrasi / huruf raksasa |
| **C · Bilah footer** | 660 – 700px | 40px | Kiri: watermark `Pizza Snack Play · Deskripsi Proyek Visualisasi` (14px `#6B6478`) · Kanan: `NN / 16` (14px `#6B6478`) |

**Cek tinggi:** 20 + 110 + 530 + 40 + 20 = 720 ✓ (jumlah tinggi semua kartu +
jarak di dalam zona B harus ≤ 530)

---

## 2. Sistem warna (4 hex + 2 netral)

| Peran | Hex | Pemakaian | Batas luas |
| :--- | :-- | :-- | :------- |
| **Latar `bg`** | `#FAF7F2` | Latar halaman di seluruh dek (off-white hangat) | — |
| **Primer `primary`** | `#51277C` | Bilah judul, blok hero, huruf raksasa, dinding wewenang | **≤ 60%** |
| **Sekunder `secondary`** | `#AFC440` | Garis atas kartu, lencana positif, kolom "sesudah", bilah verifier | **≤ 30%** |
| **Aksen `accent`** | `#F3B26C` | Titik fokus saja: keadaan `published`, baris prompt yang ditolak, angka "0 biaya" | **≤ 10%** (sampai 15–20% di halaman hero) |
| Netral · isi `ink` | `#2A2333` | Teks isi, judul | sisanya |
| Netral · redup `muted` | `#6B6478` | Footer, keterangan, anotasi | sisanya |

**Kebijakan transparansi:**
- Isi wadah kartu: `rgba(81,39,124,0.06)`
- Elevasi kartu: `boxShadow: '0 4px 20px rgba(0,0,0,0.08)'`
- Geometri hias halaman section: `opacity: 0.14` dari `#51277C`
- Blok penekanan hero: `linear-gradient(135deg, #51277C 0%, #7A45A8 100%)`

**Gradien:** selalu `135deg`.
- Bilah judul / blok hero: `linear-gradient(135deg, #51277C 0%, #7A45A8 100%)`
- Blok hias: `linear-gradient(135deg, #AFC440 0%, #F3B26C 100%)` (hanya halaman
  hero / section)

### Turunan yang dipakai (catatan kejujuran)

`DESIGN.md` versi Inggris menulis "hanya 4 hex + 2 netral". Setelah dihitung
dari 16 berkas slide, klaim itu **terlalu ketat**: ada sembilan nilai turunan
yang memang dipakai, semuanya untuk kontras di atas bidang berwarna. Palet
intinya tetap enam; turunannya tidak menambah warna merek baru.

| Hex | Jumlah | Keperluan |
| :-- | -----: | :-------- |
| `#7A45A8` | 10 | Ujung gradien `135deg` (sudah disebut di atas) |
| `#FFFFFF` | 64 | Isi kartu di atas latar ungu (halaman section) |
| `#C4762A` | 26 | Teks di atas bidang aksen `#F3B26C` |
| `#8A4A1E` | 2 | Teks redup di atas bidang aksen |
| `#3C1E0C` | 1 | Judul di atas bidang aksen |
| `#6F3C1C` | 1 | Keterangan di atas bidang aksen |
| `#D97F2F` | 1 | Garis tepi bidang aksen |
| `#576420` | 8 | Teks di atas bidang limau `#AFC440` |
| `#D9D2E3` | 2 | Netral terang (segmen "kosong" pada grafik) |

### Alokasi warna per halaman (tidak boleh terasa sama terus)

| Halaman | Primer | Sekunder | Aksen | Catatan |
| :--- | :------ | :-------- | :----- | :---- |
| 01 Sampul | 55% | 22% | 12% | Hero; blok ungu mengisi separuh kanan |
| 02 Katalog | 20% | 18% | 5% | Terkendali, lencana nomor ungu |
| 03 Section 01 | 60% | 15% | 5% | Latar ungu, huruf besar terbalik |
| 04 Artefak sumber | 28% | 25% | 8% | Dipimpin grafik; batang bertumpuk membawa warnanya |
| 05 Skenario | 45% | 18% | 12% | **Puncak** — kolom aksen sempit di kanan |
| 06 Peran | 32% | 20% | 6% | Dinding wewenang ungu; penolakan dalam muted |
| 07 Masalah inti | 50% | 12% | 15% | **Hero** — frasa raksasa + aksen di "sisi tulis" |
| 08 Section 02 | 60% | 15% | 5% | Latar ungu, terbalik |
| 09 Mesin keadaan | 30% | 22% | 16% | Aksen hanya mendarat di keadaan `published` |
| 10 Arsitektur | 26% | 24% | 5% | Terkendali; empat lapis bergaris ungu |
| 11 Loop generasi | 34% | 22% | 12% | **Puncak** — aksen di panah umpan balik |
| 12 Anatomi prompt | 28% | 20% | 14% | Aksen di baris prompt yang ditolak |
| 13 Section 03 | 60% | 15% | 5% | Latar ungu, terbalik |
| 14 Metrik | 42% | 16% | 20% | **Hero** — tiga angka raksasa, aksen di angka "0" |
| 15 Dampak | 24% | 28% | 6% | Sebelum/sesudah; limau membawa kolom "sesudah" |
| 16 Penutup | 55% | 15% | 12% | Hero |

---

## 3. Sistem huruf

| Tingkat | Ukuran | Bobot | Tinggi baris | Keluarga |
| :---- | :--- | :----- | :---------- | :----- |
| Judul sampul | 66px | bold | 1.2 | `Trebuchet MS` |
| Huruf section | 60px | bold | 1.1 | `Trebuchet MS` |
| Jangkar huruf raksasa (07, 14) | **64px** | bold | 1.05 | `Trebuchet MS` |
| Judul halaman (zona A) | 34px | bold | 1.3 | `Trebuchet MS` |
| Subjudul / judul kartu | 24–26px | bold | 1.4 | `Trebuchet MS` |
| Isi | 20–22px | regular | 1.55 | `Verdana` |
| Isi kartu | 16–18px | regular | 1.5 | `Verdana` |
| Keterangan / anotasi | 15–17px | regular | 1.5 | `Verdana` |
| Footer / nomor halaman | 14px | regular | 1.4 | `Verdana` |

- **Hanya 2 keluarga huruf:** `Trebuchet MS` (judul / jangkar raksasa) +
  `Verdana` (isi). Terverifikasi: 61 deklarasi `Trebuchet MS`, 6 deklarasi
  `Verdana`, tidak ada keluarga lain di 16 berkas slide.
- **Tanpa emoji, selamanya.** Terverifikasi: 0 kecocokan pada rentang emoji.

---

## 4. Gerbang kepadatan

- Ruang kosong di halaman isi biasa **≤ 35%**; halaman hero boleh mencapai
  40–45% (halaman 01/07/14/16).
- **Tingkat isi wadah ≥ 85%:** teks + ikon di dalam kartu harus menempati ≥ 85%
  tinggi wadah.
- **Penambatan footer:** elemen terakhir dalam kartu memakai
  `marginTop: 'auto'` agar menempel ke bawah.
- **Perataan kartu bersaudara:** dalam satu baris kartu, koordinat y blok judul
  / blok isi / garis footer harus sejajar; selisih > 16px berarti harus
  dikerjakan ulang.
- **Ruang kosong fokus:** sisakan ≥ 40px di sekeliling setiap jangkar visual.

---

## 5. Sistem peraga

### Sumber gambar

Lingkungan ini **tidak menyediakan kemampuan pembuatan gambar**, jadi seluruh
peraga L1/L2 adalah **diagram terstruktur `<svg>` tulisan tangan** (batang
bertumpuk, mesin keadaan, tumpukan lapis, loop generasi, diagram wewenang,
pasangan sebelum/sesudah), didukung **gambar materi P0**
(`assets/app_logo.png`, disalin dari `public/logo.png`). SVG hanya dipakai untuk
unsur terstruktur / abstrak dan **tidak pernah meniru fotografi atau sekelompok
orang**.

### Daftar aset

| Berkas | Sumber | Isi sebenarnya | Ukuran | Dipakai di | Terverifikasi |
| :--- | :----- | :------------- | :--- | :------ | :------- |
| `assets/app_logo.png` | materi P0 (disalin dari `public/logo.png`) | Logo resmi aplikasi: pizza + kalender + "PIZZA SNACK PLAY" | 690×670 | 01, 16 | ✅ Dibaca dan dikonfirmasi |

### Rencana SVG (per halaman)

| Halaman | Isi SVG | Posisi / ukuran | Tingkat |
| :--- | :---------- | :-------------- | :--- |
| 01 | Grid kalender + papan jalan + tanda centang | Kanan, sekitar 520×420 | L1 |
| 02 | — (hanya lencana nomor ungu L3) | Kiri tiap judul bab, 44×44 | L3 |
| 03 | Lingkaran ungu transparan + bidang berlapis | Latar penuh, opasitas .14 | L1 (atmosfer) |
| 04 | Batang bertumpuk: 86 penugasan / 21 menu / 5 tajuk / kosong | Atas, sekitar 1100×260 | L1 |
| 05 | Strip pekan dengan delapan momen bertanda | Kolom kanan, sekitar 360×420 | L2 |
| 06 | Tiga tingkat wewenang dipisah dinding | Kolom kiri, sekitar 520×440 | L1 |
| 07 | Ikon dokumen dengan gembok, di belakang frasa raksasa | Tengah, sekitar 300×300 | L1 |
| 08 | Lingkaran ungu transparan + bidang berlapis | Latar penuh, opasitas .14 | L1 (atmosfer) |
| 09 | Mesin tiga keadaan + jalur balik unlock putus-putus | Kolom kanan, sekitar 620×380 | L1 |
| 10 | Tumpukan empat lapis di dalam batas Worker | Kolom kiri, sekitar 560×440 | L1 |
| 11 | Loop lima langkah dengan panah umpan balik di bawah | Atas, sekitar 1100×300 | L1 |
| 12 | Kartu prompt lima slot + baris yang ditolak | Kolom kiri, sekitar 520×440 | L1 |
| 13 | Lingkaran ungu transparan + batang menanjak | Latar penuh, opasitas .14 | L1 (atmosfer) |
| 14 | Strip tick: 113 tick dalam 31 kolom | Di bawah angka raksasa, sekitar 1000×120 | L2 |
| 15 | Pasangan sebelum/sesudah: berkas teks → baris bertipe | Kolom kanan, sekitar 400×420 | L2 |
| 16 | Lingkaran cahaya + logo | Di tengah | L1 |

**Konsistensi penempatan L3:** lencana L3 di halaman 02 duduk di **kiri-atas**
tiap baris bab, konsisten di ketiga baris.

**Ikon wajib `<svg>` inline, bukan `<FAIcon>`:** `icon://fa/...` tidak pernah
ter-resolve di mesin ini — 17 ikon pada dek sebelumnya tersimpan sebagai
placeholder gambar rusak berwarna abu-abu. Karena itu setiap ikon ditulis
sebagai `<svg viewBox="..."><path fill="..." d="..."/></svg>` dengan jalur
**solid** Font Awesome Free 6.5.2 yang ditanam langsung.

---

## 6. Peta halaman (kontrak)

| # | Berkas | Tipe | Peran | Tata letak | Berkas L1 | Kata | Ruang kosong | Belahan warna | Kendali kunci |
| :- | :--- | :--- | :--- | :----- | :------ | :--------- | :--------- | :----------- | :------------- |
| 01 | `slides/01.slide` | cover | hero | gambar penuh + teks menimpa garis | app_logo.png + SVG | 38 | 40% | 55/22/12 | Judul besar kiri, logo 400×400 kanan |
| 02 | `slides/02.slide` | katalog | pendukung | judul kiri + isi kanan | lencana L3 | 106 | 25% | 20/18/5 | Tiap bab ≥ 30 kata penjelasan + rentang halaman |
| 03 | `slides/03.slide` | section | transisi | visual penuh + judul besar | geometri SVG abstrak | 29 | 45% | 60/15/5 | Latar ungu, terbalik, nomor bab 01 besar |
| 04 | `slides/04.slide` | isi | pendukung | gambar besar di atas + kartu di bawah | batang bertumpuk SVG | 152 | 22% | 28/25/8 | Grafik menempati 55% atas; dua kartu 60:40 di bawah |
| 05 | `slides/05.slide` | isi | pendukung | dua kolom asimetris 60:40 | strip pekan SVG | 201 | 22% | 45/18/12 | Delapan skenario di sisi lebar, pasangan klaim+publikasi di sisi sempit |
| 06 | `slides/06.slide` | isi | pendukung | gambar besar kiri + teks kanan | diagram wewenang SVG | 157 | 24% | 32/20/6 | Ilustrasi menempati 55% kiri, tiga poin di kanan |
| 07 | `slides/07.slide` | isi | hero | huruf raksasa + wawasan | dokumen + gembok SVG | 102 | 40% | 50/12/15 | Frasa raksasa **64px**, jangan diselipkan ke sudut |
| 08 | `slides/08.slide` | section | transisi | gambar penuh + teks menimpa garis | bidang berlapis SVG | 32 | 45% | 60/15/5 | Nomor bab 02 menimpa visual |
| 09 | `slides/09.slide` | isi | pendukung | dua kolom asimetris 40:60 | mesin keadaan SVG | 157 | 22% | 30/22/16 | Mesinnya adalah buktinya; tiga aturan duduk di kiri |
| 10 | `slides/10.slide` | isi | pendukung | gambar besar kiri + teks kanan | tumpukan lapis SVG | 149 | 22% | 26/24/5 | Empat lapis harus tetap empat pita berbeda |
| 11 | `slides/11.slide` | isi | pendukung | gambar besar di atas + kartu di bawah | loop generasi SVG | 159 | 24% | 34/22/12 | Loop menempati 58% atas; panah umpan balik bukan opsional |
| 12 | `slides/12.slide` | isi | pendukung | gambar besar kiri + teks kanan | kartu prompt SVG | 213 | 24% | 28/20/14 | Lima slot terlihat; baris yang ditolak ditandai, bukan disembunyikan |
| 13 | `slides/13.slide` | section | transisi | visual penuh + judul besar | batang menanjak SVG | 37 | 45% | 60/15/5 | Latar ungu, terbalik, nomor bab 03 besar |
| 14 | `slides/14.slide` | isi | hero | huruf raksasa + wawasan | strip tick SVG | 90 | 40% | 42/16/20 | Tiga angka raksasa ≥ 64px; tanpa kartu selebar sama |
| 15 | `slides/15.slide` | isi | pendukung | dua kolom asimetris 60:40 | sebelum/sesudah SVG | 200 | 22% | 24/28/6 | Empat pasangan sebelum/sesudah di kiri, batasan di kanan |
| 16 | `slides/16.slide` | penutup | hero | gambar penuh + teks menimpa garis | app_logo.png | 41 | 45% | 55/15/12 | Logo di tengah 200×200 + penutup satu baris |

---

## 7. Tabu universal, sudah diperiksa

- Setiap halaman hanya memakai palet inti (§2) ditambah sembilan turunan yang
  terdaftar; tidak ada warna merek baru yang dikarang.
- Jenis peraga L1 dek ini seragam (diagram SVG datar tulisan tangan + 1 logo).
- Tidak ada thumbnail hiasan yang disumpalkan ke kanan blok judul; penempatan
  L3 konsisten.
- Setiap halaman punya ≥ 1 jangkar visual (elemen ≥ 44px atau gambar yang
  menutup ≥ 40% zona B).
- Tidak ada halaman yang menampilkan angka tanpa penilaian yang menyusul
  darinya.
