# PROSAFE — Claude Code project guide

PROSAFE is an Occupational Health & Safety (SST / OHS) application for organizations
(companies, workshops, administrations). The client spec is the French document
"Projet d'Application Mobile SST : PROSAFE"; it is transcribed as a checklist in
**`docs/SPEC.md` — the single source of truth for scope.**

## Scope rules (read first)
- Build only what is listed in `docs/SPEC.md`. If a request is not covered there, ask before building it.
- When you finish an item, update its status in `docs/SPEC.md` (`missing` → `partial` → `done`) in the same change.
- Out of scope: the admin marketing pages (`/about`, `/blog`, `/pricing`, `/careers`…), IT-security features
  ("threat distribution", "security score"), and `apps/mobile/app-example/`. Do not extend them.
- Work phase by phase in the order given in `docs/SPEC.md` § Roadmap. Security fixes (Phase 1) come before new features.

## Monorepo
pnpm 9 workspaces + Turborepo. Node ≥ 18 (Railway uses 20).

| Path | Stack | Notes |
|---|---|---|
| `apps/backend` | NestJS 10, TypeORM 0.3, PostgreSQL, RS256 JWT, Swagger | Global prefix `/api`. Deployed on Railway (`railway.json`). |
| `apps/mobile` | Expo 52, React Native 0.76, expo-router 4, axios | Employee app (+ manager summary). Android/iOS folders are prebuilt. |
| `apps/admin` | Vite, React 18, TypeScript, Tailwind, shadcn/ui, recharts, i18next | Web back-office for admin / SST managers. Deployed on Vercel. |
| `packages/*` | shared eslint / tsconfig / ui | Rarely touched. |

## Roles
`admin` · `sst_manager` (responsable SST) · `employee` · `pending` (awaiting approval).
Management features (risk matrix, audits, reports, KPIs, user admin) live in **admin web**.
Employee flows (report incident, trainings, messages, emergency, risks view, rewards) live in **mobile**.
(Legacy roles `standard`/`premium` exist in code until Phase 1 migrates them.)

## Conventions
### Backend (`apps/backend/src`)
- One Nest module per domain: `src/<domain>/{<domain>.module,controller,service}.ts`, plus `entities/`, `dto/`, `enums/`.
- Authorization: `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(...)`. Never inline role checks with `throw new Error`.
- Errors: Nest HTTP exceptions (`ForbiddenException`, `NotFoundException`, `BadRequestException`…).
- DTOs: class-validator + `@ApiProperty`; controllers get `@ApiTags` and `@ApiBearerAuth`.
- Schema changes go through TypeORM **migrations** (`src/migrations`); `synchronize` only in development.
- List endpoints are paginated and return `{ data, total, page, limit }`.
- Uploaded media goes on disk under `UPLOADS_DIR` (default `uploads/`); the DB stores only the path and metadata.
- Scheduled jobs use `@nestjs/schedule` `@Cron` inside the owning module.

### Mobile (`apps/mobile`)
- `app/` contains routes only. Services, contexts, components, hooks, constants go in `apps/mobile/src/` (moved in Phase 1).
- All user-facing strings go through `t()` from `LanguageContext` (fr default, en, ar-DZ with RTL).
- Tokens in `expo-secure-store`; API base URL from `EXPO_PUBLIC_API_URL`.
- Native permissions and identity are configured in `app.json` (plugins) and then `expo prebuild` — never edit `android/` or `ios/` by hand.
- Platform-specific APIs (e.g. `ToastAndroid`) must be guarded by `Platform.OS`.

### Admin (`apps/admin/src`)
- All HTTP calls go through the axios instance in `services/api.ts` via a `services/<domain>Api.ts` file.
- New features are new routes/pages under `pages/` — do not keep growing `pages/Dashboard.tsx`.
- All strings via `useTranslation()`; keys must exist in `locales/en.json`, `fr.json` and `ar.json` (Arabic = RTL).

### UI (both clients)
Minimalist; red/orange = alerts & danger, green = validated/resolved. Bottom nav (mobile): Accueil, Incidents, Rapports, Profil + floating "+" button.

## Commands
```bash
pnpm install
pnpm --filter backend start:dev        # backend
pnpm --filter backend test             # backend unit tests
pnpm --filter backend test:e2e
pnpm --filter backend migration:generate src/migrations/<Name>
pnpm --filter backend migration:run
pnpm --filter admin dev | build | lint
pnpm --filter mobile start | lint
cd apps/backend && docker compose up -d postgres   # local DB
```
Check actual package names with `cat apps/*/package.json | grep '"name"'` if a filter fails.

## Never
- Commit `.env*`, backups of env files, private keys or credentials. Never log tokens or passwords.
- Add a dependency without a clear need; prefer what is already installed.
- Mix package managers: pnpm only (no npm/bun lockfiles).
- Use the `tasks` module for new training work (it is being replaced by `trainings`).

## Working efficiently (token economy)
- Do not re-audit the whole repo. Start from `docs/SPEC.md` (status + gap notes) and open only the folder you change.
- Endpoints, payloads and enums shared by the three apps are defined in `docs/API_CONTRACT.md`; follow it (update it first if the contract must change).
- Delegate per-app work to the project subagents in `.claude/agents/`:
  `backend-dev`, `mobile-dev`, `admin-dev` (implementation), `qa-tester` (tests), `spec-reviewer` (read-only review before commit).
- A feature that spans apps: backend first (API + Swagger), then admin/mobile consume it.
- Definition of done: builds, lints, relevant tests pass, Swagger documents new endpoints, `docs/SPEC.md` updated.
