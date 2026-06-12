# Testing Patterns

**Analysis Date:** 2026-06-12

## Test Framework

### Unit/Integration Tests

**Runner:** Node.js built-in `test` runner
```bash
# Run all tests
npm test

# With vitest for React components
npx vitest
```

**Config:** `vitest.config.ts`
```typescript
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

**Setup File:** `tests/setup.ts`
```typescript
import '@testing-library/jest-dom';
```

### E2E Tests

**Runner:** Playwright
```bash
npm run test:e2e              # Run all e2e tests
npm run test:e:e2e:ui         # UI mode for debugging
```

**Config:** `playwright.config.ts` (implied by `@playwright/test`)

## Test File Organization

### Co-located with Source

Unit/integration tests live next to source files:
```
src/lib/
  intake/
    intake-service.ts
    intake.test.ts          # Co-located unit tests
  documents/
    template-service.ts
    template-service.test.ts
  workflow/
    request-workflow.ts
    request-workflow.test.ts
```

### Component Tests

Component tests in `tests/` directory with descriptive names:
```
tests/
  customer-dashboard/
    01-components.spec.tsx    # Whitebox unit tests
    02-panels.spec.tsx
    03-requests-table.spec.tsx
  e2e/
    user-management.spec.ts
  my-cases/
    my-cases.spec.tsx
```

### E2E Tests

E2E tests in root `e2e/` directory:
```
e2e/
  admin.spec.ts
  reviewer.spec.ts
  specialist.spec.ts
  intake.spec.ts
  request-status.spec.ts
  auth.spec.ts
  internationalization.spec.ts
  customer-dashboard.spec.ts
  intake-flow.spec.ts
  admin-dashboard.spec.ts
  all-screens-i18n-screenshots.spec.ts
```

### Naming Patterns

- Unit tests: `.test.ts` or `.test.tsx`
- Abnormal tests: `.abnormal.test.tsx`
- Component specs: `.spec.tsx`
- E2E specs: `.spec.ts`

## Test Structure

### Service/Integration Tests (Node.js test runner)

```typescript
import assert from 'node:assert/strict';
import test from 'node:test';

// Test suite with seed and cleanup pattern
test('createTemplate: admin can create draft template', async () => {
  const seed = await seedTemplateTest();
  try {
    const template = await createTemplate(seed.adminSession, {
      workspaceId: seed.workspaceId,
      matterTypeKey: 'labor_contract',
      label: 'Test Label',
      variableSchema: [],
      content: 'Test content',
    });
    assert.equal(template.workspaceId, seed.workspaceId);
    assert.equal(template.status, 'draft');
  } finally {
    await cleanup(seed.workspaceId);
  }
});

// Negative test with rejection
test('createTemplate: non-admin cannot create template', async () => {
  const seed = await seedTemplateTest();
  try {
    const customer = await prisma.user.create({ ... });
    const session = { userId: customer.id, roles: ['customer'] };
    await assert.rejects(
      () => createTemplate(session, { ... }),
      /FORBIDDEN/
    );
  } finally {
    await cleanup(seed.workspaceId);
  }
});
```

### Component Tests (Vitest + Testing Library)

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '@/app/components/Badge';

describe('Badge Component', () => {
  // WHITEBOX: Unit test for each variant
  it('renders green variant correctly', () => {
    render(<Badge variant="green">Test</Badge>);
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText('Test')).toHaveClass('badge', 'green');
  });

  // ABNORMAL: Empty children handling
  it('handles empty children', () => {
    const { container } = render(<Badge variant="green">{''}</Badge>);
    expect(container.querySelector('.badge')).toBeInTheDocument();
  });
});
```

### E2E Tests (Playwright)

```typescript
import { test, expect } from '@playwright/test';
import { loginAs, navigateToAdmin } from './helpers';

test.describe('Admin Screens', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
  });

  test('admin ops renders correctly', async ({ page }) => {
    await page.goto('/admin/ops');
    await page.waitForLoadState('networkidle');
    const content = await page.content();
    expect(content.length > 100).toBeTruthy();
  });
});
```

## Test Categories (Per CLAUDE.md Requirements)

### 1. Whitebox Tests
Internal implementation verification:
```typescript
// Test all variants of a component
['green', 'orange', 'blue', 'red', 'purple'].forEach((variant) => {
  it(`renders ${variant} variant`, () => {
    render(<Badge variant={variant}>{variant}</Badge>);
    expect(screen.getByText(variant)).toHaveClass(variant);
  });
});
```

### 2. Blackbox Tests
External behavior without implementation knowledge:
```typescript
it('creates append-only audit event with metadata summary', async () => {
  await recordAuditEvent({ ... }, db);
  assert.deepEqual(calls, [{ data: { ... } }]);
});
```

### 3. Abnormal Tests
Edge cases and boundary conditions:
```typescript
describe('Abnormal Tests', () => {
  it('handles empty user list gracefully', () => { ... });
  it('handles 0% progress', () => { ... });
  it('handles very long name with truncation', () => { ... });
  it('handles Vietnamese characters in name', () => { ... });
});
```

### 4. Error Tests
Error handling verification:
```typescript
it('rejectReview rejects when generalComment is empty', async () => {
  await assert.rejects(
    rejectReview({ generalComment: '   ', ... }),
    /REJECT_COMMENT_REQUIRED/
  );
});
```

## Mocking

### In-Memory Mock Database

For unit tests without real database:
```typescript
const calls: unknown[] = [];
const db = {
  auditEvent: {
    create(input: unknown) {
      calls.push(input);
      return Promise.resolve({ id: 'audit_1' });
    },
  },
};
```

### Source File Verification

For routing-service tests that verify implementation details:
```typescript
const source = readFileSync(new URL('./routing-service.ts', import.meta.url), 'utf8');

function mustInclude(value: string, message: string) {
  if (!source.includes(value)) throw new Error(message);
}

mustInclude('ASSIGNMENT_REASON_REQUIRED', 'missing required assignment reason guard');
mustInclude('prisma.$transaction', 'assignment writes must be atomic');
```

### Type-Safe Fixture Assertions

```typescript
type Assert<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

// Compile-time verification
type TransitionStatus = keyof typeof REQUEST_TRANSITIONS;
type _AllStatusesCovered = Assert<Equal<TransitionStatus, RequestStatus>>;
```

## Fixtures and Factories

### Seed Pattern

```typescript
const E2E_PREFIX = 'template_service_e2e';

async function seedTemplateTest(): Promise<TemplateSeed> {
  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const workspace = await prisma.workspace.create({
    data: { name: `Template Test ${suffix}`, slug: `${E2E_PREFIX}-${suffix}` },
  });

  const [admin, coordinator] = await Promise.all([
    prisma.user.create({
      data: {
        email: `${E2E_PREFIX}_admin_${suffix}@example.test`,
        name: 'Template Admin',
        memberships: { create: { workspaceId: workspace.id, role: 'super_admin' } },
      },
    }),
    // ...
  ]);

  return {
    suffix,
    workspaceId: workspace.id,
    adminId: admin.id,
    adminSession: { userId: admin.id, activeWorkspaceId: workspace.id, roles: ['super_admin'] },
  };
}

async function cleanup(workspaceId: string) {
  await prisma.documentTemplate.deleteMany({ where: { workspaceId } });
  await prisma.workspace.delete({ where: { id: workspaceId } });
}
```

### Wrapper Pattern for Shared Setup

```typescript
async function withReviewSeed(run: (seed: ReviewSeed) => Promise<void>) {
  assertSafeDatabaseUrl();
  let seed: ReviewSeed | null = null;

  try {
    seed = await seedReviewTest();
    await run(seed);
  } finally {
    await cleanupReviewTest(seed);
  }
}

// Usage
test('approveReview happy path', async () => {
  await withReviewSeed(async (seed) => {
    const result = await approveReview({ session: reviewerSession(seed), ... });
    assert.equal(result.status, 'approved');
  });
});
```

### Test Data Helpers

```typescript
function allPassedAnswers() {
  return CHECKLIST_ITEMS.map((i) => ({
    checklistItemId: i.id,
    passed: true,
    comment: null as string | null,
  }));
}

function answersWithOneFailed(failedId: string) {
  return CHECKLIST_ITEMS.map((i) => ({
    checklistItemId: i.id,
    passed: i.id === failedId ? false : true,
    comment: i.id === failedId ? 'Thiếu căn cứ' : null,
  }));
}
```

## Database Safety

### URL Validation

```typescript
function assertSafeDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  assert.ok(databaseUrl, 'DATABASE_URL is required for test');
  
  const url = new URL(databaseUrl);
  const hostname = url.hostname.toLowerCase();
  const databaseName = url.pathname.toLowerCase();
  const safe =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    databaseName.includes('dev') ||
    databaseName.includes('test') ||
    databaseName.includes('local');
  
  assert.ok(safe, `Refusing to run test against unsafe DATABASE_URL: ${url.hostname}`);
}
```

## E2E Test Helpers

### Playwright Helpers (e2e/helpers.ts)

```typescript
// Role-based login helper
export async function loginAs(page: Page, role: 'admin' | 'specialist' | 'reviewer' | 'customer') {
  // Navigate to sign-in and authenticate
  await page.goto('/sign-in');
  // ... role-specific authentication
}

// Navigation helper
export async function navigateToAdmin(page: Page) {
  await page.goto('/admin');
}
```

## Coverage

**Target:** Minimum 90% coverage (per CLAUDE.md)

**View Coverage:**
```bash
# With vitest
npx vitest run --coverage

# With Node.js test runner (limited)
```

## Common Patterns

### Async Testing

```typescript
// Promise-based with assert.rejects
test('async operation fails correctly', async () => {
  await assert.rejects(
    someAsyncFunction(),
    /EXPECTED_ERROR_CODE/
  );
});

// Promise resolution
test('async operation succeeds', async () => {
  const result = await someAsyncFunction();
  assert.equal(result.status, 'expected');
});
```

### Error Testing

```typescript
// Service errors
await assert.rejects(
  () => createTemplate(nonAdminSession, { ... }),
  /FORBIDDEN/
);

// Validation errors with specific codes
assert.rejects(
  () => submitIntake({ ... }),
  /INTAKE_REQUIRED_ANSWERS_MISSING:missingField1,missingField2/
);
```

### State Verification

```typescript
// Database state verification
const docVersion = await prisma.documentVersion.findUniqueOrThrow({ where: { id: ... } });
assert.equal(docVersion.status, 'final');

// Workflow transition verification
const transition = await prisma.workflowTransition.findFirst({
  where: { requestId: seed.requestId, toStatus: 'approved' },
});
assert.ok(transition);
assert.equal(transition?.fromStatus, 'pending_review');

// Audit event verification
const audit = await prisma.auditEvent.findFirst({
  where: { action: 'review.approved', targetId: seed.reviewId },
});
assert.ok(audit);
assert.ok(audit.metadataSummary?.includes('passedCount=9'));
```

## Run Commands Summary

```bash
# Unit tests (vitest)
npx vitest

# Unit tests with UI
npx vitest --ui

# Unit tests with coverage
npx vitest run --coverage

# Type checking
npm run typecheck

# Linting
npm run lint

# E2E tests
npm run test:e2e

# E2E tests with UI
npm run test:e2e:ui
```

---

*Testing analysis: 2026-06-12*
