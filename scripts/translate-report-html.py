#!/usr/bin/env python3
"""Terjemahkan laporan HTML Inggris -> Indonesia, simpul teks per simpul teks.

Prinsip: JANGAN menulis ulang markup. Ambil berkas HTML yang sudah lolos
validasi keseimbangan tag, lalu ganti HANYA isi simpul teks (teks di antara
'>' dan '<'), dengan kunci = teks yang spasi-nya dinormalkan. Blok <style>
dilewati seluruhnya.

Kelebihan pendekatan ini: struktur, kelas CSS, id, href, dan atribut tidak
tersentuh, sehingga tata letak keluaran identik dengan berkas Inggris.

Spasi di awal/akhir simpul dipertahankan apa adanya, supaya teks yang terpecah
oleh tag inline (mis. "136 lines</strong>, <strong>5 weekly blocks") tidak
kehilangan spasi dan menempel saat dirender.

Skrip melaporkan setiap simpul teks yang tidak punya terjemahan dan tidak ada
di KEEP, lalu keluar dengan status != 0 — supaya string yang terlewat tidak
diam-diam lolos dalam bahasa Inggris.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "Visualization Project Description" / "Visualization Project Description.html"
DST = ROOT / "Deskripsi Proyek Visualisasi" / "Deskripsi Proyek Visualisasi.html"

# ── Atribut yang perlu diterjemahkan (di luar simpul teks) ────────────────────
ATTRS: list[tuple[str, str]] = [
    ('<html lang="en">', '<html lang="id">'),
    ('alt="Pizza Snack Play logo"', 'alt="Logo Pizza Snack Play"'),
    (
        'aria-label="Schedule lifecycle: draft, locked, published, '
        'with admin unlock returning to draft"',
        'aria-label="Siklus hidup jadwal: draft, locked, published, '
        'dengan buka kunci oleh admin yang mengembalikan ke draft"',
    ),
    (
        'aria-label="Architecture: browser, Cloudflare Worker with four layers, and D1"',
        'aria-label="Arsitektur: peramban, Cloudflare Worker dengan empat lapisan, dan D1"',
    ),
]

# ── Simpul teks yang memang dibiarkan apa adanya ─────────────────────────────
KEEP: set[str] = {
    # tanda baca & simbol
    "#", "(", ")", ").", "+", ",", ".", "/", ";", "—", "·", "→", "↺", "✕", "“",
    # angka & pengenal
    "0", "9", "11", "12", "13", "14", "15", "20", "21", "22", "23", "33", "38",
    "43", "65", "85", "86", "113", "181", "200", "367", "403", "409", "540",
    "27,881", "0007", "01", "02", "03", "04", "05", "I1", "I2", "I3", "I4",
    "I5", "I6", "I7", "I8", "I9", "I10",
    # nama produk, peran, keadaan, kata kerja HTTP
    "Pizza Snack Play", "Admin", "Korlas", "draft", "locked", "published",
    "lock", "publish", "unlock", "skipped", "GET", "PUT", "DELETE", "UI",
    "Prompt", "Stack", "Build", "Runtime", "WHERE",
    # nilai konfigurasi / basis data
    "409 drafts_remaining", "409 not_editable", "FOREIGN KEY constraint failed",
    "PRAGMA foreign_keys=OFF", "PRAGMA foreign_key_check",
    "ALTER TABLE ADD COLUMN", "UNIQUE(schedule_id)",
    "UNIQUE(schedule_date, class_name)", "users", "parents", "students",
    "schedules", "schedule_claims", "holidays", "menus", "menu_items",
    "categories", "menu_categories", "import_logs", "settings", "weeks",
    "users.isActive", "schedules.class_name", "schedules.locked_at",
    "published_at", "schedules.petugas_*", "petugas_student_id",
    "petugas_parent_id", "petugasPhone", "school_id", "importParser.ts",
    "setStatusByIds", "resolveBulkClasses", "classScope", "requireRole",
    "requireRole()", "canWriteClass(user, row.className)", "dryRun",
    "CategoryDto", "CategorySummaryDto", "wa.me", "basePath(\"/api\")",
    '&lt;RoleGate&gt;',
    '&lt;RoleGate need="admin" | "schedule" | "catalog"&gt;',
    # endpoint
    "GET /classes", "GET /api/laporan", "POST /schedules/lock",
    "POST /schedules/publish", "POST /schedules/bulk/{lock,publish,unlock}",
    "/schedules/publish", "/hari-ini", "/laporan", "?class=",
    # berkas & perintah
    "data/output_jadwal_piket.txt", "data/", "dist/", "docs/PRD_Pizza_Snack_Play.md",
    "docs/UAT_Result.md", "docs: selaraskan PRD ke v1.21", "drizzle/migrations/*.sql",
    "outputs/check-*.mjs", "package.json", "scripts/test-*.mjs", "src/**/*.test.ts",
    "src/api/*/route.ts", "src/api/laporan/", "src/api/utils/classScope.ts",
    "src/components/AdminOnly.tsx", "src/components/navItems.ts", "src/routes/",
    "wrangler.json", "wrangler deploy", "wrangler d1 migrations apply",
    "d1 migrations apply", "vite build", "tsc", "eslint", "git log",
    "grep -c 'check('", "grep -c 'it(|test('", "check-hari-ini-layout.mjs",
    "hari-ini.tsx", "phone.ts", "whatsapp.ts", "middleware/", "route.ts",
    "repository.ts", "controller + service", "lg:col-span-2",
    # tumpukan teknologi
    "BHVR on Cloudflare", "Cloudflare Workers", "Cloudflare D1 (SQLite)",
    "Cloudflare D1 · SQLite", "Cloudflare Worker · Hono router",
    "Drizzle ORM + drizzle-kit", "React 19 · TanStack Router · TanStack Query",
    "Vite 6 +", "@cloudflare/vite-plugin", "@theme",
    "HTTPS · JWT Bearer · basePath /api",
    # tanggal & URL yang sudah benar
    "14 - 18 Oktober 2026", "pizza-snack-play.topidesta.workers.dev",
    "§4, changelog v1.1–v1.21", "“PRD, README, UAT_Result, test-api.mjs.”",
    # nama skrip uji
    "test-api.mjs", "test-auth.mjs", "test-petugas.mjs", "test-status.mjs",
    "test-roster-petugas.mjs", "test-claim-cross-class.mjs",
    "profile-account.mjs", "profile-students.mjs",
    # nama lain yang dibiarkan
    ".workbuddy-ai/memory/", "foreign_key_check", "korlas",
    # hasil terjemahan yang muncul kembali sebagai simpul sendiri
    "bertugas", "pada", "dan", "di",
}

# ── Terjemahan ───────────────────────────────────────────────────────────────
MAP: dict[str, str] = {
    # ── serpihan kalimat (terpecah oleh tag inline) ──
    ") and": ") dan",
    ", plus": ", ditambah",
    ", while": ", sementara",
    "with": "dengan",
    "in": "di",
    "on": "piket",
    "took": "mengambil",
    # ── kepala halaman ──
    "Visualization Project Description": "Deskripsi Proyek Visualisasi",
    "Visualization Project Description — Pizza Snack Play":
        "Deskripsi Proyek Visualisasi — Pizza Snack Play",
    "A school snack duty &amp; menu scheduling platform — generated by prompt, "
    "verified by tests, and running in production for a real school.":
        "Platform jadwal piket &amp; menu snack sekolah — dihasilkan lewat prompt, "
        "diverifikasi oleh tes, dan berjalan di produksi untuk sekolah nyata.",
    "pizza-snack-play.topidesta.workers.dev &nbsp;·&nbsp; 113 commits &nbsp;·&nbsp; "
    "31 days &nbsp;·&nbsp; 0 infrastructure cost":
        "pizza-snack-play.topidesta.workers.dev &nbsp;·&nbsp; 113 commit &nbsp;·&nbsp; "
        "31 hari &nbsp;·&nbsp; 0 biaya infrastruktur",
    "Category": "Kategori",
    "Prompt-driven AI generation": "Generasi AI yang digerakkan prompt",
    "Data store": "Penyimpanan data",
    "D1 · 13 tables · 9 migrations": "D1 · 13 tabel · 9 migrasi",
    "Users": "Pengguna",
    "3 roles · 4 audiences": "3 peran · 4 audiens",
    # ── daftar isi ──
    "1 · Project Overview": "1 · Ringkasan Proyek",
    "Scenarios": "Skenario",
    "Real-World Insights": "Wawasan Nyata",
    "2 · Solution Design": "2 · Desain Solusi",
    "Prompt-Driven Generation": "Generasi yang Digerakkan Prompt",
    "3 · Business Value": "3 · Nilai Bisnis",
    "Limits": "Batasan",
    # ── 1 · Ringkasan Proyek ──
    "— Project Overview": "— Ringkasan Proyek",
    "Pizza Snack Play replaces a single plain-text file that a school used to run "
    "its daily snack duty roster — and turns it into a system that can be asked "
    "questions.":
        "Pizza Snack Play menggantikan satu berkas teks polos yang dipakai sekolah "
        "untuk menjalankan jadwal piket snack hariannya — dan mengubahnya menjadi "
        "sistem yang bisa ditanyai.",
    "The source artefact is preserved in the repository and is the whole data model "
    "the school was working with:":
        "Artefak sumber tersimpan di repositori dan merupakan keseluruhan model data "
        "yang dipakai sekolah:",
    "136 lines": "136 baris",
    "5 weekly blocks": "5 blok pekanan",
    "21 menu lines": "21 baris menu",
    "86 duty assignments": "86 penugasan piket",
    "38 unique student names": "38 nama siswa unik",
    ", covering classes 1–5. Every requirement in this project traces back to a "
    "property of that format — not to a survey.":
        ", mencakup kelas 1–5. Setiap kebutuhan di proyek ini bisa dilacak kembali "
        "ke suatu sifat format tersebut — bukan ke sebuah survei.",
    "What the source artefact actually contains":
        "Apa yang sebenarnya ada di artefak sumber",
    "Measured from": "Diukur dari",
    "— 136 lines total": "— total 136 baris",
    "21 menus": "21 menu",
    "blank / other": "kosong / lain",
    "86 duty assignment lines — a name beside a class, with no identity":
        "86 baris penugasan piket — sebuah nama di samping kelas, tanpa identitas",
    "21 menu lines — free text, Mon–Fri": "21 baris menu — teks bebas, Sen–Jum",
    "5 hand-written week headers": "5 tajuk pekan tulisan tangan",
    # ── 1.1 Skenario sasaran ──
    "1.1 &nbsp;Target Scenarios": "1.1 &nbsp;Skenario Sasaran",
    "Eight recurring events in the school week. Each one is a real moment, not a "
    "hypothetical use case.":
        "Delapan peristiwa berulang dalam sepekan sekolah. Masing-masing adalah "
        "momen nyata, bukan kasus penggunaan hipotetis.",
    "S1 · every school morning": "S1 · setiap pagi sekolah",
    "“What is today’s snack?”": "“Snack hari ini apa?”",
    "A parent opens a forwarded text file and scrolls to find the date. The app "
    "answers in one screen — with the duty guardian’s WhatsApp link beside the menu.":
        "Orang tua membuka berkas teks yang diteruskan lalu menggulir mencari "
        "tanggalnya. Aplikasi menjawab dalam satu layar — dengan tautan WhatsApp "
        "wali petugas di samping menu.",
    "S2 · Sunday evening": "S2 · Minggu malam",
    "Weekly planning": "Rencana sepekan",
    "The same file is read twice: once for the menu, once for the duty roster. One "
    "view now shows Mon–Fri per class.":
        "Berkas yang sama dibaca dua kali: sekali untuk menu, sekali untuk daftar "
        "piket. Satu tampilan kini menampilkan Sen–Jum per kelas.",
    "S3 · when a class is on duty": "S3 · saat suatu kelas kena piket",
    "Duty rotation": "Rotasi piket",
    "Nobody can tell whose turn it is without reading the whole file. Duty is now a "
    "typed relationship, chosen from that class’s roster.":
        "Tidak ada yang tahu giliran siapa tanpa membaca seluruh berkas. Penugasan "
        "piket kini menjadi relasi bertipe, dipilih dari roster kelas itu.",
    "S4 · whenever a date is left open": "S4 · kapan pun tanggal dibiarkan kosong",
    "Filling an unassigned slot": "Mengisi tanggal yang kosong",
    "Previously the first reply in a group chat won, untracked. Parents now claim "
    "the date themselves, race-safe at the database level.":
        "Dulu balasan pertama di grup yang menang, tanpa jejak. Kini orang tua "
        "mengklaim tanggalnya sendiri, aman dari rebutan di level basis data.",
    "S5 · once a month": "S5 · sebulan sekali",
    "Lock-and-publish cycle": "Siklus kunci &amp; terbit bulanan",
    "There was no concept of “ready”. A three-state machine now makes a "
    "half-announced class structurally impossible.":
        "Tidak ada konsep “siap”. Mesin tiga keadaan kini membuat kelas yang "
        "diumumkan separuh mustahil secara struktural.",
    "S6 · monthly coordination meeting": "S6 · rapat koordinasi bulanan",
    "“Is the duty load fair?”": "“Beban piketnya sudah merata?”",
    "Unanswerable from the file, which records who is":
        "Tidak bisa dijawab — berkas mencatat siapa yang",
    "duty but never who": ", tidak pernah siapa yang",
    "duty. The report ranks every parent and names those who took none.":
        "piket. Laporan memeringkat setiap orang tua dan menyebut mereka yang tidak "
        "mengambil sama sekali.",
    "S7 · when planning next month": "S7 · saat menyusun bulan berikutnya",
    "Menu reuse &amp; history": "Pakai ulang menu &amp; riwayat",
    "Past menus were re-typed by hand. A searchable catalog of 43 menus and 85 menu "
    "items is shared across all classes.":
        "Menu lama diketik ulang dengan tangan. Katalog 43 menu dan 85 item menu "
        "yang bisa dicari dipakai bersama semua kelas.",
    "S8 · each school year": "S8 · setiap tahun ajaran",
    "Parent account lifecycle": "Siklus hidup akun orang tua",
    "Accounts were created one at a time. Now an Excel round-trip: export → edit → "
    "import, always through a dry-run preview.":
        "Akun dibuat satu per satu dengan tangan. Kini bolak-balik Excel: ekspor → "
        "sunting → impor, selalu lewat pratinjau.",
    "The scenario that shaped the architecture is S4 + S5 together.":
        "Skenario yang membentuk arsitektur adalah S4 + S5 bersama-sama.",
    "Claiming writes back into a schedule row; publishing freezes rows. If both "
    "could write freely, a parent could claim a slot in a month the school had "
    "already announced. The status machine exists so that is impossible — not "
    "merely discouraged.":
        "Klaim menulis balik ke baris jadwal; publikasi membekukan baris. Kalau "
        "keduanya bebas menulis, orang tua bisa mengklaim slot di bulan yang sudah "
        "diumumkan sekolah. Mesin status ada supaya hal itu mustahil — bukan sekadar "
        "tidak dianjurkan.",
    # ── 1.2 Pengguna sasaran ──
    "1.2 &nbsp;Target Users": "1.2 &nbsp;Pengguna Sasaran",
    "Four audiences, three of them with real authority. The role model is "
    "deliberately small — every extra role is a new way for the school to get its "
    "own process wrong.":
        "Empat audiens, tiga di antaranya punya wewenang nyata. Model peran sengaja "
        "dibuat kecil — setiap peran tambahan adalah cara baru bagi sekolah untuk "
        "salah menjalankan prosesnya sendiri.",
    "Role": "Peran",
    "Who they are": "Siapa mereka",
    "Primary goal": "Tujuan utama",
    "Authority": "Wewenang",
    "Explicitly denied": "Secara eksplisit ditolak",
    "Teacher or staff running the snack programme":
        "Guru atau staf yang menjalankan program snack",
    "Keep the whole school’s schedule correct and published":
        "Menjaga jadwal seluruh sekolah benar dan terbit",
    "Full CRUD on all classes, catalog, categories, holidays, parent accounts, "
    "statistics; lock":
        "CRUD penuh untuk semua kelas, katalog, kategori, hari libur, akun orang "
        "tua, statistik; kunci",
    "and": "dan",
    "unlock": "buka kunci",
    "class coordinator": "koordinator kelas",
    "A parent nominated per class": "Orang tua yang ditunjuk per kelas",
    "Run": "Jalankan",
    "their own class": "kelasnya sendiri",
    "without waiting for admin": "tanpa menunggu admin",
    "Create / edit / delete their class’s schedule while":
        "Membuat / menyunting / menghapus jadwal kelasnya selama",
    "; lock and publish their own class; claim open dates (still a parent)":
        "; mengunci dan menerbitkan kelasnya sendiri; mengklaim tanggal kosong "
        "(tetap orang tua)",
    "cannot unlock · cannot touch other classes · cannot edit the shared catalog · "
    "cannot manage accounts":
        "tidak bisa buka kunci · tidak bisa menyentuh kelas lain · tidak bisa "
        "menyunting katalog bersama · tidak bisa mengelola akun",
    "Parent": "Orang tua",
    "guardian": "wali",
    "Parent of an enrolled student": "Orang tua dari siswa terdaftar",
    "Know today’s snack and whether it is their turn":
        "Mengetahui snack hari ini dan apakah gilirannya",
    "Read their child’s class schedule; claim open duty dates; edit their own "
    "contact details and password":
        "Membaca jadwal kelas anaknya; mengklaim tanggal piket kosong; menyunting "
        "kontak dan kata sandinya sendiri",
    "no write access to schedules or catalog":
        "tidak punya akses tulis ke jadwal atau katalog",
    "Cooperative": "Koperasi",
    "canteen": "kantin",
    "School food provider": "Penyedia makanan sekolah",
    "Know what to prepare": "Mengetahui apa yang harus disiapkan",
    "Read-only, via Excel export": "Hanya baca, lewat ekspor Excel",
    "no login-level write path": "tidak ada jalur tulis di level login",
    "Why korlas exists — and why it is powerful inside one class, powerless outside "
    "it.":
        "Kenapa korlas ada — dan kenapa ia berkuasa di dalam satu kelas, tak "
        "berdaya di luarnya.",
    "The first version had only admin and parent. In practice one admin could not "
    "keep six classes current, and parents could not edit anything. Promoting six "
    "parents to admin would have given each of them the power to rewrite the whole "
    "school’s catalog and every other class. So a third role was introduced with a "
    "hard boundary — enforced by":
        "Versi pertama hanya punya admin dan orang tua. Dalam praktiknya satu admin "
        "tidak bisa menjaga enam kelas tetap mutakhir, dan orang tua tidak bisa "
        "menyunting apa pun. Menaikkan enam orang tua menjadi admin akan memberi "
        "masing-masing kuasa menulis ulang katalog seluruh sekolah dan setiap kelas "
        "lain. Maka peran ketiga diperkenalkan dengan batas tegas — ditegakkan oleh",
    "in the API, and merely": "di API, dan hanya",
    "reflected": "dicerminkan",
    "by": "oleh",
    "in the UI.": "di UI.",
    # ── 1.3 Nilai jual ──
    "1.3 &nbsp;Value Proposition": "1.3 &nbsp;Nilai Jual",
    "Turns a document that could only be read into a system that can be asked "
    "questions — without adding an administrator.":
        "Mengubah dokumen yang hanya bisa dibaca menjadi sistem yang bisa ditanyai "
        "— tanpa menambah administrator.",
    "pillar 01": "pilar 01",
    "pillar 02": "pilar 02",
    "pillar 03": "pilar 03",
    "pillar 04": "pilar 04",
    "Answer, not archive": "Menjawab, bukan mengarsip",
    "Answers the three questions people actually ask: today’s snack, my child’s "
    "duty turn, has my class been published.":
        "Menjawab tiga pertanyaan yang benar-benar ditanyakan orang: snack hari ini, "
        "giliran piket anak saya, apakah kelas saya sudah terbit.",
    "Authority at the edge": "Wewenang di ujung",
    "Moves the monthly workload from one admin to six coordinators while keeping "
    "the school-wide catalog under single ownership.":
        "Memindahkan beban bulanan dari satu admin ke enam koordinator sambil "
        "menjaga katalog seluruh sekolah tetap dalam satu kepemilikan.",
    "Fairness becomes measurable": "Keadilan menjadi terukur",
    "Because claims are stored separately, the system can name the parents who took "
    "no duty — a question the source document could not answer at all.":
        "Karena klaim disimpan terpisah, sistem bisa menyebut orang tua yang tidak "
        "mengambil piket — pertanyaan yang sama sekali tidak bisa dijawab dokumen "
        "sumber.",
    "Zero marginal cost": "Biaya marginal nol",
    "Workers + D1 on the free tier. No server, no licence, no app store. A snack "
    "programme has no budget line for software.":
        "Workers + D1 di tingkat gratis. Tanpa server, tanpa lisensi, tanpa app "
        "store. Program snack tidak punya pos anggaran untuk perangkat lunak.",
    # ── 1.4 Wawasan skenario nyata ──
    "1.4 &nbsp;Real-World Scenario Insights": "1.4 &nbsp;Wawasan Skenario Nyata",
    "1.4.1 &nbsp;Where the pain points came from":
        "1.4.1 &nbsp;Dari mana titik nyerinya berasal",
    "The pain points were not gathered from a survey. They were extracted from the "
    "artefact the school actually used:":
        "Titik nyeri tidak dikumpulkan dari survei. Semuanya diekstraksi dari "
        "artefak yang benar-benar dipakai sekolah:",
    "Pain point": "Titik nyeri",
    "Root cause visible in the source format":
        "Akar masalah yang terlihat pada format sumber",
    "No search": "Tanpa pencarian",
    "Menu names are free text inside day lines — “when was jeruk served?” means "
    "reading all 21 lines":
        "Nama menu adalah teks bebas di dalam baris hari — “kapan jeruk disajikan?” "
        "berarti membaca semua 21 baris",
    "No notification": "Tanpa notifikasi",
    "The file is a snapshot; nothing tells anyone it changed":
        "Berkas itu cuplikan sesaat; tidak ada yang memberi tahu siapa pun bahwa "
        "isinya berubah",
    "Hard to edit safely": "Sulit disunting dengan aman",
    "Week headers are written by hand and were already wrong — one block was "
    "labelled":
        "Tajuk pekan ditulis dengan tangan dan sudah salah — satu blok dilabeli",
    "(Mon–Fri) although 14 October 2026 is a Wednesday":
        "(Sen–Jum) padahal 14 Oktober 2026 adalah hari Rabu",
    "No history": "Tanpa riwayat",
    "The file is overwritten month to month; only two months survive in the "
    "repository":
        "Berkas ditimpa dari bulan ke bulan; hanya dua bulan yang bertahan di "
        "repositori",
    "No reusable catalog": "Tanpa katalog yang bisa dipakai ulang",
    "Nothing links “Puding Roti” in September to “Puding Roti” in October":
        "Tidak ada yang menghubungkan “Puding Roti” di September dengan “Puding "
        "Roti” di Oktober",
    "No duty tracking": "Tanpa pelacakan piket",
    "Duty is a name beside a class, with no identity — no parent record is "
    "referenced anywhere":
        "Piket hanyalah nama di samping kelas, tanpa identitas — tidak ada catatan "
        "orang tua yang dirujuk di mana pun",
    "Two of these are": "Dua di antaranya adalah cacat",
    "data-integrity": "integritas data",
    "defects, not convenience problems:": ", bukan masalah kenyamanan:",
    "The": "",
    "mis-labelled week header": "tajuk pekan yang salah label",
    "is a real error found in the school’s own document. The importer now matches "
    "each day label against the real calendar, shifts a mis-labelled week to the "
    "correct Mon–Fri, and warns the user. A manual spreadsheet cannot do this.":
        "adalah kesalahan nyata yang ditemukan di dokumen sekolah sendiri. Pengimpor "
        "kini mencocokkan setiap label hari dengan kalender sungguhan, menggeser "
        "pekan yang salah label ke Sen–Jum yang benar, dan memperingatkan pengguna. "
        "Spreadsheet manual tidak bisa melakukan ini.",
    "Duty names had no identity.": "Nama petugas tidak punya identitas.",
    "The fix was to make the duty officer a":
        "Perbaikannya adalah menjadikan petugas piket sebuah",
    "relationship": "relasi",
    "), with the printed name kept only as a denormalised display copy. The API "
    "refuses duty names supplied by the client and resolves them against the class "
    "roster server-side.":
        "), dan nama yang tercetak disimpan hanya sebagai salinan tampilan "
        "terdenormalisasi. API menolak nama petugas yang dikirim klien dan "
        "menyelesaikannya terhadap roster kelas di sisi server.",
    "1.4.2 &nbsp;Target audience and the core problem solved":
        "1.4.2 &nbsp;Audiens sasaran dan masalah inti yang dipecahkan",
    "The snack schedule is a shared obligation — every family takes a turn — but it "
    "is recorded in a private document that no family can query, and that only one "
    "person can safely edit.":
        "Jadwal snack adalah kewajiban bersama — setiap keluarga mendapat giliran — "
        "tetapi dicatat dalam dokumen privat yang tidak bisa dikueri keluarga mana "
        "pun, dan yang hanya bisa disunting dengan aman oleh satu orang.",
    "The read half": "Sisi baca",
    "Parents had no reliable way to know their turn. Closing it means authentication "
    "— each family sees only its own child’s class — and a per-class data model.":
        "Orang tua tidak punya cara andal untuk mengetahui gilirannya. Menutup celah "
        "itu berarti autentikasi — setiap keluarga hanya melihat kelas anaknya "
        "sendiri — dan model data per kelas.",
    "The write half": "Sisi tulis",
    "One admin could not maintain six classes. Closing it means a delegated role "
    "with a hard boundary, plus a lock/publish gate so “announced” and “still being "
    "edited” can never be confused.":
        "Satu admin tidak bisa memelihara enam kelas. Menutupnya berarti peran "
        "terdelegasi dengan batas tegas, plus gerbang kunci/terbit supaya “sudah "
        "diumumkan” dan “masih disunting” tidak pernah tertukar.",
    "Who it is": "Siapa yang",
    "not": "tidak",
    "for": "dilayani",
    "No student accounts — duty is a family obligation and the guardian holds the "
    "phone. No attendance, grades or messaging. Every feature must trace back to "
    "the snack roster.":
        "Tanpa akun siswa — piket adalah kewajiban keluarga dan wali yang memegang "
        "telepon. Tanpa absensi, nilai, atau perpesanan. Setiap fitur harus bisa "
        "dilacak kembali ke roster snack.",
    "Why the obvious fix fails.": "Kenapa solusi yang tampak jelas justru gagal.",
    "“Put the file in a shared spreadsheet” solves the read half for people who "
    "already know the sheet exists, and makes the write half worse: a shared sheet "
    "has no notion of who may edit which class, no published state, and no way to "
    "answer “who has never taken a turn” — because the sheet records duty, not "
    "claims. The claim table only exists because the system is an application.":
        "“Taruh berkasnya di spreadsheet bersama” menyelesaikan sisi baca bagi orang "
        "yang sudah tahu sheet itu ada, dan memperburuk sisi tulis: sheet bersama "
        "tidak punya gagasan tentang siapa boleh menyunting kelas mana, tidak punya "
        "status terbit, dan tidak punya cara menjawab “siapa yang belum pernah dapat "
        "giliran” — karena sheet mencatat piket, bukan klaim. Tabel klaim hanya ada "
        "karena sistemnya adalah aplikasi.",
    # ── 2 · Desain solusi ──
    "— Comprehensive Solution Design": "— Desain Solusi Menyeluruh",
    "A three-state schedule machine, a two-layer authority model, and a nine-domain "
    "API — each chosen to make a specific failure impossible rather than merely "
    "unlikely.":
        "Mesin jadwal tiga keadaan, model wewenang dua lapis, dan API sembilan "
        "domain — masing-masing dipilih supaya kegagalan tertentu menjadi mustahil, "
        "bukan sekadar kecil kemungkinannya.",
    "2.1 &nbsp;Business Architecture": "2.1 &nbsp;Arsitektur Bisnis",
    "Authority is enforced twice, and the two layers do different jobs":
        "Wewenang ditegakkan dua kali, dan kedua lapisan menjalankan tugas berbeda",
    "Layer": "Lapisan",
    "Mechanism": "Mekanisme",
    "Purpose": "Tujuan",
    "API — authority": "API — wewenang",
    "on every write route": "di setiap rute tulis",
    "The actual boundary. Returns": "Batas sesungguhnya. Mengembalikan",
    "regardless of what the client sends.":
        "terlepas dari apa yang dikirim klien.",
    "API — data scope": "API — cakupan data",
    "On": "Pada",
    "the class is read from the": "kelas dibaca dari",
    "database row": "baris basis data",
    ", never from client input — so a korlas cannot hijack another class by "
    "changing a parameter.":
        ", tidak pernah dari input klien — sehingga korlas tidak bisa membajak kelas "
        "lain dengan mengubah parameter.",
    "Hides controls the user cannot use. Documented explicitly as":
        "Menyembunyikan kontrol yang tidak bisa dipakai pengguna. Didokumentasikan "
        "secara eksplisit sebagai",
    "cosmetic": "kosmetik",
    "— it avoids offering impossible actions; it enforces nothing.":
        "— ia menghindari menawarkan aksi yang mustahil; ia tidak menegakkan apa pun.",
    "The schedule lifecycle": "Siklus hidup jadwal",
    "fully editable": "sepenuhnya bisa disunting",
    "frozen · duty officer only": "dibekukan · hanya petugasnya",
    "visible to parents": "terlihat oleh orang tua",
    "every new row starts here": "setiap baris baru dimulai di sini",
    "publication refuses with 409 while any row is draft":
        "publikasi menolak dengan 409 selama masih ada baris draft",
    "read-only from here on": "hanya baca setelah ini",
    "unlock — admin only": "unlock — hanya admin",
    "The rule that matters most": "Aturan yang paling penting",
    "Publication refuses with": "Publikasi menolak dengan",
    "refuses with": "menolak dengan",
    "when any row is still": "ketika masih ada baris yang",
    "names the offending class;": "menyebut kelas yang bermasalah;",
    "— and names the offending classes. This is what makes a half-published class "
    "structurally impossible.":
        "— dan menyebut kelas yang bermasalah. Inilah yang membuat kelas terbit "
        "separuh mustahil secara struktural.",
    "The one deliberate exception": "Satu pengecualian yang disengaja",
    "On a locked or published row, the": "Pada baris yang terkunci atau terbit,",
    "duty officer alone": "hanya petugasnya",
    "may be set — duty is often filled after announcement. A":
        "boleh ditetapkan — petugas sering diisi setelah pengumuman. Sebuah",
    "mixed": "campuran",
    "patch (duty plus menu, notes or holiday) is still rejected with":
        "patch (petugas plus menu, catatan, atau hari libur) tetap ditolak dengan",
    "Two bulk-action semantics, kept deliberately different":
        "Dua semantik aksi massal, sengaja dibedakan",
    "Range / class based": "Berbasis rentang / kelas",
    "Selected-rows based": "Berbasis baris terpilih",
    "Endpoints": "Endpoint",
    "Mismatched status": "Status tidak cocok",
    "— the whole request is refused": "— seluruh permintaan ditolak",
    "Counted as": "Dihitung sebagai",
    ", returns": ", mengembalikan",
    "Class scope": "Cakupan kelas",
    "Resolved from the request via": "Diselesaikan dari permintaan lewat",
    "Taken from each row — never from the client":
        "Diambil dari tiap baris — tidak pernah dari klien",
    "The asymmetry is intentional. A month-level operation that silently skipped a "
    "class would produce exactly the half-published state the status machine exists "
    "to prevent, so it fails loudly. A hand-ticked set of rows is an explicit "
    "choice, so the correct behaviour is to act on the qualifying rows and report "
    "the rest.":
        "Asimetri ini disengaja. Operasi tingkat bulan yang diam-diam melewati satu "
        "kelas akan menghasilkan persis keadaan terbit separuh yang ingin dicegah "
        "mesin status, jadi ia gagal dengan berisik. Sekumpulan baris yang dicentang "
        "dengan tangan adalah pilihan eksplisit, jadi perilaku yang benar adalah "
        "bertindak pada baris yang memenuhi syarat dan melaporkan sisanya.",
    "The claim mechanism — first come, first served":
        "Mekanisme klaim (siapa cepat dia dapat)",
    "Race safety": "Aman dari rebutan",
    "— the database, not the application, decides the winner.":
        "— basis data, bukan aplikasi, yang menentukan pemenangnya.",
    "One source of truth": "Satu sumber kebenaran",
    "A successful claim writes back into": "Klaim yang berhasil menulis balik ke",
    ", so a claim can never disagree with the schedule.":
        ", sehingga tidak pernah ada klaim yang bertentangan dengan jadwal.",
    "Per class": "Per kelas",
    "The same date in two classes is two rows — class 1 claiming does not block "
    "class 2.":
        "Tanggal yang sama di dua kelas adalah dua baris — klaim di kelas 1 tidak "
        "memblokir kelas 2.",
    "Fairness reporting": "Pelaporan keadilan",
    "Because claims are their own table, the report can rank parents by duties "
    "taken and name those who took none.":
        "Karena klaim punya tabel sendiri, laporan bisa memeringkat orang tua "
        "menurut piket yang diambil dan menyebut mereka yang tidak mengambil sama "
        "sekali.",
    # ── 2.2 Arsitektur teknis ──
    "2.2 &nbsp;Technical Architecture": "2.2 &nbsp;Arsitektur Teknis",
    "Browser": "Peramban",
    "React 19 SPA · TanStack Router + Query · installable PWA":
        "React 19 SPA · TanStack Router + Query · PWA yang bisa dipasang",
    "JWT verification": "Verifikasi JWT",
    "role guard": "penjaga peran",
    "class scope": "cakupan kelas",
    "HTTP verbs": "Kata kerja HTTP",
    "← the real boundary": "← batas sesungguhnya",
    "DTO shaping": "Pembentukan DTO",
    "business rules": "aturan bisnis",
    "publish gate": "gerbang publikasi",
    "SQL only": "SQL saja",
    "status predicate": "predikat status",
    "lives in the WHERE": "berada di dalam WHERE",
    "9 API domains · 65 endpoints · 29 GET · 22 POST · 7 PUT · 7 DELETE":
        "9 domain API · 65 endpoint · 29 GET · 22 POST · 7 PUT · 7 DELETE",
    "Drizzle ORM · typed queries": "Drizzle ORM · kueri bertipe",
    "13 tables · 9 migrations · drizzle/migrations/":
        "13 tabel · 9 migrasi · drizzle/migrations/",
    "Technology": "Teknologi",
    "Why this one": "Kenapa yang ini",
    "Free tier, global, no server to patch — the whole school fits in the free "
    "allowance":
        "Tingkat gratis, global, tanpa server yang perlu ditambal — seluruh sekolah "
        "muat dalam kuota gratis",
    "API framework": "Kerangka API",
    "Hono (": "Hono (",
    "Edge-native and tiny; middleware for JWT auth":
        "Asli edge dan mungil; middleware untuk autentikasi JWT",
    "Database": "Basis data",
    "Serverless SQL on the free tier, with a checked-in migration history":
        "SQL serverless di tingkat gratis, dengan riwayat migrasi yang tercatat di "
        "repositori",
    "ORM / migrations": "ORM / migrasi",
    "Typed queries plus reviewable SQL migrations":
        "Kueri bertipe plus migrasi SQL yang bisa ditinjau",
    "Client": "Klien",
    "File-based routing and per-page cache invalidation":
        "Perutean berbasis berkas dan invalidasi cache per halaman",
    "Styling": "Penataan gaya",
    "Tailwind CSS 4 with an": "Tailwind CSS 4 dengan blok token",
    "token block": "",
    "Three brand colours declared once and consumed everywhere":
        "Tiga warna merek dideklarasikan sekali dan dipakai di mana-mana",
    "Client and Worker built together": "Klien dan Worker dibangun bersamaan",
    "Language": "Bahasa",
    "TypeScript throughout": "TypeScript di seluruh bagian",
    "The API contract is shared between Worker and client":
        "Kontrak API dipakai bersama oleh Worker dan klien",
    "Data model — 13 tables": "Model data — 13 tabel",
    "People &amp; access": "Orang &amp; akses",
    "Schedule": "Jadwal",
    "Catalog": "Katalog",
    "Operations": "Operasional",
    "Two schema decisions were": "Dua keputusan skema adalah",
    "reversals": "pembalikan",
    ", and reversals are the most reliable evidence that a design was tested "
    "against reality:":
        ", dan pembalikan adalah bukti paling andal bahwa sebuah desain sudah diuji "
        "terhadap kenyataan:",
    "No composite foreign key on the duty officer":
        "Tanpa foreign key komposit pada petugas piket",
    "A composite FK needs an exactly matching unique index, which forces a table "
    "rebuild. A rebuild needs":
        "FK komposit memerlukan indeks unik yang benar-benar cocok, yang memaksa "
        "pembangunan ulang tabel. Pembangunan ulang memerlukan",
    "— and that pragma is a": "— dan pragma itu adalah",
    "is a no-op inside a transaction, and":
        "tidak berefek di dalam transaksi, sementara",
    "wraps migrations in one. The migration passed locally, failed in production "
    "with":
        "membungkus migrasi dalam satu transaksi. Migrasinya lolos di lokal, gagal "
        "di produksi dengan",
    ", and the “successful” path left 292":
        ", dan jalur yang “berhasil” meninggalkan 292 pelanggaran",
    "violations. Migration": ". Migrasi",
    "is now a plain": "kini hanya",
    "; consistency is enforced in the service layer.":
        "; konsistensi ditegakkan di lapisan service.",
    "Category images live in the database":
        "Gambar kategori disimpan di dalam basis data",
    "Stored as base64 data URIs and validated on both client and server. The "
    "catalog DTO was split in two —":
        "Disimpan sebagai data URI base64 dan divalidasi di klien maupun server. DTO "
        "katalog dipecah menjadi dua —",
    "(no image; used by menus and schedules) and":
        "(tanpa gambar; dipakai menu dan jadwal) dan",
    "(with image; only on the category page) — so a month of schedules containing "
    "dozens of menus does not duplicate image payloads that nothing displays.":
        "(dengan gambar; hanya di halaman kategori) — sehingga jadwal sebulan yang "
        "memuat puluhan menu tidak menggandakan muatan gambar yang tidak ditampilkan "
        "apa pun.",
    "Test architecture": "Arsitektur pengujian",
    "Verification volume by suite": "Volume verifikasi per suite",
    "540 API-integration assertions across 8 scripts, plus 85 unit tests — measured "
    "with":
        "540 assertion integrasi API di 8 skrip, ditambah 85 tes unit — diukur dengan",
    "test-api.mjs · 27 sections": "test-api.mjs · 27 seksi",
    "unit tests · src/": "tes unit · src/",
    "Plus": "Ditambah",
    "20 browser check scripts": "20 skrip pemeriksa peramban",
    "21 documented UAT cases": "21 kasus UAT terdokumentasi",
    ". Browser checks go beyond “the element exists” — the":
        ". Pemeriksaan peramban melampaui “elemen itu ada” —",
    "layout check asserts": "pemeriksa tata letak menegaskan",
    "which column": "di kolom mana",
    "the duty card sits in and that it is geometrically as wide as the day card, "
    "because a card in the wrong column passes every existence test.":
        "kartu piket berada dan bahwa lebarnya secara geometris sama dengan kartu "
        "hari, karena kartu di kolom yang salah akan lulus setiap tes keberadaan.",
    "day card;": "kartu hari;",
    # ── 2.3 Bagaimana prompt menggerakkan generasi AI ──
    "2.3 &nbsp;How Prompts Drive the AI Generation":
        "2.3 &nbsp;Bagaimana Prompt Menggerakkan Generasi AI",
    "This project was generated by prompt over 113 commits in 31 days. The "
    "mechanism is not “ask an AI for an app” — it is a":
        "Proyek ini dihasilkan lewat prompt selama 113 commit dalam 31 hari. "
        "Mekanismenya bukan “minta AI membuat aplikasi” — melainkan",
    "specification-first loop in which the prompt is the specification, the "
    "repository is the record, and a verifier is named before any code is written.":
        "loop yang mengutamakan spesifikasi: prompt adalah spesifikasinya, "
        "repositori adalah catatannya, dan verifier disebut sebelum kode apa pun "
        "ditulis.",
    "Domain truth": "Kebenaran domain",
    "A human supplies what the AI cannot know: the school’s real schedule, roles, "
    "and authority boundaries.":
        "Manusia memasok apa yang tidak bisa diketahui AI: jadwal nyata sekolah, "
        "peran, dan batas wewenang.",
    "Carries five slots: intent · constraint · evidence · acceptance · artefacts.":
        "Membawa lima slot: niat · batasan · bukti · penerimaan · artefak.",
    "AI generates": "AI menghasilkan",
    "Migration · API · UI · documentation · and the test that will judge it.":
        "Migrasi · API · UI · dokumentasi · dan tes yang akan menilainya.",
    "Verifier runs": "Verifier berjalan",
    "· the named test suite.": "· suite tes yang disebutkan.",
    "Commit &amp; record": "Commit &amp; catat",
    "Code, PRD changelog entry, and project memory committed together.":
        "Kode, entri changelog PRD, dan memori proyek di-commit bersama.",
    "On failure:": "Bila gagal:",
    "the prompt is corrected and re-run — and the constraint is written into "
    "persistent memory so the same mistake cannot recur in a later session.":
        "prompt diperbaiki dan dijalankan ulang — dan batasannya ditulis ke memori "
        "persisten supaya kesalahan yang sama tidak terulang di sesi berikutnya.",
    "Prompt anatomy used in this project": "Anatomi prompt yang dipakai di proyek ini",
    "Every substantive prompt carries five slots. The pattern is visible in the PRD "
    "changelog, where each version records the same five things.":
        "Setiap prompt substantif membawa lima slot. Polanya terlihat di changelog "
        "PRD, tempat setiap versi mencatat lima hal yang sama.",
    "Slot": "Slot",
    "Question it answers": "Pertanyaan yang dijawab",
    "Example from this project": "Contoh dari proyek ini",
    "1 · Intent": "1 · Niat",
    "What changes for the user?": "Apa yang berubah bagi pengguna?",
    "“Admin must be able to publish all six classes in one action”":
        "“Admin harus bisa menerbitkan keenam kelas dalam satu aksi”",
    "2 · Constraint": "2 · Batasan",
    "What must not break, and what is forbidden?":
        "Apa yang tidak boleh rusak, dan apa yang dilarang?",
    "“Korlas may lock their own class, not others. Do not add a class table.”":
        "“Korlas boleh mengunci kelasnya sendiri, bukan kelas lain. Jangan "
        "tambahkan tabel kelas.”",
    "3 · Evidence": "3 · Bukti",
    "What in the existing code decides the design?":
        "Apa di kode yang ada yang menentukan desain?",
    "“Check": "“Periksa",
    "before choosing where class scope is resolved.”":
        "sebelum memilih di mana cakupan kelas diselesaikan.”",
    "4 · Acceptance": "4 · Penerimaan",
    "How will we know it worked?": "Bagaimana kita tahu ini berhasil?",
    "and names the class": "dan menyebut kelasnya",
    "section 23 covers it.”": "seksi 23 mencakupnya.”",
    "5 · Artefacts": "5 · Artefak",
    "What else must be updated?": "Apa lagi yang harus diperbarui?",
    "Slot 4 is what makes the loop converge.":
        "Slot 4-lah yang membuat loop-nya konvergen.",
    "A prompt that does not name its verifier produces code that passes nothing in "
    "particular; a prompt that names":
        "Prompt yang tidak menyebut verifier-nya menghasilkan kode yang tidak lulus "
        "apa pun secara khusus; prompt yang menyebut",
    "produces a test that will still be running a year later.":
        "menghasilkan tes yang masih akan berjalan setahun kemudian.",
    "Prompt intent → generated artefact → verifier":
        "Niat prompt → artefak yang dihasilkan → verifier",
    "Prompt intent": "Niat prompt",
    "Generated artefact": "Artefak yang dihasilkan",
    "Verifier named in the prompt": "Verifier yang disebut di prompt",
    "“Store the schedule per class and add a class-coordinator role”":
        "“Simpan jadwal per kelas dan tambahkan peran koordinator kelas”",
    ", role": ", peran",
    "on all reads": "di semua pembacaan",
    "; PRD §3.3 rewritten": "; PRD §3.3 ditulis ulang",
    "“Parents must not be able to edit each other’s duty dates”":
        "“Orang tua tidak boleh bisa menyunting tanggal piket satu sama lain”",
    "; a claim writes back to the schedule row":
        "; klaim menulis balik ke baris jadwal",
    "“Publication must be impossible while any row is still a draft”":
        "“Publikasi harus mustahil selama masih ada baris yang berstatus draft”",
    "puts the status predicate in the": "menaruh predikat status di dalam",
    "naming classes;": "menyebut kelasnya;",
    "“The school sends the schedule as pasted text — import it in-app”":
        "“Sekolah mengirim jadwal sebagai teks yang ditempel — impor di dalam "
        "aplikasi”",
    "(pure: no DB, no clock, no throw), idempotent import,":
        "(murni: tanpa DB, tanpa jam, tanpa throw), impor idempoten,",
    "preview, audit trail in": "untuk pratinjau, jejak audit di",
    "section 24 — 38 assertions": "seksi 24 — 38 assertion",
    "“The coordination meeting needs a duty-fairness report”":
        "“Rapat koordinasi butuh laporan keadilan beban piket”",
    "New": "Domain baru",
    "domain; claims-based ranking plus a “never took duty” list derived from":
        "; peringkat berbasis klaim plus daftar “tidak pernah piket” yang diturunkan "
        "dari",
    "section 25": "seksi 25",
    "“Add a composite foreign key on the duty officer”":
        "“Tambahkan foreign key komposit pada petugas piket”",
    "Rejected.": "Ditolak.",
    "The constraint slot required the migration to succeed in production, and a "
    "table rebuild cannot.":
        "Slot batasan mensyaratkan migrasi berhasil di produksi, dan pembangunan "
        "ulang tabel tidak bisa.",
    "Local D1 + production": "D1 lokal + produksi",
    "“The duty card is in the wrong column”":
        "“Kartu piket ada di kolom yang salah”",
    "Card moved to": "Kartu dipindahkan ke",
    "split into named components": "dipecah menjadi komponen bernama",
    "— 39 geometry assertions": "— 39 assertion geometri",
    "Note the sixth row: a prompt was refused by its own constraint.":
        "Perhatikan baris keenam: sebuah prompt ditolak oleh batasannya sendiri.",
    "The refusal is recorded in the PRD as a correction (v1.10). That is the loop "
    "working as intended — the constraint slot exists precisely so that a "
    "plausible-sounding request can be rejected":
        "Penolakan itu dicatat di PRD sebagai koreksi (v1.10). Itulah loop yang "
        "bekerja sebagaimana mestinya — slot batasan ada justru supaya permintaan "
        "yang terdengar masuk akal bisa ditolak",
    "become": "menjadi",
    "before": "sebelum",
    "it corrupts production data.": "ia merusak data produksi.",
    "Guardrails carried inside the prompts":
        "Pagar pengaman yang dibawa di dalam prompt",
    "Hard-won constraints are written into the project’s persistent memory and "
    "re-stated in prompts, so a later session cannot silently undo them.":
        "Batasan yang diperoleh dengan susah payah ditulis ke memori persisten "
        "proyek dan dinyatakan ulang di prompt, sehingga sesi berikutnya tidak bisa "
        "diam-diam membatalkannya.",
    "Never trust a duty name from the client":
        "Jangan pernah percaya nama petugas dari klien",
    "Duty is a relationship, not a string — a client-supplied name would let a typo "
    "create a new “student”.":
        "Piket adalah relasi, bukan string — nama dari klien akan membuat salah "
        "ketik menciptakan “siswa” baru.",
    "Never rebuild a table in a D1 migration":
        "Jangan pernah membangun ulang tabel dalam migrasi D1",
    "silent no-op inside a transaction": "no-op senyap di dalam transaksi",
    "uses one.": "memakainya.",
    "Never let": "Jangan pernah biarkan",
    "Never let the UI be the only enforcement":
        "Jangan pernah biarkan UI menjadi satu-satunya penegak",
    "hides;": "menyembunyikan;",
    "enforces.": "menegakkan.",
    "Silent skipping is how a class gets published half-done.":
        "Melewati secara diam-diam adalah cara sebuah kelas terbit setengah jadi.",
    "Always build before deploy": "Selalu build sebelum deploy",
    "uploads": "mengunggah",
    "as-is — it does not compile.": "apa adanya — ia tidak mengompilasi.",
    "Never trust piped wrangler output":
        "Jangan pernah percaya keluaran wrangler yang di-pipe",
    "Truncated output has produced wrong conclusions; write to a file and parse the "
    "whole JSON.":
        "Keluaran yang terpotong pernah menghasilkan kesimpulan keliru; tulis ke "
        "berkas lalu parsing JSON utuh.",
    "Why the generation is auditable": "Kenapa generasinya bisa diaudit",
    "PRD changelog v1.1 → v1.21": "Changelog PRD v1.1 → v1.21",
    "Every entry records the prompt’s intent, the design decision, and any "
    "correction to an earlier claim. Several entries explicitly retract earlier "
    "statements, so the document shows its own errors.":
        "Setiap entri mencatat niat prompt, keputusan desain, dan setiap koreksi "
        "atas klaim sebelumnya. Beberapa entri secara eksplisit menarik kembali "
        "pernyataan sebelumnya, sehingga dokumen menunjukkan kesalahannya sendiri.",
    "113 commits": "113 commit",
    "Each traceable to a single increment, with the documentation update committed "
    "alongside the code (":
        "Masing-masing bisa dilacak ke satu penambahan, dengan pembaruan dokumentasi "
        "di-commit bersama kode (",
    "Project memory": "Memori proyek",
    "Daily logs plus a curated conventions file, so a session that starts fresh "
    "does not repeat a solved problem.":
        "Log harian plus berkas konvensi terkurasi, sehingga sesi yang mulai dari "
        "nol tidak mengulang masalah yang sudah dipecahkan.",
    # ── 3 · Nilai bisnis ──
    "— Business Value": "— Nilai Bisnis",
    "Quantified from the repository, not estimated — and the impact stated as "
    "before/after pairs that a reviewer can verify.":
        "Diukur dari repositori, bukan diperkirakan — dan dampaknya dinyatakan "
        "sebagai pasangan sebelum/sesudah yang bisa diverifikasi peninjau.",
    "3.1 &nbsp;Quantified Metrics": "3.1 &nbsp;Metrik Terukur",
    "commits in 31 days (17 Sep – 17 Oct 2026)":
        "commit dalam 31 hari (17 Sep – 17 Okt 2026)",
    "lines of TypeScript / TSX across 181 source files":
        "baris TypeScript / TSX di 181 berkas sumber",
    "API endpoints across 9 domains": "endpoint API di 9 domain",
    "database tables · 9 migrations": "tabel basis data · 9 migrasi",
    "API integration assertions across 8 scripts":
        "assertion integrasi API di 8 skrip",
    "unit tests in 10 files / 23 suites": "tes unit di 10 berkas / 23 suite",
    "documented UAT cases": "kasus UAT terdokumentasi",
    "marginal infrastructure cost (Workers + D1 free tier)":
        "biaya infrastruktur marginal (Workers + D1 tingkat gratis)",
    "System surface, before and after": "Permukaan sistem, sebelum dan sesudah",
    "The source artefact versus the system that replaced it":
        "Artefak sumber versus sistem yang menggantikannya",
    "Menu records": "Catatan menu",
    "Menu items": "Item menu",
    "Duty assignments (typed)": "Penugasan piket (bertipe)",
    "Students (linked to a parent)": "Siswa (tertaut ke orang tua)",
    "Weeks modelled": "Pekan yang dimodelkan",
    "Queryable endpoints": "Endpoint yang bisa dikueri",
    "Navigable views": "Tampilan yang bisa dinavigasi",
    "Delivery profile": "Profil pengiriman",
    "What 31 days of prompt-driven increments produced":
        "Apa yang dihasilkan 31 hari penambahan berbasis prompt",
    "Commits": "Commit",
    "Source files": "Berkas sumber",
    "Components": "Komponen",
    "User-facing pages": "Halaman untuk pengguna",
    "Feature labels (F1–F14)": "Label fitur (F1–F14)",
    "Shipped features": "Fitur terkirim",
    "Browser check scripts": "Skrip pemeriksa peramban",
    "Of 15 feature labels:": "Dari 15 label fitur:",
    "12 shipped": "12 terkirim",
    ", 1 partial (PDF export pending), 1 planned (notifications), 1 abandoned by "
    "design.":
        ", 1 sebagian (ekspor PDF tertunda), 1 direncanakan (notifikasi), 1 "
        "ditinggalkan atas desain.",
    "3.2 &nbsp;Clearly Defined Impact": "3.2 &nbsp;Dampak yang Terdefinisi Jelas",
    "Impact": "Dampak",
    "Before": "Sebelum",
    "After": "Sesudah",
    "How it is verified": "Cara verifikasinya",
    "Time to answer “what is today’s snack?”":
        "Waktu menjawab “snack hari ini apa?”",
    "Open a text file, locate the date, read a line":
        "Buka berkas teks, cari tanggalnya, baca satu baris",
    "One screen after login": "Satu layar setelah masuk",
    "Duty visibility": "Keterlihatan petugas",
    "A name in a document nobody owns":
        "Nama di dokumen yang tidak dimiliki siapa pun",
    "A typed relationship; the guardian’s phone is a":
        "Petugas adalah relasi bertipe; nomor telepon wali petugas jadi tautan",
    "link, with “not yet updated” distinguished from “no duty officer”":
        ", dengan “belum diperbarui” dibedakan dari “tanpa petugas”",
    "Unit tests on": "Tes unit untuk",
    "assertions in": "assertion di",
    "Monthly coordination workload": "Beban koordinasi bulanan",
    "One admin maintains six classes": "Satu admin memelihara enam kelas",
    "Six korlas each maintain one class; admin keeps school-wide override":
        "Enam korlas masing-masing memelihara satu kelas; admin tetap punya "
        "override seluruh sekolah",
    "Role tests in": "Tes peran di",
    "assertions for cross-class writes": "assertion untuk penulisan lintas kelas",
    "Half-published classes": "Kelas terbit separuh",
    "Not detectable — a file is sent or not":
        "Tidak terdeteksi — berkasnya dikirim atau tidak",
    "Impossible.": "Mustahil.",
    "— 22 assertions": "— 22 assertion",
    "Duty fairness": "Keadilan beban piket",
    "A feeling, unverifiable": "Hanya perasaan, tak bisa diverifikasi",
    "A report ranking every parent by duties taken, plus a list of parents who took "
    "none":
        "Laporan yang memeringkat setiap orang tua menurut piket yang diambil, plus "
        "daftar orang tua yang tidak mengambil sama sekali",
    "; claims-based, so it cannot disagree with what parents see":
        "; berbasis klaim, sehingga tidak bisa bertentangan dengan yang dilihat "
        "orang tua",
    "Claiming an open date": "Mengambil tanggal kosong",
    "First reply in a group chat wins, untracked":
        "Balasan pertama di grup yang menang, tanpa jejak",
    "Race-safe at the database level via":
        "Aman dari rebutan di level basis data lewat",
    "— 9 assertions": "— 9 assertion",
    "Bad input from the school": "Masukan keliru dari sekolah",
    "A mis-labelled week was accepted silently":
        "Pekan yang salah label diterima tanpa suara",
    "The importer matches day labels against the real calendar, shifts a "
    "mis-labelled week, warns;":
        "Pengimpor mencocokkan label hari dengan kalender sungguhan, menggeser pekan "
        "yang salah label, memberi peringatan;",
    "previews before writing": "untuk pratinjau sebelum menulis",
    "Account administration": "Administrasi akun",
    "One account at a time, by hand": "Satu akun satu waktu, dengan tangan",
    "Excel export → edit → import, with dry-run and per-row reasons":
        "Ekspor Excel → sunting → impor, dengan pratinjau dan alasan per baris",
    "; 34 unit tests on the importer / exporter":
        "; 34 tes unit untuk pengimpor / pengekspor",
    "Institutional memory": "Memori institusi",
    "The file is overwritten; last month is gone":
        "Berkasnya ditimpa; bulan lalu hilang",
    "History is append-only; two months of source data are preserved and queryable":
        "Riwayat append-only; dua bulan data sumber tersimpan dan bisa ditanyai",
    "plus the": "plus tabel",
    "tables": "",
    "Cost of operation": "Biaya operasional",
    "Zero marginal infrastructure cost, no new staff":
        "Biaya infrastruktur marginal nol, tanpa staf baru",
    "; free-tier deployment": "; deploy tingkat gratis",
    # ── 3.3 Rencana pengukuran ──
    "3.3 &nbsp;Measurement Plan": "3.3 &nbsp;Rencana Pengukuran",
    "Most impact claims are already instrumented, because the data they need is "
    "stored anyway.":
        "Sebagian besar klaim dampak sudah terinstrumentasi, karena data yang "
        "dibutuhkannya memang sudah tersimpan.",
    "Metric to track": "Metrik yang dilacak",
    "Source that already exists": "Sumber yang sudah ada",
    "What still needs building": "Apa yang masih perlu dibangun",
    "Duty distribution per parent": "Distribusi piket per orang tua",
    "— already the source of": "— sudah menjadi sumber",
    "none": "tidak ada",
    "— expose the existing report monthly":
        "— tampilkan laporan yang ada setiap bulan",
    "Share of dates claimed by parents vs assigned by korlas":
        "Porsi tanggal yang diklaim orang tua vs yang ditugaskan korlas",
    "joined to": "digabung dengan",
    "origin": "asal",
    "a counter on the report page": "penghitung di halaman laporan",
    "Publication latency (draft → published per class)":
        "Latensi publikasi (draft → terbit per kelas)",
    "a small aggregate query": "kueri agregat kecil",
    "Import quality (rows skipped, ranges shifted)":
        "Kualitas impor (baris dilewati, rentang digeser)",
    "— written but not yet surfaced": "— ditulis tetapi belum ditampilkan",
    "a view in the admin area": "tampilan di area admin",
    "Parent reach": "Jangkauan orang tua",
    ", PWA install events": ", peristiwa pemasangan PWA",
    "a simple counter": "penghitung sederhana",
    "Duty fairness trend over months": "Tren keadilan beban piket antar-bulan",
    "claims by month": "klaim per bulan",
    "a monthly comparison on": "perbandingan bulanan di",
    "is the clearest example of a table written but not yet read — the data for I7 "
    "exists today; only the presentation is missing.":
        "adalah contoh paling jelas dari tabel yang ditulis tetapi belum dibaca — "
        "data untuk I7 sudah ada hari ini; hanya penyajiannya yang belum.",
    # ── 3.4 Batasan yang jujur ──
    "3.4 &nbsp;Honest Limits": "3.4 &nbsp;Batasan yang Jujur",
    "Stated deliberately: a description that claims no gaps is not a description of "
    "a real system.":
        "Dinyatakan dengan sengaja: deskripsi yang mengklaim tanpa celah bukanlah "
        "deskripsi sistem nyata.",
    "PDF export is not built.": "Ekspor PDF belum dibuat.",
    "Excel export is (schedules and accounts); the print-oriented PDF is still open "
    "(F5 partial).":
        "Ekspor Excel sudah ada (jadwal dan akun); PDF berorientasi cetak masih "
        "terbuka (F5 sebagian).",
    "No push notifications.": "Tanpa notifikasi push.",
    "F6 remains planned; today the app must be opened to be read.":
        "F6 masih direncanakan; saat ini aplikasi harus dibuka supaya bisa dibaca.",
    "No student-facing accounts.": "Tanpa akun untuk siswa.",
    "Duty is modelled as a family obligation, so the guardian’s account is the only "
    "entry point. A student view would be a new decision, not a setting.":
        "Piket dimodelkan sebagai kewajiban keluarga, jadi akun wali adalah "
        "satu-satunya pintu masuk. Tampilan siswa akan menjadi keputusan baru, bukan "
        "sekadar pengaturan.",
    "No offline data.": "Tanpa data offline.",
    "The app is installable as a PWA, but schedules are not cached for offline "
    "reading — a deliberate choice, since a stale schedule is worse than no "
    "schedule.":
        "Aplikasi bisa dipasang sebagai PWA, tetapi jadwal tidak di-cache untuk "
        "dibaca offline — pilihan yang disengaja, karena jadwal basi lebih buruk "
        "daripada tidak ada jadwal.",
    "No usage analytics.": "Tanpa analitik penggunaan.",
    "Nothing tracks which pages parents actually open, so the adoption claims in "
    "§3.3 are measurable but not yet measured.":
        "Tidak ada yang melacak halaman mana yang benar-benar dibuka orang tua, jadi "
        "klaim adopsi di §3.3 terukur tetapi belum diukur.",
    "is written, not surfaced.": "ditulis, tidak ditampilkan.",
    "The audit trail exists; the UI for it does not.":
        "Jejak auditnya ada; UI-nya tidak.",
    "Single-school assumption.": "Asumsi satu sekolah.",
    "The data model has no": "Model data tidak punya",
    ". Multi-tenancy would be a migration, not a configuration change.":
        ". Multi-penyewa akan menjadi migrasi, bukan perubahan konfigurasi.",
    # ── Lampiran A ──
    "Appendix A — Evidence index": "Lampiran A — Indeks bukti",
    "Claim": "Klaim",
    "Where to verify": "Di mana memverifikasi",
    "Feature inventory and rationale": "Inventaris fitur dan alasannya",
    "Source data volume (136 lines, 38 students, 86 assignments)":
        "Volume data sumber (136 baris, 38 siswa, 86 penugasan)",
    "Table and migration inventory": "Inventaris tabel dan migrasi",
    "— 9 files, 13 tables": "— 9 berkas, 13 tabel",
    "Endpoint inventory (65)": "Inventaris endpoint (65)",
    "Role boundaries": "Batas peran",
    "Navigation and page inventory": "Inventaris navigasi dan halaman",
    "Test volume (85 unit · 540 integration)":
        "Volume tes (85 unit · 540 integrasi)",
    "UAT cases (21)": "Kasus UAT (21)",
    "Deployment and cost model": "Model deploy dan biaya",
    "Production incident history": "Riwayat insiden produksi",
    "PRD changelog v1.10 (composite FK) · v1.12 (mis-labelled week)":
        "Changelog PRD v1.10 (FK komposit) · v1.12 (pekan salah label)",
    "Prompt-to-artefact ledger": "Buku besar prompt-ke-artefak",
    "(113 commits) · PRD changelog ·": "(113 commit) · changelog PRD ·",
    # ── kaki halaman ──
    "— Visualization Project Description · v1.0 · 17 October 2026":
        "— Deskripsi Proyek Visualisasi · v1.0 · 17 Oktober 2026",
    "Every figure measured from the repository ·":
        "Setiap angka diukur dari repositori ·",
}

# ── Tabrakan: satu kunci, dua makna ──────────────────────────────────────────
# "on" muncul dua kali dengan arti berbeda; dibedakan dari konteks sebelumnya.
OVERRIDES: list[tuple[str, str, str]] = [
    ("on", "schedule_id", "pada"),
]

TEXT_NODE = re.compile(r">([^<>]+)<")
STYLE_BLOCK = re.compile(r"<style>.*?</style>", re.S)
EDGE = re.compile(r"^(\s*)(.*?)(\s*)$", re.S)


def norm(s: str) -> str:
    return " ".join(s.split())


def translate_node(raw: str, before: str) -> tuple[str, bool]:
    """Kembalikan (teks_baru, dikenali). Spasi tepi dipertahankan apa adanya."""
    lead, core, trail = EDGE.match(raw).groups()
    key = norm(core)
    if not key:
        return raw, True
    for k, marker, value in OVERRIDES:
        if key == k and marker in before:
            return lead + value + trail, True
    if key in MAP:
        return lead + MAP[key] + trail, True
    if key in KEEP:
        return raw, True
    return raw, False


def main() -> int:
    html = SRC.read_text(encoding="utf-8")

    for old, new in ATTRS:
        if old not in html:
            print(f"ATRIBUT TIDAK DITEMUKAN: {old!r}", file=sys.stderr)
            return 1
        html = html.replace(old, new)

    # lindungi <style> supaya CSS tidak ikut diterjemahkan
    style = STYLE_BLOCK.search(html)
    if not style:
        print("blok <style> tidak ditemukan", file=sys.stderr)
        return 1
    head, css, tail = html[: style.start()], html[style.start() : style.end()], html[style.end() :]

    missed: list[str] = []
    changed = 0

    def process(chunk: str) -> str:
        nonlocal changed
        pieces: list[str] = []
        last = 0
        for m in TEXT_NODE.finditer(chunk):
            pieces.append(chunk[last : m.start()])
            raw = m.group(1)
            before = chunk[max(0, m.start() - 140) : m.start()]
            new, ok = translate_node(raw, before)
            if not ok:
                missed.append(norm(raw))
            elif new != raw:
                changed += 1
            pieces.append(">" + new + "<")
            last = m.end()
        pieces.append(chunk[last:])
        return "".join(pieces)

    result = process(head) + css + process(tail)

    # rapikan spasi sebelum titik yang tersisa dari pergeseran urutan kata
    result = result.replace("</code> . Migrasi", "</code>. Migrasi")

    DST.parent.mkdir(parents=True, exist_ok=True)
    DST.write_text(result, encoding="utf-8")

    print(f"simpul diganti : {changed}")
    if missed:
        print(f"SIMPUL BELUM DITERJEMAHKAN ({len(missed)}):")
        for s in sorted(set(missed)):
            print("  -", repr(s))
        return 1
    print("Semua simpul teks sudah tertangani.")
    print(f"ditulis: {DST}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
