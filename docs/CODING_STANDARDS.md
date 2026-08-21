# Coding Standards

## General Principles

1. **Minimize scope** — Smallest correct diff. No unrelated changes.
2. **Match conventions** — Read surrounding code before writing.
3. **Self-documenting code** — Comments only for non-obvious business logic.
4. **Type safety** — Strict TypeScript everywhere. Avoid `any`.

## TypeScript

- Enable `strict: true` in all tsconfig files
- Use explicit return types on public API methods
- Prefer `interface` for object shapes, `type` for unions/intersections
- Use enums from `@kabootar/shared` or Prisma-generated enums — never string literals for domain values

## Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Files (backend) | kebab-case | `create-tournament.dto.ts` |
| Files (Angular) | kebab-case + suffix | `tournament-list.component.ts` |
| Files (Next.js) | kebab-case or Next conventions | `page.tsx`, `Header.tsx` |
| Classes | PascalCase | `TournamentsService` |
| Interfaces | PascalCase (no `I` prefix) | `ApiResponse` |
| Variables/functions | camelCase | `findAll`, `currentUser` |
| Constants | UPPER_SNAKE_CASE | `API_PREFIX`, `MAX_LIMIT` |
| Database columns | snake_case (via Prisma `@map`) | `ring_number`, `created_at` |
| Environment vars | UPPER_SNAKE_CASE | `DATABASE_URL`, `JWT_SECRET` |

## Backend (NestJS)

### Module Structure
Each feature module follows clean architecture layers:
- `presentation/` — controllers, DTOs (HTTP concerns only)
- `application/` — services (business logic)
- `infrastructure/` — repositories, external integrations

### DTOs
- Use `class-validator` decorators on all input DTOs
- Use `@ApiProperty()` for Swagger documentation
- Use `PartialType()` / `PickType()` from `@nestjs/swagger` for update DTOs

### Error Handling
- Throw NestJS HTTP exceptions (`NotFoundException`, `ForbiddenException`, etc.)
- Never catch and swallow errors silently
- Global filter converts all errors to `ApiResponse` format

### Authorization
- Use `@Public()` for unauthenticated routes
- Use `@Roles(UserRole.ADMIN)` for role-restricted routes
- Use `@GetUser()` to access the authenticated user in controllers

## Frontend (Angular)

- Use standalone components (no NgModules for new features)
- Lazy-load feature routes
- Keep components thin — business logic in services
- Use reactive forms for user input
- Use `@if` / `@for` control flow (Angular 17+ syntax)

## Frontend (Next.js)

- Prefer Server Components for data fetching
- Use `'use client'` only when interactivity is needed
- API calls go through `src/lib/api/` client functions
- Use shared types from `@kabootar/shared`

## Git Conventions

### Commit Messages (Conventional Commits)
```
type(scope): description

feat(api): add tournament entry registration
fix(admin): resolve login redirect loop
docs: update architecture guide
chore(deps): upgrade NestJS to 11.0.12
test(api): add auth service unit tests
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `build`, `revert`

Enforced by Husky `commit-msg` hook.

### Branch Naming
```
feature/tournament-registration
fix/auth-token-refresh
chore/upgrade-angular-19
```

## Import Order

Enforced by ESLint `import/order` rule:
1. Node built-ins
2. External packages
3. Internal packages (`@kabootar/*`)
4. Relative imports (parent → sibling → index)

## Formatting

- Prettier with single quotes, trailing commas, 100 char width
- Format on save (VS Code settings included)
- Pre-commit hook runs ESLint fix + Prettier via lint-staged

## API Design

- RESTful endpoints with URI versioning (`/api/v1/...`)
- Plural resource names: `/tournaments`, `/pigeons`, `/users`
- Pagination via query params: `?page=1&limit=20&search=...`
- Consistent response envelope via `ApiResponse<T>`
