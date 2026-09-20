"""
Menghasilkan seluruh ikon PWA & favicon dari `public/logo.png`.

Latar masalah: `public/pwa/icon-*.png` sebelumnya berupa **placeholder
buatan** — huruf "P" putih di lingkaran ungu — bukan logo asli, sehingga
aplikasi yang dipasang ke layar utama tampil dengan huruf "P".

Semua ukuran diturunkan dari satu sumber (`public/logo.png`) agar konsisten.
Logo sumber ternyata sebuah *app tile*: artwork di dalam kotak membulat teal,
dengan margin terang + bayangan di luarnya. Untuk ikon PWA, margin itu harus
dibuang — kalau tidak, akan terlihat kotak pucat di dalam ikon maskable.

Rancangan tiap ikon:

- `pwa/icon-192x192.png`, `pwa/icon-512x512.png`
  Ikon manifest (`purpose: any maskable`). Artwork ditempatkan di atas latar
  gradien teal dengan **safe zone ~78%** — cukup longgar sehingga tulisan
  "PLAY" tidak terpotong saat Android memaskotnya jadi lingkaran atau squircle,
  tetapi tetap terlihat besar di ikon biasa.

- `pwa/icon-maskable-512x512.png`
  Varian maskable: latar gradien teal penuh + artwork diperkecil ke **safe zone
  60%** agar aman untuk maskot paling agresif.

- `apple-touch-icon.png` (180x180)
  iOS mengabaikan transparansi dan menambahkan sudut membulat sendiri, jadi
  ikon dibuat persegi penuh tanpa alpha.

- `favicon-32x32.png`
  Hanya memakai artwork (pizza + kalender), **tanpa baris teks**. Pada 32px
  tinggi tiap huruf hanya ~3–4px, sehingga tulisan "PIZZA SNACK PLAY" menjadi
  kabut abu-abu yang justru mengaburkan bentuk pizza. Teks dibuang supaya
  siluet pizza tetap terbaca.

Jalankan: python scripts/generate-pwa-icons.py
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
SOURCE = PUBLIC / "logo.png"

# Kotak tile di dalam logo sumber.
#
# Logo aslinya sebuah *app tile*: artwork di dalam kotak membulat teal, dengan
# margin terang lalu bayangan di luarnya. Tepi membulat itu punya piksel
# anti-alias pucat selebar ~15–20px yang, bila ikut dipotong, akan terlihat
# sebagai halo di atas latar teal ikon baru. Karena itu kotak ini **dimasukkan
# ke dalam** tepi tile (bukan tepat di batasnya) agar hanya teal padat yang
# terpakai. Nilai ditentukan dengan menyampel tepi pada y=350 dan x=350.
TILE_BOX = (63, 53, 646, 660)

# Kotak artwork di dalam tile — dipakai agar logo bisa ditengahkan ulang di
# atas latar baru, bukan sekadar ditempel mengikuti posisi aslinya.
#
# Batas bawah sengaja di `620`, bukan `642`: di bawah baris terakhir teks
# "PLAY" ada busur tipis sisa tepi membulat tile yang, kalau ikut terbawa,
# akan tampak sebagai garis melengkung pucat di atas latar teal ikon baru.
ART_BOX = (89, 111, 636, 621)

# Kotak artwork khusus favicon — **tanpa baris teks**.
#
# Pada 32px tinggi tiap huruf hanya ~3–4px, jadi tulisan "PIZZA SNACK PLAY"
# menjadi kabut abu-abu yang mengaburkan bentuk pizza.
#
# Susunan sumber (diukur dari profil kerapatan tinta per baris):
#
#     y 111..354   artwork pizza + kalender
#     y 355..370   celah
#     y 371..427   baris teks "PIZZA"
#     y 428..441   celah
#     y 442..498   baris teks "SNACK"
#     y 499..511   celah
#     y 512..568   baris teks "PLAY"
#
# Batas bawah `355` memotong tepat di celah pertama, jadi ketiga baris teks
# hilang. Namun karena teks dibuang, ruangnya kini dipakai untuk memperbesar
# pizza — sehingga pizza + kalender saja tetap terbaca tegas di 32px.
ART_BOX_NO_TEXT = (89, 111, 636, 355)

# Dua ujung gradien teal, disampel dari logo asli.
TEAL_LIGHT = (182, 233, 236)
TEAL_DARK = (130, 207, 217)


def load_art(box: tuple[int, int, int, int] = ART_BOX) -> Image.Image:
    """
    Artwork logo (pizza + kalender + teks) di atas latar transparan.

    Latar dibuang dengan **kunci warna teal**, bukan dengan mengukur
    kegelapan: sebagian artwork justru lebih terang daripada latarnya (kulit
    pizza kuning pucat), sehingga heuristik "makin gelap = makin artwork" ikut
    menghapus bagian pizza.

    Karena itu tiap piksel diuji terhadap rentang warna teal tile. Piksel yang
    cocok dibuat transparan; yang tidak cocok dibiarkan utuh. Ambangnya
    sengaja ketat supaya warna artwork tidak ikut terkikis.
    """
    if not SOURCE.exists():
        raise SystemExit(f"Sumber logo tidak ditemukan: {SOURCE}")

    art = Image.open(SOURCE).convert("RGBA").crop(box)
    src = art.load()
    pixels = []

    for y in range(art.height):
        for x in range(art.width):
            r, g, b, _ = src[x, y]

            # Teal tile: g & b tinggi dan berdekatan, r lebih rendah.
            is_teal = g > 175 and b > 175 and (g - r) > 12 and abs(g - b) < 30

            # Sisa tepi anti-alias & konfeti adalah **abu-abu pucat** — ketiga
            # kanal tinggi dan hampir setara. Artwork asli tidak pernah begitu:
            # bagian paling terangnya (badan kalender) benar-benar putih murni,
            # sedangkan ini abu kebiruan. Dibuang agar tidak jadi bercak.
            is_pale_edge = r > 200 and g > 215 and b > 215 and (max(r, g, b) - min(r, g, b)) < 22

            pixels.append((r, g, b, 0 if (is_teal or is_pale_edge) else 255))

    art.putdata(pixels)
    return art


def favicon_art() -> Image.Image:
    """
    Artwork pizza + kalender untuk favicon — kompak, mendekati persegi.

    Kalau hanya teks yang dibuang, sisanya adalah **pizza tinggi kurus**
    (segitiga yang menjulur jauh ke bawah) di samping kalender kecil. Pada 32px
    siluet itu terbaca sebagai coretan tipis, bukan pizza.

    Perbaikannya: kalender di sisi kanan dipotong lalu **diturunkan** sampai
    dasar artwork yang baru — sehingga bentuk keseluruhan jadi jauh lebih
    padat dan hampir persegi. Pizza tidak disentuh, jadi ujung lancipnya tetap
    utuh. Pergeseran `68` dipilih karena, setelah teks dibuang, kalender
    menggantung 68px di atas dasar pizza.
    """
    art = load_art(ART_BOX_NO_TEXT)

    # Kalender ada di kanan atas (diukur pada sumber: x 430..636).
    cal_x = 430 - ART_BOX_NO_TEXT[0]
    kiri = art.crop((0, 0, cal_x, art.height))
    kalender = art.crop((cal_x, 0, art.width, art.height))

    out = Image.new("RGBA", (art.width, art.height), (0, 0, 0, 0))
    out.paste(kalender, (cal_x, 68), kalender)
    out.paste(kiri, (0, 0), kiri)
    return out


def fit_to(art: Image.Image, size: int, fill_ratio: float) -> Image.Image:
    """Perkecil artwork agar lebarnya = `size * fill_ratio` (bukan sisi terpanjang)."""
    target = max(1, round(size * fill_ratio))
    scale = target / max(art.width, art.height)
    return art.resize(
        (max(1, round(art.width * scale)), max(1, round(art.height * scale))),
        Image.LANCZOS,
    )


def teal_gradient(size: int) -> Image.Image:
    """
    Latar gradien diagonal dari dua warna tile.

    Digambar per baris lalu diperbesar — jauh lebih cepat daripada
    menghitung tiap piksel di Python.
    """
    # Gradien 1D sepanjang diagonal, lalu dipetakan ke dua sumbu.
    strip = Image.new("RGB", (size, 1))
    draw = ImageDraw.Draw(strip)
    for x in range(size):
        t = x / max(1, size - 1)
        draw.point(
            (x, 0),
            fill=tuple(
                round(a + (b - a) * t)
                for a, b in zip(TEAL_LIGHT, TEAL_DARK)
            ),
        )
    # Regangkan menjadi gradien vertikal, lalu putar & campur agar diagonal.
    vertical = strip.resize((1, size), Image.BILINEAR).resize((size, size))
    horizontal = strip.resize((size, size), Image.BILINEAR)
    return Image.blend(vertical, horizontal, 0.5).convert("RGBA")


def fit(art: Image.Image, size: int, fill_ratio: float) -> Image.Image:
    """Perkecil artwork agar sisi terpanjangnya = `size * fill_ratio`."""
    target = max(1, round(size * fill_ratio))
    w, h = art.size
    scale = target / max(w, h)
    return art.resize(
        (max(1, round(w * scale)), max(1, round(h * scale))), Image.LANCZOS
    )


def centered(background: Image.Image, art: Image.Image) -> Image.Image:
    """Tempel artwork di tengah latar."""
    out = background.copy()
    out.paste(
        art,
        ((out.width - art.width) // 2, (out.height - art.height) // 2),
        art,
    )
    return out


def sharpen(im: Image.Image) -> Image.Image:
    """Pertajam ikon kecil agar garis logo tidak kabur di 32px."""
    return im.filter(ImageFilter.UnsharpMask(radius=1.0, percent=90, threshold=2))


def save(im: Image.Image, relative: str) -> None:
    path = PUBLIC / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, format="PNG", optimize=True)
    print(f"  {relative:38} {im.width}x{im.height}  {path.stat().st_size:>7,} B")


def main() -> None:
    print(f"Sumber: {SOURCE.relative_to(ROOT)}  (tile {TILE_BOX}, artwork {ART_BOX})\n")
    art = load_art()

    print("Ikon manifest (any, safe zone 78%):")
    # Artwork ditengahkan di atas gradien teal dengan margin longgar, jadi
    # "PLAY" tidak terpotong saat dimaskot jadi lingkaran/squircle.
    for size in (192, 512):
        save(
            centered(teal_gradient(size), fit(art, size, 0.78)),
            f"pwa/icon-{size}x{size}.png",
        )

    print("\nIkon maskable khusus (safe zone 56%):")
    # Android memaskot ikon ini menjadi lingkaran/squircle penuh. Artwork
    # dikecilkan ke 56% — di bawah ambang aman 60% — karena baris teks
    # "PLAY" berada di bagian bawah dan itu yang paling dulu terpotong.
    save(
        centered(teal_gradient(512), fit(art, 512, 0.56)),
        "pwa/icon-maskable-512x512.png",
    )

    print("\niOS & favicon:")
    # iOS: persegi penuh; gradien teal di tepi, tanpa alpha.
    save(centered(teal_gradient(180), fit(art, 180, 0.80)), "apple-touch-icon.png")

    # Favicon: pizza + kalender tanpa teks, dibuat lebih mengisi bidang karena
    # tidak ada lagi baris teks yang perlu ruang di bawah.
    fav = fit_to(favicon_art(), 32, 0.90)
    save(sharpen(centered(teal_gradient(32), fav)), "favicon-32x32.png")

    print("\nSelesai.")


if __name__ == "__main__":
    main()
