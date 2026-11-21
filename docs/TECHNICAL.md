# PROSAFE — Technical documentation

## 1. Architecture

```
                 ┌────────────────────┐        ┌─────────────────────┐
 Employees  ───► │  Mobile app (Expo) │──┐     │ Admin web (Vite/React)│ ◄─── Admins / SST managers
                 └────────────────────┘  │     └──────────┬──────────┘
                                         │ HTTPS + JWT     │
                                         ▼                 ▼
                              ┌──────────────────────────────────┐
                              │  Backend API (NestJS)  /api/*     │── Swagger /api/docs
                              │  Socket.IO /ws (realtime)         │
                              │  Cron jobs (Africa/Algiers)       │
                              └───────┬───────────┬──────────────┘
                                      │           │
                           PostgreSQL ▼           ▼ Disk volume (UPLOADS_DIR)
                                          Expo Push API · SMTP (emails)
```

Monorepo (pnpm workspaces + Turborepo):

| Path | Stack |
|---|---|
| `apps/backend` | NestJS 10, TypeORM 0.3, PostgreSQL 16, RS256 JWT, Swagger, Socket.IO, @nestjs/schedule, pdfkit, exceljs, expo-server-sdk |
| `apps/admin` | Vite, React 18, TypeScript, Tailwind + shadcn/ui, recharts, react-leaflet, i18next (fr/en/ar), socket.io-client |
| `apps/mobile` | Expo SDK 52, React Native 0.76, expo-router 4, expo-secure-store, expo-location, expo-image-picker, expo-video, expo-notifications, socket.io-client |

Scope and per-requirement status: `docs/SPEC.md`. Endpoint contract shared by the three apps: `docs/API_CONTRACT.md`. Live API reference: Swagger at `/api/docs`.

## 2. Roles and permissions

| Role | Access |
|---|---|
| `admin` | Everything, including user administration (approve, block, change role, delete) |
| `sst_manager` | All SST management features (incidents, risks, audits, equipment, trainings, reports, emergency) — no user administration |
| `employee` | Report incidents, own incidents, trainings enrollment, messages with SST managers, risks catalogue/proposals, LMRA, emergency procedures, feedback |
| `pending` | Registered, waiting for approval — cannot log in |

The first account ever registered becomes `admin`; every other registration is `pending` until approved.
Enforcement: `JwtAuthGuard` + `RolesGuard` + `@Roles()` on every controller (`apps/backend/src/auth/strategy/`, `src/custom.decorator.ts`). Employees are always restricted to their own data in services.

## 3. Backend modules (`apps/backend/src`)

| Module | Responsibility |
|---|---|
| `auth`, `users` | Registration, login (RS256 JWT, 24 h), approval workflow, profile, password change, manager user list |
| `incidents` | Declaration with up to 5 photos/videos, geolocation, filters, status history, evaluation (gravity × probability), rejection |
| `files` | Disk storage under `UPLOADS_DIR`, mime/size limits + magic-byte validation, authenticated streaming `GET /files/:id` |
| `notifications` | In-app notifications, Expo push (channels `default` / `emergency`), email for high priority, per-user preferences, 24 h dedupe helpers |
| `realtime` | Socket.IO gateway `/ws` (JWT handshake, rooms `user:<id>`, events `message:new`, `notification:new`) |
| `inventory`, `maintenance` | Safety equipment, condition, expiry, inspections planning/history, defect reporting |
| `trainings` | Catalogue, sessions, enrollments, results and certificate expiry, skills report, auto-planning |
| `rewards` | Points per reported incident, badges, leaderboard, revocation on rejection |
| `messaging` / `messages` | Employee ↔ SST manager conversations / admin announcements |
| `corrective-actions` | Actions linked to incidents, risks or audits |
| `risks` | Risk catalogue, 5×5 matrix, action plans, LMRA |
| `audits` | Audits, ISO 45001:2018 checklist (seeded), responses and score, compliance documents |
| `emergency` | Scenarios (seeded), emergency trigger broadcast, drills |
| `stats`, `reports` | KPIs, trends, forecast; PDF/Excel exports |
| `alerts` | OHS alerts (incident spike, critical incident, stock, maintenance, compliance, emergency…) |
| `feedback` | User feedback (rating + comment) |
| `tasks` | Legacy module kept for backward compatibility (replaced by `trainings`) |

### Scheduled jobs (timezone Africa/Algiers)
| Time | Job |
|---|---|
| 06:30 | Incident spike detection → alert + managers |
| 07:00 | Low/out-of-stock & expiring equipment; maintenance due/overdue; training session reminders (J-7, J-1); expiring certifications |
| 07:15 | Audit reminders (J-7, J-1) |
| 07:20 | Compliance documents expiring ≤ 30 days |
| 07:30 | Overdue corrective actions |
| 07:45 | Overdue action plans |

### Security measures
- Passwords hashed with bcrypt; password column never selected in relations.
- RS256 JWT; keys only in environment variables.
- Global `ValidationPipe` (whitelist + forbidNonWhitelisted), TypeORM parameterised queries (SQL injection), helmet headers, React/React Native escaping (XSS).
- Rate limiting: 100 req/min per IP, 5 req/min per IP+email on login/register; `trust proxy` enabled for Railway.
- CORS restricted to `CORS_ORIGINS` (open only when `NODE_ENV=development`).
- Uploads: mime whitelist, size limits, magic-byte verification, random file names.
- Mobile tokens in the device keychain (expo-secure-store); admin clears session on 401.

## 4. Database & migrations
Schema is managed only by TypeORM migrations (`apps/backend/src/migrations`), executed automatically at boot (`migrationsRun: true`, `synchronize: false`).

```bash
pnpm --filter backend migration:generate src/migrations/<Name>   # after entity changes
pnpm --filter backend migration:run
pnpm --filter backend migration:revert
```
Seed migrations insert the ISO 45001:2018 checklist template (24 items) and 4 emergency scenarios.

**Existing production database created by the old `synchronize` mode:** before the first deploy, mark the `Init` migration as applied (see `apps/backend/README.md`), then the later migrations run normally.

## 5. Environment variables

### Backend (`apps/backend/.env`, see `.env.example`)
| Variable | Purpose |
|---|---|
| `POSTGRES_HOST/PORT/USER/PASSWORD/DB/SSL` | Database connection |
| `PORT` | HTTP port (default 3000) |
| `NODE_ENV` | `development` or `production` |
| `PRIVATE_KEY`, `PUBLIC_KEY` | RSA key pair for JWT (`openssl genrsa -out private.pem 2048`; `openssl rsa -in private.pem -pubout -out public.pem`; newlines as `\n`) |
| `UPLOADS_DIR` | Media/documents directory — **must be a persistent volume in production** |
| `CORS_ORIGINS` | Comma-separated allowed origins (admin web URL…) |
| `TRUST_PROXY` | Proxy hops to trust (default 1) |
| `THROTTLE_LIMIT` | Global requests per minute |
| `MAIL_HOST/PORT/SECURE/USER/PASSWORD/FROM` | SMTP for verification and high-priority emails |
| `APP_BASE_URL` | Public backend URL used in emails |

### Admin (`apps/admin/.env`)
`VITE_API_URL=https://<backend>/api`

### Mobile (`apps/mobile/.env` / `eas.json` env)
`EXPO_PUBLIC_API_URL=https://<backend>/api`. Push notifications also require `extra.eas.projectId` in `app.json` (`eas init`).

## 6. Local development
```bash
pnpm install
# PostgreSQL 16 (docker or local)
cd apps/backend && docker compose up -d postgres && cd ../..
cp apps/backend/.env.example apps/backend/.env   # fill DB + generate RSA keys
pnpm --filter backend start:dev                  # http://localhost:3000/api, docs at /api/docs
pnpm --filter admin dev                          # http://localhost:5173 (add it to CORS_ORIGINS)
pnpm --filter mobile start                       # Expo (Android emulator uses http://10.0.2.2:3000/api)
```
The first account registered becomes admin. For a ready-made demo dataset run `pnpm --filter backend seed` (dev databases only).

## 7. Tests & quality
```bash
pnpm --filter backend test        # unit tests (mocked repositories)
pnpm --filter backend test:e2e    # API tests against PostgreSQL database prosafe_test
pnpm --filter backend lint
pnpm --filter admin build && pnpm --filter admin lint && pnpm --filter admin check-types && pnpm --filter admin test
cd apps/mobile && npx tsc --noEmit && pnpm lint && npx jest && npx expo export --platform web --clear
```

## 8. Deployment
- **Backend (Railway):** Nixpacks build of the monorepo, start command `cd apps/backend && pnpm start:prod`. Attach a PostgreSQL service and a volume mounted at `UPLOADS_DIR`. Alternative: `apps/backend/Dockerfile` (build context = repo root).
- **Admin (Vercel):** project root `apps/admin`, install `pnpm install`, build `pnpm build`, output `dist`, env `VITE_API_URL`.
- **Mobile:** `eas init` (project id), set `EXPO_PUBLIC_API_URL` in `eas.json` profiles, `npx expo prebuild --clean`, then `eas build -p android --profile preview` (APK) or `--profile production` (store). Create a release keystore (EAS manages it by default).

See `docs/DEPLOY_CHECKLIST.md` for the step-by-step release list.
