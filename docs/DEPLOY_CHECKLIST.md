# PROSAFE — Deployment checklist

## 0. Security first (one time)
- [ ] **Rotate the leaked secrets**: the old DB password and RSA JWT keys were committed in `apps/backend/.env_backup` / `.env.local_backup_*` (removed from the tree but still in git history). Change the production DB password and generate a new key pair. All existing sessions become invalid — users simply log in again.
- [ ] Optionally purge the files from git history (`git filter-repo --path apps/backend/.env_backup --path apps/backend/.env.local_backup_20250918_215922 --invert-paths`, then force-push — coordinate with everyone using the repo).
- [ ] If an account was admin only because of the old `admin@prosafe.dz` rule, grant it explicitly after deploy:
  `UPDATE "user" SET roles = 'admin', "isActive" = true WHERE email = '<email>';`

## 1. Backend (Railway)
- [ ] PostgreSQL service attached; set `POSTGRES_*`, `POSTGRES_SSL=true` if required.
- [ ] Volume mounted, `UPLOADS_DIR` pointing to it (photos, videos, documents; also used by the photo migration).
- [ ] `NODE_ENV=production`, `PORT`, new `PRIVATE_KEY` / `PUBLIC_KEY`, `CORS_ORIGINS=<admin URL>`, `TRUST_PROXY=1`, `APP_BASE_URL`, SMTP `MAIL_*`.
- [ ] **Existing database created by `synchronize`**: before first boot run
  `INSERT INTO migrations ("timestamp", name) VALUES (1795278357168, 'Init1795278357168');`
  (create the `migrations` table first if absent — see `apps/backend/README.md`). New databases need nothing.
- [ ] Deploy; migrations run at boot. Check `GET /api/health-check` → `{"message":"up"}` and `/api/docs`.
- [ ] Register the first admin account (first user ever) or use the existing one.

## 2. Admin web (Vercel)
- [ ] Root directory `apps/admin`, install `pnpm install`, build `pnpm build`, output `dist`.
- [ ] `VITE_API_URL=https://<backend>/api`.
- [ ] Log in, check dashboard, incidents map, reports download.

## 3. Mobile (EAS)
- [ ] `cd apps/mobile && eas init` (adds `extra.eas.projectId`, required for push).
- [ ] Replace `REPLACE-ME` URLs in `eas.json` with `https://<backend>/api`.
- [ ] `npx expo prebuild --clean` (applies `com.prosafe.app`, permissions, notification channels).
- [ ] Push credentials: FCM (Android) / APNs (iOS) configured in EAS.
- [ ] `eas build -p android --profile preview` → install APK, test: login, report incident with photo/video + GPS, receive push, emergency alert, trainings enrollment, messaging.
- [ ] `eas build --profile production` and submit to the stores.

## 4. Post-deployment
- [ ] Create SST manager accounts, approve employees.
- [ ] Fill equipment inventory, maintenance plan, training catalogue and sessions, risk catalogue, emergency scenario contacts and assembly points (seeded scenarios are generic).
- [ ] Ask a native Arabic speaker to review the Arabic translations.
- [ ] Collect feedback (in-app "Donner un avis", admin page **Avis**).
