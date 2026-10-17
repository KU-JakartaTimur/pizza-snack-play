# STORY.id.md — Deskripsi Proyek Visualisasi · Pizza Snack Play

> Dokumen ini adalah pasangan bahasa Indonesia dari `STORY.md`. Struktur, jumlah
> halaman, dan tata letaknya sama persis — dek Indonesia dibuat dengan
> menerjemahkan simpul teks pada dek Inggris, bukan menggambar ulang. Yang
> berubah hanya bahasanya, sehingga angka pada kolom "kata" di sini **diukur
> ulang** dari berkas `slides/*.slide` versi Indonesia, bukan disalin.

## ① Penyelarasan maksud

**Audiens dan kesempatan.** Sebuah penyerahan untuk tinjauan proyek / pameran.
Pembacanya adalah penilai yang belum pernah melihat aplikasinya dan akan
menghabiskan beberapa menit pada dek. Ia melek teknis, tetapi bukan spesialis
pada stack ini. Kesempatannya adalah *penilaian*, bukan pelatihan internal —
jadi dek harus terbaca sebagai bukti, bukan sebagai instruksi.

**Tujuan inti.** Setelah halaman terakhir, penilai harus percaya tiga hal dan
bisa mengulanginya:

1. Ini **sistem nyata di produksi** untuk sekolah nyata, bukan demo — angkanya
   diukur dari repositori, bukan ditaksir.
2. Desainnya membuat kegagalan tertentu menjadi **mustahil** (kelas terbit
   separuh, tanggal piket diklaim dua kali, penyuntingan lintas kelas), bukan
   sekadar kecil kemungkinannya.
3. Proyek ini **dihasilkan lewat prompt di dalam loop yang bisa diverifikasi** —
   niat, batasan, bukti, penerimaan, artefak — dan loop itu terdokumentasi
   cukup rapi untuk diperiksa.

**Panjang.** 16 halaman. Kuota hero untuk 16 halaman: 4 hero (25%).

**Nada visual.** Analitis · berbasis bukti · terkendali · netral-hangat · tanpa
hiperbola.

**Batas isi.**
- *Wajib ada:* artefak sumber dan rasa sakit yang ditimbulkannya; tiga peran dan
  batas di antaranya; mesin `draft → locked → published`; susunan lapisan
  teknis; bagaimana prompt menggerakkan generasi; metrik hasil pengukuran;
  batasan yang jujur.
- *Tidak dibahas:* penelusuran fitur satu per satu, tangkapan layar setiap
  halaman, data pribadi sekolah, atau angka apa pun yang tidak bisa dilacak ke
  sebuah berkas di repositori.
- *Tidak boleh muncul:* metrik karangan, bahasa "revolusioner/terdepan di
  industri", emoji, atau klaim dampak tanpa verifier di belakangnya.

---

## ② Kerangka halaman

**Total 16 halaman, dalam tiga bab.** Batas bab membawa halaman
`type: section`, dan katalog mendeklarasikan tepat tiga bab — jadi ada tepat
tiga halaman section, bernomor 01–03, sama persis dengan katalog.

| Bab | Entri katalog | Halaman section | Halaman di bab |
| :--- | :--- | :--- | :--- |
| 01 | `01 Ringkasan Proyek` — halaman 03–07 | **halaman 03** | 04, 05, 06, 07 |
| 02 | `02 Desain Solusi` — halaman 08–12 | **halaman 08** | 09, 10, 11, 12 |
| 03 | `03 Nilai Bisnis` — halaman 13–16 | **halaman 13** | 14, 15, 16 |

**Halaman hero:** 01 (sampul), 07 (masalah inti — argumen dek), 14 (metrik —
buktinya), 16 (penutup). Empat hero, 25% dari 16, tidak ada yang bersebelahan,
masing-masing dipisahkan minimal satu halaman pendukung.

**Kurva ritme:**

| Halaman | 01 | 02 | 03 | 04 | 05 | 06 | 07 | 08 | 09 | 10 | 11 | 12 | 13 | 14 | 15 | 16 |
| :--- | :- | :- | :- | :- | :- | :- | :- | :- | :- | :- | :- | :- | :- | :- | :- | :- |
| ritme | puncak | lembah | transisi | lembah | puncak | lembah | puncak | transisi | lembah | lembah | puncak | lembah | transisi | puncak | lembah | puncak |

Tidak ada tiga lembah berurutan. Pergantian bab selalu transisi.

**Anggaran tata letak asimetris:** 14 dari 16 halaman memakai tata letak
asimetris (87,5%, syarat ≥ 40%). Hanya halaman 03 dan 13 yang memakai tata
letak section simetris penuh (anggaran: maks 2). `gambar besar kiri + teks
kanan` dan `dua kolom asimetris` bersama-sama muncul di 6 halaman (37,5%,
batas 40%). `N kartu sejajar` dipakai **nol** kali.

---

## ③ Garis besar halaman

Kolom "kata" diukur dari simpul teks tiap berkas `.slide` (termasuk footer
watermark dan nomor halaman, jadi kurang lebih 7 kata per halaman berasal dari
footer).

| # | judul | tipe | peran | ritme | tata letak | visual | peran visual | kepadatan | anti-pola | deskripsi |
| :- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 01 | Pizza Snack Play | cover | hero | puncak | gambar penuh + teks menimpa garis | L1: app_logo.png (400×400) + SVG kalender/papan jalan | atmosfer | 38 kata / 1 gambar / 40% ruang kosong | Tanpa baris kartu; tanpa daftar butir di sampul; tanpa thumbnail hiasan di samping judul | Proyek dalam satu baris, plus tiga fakta yang membuatnya kredibel: 113 commit, 31 hari, berjalan di produksi. |
| 02 | Isi dek ini | katalog | pendukung | lembah | judul kiri + isi kanan | L3: tiga lencana bab ungu | bukti | 106 kata / 0 gambar / 25% ruang kosong | Tanpa pratinjau empat kartu; tanpa paragraf isi di halaman katalog | Tiga bab dengan rentang halamannya, masing-masing satu kalimat tentang apa yang didapat pembaca. |
| 03 | BAB 01 · Ringkasan Proyek | section | transisi | transisi | visual penuh layar + judul besar | L1: geometri SVG abstrak (penuh, opasitas .14) | atmosfer | 29 kata / 0 gambar / 45% ruang kosong | Tanpa pratinjau empat kartu; tanpa paragraf padat di halaman section | Latar ungu, teks terbalik, nomor bab besar. |
| 04 | 136 baris adalah seluruh sistemnya | isi | pendukung | lembah | gambar besar di atas + kartu di bawah | L1: batang bertumpuk SVG dari artefak sumber (1100×260) | bukti | 152 kata / 0 gambar / 22% ruang kosong | Tanpa baris kartu tanpa grafik di atasnya; grafik tidak boleh dikecilkan jadi thumbnail di sudut | Komposisi terukur berkas sumber — 86 penugasan piket, 21 menu, 5 tajuk pekan tulisan tangan — dan penilaiannya: formatnya, bukan sekolahnya, yang menyebabkan setiap titik nyeri. |
| 05 | Delapan momen dalam pekan sekolah | isi | pendukung | puncak | dua kolom asimetris | L2: strip pekan SVG dengan delapan momen bertanda (360×420) | bukti | 201 kata / 0 gambar / 22% ruang kosong | Tanpa grid empat kartu selebar sama; tanpa belahan 50:50 | Skenario sebagai belahan 60:40 — momen berulang di sisi lebar, pasangan yang membentuk arsitektur (klaim + publikasi) di sisi sempit. |
| 06 | Tiga peran, satu batas tegas | isi | pendukung | lembah | gambar besar kiri + teks kanan | L1: diagram wewenang SVG — tiga tingkat dengan dinding (520×440) | bukti | 157 kata / 0 gambar / 24% ruang kosong | Tanpa baris kartu selebar sama; tanpa belahan 50:50 | Korlas berkuasa di dalam satu kelas dan tak berdaya di luarnya — ditegakkan `requireRole()`, hanya dicerminkan `RoleGate()`. |
| 07 | Masalah intinya | isi | hero | puncak | angka raksasa + wawasan | L1: huruf 64px + ikon dokumen SVG | jangkar | 102 kata / 0 gambar / 40% ruang kosong | Tanpa baris kartu selebar sama; jangan menyelipkan frasa raksasa ke sudut; tanpa grafik di halaman ini | Masalah inti sebagai satu kalimat, dengan belahan sisi baca / sisi tulis di bawahnya. |
| 08 | BAB 02 · Desain Solusi | section | transisi | transisi | gambar penuh + teks menimpa garis | L1: bidang berlapis SVG abstrak (penuh, opasitas .14) | atmosfer | 32 kata / 0 gambar / 45% ruang kosong | Tanpa pratinjau empat kartu; tanpa paragraf padat di halaman section | Transisi ke bab desain, nomor bab 02 besar. |
| 09 | draft → locked → published | isi | pendukung | lembah | dua kolom asimetris | L1: mesin tiga keadaan SVG dengan jalur balik unlock (620×380) | jangkar | 157 kata / 0 gambar / 22% ruang kosong | Tanpa baris kartu selebar sama; mesin keadaan tidak boleh direduksi jadi tiga kotak kecil | Mesin keadaan, aturan 409 yang membuat kelas terbit separuh mustahil, dan satu pengecualian yang disengaja. |
| 10 | Sembilan domain, 65 endpoint | isi | pendukung | lembah | gambar besar kiri + teks kanan | L1: tumpukan empat lapis SVG di dalam Worker (560×440) | bukti | 149 kata / 0 gambar / 22% ruang kosong | Tanpa baris kartu selebar sama; jangan ratakan empat lapis jadi satu daftar | Browser → Worker (middleware / route / controller+service / repository) → D1, dengan alasan tiap lapis ada. |
| 11 | Bagaimana prompt menggerakkan generasi | isi | pendukung | puncak | gambar besar di atas + kartu di bawah | L1: loop lima langkah SVG dengan jalur umpan balik (1100×300) | jangkar | 159 kata / 0 gambar / 24% ruang kosong | Tanpa baris kartu selebar sama; loop tidak boleh digambar sebagai lima kotak lurus tanpa panah balik | Kebenaran domain → prompt → generasi → verifier → catat, dengan panah umpan balik berlabel: bila gagal, batasannya ditulis ke memori. |
| 12 | Anatomi prompt dan pagar pengaman | isi | pendukung | lembah | gambar besar kiri + teks kanan | L1: kartu prompt lima slot SVG (520×440) | bukti | 213 kata / 0 gambar / 24% ruang kosong | Tanpa baris kartu selebar sama; tanpa belahan 50:50 | Lima slot, prompt yang ditolak oleh batasannya sendiri, dan enam pagar pengaman yang dibawa di dalam prompt. |
| 13 | BAB 03 · Nilai Bisnis | section | transisi | transisi | visual penuh layar + judul besar | L1: batang menanjak SVG abstrak (penuh, opasitas .14) | atmosfer | 37 kata / 0 gambar / 45% ruang kosong | Tanpa pratinjau empat kartu; tanpa paragraf padat di halaman section | Transisi ke bab nilai, nomor bab 03 besar. |
| 14 | Tiga angka, tiga penilaian | isi | hero | puncak | angka raksasa + wawasan | L1: tiga angka raksasa (min 64px) + strip tick SVG | jangkar | 90 kata / 0 gambar / 40% ruang kosong | Tanpa baris kartu selebar sama; jangan taruh ketiga angka di dalam kartu selebar sama; tanpa grafik yang bersaing dengan angka | Tiga jangkar: 113 commit dalam 31 hari, 540 assertion integrasi, biaya infrastruktur marginal nol — masing-masing dengan penilaian yang menyusul darinya. |
| 15 | Dampak, sebelum dan sesudah | isi | pendukung | lembah | dua kolom asimetris | L2: pasangan sebelum/sesudah SVG (400×420) | bukti | 200 kata / 0 gambar / 22% ruang kosong | Tanpa baris kartu selebar sama; tanpa tabel dua kolom simetris | Empat pasangan sebelum/sesudah (I1, I4, I5, I6) dengan verifiernya, plus delapan batasan yang jujur — ditaruh di halaman yang sama supaya batasannya ikut terbaca, bukan dilewati. |
| 16 | Kewajiban bersama, akhirnya bisa ditanyakan. | penutup | hero | puncak | gambar penuh + teks menimpa garis | L1: app_logo.png (200×200) di tengah | jangkar | 41 kata / 1 gambar / 45% ruang kosong | Tanpa baris kartu; tanpa daftar butir di halaman penutup | Penutup satu baris dan URL produksinya. |

---

## Checklist

- Halaman hero: 4 dari 16 (25%) — di dalam 20–30% ✓
- Tidak ada dua halaman hero bersebelahan ✓
- Tidak ada tiga halaman `lembah` berurutan ✓
- `N kartu sejajar` dipakai 0 kali (batas 2) ✓
- Tata letak asimetris: 14 dari 16 (87,5%, syarat ≥ 40%) ✓
- Tidak ada dua halaman bersebelahan dengan tata letak sama ✓
- `gambar besar kiri + teks kanan` + `dua kolom asimetris`: 6 dari 16 (37,5%, batas 40%) ✓
- Tepat 3 halaman `type: section`, bernomor 01–03, sama persis dengan katalog ✓
- Setiap halaman membawa `role` / `rhythm` / `visual_role` / `anti_pattern` ✓
- Setiap halaman dengan angka kunci menyebut penilaian yang menyusul darinya ✓
- Semua 16 halaman lolos `slidep lint` tanpa diagnostik ✓
- Nol emoji di seluruh dek ✓
