# PROSAFE — Scope lock & status checklist

Source: client document *"Projet d'Application Mobile de Sécurité et Santé au Travail (SST) : PROSAFE"* (mis à jour).
This file is the **only** scope reference. Anything not listed here is out of scope unless the client adds it.

Status: `done` · `partial` · `missing`. Apps: **B** = backend, **M** = mobile, **A** = admin web.
Last full update: 2026-11-21 (end of Phase 5). Items marked † are implemented and tested in code/web builds
but still need a check on a physical phone (camera, GPS, push delivery, native RTL) — see § Verification.

## 1. Fonctionnalités essentielles

| ID | Requirement | Apps | Status | Implementation |
|---|---|---|---|---|
| E1.1 | Employees report incidents with description, **photos, videos**, etc. | B M | done † | Up to 5 photos/videos (camera, video ≤ 60 s, gallery), notes, date, zone, department; files on disk with mime/size/magic-byte checks (`incidents`, `files`) |
| E1.2 | Precise geolocation of incident | B M | done † | Auto GPS + reverse geocoding, manual address fallback; radius filter; admin map (Leaflet) |
| E2.1 | Track available safety equipment | B M A | done | Inventory with OHS categories, condition, stock, expiry, inspections (`/equipment`, mobile Matériel SST) |
| E2.2 | Notification when equipment out of stock | B M A | done | Immediate manager notification on low/out-of-stock + daily 07:00 job (stock, expiry); push/in-app/email |
| E3.1 | Manage employee SST trainings | B M A | done | `trainings` module: catalogue, sessions, enrollments, results, certificate expiry |
| E3.2 | Notifications for upcoming trainings and renewals | B M | done | Daily reminders J-7 / J-1 for sessions, certificates expiring ≤ 30 days (user + managers) |

## 2. Fonctionnalités avancées

| ID | Requirement | Apps | Status | Implementation |
|---|---|---|---|---|
| A1 | Rewards for reporting incidents | B M | done | Points by severity/photo/location, badges, leaderboard (mobile + admin), revoked on rejection |
| A2 | Integrated messaging employees ↔ SST managers | B M A | done | Conversations with Socket.IO realtime + polling fallback; employees reach all SST managers; announcements |
| A3 | Detailed incident reports for analysis | B A | done | PDF/Excel reports (incidents, equipment, trainings, risks, audits) by period/type/department |
| A4 | Evaluate incident severity and set corrective actions | B A | done | Gravity × probability risk score, root cause, corrective actions with owners and due dates |

## 3. Fonctionnalités avancées complémentaires

| ID | Requirement | Apps | Status | Implementation |
|---|---|---|---|---|
| C1.1 | Proactive identification of SST risks | B M A | done | Risk catalogue, employee proposals, LMRA feeding proposed risks |
| C1.2 | Risk evaluation & prioritization (severity × probability) | B A | done | Score 1–25, levels low 1–4 / medium 5–9 / high 10–14 / critical 15–25 |
| C1.3 | Action plans to reduce/eliminate risks | B A | done | Action plans (owner, due date, progress) + overdue reminders |
| C1.4 | Risk matrix visualization | A M | done | 5×5 matrix in admin and mobile |
| C2.1 | Incident trend analysis over periods | B A | done | `/stats/incidents` by month/type/zone/severity/department/status |
| C2.2 | Interactive KPI dashboard (incidents/month, mean resolution time, equipment compliance rate) | B A | done | Admin dashboard and reports page built on `/stats/overview` and `/stats/kpis` (no mock data) |
| C2.3 | Forecasts from historical data | B A | done | Linear regression + 3-month moving average (`/stats/forecast`) |
| C3.1 | Internal & external audit management | B A | done | Audits with calendar, auditor, status flow |
| C3.2 | Continuous ISO 45001 compliance checks | B A | done | Seeded ISO 45001:2018 checklist (24 items), score, audit compliance rate KPI, low-score alert |
| C3.3 | History of corrective actions after audits | B A | done | Non-conformities create corrective actions (source = audit) |
| C4.1 | Automated SST training planning | B A | done | Auto-plan of missing/expired mandatory trainings (preview + confirm) |
| C4.2 | Individual employee progress tracking | B M A | done | Enrollment status/score/progress; "Mes formations" on mobile; per-user compliance in admin |
| C4.3 | Reports on acquired skills and future needs | B A | done | Skills report (acquired / expiring / missing) by department + trainings report export |
| C5.1 | Predefined emergency response scenarios | B M A | done | 4 seeded French scenarios with steps, Algerian emergency numbers, assembly point; editable |
| C5.2 | Real-time notifications to all parties on major incident | B M | done † | Emergency trigger → high-priority push on `emergency` channel + in-app + socket; full-screen alert on mobile; banners |
| C5.3 | Evacuation drill planning & simulation | B A | done | Drills planning and results (duration, participants, evacuated, observations) |

## 4. Interface — menus & sub-menus

| ID | Menu / item | Apps | Status | Implementation |
|---|---|---|---|---|
| M0.1 | Home dashboard: total incidents, by status, active alerts | M A | done | Mobile Accueil + admin overview from `/stats/overview` |
| M0.2 | Quick access: "Signaler un incident", "Voir les risques", "Accéder aux rapports" | M | done | Accueil quick buttons |
| M1.1 | Déclarer un incident (type, description, photos/videos, geolocation) | M A | done † | Mobile form + admin report form (multipart) |
| M1.2 | Incidents signalés by status + filters (date, location, type) | B M A | done | Paginated filters on mobile and admin (`/incidents/manage`, map) |
| M1.3 | Historique des incidents with resolution | B M A | done | Detail with status history timeline, evaluation, corrective actions |
| M2.1 | Catalogue des risques | B M A | done | Admin `/risks`, mobile Risques |
| M2.2 | Évaluation des risques (by employees or managers) | B M A | done | Employee proposal with live score; manager evaluation/validation |
| M2.3 | Plans d'action | B A | done | `/risks/action-plans` |
| M3.1 | Inventaire: equipment, state, location | B M A | done | `/equipment`, mobile Matériel SST with defect reporting |
| M3.2 | Maintenance & vérifications schedule | B A | done | `/equipment/maintenance` (overdue first) |
| M3.3 | Maintenance history | B A | done | `/equipment/history` |
| M4.1 | Interactive charts: incident frequency, risk types, most affected zones | B A | done | Recharts dashboards (admin) + manager charts on mobile Rapports |
| M4.2 | Automatic reports PDF/Excel by period, incident type, department | B A | done | `/reports` downloads |
| M4.3 | Statistical alerts on thresholds | B A | done | Daily incident-spike rule + critical incident alerts; `/alerts` page |
| M5.1 | Audit planning calendar | B A | done | `/audits` month calendar + list |
| M5.2 | Checklists (ISO 45001…) | B A | done | `/audits/:id` checklist execution |
| M5.3 | Compliance documents storage | B A | done | `/compliance` library with validity dates and expiry reminders |
| M6.1 | Training catalogue with description and schedule | B M A | done | Admin catalogue/sessions; mobile Catalogue + Sessions à venir |
| M6.2 | Employee enrollment | B M | done | Enroll/unenroll with capacity checks |
| M6.3 | Evaluations & participant progress | B M A | done | Status/score/progress per enrollment |
| M7.1 | User profile: personal info, role, preferences | B M A | done | Mobile Profil (edit, password); admin Profile + Settings |
| M7.2 | Notification settings (incidents, trainings, audits) | B M A | done | Per-category + push/email preferences on mobile and admin |
| M7.3 | Language & accessibility (text size, high contrast) | M A | done † | fr (default) / en / ar with RTL; text size and high contrast on both apps. Arabic texts need native-speaker review |

## 5. Autres éléments d'interface

| ID | Requirement | Apps | Status | Implementation |
|---|---|---|---|---|
| UI1 | Bottom navigation always visible: Accueil, Incidents, Rapports, Profil | M | done | Tab bar |
| UI2 | Floating "+" button to report an incident | M | done | Raised red centre button |
| UI3 | Minimalist theme: red/orange alerts, green validations | M A | done | Central palette (mobile `Colors.ts`, admin badges); high-contrast variants |

## 6. Généralités

| ID | Requirement | Apps | Status | Implementation |
|---|---|---|---|---|
| G1.1 | User data encryption; prevent SQL injection & XSS | B M A | done | bcrypt, RS256 JWT, parameterised TypeORM, ValidationPipe whitelist, helmet, rate limiting, restrictive CORS, upload magic bytes, SecureStore. **Leaked old secrets must be rotated at deploy** (`docs/DEPLOY_CHECKLIST.md`) |
| G1.2 | JWT authentication | B | done | RS256, roles guard on every route, approval workflow |
| G2 | Functional & user tests | B M A | done | Backend 192 unit + 135 e2e (real DB), admin 31 (Vitest), mobile 48 (Jest); browser smoke tests of admin and mobile web on demo data. User acceptance tests with the client still to run |
| G3.1 | Technical documentation & user guide | — | done | `docs/TECHNICAL.md`, `docs/USER_GUIDE.md` (FR), `docs/DEPLOY_CHECKLIST.md`, READMEs |
| G3.2 | API documentation with Swagger | B | done | `/api/docs` |
| G4 | In-app user feedback after deployment | B M A | done | Mobile "Donner un avis", admin `/feedback` |
| G5 | Ready for deployment (migrations, env, builds) | B M A | partial | Migrations, env examples, Dockerfile, Railway/Vercel/EAS configs, demo seed ready. Remaining operator steps: rotate secrets, set real URLs, `eas init` + prebuild, release keystore, deploy |

## Verification still requiring a physical device (†)
- Camera photo/video capture and upload, GPS accuracy (E1.1, E1.2, M1.1).
- Push notification delivery incl. emergency channel and full-screen alert (C5.2) — needs `eas init` project id and FCM/APNs credentials.
- Arabic right-to-left layout after app restart, Arabic wording review (M7.3).

## Roadmap (completed)

1. **Phase 1 — Security & foundation** — done.
2. **Phase 2 — Essentials** — done.
3. **Phase 3 — Advanced** — done.
4. **Phase 4 — Complementary** — done.
5. **Phase 5 — UX, i18n, feedback, docs, tests** — done (device checks and deployment pending).

## Decisions (defaults — confirm with client)
- Management features in **admin web**; employee features + manager summary in **mobile**.
- Media (photos/videos/documents) stored on **server disk volume** (`UPLOADS_DIR`), path in DB.
- Languages: French (default), English, Arabic (RTL).
- Roles: `admin`, `sst_manager`, `employee`, `pending`.
