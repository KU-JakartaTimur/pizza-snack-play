#!/bin/bash
# Verifikasi perbaikan lebar kontrol form + tampilan akhir palet.

AB=agent-browser
OUT=/tmp/ab-width.log
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
step fill 'input[autocomplete="username"]' "admin"
step fill 'input[type="password"]' "snack123"
step click 'form button[type="submit"]'

# ── 1. Modal orang tua: input nama anak + kelas harus muat di dalam modal ──
step open "http://localhost:5173/orang-tua"
step eval "[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Akun baru')?.click(), 'clicked'"
step eval "[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Tambah anak')?.click(), 'clicked'"
step eval "(() => {
  const modal = document.querySelector('.rounded-2xl.bg-white.shadow-xl');
  const box = modal.getBoundingClientRect();
  const rows = [...modal.querySelectorAll('.flex.items-center.gap-2')];
  const controls = rows.flatMap(r => [...r.querySelectorAll('input, select, textarea, button')]);
  const over = controls.filter(c => {
    const b = c.getBoundingClientRect();
    return b.right > box.right + 0.5 || b.left < box.left - 0.5;
  });
  return JSON.stringify({
    modalLebar: Math.round(box.width),
    jumlahKontrol: controls.length,
    meluberKeluarModal: over.length,
    lebarKontrol: controls.map(c => Math.round(c.getBoundingClientRect().width)),
  });
})()"
step screenshot "$SHOTS/11-modal-fixed.png"

# ── 2. Modal menu: select jenis komponen (w-40) harus 160px, bukan penuh ──
step open "http://localhost:5173/menu"
step eval "[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Menu baru')?.click(), 'clicked'"
step eval "(() => {
  const modal = document.querySelector('.rounded-2xl.bg-white.shadow-xl');
  const box = modal.getBoundingClientRect();
  const selects = [...modal.querySelectorAll('select')];
  const inputs = [...modal.querySelectorAll('input')];
  const over = [...modal.querySelectorAll('input, select, textarea, button')].filter(c => {
    const b = c.getBoundingClientRect();
    return b.right > box.right + 0.5 || b.left < box.left - 0.5;
  });
  return JSON.stringify({
    modalLebar: Math.round(box.width),
    lebarSelect: selects.map(s => Math.round(s.getBoundingClientRect().width)),
    lebarInput: inputs.map(i => Math.round(i.getBoundingClientRect().width)),
    meluberKeluarModal: over.length,
  });
})()"
step screenshot "$SHOTS/12-menu-modal-fixed.png"

# ── 3. Kelola Jadwal: select menu (min-w-0 flex-1) + catatan (w-48) ──
step open "http://localhost:5173/jadwal"
step eval "(() => {
  const card = document.querySelector('.card');
  const box = card.getBoundingClientRect();
  const over = [...card.querySelectorAll('input, select, textarea')].filter(c => {
    const b = c.getBoundingClientRect();
    return b.right > box.right + 0.5;
  });
  return JSON.stringify({lebarKartu: Math.round(box.width), meluber: over.length});
})()"
step screenshot "$SHOTS/13-jadwal-fixed.png"

# ── 4. Menu: chip komponen limau ──
step open "http://localhost:5173/menu"
step eval "JSON.stringify({chipLimau: document.querySelectorAll('.bg-accent-50.border-accent-200').length, badgeKategoriUngu: document.querySelectorAll('.bg-brand-50.border-brand-200').length})"
step screenshot "$SHOTS/14-menu-chips.png"

step close
echo "DONE" >> "$OUT"
