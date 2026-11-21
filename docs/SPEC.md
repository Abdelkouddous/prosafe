# PROSAFE — Scope lock & status checklist

Source: client document *"Projet d'Application Mobile de Sécurité et Santé au Travail (SST) : PROSAFE"* (mis à jour).
This file is the **only** scope reference. Anything not listed here is out of scope unless the client adds it.

Status: `done` · `partial` · `missing`. Apps: **B** = backend, **M** = mobile, **A** = admin web.
Statuses below were seeded from the code audit of v1.0.0 (2026-11). Update them as work lands.

## 1. Fonctionnalités essentielles

| ID | Requirement | Apps | Status | Gap notes (v1.0.0) |
|---|---|---|---|---|
| E1.1 | Employees report incidents with description, **photos, videos**, etc. | B M | partial | Backend done (Phase 2A): multipart `media[]` up to 5 images/videos on disk (`stored_file`, `incident_media`), notes/date/zone/department honoured. Mobile still sends a single photo; no video/camera yet; Mobile done: report form with photo/video capture, gallery multi-select (max 5, size/type checks), upload progress, reward points shown, full reset |
| E1.2 | Precise geolocation of incident | B M | partial | Backend stores latitude/longitude or manualAddress (flat multipart fields) and filters by radius. Mobile: `app.json` lacks location/image-picker permission plugins; Mobile done: auto GPS + reverse geocode with manual address fallback; location plugins already in app.json |
| E2.1 | Track available safety equipment | B M A | partial | Inventory CRUD works; categories are generic (electronics, furniture…) |
| E2.2 | Notification when equipment out of stock | B M A | missing | Status recomputed on update only; no notification, no cron |
| E3.1 | Manage employee SST trainings | B M A | partial | Implemented on top of `tasks`; no per-user enrollment |
| E3.2 | Notifications for upcoming trainings and renewals | B M | missing | No renewal date, no push/email reminders (admin "send reminders" is fake) |

## 2. Fonctionnalités avancées

| ID | Requirement | Apps | Status | Gap notes |
|---|---|---|---|---|
| A1 | Rewards for reporting incidents | B M | partial | Points on creation (severity + photo + location); no revocation, leaderboard or rewards screen |
| A2 | Integrated messaging employees ↔ SST managers | B M A | partial | Admin broadcast inbox only; no employee→manager, no replies, no real-time; `GET /messages` leaks all messages; `my-messages` route shadowed |
| A3 | Detailed incident reports for analysis | B A | missing | No report generation/export |
| A4 | Evaluate incident severity and set corrective actions | B A | missing | Severity is reporter-chosen only; no corrective actions |

## 3. Fonctionnalités avancées complémentaires

| ID | Requirement | Apps | Status | Gap notes |
|---|---|---|---|---|
| C1.1 | Proactive identification of SST risks | B M A | missing | Mobile LMRA screen is fake (nothing submitted) |
| C1.2 | Risk evaluation & prioritization (severity × probability) | B A | missing | |
| C1.3 | Action plans to reduce/eliminate risks | B A | missing | |
| C1.4 | Risk matrix visualization | A M | missing | |
| C2.1 | Incident trend analysis over periods | B A | partial | Admin builds a by-month chart client-side (merges years, capped at 100) |
| C2.2 | Interactive KPI dashboard (incidents/month, mean resolution time, equipment compliance rate) | B A | partial | Most admin KPI cards are hardcoded |
| C2.3 | Forecasts from historical data | B A | missing | |
| C3.1 | Internal & external audit management | B A | missing | |
| C3.2 | Continuous ISO 45001 compliance checks | B A | missing | |
| C3.3 | History of corrective actions after audits | B A | missing | |
| C4.1 | Automated SST training planning | B A | missing | |
| C4.2 | Individual employee progress tracking | B M A | missing | |
| C4.3 | Reports on acquired skills and future needs | B A | missing | |
| C5.1 | Predefined emergency response scenarios | B M A | missing | Only static text in mobile Information/Safety manual |
| C5.2 | Real-time notifications to all parties on major incident | B M | partial | Backend push + in-app notifications done (Phase 2A); emergency trigger pending (Phase 4). Mobile client side done (expo-notifications, device registration, emergency channel, tap routing); needs EAS projectId + prebuild; backend trigger exists |
| C5.3 | Evacuation drill planning & simulation | B A | missing | |

## 4. Interface — menus & sub-menus

| ID | Menu / item | Apps | Status | Gap notes |
|---|---|---|---|---|
| M0.1 | Home dashboard: total incidents, by status (pending / in progress / resolved), active alerts | M A | partial | Mobile employee home is a static grid; admin KPIs mostly hardcoded |
| M0.2 | Quick access: "Signaler un incident", "Voir les risques", "Accéder aux rapports" | M | partial | Only report/view incidents |
| M1.1 | Déclarer un incident (type, description, photos/videos, geolocation) | M A | partial | Backend done (see E1); admin/mobile UI pending; Mobile done (see E1.1); admin UI pending |
| M1.2 | Incidents signalés by status + filters (date, location, type) | B M A | partial | Backend done: paginated `GET /incidents` with status/type/severity/from/to/zone/department/search/reporterId/lat,lng,radiusKm; admin UI done (`/incidents/manage`: filters, paginated table, map toggle); mobile UI pending; Mobile done: paginated list, status/type/period filters, search, pull-to-refresh |
| M1.3 | Historique des incidents with resolution | B M A | partial | Backend done: `GET /incidents/:id` (numeric or INC- code) with media, ordered `incident_history`, reporter; `PATCH /incidents/:id/status {status, comment?}`; admin UI done (detail sheet: media via blob URLs, map, history timeline, status change with comment); mobile UI pending; Mobile done: `app/incident/[id].tsx` detail with media viewer, maps link, history timeline; admin UI pending |
| M2.1 | Catalogue des risques (description, gravity, recommended solutions) | B M A | missing | |
| M2.2 | Évaluation des risques (by employees or managers) | B M A | missing | |
| M2.3 | Plans d'action (in progress / validated) | B A | missing | |
| M3.1 | Inventaire: equipment, state (functional / non-functional), location | B M A | partial | No functional state field |
| M3.2 | Maintenance & vérifications schedule | B A | missing | |
| M3.3 | Maintenance history | B A | missing | |
| M4.1 | Interactive charts: incident frequency, risk types, most affected zones | B A | partial | Only incidents by month |
| M4.2 | Automatic reports PDF/Excel by period, incident type, department | B A | missing | No department field yet |
| M4.3 | Statistical alerts on thresholds (e.g. sudden rise of an incident type) | B A | missing | |
| M5.1 | Audit planning calendar (internal/external) | B A | missing | |
| M5.2 | Checklists (ISO 45001…) | B A | missing | |
| M5.3 | Compliance documents storage (audit reports, certifications) | B A | missing | |
| M6.1 | Training catalogue with description and schedule | B M A | partial | |
| M6.2 | Employee enrollment | B M | missing | `currentParticipants` never incremented |
| M6.3 | Evaluations & participant progress | B M A | missing | |
| M7.1 | User profile: personal info, role, preferences | B M A | partial | Mobile profile read-only |
| M7.2 | Notification settings (incidents, trainings, audits) | B M A | partial | Backend done: `GET/PUT /notifications/preferences`, devices, list/read, Expo push + email dispatch (`NotificationsService`); admin UI done (header bell with 60s unread polling, Settings/Dashboard preferences via `/notifications/preferences`); mobile UI pending; Mobile done: preferences switches in Profil |
| M7.3 | Language & accessibility (text size, high contrast) | M A | partial | i18n set up (fr/en/ar) but barely applied; no accessibility options; Arabic RTL not applied in admin |

## 5. Autres éléments d'interface

| ID | Requirement | Apps | Status | Gap notes |
|---|---|---|---|---|
| UI1 | Bottom navigation always visible: Accueil, Incidents, Rapports, Profil | M | partial | 7 tabs incl. Logout; no Rapports |
| UI2 | Floating "+" button to report an incident / add a task | M | missing | |
| UI3 | Minimalist theme: red/orange alerts, green validations | M A | partial | |

## 6. Généralités

| ID | Requirement | Apps | Status | Gap notes |
|---|---|---|---|---|
| G1.1 | User data encryption; prevent SQL injection & XSS | B M A | partial | bcrypt (single lib) + TypeORM params + ValidationPipe + helmet OK; password column `select:false`; backend: committed env backups removed from the tree + `@nestjs/throttler` (100/min global, 5/min login/register) + configurable CORS. **Still to do: secrets remain in git history, rotate the old RSA keys/DB credentials**; mobile: tokens in SecureStore (web fallback), token logging removed |
| G1.2 | JWT authentication | B | done | RS256; roles `admin`/`sst_manager`/`employee`/`pending`; first user = admin, no email-based admin; all routes guarded via `JwtAuthGuard` + `RolesGuard` + `@Roles`; `RolesGuard` throws 403; admin web/mobile still to be aligned with the new role names (Phase 1 clients) |
| G2 | Functional & user tests | B M A | partial | Backend: unit specs with mocked repos (roles guard, auth, users, incidents, messages, tasks) + e2e health-check; mobile/admin tests missing |
| G3.1 | Technical documentation & user guide | — | missing | README is generic/boilerplate |
| G3.2 | API documentation with Swagger | B | done | `/api/docs`, "PROSAFE API" v1.0, bearer auth, `@ApiTags`/`@ApiBearerAuth` on all controllers, `@ApiProperty` on all DTOs (response schemas not yet typed) |
| G4 | In-app user feedback after deployment | B M A | missing | |
| G5 | Ready for deployment (migrations, env, builds) | B M A | partial | Backend done: migrations (`Init`, `MapLegacyRoles`), `synchronize` off, `migrationsRun`, monorepo-root Dockerfile + compose, `.env.example` with placeholders, README. Existing prod DB must baseline `Init` (see backend README); `railway.json` untouched. Mobile identity set to `com.prosafe.app` + `eas.json` added (needs `expo prebuild`; release keystore still to do) |

## Roadmap (execution order)

1. **Phase 1 — Security & foundation**: G1, G1.2, G5, junk cleanup, roles `sst_manager`/`employee`, Swagger setup, migrations, mobile `src/` restructure + SecureStore + identity/permissions.
2. **Phase 2 — Essentials**: E1, E2, E3, M1, M3, M6, notifications infrastructure (push + email + preferences).
3. **Phase 3 — Advanced**: A1–A4, M0, M4, C2.1–C2.2.
4. **Phase 4 — Complementary**: C1, C2.3, C3, C4, C5, M2, M5.
5. **Phase 5 — UX, i18n, feedback, docs, tests**: M7, UI1–UI3, G2, G3, G4.

## Decisions (defaults — confirm with client)
- Management features in **admin web**; employee features + manager summary in **mobile**.
- Media (photos/videos/documents) stored on **server disk volume** (`UPLOADS_DIR`), path in DB.
- Languages: French (default), English, Arabic (RTL).
- Roles: `admin`, `sst_manager`, `employee`, `pending`.
