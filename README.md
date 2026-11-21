# PROSAFE — Sécurité et Santé au Travail (SST)

PROSAFE is an Occupational Health & Safety application for organizations (companies, workshops, administrations):
employees report incidents from their phone, and SST managers analyse, act and prove compliance from a web back-office.

## Features
- **Incidents** — declaration with up to 5 photos/videos, GPS location, status tracking and history, severity evaluation (gravity × probability), corrective actions.
- **Safety equipment** — inventory, functional state, stock and expiry alerts, inspection/maintenance planning and history.
- **Trainings** — catalogue, sessions and enrollment, results and certificate expiry, renewal reminders, skills report and automatic planning.
- **Rewards** — points and badges for reporting, leaderboard.
- **Messaging** — realtime conversations between employees and SST managers, announcements.
- **Reports & KPIs** — interactive dashboard, trends, forecasts, threshold alerts, PDF/Excel exports.
- **Risk management** — risk catalogue, 5×5 matrix, action plans, LMRA (last-minute risk analysis).
- **Audits & compliance** — audit calendar, ISO 45001:2018 checklist, compliance documents.
- **Emergency response** — scenarios with procedures and contacts, emergency broadcast to all users, evacuation drills.
- **Notifications** — push, in-app and email with per-user preferences; French, English and Arabic (RTL); text size and high-contrast options; in-app feedback.

## Repository
```
apps/backend   NestJS API (PostgreSQL, JWT, Swagger at /api/docs, Socket.IO)
apps/admin     React web back-office for admins and SST managers
apps/mobile    Expo React Native app for employees
docs/          Specification, API contract, technical doc, user guide, deployment checklist
```

## Quick start
```bash
pnpm install
cd apps/backend && docker compose up -d postgres && cp .env.example .env && cd ../..   # then fill .env (DB, RSA keys)
pnpm --filter backend start:dev     # API on http://localhost:3000/api — docs at /api/docs
pnpm --filter admin dev             # web on http://localhost:5173
pnpm --filter mobile start          # Expo
```
The first account registered becomes the administrator.

## Documentation
| Document | Content |
|---|---|
| [`docs/SPEC.md`](docs/SPEC.md) | Client requirements checklist and status |
| [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md) | Endpoint contract shared by the three apps |
| [`docs/TECHNICAL.md`](docs/TECHNICAL.md) | Architecture, modules, security, environment, tests, deployment |
| [`docs/USER_GUIDE.md`](docs/USER_GUIDE.md) | Guide utilisateur (FR) — mobile app and web back-office |
| [`docs/DEPLOY_CHECKLIST.md`](docs/DEPLOY_CHECKLIST.md) | Step-by-step production release |
| [`apps/backend/README.md`](apps/backend/README.md) | Backend setup, scripts and migrations |

## License
MIT
