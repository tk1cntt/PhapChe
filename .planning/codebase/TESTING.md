# Testing Patterns

**Analysis Date:** 2026-06-14

## Test Framework

**Unit & Integration Tests:**
- Framework: Vitest v4.1.8
- Config: `vitest.config.ts`
- Environment: jsdom
- Globals: enabled
- Setup: `tests/setup.ts`

**E2E Tests:**
- Framework: Playwright v1.60.0
- Config: `playwright.config.ts`
- Test dir: `./e2e`
- Browser: Chromium

**Assertion Libraries:**
- Vitest: `expect` (built-in)
- Node tests: `assert` from `node:assert/strict`
- React Testing Library: `@testing-library/react`

**Run Commands:**
```bash
npm run dev                    # Run development server
npx vitest                     # Run unit/integration tests
npx vitest --watch             # Watch mode
npm run test:e2e               # Run E2E tests
npm run test:e2e:ui           # Run E2E with UI
```

## Test File Organization

**Location:**
- Unit/Integration tests: Co-located with source files (e.g., `src/lib/admin/users.test.ts`)
- E2E tests: Separate `tests/e2e/` directory
- Component tests: `tests/` directory at root

**Naming:**
- Unit tests: `.test.ts` or `.test.tsx` suffix
- Integration/E2E specs: `.spec.ts` or `.spec.tsx` suffix
- Pattern: `[module]-[feature].test.ts` (e.g., `audit.test.ts`, `my-cases-client.test.tsx`)

**Structure:**
```
src/
├── lib/
│   ├── admin/
│   │   ├── users.ts
│   │   └── users.test.ts      # Co-located unit tests
│   └── ...
tests/
├── e2e/
│   └── dashboard.spec.ts      # E2E tests
├── customer-dashboard/
│   └── 01-components.spec.tsx # Component specs
├── my-cases/
│   ├── my-cases-client.test.tsx
│   ├── my-cases-stats.test.tsx
│   └── my-cases-integration.spec.tsx
└── setup.ts                   # Vitest setup
```

## Test Structure

**Suite Organization (Vitest):**
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('ModuleName', () => {
  describe('Feature Name', () => {
    it('Test 1: description of expected behavior', async () => {
      // Arrange
      const input = {};

      // Act
      const result = await functionUnderTest(input);

      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

**Suite Organization (Node Test):**
```typescript
import test from 'node:test';
import assert from 'node:assert/strict';

test('description of expected behavior', async () => {
  const result = await functionUnderTest();
  assert.equal(result, expected);
});
```

**Patterns:**
- Describe blocks for grouping related tests
- Test descriptions in Vietnamese for domain-specific tests
- Clear Arrange/Act/Assert structure
- `beforeEach` for setup that resets between tests

## Mocking

**Framework:** Vitest's `vi` (mock functions)

**Patterns:**
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock function
const mockFn = vi.fn(async () => ({ id: 'user-1' }));

// Spy on object method
const spy = vi.spyOn(db, 'user').mockResolvedValue({ id: 'user-1' });

// Reset between tests
beforeEach(() => {
  mockFn.mockReset();
});
```

**Database Mocking:**
```typescript
// For service tests with injectable db
function createTx() {
  return {
    user: {
      create: mock.fn(async () => ({ id: 'user-2' })),
      update: mock.fn(async () => ({ id: 'user-2' })),
    },
    workspaceMembership: { upsert: mock.fn(async () => ({ id: 'membership-1' })) },
    auditEvent: { create: mock.fn(async () => ({ id: 'audit-1' })) },
  };
}

function createDb(tx = createTx()): TestDb {
  return {
    $transaction: mock.fn((callback: (tx: Tx) => unknown) => callback(tx)) as never,
    tx,
  };
}
```

**What to Mock:**
- Global fetch in component tests
- Prisma client in unit tests
- Time-dependent functions (use fake timers)
- External APIs

**What NOT to Mock:**
- Internal business logic (test it directly)
- Simple pure functions
- Third-party libraries with simple interfaces

## Fixtures and Factories

**Test Data Pattern:**
```typescript
const mockRequests = [
  {
    id: 'req-1',
    code: 'REQ-2026-001',
    statusText: 'Đang xem xét',
    type: 'Rà soát hợp đồng',
    statusBadge: 'review' as const,
    // ... minimal required fields
  },
];
```

**Seed Data for E2E:**
```typescript
async function seedReviewTest(): Promise<ReviewSeed> {
  const workspace = await prisma.workspace.create({
    data: { name: `Test ${suffix}`, slug: `test-${suffix}` },
  });
  // ... create users, requests, documents
  return { workspaceId: workspace.id, ... };
}
```

**Cleanup Pattern:**
```typescript
async function cleanup(seed: ReviewSeed | null) {
  if (!seed) return;
  await prisma.auditEvent.deleteMany({ where: { workspaceId: seed.workspaceId } });
  // ... delete in correct order (respecting foreign keys)
  await prisma.workspace.delete({ where: { id: seed.workspaceId } });
}
```

## Coverage

**Requirements:** Not explicitly enforced in package.json

**View Coverage:**
```bash
npx vitest --coverage
```

**Note:** No coverage threshold currently set. Project guidelines suggest 90% minimum.

## Test Types

**Whitebox Tests (Unit):**
- Test internal implementation details
- Mock dependencies
- Verify specific function behavior

```typescript
describe('Whitebox Tests - Unit', () => {
  it('renders stat cards with correct values', async () => {
    mockFetch.mockResolvedValueOnce({ json: async () => mockData });
    render(<DashboardClient />);
    await waitFor(() => {
      expect(screen.getByText('25')).toBeTruthy();
    });
  });
});
```

**Blackbox Tests (Integration):**
- Test component/API behavior without internal details
- Use full component rendering
- Verify user-facing functionality

```typescript
describe('Blackbox Tests - Integration', () => {
  it('fetches data from /api/dashboard on mount', async () => {
    mockFetch.mockResolvedValueOnce({ json: async () => mockData });
    render(<DashboardClient />);
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/dashboard');
    });
  });
});
```

**Abnormal Tests (Edge Cases):**
- Empty data states
- Zero/null values
- Boundary conditions

```typescript
describe('Abnormal Tests - Edge Cases', () => {
  it('handles empty recent cases list', async () => {
    mockFetch.mockResolvedValueOnce({ json: async () => ({ ...mockData, recentCases: [] }) });
    render(<DashboardClient />);
    await waitFor(() => {
      expect(screen.getByText('Không có hồ sơ nào đang xử lý')).toBeTruthy();
    });
  });
});
```

**Error Tests:**
- API failures
- Invalid responses
- Error recovery

```typescript
describe('Error Tests', () => {
  it('shows error message on API failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    render(<DashboardClient />);
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeTruthy();
    });
  });
});
```

**E2E Tests:**
- Full browser automation with Playwright
- Test complete user flows

```typescript
import { test, expect } from '@playwright/test';

test('dashboard displays workspace stats', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.locator('.stats-grid')).toBeVisible();
});
```

## Common Patterns

**Async Testing:**
```typescript
it('renders after data loads', async () => {
  render(<Component />);
  await waitFor(() => {
    expect(screen.getByText('Expected')).toBeInTheDocument();
  });
});
```

**Error Rejection Testing:**
```typescript
it('throws FORBIDDEN for non-admin', async () => {
  await assert.rejects(
    createAdminUser({ actor: customer, input: {...} }),
    /FORBIDDEN/,
  );
});
```

**Transaction Verification:**
```typescript
it('audit event created in same transaction', async () => {
  await createAdminUser({ actor, input: {...} });
  assert.equal(db.$transactionMock.mock.callCount(), 1);
  assert.equal(tx.auditEvent.create.mock.callCount(), 1);
});
```

**Database Safety Guard:**
```typescript
function assertSafeDatabaseUrl() {
  const url = new URL(databaseUrl);
  const safe = hostname === 'localhost' || databaseName.includes('test');
  assert.ok(safe, 'Refusing to run against unsafe database');
}
```

## Test Data Constraints

**From CLAUDE.md:**
- All test data should come from database inserts
- No hardcoded test data except in isolated unit tests
- Coverage must be minimum 90%

---

*Testing analysis: 2026-06-14*
