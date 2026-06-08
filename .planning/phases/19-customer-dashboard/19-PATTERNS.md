# Phase 19: customer-dashboard - Pattern Map

**Generated:** 2026-06-08

## Target Files and Closest Analogs

| Target file | Role | Closest analog | Pattern to reuse |
|---|---|---|---|
| `src/app/customer/requests/page.tsx` | Server route/page for customer dashboard list | `src/app/customer/requests/[requestId]/page.tsx`; `src/app/requests/[requestId]/page.tsx` | Protected server component using `requireAppSession()`, Prisma/service read, Ant Design layout primitives |
| `src/app/customer/requests/CustomerRequestsTable.tsx` | Client Ant Design table for customer rows/actions | `src/app/specialist/requests/SpecialistRequestsTable.tsx` | `'use client'`, `ColumnsType`, status label map, `Tag`, `Button`, `Table`, `rowKey="id"`, `locale.emptyText` |
| `src/app/requests/[requestId]/page.tsx` | Existing status detail page that needs dashboard CTA | same file | Add a `Link`/`Button` inside existing Ant Design page without changing access checks |
| `e2e/customer-dashboard.spec.ts` | New Playwright testcase | `e2e/request-status.spec.ts`; `e2e/helpers.ts`; `e2e/intake-flow.spec.ts` | Use `loginAs`, create request through intake, wait for `/requests/[id]`, navigate dashboard, assert content/actions |

## Concrete Existing Patterns

### Protected customer page

`src/app/customer/requests/[requestId]/page.tsx`:

```ts
const session = await requireAppSession();
request = await getCustomerDeliveryRequest(session, requestId);
```

### Request access pattern

`src/app/requests/[requestId]/page.tsx`:

```ts
session = await requireAppSession();
const hasAccess = await canAccessRequest(session, requestId);
if (!hasAccess) {
  notFound();
  return null;
}
```

### Ant Design table/status pattern

`src/app/specialist/requests/SpecialistRequestsTable.tsx`:

```ts
'use client';

import Link from 'next/link';
import type { ColumnsType } from 'antd/es/table';
import { Tag, Button, Table } from 'antd';
import type { RequestStatus } from '@prisma/client';
```

Status labels/tone map should be copied/adapted from this file and delivery/status pages to keep Vietnamese labels consistent.

### Customer layout pattern

`src/app/customer/layout.tsx` wraps customer routes with:

- White header and breadcrumb.
- `Content` padding `24`.
- Background `#F8FAFC`.

The new page should not add a second full-screen layout that fights this wrapper. Use a max-width content container inside the provided customer layout.

### E2E login/intake pattern

`e2e/helpers.ts` exports:

```ts
export async function loginAs(page: Page, role: keyof typeof CREDENTIALS): Promise<void>
```

`e2e/request-status.spec.ts` creates an intake request and waits for:

```ts
await page.waitForURL(/\/requests\/[a-zA-Z0-9-]+/, { timeout: 15000 });
```

The dashboard E2E should reuse this flow.

## Data Flow

1. User authenticates.
2. `/customer/requests/page.tsx` calls `requireAppSession()`.
3. Page queries `LegalRequest` with `workspaceId: session.activeWorkspaceId` and `createdById: session.userId`.
4. Page serializes rows to `CustomerRequestsTable`.
5. Table renders customer-safe metadata and route links.
6. Delivery/download remains delegated to `/customer/requests/[requestId]` and `delivery-service`.

## Security Notes

- Do not use frontend-only filtering.
- Do not select internal assignment/review fields.
- Do not expose delivery action unless `status` is `delivered` or `closed`.
- Keep document downloads inside existing delivery page/service.

## PATTERN MAPPING COMPLETE
