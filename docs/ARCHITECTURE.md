# Architecture Guide

## Overview

Kabootar follows a **monorepo + clean architecture** pattern. Each app is independently deployable, while shared packages enforce consistency across the stack.

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                         │
│  ┌──────────────────┐       ┌──────────────────────────┐  │
│  │  Next.js (web)   │       │  Angular 19 (admin)      │  │
│  │  Public site     │       │  Admin panel             │  │
│  └────────┬─────────┘       └───────────┬──────────────┘  │
└───────────┼─────────────────────────────┼───────────────────┘
            │         HTTP / REST         │
            ▼                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    NestJS API (apps/api)                    │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │Presentation │→ │ Application  │→ │ Infrastructure     │  │
│  │ Controllers │  │ Services     │  │ Prisma / JWT       │  │
│  │ DTOs        │  │ Use Cases    │  │ Repositories       │  │
│  └─────────────┘  └──────────────┘  └─────────┬──────────┘  │
└───────────────────────────────────────────────┼─────────────┘
                                                │
            ┌───────────────────────────────────┼───────────────┐
            │           Shared Packages         │               │
            │  @kabootar/shared  @kabootar/database             │
            └───────────────────────────────────┼───────────────┘
                                                ▼
                                    ┌───────────────────┐
                                    │   PostgreSQL 16   │
                                    └───────────────────┘
```

## Backend — Clean Architecture Layers

Each NestJS feature module is organized into layers:

```
modules/tournaments/
├── tournaments.module.ts       # Module wiring
├── presentation/               # HTTP layer
│   ├── tournaments.controller.ts
│   └── dto/
│       ├── create-tournament.dto.ts
│       └── update-tournament.dto.ts
├── application/                # Business logic
│   └── tournaments.service.ts
└── infrastructure/             # External concerns (when needed)
    └── tournaments.repository.ts
```

### Cross-Cutting Concerns (`apps/api/src/common/`)

| Component | Purpose |
|-----------|---------|
| `AllExceptionsFilter` | Global error handling → standardized `ApiResponse` |
| `ResponseTransformInterceptor` | Wraps all success responses in `ApiResponse<T>` |
| `JwtAuthGuard` | JWT authentication (global, with `@Public()` opt-out) |
| `RolesGuard` | Role-based access control via `@Roles()` decorator |
| `ValidationPipe` | DTO validation via class-validator (global) |
| `PaginationQueryDto` | Reusable pagination/sorting/search params |

### API Response Contract

All endpoints return a consistent shape (defined in `@kabootar/shared`):

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
  meta?: { page, limit, total, totalPages };
  errors?: { field?, message, code? }[];
}
```

## Frontend Architecture

### Angular Admin (`apps/admin`)

Feature-based structure with lazy-loaded routes:

```
src/app/
├── core/           # Singleton services, guards, interceptors
│   ├── services/   # AuthService, ApiService
│   ├── guards/     # authGuard
│   └── interceptors/ # auth, error
├── layout/         # Shell components (sidebar, header)
├── features/       # Lazy-loaded feature modules
│   ├── auth/
│   ├── dashboard/
│   ├── tournaments/
│   ├── pigeons/
│   └── users/
└── shared/         # Reusable UI components, pipes, directives
```

**Key patterns:**
- Standalone components (Angular 19)
- Functional guards and interceptors
- Centralized `ApiService` consuming standardized `ApiResponse<T>`
- Environment-based API URL configuration

### Next.js Public Site (`apps/web`)

App Router with server components for SEO:

```
src/
├── app/            # Routes (App Router)
│   ├── page.tsx            # Home
│   └── tournaments/
│       ├── page.tsx        # List
│       └── [id]/page.tsx   # Detail
├── components/     # Shared UI components
│   └── layout/
└── lib/
    └── api/        # Server-side API client
```

**Key patterns:**
- Server Components for data fetching (ISR with 60s revalidation)
- Shared types from `@kabootar/shared`
- Vitest for unit testing

## Database Schema

PostgreSQL with Prisma ORM. Core entities:

| Entity | Description |
|--------|-------------|
| `User` | Accounts with roles (ADMIN, ORGANIZER, PARTICIPANT, VIEWER) |
| `RefreshToken` | JWT refresh token storage with revocation |
| `Pigeon` | Registered racing pigeons with ring numbers |
| `Tournament` | Racing events with status lifecycle |
| `TournamentEntry` | Pigeon entries with arrival times, rank, speed |

**Design decisions:**
- UUID primary keys
- Soft deletes (`deletedAt`) on User, Pigeon, Tournament
- Snake_case column mapping via `@map`
- Composite unique constraints on tournament entries
- Indexed foreign keys and frequently queried columns

## Environment Configuration

| File | Scope |
|------|-------|
| `.env` | Root / Docker Compose variables |
| `apps/api/.env` | API-specific (DATABASE_URL, JWT_SECRET) |
| `apps/web/.env.local` | Next.js public vars (NEXT_PUBLIC_*) |
| `apps/admin/src/environments/` | Angular build-time config |

Environment validation runs at API startup via `class-validator` in `env.validation.ts`.

## Authentication Flow

1. User logs in → API returns `accessToken` (15m) + `refreshToken` (7d)
2. Client sends `Authorization: Bearer <accessToken>` on each request
3. `@Public()` decorator bypasses auth on specific routes (login, health, public tournaments)
4. `@Roles(UserRole.ADMIN)` restricts endpoints by role
5. Refresh token stored in DB with expiry and revocation support

## Deployment

Docker Compose orchestrates PostgreSQL, API, and Web containers. The admin panel is a static SPA deployed separately (CDN/nginx).

```bash
docker compose up -d          # Production
docker compose -f docker-compose.yml -f docker-compose.dev.yml up  # Dev
```
