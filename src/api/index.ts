import { Hono } from "hono";
import type { Env } from "../database/db";
import authRoute from "./auth/route";
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

export default app;
