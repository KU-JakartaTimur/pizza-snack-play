#!/bin/bash
# Verifikasi khusus peran korlas (budi, kelas 1A).
AB=agent-browser
OUT=/tmp/ab-korlas2.log
SHOTS="D:/REACT-DEV/pizza-snack-play/outputs/screenshots"
: > "$OUT"
mkdir -p "$SHOTS"

step() {
  echo "" >> "$OUT"
  echo "===== $* =====" >> "$OUT"
  timeout 90 "$AB" "$@" >> "$OUT" 2>&1
  echo "[exit=$?]" >> "$OUT"
}

snap() {
  step eval "JSON.stringify({path:location.pathname,nav:[...document.querySelectorAll('nav a')].map(a=>a.textContent.trim()),header:(document.querySelector('header')?.innerText||'').replace(/\n/g,' | '),picker:(document.querySelector('header select')?[...document.querySelector('header select').options].map(o=>o.textContent):null),holidayBtn:[...document.querySelectorAll('button')].some(b=>b.textContent.includes('Hari libur')),copyBtn:[...document.querySelectorAll('button')].some(b=>b.textContent.includes('Salin minggu')),text:document.body.innerText.slice(0,300)})"
}

# Halaman dibuka lebih dulu agar origin siap, baru localStorage dibersihkan.
step open "http://localhost:5173/login"
sleep 3
step eval "localStorage.clear(); 'cleared'"
step open "http://localhost:5173/login"
sleep 3
step fill 'input[autocomplete="username"]' "budi"
step fill 'input[autocomplete="current-password"]' "snack123"
step click 'form button[type="submit"]'
sleep 5
echo "########## KORLAS — beranda ##########" >> "$OUT"
snap

echo "########## KORLAS — /jadwal ##########" >> "$OUT"
step open "http://localhost:5173/jadwal"
sleep 3
snap
step screenshot "$SHOTS/01-korlas-jadwal.png"

echo "########## KORLAS — /kategori ##########" >> "$OUT"
step open "http://localhost:5173/kategori"
sleep 3
snap

echo "########## KORLAS — /orang-tua (harus ditolak) ##########" >> "$OUT"
step open "http://localhost:5173/orang-tua"
sleep 3
snap

echo "########## KORLAS — /dashboard (harus ditolak) ##########" >> "$OUT"
step open "http://localhost:5173/dashboard"
sleep 3
snap

step close
echo "DONE" >> "$OUT"
