# Build from the MONOREPO ROOT:
#   docker build -f apps/backend/Dockerfile -t prosafe-backend .
# (docker compose in apps/backend already sets this context)

# ---- Build stage ----
FROM node:20-alpine AS builder
ENV HUSKY=0 CI=true
RUN npm install -g pnpm@9
WORKDIR /repo

# Workspace manifests first for better layer caching
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/backend/package.json apps/backend/package.json
RUN pnpm install --frozen-lockfile --filter backend...

COPY apps/backend apps/backend
RUN pnpm --filter backend build

# ---- Production stage ----
FROM node:20-alpine AS production
ENV NODE_ENV=production HUSKY=0 CI=true
RUN npm install -g pnpm@9
WORKDIR /repo

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/backend/package.json apps/backend/package.json
RUN pnpm install --prod --frozen-lockfile --filter backend...

COPY --from=builder /repo/apps/backend/dist apps/backend/dist

# Uploaded files live on disk (mount a volume on /repo/apps/backend/uploads or set UPLOADS_DIR)
RUN addgroup -g 1001 nodejs && adduser -S -u 1001 -G nodejs nodejs \
  && mkdir -p apps/backend/uploads && chown -R nodejs:nodejs apps/backend/uploads
USER nodejs

WORKDIR /repo/apps/backend
EXPOSE 3000
CMD ["node", "dist/main"]
