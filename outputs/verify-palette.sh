#!/bin/bash
# Verifikasi visual palet #51277C / #AFC440 / #f3b26c.

AB=agent-browser
OUT=/tmp/ab-palette.log
SHOTS="D:/REACT-DEV/pizza-snack-play/outputs/screenshots/palette"
mkdir -p "$SHOTS"
: > "$OUT"

step() {
  echo "" >> "$OUT"
  echo "===== $* =====" >> "$OUT"
  timeout 90 "$AB" "$@" >> "$OUT" 2>&1
  echo "[exit=$?]" >> "$OUT"
}

# ── 1. Halaman login (belum login) ──
step open "http://localhost:5173/login"
step eval "localStorage.clear(), 'cleared'"
step open "http://localhost:5173/login"
step eval "JSON.stringify({bg: getComputedStyle(document.body).backgroundColor, tombol: getComputedStyle(document.querySelector('button[type=\"submit\"]')).backgroundColor, stripe: !!document.querySelector('.brand-stripe')})"
step screenshot "$SHOTS/01-login.png"

# ── 2. Login sebagai admin ──
step fill 'input[autocomplete="username"]' "admin"
step fill 'input[type="password"]' "snack123"
step click 'form button[type="submit"]'
step eval "location.pathname"
step screenshot "$SHOTS/02-hari-ini.png"

# ── 3. Warna kunci pada header & nav ──
step eval "JSON.stringify({navAktif: getComputedStyle([...document.querySelectorAll('nav a')].find(a=>a.getAttribute('href')==='/hari-ini')).color, logoBg: getComputedStyle(document.querySelector('header a span')).backgroundImage.slice(0,90), stripeGradient: getComputedStyle(document.querySelector('.brand-stripe')).backgroundImage})"

# ── 4. Dashboard (kartu metrik 3 warna) ──
step open "http://localhost:5173/dashboard"
step eval "JSON.stringify([...document.querySelectorAll('.card .rounded-xl')].map(el=>getComputedStyle(el).backgroundColor))"
step screenshot "$SHOTS/03-dashboard.png"

# ── 5. Bulanan (kartu hari ini persik) ──
step open "http://localhost:5173/bulan"
step eval "JSON.stringify({ringHariIni: getComputedStyle(document.querySelector('[class*=ring-highlight]') ?? document.body).getPropertyValue('--tw-ring-color').trim() || 'tidak ada hari ini'})"
step screenshot "$SHOTS/04-bulan.png"

# ── 6. Menu (chip kategori ungu, chip komponen limau) ──
step open "http://localhost:5173/menu"
step eval "JSON.stringify({adaBrand: !!document.querySelector('.bg-brand-50, .text-brand-700, .border-brand-200'), adaAccent: !!document.querySelector('.bg-accent-50, .border-accent-200')})"
step screenshot "$SHOTS/05-menu.png"

# ── 7. Kelola Jadwal ──
step open "http://localhost:5173/jadwal"
step screenshot "$SHOTS/06-jadwal.png"

# ── 8. Akun Orang Tua + modal ──
step open "http://localhost:5173/orang-tua"
step screenshot "$SHOTS/07-orang-tua.png"
step eval "[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Akun baru')?.click(), 'clicked'"
step screenshot "$SHOTS/08-modal.png"

# ── 9. Kategori & pencarian ──
step open "http://localhost:5173/kategori"
step screenshot "$SHOTS/09-kategori.png"
step open "http://localhost:5173/pencarian?q=jeruk"
step screenshot "$SHOTS/10-pencarian.png"

step close
echo "DONE" >> "$OUT"
