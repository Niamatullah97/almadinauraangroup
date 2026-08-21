# Kabootar — Production Deployment Guide

Complete guide for deploying the Pigeon Tournament Management System to production.

---

## Deployment Checklist

### Pre-deploy

- [ ] Copy `.env.production.example` to `.env` and fill all secrets
- [ ] Generate strong `JWT_SECRET` (64+ random characters)
- [ ] Set strong `POSTGRES_PASSWORD` (20+ characters)
- [ ] Configure `CORS_ORIGINS` with exact production domains (no wildcards)
- [ ] Point DNS A records to server IP (`yourdomain.com`, `admin.yourdomain.com`)
- [ ] Obtain TLS certificate (Let's Encrypt via Certbot)
- [ ] Review security checklist (`docs/SECURITY-CHECKLIST.md`)

### Database

- [ ] Create initial migration if none exists (see Database Migration Commands below)
- [ ] Run `pnpm db:migrate:deploy` on production database
- [ ] Run `pnpm db:seed` once on first deploy (`RUN_DB_SEED=true` in Docker)
- [ ] Verify super admin login and change default password immediately
- [ ] Confirm backup cron job is scheduled

### Build & deploy

- [ ] Run `pnpm test:ci` locally or via CI — all tests pass
- [ ] Run `pnpm build` — all apps build successfully
- [ ] Build Docker images: `pnpm docker:prod:up`
- [ ] Verify health endpoints: `GET /api/v1/health`
- [ ] Smoke test admin login, tournament list, public website

### Post-deploy

- [ ] Disable Swagger in production (automatic when `NODE_ENV=production`)
- [ ] Confirm rate limiting is active on auth endpoints
- [ ] Monitor logs for 5xx errors in first 24 hours
- [ ] Run first database backup manually and verify restore procedure
- [ ] Document production URLs and credentials in secure vault

---

## Testing Checklist

### Unit tests (target: ≥80% coverage on application services)

Current CI gate: **≥70%** lines/statements on `**/application/**/*.service.ts`. Target 80% for production sign-off.

- [ ] `pnpm --filter @kabootar/shared test:ci` (≥80%)
- [ ] `pnpm --filter @kabootar/api test:ci` (≥70% services, target 80%)
- [ ] `pnpm --filter @kabootar/admin test:ci`
- [ ] `pnpm --filter @kabootar/web test:ci`

### E2E tests

- [ ] `pnpm --filter @kabootar/api test:e2e` — health, auth validation, public routes
- [ ] Manual: admin login → create tournament → add registration → enter landing time
- [ ] Manual: public website shows tournaments and results pages
- [ ] Manual: download reports (PDF/Excel) from admin

### Pre-release regression

- [ ] Auth: login, logout, token refresh, invalid credentials rejected
- [ ] Tournaments: CRUD, banner upload, race days
- [ ] Registrations: create, payment recording, pigeon assignment
- [ ] Landing times: entry sheet, bulk save
- [ ] Results: daily, total, double-stamp calculations
- [ ] Reports: all five report downloads succeed

---

## Security Checklist

See full details in `docs/SECURITY-CHECKLIST.md`.

- [ ] `JWT_SECRET` ≥ 32 characters in production
- [ ] Database credentials not exposed in client apps
- [ ] HTTPS enforced on all public endpoints
- [ ] CORS restricted to known origins
- [ ] Rate limiting enabled (global 100/min, auth 10/min login)
- [ ] Helmet security headers active
- [ ] Input validation on all API endpoints (`ValidationPipe`)
- [ ] RBAC permissions enforced on protected routes
- [ ] Default super admin password changed after seed
- [ ] File upload size limits configured (10 MB nginx)
- [ ] Error responses do not leak stack traces to clients
- [ ] Request IDs logged for error tracing (`X-Request-Id`)
- [ ] Dependencies audited: `pnpm audit`

---

## Database Migration Commands

```bash
# 1. Generate Prisma client (required after schema changes)
pnpm db:generate

# 2. Create a new migration (development only)
pnpm db:migrate
# or with name:
pnpm --filter @kabootar/database exec prisma migrate dev --name describe_change

# 3. Apply migrations in production (safe, non-interactive)
pnpm db:migrate:deploy

# 4. Seed roles, permissions, and super admin (first deploy only)
pnpm db:seed

# 5. Create initial migration from existing schema (one-time setup)
cd packages/database && sh scripts/create-initial-migration.sh

# 6. Check migration status
pnpm --filter @kabootar/database exec prisma migrate status

# 7. Reset database (DEVELOPMENT ONLY — destroys all data)
pnpm --filter @kabootar/database exec prisma migrate reset
```

### Docker production flow

```bash
cp .env.production.example .env
# Edit .env with production values

# First deploy: enable seed
RUN_DB_SEED=true pnpm docker:prod:up

# Subsequent deploys
pnpm docker:prod:up
```

The API container entrypoint runs `migrate:deploy` automatically on every start.

---

## Backup Plan

### Automated daily backup (cron)

```bash
# Add to crontab on VPS (daily at 2 AM)
0 2 * * * cd /opt/kabootar && ./scripts/backup-database.sh /opt/kabootar/backups >> /var/log/kabootar-backup.log 2>&1
```

### Manual backup

```bash
./scripts/backup-database.sh ./backups
```

### Restore

```bash
gunzip -c backups/kabootar_YYYYMMDD_HHMMSS.sql.gz | \
  docker exec -i kabootar-postgres psql -U kabootar kabootar
```

### Retention policy

- Keep daily backups for 7 days
- Keep weekly backups for 4 weeks
- Store off-site copy (Hostinger backup service or S3-compatible storage)

---

## Error Logging

Production logging uses structured JSON via NestJS `Logger`:

- **HTTP requests:** method, path, status, duration, request ID
- **Unhandled errors:** message, stack, request ID (server-side only)
- **Log destination:** Docker stdout → `docker logs kabootar-api`

Recommended upgrades for production:

1. Ship logs to Hostinger log manager or external service (Datadog, Logtail)
2. Add Sentry for error alerting (`SENTRY_DSN` — future integration)
3. Set up uptime monitoring on `/api/v1/health`

---

## Environment Files

| File | Purpose |
|------|---------|
| `.env.example` | Local development |
| `.env.production.example` | Production template |
| `apps/api/.env.example` | API-specific vars |
| `apps/web/.env.example` | Public website vars |

---

## Architecture (Production)

```
Internet
   │
   ▼
[Nginx :443] ──► /api/*     → API (NestJS :3000)
            ├──► /          → Web (Next.js :3001)
            └──► admin.*    → Admin (Angular static :80)
   │
   ▼
[PostgreSQL :5432]
```

---

## Related Docs

- [Hostinger Deployment Guide](./HOSTINGER.md)
- [Security Checklist](./SECURITY-CHECKLIST.md)
- [Architecture](./ARCHITECTURE.md)
- [Testing](./TESTING.md)
