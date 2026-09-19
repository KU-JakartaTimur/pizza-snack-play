#!/bin/bash
# Cari kebocoran: apakah orang tua bisa mengelola jadwal menu?

AB=agent-browser
OUT=/tmp/ab-jadwal-leak.log
SHOTS="D:/REACT-DEV/pizza-snack-play/outputs/screenshots/leak"
mkdir -p "$SHOTS"
: > "$OUT"

step() {
  echo "" >> "$OUT"
  echo "===== $* =====" >> "$OUT"
  timeout 90 "$AB" "$@" >> "$OUT" 2>&1
  echo "[exit=$?]" >> "$OUT"
}

# ── Login sebagai orang tua (sari) ──
step open "http://localhost:5173/login"
step eval "localStorage.clear(), 'cleared'"
step open "http://localhost:5173/login"
step fill 'input[autocomplete="username"]' "sari"
step fill 'input[type="password"]' "snack123"
step click 'form button[type="submit"]'
step eval "location.pathname"

# ── 1. Navigasi: apakah 'Kelola Jadwal' muncul untuk orang tua? ──
step eval "JSON.stringify({nav: [...document.querySelectorAll('nav a')].map(a=>a.textContent.trim())})"

# ── 2. Akses langsung ke /jadwal ──
step open "http://localhost:5173/jadwal"
step eval "JSON.stringify({teks: document.body.innerText.slice(0, 400), adaSelect: document.querySelectorAll('select').length, adaTombolHariLibur: document.body.innerText.includes('Hari libur'), adaSalinMinggu: document.body.innerText.includes('Salin minggu')})"
step screenshot "$SHOTS/01-ortu-jadwal.png"

# ── 3. /kategori & /orang-tua sebagai pembanding ──
step open "http://localhost:5173/kategori"
step eval "document.body.innerText.slice(0, 200)"
step open "http://localhost:5173/orang-tua"
step eval "document.body.innerText.slice(0, 200)"

# ── 4. Uji tulis langsung ke API jadwal dengan token orang tua ──
step eval "fetch('/api/schedules/month?year=2026&month=9', {headers:{Authorization:'Bearer '+localStorage.psp_token}}).then(r=>r.json()).then(j=>{const d=j.data?.weeks?.[0]?.days?.[0]; return JSON.stringify({hari: d?.dayName, scheduleId: d?.scheduleId, menuId: d?.menu?.id ?? null});})"
step eval "fetch('/api/schedules', {method:'POST', headers:{'Content-Type':'application/json', Authorization:'Bearer '+localStorage.psp_token}, body: JSON.stringify({date:'2026-09-25', menuId:1})}).then(r=>JSON.stringify({status:r.status, body:'cek'})).then(x=>x)"
step eval "fetch('/api/holidays', {method:'POST', headers:{'Content-Type':'application/json', Authorization:'Bearer '+localStorage.psp_token}, body: JSON.stringify({date:'2026-12-25', name:'Uji'})}).then(r=>r.status)"

step close
echo "DONE" >> "$OUT"
