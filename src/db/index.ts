import fs from "fs";
import path from "path";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.ts";

declare global {
  var _postgresPool: Pool | undefined;
}

export function resolveSqlHost(rawHost?: string): string | undefined {
  const host = rawHost?.trim();
  if (!host) return undefined;
  if (host.startsWith("/app/cloudsql/") && !fs.existsSync(host)) {
    const cloudSqlDir = "/app/cloudsql";
    if (fs.existsSync(cloudSqlDir)) {
      const entries = fs.readdirSync(cloudSqlDir);
      const mounted = entries.find((entry) =>
        fs.existsSync(path.join(cloudSqlDir, entry, ".s.PGSQL.5432"))
      );
      if (mounted) {
        return path.join(cloudSqlDir, mounted);
      }
    }
  }
  return host;
}

export const createPool = () => {
  if (!global._postgresPool) {
    const databaseUrl = process.env.DATABASE_URL?.trim();
    if (databaseUrl) {
      const parsed = new URL(databaseUrl);
      const isLocal =
        /localhost|127\.0\.0\.1/i.test(parsed.hostname) ||
        parsed.searchParams.get("sslmode") === "disable";
      global._postgresPool = new Pool({
        host: parsed.hostname,
        port: parsed.port ? Number(parsed.port) : 5432,
        user: decodeURIComponent(parsed.username),
        password: decodeURIComponent(parsed.password),
        database: parsed.pathname.replace(/^\//, "") || "postgres",
        ssl: isLocal ? false : { rejectUnauthorized: false },
        max: 10,
        connectionTimeoutMillis: 30000,
      });
    } else {
      global._postgresPool = new Pool({
        host: resolveSqlHost(process.env.SQL_HOST),
        user: process.env.SQL_USER,
        password: process.env.SQL_PASSWORD,
        database: process.env.SQL_DB_NAME,
        max: 10,
        connectionTimeoutMillis: 30000,
      });
    }

    global._postgresPool.on("error", (err) => {
      console.error("Unexpected error on idle SQL pool client:", err);
    });
  }
  return global._postgresPool;
};

export const pool = createPool();

export const db = drizzle(pool, { schema });
