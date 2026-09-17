import { Hono } from "hono";
import type { Env } from "../database/db";
import authRoute from "./auth/route";
import { categoriesRoute, menusRoute } from "./catalog/route";
import { parentsRoute } from "./parents/route";
import {
  holidaysRoute,
  schedulesRoute,
  weeksRoute,
} from "./schedules/route";
import { statsRoute } from "./stats/route";
import { responseOK } from "./utils/response";

const app = new Hono<{ Bindings: Env }>().basePath("/api");

/**
 * Health check — juga berguna untuk memverifikasi bahwa binding D1 tersedia.
 */
app.get("/health", (c) =>
  responseOK(c, "Success", {
    app: "Pizza Snack Play",
    db: c.env.DB ? "connected" : "missing",
    timestamp: new Date().toISOString(),
  }),
);

app.route("/auth", authRoute);
app.route("/schedules", schedulesRoute);
app.route("/weeks", weeksRoute);
app.route("/holidays", holidaysRoute);
app.route("/menus", menusRoute);
app.route("/categories", categoriesRoute);
app.route("/parents", parentsRoute);
app.route("/stats", statsRoute);

export default app;
