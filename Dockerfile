# syntax=docker/dockerfile:1

# ==============================================================================
# Stage 1: Build the Admin SPA (apps/admin -> apps/admin/dist)
# Installs root + apps/admin with devDependencies cleanly, completely bypassing
# unused legacy apps/backend and apps/mobile workspaces.
# ==============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy only the manifests required for the web workspace build
COPY package.json .npmrc ./
COPY apps/admin/package.json ./apps/admin/

# Clean install with devDependencies enabled even if NODE_ENV=production is passed
RUN NODE_ENV=development npm install \
  --legacy-peer-deps \
  --include=dev \
  --no-audit \
  --no-fund

# Copy only the files needed to bundle apps/admin
COPY firebase-applet-config.json ./
COPY apps/admin ./apps/admin

RUN npm run build

# ==============================================================================
# Stage 2: Clean production runtime dependencies for the unified Express server
# ==============================================================================
FROM node:22-alpine AS prod-deps

WORKDIR /app

COPY package.json ./

RUN npm install \
  --workspaces=false \
  --omit=dev \
  --legacy-peer-deps \
  --no-audit \
  --no-fund \
  && npm cache clean --force

# ==============================================================================
# Stage 3: Minimal production runtime image (Render & Cloud Run compatible)
# ==============================================================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json firebase-applet-config.json server.ts ./
COPY --chown=node:node src ./src
COPY --from=builder --chown=node:node /app/apps/admin/dist ./apps/admin/dist

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Sync Drizzle schema to Supabase/Postgres when DATABASE_URL is provided, then exec server as PID 1
CMD ["sh", "-c", "if [ -n \"$DATABASE_URL\" ]; then ./node_modules/.bin/drizzle-kit push --config=src/db/drizzle.config.ts --force || echo '[startup] db:push skipped or failed'; fi && exec ./node_modules/.bin/tsx server.ts"]
