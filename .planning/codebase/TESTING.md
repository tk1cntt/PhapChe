# Testing Patterns

**Analysis Date:** 2026-06-18

## Test Frameworks

### Unit Testing

**Framework:** Vitest v4.1.8
- **Config:** `vitest.config.ts`
- **Environment:** jsdom
- **Globals:** Enabled
- **Setup:** `tests/setup.ts`

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Node Test Runner

Some tests use Node.js built-in `node:test`:

```typescript
import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
```

### E2E Testing

**Framework:** Playwright v1.60.0
- **Config:** `playwright.config.ts`
- **TestDir:** `./e2e`
- **Browser:** Chromium (Desktop Chrome)
- **Reporter:** list

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
});
```

## Run Commands

```bash
npm run test:e2e              # Run all E2E tests
npm run test:e2e:ui          # Run with Playwright UI
npm run lint                 # ESLint
npm run typecheck           # TypeScript checking
```

## Test File Organization

### Location Pattern

Tests are co-located with source files:

```
src/lib/
  admin/
    users.ts
    users.test.ts          # Unit tests
  documents/
    vault-service.ts
    vault-service.test.ts   # Integration tests
  workflow/
    request-workflow.ts
    request-workflow.test.ts # Type tests

e2e/
  admin.spec.ts            # E2E tests
  intake.spec.ts
  helpers.ts               # Shared helpers
```

### Naming

- Unit/Integration: `*.test.ts`
- E2E: `*.spec.ts`
- Helpers: `helpers.ts`

## Test Structure

### Unit Tests (Vitest)

```typescript
import { describe, it, expect } from 'vitest';

describe('ServiceName', () => {
  it('does expected behavior', () => {
    const result = someFunction(input);
    expect(result).toBe(expected);
  });
});
```

### Node Test Pattern

```typescript
import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';

describe('feature name', () => {
  it('test description in Vietnamese', async () => {
    const result = await someFunction(input);
    assert.equal(result.property, 'expected');
  });
});
```

### E2E Test Categories

Per CLAUDE.md requirements, E2E tests follow 4 categories:

```typescript
// From src/components/admin/AdminVaultClient.e2e.test.ts

test.describe('Whitebox: Page structure', () => {
  test('page has correct page header', async () => {
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Phân loại vault');
  });
});

test.describe('Blackbox: Data display', () => {
  test('displays folders from API', async () => {
    await page.waitForResponse((response) =>
      response.url().includes('/api/vault') && response.status() === 200
    );
  });
});

test.describe('Abnormal: Edge cases', () => {
  test('handles empty data gracefully', async () => {
    // ...
  });
});

test.describe('Error: Error handling', () => {
  test('displays error message when API fails', async ({ page }) => {
    await page.route('/api/vault', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });
  });
});
```

## Mocking

### Node Test Mocking

```typescript
// From src/lib/admin/users.test.ts
const tx = {
  user: {
    create: mock.fn(async () => ({ id: 'user-2', email: 'new@example.com', ... })),
    update: mock.fn(async () => ({ id: 'user-2', role: 'reviewer', isActive: true })),
  },
  workspaceMembership: { upsert: mock.fn(async () => ({ id: 'membership-1' })) },
  auditEvent: { create: mock.fn(async () => ({ id: 'audit-1' })) },
};

const transactionMock = mock.fn((callback: (tx: Tx) => unknown) => callback(tx));
```

### Playwright Route Interception

```typescript
await page.route('/api/vault', (route) => {
  route.fulfill({
    status: 500,
    contentType: 'application/json',
    body: JSON.stringify({ error: 'Server Error' }),
  });
});
```

### Mocking Rules

- **Mock external services:** Database, file storage, email
- **Mock Prisma client:** For unit tests isolating business logic
- **Do NOT mock:** Simple pure functions
- **Do NOT mock:** Test utilities (assert, describe)

## Fixtures and Factories

### Test Database Fixtures

Integration tests use real database with seed/cleanup pattern:

```typescript
// From src/lib/delivery/delivery-service.test.ts
const VAULT_E2E_PREFIX = 'delivery_service_e2e';

async function seedDeliveryTest(): Promise<DeliverySeed> {
  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const [workspace, otherWorkspace] = await Promise.all([
    prisma.workspace.create({ data: { name: `Delivery Service ${suffix}`, slug: `...` } }),
    // ...
  ]);
  // Return seed data
}

async function cleanupDeliveryTest(seed: DeliverySeed | null) {
  if (!seed) return;
  await prisma.reviewChecklistAnswer.deleteMany({ where: { ... } });
  await prisma.review.deleteMany({ where: { ... } });
  // ... cascade delete
}

async function withDeliverySeed(run: (seed: DeliverySeed) => Promise<void>) {
  assertSafeDatabaseUrl();
  let seed: DeliverySeed | null = null;
  try {
    seed = await seedDeliveryTest();
    await run(seed);
  } finally {
    await cleanupDeliveryTest(seed);
  }
}
```

### Safety Checks

```typescript
// From src/lib/delivery/delivery-service.test.ts
function assertSafeDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  assert.ok(databaseUrl, 'DATABASE_URL is required');

  const url = new URL(databaseUrl);
  const safe =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    databaseName.includes('dev') ||
    databaseName.includes('test') ||
    databaseName.includes('local');

  assert.ok(safe, `Refusing to run against unsafe DATABASE_URL: ${url.hostname}`);
}
```

## Type Testing

Type correctness is tested via TypeScript type checking:

```typescript
// From src/lib/workflow/request-workflow.test.ts
type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

type TransitionStatus = keyof typeof REQUEST_TRANSITIONS;
type _AllStatusesCovered = Assert<Equal<TransitionStatus, RequestStatus>>;
```

## E2E Test Helpers

```typescript
// From e2e/helpers.ts
export const CREDENTIALS = {
  specialist: { email: 'specialist.demo@example.test', password: 'Demo@123456' },
  reviewer: { email: 'reviewer.demo@example.test', password: 'Demo@123456' },
  admin: { email: 'admin.demo@example.test', password: 'Demo@123456' },
  customer: { email: 'customer.demo@example.test', password: 'Demo@123456' },
};

export async function loginAs(page: Page, role: keyof typeof CREDENTIALS) {
  await page.context().clearCookies();
  await page.goto('/vi/sign-in', { waitUntil: 'networkidle', timeout: 30000 });
  // Fill credentials and submit
}
```

## Coverage

**Not enforced** - No coverage threshold configured.

## Test Types Summary

| Type | Framework | Location | Characteristics |
|------|-----------|----------|-----------------|
| Unit | Vitest/Node | `src/lib/**/*.test.ts` | Mocked dependencies |
| Integration | Node + Prisma | `src/lib/**/*.test.ts` | Real DB, seed/cleanup |
| Type | TypeScript | `src/lib/**/*.test.ts` | Compile-time checks |
| E2E | Playwright | `e2e/*.spec.ts` | Full browser, real app |
| Component E2E | Playwright | `src/components/**/*.e2e.test.ts` | Component UI tests |

## Common Patterns

### Async Testing

```typescript
it('creates audit event', async () => {
  await recordAuditEvent({ ... }, db);
  assert.equal(calls.length, 1);
});
```

### Error Testing

```typescript
it('rejects invalid input', async () => {
  await assert.rejects(
    serviceFunction({ input: invalidData }),
    /ERROR_CODE/
  );
});
```

### Security Testing

```typescript
it('excludes sensitive fields', async () => {
  const json = JSON.stringify(result);
  assert.doesNotMatch(json, /storageKey/);
  assert.doesNotMatch(json, /password/);
});
```

---

*Testing analysis: 2026-06-18*
