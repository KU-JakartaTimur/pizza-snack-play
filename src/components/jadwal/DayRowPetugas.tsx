import { Select } from "@/components/ui";
import { TANPA_ORANG_TUA, NO_PETUGAS } from "./shared";
import type { StudentRosterDto } from "@/types/class";

interface DayRowPetugasProps {
  /** Kelas baris ini — dipakai hanya untuk teks bantuan, bukan penyaringan. */
  className: string | null;
  /** Siswa yang sedang ditunjuk; `null` bila belum ada. */
  studentId: number | null;
  /** Nama petugas tersimpan — dipakai saat id-nya tidak ada (data lama). */
  petugasName: string | null;
  /** Nama orang tua tersimpan — sama, dipakai saat id-nya tidak ada. */
  petugasParentName: string | null;
  /** Roster kelas ini; sudah berisi pasangan siswa → orang tua. */
  roster: StudentRosterDto[];
  /** Roster masih dimuat atau baris sedang tidak boleh diubah. */
  disabled: boolean;
  /** Baris jadwal ini `locked`/`published` — petugas masih boleh, lihat di bawah. */
  locked: boolean;
  /** `true` bila kelas ini memang belum punya siswa — pesannya dibedakan. */
  rosterEmpty: boolean;
  onSelectStudent: (studentId: number | null) => void;
}

/**
 * Dua dropdown berdampingan pada satu baris jadwal: **Petugas** dan
 * **Orang tua**-nya.
 *
 * Kolom Orang tua sengaja **tidak bisa dipilih**. Seorang siswa hanya punya
 * satu orang tua, jadi nama itu tidak pernah informasi bebas — ia diturunkan
 * dari siswa yang dipilih. Menyediakannya sebagai dropdown terpisah hanya
 * akan membuka pasangan siswa–orang tua yang tidak ada di database.
 *
 * Kasus jadwal lama (petugas terisi sebelum kolom id ada, atau hasil impor)
 * tetap ditampilkan apa adanya: dropdown-nya kosong karena tidak ada siswa
 * yang cocok, tetapi nama tersimpannya muncul sebagai opsi pertama sehingga
 * korlas tahu baris itu sudah ada isinya. Memilih siswa lain akan
 * menggantinya secara normal.
 *
 * **Baris yang sudah terkunci/dipublikasi pun tetap bisa diisi petugasnya** —
 * piket sering baru ditunjuk setelah jadwal terbit, dan server memang masih
 * menerima perubahan kolom ini sendirian. `locked` hanya dipakai untuk
 * memberi penanda halus, bukan untuk menonaktifkan; yang benar-benar
 * menonaktifkan hanyalah `disabled` (sedang menyimpan / roster belum siap).
 */
export function DayRowPetugas({
  className,
  studentId,
  petugasName,
  petugasParentName,
  roster,
  disabled,
  locked,
  rosterEmpty,
  onSelectStudent,
}: DayRowPetugasProps) {
  const selected = roster.find((student) => student.studentId === studentId) ?? null;

  /**
   * Nama siswa yang tersimpan tidak ketemu di roster: bisa karena datanya
   * lama, atau karena siswanya sudah dihapus/dipindah kelas. Ditandai agar
   * korlas melihat barisnya tidak lagi terhubung ke siswa mana pun.
   */
  const orphanedName = !selected && petugasName ? petugasName : null;

  return (
    <>
      <Select
        className="w-36 shrink-0"
        value={selected ? String(selected.studentId) : NO_PETUGAS}
        disabled={disabled}
        title={
          rosterEmpty
            ? `Kelas ${className ?? ""} belum punya siswa`.trim()
            : locked
              ? `Petugas kelas ${className ?? ""} — jadwal sudah terbit, petugas masih bisa diubah`.trim()
              : `Petugas kelas ${className ?? ""}`.trim()
        }
        onChange={(event) => {
          const value = event.target.value;
          onSelectStudent(value === NO_PETUGAS ? null : Number(value));
        }}
      >
        <option value={NO_PETUGAS}>— belum ada petugas —</option>

        {/*
          Siswa tersimpan yang tidak ada di roster tetap ditawarkan sebagai
          opsi, kalau tidak `<Select>` akan menampilkan pilihan pertama dan
          seolah-olah petugasnya sudah berubah padahal belum disimpan.
        */}
        {orphanedName && <option value={NO_PETUGAS}>{orphanedName}</option>}

        {roster.map((student) => (
          <option key={student.studentId} value={student.studentId}>
            {student.studentName}
          </option>
        ))}
      </Select>

      {/*
        `disabled` dipakai sebagai penanda visual read-only — nilainya tidak
        pernah dikirim ke server, jadi tidak ada risiko terkirim walau `Select`
        masih merender `value`-nya.
      */}
      <Select
        className="w-36 shrink-0"
        value=""
        disabled
        title="Nama orang tua mengikuti siswa yang dipilih sebagai petugas"
      >
        <option value="">
          {selected
            ? selected.parentName || TANPA_ORANG_TUA
            : (petugasParentName ?? "—")
          }
        </option>
      </Select>
    </>
  );
}
