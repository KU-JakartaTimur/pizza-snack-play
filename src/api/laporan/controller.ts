import type { Context } from "hono";
import { getDb } from "../../database/db";
import type { AuthEnv } from "../middleware/auth";
import { validateRange } from "../utils/params";
import { responseBadRequest, responseForbidden, responseOK } from "../utils/response";
import { laporanService } from "./service";

type LaporanContext = Context<AuthEnv>;

/**
 * Laporan jadwal — rekap ambil jadwal per orang tua.
 *
 * Cakupan kelas ditentukan **di sini**, bukan diserahkan ke `resolveReadClass`:
 * resolver itu mengembalikan kelas pertama untuk admin yang mengosongkan
 * `?class=`, sedangkan laporan justru butuh cakupan **sekolah-wide** pada
 * kondisi itu. Aturannya ada di `laporanService.resolveScope`.
 */
class LaporanController {
  /**
   * `GET /laporan?from=YYYY-MM-DD&to=YYYY-MM-DD&class=`
   *
   * Role: admin & korlas (ditegakkan di route). Rentangnya memakai batas yang
   * sama dengan pembacaan jadwal lain supaya tidak ada jalur query tanpa batas.
   */
  list = async (c: LaporanContext) => {
    const from = c.req.query("from");
    const to = c.req.query("to");

    const error = validateRange(from, to);
    if (error) return responseBadRequest(c, error);

    const db = getDb(c.env);
    const scope = await laporanService.resolveScope(
      db,
      c.get("user"),
      c.req.query("class"),
    );
    if (!scope) return responseForbidden(c, "Kelas ini bukan cakupan Anda");

    const data = await laporanService.build(db, from!, to!, scope);
    return responseOK(c, "Laporan jadwal", data);
  };
}

export const laporanController = new LaporanController();
