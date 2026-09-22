import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

/**
 * Referensi tetap untuk kasus "belum ada data" — mencegah array baru dibuat
 * setiap render, yang akan membuat `useEffect` pemanggil berjalan terus.
 */
const EMPTY_CLASSES: string[] = [];

/**
 * Kelas yang boleh diakses user — sumber tunggal untuk query `["classes"]`.
 *
 * Dipakai pemilih kelas di header dan notifikasi "kelas belum ada". Keduanya
 * memakai kunci cache yang sama, jadi memanggil hook ini di beberapa komponen
 * tidak menambah permintaan ke server.
 */
export function useClasses() {
  const query = useQuery({
    queryKey: ["classes"],
    queryFn: api.classes.list,
    // Daftar kelas jarang berubah; hindari permintaan berulang antar halaman.
    staleTime: 5 * 60 * 1000,
  });

  return {
    classes: query.data?.classes ?? EMPTY_CLASSES,
    /**
     * Kelas pilihan server bila klien tidak menyebut kelas: kelas yang
     * dikoordinasi (korlas) atau kelas anak pertama (orang tua).
     */
    defaultClass: query.data?.default ?? null,
    /** `true` selama daftar kelas belum pernah berhasil diambil. */
    isLoading: query.isPending,
  };
}

/**
 * `true` bila user tidak punya satu kelas pun untuk dilihat — orang tua yang
 * belum mendaftarkan anaknya, atau sistem yang memang belum punya kelas.
 */
export function useHasNoClass(): boolean {
  const { classes, isLoading } = useClasses();
  return !isLoading && classes.length === 0;
}
