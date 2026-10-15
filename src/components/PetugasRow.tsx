import { HandHeart, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/cn";
import { whatsAppLink } from "@/lib/whatsapp";
import type { ClassPetugasDto } from "@/types/schedule";

/**
 * Satu kelas pada daftar petugas piket.
 *
 * Dipakai dua tempat: panel "Petugas kelas lain" di halaman Pilih Jadwal dan
 * kartu "Petugas Piket" di halaman Hari Ini. Barisnya tinggal di sini supaya
 * keduanya tidak pernah berbeda arti — ikonnya sama di mana pun:
 * hati untuk tanggal yang **diambil orang tua** (klaim), orang untuk yang
 * **ditunjuk korlas**.
 *
 * Tiap baris yang sudah punya petugas ikut mencetak nomor WhatsApp walinya,
 * karena alasan orang membuka daftar ini justru untuk menghubungi petugasnya
 * (mis. menitipkan snack ke kelas lain). Nomor yang belum ada **tetap**
 * menyisakan baris keterangan, bukan dihilangkan: baris itulah yang memberi
 * tahu wali bahwa nomornya masih bisa dilengkapi dari menu Profil.
 *
 * Susunannya tiga bagian yang berdiri sendiri — label kelas, nama, dan
 * kontak — supaya menambah bagian keempat (mis. catatan piket) tidak menuntut
 * menulis ulang seluruh baris.
 */
export function PetugasRow({ row }: { row: ClassPetugasDto }) {
  return (
    <li className="flex items-start gap-2 text-xs">
      <span className="w-14 shrink-0 pt-px font-medium text-slate-500">
        Kelas {row.className}
      </span>

      {hasPetugas(row) ? (
        <div className="min-w-0 flex-1">
          <p className="flex items-start gap-1.5">
            <PetugasSourceIcon claimed={row.claimed} />
            <PetugasNames row={row} />
          </p>
          <PetugasPhone phone={row.petugasPhone} />
        </div>
      ) : (
        <span className="text-slate-400">Belum ada petugas</span>
      )}
    </li>
  );
}

/**
 * Ada petugas atau tidak.
 *
 * Nama orang tua ikut dihitung, bukan hanya nama siswa: jadwal lama bisa
 * punya petugas tanpa siswa yang tertaut, dan baris yang menyebut walinya
 * masih lebih berguna daripada "Belum ada petugas" yang keliru.
 */
function hasPetugas(row: ClassPetugasDto): boolean {
  return Boolean(row.petugasName || row.petugasParentName);
}

/** Asal petugasnya — diambil orang tua (klaim) atau ditunjuk korlas. */
function PetugasSourceIcon({ claimed }: { claimed: boolean }) {
  const Icon = claimed ? HandHeart : User;

  return (
    <Icon
      className={cn(
        "mt-px h-3.5 w-3.5 shrink-0",
        claimed ? "text-accent-600" : "text-slate-400",
      )}
    />
  );
}

/**
 * Nama siswa dan walinya, dipisah titik tengah.
 *
 * Pemisahnya hanya muncul bila keduanya ada — kalau salah satunya kosong,
 * pemisah menggantung di ujung baris dan terbaca seperti teks yang terpotong.
 */
function PetugasNames({ row }: { row: ClassPetugasDto }) {
  const bothNames = Boolean(row.petugasName && row.petugasParentName);

  return (
    <span className="min-w-0">
      {row.petugasName && (
        <span className="font-medium text-slate-800">{row.petugasName}</span>
      )}
      {bothNames && <span className="text-slate-400"> · </span>}
      {row.petugasParentName && (
        <span className="text-slate-500">{row.petugasParentName}</span>
      )}
    </span>
  );
}

/**
 * Kontak wali petugas pada baris keduanya.
 *
 * Yang ditampilkan sebagai teks tautan adalah nomor **apa adanya** seperti
 * yang tersimpan, bukan hasil normalisasi: wali harus mengenali nomornya
 * sendiri, dan bentuk `wa.me` (`62812…`) tampak seperti salah ketik baginya.
 * Normalisasinya cukup dipakai untuk menyusun `href`.
 *
 * `pl-5` menyelaraskan baris ini dengan namanya di atas — lebar ikon (3.5)
 * ditambah jaraknya (`gap-1.5`).
 */
function PetugasPhone({ phone }: { phone: string | null }) {
  const link = whatsAppLink(phone);

  if (!link) {
    return (
      <p className="mt-0.5 pl-5 text-[11px] text-slate-400">
        Nomor handphone belum di update
      </p>
    );
  }

  return (
    <p className="mt-0.5 pl-5">
      <a
        href={link}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-[11px] text-brand-700 underline decoration-brand-300 underline-offset-2 hover:text-brand-800"
      >
        <MessageCircle className="h-3 w-3 shrink-0" />
        {phone}
      </a>
    </p>
  );
}
