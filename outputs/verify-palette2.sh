#!/bin/bash
# Cek tampilan sisi orang tua + profil + minggu-ini dengan palet baru.

AB=agent-browser
OUT=/tmp/ab-palette2.log
SHOTS="D:/REACT-DEV/pizza-snack-play/outputs/screenshots/palette"
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
step fill 'input[autocomplete="username"]' "dewi"
step fill 'input[type="password"]' "snack123"
step click 'form button[type="submit"]'
step screenshot "$SHOTS/15-ortu-hari-ini.png"

step open "http://localhost:5173/minggu-ini"
step screenshot "$SHOTS/16-ortu-minggu-ini.png"

step open "http://localhost:5173/profil"
step screenshot "$SHOTS/17-ortu-profil.png"

# Cek error state di login memakai warna merah (semantik, tidak diubah palet)
step open "http://localhost:5173/login"
step eval "localStorage.clear(), 'cleared'"
step open "http://localhost:5173/login"
step fill 'input[autocomplete="username"]' "salah"
step fill 'input[type="password"]' "salahbanget"
step click 'form button[type="submit"]'
step screenshot "$SHOTS/18-login-error.png"
step eval "document.body.innerText.includes('Username atau password salah') || document.body.innerText.slice(0,300)"

step close
echo "DONE" >> "$OUT"
