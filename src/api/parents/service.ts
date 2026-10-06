import type { Db } from "../../database/db";
import type { Student } from "../../database/schema";
import type {
  ManagedRole,
  PaginatedDto,
  ParentBulkAction,
  ParentBulkResultDto,
  ParentDto,
  ParentImportIssueDto,
  ParentImportResultDto,
  ParentImportRowDto,
  ParentInput,
  ParentRelationship,
  StudentDto,
  StudentInput,
} from "../../types/account";
import { authRepository } from "../auth/repository";
import { hashPassword } from "../utils/password";
import { nameKey, type ParsedAccountRow, type ParsedChild, type SheetIssue } from "./import";
import { parentRepository, type ParentRow } from "./repository";

export type ParentError =
  | "not_found"
  | "duplicate_username"
  | "invalid_relationship"
  | "no_students"
  | "invalid_role"
  | "class_required";

export const RELATIONSHIPS: ParentRelationship[] = ["ibu", "ayah", "wali"];

/** Role yang boleh dikelola lewat modul ini. */
export const MANAGED_ROLES: ManagedRole[] = ["parent", "korlas"];

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
    // Role tak dikenal dinormalkan ke `parent` agar UI tidak bingung.
    role: user.role === "korlas" ? "korlas" : "parent",
    className: user.className,
    phone: parent.phone,
    address: parent.address,
    email: user.email,
    isActive: parent.isActive === 1 && user.isActive === 1,
    lastLoginAt: user.lastLoginAt,
    lockedAt: user.lockedAt,
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
   * Seluruh akun dalam bentuk DTO — untuk ekspor, bukan untuk layar.
   *
   * Sengaja tidak memakai `list`: `list` memotong hasilnya per halaman, dan
   * berkas ekspor yang hanya berisi 20 baris pertama justru menyesatkan.
   */
  async listForExport(
    db: Db,
    options: { active?: boolean } = {},
  ): Promise<ParentDto[]> {
    const rows = await parentRepository.listParentsForExport(db, options);
    return rows.map(toParentDto);
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

    const role = input.role ?? "parent";
    if (!MANAGED_ROLES.includes(role)) return "invalid_role";

    // Korlas tanpa kelas tidak punya cakupan apa pun — tolak sejak awal.
    const className = input.className?.trim() || null;
    if (role === "korlas" && !className) return "class_required";

    const isActive = input.isActive === false ? 0 : 1;
    const passwordHash = await hashPassword(input.password!);

    const user = await parentRepository.insertUser(db, {
      username,
      passwordHash,
      fullName: input.parentName.trim(),
      email: input.email ?? null,
      phone: input.phone ?? null,
      role,
      className: role === "korlas" ? className : null,
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

    // Role & kelas yang dikoordinasi. Bila dikembalikan ke `parent`,
    // kelasnya ikut dibersihkan agar tidak menyisakan cakupan hantu.
    const requestedRole = input.role as string | undefined;
    if (
      requestedRole !== undefined &&
      !MANAGED_ROLES.includes(requestedRole as ManagedRole)
    ) {
      return "invalid_role";
    }

    const nextRole: ManagedRole =
      (requestedRole as ManagedRole | undefined) ??
      (row.user.role === "korlas" ? "korlas" : "parent");

    const nextClassName =
      input.className === undefined
        ? row.user.className
        : input.className?.trim() || null;

    if (nextRole === "korlas" && !nextClassName) return "class_required";

    await parentRepository.updateUser(db, row.user.id, {
      ...(input.username ? { username: input.username.trim().toLowerCase() } : {}),
      ...(input.parentName ? { fullName: input.parentName.trim() } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(passwordHash ? { passwordHash } : {}),
      role: nextRole,
      className: nextRole === "korlas" ? nextClassName : null,
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
   * Impor akun dari lembar Excel: **yang sudah ada ditimpa, yang belum dibuat**.
   *
   * Kuncinya **username**, bukan nama orang tua. Nama bukan pengenal — dua
   * orang tua bisa bernama sama, dan menimpakan data ke akun yang salah justru
   * lebih buruk daripada menolak barisnya. Username juga satu-satunya kolom
   * yang dijamin unik oleh skema.
   *
   * Aturan per baris:
   *  - akun lama → nama, peran, kelas, anak, dan status aktifnya ditimpa.
   *    Password hanya diganti bila kolomnya diisi; dikosongkan berarti
   *    "jangan sentuh", sehingga berkas hasil ekspor bisa diunggah kembali
   *    tanpa mengubah satu pun password.
   *  - akun baru → wajib punya password; `relationship` diisi `ibu` karena
   *    lembar ekspor tidak memuatnya.
   *
   * `dryRun` menghitung nasib tiap baris **tanpa menulis apa pun** — termasuk
   * tanpa menghitung hash password, yang mahal.
   */
  async importAccounts(
    db: Db,
    rows: ParsedAccountRow[],
    sheetIssues: SheetIssue[],
    options: { dryRun?: boolean } = {},
  ): Promise<ParentImportResultDto> {
    const dryRun = options.dryRun === true;

    // Satu query untuk seluruh akun — pencocokan username tidak boleh
    // menembak database sekali per baris.
    const existing = await parentRepository.listParentsForExport(db);
    const byUsername = new Map<string, ParentRow>();
    for (const row of existing) {
      byUsername.set(row.user.username.toLowerCase(), row);
    }

    const issues: ParentImportIssueDto[] = sheetIssues.map((issue) => ({ ...issue }));
    const outcomes: ParentImportRowDto[] = [];
    /** Username yang sudah muncul di berkas ini — cegah baris saling menimpa. */
    const seen = new Set<string>();

    let created = 0;
    let updated = 0;
    let skipped = 0;

    /**
     * Catat baris yang dilewati.
     *
     * Sebabnya **hanya** ditaruh di barisnya (`reason`), tidak ikut ke
     * `issues`: `issues` khusus untuk baris yang tidak terbaca dari lembar.
     * Mengisi keduanya membuat satu masalah tampil dua kali di pratinjau.
     */
    const skip = (row: ParsedAccountRow, reason: string) => {
      skipped++;
      outcomes.push({
        row: row.row,
        parentName: row.parentName,
        username: row.username,
        outcome: "skip",
        reason,
        students: row.students?.map((child) => child.name) ?? [],
      });
    };

    for (const row of rows) {
      if (seen.has(row.username)) {
        skip(row, `Username "${row.username}" muncul lebih dari sekali di berkas ini`);
        continue;
      }
      seen.add(row.username);

      const current = byUsername.get(row.username);
      const studentNames = row.students?.map((child) => child.name) ?? [];

      if (!current) {
        // Akun baru wajib punya anak: tanpa itu ia tidak punya kelas, dan
        // seluruh layar untuk orang tua jadi kosong. Aturan yang sama
        // ditegakkan form "Akun baru".
        if (!row.students || row.students.length === 0) {
          skip(row, "Akun baru wajib punya minimal satu anak");
          continue;
        }

        if (!row.password) {
          skip(row, `Akun baru "${row.username}" memerlukan password`);
          continue;
        }

        if (!dryRun) {
          const isActive = row.isActive === false ? 0 : 1;

          const user = await parentRepository.insertUser(db, {
            username: row.username,
            passwordHash: await hashPassword(row.password),
            fullName: row.parentName,
            email: null,
            phone: null,
            role: row.role,
            className: row.role === "korlas" ? row.className : null,
            isActive,
          });

          const parent = await parentRepository.insertParent(db, {
            userId: user.id,
            parentName: row.parentName,
            // Lembar ekspor tidak memuat hubungan keluarga; `ibu` adalah
            // default yang sama dengan form "Akun baru".
            relationship: "ibu",
            phone: null,
            address: null,
            isActive,
          });

          await this.syncStudents(db, parent.id, row.students);
        }

        created++;
        outcomes.push({
          row: row.row,
          parentName: row.parentName,
          username: row.username,
          outcome: "create",
          reason: null,
          students: studentNames,
        });
        continue;
      }

      if (!dryRun) {
        const activeValue =
          row.isActive === null ? {} : { isActive: row.isActive ? 1 : 0 };

        await parentRepository.updateUser(db, current.user.id, {
          fullName: row.parentName,
          role: row.role,
          className: row.role === "korlas" ? row.className : null,
          ...activeValue,
          ...(row.password
            ? { passwordHash: await hashPassword(row.password) }
            : {}),
        });

        await parentRepository.updateParent(db, current.parent.id, {
          parentName: row.parentName,
          ...activeValue,
        });

        // Daftar anak menggantikan: yang tidak lagi disebut di berkas dihapus.
        // Id anak yang namanya masih sama dipertahankan, supaya riwayat piket
        // dan relasi lain yang menunjuk ke sana tidak ikut terputus.
        // Kolom Anak yang dikosongkan berarti daftarnya tidak disentuh.
        if (row.students) {
          await this.syncStudents(
            db,
            current.parent.id,
            this.mergeStudentIds(current.students, row.students),
          );
        }
      }

      updated++;
      outcomes.push({
        row: row.row,
        parentName: row.parentName,
        username: row.username,
        outcome: "update",
        reason: null,
        students: studentNames,
      });
    }

    return {
      dryRun,
      totalRows: rows.length + sheetIssues.length,
      created,
      updated,
      skipped,
      rows: outcomes,
      issues,
    };
  }

  /**
   * Tempelkan `id` anak lama pada baris impor yang namanya masih sama.
   *
   * Tanpa ini, `syncStudents` akan menghapus seluruh anak lalu menambahkannya
   * kembali dengan id baru setiap kali impor dijalankan — dan setiap rujukan
   * ke id lama (mis. petugas piket yang sudah tersimpan di jadwal) kehilangan
   * sasarannya.
   */
  private mergeStudentIds(
    existing: Student[],
    parsed: ParsedChild[],
  ): StudentInput[] {
    const ids = new Map<string, number>();
    for (const student of existing) {
      ids.set(nameKey(student.name), student.id);
    }

    return parsed.map((child) => {
      const id = ids.get(nameKey(child.name));
      return id === undefined
        ? { name: child.name, className: child.className }
        : { id, name: child.name, className: child.className };
    });
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

  /**
   * Buka kunci akun akibat percobaan masuk yang gagal.
   *
   * Password lama tetap berlaku — yang dibuka hanya pengunciannya. Akun yang
   * memang dinonaktifkan admin **tidak** ikut diaktifkan di sini; itu tindakan
   * lain yang punya tombolnya sendiri.
   */
  async unlock(db: Db, id: number): Promise<true | ParentError> {
    const row = await parentRepository.findById(db, id);
    if (!row) return "not_found";

    await authRepository.clearLoginFailures(db, row.user.id);
    return true;
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

    // Sekalian buka kuncinya: password baru tidak ada gunanya kalau akunnya
    // masih terkunci karena percobaan dengan password lama.
    await authRepository.clearLoginFailures(db, row.user.id);

    return true;
  }

  /**
   * Aksi massal atas akun yang dicentang di tabel.
   *
   * Berbeda dari perubahan per-baris, di sini pemilihannya **eksplisit per
   * akun**; karenanya tidak ada operasi yang gagal seluruhnya. Akun yang
   * keadaannya sudah cocok dengan aksi (mis. mengaktifkan akun yang sudah
   * aktif) hanya **dilewati** dan dilaporkan lewat `skipped` — bukan `409`
   * — sebab admin menyebut id-nya satu per satu dan berhak tahu hasilnya.
   *
   * Modul ini khusus admin, sehingga tidak ada pembatasan kelas seperti pada
   * jadwal: seluruh id yang ditemukan diproses.
   */
  async bulk(
    db: Db,
    ids: number[],
    action: ParentBulkAction,
  ): Promise<ParentBulkResultDto> {
    // Id ganda (mis. dari "pilih semua" yang bertumpang) dihitung sekali saja.
    const uniqueIds = [...new Set(ids)].filter(
      (id) => Number.isInteger(id) && id > 0,
    );

    const rows = await parentRepository.findRowsByIds(db, uniqueIds);
    const foundIds = new Set(rows.map((row) => row.parent.id));
    const ignored = uniqueIds.length - foundIds.size;

    // Hapus permanen — seluruh akun yang ditemukan dihapus (ON DELETE
    // CASCADE menarik profil & anaknya). Tidak ada `skipped`: penghapusan
    // bersifat idempoten terhadap id yang tak ditemukan.
    if (action === "delete") {
      for (const row of rows) {
        await parentRepository.deleteUser(db, row.user.id);
      }
      return { action, changed: rows.length, skipped: 0, ignored };
    }

    const target = action === "activate" ? 1 : 0;
    const isActiveRow = (row: ParentRow) =>
      row.parent.isActive === 1 && row.user.isActive === 1;

    // Hanya akun yang keadaannya berlawanan dengan tujuan yang benar-benar
    // berubah; sisanya masuk `skipped`.
    const eligible = rows.filter(
      (row) => isActiveRow(row) !== (target === 1),
    );

    const userIds = eligible.map((row) => row.user.id);
    const parentIds = eligible.map((row) => row.parent.id);

    // `isActive` disimpan di dua tabel — kedua sisi harus seirama supaya
    // `toParentDto` tidak pernah mengembalikan nilai yang bertentangan.
    await parentRepository.setUsersActive(db, userIds, target);
    await parentRepository.setParentsActive(db, parentIds, target);

    return {
      action,
      changed: eligible.length,
      skipped: rows.length - eligible.length,
      ignored,
    };
  }
}

export const parentService = new ParentService();
