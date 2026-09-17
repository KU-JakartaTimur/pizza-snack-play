import type { Context } from "hono";
import { getDb } from "../../database/db";
import type { AuthEnv } from "../middleware/auth";
import { responseOK } from "../utils/response";
import { statsService } from "./service";

type StatsContext = Context<AuthEnv>;

class StatsController {
  summary = async (c: StatsContext) => {
    const data = await statsService.summary(getDb(c.env));
    return responseOK(c, "Ringkasan data", data);
  };
}

export const statsController = new StatsController();
