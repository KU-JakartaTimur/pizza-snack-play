import { useId, useState } from "react";
import { ChevronDown, HandHeart, User, Users } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ClassPetugasDto } from "@/types/schedule";

/**
 * Petugas piket kelas lain pada tanggal yang sama.
 *
 * Menu snack bersifat sekolah-wide: satu menu dipakai semua kelas pada
 * tanggal yang sama, sehingga yang membedakan kelas 1, 2, 3 … hanya siapa
 * yang piket hari itu. Orang tua perlu tahu itu — mis. untuk menitipkan
 * snack ke kelas lain — jadi tiap kartu tanggal membuka daftarnya.
 *
 * **Tertutup secara bawaan**, karena kartunya disusun dalam grid: menampilkan
 * lima kelas sekaligus di setiap tanggal akan membuat satu layar hanya memuat
 * dua tanggal. Jawabannya tetap satu klik jauhnya, dan jumlah kelas yang
 * sudah terisi ikut terlihat di barisnya supaya tidak perlu dibuka hanya
 * untuk tahu.
 */
export function PetugasKelasLain({
  classes,
  ownClass,
}: {
  /** Semua kelas yang punya jadwal terbit pada tanggal ini. */
  classes: ClassPetugasDto[];
  /** Kelas yang sedang dilihat — tidak diulang, sudah tampil di badan kartu. */
  ownClass: string | null;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  const others = classes.filter((row) => row.className !== ownClass);
  if (others.length === 0) return null;

  const assigned = others.filter(
    (row) => row.petugasName || row.petugasParentName,
  ).length;

  return (
    <div className="mt-3 border-t border-slate-200 pt-2.5">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center gap-2 text-left text-xs font-medium text-slate-500 transition-colors hover:text-slate-900"
      >
        <Users className="h-3.5 w-3.5 shrink-0" />
        {/*
          Jarak sebelum penghitung ditulis sebagai `{" "}` — bukan `ml-1` —
          karena JSX membuang baris baru yang bersebelahan dengan tag. Dengan
          margin, teksnya terlihat rapi tetapi terbaca "kelain(2 dari 5" bagi
          pembaca layar dan saat disalin.
        */}
        <span className="flex-1">
          Petugas kelas lain{" "}
          {/*
            `whitespace-nowrap` supaya penghitungnya utuh saat kartu sempit:
            tanpa itu kalimatnya terpotong di tengah, "… (2 dari 5" lalu
            "terisi)" di baris berikutnya.
          */}
          <span className="whitespace-nowrap font-normal text-slate-400">
            ({assigned} dari {others.length} terisi)
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <ul id={panelId} className="mt-2 space-y-1">
          {others.map((row) => (
            <PetugasKelasRow key={row.className} row={row} />
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Satu baris kelas.
 *
 * Ikonnya mengikuti makna yang sama dengan badan kartu: hati untuk tanggal
 * yang **diambil orang tua**, orang untuk yang **ditunjuk korlas**.
 */
function PetugasKelasRow({ row }: { row: ClassPetugasDto }) {
  const hasPetugas = Boolean(row.petugasName || row.petugasParentName);

  return (
    <li className="flex items-start gap-2 text-xs">
      <span className="w-14 shrink-0 pt-px font-medium text-slate-500">
        Kelas {row.className}
      </span>

      {hasPetugas ? (
        <>
          {row.claimed ? (
            <HandHeart className="mt-px h-3.5 w-3.5 shrink-0 text-accent-600" />
          ) : (
            <User className="mt-px h-3.5 w-3.5 shrink-0 text-slate-400" />
          )}
          <span className="min-w-0">
            {row.petugasName && (
              <span className="font-medium text-slate-800">
                {row.petugasName}
              </span>
            )}
            {row.petugasName && row.petugasParentName && (
              <span className="text-slate-400"> · </span>
            )}
            {row.petugasParentName && (
              <span className="text-slate-500">{row.petugasParentName}</span>
            )}
          </span>
        </>
      ) : (
        <span className="text-slate-400">Belum ada petugas</span>
      )}
    </li>
  );
}
