import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  // Migrasi ditulis ke subfolder agar `drizzle/seed.sql` tidak ikut
  // terdeteksi wrangler sebagai migrasi (migrations_dir = drizzle/migrations).
  out: "./drizzle/migrations",
  schema: "./src/database/schema.ts",
  dialect: "sqlite",
  driver: "d1-http",
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
    token: process.env.CLOUDFLARE_D1_TOKEN!,
  },
});
