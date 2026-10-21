import { and, asc, eq, sql } from "drizzle-orm";
import type { Db } from "../../database/db";
import {
  menus,
  parents,
  schedules,
  students,
  users,
  whatsappBroadcasts,
} from "../../database/schema";
import type { WhatsappBroadcast } from "../../database/schema";
import type { RecipientRow } from "./recipients";

/**
 * Sumber data notifikasi WhatsApp.
 *
 * Semua query di sini hanya **membaca tujuan** dan **mencatat riwayat**.
 * Tidak ada keputusan wewenang di lapisan ini: pembatasan kelas korlas
 * ditegakkan controller, dan penyaringan nomor ditegakkan `collectRecipients`.
 */

/** Wali murid yang harus dihubungi, beserta konteks barisnya. */
export interface PetugasTargetRow extends RecipientRow {
  scheduleDate: string;
  studentName: string | null;
  menuName: string | null;
  notes: string | null;
}

class WhatsappRepository {
  /**
   * Semua orang tua aktif yang punya nomor HP.
   *
   * `className` membatasi ke satu kelas lewat `students`; satu orang tua
   * dengan dua anak di kelas yang sama muncul sekali karena `groupBy` pada
   * `parents.id`. Duplikat yang lolos tetap disaring `collectRecipients`.
   */
  async listParentsWithPhone(
    db: Db,
    className?: string | null,
  ): Promise<RecipientRow[]> {
    const filters = [
      eq(parents.isActive, 1),
      eq(users.isActive, 1),
      sql`${parents.phone} is not null`,
      sql`${parents.phone} <> ''`,
    ];

    if (className) {
      filters.push(eq(students.className, className));
    }

    const rows = await db
      .select({
        parentId: parents.id,
        parentName: parents.parentName,
        phone: parents.phone,
        className: students.className,
      })
      .from(parents)
      .innerJoin(users, eq(parents.userId, users.id))
      .innerJoin(students, eq(students.parentId, parents.id))
      .where(and(...filters))
      .groupBy(parents.id);

    return rows;
  }

  /**
   * Petugas piket pada satu tanggal.
   *
   * Hanya baris `published` yang diambil: pengingat untuk jadwal yang belum
   * terbit akan membocorkan tanggal yang belum tentu final, dan orang tua
   * memang belum bisa melihatnya di aplikasi.
   *
   * `parents` di-join lewat `petugas_parent_id` — kolom yang terisi baik untuk
   * petugas hasil klaim orang tua maupun penunjukan korlas. Baris lama yang
   * punya nama petugas tanpa id wali tidak ikut, karena tanpa nomor tidak ada
   * yang bisa dihubungi.
   */
  async listPetugasByDate(
    db: Db,
    date: string,
    className?: string | null,
  ): Promise<PetugasTargetRow[]> {
    const filters = [
      eq(schedules.scheduleDate, date),
      eq(schedules.status, "published"),
      eq(schedules.isHoliday, 0),
      sql`${schedules.petugasParentId} is not null`,
      sql`${parents.phone} is not null`,
      sql`${parents.phone} <> ''`,
    ];

    if (className) {
      filters.push(eq(schedules.className, className));
    }

    const rows = await db
      .select({
        parentId: parents.id,
        parentName: parents.parentName,
        phone: parents.phone,
        className: schedules.className,
        scheduleDate: schedules.scheduleDate,
        studentName: students.name,
        menuName: menus.name,
        notes: schedules.notes,
      })
      .from(schedules)
      .innerJoin(parents, eq(parents.id, schedules.petugasParentId))
      .leftJoin(students, eq(students.id, schedules.petugasStudentId))
      .leftJoin(menus, eq(menus.id, schedules.menuId))
      .where(and(...filters))
      .orderBy(asc(schedules.className));

    return rows;
  }

  /** Nomor & nama satu orang tua — dipakai konfirmasi klaim. */
  async findParentContact(
    db: Db,
    parentId: number,
  ): Promise<{ parentName: string; phone: string | null } | undefined> {
    const rows = await db
      .select({ parentName: parents.parentName, phone: parents.phone })
      .from(parents)
      .where(eq(parents.id, parentId))
      .limit(1);
    return rows[0];
  }

  // ── Riwayat pengiriman ──────────────────────────────────────

  async insertBroadcast(
    db: Db,
    values: {
      senderId: number;
      message: string;
      targetScope: string;
      targetCount: number;
      sentCount: number;
      status: string;
      errorMessage?: string | null;
    },
  ): Promise<WhatsappBroadcast> {
    const rows = await db
      .insert(whatsappBroadcasts)
      .values(values)
      .returning();
    return rows[0];
  }

  async updateBroadcast(
    db: Db,
    id: number,
    values: Partial<{
      sentCount: number;
      status: string;
      errorMessage: string | null;
    }>,
  ): Promise<void> {
    await db
      .update(whatsappBroadcasts)
      .set(values)
      .where(eq(whatsappBroadcasts.id, id));
  }

  async listBroadcasts(db: Db): Promise<WhatsappBroadcast[]> {
    return db
      .select()
      .from(whatsappBroadcasts)
      .orderBy(sql`${whatsappBroadcasts.createdAt} desc`)
      .limit(50);
  }
}

export const whatsappRepository = new WhatsappRepository();
