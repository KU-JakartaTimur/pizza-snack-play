"""
Menghasilkan gambar sampul (cover) 16:9 untuk etalase aplikasi.

Kenapa skrip, bukan sekali gambar: sampul ini dipakai di halaman etalase, dan
setiap kali nama atau semboyannya berubah ia harus dibuat ulang dengan ukuran
dan gaya yang sama. Semua warna, ukuran, dan teksnya karena itu dikumpulkan di
satu tempat di berkas ini — bukan disebar di beberapa gambar jadi.

Kenapa 380x216: ukuran yang diminta etalase (rasio 16:9). Semua digambar `S`
kali lebih besar lalu diperkecil; teks 12–24px yang digambar langsung akan
bergerigi, sedangkan yang diperkecil dari 4x tepinya halus. Versi 2x (760x432)
memakai jalur yang sama, hanya `zoom`-nya 2 — jadi tata letaknya identik.

**Palet sampul = palet UI** (`src/index.css`, blok `@theme`), bukan palet merek
di logo. Alasannya: sampul ini ditempel di etalase yang membuka aplikasinya,
dan yang pertama dilihat pengunjung sesudah itu adalah antarmuka ungu —
memakai warna ungu yang sama membuat sampul dan halamannya terbaca sebagai
satu benda. Tanda tangan antarmuka yang ikut dibawa: **garis tiga warna**
(`.brand-stripe`: ungu → hijau limau → oranye persik) di tepi atas, sama
seperti kepala halaman di dalam aplikasi.

**Bulan sabit & bintang delapan dari halaman depan sengaja TIDAK dipakai.**
Bukan karena warnanya, tapi karena ukurannya: `Hero.tsx` memasang keduanya
dengan `hidden … lg:block`, jadi di bawah 1024px aplikasinya sendiri tidak
pernah menampilkannya. Pada kanvas 380px hiasan itu tinggal 26–46px — bulan
sabitnya terbaca sebagai gumpalan, dan bintang di kiri bawah menabrak teks
semboyan. Sampul mengikuti keputusan aplikasinya, bukan menentangnya.

Artwork pizza + kalender **tidak digambar ulang** dan **warnanya tidak diubah**.
Ia diambil dari `public/logo.png` memakai `load_art()` dari
`generate-pwa-icons.py`, supaya sampul dan ikon aplikasi tidak pernah berbeda
bentuk — kalau logonya berganti, keduanya ikut berganti dari satu sumber.
Artwork itu memang teal: itulah warna mereknya, dan teal di atas ungu pucat
tetap terbaca sebagai logo, bukan sebagai warna yang salah.

Font: Baloo 2 Bold untuk judul (bentuk bulatnya sejalan dengan wordmark di
logo) dan Inter Medium untuk semboyan (huruf teks yang dipakai aplikasinya
sendiri). Keduanya disimpan sebagai instance statis yang sudah disubset di
`scripts/fonts/`, jadi skrip ini tidak butuh jaringan untuk berjalan.

`scripts/fonts/` juga memuat salinan lisensi OFL kedua font. Berkas fontnya
adalah instance statis (Baloo 2 pada `wght` 700, Inter pada `opsz` 14 /
`wght` 500) yang disubset ke Latin-1 dasar + tanda baca tipografis, dibuat
dari berkas variabel di repositori `google/fonts` lewat `fontTools`:

    instancer   ->  Baloo2[wght].ttf        wght=700
                    Inter[opsz,wght].ttf    opsz=14, wght=500
    pyftsubset  ->  hanya 0x20–0xFF + kutip/tanda pisah/titik tengah

Jalankan: python scripts/generate-cover.py

Menghasilkan empat berkas di `outputs/` — dua ukuran (380×216 untuk etalase,
760×432 untuk keperluan lain) × dua format (PNG untuk berkas kerja, JPEG untuk
diunggah; banyak etalase hanya menerima JPEG).
"""

from __future__ import annotations

import importlib.util
import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
HERE = Path(__file__).resolve().parent
OUTPUTS = ROOT / "outputs"
FONTS = HERE / "fonts"

# ── Ukuran akhir & skala gambar ──────────────────────────────────────────
W, H = 380, 216
S = 4  # digambar 4x lebih besar, lalu diperkecil (anti-alias)

# ── Palet UI (src/index.css) ─────────────────────────────────────────────
BRAND_100 = (239, 232, 247)
BRAND_200 = (222, 208, 238)
BRAND_400 = (164, 130, 206)
BRAND_500 = (134, 89, 185)
BRAND_600 = (81, 39, 124)
BRAND_800 = (58, 26, 88)
BRAND_900 = (47, 21, 71)
ACCENT_500 = (175, 196, 64)
HIGHLIGHT_100 = (253, 241, 225)
HIGHLIGHT_400 = (243, 178, 108)
SLATE_600 = (71, 85, 105)

# ── Teks sampul ──────────────────────────────────────────────────────────
TITLE = "PIZZA SNACK PLAY"
TAGLINE = "Jadwal piket snack sekolah, rapi dalam satu aplikasi"

# ── Susunan (satuan desain, dikalikan `zoom * S` saat digambar) ───────────
MARGIN = 24
STRIPE_H = 4  # `.brand-stripe` = `h-1` di aplikasi
ART_H = 106
GAP_ART_TITLE = 13
TITLE_SIZE = 24
TITLE_TRACKING = 0.03  # em — huruf besar perlu sedikit renggang
GAP_TITLE_TAGLINE = 10
TAGLINE_SIZE = 12.5
TAGLINE_TRACKING = 0.005

SEED = 20261017  # konfeti harus sama tiap kali skrip dijalankan


# ── Artwork dari logo ────────────────────────────────────────────────────


def _pwa_icons():
    """Muat `generate-pwa-icons.py` sebagai modul (namanya berhubung)."""
    spec = importlib.util.spec_from_file_location(
        "generate_pwa_icons", HERE / "generate-pwa-icons.py"
    )
    if spec is None or spec.loader is None:  # pragma: no cover - tak terduga
        raise SystemExit("Tidak bisa memuat scripts/generate-pwa-icons.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def logo_art() -> Image.Image:
    """
    Pizza + kalender saja, tanpa baris teks, dipotong rapat ke tintanya.

    `ART_BOX_NO_TEXT` memotong tepat di celah sebelum baris "PIZZA", jadi
    ketiga baris teks logo hilang dan yang tersisa hanya artwork-nya. Sisa
    kotak kosong di kiri/kanan dipotong lewat `getbbox()` supaya penempatan
    di sampul bisa dihitung dari ukuran tinta yang sebenarnya.
    """
    pwa = _pwa_icons()
    art = pwa.load_art(pwa.ART_BOX_NO_TEXT)
    box = art.getbbox()
    if box is None:  # pragma: no cover - hanya kalau logo rusak
        raise SystemExit("Artwork logo kosong — periksa public/logo.png")
    return art.crop(box)


# ── Latar ────────────────────────────────────────────────────────────────


def mix(a, b, t: float):
    """Warna di antara `a` dan `b` sejauh `t` (0..1)."""
    return tuple(round(c + (d - c) * t) for c, d in zip(a, b))


def ramp(width: int, stops: list) -> list:
    """
    Sederet warna `width` buah dari beberapa `stops` yang berjarak sama.

    Dipakai untuk gradien mendatar (latar maupun teks) supaya gradiennya
    dihitung sekali saja, bukan per baris.
    """
    last = len(stops) - 1
    out = []
    for x in range(width):
        t = x / max(1, width - 1) * last
        i = min(int(t), last - 1) if last else 0
        out.append(mix(stops[i], stops[min(i + 1, last)], t - i))
    return out


def diagonal_gradient(size: tuple[int, int], stops: list) -> Image.Image:
    """
    Gradien diagonal dari kiri atas ke kanan bawah, lewat beberapa `stops`.

    Digambar kecil lalu diperbesar: menghitung tiap piksel di ukuran penuh
    lambat, sedangkan gradien mulus tidak butuh resolusi tinggi.
    """
    w, h = size
    sw, sh = max(2, w // 6), max(2, h // 6)
    small = Image.new("RGB", (sw, sh))
    px = small.load()
    last = len(stops) - 1
    for y in range(sh):
        for x in range(sw):
            t = (x / max(1, sw - 1) + y / max(1, sh - 1)) / 2 * last
            i = min(int(t), last - 1) if last else 0
            px[x, y] = mix(stops[i], stops[min(i + 1, last)], t - i)
    return small.resize(size, Image.BICUBIC)


def radial_mask(size: tuple[int, int], center, radius, peak: float) -> Image.Image:
    """Masker L: terang di `center`, nol di tepi `radius` — melebar mengikuti kanvas."""
    w, h = size
    sw, sh = max(2, w // 8), max(2, h // 8)
    small = Image.new("L", (sw, sh))
    px = small.load()
    cx, cy = center[0] / w * sw, center[1] / h * sh
    rx, ry = radius[0] / w * sw, radius[1] / h * sh
    for y in range(sh):
        for x in range(sw):
            d = math.hypot((x - cx) / rx, (y - cy) / ry)
            px[x, y] = round(peak * 255 * max(0.0, 1.0 - d) ** 1.7)
    return small.resize(size, Image.BICUBIC)


def white_wash(canvas: Image.Image, mask: Image.Image) -> None:
    """Timpa kanvas dengan putih sekuat `mask` — mengangkat bagian tengah."""
    flat = Image.new("L", canvas.size, 255)
    canvas.alpha_composite(Image.merge("RGBA", (flat, flat, flat, mask)))


def confetti(canvas: Image.Image, rng: random.Random, zoom: float) -> None:
    """
    Hiasan geometris samar, mengikuti tile logo.

    Bentuknya sengaja tipis (alpha 0,16–0,38 dari warna ungu 400): tugasnya
    memberi tekstur pada bidang pucat yang lebar, bukan jadi perhatian.
    Sebarannya menghindari bagian tengah, tempat artwork dan judul berdiri.
    """
    w, h = canvas.size
    k = zoom * S
    kinds = ["triangle", "circle", "dot", "blob"]
    spots = [
        (0.06, 0.16), (0.13, 0.72), (0.04, 0.50), (0.26, 0.06),
        (0.33, 0.90), (0.52, 0.07), (0.68, 0.93), (0.80, 0.14),
        (0.93, 0.44), (0.90, 0.86), (0.44, 0.06), (0.60, 0.94),
    ]
    for i, (fx, fy) in enumerate(spots):
        kind = kinds[i % len(kinds)]
        size = rng.uniform(10, 20) * k
        warm = i % 5 == 0  # sesekali oranye persik, seperti hiasan halaman depan
        alpha = rng.randint(74, 112) if warm else rng.randint(46, 92)
        color = (*(HIGHLIGHT_400 if warm else BRAND_400), alpha)

        pad = 3 * k
        side = int(size + pad * 2)
        layer = Image.new("RGBA", (side, side), (0, 0, 0, 0))
        d = ImageDraw.Draw(layer)
        p, e = pad, size
        stroke = max(1, round(1.1 * k))
        if kind == "circle":
            d.ellipse((p, p, p + e, p + e), outline=color, width=stroke)
        elif kind == "triangle":
            d.polygon(
                [(p + e / 2, p), (p + e, p + e * 0.9), (p, p + e * 0.9)],
                outline=color,
                width=stroke,
            )
        elif kind == "blob":
            d.rounded_rectangle(
                (p, p, p + e * 0.85, p + e * 0.85),
                radius=e * 0.3,
                outline=color,
                width=stroke,
            )
        else:
            d.ellipse((p, p, p + e * 0.42, p + e * 0.42), fill=color)

        layer = layer.rotate(rng.uniform(0, 359), resample=Image.BICUBIC)
        canvas.alpha_composite(
            layer,
            (round(fx * w - layer.width / 2), round(fy * h - layer.height / 2)),
        )


# ── Teks ─────────────────────────────────────────────────────────────────


def render_mask(text: str, font: ImageFont.FreeTypeFont, tracking_em: float) -> Image.Image:
    """
    Masker L berisi `text`, dipotong rapat ke tinta-nya.

    Dipotong ke `getbbox()` supaya penumpukan judul–semboyan bisa dihitung
    dari tinggi huruf yang benar-benar terlihat, bukan dari metrik baris font
    yang menyisakan ruang kosong berbeda-beda tiap huruf.

    Jarak antarhuruf ditulis sendiri (Pillow tidak punya `letter-spacing`)
    karena judul huruf besar tampak sempit kalau dibiarkan rapat.
    """
    track = tracking_em * font.size
    widths = [font.getlength(ch) for ch in text]
    total = sum(widths) + track * (len(text) - 1)

    ascent, descent = font.getmetrics()
    pad = font.size
    layer = Image.new("L", (round(total) + pad * 2, ascent + descent + pad * 2), 0)
    d = ImageDraw.Draw(layer)
    x = float(pad)
    for ch, w in zip(text, widths):
        d.text((x, pad), ch, font=font, fill=255)
        x += w + track

    box = layer.getbbox()
    if box is None:  # pragma: no cover - hanya kalau teksnya kosong
        raise SystemExit("Teks sampul kosong")
    return layer.crop(box)


def colorize(mask: Image.Image, color, alpha: int = 255) -> Image.Image:
    """Warnai masker teks dengan satu warna rata."""
    out = Image.new("RGBA", mask.size, (*color, alpha))
    out.putalpha(mask.point(lambda v: round(v * alpha / 255)))
    return out


def gradientize(mask: Image.Image, stops: list) -> Image.Image:
    """
    Warnai masker teks dengan gradien mendatar — sama dengan
    `.brand-text-gradient-strong` yang dipakai judul besar di halaman depan.
    """
    w, h = mask.size
    strip = Image.new("RGB", (w, 1))
    strip.putdata(ramp(w, stops))
    out = strip.resize((w, h)).convert("RGBA")
    out.putalpha(mask)
    return out


def fit_text(text: str, font_path: Path, start: float, tracking: float, max_width: float, k: float):
    """
    Font pada ukuran terbesar yang masih membuat `text` muat selebar `max_width`.

    Semboyannya panjang, dan lebar hasilnya bergantung pada font — ukuran yang
    ditulis tetap akan melewati tepi begitu satu katanya diganti.
    """
    size = start
    while size > 4:
        font = ImageFont.truetype(str(font_path), round(size * k))
        if render_mask(text, font, tracking).width <= max_width * k:
            return font
        size -= 0.25
    raise SystemExit(f"Teks terlalu panjang untuk sampul: {text!r}")


# ── Sampul ───────────────────────────────────────────────────────────────


def brand_stripe(canvas: Image.Image, zoom: float) -> None:
    """
    Garis tiga warna di tepi atas — `.brand-stripe` di aplikasi
    (`from-brand-600 via-accent-500 to-highlight-400`).
    """
    k = zoom * S
    bar = Image.new("RGBA", (canvas.width, max(1, round(STRIPE_H * k))))
    bar.putdata(ramp(canvas.width, [BRAND_600, ACCENT_500, HIGHLIGHT_400]) * bar.height)
    canvas.alpha_composite(bar, (0, 0))


def build(zoom: float = 1.0) -> Image.Image:
    k = zoom * S
    cw, ch = round(W * k), round(H * k)

    # Latar kanvas aplikasi: ungu pucat di kiri atas, menghangat ke kanan bawah.
    canvas = diagonal_gradient((cw, ch), [BRAND_200, BRAND_100, HIGHLIGHT_100]).convert("RGBA")
    white_wash(canvas, radial_mask((cw, ch), (cw * 0.5, ch * 0.32), (cw * 0.62, ch * 0.95), 0.34))

    confetti(canvas, random.Random(SEED), zoom)

    # ── Artwork: pizza + kalender, dengan bayangan tipis di bawahnya ──
    art = logo_art()
    art = art.resize((round(art.width * ART_H * k / art.height), round(ART_H * k)), Image.LANCZOS)
    shadow = Image.new("RGBA", art.size, (*BRAND_900, 0))
    shadow.putalpha(
        art.getchannel("A").filter(ImageFilter.GaussianBlur(3.2 * k)).point(lambda v: round(v * 0.17))
    )

    title_font = ImageFont.truetype(str(FONTS / "Baloo2-Bold.ttf"), round(TITLE_SIZE * k))
    title = gradientize(render_mask(TITLE, title_font, TITLE_TRACKING), [BRAND_800, BRAND_600, BRAND_500])
    tag_font = fit_text(
        TAGLINE, FONTS / "Inter-Medium.ttf", TAGLINE_SIZE, TAGLINE_TRACKING, W - MARGIN * 2, k
    )
    tagline = colorize(render_mask(TAGLINE, tag_font, TAGLINE_TRACKING), SLATE_600, 235)

    stack = art.height + GAP_ART_TITLE * k + title.height + GAP_TITLE_TAGLINE * k + tagline.height
    y = (ch - stack) / 2

    canvas.alpha_composite(shadow, (round((cw - art.width) / 2), round(y + 2.5 * k)))
    canvas.alpha_composite(art, (round((cw - art.width) / 2), round(y)))
    y += art.height + GAP_ART_TITLE * k
    canvas.alpha_composite(title, (round((cw - title.width) / 2), round(y)))
    y += title.height + GAP_TITLE_TAGLINE * k
    canvas.alpha_composite(tagline, (round((cw - tagline.width) / 2), round(y)))

    brand_stripe(canvas, zoom)
    return canvas.convert("RGB").resize((round(W * zoom), round(H * zoom)), Image.LANCZOS)


def main() -> None:
    """
    Tulis dua ukuran × dua format.

    PNG dan JPEG dipakai untuk keperluan berbeda, jadi keduanya dibuat dari
    gambar yang sama sekali jalan: PNG untuk berkas kerja (tanpa artefak
    kompresi, dan `md5`-nya bisa dibandingkan antar-jalan), JPEG untuk
    diunggah — banyak etalase/unggahan hanya menerima JPEG dan menolak
    berkas >1 MB. `quality=92` membuat beratnya turun sekitar lima kali
    lipat tanpa perbedaan yang terlihat pada ukuran ini; sampul hanya berisi
    bidang halus dan tepi huruf, jadi tidak ada tekstur yang perlu dijaga
    lebih tinggi. Tidak ada `progressive` dan tidak ada metadata: berkas
    sekecil ini terbaca seketika, dan jejak EXIF tidak ada gunanya di sampul.
    """
    OUTPUTS.mkdir(exist_ok=True)
    jobs = [
        (1, "cover-380x216.png", "PNG"),
        (1, "cover-380x216.jpg", "JPEG"),
        (2, "cover-760x432.png", "PNG"),
        (2, "cover-760x432.jpg", "JPEG"),
    ]
    for zoom, name, fmt in jobs:
        img = build(zoom)
        path = OUTPUTS / name
        if fmt == "PNG":
            img.save(path, format="PNG", optimize=True)
        else:
            img.save(path, format="JPEG", quality=92, optimize=True, subsampling=0)
        print(f"  {name:24} {img.width}x{img.height}  {path.stat().st_size:>7,} B")
    print("\nSelesai.")


if __name__ == "__main__":
    main()
