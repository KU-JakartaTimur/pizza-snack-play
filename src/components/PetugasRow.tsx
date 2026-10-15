import { HandHeart, User } from "lucide-react";
import type { ClassPetugasDto } from "@/types/schedule";

/**
 * Satu kelas pada daftar petugas piket.
 *
 * Dipakai dua tempat: panel "Petugas kelas lain" di halaman Pilih Jadwal dan
 * kartu "Petugas Piket" di halaman Hari Ini. Barisnya tinggal di sini supaya
 * keduanya tidak pernah berbeda arti — ikonnya sama di mana pun:
 * hati untuk tanggal yang **diambil orang tua** (klaim), orang untuk yang
 * **ditunjuk korlas**.
 */
export function PetugasRow({ row }: { row: ClassPetugasDto }) {
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
