/**
 * Seluruh teks halaman depan (`/`) — manfaat, fitur per peran, alur, dan FAQ.
 *
 * Dipisah dari komponennya supaya kalimatnya bisa ditinjau sendiri tanpa
 * membaca JSX, dan supaya urutan bagiannya tidak tersembunyi di tengah tata
 * letak. Isinya **harus sejalan dengan kemampuan aplikasi yang sebenarnya**:
 * halaman ini adalah janji kepada orang tua yang belum punya akun, jadi
 * menyebut fitur yang tidak ada sama saja dengan berbohong.
 */

import {
  BadgeCheck,
  Bot,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  ClipboardList,
  FileSpreadsheet,
  FlaskConical,
  HandHeart,
  Layers,
  LayoutDashboard,
  ListChecks,
  Lock,
  LogIn,
  Search,
  ShieldCheck,
  Sparkles,
  SquarePen,
  Table2,
  Tags,
  Upload,
  UserPlus,
  Users,
  Wallet,
  Wand2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/** Satu butir manfaat: alasan aplikasi ini dipakai, bukan daftar tombolnya. */
export interface LandingBenefit {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const LANDING_BENEFITS: LandingBenefit[] = [
  {
    icon: CalendarDays,
    title: "Menu hari ini tanpa perlu bertanya",
    description:
      "Buka aplikasi, menu snack hari ini langsung terlihat — lengkap dengan ringkasan pekan berjalan dan siapa petugas piketnya.",
  },
  {
    icon: Search,
    title: "Riwayat menu bisa dicari",
    description:
      "Pertanyaan “kapan jeruk pernah disajikan?” dijawab dalam sekali cari, lintas bulan, tanpa membuka dokumen lama.",
  },
  {
    icon: HandHeart,
    title: "Giliran piket dibagi tanpa bentrok",
    description:
      "Tanggal yang masih kosong boleh diambil orang tua — siapa cepat dia dapat, dan satu tanggal hanya untuk satu orang.",
  },
  {
    icon: ShieldCheck,
    title: "Wewenang jelas di setiap peran",
    description:
      "Admin mengurus seluruh sekolah, korlas mengurus kelasnya sendiri, orang tua melihat dan memilih. Tidak ada yang bisa melewati batasnya.",
  },
  {
    icon: FileSpreadsheet,
    title: "Siap dibagikan dan dicetak",
    description:
      "Jadwal Sepekan, rekap bulanan, dan daftar akun dapat diunduh sebagai Excel — kolomnya sama dengan yang tampil di layar.",
  },
  {
    icon: Sparkles,
    title: "Bisa dipasang di HP",
    description:
      "Sebagai PWA, aplikasi bisa dipasang ke layar utama dan tetap dapat dibuka meski jaringan sedang buruk.",
  },
];

/** Satu fitur yang disebut di halaman depan. */
export interface LandingFeature {
  icon: LucideIcon;
  title: string;
  description: string;
}

/** Kumpulan fitur yang dikelompokkan menurut peran pemakainya. */
export interface LandingRole {
  /** Dipakai sebagai kunci React — bukan untuk ditampilkan. */
  id: string;
  label: string;
  blurb: string;
  icon: LucideIcon;
  features: LandingFeature[];
}

export const LANDING_ROLES: LandingRole[] = [
  {
    id: "orang-tua",
    label: "Orang Tua",
    blurb: "Melihat jadwal dan mengambil giliran piket anaknya.",
    icon: Users,
    features: [
      {
        icon: CalendarCheck,
        title: "Jadwal Hari Ini",
        description:
          "Menu snack hari ini, ringkasan pekan berjalan, dan daftar petugas piket di semua kelas.",
      },
      {
        icon: CalendarRange,
        title: "Sepekan & Bulanan",
        description:
          "Susunan Senin–Jumat dan rekap per minggu, lengkap dengan penanda hari libur.",
      },
      {
        icon: HandHeart,
        title: "Pilih Jadwal",
        description:
          "Ambil satu tanggal piket yang masih kosong — siapa cepat dia dapat.",
      },
      {
        icon: Users,
        title: "Petugas Kelas Lain",
        description:
          "Buka satu tanggal untuk melihat siapa piket di kelas lain, beserta tautan WhatsApp walinya.",
      },
      {
        icon: Search,
        title: "Cari Menu",
        description:
          "Telusuri kapan sebuah menu pernah disajikan, lintas bulan sekaligus.",
      },
      {
        icon: SquarePen,
        title: "Kelola Anak Sendiri",
        description:
          "Tambah, ubah, atau hapus data anak dari menu Profil — tanpa menunggu admin.",
      },
    ],
  },
  {
    id: "korlas",
    label: "Korlas",
    blurb: "Menyusun jadwal kelasnya, lalu menerbitkannya ke orang tua.",
    icon: ClipboardList,
    features: [
      {
        icon: SquarePen,
        title: "Kelola Jadwal Kelasnya",
        description:
          "Tetapkan menu per tanggal, tandai hari libur, dan tambahkan catatan.",
      },
      {
        icon: CalendarRange,
        title: "Salin Jadwal Sepekan",
        description:
          "Duplikasi Senin–Jumat ke minggu lain, dengan pilihan menimpa hari yang sudah terisi.",
      },
      {
        icon: Upload,
        title: "Impor Jadwal dari Teks",
        description:
          "Tempel jadwal apa adanya dari sekolah, periksa pratinjaunya, lalu simpan sebagai draft.",
      },
      {
        icon: Lock,
        title: "Kunci & Publikasi",
        description:
          "Jadwal yang sudah dikunci tidak dapat diubah lagi; setelah terbit, orang tua bisa membacanya.",
      },
      {
        icon: ListChecks,
        title: "Aksi Massal",
        description:
          "Centang beberapa hari sekaligus, lalu kunci atau terbitkan bersamaan.",
      },
      {
        icon: Table2,
        title: "Laporan & Excel",
        description:
          "Lihat siapa saja yang sudah mengambil jadwal, dan unduh rekapnya sebagai Excel.",
      },
    ],
  },
  {
    id: "admin",
    label: "Admin",
    blurb: "Menyiapkan akun, menu, dan seluruh data sekolah.",
    icon: ShieldCheck,
    features: [
      {
        icon: UserPlus,
        title: "Kelola Akun Orang Tua",
        description:
          "Buat, ubah, nonaktifkan, atau hapus akun; satu akun boleh punya lebih dari satu anak.",
      },
      {
        icon: BadgeCheck,
        title: "Angkat Korlas",
        description:
          "Jadikan orang tua sebagai koordinator kelas — perannya langsung menyesuaikan.",
      },
      {
        icon: Tags,
        title: "Menu & Kategori",
        description:
          "Kelola menu (makanan utama + buah pendamping) beserta kategorinya, masing-masing boleh punya gambar.",
      },
      {
        icon: CalendarDays,
        title: "Kelola Hari Libur",
        description:
          "Tandai hari libur bernama yang berlaku untuk seluruh kelas.",
      },
      {
        icon: LayoutDashboard,
        title: "Dashboard",
        description:
          "Ringkasan jumlah akun, menu, jadwal, dan hari libur dalam satu layar.",
      },
      {
        icon: Wand2,
        title: "Mode Tiru",
        description:
          "Masuk sebagai orang tua tertentu tanpa password untuk membantu, dengan bilah pengingat selama sesi.",
      },
    ],
  },
];

/** Satu langkah pada bagian "Bagaimana alurnya". */
export interface LandingStep {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const LANDING_STEPS: LandingStep[] = [
  {
    icon: UserPlus,
    title: "Admin menyiapkan akun & menu",
    description:
      "Tiap orang tua punya akun sendiri, bisa untuk beberapa anak. Menu snack cukup disusun sekali untuk seluruh sekolah.",
  },
  {
    icon: SquarePen,
    title: "Korlas menyusun jadwal kelasnya",
    description:
      "Menu diisi per tanggal, lengkap dengan hari libur dan catatan. Jadwal dari sekolah bisa ditempel, lalu dicek dulu sebelum disimpan.",
  },
  {
    icon: Lock,
    title: "Jadwal dikunci lalu diterbitkan",
    description:
      "Jadwal dikunci setelah selesai, supaya tidak berubah lagi. Sesudah itu orang tua bisa membacanya.",
  },
  {
    icon: HandHeart,
    title: "Orang tua melihat & mengambil giliran",
    description:
      "Menu harian bisa dibuka dari HP. Tanggal piket yang masih kosong bisa langsung diambil. Admin atau korlas bisa mengunduh Excel untuk dibagikan atau dicetak.",
  },
];

/** Satu tanya-jawab di halaman depan. */
export interface LandingFaq {
  question: string;
  answer: string;
}

export const LANDING_FAQ: LandingFaq[] = [
  {
    question: "Apakah saya bisa melihat jadwal tanpa akun?",
    answer:
      "Tidak. Setiap orang tua punya akun sendiri yang dibuat admin, supaya jadwal dan data anak hanya terlihat oleh yang berhak. Bila belum punya akun, hubungi admin atau korlas kelas.",
  },
  {
    question: "Apakah menunya berbeda tiap kelas?",
    answer:
      "Tidak. Menu snack berlaku untuk seluruh sekolah. Yang berbeda tiap kelas adalah siapa petugas piket yang mengambil snack hari itu.",
  },
  {
    question: "Bagaimana kalau tanggal piketnya sudah diambil orang lain?",
    answer:
      "Satu tanggal hanya boleh diambil satu orang tua — siapa cepat dia dapat. Bila keduluan, pilih tanggal lain yang masih kosong; jumlah snack yang sudah dan belum diambil terlihat di panel Keterangan bulan.",
  },
  {
    question: "Bagaimana kalau saya lupa password?",
    answer:
      "Minta admin mengatur ulang password dari halaman Akun Orang Tua. Bila akun terkunci karena lima kali salah password berturut-turut, admin juga yang membukanya.",
  },
  {
    question: "Apakah aplikasi ini bisa dipasang di HP?",
    answer:
      "Bisa. Pizza Snack Play adalah PWA: pasang ke layar utama lewat menu peramban, dan aplikasinya tetap dapat dibuka meski jaringan sedang buruk.",
  },
];

/** Fakta singkat yang tampil sebagai lencana di bawah judul hero. */
export const LANDING_FACTS: string[] = [
  "Senin–Jumat",
  "Menu sama untuk semua kelas",
  "Petugas piket per kelas",
  "Akun pribadi tiap orang tua",
];

/** Langkah masuk yang disebut di tombol utama. */
export const LANDING_CTA = {
  label: "Masuk",
  icon: LogIn,
} as const;

/**
 * Isi contoh kartu "Hari Ini" di hero.
 *
 * **Bukan data sungguhan** — hanya gambaran tampilan supaya pengunjung yang
 * belum punya akun tahu apa yang akan dilihatnya. Nama menunya sengaja diambil
 * dari menu yang benar-benar ada di katalog sekolah, bukan karangan, supaya
 * contohnya tidak menyesatkan.
 */
export const LANDING_PREVIEW = {
  caption: "Contoh tampilan halaman Hari Ini",
  dayLabel: "Senin",
  dateLabel: "12 Oktober 2026",
  menuName: "Roti isi coklat + jeruk",
  components: [
    { type: "Makanan utama", name: "Roti isi coklat" },
    { type: "Buah", name: "jeruk" },
  ],
  petugas: [
    { className: "Kelas 1", name: "Aisyah Sari" },
    { className: "Kelas 2", name: "Citra Dewi" },
  ],
} as const;

/** Judul hero dan paragraf pembukanya. */
export const LANDING_HERO = {
  eyebrow: "Untuk orang tua, korlas, dan admin sekolah",
  title: "Jadwal piket snack sekolah, rapi dalam satu aplikasi",
  lead: "Dulu jadwal snack disusun di dokumen teks yang mudah hilang dan sulit dicari. Sekarang admin mengelola menu, korlas menyusun dan menerbitkan jadwal kelasnya, dan orang tua melihat menu harian serta mengambil giliran piketnya dari HP.",
  note: "Setiap orang tua punya akun sendiri yang dibuat admin sekolah.",
} as const;

/** Penutup halaman: satu ajakan terakhir sebelum footer. */
export const LANDING_CLOSING = {
  title: "Sudah punya akun?",
  lead: "Masuk untuk melihat menu hari ini dan jadwal piket anak Anda.",
} as const;

/**
 * Kalimat yang menemani hiasan di tengah halaman.
 *
 * Hiasannya sendiri (bulan sabit, lentera, masjid, dua anak) hanya dekorasi
 * dan tidak diucapkan pembaca layar. Kalimat inilah satu-satunya bagian yang
 * terbaca — karena itu isinya tetap soal aplikasinya, bukan soal hiasannya:
 * yang dijanjikan ke orang tua tetap jadwal snack, bukan gambar.
 *
 * Nadanya sengaja tidak menggurui. Kalimat lama ("belajar berbagi giliran
 * sejak dini") terdengar seperti nasihat sekolah dan menjanjikan pembentukan
 * karakter, padahal yang benar-benar diberikan aplikasi cuma satu hal:
 * giliran yang terlihat oleh semua. Jadi bagian ini bicara soal itu saja.
 */
export const LANDING_ART = {
  eyebrow: "Satu tanggal, satu orang",
  title: "Semua tahu giliran siapa",
  lead: "Jadwal yang terbuka membuat urusan piket selesai sebelum dimulai: tidak ada yang perlu diingatkan, karena tanggalnya sudah terlihat oleh seluruh kelas.",
} as const;

/**
 * Bagian "Tentang" — bagaimana aplikasi ini dibuat dan apa yang menjalankannya.
 *
 * Ditulis untuk dua pembaca sekaligus: orang tua yang penasaran siapa yang
 * membuat aplikasi ini, dan guru atau kepala sekolah yang perlu tahu bahwa
 * memakainya tidak menambah anggaran. Karena itu angkanya disebut apa adanya,
 * bukan dibulatkan menjadi "puluhan" atau "ratusan".
 */
export const LANDING_ABOUT = {
  eyebrow: "Tentang",
  title: "Dibangun tanpa anggaran perangkat lunak",
  lead: "Pizza Snack Play dengan Prompt WorkBuddy AI: kebutuhan sekolah ditulis dari percakapan whatsapp, lalu menjadi kode, migrasi basis data, uji, dan dokumen. Seluruhnya berjalan gratis di Cloudflare — tidak ada server sewaan, lisensi basis data, atau langganan bulanan.",
} as const;

/** Satu alasan di bagian "Tentang". */
export interface LandingAboutPoint {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const LANDING_ABOUT_POINTS: LandingAboutPoint[] = [
  {
    icon: Bot,
    title: "Dengan Prompt di WorkBuddy",
    description:
      "Setiap perubahan dimulai dari satu permintaan tertulis, lalu diperiksa dengan tsc, eslint, build, dan uji API sebelum masuk. 119 commit dalam 31 hari, dan setiap keputusan desainnya tercatat di PRD.",
  },
  {
    icon: Wallet,
    title: "Biaya operasional nol",
    description:
      "Cloudflare Workers dan D1 pada tingkat gratis: tanpa server yang disewa, tanpa lisensi basis data, tanpa biaya unggah ke toko aplikasi. Kuota gratisnya masih jauh di atas kebutuhan satu sekolah.",
  },
  {
    icon: Layers,
    title: "Satu bahasa, Typescript",
    description:
      "React 19 dan TanStack di sisi klien, Hono di API, Drizzle di atas D1 — semuanya TypeScript, sehingga bentuk data yang dikirim Worker sama dengan yang dibaca antarmuka.",
  },
  {
    icon: FlaskConical,
    title: "Diuji oleh AI",
    description:
      "85 uji unit dan 540 pemeriksaan API, ditambah 21 kasus UAT serta pemeriksaan tata letak di peramban sungguhan — termasuk lebar kartu, bukan hanya ada atau tidaknya elemen.",
  },
];

/** Satu lapisan teknologi, ditampilkan sebagai baris tabel di bagian "Tentang". */
export interface LandingTechLayer {
  layer: string;
  items: string;
}

export const LANDING_TECH: LandingTechLayer[] = [
  {
    layer: "Frontend",
    items: "React 19 · TanStack Router · TanStack Query · Tailwind 4",
  },
  {
    layer: "Backend",
    items: "Hono · TypeScript · JWT HS256 · PBKDF2-SHA256",
  },
  {
    layer: "Database",
    items: "Cloudflare D1 · Drizzle ORM",
  },
  {
    layer: "Tools",
    items: "Vite · Bun · Wrangler · Cloudflare Workers",
  },
  {
    layer: "Fiture Lainnya",
    items: "PWA (manifest + service worker)",
  },
];

/** Angka isi aplikasi — dihitung dari route API dan migrasi Drizzle. */
export const LANDING_ABOUT_STATS = [
  { value: "9", label: "modul API" },
  { value: "65", label: "endpoint" },
  { value: "13", label: "tabel D1" },
  { value: "3", label: "peran pengguna" },
] as const;

/**
 * Modul API yang benar-benar ada, dengan nama yang bisa dibaca orang tua.
 *
 * Nama teknisnya (`auth`, `claims`, …) tetap ditampilkan kecil di bawah label
 * karena itulah yang dicari orang yang membaca kode; label Indonesianya yang
 * dibaca orang lain.
 */
export const LANDING_ABOUT_MODULES = [
  { name: "auth", label: "Masuk & sesi" },
  { name: "catalog", label: "Menu & kategori" },
  { name: "schedules", label: "Jadwal & kunci" },
  { name: "claims", label: "Pilih jadwal" },
  { name: "classes", label: "Kelas & petugas" },
  { name: "parents", label: "Akun orang tua" },
  { name: "profile", label: "Profil & anak" },
  { name: "laporan", label: "Laporan piket" },
  { name: "stats", label: "Statistik" },
] as const;

/** Satu kalimat penutup: apa yang **tidak** ada di aplikasi ini. */
export const LANDING_ABOUT_NOTE =
  "Tanpa iklan, tanpa pelacakan pihak ketiga, dan tanpa langganan. Data sekolah tersimpan di basis data D1 pada akun Cloudflare pemilik aplikasi, bukan di layanan lain.";
