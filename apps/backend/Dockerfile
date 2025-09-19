# Build stage
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Install pnpm
RUN npm install -g pnpm

COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Install all dependencies (including dev dependencies) without frozen lockfile
RUN pnpm install

COPY . .
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

COPY package*.json ./

# Install only production dependencies without frozen lockfile
RUN pnpm install --prod

COPY --from=builder /usr/src/app/dist ./dist

# Add non-root user
RUN addgroup -g 1001 nodejs && \
  adduser -S -u 1001 -G nodejs nodejs

USER nodejs

EXPOSE 3000
EXPOSE 9229

CMD ["node", "dist/main"]
