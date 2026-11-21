# PROSAFE — API contract (target)

Shared contract between `apps/backend`, `apps/admin` and `apps/mobile`. Backend implements it; clients consume it.
All paths are under `/api`. Auth: `Authorization: Bearer <jwt>`. Roles: `admin`, `sst_manager` (= "manager" below), `employee`.
Lists: `?page=1&limit=20` → `{ data: T[], total, page, limit }`. Dates are ISO strings. Ids are integers unless noted.
Swagger (source of truth once implemented): `/api/docs`.

## Files (shared)
- Upload limits: images jpg/png/webp ≤ 10 MB, video mp4/quicktime ≤ 50 MB, documents pdf/docx/xlsx ≤ 20 MB.
- Stored on disk under `UPLOADS_DIR`; DB keeps `{ id, path, originalName, mimeType, size, uploadedById, createdAt }` (`stored_file` table).
- `GET /files/:id` → streams file (Phase 2A: any authenticated non-pending user; per-parent access check not implemented). Clients build URLs as `${API}/files/${id}` and send the bearer token (mobile: `Image source={{ uri, headers }}`; admin: fetch blob → object URL).

## Incidents (E1, M1)
Statuses: `open` (en attente), `investigating` (en cours), `resolved` (résolu), `closed` (clôturé / rejeté).
Types: `safety`, `security`, `hr_violation`, `environment`, `near_miss`, `equipment_failure`, `other`. Severity: `low|medium|high|critical`.
- `POST /incidents` (multipart; any role): fields `type, severity, description, notes?, date?, latitude?, longitude?, manualAddress?, zone?, department?`, files `media[]` (max 5). Location rule: lat/lng or manualAddress. Response: incident + `rewardPoints`.
- `GET /incidents` (employee: own only; manager: all) filters: `status, type, severity, from, to, zone, department, search, reporterId, lat, lng, radiusKm`, sort `createdAt desc`.
- `GET /incidents/:id` (numeric id or `INC-…` incidentId) → incident with `media[]`, `history[]`, `evaluation`, `correctiveActions[]`, `reporter {id, firstName, lastName}`.
- `PATCH /incidents/:id/status` (manager) `{ status, comment? }` → writes `incident_history { fromStatus, toStatus, comment, changedBy, changedAt }`.
- `PATCH /incidents/:id/evaluation` (manager, A4) `{ gravity 1-5, probability 1-5, rootCause?, evaluatedSeverity? }` → `riskScore = gravity*probability`.
- Legacy `GET /incidents/my-incidents` kept (alias of own list, last 10). Legacy multipart field `photo` is still accepted and treated as media.
- Implementation notes: media in responses are `[{ id (= stored file id, use with GET /files/:id), kind, mimeType }]`; `from`/`to` filter the incident `date` (`timestamp`), a date-only `to` includes the whole day; `lat,lng,radiusKm` must be sent together. Transitions: `open -> investigating|resolved|closed`, `investigating -> resolved|closed`, `resolved -> investigating|closed` (`closed` also means rejected). `reporter`/`history[].changedBy` are `{id, firstName, lastName}`. `POST /incidents` JSON (admin proxy) also accepts the legacy nested `location {lat,long,manualAddress}`. `PATCH .../status` also accepts legacy `notes` as alias of `comment`. Employees/managers/admins only (`pending` gets 403).

## Corrective actions (A4, C1.3, C3.3)
- `corrective_action { id, sourceType: incident|risk|audit, sourceId, title, description, ownerId, dueDate, status: todo|in_progress|done|cancelled, doneAt, createdById }`.
- `GET /corrective-actions?sourceType&sourceId&status&ownerId` (manager: all; employee: owned), `POST` (manager), `PATCH /:id` (manager or owner for status), `DELETE /:id` (manager).

## Equipment / inventory (E2, M3)
Existing `/inventory` kept. Item adds `condition: functional|non_functional`, `expiryDate?`, `lastInspectionAt?`, `nextInspectionAt?`.
Categories: `ppe, fire_extinguisher, first_aid, detection, signage, tools, consumables, other` (old values migrated → `other`/`tools`/`consumables`).
- `POST /inventory/:id/report-defect` (any role) `{ description }` → sets `non_functional`, notifies managers.
- Maintenance: `maintenance { id, itemId, type: inspection|preventive|corrective, scheduledAt, doneAt?, performedById?, result?: ok|issues|failed, notes?, status: planned|done|overdue|cancelled }`.
  Implementation notes (Phase 2B): `GET /inventory` returns `{ data, items (legacy alias), total, page, limit, totalPages }`, filters `category,status,condition,search,page,limit`; `report-defect` roles admin/sst_manager/employee. Inventory keeps snake_case fields (`min_stock_level`...); new fields are camelCase. Updates making an item low/out of stock notify managers immediately. `GET /maintenance` & `/maintenance/:id` readable by all non-pending roles, items embed `item {id,name,category,location,condition}` and `performedBy`. `complete` body also accepts `doneAt?` and `nextScheduledAt?` (creates the next planned maintenance, sets item `nextInspectionAt`; otherwise `nextInspectionAt` = earliest remaining planned one or null); `result` ok -> functional, failed -> non_functional, issues -> unchanged; `PATCH /maintenance/:id` accepts `type, scheduledAt, notes, status (planned|cancelled)`, completed ones are immutable (409). Daily cron (07:00 Africa/Algiers) marks past-due planned as `overdue` and notifies managers of maintenance due in <= 7 days.
  `GET /maintenance?itemId&status&from&to`, `POST /maintenance` (manager), `PATCH /maintenance/:id` (manager), `PATCH /maintenance/:id/complete { result, notes }` (manager) → updates item `lastInspectionAt` and `condition`. History = `status=done`.

## Trainings (E3, M6, C4)
- `training { id, title, description, category, durationHours, validityMonths?, mandatoryForRoles: string[], isActive }` — `GET /trainings`, `GET /trainings/:id`, `POST/PATCH/DELETE` (manager).
- `training_session { id, trainingId, startAt, endAt, location, trainer, capacity, status: planned|ongoing|completed|cancelled, enrolledCount }` — `GET /trainings/sessions?trainingId&from&to&upcoming=true`, `POST/PATCH/DELETE /trainings/sessions/:id` (manager).
- `enrollment { id, sessionId, userId, status: registered|attended|passed|failed|cancelled, score?, progress 0-100, completedAt?, expiresAt? }`.
  `POST /trainings/sessions/:id/enroll` (self; manager may pass `userId`), `DELETE /trainings/sessions/:id/enroll`, `GET /trainings/me` (my enrollments + expiry), `GET /trainings/sessions/:id/enrollments` (manager), `PATCH /trainings/enrollments/:id { status, score, progress }` (manager; passed → expiresAt = completedAt + validityMonths).
- `GET /trainings/skills-report?department` (manager, C4.3): per user acquired/expiring/missing mandatory trainings. `POST /trainings/auto-plan` (manager, C4.1): list users lacking valid mandatory trainings and notify them.

Implementation notes (Phase 2B trainings): `GET /trainings/me` is paginated (`{data,total,page,limit}`, default limit 50, cancelled excluded unless `?status=cancelled`), each item = enrollment + `session{... training{...}}` + `isExpired`, `expiresSoon` (<= 30 days). Sessions list adds `enrolledByMe`; extra `GET /trainings/sessions/:id`. Enroll: 400 for past/cancelled/completed sessions, 409 when full or already enrolled (cancelled enrollments are re-activated); `DELETE .../enroll` accepts `?userId=` for managers. `capacity` null = unlimited. Deleting a training/session that has enrollments returns 409 (deactivate / cancel instead). `GET /trainings/skills-report` is a report (not paginated): `{ department, generatedAt, summary{users,compliantUsers,complianceRate,acquired,expiring,missing}, users[{userId,firstName,lastName,department,acquired[],expiring[],missing[{trainingId,title,expired}]}] }`; mandatory = training.mandatoryForRoles overlaps user roles; expired certifications count as missing. `POST /trainings/auto-plan { department?, dryRun? }` -> `{ total, notified, dryRun, users[{..., missing[{trainingId,title,expired,nextSession}]}] }` (notifications deduped 24h). Daily cron: sessions starting in 7 and 1 days -> enrolled users; certifications expiring <= 30 days -> user + managers (at 30/14/7/1-day thresholds). Legacy `task` rows were migrated to training + one session; the `tasks` module still exists.

## Notifications (E2.2, E3.2, C5.2, M7.2)
- `notification { id, userId, type, title, body, data(json), readAt?, createdAt }`. Types: `incident, inventory, maintenance, training, audit, emergency, message, alert, system`.
- `GET /notifications` (own, paginated, `?unread=true`), `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`.
- `POST /notifications/devices { token, platform }` (Expo push token), `DELETE /notifications/devices/:token`.
- `GET /notifications/preferences` / `PUT` `{ incidents, trainings, audits, inventory, emergency, messages, push, email }` (booleans).

## Messaging (A2)
- `conversation { id, subject, participants[{id, firstName, lastName, roles}], lastMessage, unreadCount, updatedAt }`.
- `GET /conversations`, `POST /conversations { subject, body, recipientId? }` (employee without recipientId → all SST managers), `GET /conversations/:id/messages`, `POST /conversations/:id/messages { body }`, `PATCH /conversations/:id/read`.
- Realtime: Socket.IO namespace `/ws`, auth `{ token }` in handshake; events `message:new {conversationId, message}`, `notification:new`. Clients poll every 15 s if socket unavailable.
- Existing `/messages` (announcements / broadcast) kept.

## Rewards (A1)
- `GET /rewards/me`, `GET /rewards/me/summary` → `{ totalPoints, rank, badge: bronze|silver|gold|platinum|null, nextBadgeAt }`.
- `GET /rewards/leaderboard?period=month|year|all&limit=10`.
- Points granted when an incident is created; revoked when manager sets status `closed` with `rejected=true`.

## Stats & reports (A3, C2, M0, M4)
- `GET /stats/overview` → `{ incidents: { total, open, investigating, resolved, closed }, activeAlerts, criticalOpen, lowStock, overdueMaintenance, expiringTrainings }` (employee: own incident counts + global alerts).
- `GET /stats/incidents?from&to&groupBy=month|type|severity|zone|department|status` → `[{ key, count }]`.
- `GET /stats/kpis?from&to` → `{ incidentsPerMonth, meanResolutionHours, equipmentComplianceRate, trainingComplianceRate, correctiveActionsOverdue, auditComplianceRate }`.
- `GET /stats/forecast?months=3` → `{ history: [{month, count}], forecast: [{month, count, method}] }` (linear regression + 3-month moving average).
- `GET /reports/{incidents|equipment|trainings|risks|audits}?format=pdf|xlsx&from&to&type&department` → file download (manager).
- Statistical alerts: daily job creates `alert` type `incident_spike` when last-7-day count of a type > 1.5 × previous 4-week weekly average and ≥ 3.

## Alerts
Types become OHS: `incident_spike, stock, maintenance, training, emergency, compliance, risk, system`. Existing `/alerts` endpoints kept.

## Risks (C1, M2)
- `risk { id, title, description, hazardCategory, zone, department?, gravity 1-5, probability 1-5, score, level: low(1-4)|medium(5-9)|high(10-16)|critical(20-25), recommendedMeasures, status: proposed|validated|mitigated|archived, proposedById, validatedById? }`.
- `GET /risks` (all roles; employees see validated + own proposed), `GET /risks/:id` (with actionPlans), `POST /risks` (any role; employee → `proposed`), `PATCH /risks/:id` (manager), `PATCH /risks/:id/evaluate { gravity, probability }` (manager), `DELETE` (admin).
- `GET /risks/matrix` → `cells: [{ gravity, probability, count, riskIds }]`.
- Action plans: `action_plan { id, riskId, title, description, ownerId, dueDate, status: planned|in_progress|completed|validated, progress }` — `GET /action-plans?riskId&status`, `POST/PATCH/DELETE` (manager).
- LMRA: `POST /risks/lmra { task, location, hazards: [{ label, present, controlled }], decision: go|stop, comments }` → stored; uncontrolled hazards create `proposed` risks. `GET /risks/lmra` (manager: all; employee: own).

## Audits & compliance (C3, M5)
- `audit { id, title, type: internal|external, standard (e.g. ISO 45001), scheduledAt, auditorName, auditorId?, zone?, status: planned|in_progress|completed|cancelled, score?, templateId }`.
- `checklist_template { id, name, standard, items: [{ id, clause, question }] }` — seeded with ISO 45001 clauses 4–10. `GET /audits/templates`, `POST` (manager).
- `GET /audits?from&to&status&type` (calendar), `POST/PATCH/DELETE /audits/:id` (manager), `GET /audits/:id` (with responses), `PUT /audits/:id/responses [{ itemId, result: conform|non_conform|not_applicable, comment, evidenceFileId? }]` → computes score = conform / (conform + non_conform); non_conform can create corrective actions (`createActions: true`).
- `compliance_document { id, title, type: audit_report|certificate|procedure|policy|other, fileId, validUntil?, auditId? }` — `GET/POST(multipart)/DELETE /compliance-documents`.

## Emergency (C5)
- `emergency_scenario { id, title, type: fire|evacuation|chemical|injury|earthquake|gas_leak|other, steps: string[], contacts: [{ name, role, phone }], assemblyPoint, isActive }` — `GET /emergency/scenarios` (all), `POST/PATCH/DELETE` (manager).
- `POST /emergency/trigger { scenarioId?, message, zone? }` (manager) → `emergency_event`, alert, high-priority push + notification to all users. `GET /emergency/events?active=true`, `PATCH /emergency/events/:id/close`.
- `drill { id, scenarioId, scheduledAt, zone, status: planned|done|cancelled, durationSeconds?, participantsCount?, evacuatedCount?, observations? }` — `GET/POST/PATCH/DELETE /emergency/drills` (manager write, all read).

## Feedback (G4)
- `POST /feedback { rating 1-5, category: bug|suggestion|usability|other, comment, appVersion?, platform? }` (any role), `GET /feedback` (manager, paginated + `averageRating`).

## Users
- `GET /users/profile`, `PATCH /users/profile { firstName, lastName, phone?, department?, zone? }`, `PATCH /users/change-password`.
- Users get `department?`, `zone?`, `phone?` columns.
