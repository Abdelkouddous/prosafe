import fs from "fs";
import path from "path";
import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL?.trim();

function resolveSqlHost(rawHost?: string): string | undefined {
  const host = rawHost?.trim();
  if (!host) return undefined;
  if (host.startsWith("/app/cloudsql/") && !fs.existsSync(host)) {
    const cloudSqlDir = "/app/cloudsql";
    if (fs.existsSync(cloudSqlDir)) {
      const mounted = fs
        .readdirSync(cloudSqlDir)
        .find((entry) => fs.existsSync(path.join(cloudSqlDir, entry, ".s.PGSQL.5432")));
      if (mounted) {
        return path.join(cloudSqlDir, mounted);
      }
    }
  }
  return host;
}

function buildDbCredentials() {
  if (databaseUrl) {
    const parsed = new URL(databaseUrl);
    const isLocal =
      /localhost|127\.0\.0\.1/i.test(parsed.hostname) ||
      parsed.searchParams.get("sslmode") === "disable";
    return {
      host: parsed.hostname,
      port: parsed.port ? Number(parsed.port) : 5432,
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.replace(/^\//, "") || "postgres",
      ssl: isLocal ? false : ({ rejectUnauthorized: false } as const),
    };
  }

  const sqlHost = resolveSqlHost(process.env.SQL_HOST);
  const sqlDbName = process.env.SQL_DB_NAME;
  const user = process.env.SQL_ADMIN_USER;
  const password = process.env.SQL_ADMIN_PASSWORD;

  if (!sqlHost) {
    throw new Error("SQL_HOST or DATABASE_URL must be set in environment variables.");
  }
  if (!sqlDbName) {
    throw new Error("SQL_DB_NAME or DATABASE_URL must be set in environment variables.");
  }
  if (!user) {
    throw new Error("SQL_ADMIN_USER or DATABASE_URL must be set in environment variables.");
  }
  if (!password) {
    throw new Error("SQL_ADMIN_PASSWORD or DATABASE_URL must be set in environment variables.");
  }

  return {
    host: sqlHost,
    user: user,
    password: password,
    database: sqlDbName,
    ssl: false,
  };
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  schemaFilter: ["public"],
  dbCredentials: buildDbCredentials(),
  verbose: true,
});
