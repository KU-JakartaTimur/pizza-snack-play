import type { Db } from "../../database/db";
import type {
  PaginatedDto,
  ParentDto,
  ParentInput,
  ParentRelationship,
} from "../../types/account";
import { hashPassword } from "../utils/password";
import { parentRepository, type ParentRow } from "./repository";

export type ParentError =
  | "not_found"
  | "duplicate_username"
  | "invalid_relationship";

export const RELATIONSHIPS: ParentRelationship[] = ["ibu", "ayah", "wali"];

const DEFAULT_PER_PAGE = 20;
const MAX_PER_PAGE = 100;

function toParentDto(row: ParentRow): ParentDto {
  const { parent, user } = row;
  return {
    id: parent.id,
    userId: parent.userId,
    username: user.username,
    parentName: parent.parentName,
    studentName: parent.studentName,
    studentClass: parent.studentClass,
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
      studentName: input.studentName.trim(),
      studentClass: input.studentClass ?? null,
      relationship,
      phone: input.phone ?? null,
      address: input.address ?? null,
      isActive,
    });

    return toParentDto({ parent, user });
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
      ...(input.studentName ? { studentName: input.studentName.trim() } : {}),
      ...(input.studentClass !== undefined
        ? { studentClass: input.studentClass }
        : {}),
      ...(input.relationship ? { relationship: input.relationship } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.address !== undefined ? { address: input.address } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
    });

    const updated = await parentRepository.findById(db, id);
    return updated ? toParentDto(updated) : "not_found";
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
