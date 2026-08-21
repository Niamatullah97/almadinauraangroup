# Testing Strategy

## Philosophy

Tests are set up from day one. Each app/package has its own test runner configured and wired into the Turborepo pipeline via `pnpm test`.

## Test Runners by App

| App/Package | Runner | Config File |
|-------------|--------|-------------|
| `@kabootar/api` | Jest | `apps/api/jest.config.js` |
| `@kabootar/admin` | Karma + Jasmine | `apps/admin/karma.conf.js` |
| `@kabootar/web` | Vitest | `apps/web/vitest.config.ts` |
| `@kabootar/shared` | Jest | `packages/shared/jest.config.js` |

## Running Tests

```bash
# All tests
pnpm test

# Single app
pnpm --filter @kabootar/api test
pnpm --filter @kabootar/admin test
pnpm --filter @kabootar/web test

# Watch mode
pnpm --filter @kabootar/api test:watch
pnpm --filter @kabootar/web test:watch

# CI with coverage
pnpm test:ci
```

## Backend (NestJS + Jest)

### Unit Tests
- Test services in isolation with mocked dependencies
- Mock `PrismaService` for database operations
- Example: `auth.service.spec.ts` tests login validation logic

### What to Test
- Service business logic (validation, authorization checks)
- Guards and interceptors behavior
- DTO validation edge cases
- Utility functions

### What NOT to Unit Test
- NestJS framework wiring (modules, decorators)
- Prisma query syntax (use integration tests instead)

### E2E Tests (future)
- Config ready at `apps/api/test/jest-e2e.json`
- Test full HTTP request/response cycle against a test database

## Angular Admin (Karma + Jasmine)

### Unit Tests
- Test services, guards, and component logic
- Use `TestBed` for dependency injection
- Example: `auth.service.spec.ts` tests authentication state

### What to Test
- Service methods and state management
- Guard redirect logic
- Component rendering with mocked services
- Form validation behavior

### Configuration
- Headless Chrome for CI (`ChromeHeadless`)
- Coverage output to `coverage/admin/`

## Next.js Web (Vitest)

### Unit Tests
- Test utility functions and helpers
- Component tests with `@testing-library/react`
- Example: `page.test.tsx`

### What to Test
- API client functions (with mocked fetch)
- Utility/formatting functions
- Component rendering and interactions

### Configuration
- jsdom environment for DOM testing
- Setup file at `src/test/setup.ts` imports `@testing-library/jest-dom`

## Shared Package (Jest)

- Pure function tests with no mocking needed
- Example: `pagination.spec.ts` tests pagination normalization

## Coverage Targets (recommended)

| Layer | Target |
|-------|--------|
| Services / Business Logic | 80%+ |
| Controllers / Components | 60%+ |
| Utilities | 90%+ |
| Overall | 70%+ |

## CI Integration

```yaml
# Example GitHub Actions step
- run: pnpm install --frozen-lockfile
- run: pnpm db:generate
- run: pnpm build
- run: pnpm test:ci
- run: pnpm lint
```

## Test Naming Convention

```
describe('ServiceName', () => {
  describe('methodName', () => {
    it('should [expected behavior] when [condition]', () => {});
  });
});
```

Example:
```typescript
describe('AuthService', () => {
  describe('login', () => {
    it('should throw UnauthorizedException when user not found', () => {});
  });
});
```
