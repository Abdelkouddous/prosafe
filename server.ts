import "dotenv/config";
import http from "http";
import path from "path";
import fs from "fs";
import express from "express";
import cors from "cors";
import { Server as SocketIOServer } from "socket.io";
import authAndCoreRouter from "./src/routes/authAndCore.ts";
import { createSafetyModulesRouter } from "./src/routes/safetyModules.ts";
import { resolveUserFromToken } from "./src/middleware/auth.ts";

const app = express();
const server = http.createServer(app);

const ALLOWED_ORIGINS = new Set(
  [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://prosafe.aymenhamel.com",
    process.env.APP_URL,
    process.env.RENDER_EXTERNAL_URL,
  ].filter(Boolean) as string[]
);

const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    // Allow same-origin requests (no Origin header) and explicitly allowed origins
    if (
      !origin ||
      ALLOWED_ORIGINS.has(origin) ||
      /^https:\/\/[a-z0-9-]+\.[a-z0-9-]+\.run\.app$/i.test(origin)
    ) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// Socket.IO realtime gateway on /ws namespace
const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, callback) => {
      if (
        !origin ||
        ALLOWED_ORIGINS.has(origin) ||
        /^https:\/\/[a-z0-9-]+\.[a-z0-9-]+\.run\.app$/i.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  },
});

const wsNamespace = io.of("/ws");
wsNamespace.use(async (socket, next) => {
  const token =
    typeof socket.handshake.auth?.token === "string"
      ? socket.handshake.auth.token
      : "";
  if (!token) return next(new Error("Unauthorized"));
  const user = await resolveUserFromToken(token);
  if (!user) return next(new Error("Unauthorized"));
  socket.data.user = user;
  return next();
});

wsNamespace.on("connection", (socket) => {
  const user = socket.data.user as { id: number } | undefined;
  if (user) {
    socket.join(`user:${user.id}`);
  }
});

// Health probe (no eager DB calls unless ?db=1 is explicitly requested)
app.get("/api/health", async (req, res) => {
  if (req.query.db === "1") {
    try {
      const { pool } = await import("./src/db/index.ts");
      await pool.query("SELECT 1");
      return res.json({ ok: true, service: "prosafe-api", db: "connected" });
    } catch (err) {
      const e = err as { code?: string };
      console.error("[HEALTH DB CHECK FAILED]:", err);
      return res.status(503).json({
        ok: false,
        service: "prosafe-api",
        db: "error",
        code: e?.code || "DB_UNREACHABLE",
      });
    }
  }
  return res.json({ ok: true, service: "prosafe-api" });
});

// Mount API routes
app.use("/api", authAndCoreRouter);
app.use("/api", createSafetyModulesRouter(wsNamespace));

// Unknown /api routes return clean 404 JSON
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "API route not found", message: "API route not found" });
});

// Serve built admin SPA from apps/admin/dist, or mount Vite dev middleware when dist is absent
const adminRoot = path.resolve(process.cwd(), "apps/admin");
const distDir = path.join(adminRoot, "dist");
const PORT = Number(process.env.PORT || 3000);

async function startServer() {
  if (fs.existsSync(path.join(distDir, "index.html"))) {
    app.use(express.static(distDir));
    app.get("/{*splat}", (_req, res) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  } else {
    const viteCandidates = [
      path.join(adminRoot, "node_modules/vite/dist/node/index.js"),
      path.resolve(process.cwd(), "node_modules/vite/dist/node/index.js"),
    ];
    const viteEntry = viteCandidates.find((p) => fs.existsSync(p));
    if (viteEntry) {
      const { pathToFileURL } = await import("url");
      const { createServer: createViteServer } = await import(pathToFileURL(viteEntry).href);
      const vite = await createViteServer({
        root: adminRoot,
        configFile: path.join(adminRoot, "vite.config.ts"),
        appType: "spa",
        server: {
          middlewareMode: true,
          hmr: false,
        },
      });
      app.use(vite.middlewares);
    } else {
      app.get("/", (_req, res) => {
        res.status(503).send("Admin build not found. Run npm run build first.");
      });
    }
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`PROSAFE unified server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("[SERVER STARTUP FAILED]:", err);
  process.exit(1);
});
