import { Hono } from "hono";
import { requireAuth, type AuthEnv } from "../middleware/auth";
import { requireRole } from "../middleware/role";
import { laporanController } from "./controller";

/**
 * Laporan jadwal — rekap berapa kali setiap orang tua mengambil tanggal piket.
 *
 * **Admin & korlas saja.** Orang tua tidak dilayani: laporan memuat nama
 * sesama orang tua beserta kebiasaannya mengambil piket, padahal ia tidak
 * punya urusan dengan data itu — sama alasannya dengan `/classes/:class/roster`.
 *
 * Korlas selalu terbatas pada kelasnya sendiri; itu ditegakkan di controller
 * lewat `laporanService.resolveScope`, bukan di middleware, karena butuh
 * daftar kelas user.
 */
export const laporanRoute = new Hono<AuthEnv>().get(
  "/",
  requireAuth,
  requireRole("admin", "korlas"),
  laporanController.list,
);
