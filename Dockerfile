FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/admin/package.json ./apps/admin/

RUN npm install

COPY . .

RUN npm run build

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["npx", "tsx", "server.ts"]
