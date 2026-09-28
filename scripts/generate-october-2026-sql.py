#!/usr/bin/env python3
"""
Generator patch data jadwal Oktober 2026 untuk Pizza Snack Play.

Menghasilkan satu berkas SQL idempoten:

    scripts/sql/2026-10-october-menus.sql

Isinya:
  1. INSERT menu baru (id melanjutkan MAX(id) produksi) + menu_items-nya.
  2. UPSERT jadwal — 22 tanggal x 6 kelas — memakai
     ON CONFLICT(schedule_date, class_name) DO UPDATE, sehingga aman
     dijalankan berulang dan sekaligus menimpa baris kelas 1 (locked)
     maupun kelas 2 (draft) yang sudah ada.

Dipakai sekali sebagai patch data produksi:

    ./node_modules/.bin/wrangler.exe d1 execute pizza-snack-play \
        --remote --file=scripts/sql/2026-10-october-menus.sql

CATATAN: berkas ini TIDAK menggantikan drizzle/seed.sql. `bun run db:seed`
memulai dengan DELETE FROM seluruh tabel dan akan menghapus data produksi
(nomor telepon asli, akun, klaim). Patch Oktober sengaja terpisah.
"""

from __future__ import annotations

import re
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "scripts" / "sql" / "2026-10-october-menus.sql"

# ─────────────────────────────────────────────────────────────
# Snapshot produksi per 2026-09-27 (dibaca read-only sebelum patch).
# Dipakai untuk memutuskan menu mana yang bisa dipakai ulang.
# ─────────────────────────────────────────────────────────────

EXISTING_MENUS: dict[int, str] = {
    1: "Roti isi coklat + jeruk",
    2: "Tahu isi sayur + melon",
    3: "Pisang panggang coklat keju + nanas madu",
    4: "Urap jagung + semangka",
    5: "Ubi cilembu + Jambu air",
    6: "Bihun goreng sayur + pisang",
    7: "Sawut singkong + melon",
    8: "Nagasari + pisang",
    9: "Risol ayam + pepaya",
    10: "Edamame rebus + jeruk",
    11: "Donat kentang + Pepaya",
    12: "Kukus ubi ungu + strawberry",
    13: "Telor sayur gulung + salak",
    14: "Puding labu kuning + pisang",
    15: "Pastel sayur + jambu kristal",
    16: "Jagung rebus + pisang",
    17: "lemet + salak",
    18: "Bola bola ubi + melon",
    19: "Kroket kentang sayur + semangka",
    20: "pisang goreng + bengkoang",
    21: "Lontong isi ayam + strawberry",
    22: "Telur puyuh rebus + buah naga",
    23: "Sandwich telur + Pepaya",
    24: "Bihun sayur + semangka",
    25: "Pastel + jeruk",
    26: "Bolen + strawberry",
    27: "Ubi cilembu + Klengkeng",
    28: "Risol sayur + Melon",
    29: "Misro + pisang",
    30: "Pisang kukus + nanas madu",
    31: "Klepon + salak",
    32: "Onde onde + jambu kristal",
    33: "Roti bakar + Pepaya",
    34: "Gabin tape + pir",
    35: "Telor rebus + jeruk",
    36: "kue sus + strawberry",
    37: "Bakwan sayur + melon",
    38: "Biji salak + pisang",
    39: "tahu bakso + sawo",
    40: "Serabi + jambu air",
    41: "kue lumpur + nanas madu",
    42: "sosis solo + bengkoang",
    43: "Puding Roti + Jeruk",
}

NEXT_MENU_ID = max(EXISTING_MENUS) + 1  # 44
NEXT_MENU_ITEM_ID = 87  # MAX(menu_items.id) produksi = 86

CLASSES = ["1", "2", "3", "4", "5", "6"]
ADMIN_USER_ID = 1

# ─────────────────────────────────────────────────────────────
# Kategori (sama dengan scripts/seed.ts)
# ─────────────────────────────────────────────────────────────

CATEGORY_ID_BY_SLUG = {
    "gorengan": 1,
    "kukusan": 2,
    "rebusan": 3,
    "panggangan": 4,
    "buah-segar": 5,
    "roti-bakery": 6,
    "kue-tradisional": 7,
    "lainnya": 8,
}

CATEGORY_KEYWORDS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"roti|sandwich|bolen|gabin|kue sus|kue lumpur|donat", re.I), "roti-bakery"),
    (re.compile(r"nagasari|klepon|lemet|sawut|kue|serabi|puding", re.I), "kue-tradisional"),
    (re.compile(r"panggang|bakar", re.I), "panggangan"),
    (re.compile(r"rebus|kukus|edamame|telur puyuh|telor rebus|jagung rebus", re.I), "rebusan"),
    (re.compile(r"risol|bakwan|misro|onde|pastel|kroket|sosis solo|tahu|ubi|pisang goreng", re.I), "gorengan"),
    (re.compile(r"bihun|urap|kroket", re.I), "lainnya"),
]


def category_slug(item_name: str, item_type: str) -> str:
    if item_type == "fruit":
        return "buah-segar"
    for pattern, slug in CATEGORY_KEYWORDS:
        if pattern.search(item_name):
            return slug
    return "lainnya"


# ─────────────────────────────────────────────────────────────
# Rencana menu Oktober 2026 (dari instruksi sekolah).
#
# Blok "14 - 18 Oktober" pada instruksi asli diberi label Senin-Jumat,
# padahal 14 Okt 2026 jatuh hari Rabu. Sudah dikonfirmasi tanggal yang
# benar adalah 12 - 16 Oktober (Senin-Jumat) — juga cocok dengan baris
# `weeks` id 13 yang sudah ada di produksi.
#
# week_id: 11 = 28 Sep-02 Okt, 12 = 05-09 Okt, 13 = 12-16 Okt,
#          14 = 19-23 Okt, 15 = 26-30 Okt (semuanya sudah ada di produksi).
# ─────────────────────────────────────────────────────────────

PLAN: list[tuple[str, int, str]] = [
    ("2026-10-01", 11, "Puding Roti + jeruk"),
    ("2026-10-02", 11, "Libur"),
    ("2026-10-05", 12, "Pisang kukus + Melon"),
    ("2026-10-06", 12, "Bubur kacang hijau + pisang"),
    ("2026-10-07", 12, "pastel sayur + pir"),
    ("2026-10-08", 12, "kacang rebus + mangga"),
    ("2026-10-09", 12, "Dimsum + semangka"),
    ("2026-10-12", 13, "Telur rebus + pepaya"),
    ("2026-10-13", 13, "urab jagung + Nanas madu"),
    ("2026-10-14", 13, "singkong thailand + strawberry"),
    ("2026-10-15", 13, "Lemper ayam + jeruk"),
    ("2026-10-16", 13, "tahu bakso + mangga"),
    ("2026-10-19", 14, "Getuk + melon"),
    ("2026-10-20", 14, "sandwich telur + jeruk"),
    ("2026-10-21", 14, "kue lumpur + pepaya"),
    ("2026-10-22", 14, "misro + salak"),
    ("2026-10-23", 14, "somay + buah naga"),
    ("2026-10-26", 15, "Onde onde kacang hijau + nanas madu"),
    ("2026-10-27", 15, "kolak pisang + jambu kristal"),
    ("2026-10-28", 15, "omelet sayur + semangka"),
    ("2026-10-29", 15, "klepon + strawberry"),
    ("2026-10-30", 15, "popcorn caramel + pisang"),
]


# ─────────────────────────────────────────────────────────────
# Util
# ─────────────────────────────────────────────────────────────


def sql_str(value: str | None) -> str:
    if value is None:
        return "NULL"
    return "'" + value.replace("'", "''") + "'"


def split_menu(text: str) -> tuple[str, str | None]:
    """Pecah 'Utama + Buah' menjadi (utama, buah) — cerminan parseMenuText()."""
    parts = [p.strip() for p in text.split("+") if p.strip()]
    return parts[0], (" + ".join(parts[1:]) if len(parts) > 1 else None)


def menu_key(text: str) -> str:
    main, fruit = split_menu(text)
    return f"{main.lower()}|{(fruit or '').lower()}"


def main() -> int:
    # ── validasi rencana
    if len(PLAN) != 22:
        raise SystemExit(f"PLAN harus 22 tanggal, dapat {len(PLAN)}")

    existing_by_key = {menu_key(name): mid for mid, name in EXISTING_MENUS.items()}

    new_menus: list[tuple[int, str, str, str | None]] = []  # (id, name, main, fruit)
    menu_id_by_date: dict[str, int | None] = {}
    reused: list[tuple[str, int]] = []

    next_menu_id = NEXT_MENU_ID
    for iso, _week, text in PLAN:
        if text.strip().lower() == "libur":
            menu_id_by_date[iso] = None
            continue

        key = menu_key(text)
        if key in existing_by_key:
            menu_id_by_date[iso] = existing_by_key[key]
            reused.append((text, existing_by_key[key]))
            continue

        main_name, fruit_name = split_menu(text)
        new_menus.append((next_menu_id, text, main_name, fruit_name))
        menu_id_by_date[iso] = next_menu_id
        existing_by_key[key] = next_menu_id
        next_menu_id += 1

    # ── assertions: patch ini harus menghasilkan tepat 20 menu baru id 44-63
    expected_new = 20
    if len(new_menus) != expected_new:
        raise SystemExit(f"Harus {expected_new} menu baru, dapat {len(new_menus)}")
    if [m[0] for m in new_menus] != list(range(NEXT_MENU_ID, NEXT_MENU_ID + expected_new)):
        raise SystemExit("id menu baru tidak berurutan dari 44")
    if reused != [("Puding Roti + jeruk", 43)]:
        raise SystemExit(f"Menu pakai-ulang tidak sesuai dugaan: {reused}")

    # ── menu_items
    menu_items: list[tuple[int, int, str, str, int]] = []
    next_item_id = NEXT_MENU_ITEM_ID
    for menu_id, _name, main_name, fruit_name in new_menus:
        menu_items.append(
            (next_item_id, menu_id, main_name, "main",
             CATEGORY_ID_BY_SLUG[category_slug(main_name, "main")])
        )
        next_item_id += 1
        if fruit_name:
            menu_items.append(
                (next_item_id, menu_id, fruit_name, "fruit",
                 CATEGORY_ID_BY_SLUG[category_slug(fruit_name, "fruit")])
            )
            next_item_id += 1

    # ── baris jadwal
    schedule_rows: list[str] = []
    for iso, week_id, text in PLAN:
        d = date.fromisoformat(iso)
        dow = d.isoweekday()  # 1=Senin .. 7=Minggu
        if dow > 5:
            raise SystemExit(f"{iso} bukan hari kerja (dow={dow})")
        if week_id not in (11, 12, 13, 14, 15):
            raise SystemExit(f"{iso} memakai week_id tak terduga: {week_id}")

        is_holiday = text.strip().lower() == "libur"
        menu_id = menu_id_by_date[iso]
        notes = "Libur" if is_holiday else None

        for class_name in CLASSES:
            schedule_rows.append(
                "  ({week}, {date}, {dow}, {cls}, {menu}, {hol}, {notes}, "
                "'published', {admin}, datetime('now'))".format(
                    week=week_id,
                    date=sql_str(iso),
                    dow=dow,
                    cls=sql_str(class_name),
                    menu=menu_id if menu_id is not None else "NULL",
                    hol=1 if is_holiday else 0,
                    notes=sql_str(notes),
                    admin=ADMIN_USER_ID,
                )
            )

    expected_rows = len(PLAN) * len(CLASSES)
    if len(schedule_rows) != expected_rows:
        raise SystemExit(f"Harus {expected_rows} baris jadwal, dapat {len(schedule_rows)}")

    # ── rangkai SQL
    out: list[str] = []
    out.append("-- Patch data jadwal Oktober 2026 — Pizza Snack Play")
    out.append("-- Dibuat oleh scripts/generate-october-2026-sql.py")
    out.append("--")
    out.append("-- 22 tanggal x 6 kelas = 132 baris jadwal, 20 menu baru, 40 menu_item.")
    out.append("-- Idempoten: ON CONFLICT(schedule_date, class_name) DO UPDATE.")
    out.append("-- Menu id 43 (Puding Roti + Jeruk) dipakai ulang, bukan dibuat baru.")
    out.append("")
    out.append("-- ── 1. Menu baru ─────────────────────────────────────────────")
    menu_values = ",\n  ".join(
        f"({mid}, {sql_str(name)}, NULL)" for mid, name, _m, _f in new_menus
    )
    out.append(
        f"INSERT INTO menus (id, name, description) VALUES\n  {menu_values}\n"
        "ON CONFLICT(id) DO NOTHING;"
    )
    out.append("")
    out.append("-- ── 2. Komponen menu baru ────────────────────────────────────")
    item_values = ",\n  ".join(
        f"({iid}, {mid}, {sql_str(iname)}, {sql_str(itype)}, {cat})"
        for iid, mid, iname, itype, cat in menu_items
    )
    out.append(
        "INSERT INTO menu_items (id, menu_id, name, item_type, category_id) VALUES\n"
        f"  {item_values}\n"
        "ON CONFLICT(id) DO NOTHING;"
    )
    out.append("")
    out.append("-- ── 3. Jadwal: upsert 22 tanggal x 6 kelas ───────────────────")
    out.append("-- Baris kelas 1 (locked) dan kelas 2 (draft) ikut ditimpa;")
    out.append("-- kunci dilepas karena statusnya menjadi published.")
    out.append(
        "INSERT INTO schedules (week_id, schedule_date, day_of_week, class_name, "
        "menu_id, is_holiday, notes, status, published_by, published_at)\nVALUES\n"
        + ",\n".join(schedule_rows)
        + "\nON CONFLICT(schedule_date, class_name) DO UPDATE SET\n"
        "  week_id      = excluded.week_id,\n"
        "  day_of_week  = excluded.day_of_week,\n"
        "  menu_id      = excluded.menu_id,\n"
        "  is_holiday   = excluded.is_holiday,\n"
        "  notes        = excluded.notes,\n"
        "  status       = excluded.status,\n"
        "  published_by = excluded.published_by,\n"
        "  published_at = excluded.published_at,\n"
        "  locked_by    = NULL,\n"
        "  locked_at    = NULL,\n"
        "  updated_at   = datetime('now');"
    )
    out.append("")

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text("\n".join(out), encoding="utf-8")

    print(f"SQL ditulis ke {OUTPUT.relative_to(ROOT)}")
    print(f"  Menu baru    : {len(new_menus)} (id {new_menus[0][0]}-{new_menus[-1][0]})")
    print(f"  Menu dipakai ulang: {', '.join(f'{n} (id {i})' for n, i in reused)}")
    print(f"  Menu item    : {len(menu_items)} (id {menu_items[0][0]}-{menu_items[-1][0]})")
    print(f"  Baris jadwal : {len(schedule_rows)} ({len(PLAN)} tanggal x {len(CLASSES)} kelas)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
