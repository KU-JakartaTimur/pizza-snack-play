# Deskripsi Proyek Visualisasi

## Pizza Snack Play — Platform Jadwal Piket & Menu Snack Sekolah

| Field | Nilai |
| :--- | :--- |
| **Nama proyek** | Pizza Snack Play |
| **Kategori** | Generasi AI berbasis prompt · platform operasional nyata |
| **Versi dokumen** | 1.0 |
| **Tanggal** | 17 Oktober 2026 |
| **Deployment aktif** | `https://pizza-snack-play.topidesta.workers.dev` |
| **Stack** | BHVR — Bun + Hono + Vite + React 19 di Cloudflare Workers + D1 |
| **Penyimpanan produksi** | Cloudflare D1 (`pizza-snack-play`), 13 tabel, 9 migrasi |
| **Sumber kebenaran dokumen ini** | Repositori yang berjalan: PRD v1.21, README, `drizzle/migrations/`, `src/`, `scripts/` |

> **Cara membaca dokumen ini.** Setiap angka di dalamnya diukur dari repositori, bukan ditaksir.
> Bila sebuah klaim bersandar pada berkas atau perintah tertentu, buktinya disebutkan langsung
> supaya peninjau bisa memeriksanya sendiri.

---

## 1. Ringkasan Proyek

### 1.1 Skenario Sasaran

Pizza Snack Play menggantikan **satu berkas teks biasa** yang dipakai sekolah untuk menjalankan
jadwal piket snack harian. Skenario di bawah ini adalah skenario yang benar-benar jadi dasar
aplikasi dibuat — masing-masing adalah kejadian berulang dalam pekan sekolah, bukan kasus hipotetis.

| # | Skenario | Kapan terjadi | Tanpa aplikasi | Dengan aplikasi |
| :- | :--- | :--- | :--- | :--- |
| S1 | **“Snack hari ini apa?”** | Setiap pagi sekolah | Orang tua membuka berkas teks yang diteruskan lalu menggulir mencari tanggalnya | `/hari-ini` menjawabnya dalam satu layar, lengkap dengan nama orang tua petugas dan tautan WhatsApp-nya |
| S2 | **Rencana sepekan** | Minggu malam | Berkas yang sama dibaca dua kali — sekali untuk menu, sekali untuk daftar piket | `/minggu-ini` menampilkan Senin–Jumat dalam satu tampilan per kelas |
| S3 | **Rotasi piket** | Saat suatu kelas kena piket | Tidak ada yang tahu giliran siapa tanpa membaca seluruh berkas | Penugasan piket menjadi field kelas satu pada setiap baris jadwal, dengan dropdown siswa yang dibatasi ke roster kelas itu |
| S4 | **Mengisi tanggal yang kosong** | Kapan pun koordinator membiarkan tanggal kosong | Pesan dikirim ke grup dan balasan pertama yang menang, tanpa jejak | `/pilih-jadwal` — orang tua mengambil tanggalnya sendiri; `UNIQUE(schedule_id)` membuatnya aman dari rebutan |
| S5 | **Siklus kunci & terbit bulanan** | Sebulan sekali | Tidak ada konsep “siap” — berkasnya dikirim atau tidak | `draft → locked → published`; publikasi ditolak selama masih ada baris `draft` |
| S6 | **Rapat koordinasi: “beban piketnya sudah merata?”** | Rapat bulanan | Tidak bisa dijawab — berkas mencatat siapa yang piket, tidak pernah siapa yang *mengambil* piket | `/laporan` memeringkat setiap orang tua menurut jumlah piket yang diambil, dan mendaftar yang belum pernah mengambil |
| S7 | **Pakai ulang menu & riwayat** | Saat menyusun bulan berikutnya | Menu lama diketik ulang dengan tangan | Katalog 43 menu / 85 item menu yang bisa dicari, bisa dipakai ulang lintas semua kelas |
| S8 | **Siklus hidup akun orang tua** | Setiap tahun ajaran | Akun dibuat satu per satu dengan tangan | Bolak-balik Excel: ekspor → sunting → impor, dengan pratinjau lebih dulu |

**Skenario yang membentuk arsitekturnya** adalah S4+S5 bersama-sama. Klaim (S4) menulis balik ke
baris jadwal; publikasi (S5) membekukan baris. Kalau keduanya dibiarkan bebas menulis, orang tua
bisa mengambil slot di bulan yang sudah diumumkan sekolah. Mesin status ada supaya hal itu mustahil,
bukan sekadar tidak dianjurkan.

### 1.2 Pengguna Sasaran

Empat peran, tiga di antaranya punya wewenang nyata. Model perannya sengaja kecil — setiap peran
tambahan adalah satu cara baru bagi sekolah untuk salah menjalankan prosesnya sendiri.

| Peran | Siapa mereka | Tujuan utama | Wewenang | Yang secara eksplisit ditolak |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Guru / staf yang menjalankan program snack | Menjaga jadwal seluruh sekolah tetap benar dan terbit | CRUD penuh untuk semua kelas, katalog, kategori, hari libur, akun orang tua, statistik; mengunci **dan** membuka kunci | — |
| **Korlas** *(koordinator kelas)* | Seorang orang tua yang ditunjuk per kelas | Menjalankan **kelasnya sendiri** tanpa menunggu admin | Membuat/mengubah/menghapus jadwal kelasnya selama `draft`; mengunci dan menerbitkan kelasnya sendiri; mengambil tanggal kosong (ia tetap orang tua) | Tidak boleh membuka kunci, tidak boleh menyentuh kelas lain, tidak boleh menyunting katalog bersama, tidak boleh mengelola akun |
| **Orang tua / wali** | Orang tua siswa terdaftar | Tahu snack hari ini dan apakah gilirannya | Membaca jadwal kelas anaknya; mengambil tanggal piket yang kosong; mengubah data kontak dan password sendiri | Tidak punya akses tulis ke jadwal maupun katalog |
| **Koperasi / kantin** | Penyedia makanan sekolah | Tahu apa yang harus disiapkan | Hanya baca, lewat ekspor Excel | Tidak ada jalur tulis di level login |

**Peran korlas adalah keputusan desain yang paling menarik.** Versi pertama sistem hanya punya admin
dan orang tua. Kenyataannya admin tidak sanggup menjaga enam kelas tetap mutakhir, dan orang tua
tidak bisa menyunting apa pun. Menaikkan enam orang tua menjadi admin — yang akan memberi mereka
kuasa menulis ulang katalog seluruh sekolah dan setiap kelas lain — jelas bukan jawabannya. Jadi
peran ketiga diperkenalkan: **berkuasa di dalam satu kelas, tak berdaya di luarnya.** Batasnya
ditegakkan dua kali: `requireRole()` di API (penegak sebenarnya) dan `<RoleGate need="...">` di UI
(yang hanya menyembunyikan tombol). Ini dinyatakan tegas di PRD, sebab batas yang hanya ada di UI
bukanlah batas.

### 1.3 Nilai Jual

> **Pizza Snack Play mengubah dokumen yang hanya bisa dibaca menjadi sistem yang bisa ditanyai — dan
> melakukannya tanpa menambah satu pun administrator.**

Empat pilar nilai, dalam urutan yang dirasakan sekolah:

1. **Jawaban, bukan arsip.** Berkas lama hanya bisa dibaca dari depan ke belakang. Aplikasi menjawab
   tiga pertanyaan yang benar-benar ditanyakan orang — *snack hari ini apa*, *kapan anak saya kena
   piket*, *sudah terbit belum kelas anak saya* — tanpa pembacanya perlu tahu jawabannya ada di mana.
2. **Wewenang di ujung.** Peran korlas memindahkan beban kerja bulanan dari satu admin ke enam
   koordinator, sambil menjaga katalog sekolah tetap dimiliki satu pihak. Penyuntingan terdistribusi
   tanpa ketidakkonsistenan terdistribusi.
3. **Keadilan menjadi terukur.** Beban piket sebelumnya hanya perasaan. Karena klaim disimpan di
   tabelnya sendiri, sistem kini bisa menyebut nama orang tua yang belum pernah mengambil piket —
   pertanyaan yang secara struktural tidak bisa dijawab dokumen sumbernya.
4. **Biaya infrastruktur marginal nol.** Cloudflare Workers + D1 di tier gratis; sekolah tidak
   membayar server, lisensi basis data, maupun listing app store. Ini penting: program snack sekolah
   tidak punya pos anggaran untuk perangkat lunak.

### 1.4 Wawasan Skenario Nyata

#### 1.4.1 Dari mana titik nyerinya berasal

Titik nyerinya **bukan** dikumpulkan lewat survei. Semuanya digali dari artefak yang benar-benar
dipakai sekolah, yang tersimpan di repositori sebagai `data/output_jadwal_piket.txt` dan
`data/jadwal_piket_snack.txt`.

Isi terukur berkas sumber tersebut:

| Properti | Nilai terukur |
| :--- | :--- |
| Total baris | 136 |
| Blok pekan | 5 (`1 - 4 September` … `28 - 30 September 2026`) |
| Baris menu (Senin–Jumat) | 21 |
| Baris penugasan piket | 86 |
| Nama siswa unik | 38 |
| Kelas yang tercakup | 1–5 |

Cuplikan yang mewakili — inilah seluruh model data yang dimiliki sekolah:

```text
1 - 4 September 2026
Selasa  : Roti coklat + jeruk
Kelas 1 : Shezan
Kelas 2 : Uma
Kelas 3 : Azkayra

Rabu : Tahu isi sayur + melon
Kelas 1 : Huma
...
```

Membaca berkas itu dengan saksama adalah yang menghasilkan daftar kebutuhan. Enam titik nyeri, dan
masing-masing bisa dilacak ke sebuah sifat formatnya, bukan ke sebuah keluhan:

| Titik nyeri | Akar masalah yang terlihat di format sumber |
| :--- | :--- |
| **Tanpa pencarian** | Nama menu adalah teks bebas di dalam baris hari; “kapan jeruk disajikan?” berarti membaca seluruh 21 baris |
| **Tanpa notifikasi** | Berkasnya hanya potret sesaat; tidak ada mekanisme yang memberi tahu siapa pun bahwa isinya berubah |
| **Sulit disunting dengan aman** | Header pekan ditulis tangan dan sudah keliru — satu blok dilabeli `14 - 18 Oktober 2026` (Senin–Jumat) padahal 14 Oktober 2026 adalah hari Rabu |
| **Tanpa riwayat** | Berkasnya ditimpa bulan ke bulan; repositori hanya menyimpan dua bulan |
| **Tanpa katalog yang bisa dipakai ulang** | Menu yang sama diketik ulang; tidak ada yang menautkan “Puding Roti” September ke “Puding Roti” Oktober |
| **Tanpa pelacakan piket** | Piket hanya nama di samping kelas, tanpa identitas — tidak ada data orang tua yang dirujuk |

Dua di antaranya layak ditekankan karena merupakan masalah **integritas data**, bukan sekadar
kenyamanan:

- **Header pekan yang salah label** adalah cacat nyata yang ditemukan di dokumen sekolah sendiri.
  Pengimpor aplikasi sekarang mencocokkan setiap label hari dengan kalender sungguhan dan, bila satu
  pekan penuh salah label, menggeser rentangnya ke Senin–Jumat yang benar lalu memperingatkan
  pemakainya. Spreadsheet manual tidak bisa melakukan itu.
- **Nama petugas tidak punya identitas.** Perbaikannya adalah menjadikan petugas sebuah *relasi*
  (`petugas_student_id` + `petugas_parent_id`), dan nama yang tercetak hanya disimpan sebagai salinan
  tampilan yang didenormalisasi. API menolak nama petugas yang dikirim klien; nama itu diresolusi
  terhadap roster kelas di sisi server (`resolvePetugas()`).

#### 1.4.2 Audiens sasaran dan masalah inti yang dipecahkan

**Masalah inti, dalam satu kalimat:**

> Jadwal snack sekolah adalah *kewajiban bersama* — setiap keluarga dapat giliran — tetapi dicatat di
> dalam *dokumen pribadi* yang tidak bisa ditanyai keluarga mana pun, dan yang hanya bisa disunting
> dengan aman oleh satu orang.

Celah itu punya dua belahan, dan keduanya harus ditutup:

- **Sisi membaca** — orang tua tidak punya cara andal untuk tahu gilirannya. Menutupnya berarti
  autentikasi (setiap keluarga hanya melihat kelas anaknya) dan model data per kelas.
- **Sisi menulis** — satu admin tidak sanggup memelihara enam kelas. Menutupnya berarti peran yang
  didelegasikan dengan batas tegas, plus gerbang kunci/terbit supaya “sudah diumumkan” dan “masih
  disunting” tidak pernah bisa tertukar.

**Siapa yang bukan audiens sasaran.** Aplikasi ini sengaja tidak menjadikan siswa sebagai pengguna
langsung (tidak ada akun siswa — piket adalah kewajiban keluarga, dan walinya yang memegang ponsel),
dan tidak berusaha menjadi sistem manajemen sekolah serba bisa. Tidak ada presensi, tidak ada nilai,
tidak ada pesan-pesan. Setiap fitur harus bisa dilacak kembali ke jadwal snack.

**Kenapa solusi yang kelihatan mudah gagal.** Solusi yang paling gampang adalah “taruh berkasnya di
spreadsheet bersama”. Itu menyelesaikan sisi membaca bagi orang yang sudah tahu lembar itu ada, dan
justru memperburuk sisi menulis: spreadsheet bersama tidak punya gagasan tentang siapa yang boleh
menyunting kelas mana, tidak punya status terbit, dan tidak punya cara menjawab “siapa yang belum
pernah ambil giliran” — karena lembar itu mencatat piket, bukan klaim. Tabel klaim hanya ada karena
sistem ini sebuah aplikasi.

---

## 2. Desain Solusi Menyeluruh

### 2.1 Arsitektur Bisnis

#### Model wewenang, dan kenapa ditegakkan dua kali

| Lapisan | Mekanisme | Tujuan |
| :--- | :--- | :--- |
| API | `requireRole()` pada setiap rute tulis | Batas sebenarnya. Mengembalikan `403` apa pun yang dikirim klien. |
| API (cakupan data) | `classScope` / `canWriteClass(user, row.className)` | Pada `PUT`/`DELETE`, kelas dibaca dari **baris basis data**, tidak pernah dari input klien — sehingga korlas tidak bisa membajak baris kelas lain dengan mengubah parameter. |
| UI | `<RoleGate need="admin" \| "schedule" \| "catalog">` | Menyembunyikan kontrol yang tidak bisa dipakai. Didokumentasikan tegas sebagai *kosmetik* — fungsinya menghindari menawarkan tindakan yang mustahil, bukan menegakkan apa pun. |

Perbedaan ini dinyatakan di PRD supaya kontributor berikutnya tidak salah mengira gerbang UI sebagai
keamanan.

#### Siklus hidup jadwal

```text
                 korlas atau admin        korlas atau admin      hanya admin
   draft  ──────────────────────▶  locked  ──────────────▶  published  ──────────▶  draft
     │                                │                         │
     │ bisa disunting                 │ tidak bisa disunting     │ tidak bisa disunting
     │                                │ (satu pengecualian:      │ (pengecualian sama)
     │                                │  hanya petugasnya)       │
     └─ hanya bisa terbit setelah seluruh barisnya terkunci
```

- `POST /schedules/publish` **menolak dengan `409 drafts_remaining`** bila masih ada baris `draft`,
  dan menyebut kelas penyebabnya. Ini aturan bisnis terpenting di sistem: ia membuat “kelas terbit
  separuh” — kelas yang pekannya sebagian sudah diumumkan dan sebagian masih berubah — mustahil
  secara struktural.
- Ada satu pengecualian yang disengaja. Pada baris `locked`/`published`, **hanya petugasnya** yang
  masih boleh diisi. Piket sering baru terisi setelah jadwal diumumkan, dan memaksa admin membuka
  kunci sebulan penuh hanya untuk mengetik satu nama ternyata lebih buruk daripada risikonya. Patch
  **campuran** (petugas plus menu/catatan/libur dalam satu permintaan) tetap ditolak dengan
  `409 not_editable`.

#### Dua semantik aksi massal, sengaja dibedakan

Ada dua cara beraksi pada banyak baris, dan keduanya berperilaku berbeda dengan sengaja:

| | Berbasis rentang / kelas | Berbasis baris terpilih |
| :--- | :--- | :--- |
| Endpoint | `POST /schedules/lock`, `POST /schedules/publish` | `POST /schedules/bulk/{lock,publish,unlock}` |
| Status tidak cocok | `409 drafts_remaining` — seluruh permintaan ditolak | Dihitung `skipped`, mengembalikan `200` |
| Cakupan kelas | Diselesaikan dari permintaan lewat `resolveBulkClasses` | Diambil dari tiap baris, tidak pernah dari klien |

Asimetri ini disengaja dan didokumentasikan. Operasi tingkat bulan yang diam-diam melewati satu kelas
akan menghasilkan persis keadaan terbit-separuh yang justru ingin dicegah mesin status — karena itu
operasi berbasis rentang gagal dengan lantang. Himpunan baris yang dicentang dengan tangan adalah
pilihan eksplisit, jadi perilaku yang benar adalah bertindak atas baris yang memenuhi syarat lalu
melaporkan sisanya.

#### Mekanisme klaim (siapa cepat dia dapat)

| Elemen | Desain |
| :--- | :--- |
| Aman dari rebutan | `UNIQUE(schedule_id)` pada `schedule_claims` — basis data, bukan aplikasi, yang menentukan pemenangnya |
| Satu sumber kebenaran | Klaim yang berhasil **menulis balik** ke `schedules.petugas_name` / `petugas_parent_name`, sehingga tidak pernah ada klaim yang berbeda dari jadwalnya |
| Cakupan | Per kelas. Tanggal yang sama di dua kelas adalah dua baris, jadi klaim kelas 1 tidak menghalangi kelas 2 |
| Pelaporan keadilan | Karena klaim punya tabelnya sendiri, `/laporan` bisa memeringkat orang tua menurut piket yang diambil dan menyebut yang belum pernah mengambil |

#### Aturan bisnis yang ditegakkan kode

| Aturan | Titik penegakan |
| :--- | :--- |
| Orang tua hanya melihat kelas anaknya | `classScope` pada setiap pembacaan |
| Admin wajib menyebut kelas saat menulis | `400 class_required` |
| Korlas menulis kelas lain | `403 forbidden_class` |
| Menyunting baris terkunci/terbit | `409 not_editable` (kecuali hanya petugasnya) |
| Menerbitkan saat masih ada draft | `409 drafts_remaining`, kelas penyebabnya disebut |
| Petugas harus ada di roster kelas itu | `400 petugas_not_found` |
| Impor jadwal tidak pernah menimpa pasangan (tanggal, kelas) yang sudah ada | Pengimpor idempoten; baris baru selalu `draft` |
| Rentang laporan dibatasi | Maksimum 92 hari, jadi tidak ada query tanpa batas |
| Daftar kelas tidak punya tabel | Diturunkan dari `students.class_name` ∪ `users.class_name` ∪ `schedules.class_name`, lalu disaring per peran — kelas tidak bisa ada tanpa siswa atau jadwal, jadi tabel terpisah hanya menambah satu cara untuk tidak sinkron |

### 2.2 Arsitektur Teknis

#### Stack

| Lapisan | Teknologi | Kenapa ini |
| :--- | :--- | :--- |
| Runtime | Cloudflare Workers | Tier gratis, global, tanpa server yang perlu ditambal; seluruh sekolah muat di jatah gratis |
| Framework API | Hono (`basePath("/api")`) | Kecil, edge-native, ada middleware untuk autentikasi JWT |
| Basis data | Cloudflare D1 (SQLite) | SQL serverless di tier gratis; migrasi dijalankan `wrangler d1 migrations apply` |
| ORM / migrasi | Drizzle ORM + drizzle-kit | Query bertipe plus riwayat migrasi yang ikut ter-commit |
| Klien | React 19 + TanStack Router + TanStack Query | Routing berbasis berkas, pengambilan data dan invalidasi cache per halaman |
| Styling | Tailwind CSS 4 dengan blok token `@theme` | Tiga warna merek dideklarasikan sekali, dipakai di mana-mana |
| Build | Vite 6 (+ `@cloudflare/vite-plugin`) | Klien dan Worker dibangun bersama |
| Bahasa | TypeScript di seluruh lapisan | Kontrak API dipakai bersama Worker dan klien |

#### Struktur lapisan

```text
  Peramban (React 19 SPA, bisa dipasang sebagai PWA)
      │  ky  →  /api/*   (JWT di header Authorization)
      ▼
  Router Hono — src/api/index.ts
      │
      ├─ middleware/            verifikasi JWT, penjaga peran, cakupan kelas
      │
      ├─ <domain>/route.ts      verb HTTP + requireRole()            ← batas sebenarnya
      ├─ <domain>/controller.ts penyusunan permintaan/respons, DTO
      ├─ <domain>/service.ts    aturan bisnis (resolvePetugas, bulk, gerbang terbit)
      └─ <domain>/repository.ts hanya SQL — syarat status ada di klausa WHERE
      │
      ▼
  Cloudflare D1  ·  13 tabel  ·  9 migrasi  ·  drizzle/migrations/
```

**Sembilan domain API:** `auth`, `catalog`, `claims`, `classes`, `laporan`, `parents`, `profile`,
`schedules`, `stats` — total **65 endpoint** (29 `GET`, 22 `POST`, 7 `PUT`, 7 `DELETE`).

Konvensi modul domain (`route` → `controller` → `service` → `repository`) dipegang konsisten di
kesembilan domain, sehingga peninjau yang mencari sebuah aturan bisnis tahu berkas mana yang harus
dibuka: wewenang di `route.ts`, cakupan di `src/api/utils/classScope.ts`, aturan di `service.ts`, dan
syarat status di klausa `WHERE` milik `repository.ts`.

#### Model data — 13 tabel

| Kelompok | Tabel |
| :--- | :--- |
| Orang & akses | `users`, `parents`, `students` |
| Jadwal | `schedules`, `schedule_claims`, `holidays` |
| Katalog | `menus`, `menu_items`, `categories`, `menu_categories` |
| Operasional | `import_logs`, `settings`, `weeks` |

Dua keputusan skema layak disebut karena keduanya **pembalikan** — dan pembalikan adalah bukti paling
andal bahwa sebuah desain benar-benar diuji terhadap kenyataan:

1. **Tanpa foreign key komposit pada petugas** (migrasi `0007`). FK komposit menuntut indeks unik
   yang persis cocok pada pasangan kolom target, dan itu memaksa tabel dibangun ulang. Rebuild butuh
   `PRAGMA foreign_keys=OFF` — dan pragma itu **diabaikan senyap di dalam transaksi**, sementara
   `wrangler d1 migrations apply` membungkus migrasi dalam satu transaksi. Akibatnya: migrasi lolos
   di lokal, gagal di produksi dengan `FOREIGN KEY constraint failed`, dan jalur yang "berhasil"
   meninggalkan 292 pelanggaran `foreign_key_check`. Migrasi `0007` kini hanya
   `ALTER TABLE ADD COLUMN`, dan konsistensi petugas ditegakkan `resolvePetugas()` di lapisan service.
2. **Gambar kategori disimpan di basis data** sebagai data URI base64 (migrasi `0008`), divalidasi di
   klien **dan** server. DTO katalog dipecah dua — `CategorySummaryDto` (tanpa gambar, dipakai menu
   dan jadwal) dan `CategoryDto` (dengan gambar, hanya di halaman kategori) — supaya sebulan jadwal
   yang memuat puluhan menu tidak menggandakan muatan gambar yang tidak ada yang menampilkannya.

#### Arsitektur pengujian

| Lapisan | Volume | Lokasi |
| :--- | :--- | :--- |
| Uji unit | **85** uji di 10 berkas (23 suite) | `src/**/*.test.ts` |
| Integrasi API | **367** assertion di 27 seksi | `scripts/test-api.mjs` |
| Peran & auth | 33 assertion | `scripts/test-auth.mjs` |
| Suite lintas aspek | 140 assertion (`status` 22, `petugas` 23, `profile` 71, `roster` 15, `claim-cross-class` 9) | `scripts/test-*.mjs` |
| Pemeriksaan peramban | 20 skrip Puppeteer, termasuk assertion geometri tata letak | `outputs/check-*.mjs` |
| Kasus UAT | 21 kasus terdokumentasi | `docs/UAT_Result.md` |

Total integrasinya **540 assertion** di 8 skrip, plus 85 uji unit. Pemeriksaan peramban melampaui
"elemennya ada" — mis. pemeriksaan tata letak `/hari-ini` memastikan kartu petugas ada **di kolom
mana** dan bahwa lebarnya secara geometri sama dengan kartu hari, sebab kartu yang salah kolom tetap
lolos setiap uji keberadaan.

#### Deployment dan biaya

| Aspek | Nilai |
| :--- | :--- |
| Hosting | Cloudflare Workers (tier gratis) |
| Basis data | Cloudflare D1 (tier gratis) |
| Perintah deploy | `wrangler deploy --env production` setelah `vite build` dan `wrangler d1 migrations apply --remote` |
| Biaya infrastruktur marginal | **0** — tanpa server, tanpa lisensi basis data, tanpa biaya app store |
| Bisa dipasang | Manifest PWA + service worker; orang tua menambahkannya ke layar utama |
| Observabilitas | Observabilitas Workers aktif; source map diunggah |

### 2.3 Bagaimana Prompt Menggerakkan Generasi AI

Proyek ini **dihasilkan lewat prompt**, dalam 113 commit antara 17 September dan 17 Oktober 2026.
Mekanismenya bukan "minta AI membuat aplikasi". Mekanismenya adalah **loop yang mengutamakan
spesifikasi, di mana prompt adalah spesifikasinya, repositori adalah catatannya, dan verifier
disebutkan sebelum satu baris kode pun ditulis.** Loop itulah yang bisa direproduksi, dan itulah yang
diuraikan di bawah.

#### Loop-nya

```text
   manusia menyuplai kebenaran domain      prompt membawa niat +
   (jadwal sekolah yang sungguhan,   ──▶   batasan + kriteria terima
    peran, batas wewenang)                          │
                                                   ▼
                                          AI menghasilkan artefak
                                    (migrasi · API · UI · dokumen · uji)
                                                   │
                                                   ▼
                                    verifier dijalankan (disebut di prompt)
                                     tsc · eslint · vite build · suite uji
                                                   │
                              ┌────────────────────┴────────────────────┐
                              ▼                                          ▼
                     verifier lolos                              verifier gagal
                              │                                          │
                              ▼                                          ▼
              commit + entri changelog PRD                prompt diperbaiki lalu dijalankan
              + catatan memori proyek                     ulang; batasannya ditulis ke memori
                              │                            supaya kesalahan itu tidak terulang
                              └──────────────┬───────────────────────────┘
                                             ▼
                             prompt berikutnya mulai dari spesifikasi terbaru
```

#### Anatomi prompt yang dipakai di proyek ini

Setiap prompt substantif di proyek ini membawa lima slot. Polanya terlihat di changelog PRD, di mana
setiap versi mencatat lima hal yang sama.

| Slot | Pertanyaan yang dijawab | Contoh dari proyek ini |
| :--- | :--- | :--- |
| **1 · Niat** | Apa yang berubah bagi pengguna? | "Admin harus bisa menerbitkan keenam kelas dalam satu tindakan" |
| **2 · Batasan** | Apa yang tidak boleh rusak, dan apa yang dilarang? | "Korlas boleh mengunci kelasnya sendiri, bukan kelas lain. Jangan tambah tabel kelas." |
| **3 · Bukti** | Apa di kode yang ada yang menentukan desainnya? | "Periksa `resolveBulkClasses` sebelum memilih di mana cakupan kelas diselesaikan." |
| **4 · Kriteria terima** | Bagaimana kita tahu ini berhasil? | "`409 drafts_remaining` menyebut kelas penyebabnya; seksi 23 `scripts/test-api.mjs` mencakupnya." |
| **5 · Artefak** | Apa lagi yang harus diperbarui selain kode? | "PRD, README, UAT_Result, test-api.mjs." |

Slot 4 adalah yang membuat loop-nya menyatu. Prompt yang tidak menyebut verifiernya menghasilkan kode
yang tidak lulus apa pun secara khusus; prompt yang menyebut `409 drafts_remaining` menghasilkan uji
yang masih berjalan setahun kemudian.

#### Niat prompt → artefak yang dihasilkan → verifier

| Niat prompt | Artefak yang dihasilkan | Verifier yang disebut di prompt |
| :--- | :--- | :--- |
| "Jadwal harus disimpan per kelas, dan tambahkan peran koordinator kelas" | `schedules.class_name`, `UNIQUE(schedule_date, class_name)`, peran `korlas`, `GET /classes`, `?class=` di semua pembacaan | `scripts/test-api.mjs`; PRD §3.3 ditulis ulang |
| "Orang tua tidak boleh bisa menyunting tanggal piket orang tua lain" | `schedule_claims` dengan `UNIQUE(schedule_id)`; klaim menulis balik ke baris jadwal | `scripts/test-claim-cross-class.mjs` (9 assertion) |
| "Publikasi harus mustahil selama masih ada baris draft" | `POST /schedules/publish` → `409 drafts_remaining` menyebut kelasnya; `setStatusByIds` menaruh syarat status di `WHERE` | `scripts/test-status.mjs` (22 assertion) |
| "Sekolah mengirim jadwal sebagai teks tempelan — impor dari dalam aplikasi" | `importParser.ts` (murni: tanpa DB, tanpa jam, tanpa throw), impor idempoten, pratinjau `dryRun`, jejak audit di `import_logs` | `scripts/test-api.mjs` seksi 24 (38 assertion) |
| "Rapat koordinasi butuh laporan keadilan beban piket" | Domain baru `src/api/laporan/`; pemeringkatan berbasis klaim plus daftar "belum pernah ambil" yang diturunkan dari `students` | `scripts/test-api.mjs` seksi 25 |
| "Tambahkan foreign key komposit pada petugas" | **Ditolak** — slot batasan menuntut migrasinya berhasil di produksi, dan rebuild tabel tidak bisa | D1 lokal + `wrangler d1 migrations apply` produksi, plus `PRAGMA foreign_key_check` |
| "Kartu petugas ada di kolom yang salah" | Kartu dipindah ke `lg:col-span-2`; `hari-ini.tsx` dipecah menjadi komponen bernama | `outputs/check-hari-ini-layout.mjs` — 39 assertion geometri |

Perhatikan baris keenam. **Sebuah prompt ditolak oleh batasannya sendiri**, dan penolakan itu dicatat
di PRD sebagai koreksi (v1.10). Itulah loop yang bekerja sebagaimana mestinya: slot batasan ada justru
supaya permintaan yang terdengar masuk akal bisa ditolak **sebelum** ia merusak data produksi.

#### Pagar pengaman yang dibawa di dalam prompt

Batasan yang diperoleh dengan susah payah dituliskan ke memori proyek dan dinyatakan ulang di prompt,
supaya sesi berikutnya tidak diam-diam membatalkannya:

| Pagar pengaman | Alasan keberadaannya |
| :--- | :--- |
| Jangan pernah menerima nama petugas dari klien | Petugas adalah relasi, bukan string; klien akan membiarkan salah ketik menciptakan "siswa" baru |
| Jangan pernah rebuild tabel di dalam migrasi D1 | `PRAGMA foreign_keys=OFF` diabaikan di dalam transaksi, dan `wrangler d1 migrations apply` memakai transaksi |
| Jangan biarkan `409` menjadi `skipped` pada operasi rentang | Pelewatan senyap adalah cara sebuah kelas terbit setengah jalan |
| Jangan biarkan UI jadi satu-satunya penegak | `<RoleGate>` menyembunyikan; `requireRole()` menegakkan |
| Selalu build sebelum deploy | `wrangler deploy` mengunggah `dist/` apa adanya — ia tidak mengompilasi |
| Jangan percaya keluaran wrangler yang dipotong pipe | Keluaran terpotong pernah menghasilkan kesimpulan salah; tulis ke berkas lalu parse JSON utuh |

#### Kenapa generasinya bisa diaudit

Tiga artefak membuat riwayat prompt bisa diperiksa, bukan sekadar anekdot:

1. **`docs/PRD_Pizza_Snack_Play.md` v1.1 → v1.21** — changelog di mana setiap entri mencatat niat
   promptnya, keputusan desainnya, dan setiap koreksi atas klaim sebelumnya. Beberapa entri secara
   eksplisit menarik kembali pernyataan sebelumnya (v1.16b, v1.21e), jadi dokumen itu menunjukkan
   kesalahannya sendiri.
2. **113 commit** — masing-masing bisa dilacak ke satu penambahan, dengan pembaruan dokumen
   di-commit bersama kodenya (`docs: selaraskan PRD ke v1.21`).
3. **Memori proyek** (`.workbuddy-ai/memory/`) — log harian plus berkas konvensi terkurasi, sehingga
   sesi yang mulai dari nol tidak mengulang masalah yang sudah dipecahkan.

---

## 3. Nilai Bisnis

### 3.1 Metrik Terukur

#### Metrik pengiriman (diukur dari repositori)

| Dimensi | Nilai | Bukti |
| :--- | :--- | :--- |
| Waktu berjalan | 31 hari (17 Sep – 17 Okt 2026) | tanggal commit pertama dan terakhir |
| Commit | 113 | `git rev-list --count HEAD` |
| Berkas sumber | 181 (105 `.ts`, 71 `.tsx`, 5 lainnya) | `find src -type f` |
| Baris TypeScript/TSX | 27.881 | `wc -l` atas `src/**` |
| Endpoint API | 65 (29 GET · 22 POST · 7 PUT · 7 DELETE) | `src/api/*/route.ts` |
| Domain API | 9 | `src/api/*/route.ts` |
| Tabel basis data | 13 | `drizzle/migrations/*.sql` |
| Migrasi | 9 (`0000`–`0008`) | `drizzle/migrations/` |
| Halaman untuk pengguna | 14 (12 setelah login + halaman depan + login) | `src/routes/` |
| Tujuan navigasi | 11 | `src/components/navItems.ts` |
| Peran | 3 (+1 konsumen hanya-baca lewat Excel) | titik pemanggilan `requireRole()` |
| Fitur bernomor | 15 label (F1–F14): **12 terkirim**, 1 sebagian, 1 direncanakan, 1 ditinggalkan dengan sengaja | PRD §4 |
| Komponen yang bisa dipakai ulang | 65 berkas di bawah `src/components/` | `find src/components -type f` |

#### Metrik kualitas

| Dimensi | Nilai | Bukti |
| :--- | :--- | :--- |
| Uji unit | 85 di 10 berkas / 23 suite | `grep -c 'it(\|test('` atas `src/**/*.test.ts` |
| Assertion integrasi API | 540 di 8 skrip | `grep -c 'check('` per skrip |
| Assertion peramban | 20 skrip pemeriksaan Puppeteer, beberapa memeriksa geometri bukan sekadar keberadaan | `outputs/check-*.mjs` |
| Kasus UAT terdokumentasi | 21 | `docs/UAT_Result.md` |
| Type-check / lint / build | bersih (`tsc -b`, `eslint .`, `vite build`) | skrip build |
| Insiden produksi terdokumentasi | 2, keduanya dengan akar masalah dan perbaikan permanen yang tercatat | PRD v1.10 (FK), v1.12 (pekan salah label) |

#### Cakupan data

| Dimensi | Sebelum (berkas sumber) | Sesudah (sistem) |
| :--- | :--- | :--- |
| Catatan menu | 21 baris hari berbentuk teks bebas | 43 menu · 85 item menu · 9 kategori |
| Penugasan piket | 86 string nama, tanpa identitas | Relasi bertipe ke `students` + `parents` |
| Siswa | 38 nama unik dalam teks | Baris `students` yang tertaut ke akun orang tua |
| Pekan yang dimodelkan | 5 blok, dilabeli tangan (satu keliru) | 11 baris `weeks` + tanggal yang diverifikasi kalender |
| Kedalaman riwayat | Berkasnya ditimpa setiap bulan | Tabel append-only; klaim dan impor membawa baris audit |
| Bisa ditanyai | Hanya dibaca dari depan ke belakang | 65 endpoint, 11 tampilan yang bisa dinavigasi |

#### Biaya

| Dimensi | Nilai |
| :--- | :--- |
| Biaya infrastruktur | **0** (Cloudflare Workers + D1 tier gratis) |
| Lisensi perangkat lunak | **0** (semua dependensi sumber terbuka) |
| Biaya distribusi | **0** (PWA dipasang dari URL; tanpa app store) |
| Tenaga admin tambahan | **0 staf baru** — peran korlas mendistribusikan ulang pekerjaan yang sudah ada |

### 3.2 Dampak yang Terdefinisi Jelas

| # | Dampak | Sebelum | Sesudah | Cara diverifikasi |
| :- | :--- | :--- | :--- | :--- |
| I1 | **Waktu menjawab "snack hari ini apa?"** | Buka berkas teks, cari tanggalnya, baca satu baris | Satu layar setelah masuk | `/hari-ini` merender kartu hari; `outputs/check-hari-ini-layout.mjs` |
| I2 | **Keterlihatan petugas** | Nama di dokumen yang tidak dimiliki siapa pun | Petugas adalah relasi bertipe; nomor wali petugas jadi tautan `wa.me`, dengan "belum diperbarui" dibedakan dari "belum ada petugas" | 2 uji unit pada `phone.ts` / `whatsapp.ts`; assertion `petugasPhone` di `scripts/test-petugas.mjs` |
| I3 | **Beban koordinasi bulanan** | Satu admin memelihara enam kelas | Enam korlas masing-masing memelihara satu kelas; admin tetap punya override seluruh sekolah | Uji peran di `scripts/test-auth.mjs`; assertion `403` untuk penulisan lintas kelas |
| I4 | **Kelas terbit separuh** | Tidak terdeteksi — berkasnya dikirim atau tidak | **Mustahil.** Publikasi menolak dengan `409 drafts_remaining` dan menyebut kelasnya | `scripts/test-status.mjs` (22 assertion) |
| I5 | **Keadilan beban piket** | Hanya perasaan, tak bisa diverifikasi | Laporan yang memeringkat setiap orang tua menurut piket yang diambil, plus daftar yang belum pernah | `GET /api/laporan`; berbasis klaim, jadi tidak mungkin berbeda dari yang dilihat orang tua |
| I6 | **Mengambil tanggal kosong** | Balasan pertama di grup yang menang, tanpa jejak | Aman dari rebutan di level basis data lewat `UNIQUE(schedule_id)` | `scripts/test-claim-cross-class.mjs` (9 assertion) |
| I7 | **Masukan keliru dari sekolah** | Pekan yang salah label diterima tanpa suara | Pengimpor mencocokkan label hari dengan kalender sungguhan, menggeser pekan yang salah label, dan memperingatkan; `dryRun` menampilkan pratinjau sebelum menulis | `scripts/test-api.mjs` seksi 24 (38 assertion) |
| I8 | **Administrasi akun** | Satu akun satu waktu, dengan tangan | Ekspor Excel → sunting → impor, dengan pratinjau dan alasan per baris | `scripts/test-api.mjs`; 34 uji unit pada pengimpor/pengekspor |
| I9 | **Memori institusi** | Berkasnya ditimpa; bulan lalu hilang | Riwayat append-only; dua bulan data sumber tersimpan dan bisa ditanyai | `data/` + tabel `weeks`/`schedules` |
| I10 | **Biaya operasional** | — | Biaya infrastruktur marginal nol, tanpa staf baru | Konfigurasi deploy; `wrangler.json` |

### 3.3 Rencana Pengukuran

Klaim dampak di atas bukan harapan — sebagian besarnya sudah terinstrumentasi, karena data yang
dibutuhkan memang tersimpan:

| Metrik yang akan dilacak | Sumber yang sudah ada | Yang masih perlu dibangun |
| :--- | :--- | :--- |
| Distribusi piket per orang tua | `schedule_claims` (sudah jadi sumber `/laporan`) | tidak ada — cukup tampilkan laporan yang sudah ada tiap bulan |
| Porsi tanggal yang diambil orang tua vs ditunjuk korlas | `schedule_claims` di-join ke asal `schedules.petugas_*` | satu penghitung di halaman laporan |
| Latensi publikasi (draft → published per kelas) | `schedules.locked_at`, `published_at` | satu query agregat kecil |
| Kualitas impor (baris dilewati, rentang digeser) | `import_logs` — ditulis tapi belum ditampilkan | satu tampilan di area admin |
| Jangkauan orang tua | `users.isActive`, kejadian pemasangan PWA | satu penghitung sederhana |
| Tren keadilan piket antar bulan | klaim per bulan | perbandingan bulanan di `/laporan` |

`import_logs` adalah contoh paling jelas dari tabel yang ditulis tapi belum dibaca — datanya untuk I7
sudah ada hari ini; hanya tampilannya yang belum.

### 3.4 Batasan yang Jujur

Ditulis dengan sengaja, karena deskripsi yang mengaku tanpa celah bukan deskripsi sistem sungguhan:

- **Ekspor PDF belum dibuat.** Ekspor Excel sudah (jadwal dan akun); PDF untuk keperluan cetak masih
  terbuka (F5 sebagian).
- **Tanpa notifikasi push.** F6 masih direncanakan; hari ini aplikasinya harus dibuka untuk dibaca.
- **Tanpa akun siswa.** Piket dimodelkan sebagai kewajiban keluarga, jadi akun wali adalah satu-satunya
  pintu masuk. Tampilan untuk siswa adalah keputusan baru, bukan sebuah pengaturan.
- **Tanpa data offline.** Aplikasi bisa dipasang sebagai PWA, tetapi jadwalnya tidak di-cache untuk
  dibaca offline — pilihan yang disengaja, karena jadwal basi lebih buruk daripada tidak ada jadwal.
- **Tanpa analitik pemakaian.** Tidak ada yang melacak halaman mana yang benar-benar dibuka orang tua,
  jadi klaim adopsi di §3.3 bisa diukur tetapi belum diukur.
- **`import_logs` ditulis, belum ditampilkan.** Jejak auditnya ada; UI-nya belum.
- **Asumsi satu sekolah.** Model datanya tidak punya `school_id`. Multi-tenant akan menjadi migrasi,
  bukan perubahan konfigurasi.

---

## Lampiran A — Indeks bukti

| Klaim | Di mana memeriksanya |
| :--- | :--- |
| Daftar fitur dan alasannya | `docs/PRD_Pizza_Snack_Play.md` §4, changelog v1.1–v1.21 |
| Volume data sumber (136 baris, 38 siswa, 86 penugasan) | `data/output_jadwal_piket.txt` |
| Daftar tabel dan migrasi | `drizzle/migrations/*.sql` (9 berkas, 13 tabel) |
| Daftar endpoint (65) | `src/api/*/route.ts` |
| Batas peran | `src/api/*/route.ts` (`requireRole`), `src/api/utils/classScope.ts`, `src/components/AdminOnly.tsx` |
| Daftar navigasi dan halaman | `src/components/navItems.ts`, `src/routes/` |
| Volume uji (85 unit · 540 integrasi) | `src/**/*.test.ts`, `scripts/test-*.mjs` |
| Kasus UAT (21) | `docs/UAT_Result.md` |
| Model deployment dan biaya | `wrangler.json`, `package.json` |
| Riwayat insiden produksi | Changelog PRD v1.10 (FK komposit), v1.12 (pekan salah label) |
| Catatan prompt-ke-artefak | `git log` (113 commit), changelog PRD, `.workbuddy-ai/memory/` |
