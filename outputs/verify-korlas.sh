#!/bin/bash
# Verifikasi UI peran korlas: nav, label peran, pemilih kelas, dan gerbang halaman.
AB=agent-browser
OUT=/tmp/ab-korlas.log
SHOTS="D:/REACT-DEV/pizza-snack-play/outputs/screenshots"
: > "$OUT"
mkdir -p "$SHOTS"

step() {
  echo "" >> "$OUT"
  echo "===== $* =====" >> "$OUT"
  timeout 90 "$AB" "$@" >> "$OUT" 2>&1
  echo "[exit=$?]" >> "$OUT"
}

# Ringkasan keadaan halaman: path, menu nav, teks header, isi pemilih kelas.
snap() {
  step eval "JSON.stringify({path:location.pathname,nav:[...document.querySelectorAll('nav a')].map(a=>a.textContent.trim()),header:(document.querySelector('header')?.innerText||'').replace(/\n/g,' | '),picker:(document.querySelector('header select')?[...document.querySelector('header select').options].map(o=>o.textContent):null),text:document.body.innerText.slice(0,260)})"
}

login() {
  step eval "localStorage.clear(); 'cleared'"
  step open "http://localhost:5173/login"
  step fill 'input[autocomplete="username"]' "$1"
  step fill 'input[autocomplete="current-password"]' "snack123"
  step click 'form button[type="submit"]'
  sleep 3
}

# ── 1. Korlas (budi, kelas 1A) ────────────────────────────────
echo "########## KORLAS ##########" >> "$OUT"
login budi
snap
step open "http://localhost:5173/jadwal"
sleep 2
snap
step screenshot "$SHOTS/01-korlas-jadwal.png"

# ── 2. Orang tua biasa (sari, anak di 1A) ─────────────────────
echo "########## PARENT ##########" >> "$OUT"
login sari
snap
step open "http://localhost:5173/jadwal"
sleep 2
snap
step screenshot "$SHOTS/02-parent-jadwal.png"

# ── 3. Admin (3 kelas) ────────────────────────────────────────
echo "########## ADMIN ##########" >> "$OUT"
login admin
snap
step open "http://localhost:5173/jadwal"
sleep 2
snap
step screenshot "$SHOTS/03-admin-jadwal.png"

# ── 4. Orang tua dua kelas (dewi: 1B + 2A) ────────────────────
echo "########## DEWI ##########" >> "$OUT"
login dewi
snap
step open "http://localhost:5173/minggu-ini"
sleep 2
snap
step screenshot "$SHOTS/04-dewi-minggu.png"

step close
echo "DONE" >> "$OUT"
