import { useEffect } from "react";
import { GraduationCap } from "lucide-react";
import { Select } from "@/components/ui";
import { useActiveClass, setActiveClass } from "@/lib/active-class";
import { useClasses } from "@/hooks/useClasses";

/**
 * Pemilih kelas untuk user yang punya akses ke lebih dari satu kelas.
 *
 * Isinya ditentukan server (`/api/classes`): admin dan korlas melihat semua
 * kelas, orang tua hanya kelas anak-anaknya. Orang tua dengan anak di satu
 * kelas saja tidak melihat pemilih ini — kelasnya sudah ditentukan server.
 *
 * Bila user tidak punya kelas sama sekali, pemilih ini tidak dirender dan
 * `<ClassNotice />` yang memberi tahu apa yang perlu dilengkapi.
 */
export function ClassSwitcher() {
  const active = useActiveClass();
  const { classes, defaultClass, isLoading } = useClasses();

  useEffect(() => {
    // Daftar kelas belum turun — jangan sentuh pilihan yang tersimpan.
    if (isLoading) return;

    // Tidak ada kelas sama sekali: kosongkan pilihan lama agar halaman tidak
    // meminta kelas yang sudah bukan haknya (server menjawab 403).
    if (classes.length === 0) {
      setActiveClass(null);
      return;
    }

    // Samakan dengan kelas default server bila belum dipilih, atau bila
    // pilihan lama sudah tidak valid (mis. setelah berganti akun).
    if (active && classes.includes(active)) return;
    setActiveClass(defaultClass ?? classes[0]);
  }, [isLoading, classes, active, defaultClass]);

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
