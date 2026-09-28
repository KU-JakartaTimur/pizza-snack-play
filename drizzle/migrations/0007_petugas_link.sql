/*
  Petugas menjadi relasi ke `students`, bukan teks bebas.

  Menambahkan `petugas_student_id` dan `petugas_parent_id` ke `schedules`.
  `petugas_name` dan `petugas_parent_name` sudah dibuat oleh `0003_quiet_nitro`.

  ═══════════════════════════════════════════════════════════════════════
  Kenapa TANPA foreign key — versi pertama migrasi ini gagal di production
  ═══════════════════════════════════════════════════════════════════════

  Rancangan awalnya mengikat petugas dengan dua FK komposit ke `students`,
  sehingga database yang menolak pasangan siswa–kelas yang tidak cocok.
  Rancangan itu dibatalkan setelah terbukti tidak bisa dijalankan lewat
  migrasi D1. Ringkasnya:

  1. FK komposit menuntut indeks **unik** pada pasangan kolom tujuan yang
     persis, jadi tabel `schedules` harus dibangun ulang. Cara lazim
     mematikannya selama rebuild — `PRAGMA foreign_keys=OFF` — **diabaikan
     secara senyap di dalam transaksi**, sementara `wrangler d1 migrations
     apply` membungkus migrasi dalam transaksi. Di production ini muncul
     sebagai:

       FOREIGN KEY constraint failed: SQLITE_CONSTRAINT
       (extended: SQLITE_CONSTRAINT_FOREIGNKEY)

     padahal di lokal — yang mengeksekusi pernyataan satu per satu, sehingga
     PRAGMA-nya benar-benar berlaku — migrasi yang sama berhasil. Bukan data
     yang salah, melainkan perbedaan semantik transaksi.

  2. Bahkan pada jalur yang "berhasil", tabel hasilnya korup: karena
     penegakan FK tidak pernah benar-benar kembali aktif, `PRAGMA
     foreign_key_check` melaporkan 292 pelanggaran terhadap `students`.

  3. `ON UPDATE cascade` pada FK yang menyertakan `class_name` menimbulkan
     efek samping nyata: memindahkan anak ke kelas lain ikut menulis
     `class_name` pada baris jadwalnya, dan itu menabrak
     `UNIQUE(schedule_date, class_name)` bila baris tujuan sudah ada.

  Konsistensi petugas kini ditegakkan `resolvePetugas()` di
  `src/api/schedules/service.ts` — satu tempat, dipakai bersama oleh
  createSchedule / updateSchedule / copyWeek / claims. Petugas selalu dicari
  di roster kelas baris yang bersangkutan, sehingga `petugas_not_found` (400)
  tetap muncul bila id-nya bukan siswa kelas itu.

  ═══════════════════════════════════════════════════════════════════════
  Baris lama
  ═══════════════════════════════════════════════════════════════════════

  88 baris jadwal di production berisi `petugas_name` dengan nama yang tidak
  ada di `students` (mis. `Shezan`, `Zidane`, `Huma`) — diisi lewat aplikasi
  versi lama, ketika kolom Petugas memang teks bebas.

  Kedua kolom id sengaja **tidak diisi** untuk baris tersebut, dan tidak ada
  backfill: memetakan nama ke siswa secara otomatis berisiko salah orang.
  `petugas_name` dibiarkan apa adanya, jadi jadwal yang sudah dipublikasi
  tetap tampil persis seperti sebelumnya, dan korlas dapat menunjuk ulang
  lewat dropdown Petugas kapan saja.
*/

ALTER TABLE `schedules` ADD `petugas_student_id` integer;--> statement-breakpoint
ALTER TABLE `schedules` ADD `petugas_parent_id` integer;
