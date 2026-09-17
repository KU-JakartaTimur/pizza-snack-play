import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { GraduationCap } from "lucide-react";
import { Select } from "@/components/ui";
import { setActiveClass, useActiveClass } from "@/lib/active-class";
import { api } from "@/lib/api";

/**
 * Referensi tetap untuk kasus "belum ada data" — mencegah array baru dibuat
 * setiap render, yang akan membuat `useEffect` di bawah berjalan terus.
 */
const EMPTY_CLASSES: string[] = [];

/**
 * Pemilih kelas untuk user yang punya akses ke lebih dari satu kelas.
 *
 * Korlas (satu kelas) dan orang tua dengan anak di satu kelas saja tidak
 * melihat pemilih ini — kelasnya sudah ditentukan server.
 */
export function ClassSwitcher() {
  const active = useActiveClass();

  const classesQuery = useQuery({
    queryKey: ["classes"],
    queryFn: api.classes.list,
    // Daftar kelas jarang berubah; hindari permintaan berulang antar halaman.
    staleTime: 5 * 60 * 1000,
  });

  const classes = classesQuery.data?.classes ?? EMPTY_CLASSES;
  const fallback = classesQuery.data?.default ?? null;

  // Samakan pilihan dengan kelas default server bila belum dipilih, atau
  // bila pilihan lama sudah tidak valid (mis. setelah berganti akun).
  useEffect(() => {
    if (classes.length === 0) return;
    if (active && classes.includes(active)) return;
    setActiveClass(fallback ?? classes[0]);
  }, [classes, active, fallback]);

  if (classes.length <= 1) return null;

  return (
    <label className="flex items-center gap-1.5">
      <GraduationCap className="h-4 w-4 shrink-0 text-slate-400" />
      <span className="sr-only">Kelas yang ditampilkan</span>
      <Select
        className="w-28"
        value={active ?? ""}
        onChange={(event) => setActiveClass(event.target.value)}
      >
        {classes.map((item) => (
          <option key={item} value={item}>
            Kelas {item}
          </option>
        ))}
      </Select>
    </label>
  );
}
