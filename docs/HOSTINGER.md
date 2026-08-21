# Hostinger VPS Deployment Guide — Kabootar (Alternative)

Deploy Kabootar on a Hostinger VPS (KVM) running Ubuntu 22.04+ with Docker.

> The recommended low-cost managed deployment is documented in
> [HOSTINGER-BUSINESS.md](HOSTINGER-BUSINESS.md). This guide is retained for a full VPS deployment.

## Prerequisites

- Hostinger VPS with at least **2 GB RAM**, **2 vCPU**, **40 GB SSD**
- Domain pointed to VPS IP (A records for `@` and `admin`)
- SSH access to the server

---

## 1. Server Setup

```bash
# Connect via SSH
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
apt install docker-compose-plugin -y

# Create app user
adduser kabootar
usermod -aG docker kabootar
su - kabootar
```

---

## 2. Clone & Configure

```bash
git clone https://github.com/your-org/kabootar.git /opt/kabootar
cd /opt/kabootar

cp .env.production.example .env
nano .env   # fill all REPLACE_* values
```

**Required `.env` values:**

| Variable               | Example                                                 |
| ---------------------- | ------------------------------------------------------- |
| `DOMAIN`               | `kabootar.pk`                                           |
| `ADMIN_DOMAIN`         | `admin.kabootar.pk`                                     |
| `DATABASE_URL`         | `postgresql://kabootar_prod:...@postgres:5432/kabootar` |
| `JWT_SECRET`           | 64-char random string                                   |
| `CORS_ORIGINS`         | `https://admin.kabootar.pk,https://kabootar.pk`         |
| `NEXT_PUBLIC_API_URL`  | `https://kabootar.pk/api/v1`                            |
| `NEXT_PUBLIC_SITE_URL` | `https://kabootar.pk`                                   |

Generate JWT secret:

```bash
openssl rand -base64 48
```

---

## 3. First Deploy

```bash
# First deploy with database seed
RUN_DB_SEED=true docker compose -f docker-compose.prod.yml up -d --build

# Verify services
docker compose -f docker-compose.prod.yml ps
docker logs kabootar-api --tail 50
curl http://localhost/api/v1/health
```

**Default super admin** (from seed):

- Email: `superadmin@kabootar.local`
- Password: `SuperAdmin@123`

**Change this password immediately after first login.**

---

## 4. TLS with Certbot

Install Certbot and obtain certificates:

```bash
apt install certbot -y

# Stop nginx temporarily
docker compose -f docker-compose.prod.yml stop nginx

certbot certonly --standalone \
  -d kabootar.pk \
  -d admin.kabootar.pk \
  --email admin@kabootar.pk \
  --agree-tos

# Copy certs for nginx container
mkdir -p docker/certs
cp /etc/letsencrypt/live/kabootar.pk/fullchain.pem docker/certs/
cp /etc/letsencrypt/live/kabootar.pk/privkey.pem docker/certs/

docker compose -f docker-compose.prod.yml up -d nginx
```

Add certbot renewal cron:

```bash
0 3 * * * certbot renew --quiet && cp /etc/letsencrypt/live/kabootar.pk/*.pem /opt/kabootar/docker/certs/ && docker compose -f /opt/kabootar/docker-compose.prod.yml restart nginx
```

---

## 5. DNS Configuration (Hostinger Panel)

| Type | Name  | Value       | TTL  |
| ---- | ----- | ----------- | ---- |
| A    | @     | YOUR_VPS_IP | 3600 |
| A    | admin | YOUR_VPS_IP | 3600 |
| A    | www   | YOUR_VPS_IP | 3600 |

---

## 6. Nginx Routing

Production URLs:

| URL                            | Service                  |
| ------------------------------ | ------------------------ |
| `https://kabootar.pk/`         | Public website (Next.js) |
| `https://kabootar.pk/api/v1/*` | NestJS API               |
| `https://admin.kabootar.pk/`   | Angular admin panel      |

Configure Hostinger DNS subdomains to point to the same VPS IP. The nginx container routes by `server_name`.

---

## 7. Database Backups

```bash
# Manual backup
./scripts/backup-database.sh /opt/kabootar/backups

# Schedule daily (crontab -e)
0 2 * * * cd /opt/kabootar && ./scripts/backup-database.sh /opt/kabootar/backups >> /var/log/kabootar-backup.log 2>&1
```

Hostinger also offers automated VPS backups — enable in the Hostinger control panel for disaster recovery.

---

## 8. Updates & Redeploy

```bash
cd /opt/kabootar
git pull origin main

docker compose -f docker-compose.prod.yml up -d --build
```

Migrations run automatically on API container start.

---

## 9. Troubleshooting

| Issue            | Fix                                                                    |
| ---------------- | ---------------------------------------------------------------------- |
| API won't start  | Check `docker logs kabootar-api` — usually DB connection or JWT_SECRET |
| 502 Bad Gateway  | Wait for healthchecks; verify API is healthy                           |
| CORS errors      | Update `CORS_ORIGINS` in `.env` with exact frontend URL                |
| Migration failed | Run `docker exec -it kabootar-api pnpm db:migrate:deploy` manually     |
| Admin blank page | Check `admin.kabootar.pk` DNS and nginx admin upstream                 |

---

## 10. Hostinger-Specific Tips

- Use **VPS KVM** plan (not shared hosting) — Node.js and Docker require VPS
- Enable **firewall**: allow ports 22, 80, 443 only
- Use Hostinger **snapshot** before major upgrades
- Monitor resource usage in hPanel → VPS → Overview
- Consider upgrading to 4 GB RAM if running all services on one VPS

---

## Quick Reference

```bash
# Start
docker compose -f docker-compose.prod.yml up -d

# Stop
docker compose -f docker-compose.prod.yml down

# Logs
docker compose -f docker-compose.prod.yml logs -f api

# DB shell
docker exec -it kabootar-postgres psql -U kabootar_prod kabootar

# Health check
curl https://kabootar.pk/api/v1/health
```
