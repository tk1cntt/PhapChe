---
phase: "05"
status: fixed
fixed: 2
skipped: 1
total: 3
---

# Phase 05 Code Review Fix

## Summary

Applied fixes for 2 of 3 warnings from `05-REVIEW.md`. WR-03 was a false positive (specialist/requests uses same colspan pattern).

## Fixes Applied

### ✓ WR-01: Externalized checklist items to constants

**File:** `src/constants/checklist-items.ts` (new)

Created dedicated constants file with typed checklist items:
- `CHECKLIST_ITEMS` — array of all QC-LEG-01 items with `as const`
- `GROUP_LABELS` — map of group keys to Vietnamese labels
- `CHECKLIST_GROUPS` — array of group keys for iteration

Updated `page.tsx` to import from `@/constants/checklist-items` instead of hardcoding inline.

### ✓ WR-02: Approval button now state-driven

**File:** `src/app/reviewer/requests/[requestId]/review/[documentVersionId]/page.tsx`

Changed:
```tsx
// Before: hardcoded disabled
<Button variant="primary" className="flex-1" disabled>

// After: state-driven based on checklist completion
const allRequiredPassed = CHECKLIST_ITEMS
  .filter(item => item.required)
  .every(item => passedItemIds.includes(item.id));
<Button variant="primary" className="flex-1" disabled={!allRequiredPassed}>
```

When `passedItemIds` is populated from the database (future plan), the button will automatically enable when all required items pass.

### ⊘ WR-03: Skipped (false positive)

The reviewer queue page uses `colSpan={7}` for empty state, which matches the pattern used by `specialist/requests/page.tsx`. No inconsistency found.

## Info Items

- **INFO-01 (checklistItemId index):** Not applied — index on a string ID field rarely queried by that field alone is premature optimization.
- **INFO-02 (documentVersionId nullable):** Not applied — nullable is intentional for draft/in-progress reviews that haven't selected a version yet.

## Commits

| Fix | Commit |
|-----|--------|
| Externalize checklist items | `abe6856` |
| State-driven approval button | `abe6856` |

## Remaining Warnings

None — all warnings addressed.