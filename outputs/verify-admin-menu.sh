#!/bin/bash
# Verifikasi sisi admin: kontrol CRUD tampil, kolom Anak menampilkan semua anak,
# dan formulir bisa menambah >1 anak.

AB=agent-browser
OUT=/tmp/ab-admin.log
SHOTS="D:/REACT-DEV/pizza-snack-play/outputs/screenshots"
mkdir -p "$SHOTS"
: > "$OUT"

step() {
  echo "" >> "$OUT"
  echo "===== $* =====" >> "$OUT"
  timeout 90 "$AB" "$@" >> "$OUT" 2>&1
  echo "[exit=$?]" >> "$OUT"
}

step open "http://localhost:5173/login"
step eval "localStorage.clear(), 'cleared'"
step open "http://localhost:5173/login"
step fill 'input[autocomplete="username"]' "admin"
step fill 'input[type="password"]' "snack123"
step click 'form button[type="submit"]'
step eval "location.pathname"

# ── 1. /menu sebagai admin: harus ada kontrol CRUD ──
step open "http://localhost:5173/menu"
step eval "JSON.stringify({adaMenuBaru: document.body.innerText.includes('Menu baru'), jumlahEdit: [...document.querySelectorAll('button')].filter(b=>b.textContent.trim()==='Edit').length, jumlahHapus: [...document.querySelectorAll('button')].filter(b=>b.textContent.trim()==='Hapus').length})"
step screenshot "$SHOTS/04-admin-menu.png"

# ── 2. /kategori sebagai admin ──
step open "http://localhost:5173/kategori"
step eval "JSON.stringify({tombol: [...document.querySelectorAll('button')].map(b=>b.textContent.trim()).filter(Boolean)})"

# ── 3. /orang-tua: kolom Anak menampilkan semua anak ──
step open "http://localhost:5173/orang-tua"
step eval "document.body.innerText.slice(0, 1200)"
step screenshot "$SHOTS/05-admin-orang-tua.png"

# ── 4. Buka modal tambah, pastikan ada bagian Anak + tombol Tambah anak ──
step eval "[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Tambah akun')?.click(), 'clicked'"
step eval "document.body.innerText.slice(0, 900)"
step eval "JSON.stringify({adaBagianAnak: document.body.innerText.includes('boleh lebih dari satu'), adaTombolTambahAnak: [...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Tambah anak')})"
step screenshot "$SHOTS/06-admin-modal-anak.png"

# ── 5. Klik 'Tambah anak' → baris anak bertambah ──
step eval "JSON.stringify({sebelum: document.querySelectorAll('input[placeholder*=\"Nama anak\" i], input[name*=\"student\" i]').length})"
step eval "[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Tambah anak')?.click(), 'clicked'"
step eval "JSON.stringify({sesudah: document.querySelectorAll('input[placeholder*=\"Nama anak\" i], input[name*=\"student\" i]').length})"
step screenshot "$SHOTS/07-admin-modal-2-anak.png"

step close
echo "DONE" >> "$OUT"
