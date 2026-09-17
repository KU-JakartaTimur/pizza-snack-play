import { Hono } from "hono";
import { requireAuth, type AuthEnv } from "../middleware/auth";
import { classController } from "./controller";

/**
 * Daftar kelas untuk mengisi pemilih kelas di UI.
 *
 * Semua role yang sudah login boleh memanggilnya; isinya sudah dipersempit
 * sesuai role (admin melihat semua kelas, korlas hanya kelasnya, orang tua
 * hanya kelas anak-anaknya).
 */
export const classesRoute = new Hono<AuthEnv>().get(
  "/",
  requireAuth,
  classController.list,
);
