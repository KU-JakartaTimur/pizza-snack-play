import { useSyncExternalStore } from "react";

/**
 * Kelas yang sedang dilihat.
 *
 * Jadwal bersifat per kelas, sehingga user yang punya akses ke lebih dari
 * satu kelas (admin, atau orang tua dengan anak di kelas berbeda) perlu
 * memilih kelas mana yang ditampilkan.
 *
 * Disimpan di `localStorage` dan dibagikan lewat store kecil di bawah ini
 * agar semua halaman ikut berubah tanpa perlu prop drilling. Pilihan yang
 * tidak lagi valid (mis. setelah berganti akun) akan dikoreksi otomatis
 * oleh `<ClassSwitcher />`.
 */
const STORAGE_KEY = "psp_class";

function readStored(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

let current: string | null = readStored();
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

/** Ubah kelas aktif; `null` mengosongkan pilihan. */
export function setActiveClass(className: string | null) {
  if (className === current) return;

  current = className;

  if (typeof localStorage !== "undefined") {
    if (className) localStorage.setItem(STORAGE_KEY, className);
    else localStorage.removeItem(STORAGE_KEY);
  }

  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return current;
}

/** Kelas aktif saat ini, reaktif terhadap perubahan. */
export function useActiveClass(): string | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
