---
status: issues
phase: "05"
files_reviewed: 3
critical: 0
warning: 3
info: 2
total: 5
---

# Phase 05 Code Review

## Summary

Phase 05 (review) introduces reviewer portal and checklist tracking. Found 3 warnings and 2 informational items.

## Findings

### WR-01: Review detail page — hardcoded checklist items (warning)

**File:** `src/app/reviewer/requests/[requestId]/review/[documentVersionId]/page.tsx`

**Issue:** QC-LEG-01 checklist items are hardcoded as a static array in the page component. This violates the separation of concerns principle — checklist structure should come from the database or a configuration source, not be baked into the UI component.

**Recommendation:** Load checklist items from a database-backed configuration or at minimum move to a separate constants file with proper typing:
```typescript
// src/constants/checklist-items.ts
export const CHECKLIST_ITEMS = [...] as const;
```

**Severity:** warning
**Effort:** medium

---

### WR-02: Review detail page — disabled approval button has no conditional logic (warning)

**File:** `src/app/reviewer/requests/[requestId]/review/[documentVersionId]/page.tsx`

**Issue:** The "Phê duyệt" button is hardcoded as `disabled` with no state management behind it. Once checklist state is implemented, the button should enable only when all required checklist items have been marked as passed.

**Current:**
```tsx
<Button variant="primary" className="flex-1" disabled>
  Phê duyệt
</Button>
```

**Expected:** Button should be disabled only when required checklist items are not all passed.

**Severity:** warning
**Effort:** low (state logic depends on checklist interaction being implemented)

---

### WR-03: Reviewer queue page — missing empty state styling (warning)

**File:** `src/app/reviewer/requests/page.tsx`

**Issue:** The empty state row uses `colSpan={7}` but has no dedicated empty state UI — it renders as a plain table cell. The specialist/requests page has a proper Card-based empty state, but the reviewer queue uses inline colspan.

**Current:**
```tsx
{pendingReviews.length === 0 ? (
  <tr>
    <td colSpan={7} className="px-4 py-8 text-center ...">
      Không có tài liệu chờ kiểm tra
    </td>
  </tr>
```

**Expected:** Match the empty state pattern from specialist/requests page using Card component.

**Severity:** warning
**Effort:** low

---

### INFO-01: ReviewChecklistAnswer — no index on checklistItemId

**File:** `prisma/schema.prisma`

**Observation:** `checklistItemId` is a string field but has no index. If checklist items are queried by ID frequently, consider adding an index.

```prisma
model ReviewChecklistAnswer {
  ...
  @@index([checklistItemId])  // Consider if frequently queried
}
```

**Severity:** info

---

### INFO-02: Review model — documentVersionId is optional but likely required

**File:** `prisma/schema.prisma`

**Observation:** `documentVersionId String?` is nullable on the Review model. For a review workflow that links a review to a specific document version, this should likely be required (`String` not `String?`). The nullable approach may lead to reviews without a document version reference.

**Severity:** info
**Effort:** low

---

## Top Issues

1. **WR-01** — Hardcoded checklist items should be externalized to constants/database
2. **WR-02** — Approval button hardcoded disabled, needs state-driven conditional
3. **WR-03** — Empty state should use Card component like other pages

## Files Reviewed

| File | Critical | Warnings | Info |
|------|----------|----------|------|
| prisma/schema.prisma | 0 | 1 | 1 |
| src/app/reviewer/requests/page.tsx | 0 | 1 | 0 |
| src/app/reviewer/requests/[requestId]/review/[documentVersionId]/page.tsx | 0 | 2 | 0 |

## Conclusion

Code quality is good overall. Main concerns are around the review detail page's checklist interaction being stubbed (expected per plan — handled by future plan). The schema changes are sound. No security issues found.