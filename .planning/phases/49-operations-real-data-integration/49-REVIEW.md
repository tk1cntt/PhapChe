---
phase: 49-operations-real-data-integration
reviewed: 2026-06-13T10:30:00Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - src/lib/ops/ops-service.ts
  - src/app/api/admin/operations/route.ts
  - src/components/admin/AdminOperationsClient.tsx
  - src/components/admin/AdminOperationsStats.tsx
  - src/components/admin/AdminOperationsWorkload.tsx
  - src/components/admin/AdminOperationsTimeline.tsx
  - src/components/admin/AdminOperationsTable.tsx
  - src/app/[locale]/admin/operations/page.tsx
findings:
  critical: 3
  warning: 4
  info: 3
  total: 10
status: issues_found
---

# Phase 49: Code Review Report

**Reviewed:** 2026-06-13T10:30:00Z
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues_found

## Summary

Reviewed all 8 source files for Phase 49 (operations-real-data-integration). Found **3 critical bugs**, **4 warnings**, and **3 info items**. The most serious issues are:

1. **Data quality bug**: `matterTypeLabel` incorrectly uses `matterTypeKey` instead of the actual label
2. **Race condition**: Fetches without abort controller can overwrite newer data with stale responses
3. **Hardcoded locale**: `/vi/` path breaks i18n support
4. **Potential null dereference**: `transition.actor` not null-checked in timeline mapping

## Critical Issues

### CR-01: matterTypeLabel uses wrong field (data quality bug)

**File:** `src/lib/ops/ops-service.ts:298`
**Issue:** The `matterTypeLabel` field is incorrectly assigned `matterTypeKey` instead of the actual label. This causes incorrect data display.

```typescript
// Current (buggy):
matterTypeLabel: request.intakeSubmission?.matterTypeKey ?? null,

// Should be:
matterTypeLabel: request.intakeSubmission?.matterType?.label_vi ?? request.intakeSubmission?.matterTypeKey ?? null,
```

**Fix:** Update the Prisma select to include `matterType: { select: { label_vi: true } }` and map the label field correctly.

**Also affected:** `src/lib/ops/ops-service.ts:606`

---

### CR-02: Race condition in data fetching

**File:** `src/components/admin/AdminOperationsClient.tsx:47-83`
**Issue:** The `fetchData` callback lacks an abort controller. When filters change rapidly, multiple requests can be in-flight simultaneously. The last response to resolve (not necessarily the last request sent) will set the state, potentially showing stale data.

```typescript
const fetchData = useCallback(async () => {
  setLoading(true);
  setError(null);
  try {
    // ... no abort signal
    const response = await fetch(`/api/admin/operations?${params.toString()}`);
    // If another fetch starts before this resolves, race condition occurs
    setData(result);
  } finally {
    setLoading(false);
  }
}, [filters, debouncedSearch, page, pageSize, router]);
```

**Fix:** Use an AbortController and cleanup effect:

```typescript
const fetchData = useCallback(async () => {
  controllerRef.current?.abort();
  controllerRef.current = new AbortController();
  setLoading(true);
  // ...
  const response = await fetch(url, { signal: controllerRef.current.signal });
  // ...
}, [filters, debouncedSearch, page, pageSize]);

useEffect(() => {
  return () => { controllerRef.current?.abort(); };
}, []);
```

---

### CR-03: Hardcoded locale path breaks i18n

**File:** `src/components/admin/AdminOperationsTable.tsx:39, 42, 44`
**Issue:** All action links hardcode `/vi/` as the locale prefix. This breaks multi-language support and assumes Vietnamese locale.

```typescript
// Current (buggy):
return { label: 'Xem audit →', href: `/vi/admin/audit?requestId=${req.id}` };
return { label: 'Xử lý ngay →', href: `/vi/admin/requests/${req.id}` };
return { label: 'Điều phối →', href: `/vi/admin/requests/${req.id}` };
```

**Fix:** Use `next/navigation` hooks to get current locale, or pass locale as prop:

```typescript
import { useParams } from 'next/navigation';
// In component:
const params = useParams();
const locale = params.locale as string;
// Then use:
href: `/${locale}/admin/requests/${req.id}`
```

---

## Warnings

### WR-01: Potential null dereference on actor relation

**File:** `src/lib/ops/ops-service.ts:723-724`
**Issue:** The code accesses `transition.actor.name` and `transition.actor.email` without null checks, even though the Prisma select might not guarantee the relation exists.

```typescript
// Current (potentially unsafe):
actorName: transition.actor.name,
actorEmail: transition.actor.email,
```

**Fix:** Add null safety:

```typescript
actorName: transition.actor?.name ?? null,
actorEmail: transition.actor?.email ?? null,
```

**Note:** The same mapping in `getGlobalTimeline` (line 463) correctly uses `transition.actor?.name ?? null`. This inconsistency should be fixed.

---

### WR-02: Invalid date parsing can throw

**File:** `src/app/api/admin/operations/route.ts:29-30`
**Issue:** `new Date(string)` throws a `RangeError` if the string is not a valid date. While this is caught by the try-catch, it pollutes error logs.

```typescript
dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined,
dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined,
```

**Fix:** Wrap in try-catch or use `isValidDate()` helper:

```typescript
const parseDate = (s: string | null) => {
  if (!s) return undefined;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
};
dateFrom: parseDate(searchParams.get('dateFrom')),
dateTo: parseDate(searchParams.get('dateTo')),
```

---

### WR-03: Unbounded search parameter can cause resource exhaustion

**File:** `src/lib/ops/ops-service.ts:515-522`
**Issue:** The `search` filter has no length limit. A malicious or careless client could send a very long string causing excessive database scan.

```typescript
if (filters.search) {
  and.push({
    OR: [
      { title: { contains: filters.search } },
      { code: { contains: filters.search } },
    ],
  });
}
```

**Fix:** Add length validation:

```typescript
if (filters.search && filters.search.length <= 200) {
  // ...
}
```

---

### WR-04: Inconsistent Prisma query syntax for nested filters

**File:** `src/lib/ops/ops-service.ts:196, 508`
**Issue:** Using `intakeSubmission: { is: { matterTypeKey: ... } }` may be incorrect Prisma syntax. If `LegalRequest` has a direct relation to `IntakeSubmission`, the syntax should be `intakeSubmission: { matterTypeKey: ... }`.

```typescript
// Verify this is correct for your schema:
and.push({ intakeSubmission: { is: { matterTypeKey: filters.matterTypeKey } } });
```

**Fix:** Check Prisma schema and correct the query syntax if needed. The `is` wrapper is typically used for one-to-one relations with additional conditions, not simple field filtering.

---

## Info

### IN-01: Empty slug workaround in AdminOperationsClient

**File:** `src/components/admin/AdminOperationsClient.tsx:195`
**Issue:** `slug: ''` is passed as a workaround. The `AdminToolbar` component likely needs the slug for URL generation.

```typescript
workspaces={(data?.filters.workspaces ?? []).map((w) => ({ id: w.id, name: w.name, slug: '' }))}
```

**Suggestion:** Either fetch the slug from the database or verify this is intentional.

---

### IN-02: Magic number for progress bar normalization

**File:** `src/components/admin/AdminOperationsWorkload.tsx:19`
**Issue:** `maxActive = 20` is a magic number without explanation of origin.

```typescript
const maxActive = 20; // normalize progress bar to max 20 active items
```

**Suggestion:** Extract to a named constant at the top of the file or component.

---

### IN-03: Duplicate status list definitions

**File:** `src/lib/ops/ops-service.ts:126-141, 530-532`
**Issue:** `activeStatuses` is defined twice in the same file (lines 140 and 530). This duplication risks divergence.

```typescript
// Line 140:
const activeStatuses: RequestStatus[] = ['intake_submitted', 'triage', 'assigned', 'in_progress', 'pending_review', 'revision_required', 'approved'];

// Line 530:
const activeStatuses: RequestStatus[] = [
  'intake_submitted', 'triage', 'assigned', 'in_progress', 'pending_review', 'revision_required', 'approved',
];
```

**Suggestion:** Define `activeStatuses` once at the top of the file and reuse it.

---

## Structural Findings (fallow)

No structural findings provided for this phase.

---

_Reviewed: 2026-06-13T10:30:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
