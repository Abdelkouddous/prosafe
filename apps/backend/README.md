# PROSAFE Backend

REST API of PROSAFE, the Occupational Health & Safety (SST) application.
NestJS 10, TypeORM 0.3, PostgreSQL, RS256 JWT. Global prefix: `/api`.

- Swagger UI: `http://localhost:3000/api/docs` (JSON: `/api/docs-json`)
- Health check: `GET /api/health-check`
- Scope and status of features: `docs/SPEC.md` at the repository root.

## Setup

```bash
pnpm install                              # from the repository root
cd apps/backend
cp .env.example .env                      # then fill in the values (never commit .env)
docker compose up -d postgres             # local PostgreSQL (or use your own)
pnpm start:dev                            # migrations run automatically at boot
```

Generate the JWT key pair (RS256) and paste them in `.env` with `\n` for line breaks:

```bash
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem
```

## Environment variables

| Variable | Description |
|---|---|
| `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Database connection |
| `POSTGRES_SSL` | `true` to enable SSL (self-signed accepted) |
| `PORT` | HTTP port (default 3000) |
| `NODE_ENV` | `development` or `production` |
| `PRIVATE_KEY`, `PUBLIC_KEY` | RS256 key pair for JWT signing / verification |
| `UPLOADS_DIR` | Directory for uploaded files (default `uploads`) |
| `CORS_ORIGINS` | Comma-separated allowed origins. Empty = built-in defaults (any origin in dev, admin Vercel domains + localhost in production) |
| `THROTTLE_LIMIT` | Max requests per minute per IP (default 100). `/auth/login` and `/auth/register` are fixed at 5/min |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_SECURE`, `MAIL_USER`, `MAIL_PASSWORD`, `MAIL_FROM` | SMTP for verification emails |
| `APP_BASE_URL` | Public base URL of the API, used in email links |

## Scripts

| Script | Purpose |
|---|---|
| `pnpm start:dev` | Run with watch mode |
| `pnpm build` | Compile to `dist/` (migrations included) |
| `pnpm start:prod` | `node dist/main` |
| `pnpm test` / `pnpm test:cov` | Unit tests (mocked repositories) |
| `pnpm test:e2e` | E2E tests, need PostgreSQL; use the `prosafe_test` database (override with `POSTGRES_DB_TEST`) |
| `pnpm lint` / `pnpm format` | ESLint / Prettier |
| `pnpm seed` | Load the demo dataset (see [Demo data](#demo-data)) |

## Demo data

`pnpm seed` fills the database configured in `.env` with a realistic demo site (industrial plant in Tébessa, French content):
9 users, ~40 incidents over the last 12 months (history, evaluations, corrective actions, rewards), 25 equipment items
with maintenance plan, 5 trainings with sessions / enrollments / certificates, 12 risks with action plans, 3 LMRA records,
2 audits (one scored on the ISO 45001 template), 2 compliance documents (placeholder PDFs in `UPLOADS_DIR`), 2 drills,
a conversation, announcements, feedback and notifications. There is no active emergency event.

```bash
pnpm migration:run   # the seed also runs pending migrations
pnpm seed
```

The seed is skipped when the marker user `admin@prosafe.demo` already exists (to re-seed, empty the database first,
e.g. `pnpm drop:database && pnpm migration:run`). It refuses to run with `NODE_ENV=production` unless `--force` is passed
(`pnpm seed -- --force`).

All accounts use the password **`Prosafe2026!`**:

| Role | Email |
|---|---|
| `admin` | `admin@prosafe.demo` |
| `sst_manager` | `salima.ouali@prosafe.demo`, `mourad.kaci@prosafe.demo` |
| `employee` | `karim.benali@prosafe.demo` (Production, Atelier A), `amina.boudiaf@prosafe.demo` (Production, Atelier B), `yacine.messaoudi@prosafe.demo` (Maintenance, Atelier A), `sofiane.hamdi@prosafe.demo` (Logistique, Entrepôt), `nadia.cherif@prosafe.demo` (Administration, Bureaux), `rachid.taleb@prosafe.demo` (Maintenance, Atelier B) |

> **Warning: demo data only. Never run the seed against a production database; the accounts above have a publicly documented password.**

## Roles

`admin`, `sst_manager`, `employee`, `pending` (awaiting approval).
The first user ever registered becomes `admin`; everyone else is `pending` until an admin approves them.
Routes are protected with `@UseGuards(JwtAuthGuard, RolesGuard)` and `@Roles(...)`.

## Migrations

`synchronize` is always off. The schema is managed by TypeORM migrations in `src/migrations`,
applied automatically at boot (`migrationsRun`, compiled files in `dist/migrations`).

```bash
pnpm migration:generate src/migrations/AddSomething   # diff entities vs DB, then REVIEW the SQL
pnpm migration:run                                     # apply manually (CLI, uses src/config/data-source.ts)
pnpm migration:revert                                  # revert the last migration
```

Existing database created by the old `synchronize` mode: do not run `Init` on it. Mark it as already applied first:

```sql
INSERT INTO migrations ("timestamp", "name") VALUES (1795278357168, 'Init1795278357168');
```

(create the `migrations` table with `CREATE TABLE migrations (id SERIAL PRIMARY KEY, "timestamp" bigint NOT NULL, name varchar NOT NULL)` if it does not exist), then start the app: the remaining migrations (e.g. legacy role mapping) run normally.

## Docker

Build context is the monorepo root:

```bash
docker build -f apps/backend/Dockerfile -t prosafe-backend .
cd apps/backend && docker compose up -d --build
```
