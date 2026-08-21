# Kabootar — Pigeon Tournament Management System

A professional monorepo for managing pigeon racing tournaments, built with NestJS, Angular 19, Next.js, PostgreSQL, and Prisma.

## Stack

| Layer          | Technology                                      |
| -------------- | ----------------------------------------------- |
| Public Website | Next.js 15 (App Router)                         |
| Admin Panel    | Angular 19 (Standalone Components)              |
| Backend API    | NestJS 11                                       |
| Database       | PostgreSQL 16                                   |
| ORM            | Prisma 6                                        |
| Auth           | JWT (access + refresh tokens)                   |
| Monorepo       | pnpm workspaces + Turborepo                     |
| Testing        | Jest (API), Karma/Jasmine (Admin), Vitest (Web) |
| Tooling        | ESLint, Prettier, Husky, lint-staged            |

## Quick Start

```bash
# Prerequisites: Node 20+, pnpm 9+, Docker (optional)

# 1. Install dependencies
pnpm install

# 2. Copy environment files
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# 3. Start PostgreSQL
pnpm docker:up

# 4. Generate Prisma client & run migrations
pnpm db:generate
pnpm db:migrate

# 5. Seed roles, permissions, and Super Admin (superadmin@kabootar.local / SuperAdmin@123)
pnpm --filter @kabootar/database seed

# 6. Start all apps in dev mode
pnpm dev
```

### Dev URLs

| App        | URL                          |
| ---------- | ---------------------------- |
| API        | http://localhost:3000/api/v1 |
| Swagger    | http://localhost:3000/docs   |
| Admin      | http://localhost:4200        |
| Public Web | http://localhost:3001        |

## Project Structure

```
kabootar/
├── apps/
│   ├── api/          # NestJS backend (clean architecture)
│   ├── admin/        # Angular 19 admin panel
│   └── web/          # Next.js public website
├── packages/
│   ├── database/     # Prisma schema & client
│   ├── shared/       # Shared types, constants, utilities
│   └── eslint-config/# Shared ESLint configuration
├── docker/           # Dockerfiles
├── docs/             # Architecture & coding standards
├── .husky/           # Git hooks
└── turbo.json        # Turborepo pipeline config
```

## Scripts

| Command           | Description                   |
| ----------------- | ----------------------------- |
| `pnpm dev`        | Start all apps in development |
| `pnpm build`      | Build all packages and apps   |
| `pnpm test`       | Run all unit tests            |
| `pnpm lint`       | Lint all packages             |
| `pnpm format`     | Format with Prettier          |
| `pnpm db:migrate` | Run Prisma migrations         |
| `pnpm db:studio`  | Open Prisma Studio            |
| `pnpm docker:up`  | Start PostgreSQL via Docker   |

## Documentation

- [Architecture Guide](docs/ARCHITECTURE.md)
- [Testing Strategy](docs/TESTING.md)
- [Production Deployment](docs/PRODUCTION.md)
- [Hostinger Business + Cloudflare + Supabase](docs/HOSTINGER-BUSINESS.md)
- [Hostinger VPS Guide (alternative)](docs/HOSTINGER.md)
- [Security Checklist](docs/SECURITY-CHECKLIST.md)
- [Coding Standards](docs/CODING_STANDARDS.md)

## License

Private — All rights reserved.
