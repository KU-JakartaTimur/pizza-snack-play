import type { Db } from "../../database/db";
import type { JwtPayload, StudentProfile } from "../../types/auth";
import type { ClassListDto } from "../../types/class";
import { classRepository } from "../classes/repository";
import { parentRepository } from "../parents/repository";

export type ProfileError =
  | "not_parent"
  | "not_found"
  | "last_student"
  | "invalid_name"
  | "invalid_class";

/** Batas panjang teks yang diterima dari orang tua. */
export const MAX_NAME_LENGTH = 80;
export const MAX_CLASS_LENGTH = 32;

/** Data anak yang sudah divalidasi controller. */
export interface StudentForm {
  name?: string;
  className?: string | null;
}

/** Rapikan spasi berlebih di tengah & tepi teks. */
function tidy(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/**
 * Layanan mandiri orang tua: mengelola **daftar anaknya sendiri**.
 *
 * Berbeda dari `/api/parents` (khusus admin), di sini `parentId` tidak pernah
 * berasal dari request — selalu diambil dari token, sehingga satu orang tua
 * mustahil menyentuh data anak milik orang tua lain.
 */
class ProfileService {
  /** `parents.id` milik user yang sedang login; `null` bila bukan orang tua. */
  private async ownParentId(db: Db, userId: number): Promise<number | null> {
    const row = await parentRepository.findByUserId(db, userId);
    return row?.parent.id ?? null;
  }

  /**
   * Anak aktif milik user ini. Anak nonaktif disembunyikan agar daftarnya
   * sama dengan yang ditampilkan `/auth/me`.
   */
  async listStudents(db: Db, user: JwtPayload): Promise<StudentProfile[] | ProfileError> {
    const parentId = await this.ownParentId(db, user.sub);
    if (parentId === null) return "not_parent";

    const rows = await parentRepository.findStudentsByParentId(db, parentId);
    return rows
      .filter((student) => student.isActive === 1)
      .map((student) => ({
        id: student.id,
        name: student.name,
        className: student.className,
      }));
  }

  /** Tambah satu anak untuk user ini. */
  async addStudent(
    db: Db,
    user: JwtPayload,
    input: StudentForm,
  ): Promise<StudentProfile | ProfileError> {
    const parentId = await this.ownParentId(db, user.sub);
    if (parentId === null) return "not_parent";

    const name = input.name === undefined ? "" : tidy(input.name);
    if (!name) return "invalid_name";
    if (name.length > MAX_NAME_LENGTH) return "invalid_name";

    const className = this.normalizeClass(input.className);
    if (className === undefined) return "invalid_class";

    const created = await parentRepository.insertStudent(db, {
      parentId,
      name,
      className,
    });

    return { id: created.id, name: created.name, className: created.className };
  }

  /** Ubah anak milik user ini; `id` anak lain diperlakukan sebagai tidak ada. */
  async updateStudent(
    db: Db,
    user: JwtPayload,
    studentId: number,
    input: StudentForm,
  ): Promise<StudentProfile | ProfileError> {
    const parentId = await this.ownParentId(db, user.sub);
    if (parentId === null) return "not_parent";

    const rows = await parentRepository.findStudentsByParentId(db, parentId);
    const target = rows.find((student) => student.id === studentId);
    if (!target) return "not_found";

    const patch: { name?: string; className?: string | null } = {};

    if (input.name !== undefined) {
      const name = tidy(input.name);
      if (!name || name.length > MAX_NAME_LENGTH) return "invalid_name";
      patch.name = name;
    }

    if (input.className !== undefined) {
      const className = this.normalizeClass(input.className);
      if (className === undefined) return "invalid_class";
      patch.className = className;
    }

    // Body tanpa field yang dikenal tidak dianggap error — cukup kembalikan
    // data yang ada agar UI tetap punya gambaran terbaru.
    if (Object.keys(patch).length > 0) {
      await parentRepository.updateStudent(db, studentId, patch);
    }

    return {
      id: target.id,
      name: patch.name ?? target.name,
      className: patch.className !== undefined ? patch.className : target.className,
    };
  }

  /**
   * Hapus anak milik user ini.
   *
   * Anak terakhir tidak boleh dihapus: profil orang tua tanpa anak tidak punya
   * kelas sama sekali, sehingga akunnya jadi tidak berguna (aturan yang sama
   * dipakai modul admin — lihat `ParentError: "no_students"`).
   */
  async removeStudent(
    db: Db,
    user: JwtPayload,
    studentId: number,
  ): Promise<true | ProfileError> {
    const parentId = await this.ownParentId(db, user.sub);
    if (parentId === null) return "not_parent";

    const rows = await parentRepository.findStudentsByParentId(db, parentId);
    const active = rows.filter((student) => student.isActive === 1);
    if (!active.some((student) => student.id === studentId)) return "not_found";
    if (active.length <= 1) return "last_student";

    await parentRepository.deleteStudent(db, studentId);
    return true;
  }

  /**
   * Semua kelas yang dikenal sistem — dipakai sebagai saran pada kolom kelas
   * saat orang tua menambah anak. Kelas sengaja berupa teks bebas (tidak ada
   * tabel `classes`), jadi daftar ini hanya saran, bukan pembatas.
   */
  async classOptions(db: Db): Promise<ClassListDto> {
    const classes = await classRepository.listAll(db);
    return { classes, default: classes[0] ?? null };
  }

  /**
   * Normalisasi nama kelas. Mengembalikan `null` untuk kelas kosong dan
   * `undefined` bila teksnya tidak sah (terlalu panjang).
   */
  private normalizeClass(value: string | null | undefined): string | null | undefined {
    if (value === undefined || value === null) return null;

    const className = tidy(value);
    if (!className) return null;
    if (className.length > MAX_CLASS_LENGTH) return undefined;

    return className;
  }
}

export const profileService = new ProfileService();
