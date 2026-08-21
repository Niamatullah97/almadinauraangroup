# Hostinger Business + Cloudflare + Supabase Deployment

This is the recommended low-cost production topology for Kabootar:

- `api.yourdomain.com` — NestJS API on one Hostinger Node.js Web App
- `yourdomain.com` — Next.js on Cloudflare Workers (OpenNext)
- `admin.yourdomain.com` — Angular static app on Cloudflare Pages
- Supabase — PostgreSQL and public image storage

Only the API consumes a Hostinger Node.js app slot.

## 1. Accounts and DNS

Create a Supabase project in the region nearest to the Hostinger data center. Add the domain to
Cloudflare and keep placeholders below until the three deployments are healthy.

Never expose `SUPABASE_SERVICE_ROLE_KEY` to either frontend.

## 2. Supabase

### Database

Copy these connection strings from **Project Settings → Database → Connect**:

- Transaction pooler, port `6543` → `DATABASE_URL`
- Session pooler/direct connection, port `5432` → `DIRECT_URL`

Use the values in `.env.hostinger.example` as the format reference. Apply migrations from a trusted
machine before the first deployment:

```bash
pnpm install --frozen-lockfile
pnpm db:generate
DIRECT_URL="<direct-url>" DATABASE_URL="<pooled-url>" pnpm db:migrate:deploy
```

Seed only once:

```bash
DIRECT_URL="<direct-url>" DATABASE_URL="<pooled-url>" pnpm db:seed
```

Change the seeded super-admin password immediately.

### Storage

1. Open **Storage** in Supabase.
2. Create a bucket named `kabootar`.
3. Mark it **Public** because tournament banners and participant profile images are public.
4. Keep writes private. The API writes with the service-role key; browsers never receive that key.

The API stores full Supabase public URLs in PostgreSQL. Local development continues to use
`STORAGE_DRIVER=local`.

Supabase Free does not provide automatic database backups. Schedule an external `pg_dump` before
using the application for important production data.

## 3. Hostinger API

Push the repository to GitHub, then create a **Node.js Web App** in hPanel.

Use these settings:

- Framework: Other or NestJS
- Repository root: repository root (`/`), not `apps/api`
- Node.js: 20
- Package manager: pnpm
- Build command: `pnpm deploy:api:hostinger`
- Entry file: `apps/api/dist/main.js`
- Health endpoint: `/api/v1/health`

Copy all variables from `.env.hostinger.example` into hPanel and replace the placeholders.

`CORS_ORIGINS` must contain exact frontend origins:

```text
https://yourdomain.com,https://www.yourdomain.com,https://admin.yourdomain.com
```

The build command generates Prisma Client, builds the API and workspace dependencies, then runs
pending migrations through `DIRECT_URL`.

Verify:

```bash
curl https://api.yourdomain.com/api/v1/health
```

## 4. Cloudflare Workers — Public Next.js App

The project uses OpenNext because the public site has SSR and 60-second revalidation.

First create the free R2 cache bucket:

```bash
pnpm --filter @kabootar/web exec wrangler login
pnpm --filter @kabootar/web exec wrangler r2 bucket create kabootar-web-opennext-cache
```

Set these build-time variables in Cloudflare:

```text
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NEXT_PUBLIC_UPLOADS_URL=https://PROJECT_REF.supabase.co/storage/v1/object/public/kabootar
NEXT_PUBLIC_WHATSAPP_NUMBER=...
NEXT_PUBLIC_CONTACT_EMAIL=...
NEXT_PUBLIC_CONTACT_PHONE=...
```

Build and deploy from the repository root:

```bash
pnpm build:web:cloudflare
pnpm deploy:web:cloudflare
```

Attach `yourdomain.com` and optionally `www.yourdomain.com` as Worker custom domains.

## 5. Cloudflare Pages — Angular Admin

Create a Pages project connected to the same repository:

- Root directory: repository root
- Build command: `pnpm build:admin:cloudflare`
- Output directory: `apps/admin/dist/admin/browser`
- Node.js: 20

Add build variables:

```text
API_URL=https://api.yourdomain.com/api/v1
UPLOADS_URL=https://PROJECT_REF.supabase.co/storage/v1/object/public/kabootar
```

The build generates Angular's production environment file. `_redirects` provides SPA route fallback.
Attach `admin.yourdomain.com` after the Pages deployment is healthy.

## 6. Release Order and Smoke Test

Deploy in this order:

1. Supabase database and public storage bucket
2. Hostinger API
3. Cloudflare Worker
4. Cloudflare Pages
5. Custom domains and final CORS values

Test:

1. API health endpoint
2. Admin login
3. Create a tournament
4. Upload a banner and participant profile image
5. Open public tournament and result pages
6. Restart/redeploy the API and confirm uploaded images still load

## 7. Rollback and Legacy VPS

The Docker/VPS deployment remains available in `docs/HOSTINGER.md`. Its production environment uses
`STORAGE_DRIVER=local`; it is separate from this managed-hosting topology.
