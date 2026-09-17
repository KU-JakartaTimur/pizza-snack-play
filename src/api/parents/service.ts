import type { Db } from "../../database/db";
import type { Student } from "../../database/schema";
import type {
  PaginatedDto,
  ParentDto,
  ParentInput,
  ParentRelationship,
  StudentDto,
  StudentInput,
} from "../../types/account";
import { hashPassword } from "../utils/password";
import { parentRepository, type ParentRow } from "./repository";

export type ParentError =
  | "not_found"
  | "duplicate_username"
  | "invalid_relationship"
  | "no_students";

export const RELATIONSHIPS: ParentRelationship[] = ["ibu", "ayah", "wali"];

const DEFAULT_PER_PAGE = 20;
const MAX_PER_PAGE = 100;

function toStudentDto(student: Student): StudentDto {
  return {
    id: student.id,
    name: student.name,
    className: student.className,
  };
}

function toParentDto(row: ParentRow): ParentDto {
  const { parent, user, students } = row;
  return {
    id: parent.id,
    userId: parent.userId,
    username: user.username,
    parentName: parent.parentName,
    students: students.map(toStudentDto),
    relationship: parent.relationship as ParentRelationship,
    phone: parent.phone,
    address: parent.address,
    email: user.email,
    isActive: parent.isActive === 1 && user.isActive === 1,
    lastLoginAt: user.lastLoginAt,
    createdAt: parent.createdAt,
  };
}

class ParentService {
  async list(
    db: Db,
    options: {
      search?: string;
      active?: boolean;
      page?: number;
      perPage?: number;
    } = {},
  ): Promise<PaginatedDto<ParentDto>> {
    const page = Math.max(1, options.page ?? 1);
    const perPage = Math.min(MAX_PER_PAGE, Math.max(1, options.perPage ?? DEFAULT_PER_PAGE));

    const { rows, total } = await parentRepository.listParents(db, {
      search: options.search,
      active: options.active,
      page,
      perPage,
    });

    return {
      items: rows.map(toParentDto),
      total,
      page,
      perPage,
      totalPages: Math.max(1, Math.ceil(total / perPage)),
    };
  }

  async getById(db: Db, id: number): Promise<ParentDto | null> {
    const row = await parentRepository.findById(db, id);
    return row ? toParentDto(row) : null;
  }

  /**
   * Buat akun login + profil orang tua sekaligus.
   * Username wajib unik di seluruh tabel `users`.
   */
  async create(db: Db, input: ParentInput): Promise<ParentDto | ParentError> {
    const username = input.username.trim().toLowerCase();

    if (await parentRepository.usernameExists(db, username)) {
      return "duplicate_username";
    }

    const relationship = input.relationship ?? "ibu";
    if (!RELATIONSHIPS.includes(relationship)) return "invalid_relationship";

    // Minimal satu anak, dan tidak boleh hanya berisi spasi.
    if (!input.students.some((student) => student.name.trim())) {
      return "no_students";
    }

    const isActive = input.isActive === false ? 0 : 1;
    const passwordHash = await hashPassword(input.password!);

    const user = await parentRepository.insertUser(db, {
      username,
      passwordHash,
      fullName: input.parentName.trim(),
      email: input.email ?? null,
      phone: input.phone ?? null,
      isActive,
    });

    const parent = await parentRepository.insertParent(db, {
      userId: user.id,
      parentName: input.parentName.trim(),
      relationship,
      phone: input.phone ?? null,
      address: input.address ?? null,
      isActive,
    });

    const studentRows = await this.syncStudents(db, parent.id, input.students);

    return toParentDto({ parent, user, students: studentRows });
  }

  async update(
    db: Db,
    id: number,
    input: Partial<ParentInput>,
  ): Promise<ParentDto | ParentError> {
    const row = await parentRepository.findById(db, id);
    if (!row) return "not_found";

    if (input.relationship && !RELATIONSHIPS.includes(input.relationship)) {
      return "invalid_relationship";
    }

    // Daftar anak boleh dikirim sebagian, tapi tidak boleh jadi kosong.
    if (
      input.students !== undefined &&
      !input.students.some((student) => student.name.trim())
    ) {
      return "no_students";
    }

    if (input.username) {
      const username = input.username.trim().toLowerCase();
      if (username !== row.user.username) {
        if (await parentRepository.usernameExists(db, username, row.user.id)) {
          return "duplicate_username";
        }
      }
    }

    const isActive =
      input.isActive === undefined ? undefined : input.isActive ? 1 : 0;

    // Ganti password opsional saat update profil.
    const passwordHash = input.password
      ? await hashPassword(input.password)
      : undefined;

    await parentRepository.updateUser(db, row.user.id, {
      ...(input.username ? { username: input.username.trim().toLowerCase() } : {}),
      ...(input.parentName ? { fullName: input.parentName.trim() } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(passwordHash ? { passwordHash } : {}),
    });

    await parentRepository.updateParent(db, id, {
      ...(input.parentName ? { parentName: input.parentName.trim() } : {}),
      ...(input.relationship ? { relationship: input.relationship } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.address !== undefined ? { address: input.address } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
    });

    // Daftar anak bersifat menggantikan: yang tidak disebut lagi akan dihapus.
    if (input.students !== undefined) {
      await this.syncStudents(db, id, input.students);
    }

    const updated = await parentRepository.findById(db, id);
    return updated ? toParentDto(updated) : "not_found";
  }

  /**
   * Selaraskan daftar anak dengan input: perbarui yang menyertakan `id`,
   * tambahkan yang baru, lalu hapus yang tidak lagi disebutkan.
   *
   * `id` hanya dipercaya bila anak itu memang milik `parentId` ini,
   * sehingga id milik orang tua lain tidak bisa dibajak.
   */
  private async syncStudents(
    db: Db,
    parentId: number,
    inputs: StudentInput[],
  ): Promise<Student[]> {
    const existing = await parentRepository.findStudentsByParentId(db, parentId);
    const existingIds = new Set(existing.map((student) => student.id));
    const keepIds: number[] = [];

    for (const input of inputs) {
      const name = input.name.trim();
      if (!name) continue;

      const className = input.className?.trim() || null;

      if (input.id !== undefined && existingIds.has(input.id)) {
        await parentRepository.updateStudent(db, input.id, { name, className });
        keepIds.push(input.id);
        continue;
      }

      const created = await parentRepository.insertStudent(db, {
        parentId,
        name,
        className,
      });
      keepIds.push(created.id);
    }

    await parentRepository.deleteStudentsExcept(db, parentId, keepIds);

    return parentRepository.findStudentsByParentId(db, parentId);
  }

  /**
   * Nonaktifkan akun (default) atau hapus permanen.
   * Menonaktifkan lebih aman karena jadwal lama tetap punya konteks.
   */
  async remove(
    db: Db,
    id: number,
    options: { hard?: boolean } = {},
  ): Promise<"deactivated" | "deleted" | ParentError> {
    const row = await parentRepository.findById(db, id);
    if (!row) return "not_found";

    if (options.hard) {
      await parentRepository.deleteUser(db, row.user.id);
      return "deleted";
    }

    await parentRepository.updateUser(db, row.user.id, { isActive: 0 });
    await parentRepository.updateParent(db, id, { isActive: 0 });
    return "deactivated";
  }

  async resetPassword(
    db: Db,
    id: number,
    newPassword: string,
  ): Promise<true | ParentError> {
    const row = await parentRepository.findById(db, id);
    if (!row) return "not_found";

    await parentRepository.updateUser(db, row.user.id, {
      passwordHash: await hashPassword(newPassword),
    });
    return true;
  }
}

export const parentService = new ParentService();
