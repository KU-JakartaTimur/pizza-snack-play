#!/bin/bash
# Verifikasi: orang tua tidak melihat kontrol CRUD di /menu, dan multi-anak tampil.

AB=agent-browser
OUT=/tmp/ab-verify.log
SHOTS="D:/REACT-DEV/pizza-snack-play/outputs/screenshots"
mkdir -p "$SHOTS"
: > "$OUT"

step() {
  echo "" >> "$OUT"
  echo "===== $* =====" >> "$OUT"
  timeout 90 "$AB" "$@" >> "$OUT" 2>&1
  echo "[exit=$?]" >> "$OUT"
}

# ── 1. Login sebagai orang tua (dewi — punya 2 anak) ──
step open "http://localhost:5173/login"
step eval "localStorage.clear(), 'cleared'"
step open "http://localhost:5173/login"
step fill 'input[autocomplete="username"]' "dewi"
step fill 'input[type="password"]' "snack123"
step click 'form button[type="submit"]'
step eval "location.pathname"

# ── 2. Beranda: kartu Data Siswa harus menampilkan 2 anak ──
step eval "document.body.innerText.slice(0, 1200)"
step screenshot "$SHOTS/01-parent-hari-ini.png"

# ── 3. Halaman /menu sebagai orang tua ──
step open "http://localhost:5173/menu"
step eval "document.body.innerText.slice(0, 1500)"
step screenshot "$SHOTS/02-parent-menu.png"

# ── 4. Assertion: tidak ada tombol CRUD di /menu ──
step eval "JSON.stringify({tombol: [...document.querySelectorAll('button')].map(b=>b.textContent.trim()).filter(Boolean), adaMenuBaru: document.body.innerText.includes('Menu baru'), adaEdit: [...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Edit' || b.textContent.trim()==='Hapus' || b.textContent.trim()==='Ubah')})"

# ── 5. Profil: daftar anak ──
step open "http://localhost:5173/profil"
step eval "document.body.innerText.slice(0, 1200)"
step screenshot "$SHOTS/03-parent-profil.png"

# ── 6. Kategori juga harus tanpa tombol CRUD ──
step open "http://localhost:5173/kategori"
step eval "JSON.stringify({adaTambah: document.body.innerText.includes('Kategori baru') || document.body.innerText.includes('Tambah'), tombol: [...document.querySelectorAll('button')].map(b=>b.textContent.trim()).filter(Boolean)})"

step close
echo "DONE" >> "$OUT"
