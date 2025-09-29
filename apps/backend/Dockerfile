# Build stage
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Install pnpm
RUN npm install -g pnpm

# Copy package files and lockfile
COPY apps/backend/package*.json ./
COPY apps/backend/pnpm-lock.yaml ./
COPY apps/backend/tsconfig*.json ./
COPY apps/backend/nest-cli.json ./

# Install all dependencies (including dev dependencies)
RUN pnpm install --frozen-lockfile

COPY apps/backend/src ./src
RUN pnpm run build

# Production stage
FROM node:20-alpine AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
# Add these environment variables to prevent Husky installation
ENV HUSKY=0
ENV CI=true

WORKDIR /usr/src/app

# Install pnpm
RUN npm install -g pnpm

# Copy package files and lockfile
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /usr/src/app/dist ./dist

# Add non-root user
RUN addgroup -g 1001 nodejs && \
  adduser -S -u 1001 -G nodejs nodejs

USER nodejs

EXPOSE 3000
EXPOSE 9229

CMD ["node", "dist/main"]
