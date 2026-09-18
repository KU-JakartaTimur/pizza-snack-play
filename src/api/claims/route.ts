import { Hono } from "hono";
import { requireAuth, type AuthEnv } from "../middleware/auth";
import { requireRole } from "../middleware/role";
import { claimController } from "./controller";

/**
 * Pemilihan jadwal oleh orang tua.
 *
 * Korlas ikut boleh memilih — ia tetap orang tua murid. Admin tidak punya
 * profil orang tua sehingga hanya boleh membaca rekap dan membatalkan klaim.
 *
 * `/mine` didaftarkan sebelum rute berparameter agar tidak tertangkap `/:id`.
 */
const claimants = requireRole("parent", "korlas");

export const claimsRoute = new Hono<AuthEnv>()
  .get("/mine", requireAuth, claimants, claimController.mine)
  .get("/", requireAuth, claimController.list)
  .post("/", requireAuth, claimants, claimController.create)
  .delete("/:id", requireAuth, claimController.remove);
