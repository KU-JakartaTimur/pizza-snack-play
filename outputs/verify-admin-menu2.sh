#!/bin/bash
# Re-cek dengan label yang benar: tombol ikon memakai atribut title.

AB=agent-browser
OUT=/tmp/ab-admin2.log
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

# ── /menu admin: hitung tombol ber-title Ubah/Hapus ──
step open "http://localhost:5173/menu"
step eval "JSON.stringify({adaMenuBaru: document.body.innerText.includes('Menu baru'), ubah: document.querySelectorAll('button[title=\"Ubah\"]').length, hapus: document.querySelectorAll('button[title=\"Hapus\"]').length})"

# ── /orang-tua: buka modal lewat tombol 'Akun baru' ──
step open "http://localhost:5173/orang-tua"
step eval "[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Akun baru')?.click(), 'clicked'"
step eval "JSON.stringify({adaBagianAnak: document.body.innerText.includes('boleh lebih dari satu'), adaTombolTambahAnak: [...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Tambah anak'), jumlahBarisAnak: document.querySelectorAll('button[title=\"Hapus anak\"]').length, ringkas: document.body.innerText.slice(400, 1100)})"
step screenshot "$SHOTS/06-admin-modal-anak.png"

# ── Klik 'Tambah anak' → baris bertambah ──
step eval "[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Tambah anak')?.click(), 'clicked'"
step eval "JSON.stringify({jumlahBarisAnak: document.querySelectorAll('button[title=\"Hapus anak\"]').length})"
step screenshot "$SHOTS/07-admin-modal-2-anak.png"

step close
echo "DONE" >> "$OUT"
