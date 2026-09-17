import type { Context } from "hono";
import { getDb } from "../../database/db";
import type { AuthEnv } from "../middleware/auth";
import { responseOK } from "../utils/response";
import { classService } from "./service";

class ClassController {
  /** `GET /api/classes` — daftar kelas yang boleh diakses user. */
  list = async (c: Context<AuthEnv>) => {
    const data = await classService.listForUser(getDb(c.env), c.get("user"));
    return responseOK(c, "Daftar kelas", data);
  };
}

export const classController = new ClassController();
