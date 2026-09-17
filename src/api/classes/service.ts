import type { Db } from "../../database/db";
import type { JwtPayload } from "../../types/auth";
import type { ClassListDto } from "../../types/class";
import { classRepository } from "./repository";

class ClassService {
  /**
   * Kelas yang boleh diakses user beserta kelas default-nya.
   *
   * - `admin`  → semua kelas
   * - `korlas` → hanya kelas yang dikoordinasi
   * - `parent` → hanya kelas anak-anaknya
   */
  async listForUser(db: Db, user: JwtPayload): Promise<ClassListDto> {
    const classes = await this.allowedClasses(db, user);
    return { classes, default: classes[0] ?? null };
  }

  /** Inti pembatasan kelas — dipakai juga oleh resolver cakupan jadwal. */
  async allowedClasses(db: Db, user: JwtPayload): Promise<string[]> {
    if (user.role === "admin") return classRepository.listAll(db);

    if (user.role === "korlas") {
      const own = user.className?.trim();
      return own ? [own] : [];
    }

    return classRepository.listForParent(db, user.sub);
  }
}

export const classService = new ClassService();
