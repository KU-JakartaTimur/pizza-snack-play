import type { Db } from "../../database/db";
import type { JwtPayload } from "../../types/auth";
import type { ClassListDto } from "../../types/class";
import { classRepository } from "./repository";

class ClassService {
  /**
   * Kelas yang boleh diakses user beserta kelas default-nya.
   *
   * - `admin`  → semua kelas
   * - `korlas` → semua kelas (boleh **melihat** kelas lain, mis. untuk
   *              membandingkan menu antarkelas). Wewenang **mengubah** tetap
   *              terkunci ke kelasnya sendiri — ditegakkan `resolveWriteClass`
   *              dan `canWriteClass`, bukan di sini.
   * - `parent` → hanya kelas anak-anaknya
   */
  async listForUser(db: Db, user: JwtPayload): Promise<ClassListDto> {
    const classes = await this.allowedClasses(db, user);
    return { classes, default: defaultClassFor(user, classes) };
  }

  /** Inti pembatasan kelas — dipakai juga oleh resolver cakupan jadwal. */
  async allowedClasses(db: Db, user: JwtPayload): Promise<string[]> {
    if (user.role === "admin" || user.role === "korlas") {
      return classRepository.listAll(db);
    }

    return classRepository.listForParent(db, user.sub);
  }
}

/**
 * Kelas yang dipakai bila klien tidak menyebut kelas secara eksplisit.
 *
 * Korlas memakai kelas yang dikoordinasinya walau daftarnya berisi semua kelas —
 * tanpa itu halaman baca (mis. Hari Ini) terbuka di kelas pertama menurut abjad,
 * bukan kelas yang menjadi tanggung jawabnya.
 */
function defaultClassFor(user: JwtPayload, classes: string[]): string | null {
  const own = user.className?.trim();
  if (user.role === "korlas" && own && classes.includes(own)) return own;

  return classes[0] ?? null;
}

export const classService = new ClassService();
