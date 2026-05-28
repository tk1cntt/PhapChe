---
phase: 03-routing
reviewed: 2026-05-29T00:00:00Z
depth: standard
files_reviewed: 9
files_reviewed_list:
  - package.json
  - prisma/schema.prisma
  - prisma/seed.ts
  - src/app/admin/routing/actions.ts
  - src/app/admin/routing/page.tsx
  - src/app/specialist/requests/[requestId]/page.tsx
  - src/app/specialist/requests/page.tsx
  - src/lib/routing/routing-service.test.ts
  - src/lib/routing/routing-service.ts
findings:
  critical: 1
  warning: 0
  info: 0
  total: 1
status: issues_found
---

# Phase 03: Code Review Report

**Depth:** standard  
**Files Reviewed:** 9  
**Status:** issues_found  

## Summary

Authorization fix còn thiếu ở admin routing page. Server actions có guard, nhưng page đọc queue routing, gợi ý chuyên viên/reviewer, membership, capability mà không kiểm tra role admin.

## Critical Issues

### CR-01: Admin routing page thiếu authorization guard cho read access

**File:** `src/app/admin/routing/page.tsx:91-116`

**Issue:** `RoutingPage` chỉ gọi `requireAppSession()`, rồi query routing queue/capabilities/members trong workspace. User authenticated không có role `coordinator_admin` hoặc `super_admin` vẫn có thể đọc dữ liệu điều phối nhạy cảm nếu truy cập route. Mutations được bảo vệ bằng `requireRoutingAdmin`, nhưng read path chưa được bảo vệ. Đây là authorization gap.

**Fix:**
```ts
export default async function RoutingPage() {
  const session = await requireAppSession();
  const workspaceId = session.activeWorkspaceId || '';
  await requireRoutingAdmin(workspaceId, session.userId);

  const [requests, matterTypes, capabilities, members] = await Promise.all([
    // existing queries
  ]);
}
```

Cần import thêm:
```ts
import { getRoutingSuggestions, listRoutingCapabilities, listRoutingMatterTypes, requireRoutingAdmin } from '@/lib/routing/routing-service';
```

## Warnings

Không có.

## Info

Không có.
