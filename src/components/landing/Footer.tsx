/**
 * Kaki halaman depan.
 *
 * Hanya menyebut susunan teknologinya dan satu hal yang paling sering
 * ditanyakan pengunjung baru — dari mana akunnya didapat. Tidak ada tautan
 * sosial atau kolom navigasi: halaman ini satu halaman, dan tautan ke bagian
 * yang sudah dilewati hanya menambah keramaian.
 */
export function LandingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-1.5 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-xs text-slate-400">
          Pizza Snack Play · Bun + Hono + Vite + React + Cloudflare D1
        </p>
        <p className="text-xs text-slate-400">
          Setiap orang tua punya akun sendiri yang dibuat admin sekolah.
        </p>
      </div>
    </footer>
  );
}
