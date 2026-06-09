---
gsd_quick: true
quick_id: 260609-tsy
slug: fix-en-admin-audit-page-rangeerror-inval
description: Fix /en/admin/audit page: RangeError Invalid time value and API 404
date: 2026-06-09
status: planned
must_haves:
  - /en/admin/audit page renders without RangeError
  - /en/api/audit/events returns 200
---

# Quick Plan: fix-admin-audit-page

## Task 1: Fix RangeError in AuditPage - createdAt parsing

**files:**
- `src/app/admin/audit/page.tsx`

**action:**
The `createdAt` from JSON API is a string, not Date. Need to parse it:
```tsx
render: (val: string) =>
  new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(val)),
```

**verify:**
- Page renders without RangeError
- Dates display correctly

**done:**
- RangeError fixed

---

## Task 2: Add [locale]/api/audit/events route

**files:**
- `src/app/[locale]/api/audit/events/route.ts` (new)

**action:**
Create locale-wrapped API route:
```typescript
import { GET as getAuditEvents } from '@/app/api/audit/events/route';
export { getAuditEvents as GET };
```

**verify:**
- `curl http://localhost:3000/en/api/audit/events` returns 200

**done:**
- Locale API route created
