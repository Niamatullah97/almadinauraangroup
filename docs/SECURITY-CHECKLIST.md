# Security Checklist — Kabootar

Use this checklist before every production release.

## Authentication & Authorization

- [ ] JWT secret is unique per environment and ≥ 32 characters
- [ ] Access tokens expire in 15 minutes (`JWT_ACCESS_EXPIRY=15m`)
- [ ] Refresh tokens expire in 7 days (`JWT_REFRESH_EXPIRY=7d`)
- [ ] All protected routes require valid JWT
- [ ] RBAC permissions checked on mutating endpoints
- [ ] Default super admin password changed after first login
- [ ] Passwords hashed with bcrypt (cost ≥ 12)

## API Hardening

- [ ] Helmet middleware enabled
- [ ] CORS limited to explicit production origins
- [ ] Global rate limiting: 100 requests/minute per IP
- [ ] Auth endpoints throttled: login 10/min, register 5/min
- [ ] `ValidationPipe` with `whitelist` and `forbidNonWhitelisted`
- [ ] Environment variables validated at startup
- [ ] Swagger disabled in production
- [ ] File uploads validated (type, size) on banner endpoint

## Data Protection

- [ ] PostgreSQL not exposed to public internet (Docker internal network only)
- [ ] Database credentials stored in environment variables only
- [ ] Soft deletes used (`deletedAt`) — no hard delete of critical records in normal ops
- [ ] Payment and registration data accessible only to authorized roles
- [ ] SQL injection prevented via Prisma parameterized queries

## Transport & Network

- [ ] HTTPS enforced (TLS 1.2+)
- [ ] HTTP redirects to HTTPS
- [ ] Security headers: X-Frame-Options, X-Content-Type-Options (via Helmet)
- [ ] Admin panel not indexed by search engines (robots.txt)

## Logging & Monitoring

- [ ] Request IDs attached to all responses (`X-Request-Id`)
- [ ] Stack traces logged server-side only, never returned to clients
- [ ] Failed login attempts visible in logs
- [ ] Health endpoint monitored for uptime
- [ ] 5xx error alerting configured

## Dependency & Infrastructure

- [ ] `pnpm audit` run with no critical vulnerabilities
- [ ] Docker images use specific version tags (not `latest`)
- [ ] `.env` files excluded from git (`.gitignore`)
- [ ] Secrets not hardcoded in Dockerfiles or source code
- [ ] Database backups encrypted at rest
- [ ] Backup restore tested at least once

## Security Audit Summary (Current State)

| Control | Status | Notes |
|---------|--------|-------|
| Helmet | ✅ Implemented | Default config in `main.ts` |
| CORS | ✅ Implemented | Env-configurable origins |
| JWT + RBAC | ✅ Implemented | Global guards |
| Input validation | ✅ Implemented | class-validator DTOs |
| Rate limiting | ✅ Implemented | `@nestjs/throttler` |
| Request ID logging | ✅ Implemented | Middleware + error filter |
| E2E auth tests | ✅ Basic | Login validation covered |
| WAF / DDoS | ⚠️ External | Configure at Hostinger/host level |
| Sentry / APM | ⚠️ Planned | Console logging only today |
| Refresh token rotation | ✅ Implemented | Auth module |
| Upload auth | ⚠️ Review | Banner upload requires auth; `/uploads/` is public |

## Remediation Priority

1. **High:** Change default super admin password on first deploy
2. **High:** Restrict Postgres to internal Docker network in production
3. **Medium:** Add Sentry or equivalent error tracking
4. **Medium:** Consider auth on static upload serving or signed URLs
5. **Low:** Tune Helmet CSP for admin/web asset origins
