import { Card, CardHeader } from "@/components/ui";
import { PetugasRow } from "@/components/PetugasRow";
import type { ClassPetugasDto } from "@/types/schedule";

/**
 * Petugas piket **semua kelas** pada satu tanggal — tampil untuk semua role.
 *
 * Menu snack sama untuk semua kelas pada tanggal yang sama, jadi yang
 * membedakan kelas 1, 2, 3 … hanya siapa yang piket hari itu. Daftar itu
 * sebelumnya hanya ada di halaman Pilih Jadwal, dan halaman itu `parentsOnly`
 * — justru admin, yang mengurus jadwal, tidak pernah melihatnya. Kartu ini
 * menaruhnya di halaman Hari Ini, yang dibuka semua peran.
 *
 * Datanya dari `/schedules/petugas`: server hanya mengirim baris `published`
 * yang bukan libur beserta nama petugasnya, jadi jadwal yang belum disetujui
 * sekolah tidak bocor lewat kartu ini — admin pun tidak melihat lebih banyak
 * daripada orang tua di sini.
 */
export function PetugasHariIni({
  classes,
  isLoading,
}: {
  /** Kelas yang punya jadwal terbit pada tanggal ini; kosong = belum ada. */
  classes: ClassPetugasDto[];
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader
        title="Petugas Piket"
        description="Siapa yang piket di setiap kelas hari ini"
      />

      {isLoading ? (
        <p className="px-5 py-4 text-sm text-slate-400">Memuat petugas…</p>
      ) : classes.length === 0 ? (
        <p className="px-5 py-4 text-sm text-slate-400">
          Belum ada jadwal yang diterbitkan untuk hari ini.
        </p>
      ) : (
        <ul className="space-y-1 px-5 py-3.5">
          {classes.map((row) => (
            <PetugasRow key={row.className} row={row} />
          ))}
        </ul>
      )}
    </Card>
  );
}
