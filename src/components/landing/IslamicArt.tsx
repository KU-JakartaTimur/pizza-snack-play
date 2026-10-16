import { useId } from "react";
import { cn } from "@/lib/cn";

/**
 * Hiasan bernuansa Islami untuk halaman depan.
 *
 * Semuanya **SVG sebaris**, bukan berkas gambar: warnanya ikut palet aplikasi
 * lewat `currentColor`, tetap tajam di layar mana pun, dan bisa bergerak tanpa
 * memuat apa-apa. Berkasnya pun tidak bertambah berat karena satu gambar.
 *
 * Seluruh bagian di sini ditandai `aria-hidden` — ini hiasan, bukan isi.
 * Pembaca layar tidak perlu membacakan bulan sabit atau lentera, dan tidak ada
 * satu pun kalimat di halaman ini yang bergantung pada gambarnya.
 *
 * Gerakannya dijalankan CSS (kelas `art-*` di `index.css`) dan **berhenti
 * sendiri** saat pengguna meminta gerak dikurangi. Karena itu animasinya tidak
 * lewat framer-motion: hiasan latar tidak boleh ikut menentukan kapan React
 * merender ulang.
 */

/** Titik putar di tengah bentuknya sendiri — untuk elemen SVG. */
const CENTER = { transformBox: "fill-box", transformOrigin: "center" } as const;

interface ArtProps {
  className?: string;
}

/** Identitas unik untuk `<mask>`, tanpa tanda baca yang menyulitkan `url(#…)`. */
function useArtId(prefix: string) {
  return `${prefix}-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
}

/**
 * Bulan sabit dengan bintang kecil yang berkedip.
 *
 * Sabitnya dibentuk dari dua lingkaran — lingkaran kedua dipakai sebagai
 * lubang lewat `<mask>`, bukan ditimpa dengan warna latar. Cara itu membuat
 * sabitnya tetap benar di atas latar apa pun, termasuk gradien halaman depan.
 */
export function CrescentStar({ className }: ArtProps) {
  const maskId = useArtId("crescent");

  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("art-anim", className)}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <mask id={maskId}>
          <rect width="64" height="64" fill="black" />
          <circle cx="28" cy="32" r="20" fill="white" />
          <circle cx="38" cy="29" r="17" fill="black" />
        </mask>
      </defs>

      <circle cx="28" cy="32" r="20" fill="currentColor" mask={`url(#${maskId})`} />

      <g className="art-twinkle" style={CENTER}>
        <path
          d="M52 12 L54 17.3 L59.6 17.5 L55.2 21.1 L56.7 26.5 L52 23.4 L47.3 26.5 L48.8 21.1 L44.4 17.5 L50 17.3 Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

/**
 * Bintang delapan — dua persegi yang saling bertumpuk dan berputar.
 *
 * Bentuknya pola geometris yang lazim dipakai pada ornamen Islam; dipilih
 * daripada bintang lima karena garisnya bisa digambar sebagai dua `<rect>`
 * biasa, jadi tidak ada koordinat yang perlu dihitung tangan.
 */
export function StarMotif({ className }: ArtProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("art-anim", className)}
      aria-hidden="true"
      focusable="false"
    >
      <g className="art-spin" style={CENTER}>
        <rect
          x="14"
          y="14"
          width="36"
          height="36"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <rect
          x="14"
          y="14"
          width="36"
          height="36"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          transform="rotate(45 32 32)"
        />
      </g>
    </svg>
  );
}

/**
 * Lentera yang bergoyang pelan.
 *
 * Goyangannya berpuncak di tali gantungnya (`transform-origin: top center`),
 * bukan di tengah lentera — lentera yang berputar pada titik tengahnya terlihat
 * seperti kincir, bukan seperti benda yang tergantung.
 */
export function Lantern({ className }: ArtProps) {
  return (
    <svg
      viewBox="0 0 48 96"
      className={cn("art-anim", className)}
      aria-hidden="true"
      focusable="false"
    >
      <g
        className="art-swing"
        style={{ transformBox: "fill-box", transformOrigin: "top center" }}
      >
        <path
          d="M24 0 V13"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <rect x="14" y="12" width="20" height="6" rx="2" fill="currentColor" />
        <path
          d="M20 18 L28 18 L36 30 L36 52 L28 64 L20 64 L12 52 L12 30 Z"
          fill="currentColor"
          opacity="0.85"
        />
        <g className="art-glow">
          <path
            d="M24 26 L30 36 L24 48 L18 36 Z"
            fill="white"
            opacity="0.55"
          />
        </g>
        <rect x="14" y="63" width="20" height="6" rx="2" fill="currentColor" />
        <path
          d="M24 69 V78"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="24" cy="82" r="4" fill="currentColor" />
      </g>
    </svg>
  );
}

/**
 * Siluet masjid: kubah, dua menara, dan bulan sabit di puncaknya.
 *
 * Dipakai sebagai latar samar, jadi bentuknya dibuat sesederhana mungkin —
 * yang terbaca hanya garis luar kubah dan menara. Jendela-jendelanya dilubangi
 * lewat `<mask>` supaya latar halaman tetap tembus, bukan ditimpa warna.
 */
export function MosqueSilhouette({ className }: ArtProps) {
  const bodyMask = useArtId("mosque-body");
  const moonMask = useArtId("mosque-moon");

  return (
    <svg
      viewBox="0 0 240 140"
      className={cn("art-anim", className)}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <mask id={bodyMask}>
          <rect width="240" height="140" fill="white" />
          <path d="M112 116 V102 a8 8 0 0 1 16 0 v14 z" fill="black" />
          <path d="M92 116 V104 a6 6 0 0 1 12 0 v12 z" fill="black" />
          <path d="M136 116 V104 a6 6 0 0 1 12 0 v12 z" fill="black" />
        </mask>

        {/* Sabit di puncak kubah: lingkaran yang digigit lingkaran lain. */}
        <mask id={moonMask}>
          <rect width="240" height="140" fill="black" />
          <circle cx="120" cy="13" r="8.5" fill="white" />
          <circle cx="123.5" cy="11.5" r="7.5" fill="black" />
        </mask>
      </defs>

      <g fill="currentColor" mask={`url(#${bodyMask})`}>
        {/* menara kiri & kanan */}
        <rect x="52" y="60" width="12" height="80" rx="4" />
        <path d="M52 60 a6 6 0 0 1 12 0 z" />
        <rect x="176" y="60" width="12" height="80" rx="4" />
        <path d="M176 60 a6 6 0 0 1 12 0 z" />

        {/* kubah */}
        <path d="M120 28 C106 28 96 44 96 60 C96 72 92 80 88 86 L152 86 C148 80 144 72 144 60 C144 44 134 28 120 28 Z" />
        <rect x="88" y="84" width="64" height="36" />

        {/* dasar yang melebar */}
        <rect x="72" y="116" width="96" height="24" rx="3" />
      </g>

      {/* bulan sabit + tiang penyangganya */}
      <rect x="119" y="20" width="2" height="9" fill="currentColor" />
      <rect
        width="240"
        height="140"
        fill="currentColor"
        mask={`url(#${moonMask})`}
        className="art-glow"
      />
    </svg>
  );
}

/**
 * Anak perempuan berkerudung.
 *
 * Digambar dari bentuk-bentuk sederhana (elips, lengkung) dengan urutan
 * lapisan yang menentukan: badan, kerudung, baru wajah — kalau wajahnya
 * digambar lebih dulu, kerudungnya akan menutupinya.
 */
export function HijabGirl({ className }: ArtProps) {
  return (
    <svg
      viewBox="0 0 96 132"
      className={cn("art-anim", className)}
      aria-hidden="true"
      focusable="false"
    >
      <g className="art-float" style={CENTER}>
        {/* badan */}
        <path
          d="M48 64 C34 64 26 78 24 132 L72 132 C70 78 62 64 48 64 Z"
          className="fill-brand-500"
        />

        {/* kerudung, dari ubun-ubun sampai bahu */}
        <path
          d="M48 4 C30 4 17 19 17 37 C17 52 20 66 25 78 C29 90 37 96 48 96 C59 96 67 90 71 78 C76 66 79 52 79 37 C79 19 66 4 48 4 Z"
          className="fill-highlight-400"
        />

        {/* wajah */}
        <ellipse cx="48" cy="40" rx="17" ry="19" fill="#f0d0b4" />

        {/* tepi kerudung di sekeliling wajah */}
        <path
          d="M31 40 C31 26 38 20 48 20 C58 20 65 26 65 40"
          fill="none"
          stroke="#f8c894"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* mata — berkedip lewat `art-blink` */}
        <g className="art-blink" style={CENTER}>
          <circle cx="41" cy="40" r="2.6" fill="#3a1a58" />
          <circle cx="55" cy="40" r="2.6" fill="#3a1a58" />
        </g>

        <circle cx="34" cy="47" r="3.2" fill="#f3b26c" opacity="0.5" />
        <circle cx="62" cy="47" r="3.2" fill="#f3b26c" opacity="0.5" />
        <path
          d="M43 49 Q48 53 53 49"
          fill="none"
          stroke="#3a1a58"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

/**
 * Anak laki-laki berpeci, tangan kanannya melambai.
 *
 * Lengannya memakai warna lengan baju, bukan warna kulit — jadi yang terlihat
 * adalah baju berlengan panjang dengan tangan kecil di ujungnya.
 */
export function PeciBoy({ className }: ArtProps) {
  return (
    <svg
      viewBox="0 0 96 132"
      className={cn("art-anim", className)}
      aria-hidden="true"
      focusable="false"
    >
      <g className="art-float" style={CENTER}>
        {/* badan */}
        <path
          d="M48 62 C32 62 24 76 22 132 L74 132 C72 76 64 62 48 62 Z"
          className="fill-accent-500"
        />

        {/* leher & telinga */}
        <rect x="42" y="50" width="12" height="14" rx="5" fill="#e3c1a1" />
        <circle cx="26" cy="40" r="4.5" fill="#e3c1a1" />
        <circle cx="70" cy="40" r="4.5" fill="#e3c1a1" />

        {/* kepala */}
        <circle cx="48" cy="38" r="22" fill="#f0d0b4" />

        {/* peci: tutup melengkung dengan pita di dahi */}
        <path d="M29 26 C31 13 65 13 67 26 Z" className="fill-brand-700" />
        <rect
          x="27"
          y="24"
          width="42"
          height="7"
          rx="3"
          className="fill-brand-800"
        />

        {/* mata — berkedip lewat `art-blink` */}
        <g className="art-blink" style={CENTER}>
          <circle cx="41" cy="39" r="2.6" fill="#3a1a58" />
          <circle cx="55" cy="39" r="2.6" fill="#3a1a58" />
        </g>

        <path
          d="M43 48 Q48 52 53 48"
          fill="none"
          stroke="#3a1a58"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* lengan melambai — berputar pada bahunya */}
        <g
          className="art-wave"
          style={{ transformBox: "fill-box", transformOrigin: "15% 87%" }}
        >
          <path
            d="M68 86 C78 84 86 74 88 62"
            fill="none"
            stroke="#8fa332"
            strokeWidth="9"
            strokeLinecap="round"
          />
          <circle cx="88" cy="60" r="5" fill="#f0d0b4" />
        </g>
      </g>
    </svg>
  );
}
