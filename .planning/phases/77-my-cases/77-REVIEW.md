# Phase 77: Code Review Report

**Reviewed:** 2026-06-21T00:00:00Z
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Reviewed 3 changed files from Phase 77 (My Cases enhancement): `MyCasesClient.tsx`, `MyCasesTable.tsx`, and `vi.json`. Found **1 critical bug** that causes the type filter to be completely non-functional, **1 warning** about pagination not resetting on filter change, and **2 info-level** findings for code duplication and accessibility gaps.

---

## Critical Issues

### CR-01: Type Filter Values Never Match (Filter Completely Broken)

**File:** `src/components/my-cases/MyCasesClient.tsx:112-117`
**Issue:** The type filter is wired with lowercase English values (`contract_review`, `legal_amendment`, etc. - see `MyCasesToolbar.tsx:35-41`) but the filtering logic compares against `req.type.toLowerCase()` which contains Vietnamese text (e.g., `"Rà soát hợp đồng".toLowerCase()` produces `"rà soát hợp đồng"`). The filter will **never match** any requests.

**Breakdown:**
- Toolbar sends: `handleTypeFilter('contract_review')`
- `MyCasesClient.tsx:93`: Sets `selectedType = 'contract_review'`
- `MyCasesClient.tsx:113`: Compares `req.type.toLowerCase()` (which is `"rà soát hợp đồng"`) against `'contract_review'` - **never equal**

**Fix:** The filtering logic needs to match against a field that contains the English type value, or the toolbar needs to send Vietnamese text. Based on the data structure (`type` is Vietnamese, `typeEn` is English), the filter should match `typeEn`:

```typescript
// Line 112-117, change from:
if (selectedType) {
  if (req.type.toLowerCase() !== selectedType.toLowerCase() &&
      req.typeEn.toLowerCase() !== selectedType.toLowerCase()) {
    return false;
  }
}

// To match the English values from toolbar:
if (selectedType) {
  if (req.typeEn.toLowerCase() !== selectedType.toLowerCase()) {
    return false;
  }
}
```

Or alternatively, change the toolbar to send Vietnamese type values that match `req.type`.

---

## Warnings

### WR-01: Pagination Does Not Reset When Filters Change

**File:** `src/components/my-cases/MyCasesTable.tsx:74-88`
**Issue:** When the user applies filters that reduce the result set, the current page number (`current`) is not reset. This can cause the table to display an empty page if the user is on page 3 but filtered results only have 1 page.

**Example scenario:**
1. User is on page 3 with 10 requests (30 total, page size 10)
2. User applies a type filter that returns only 5 requests
3. Table shows empty because pages 1-3 with pageSize 10 would be indices 0-29, but filtered data only has 5 items

**Fix:** Reset `current` to 1 when `requests` prop changes (which happens when filters change):

```typescript
// In MyCasesTable.tsx, add useEffect to reset page:
useEffect(() => {
  setCurrent(1);
}, [requests.length]);
```

---

## Info

### IN-01: Duplicate Interface Definitions

**File:** `src/components/my-cases/MyCasesClient.tsx:13-29` and `src/components/my-cases/MyCasesTable.tsx:10-26`
**Issue:** `CaseRow` and `MyCaseRow` interfaces are identical and defined in both files. This violates DRY and risks divergence if one is updated without the other.

**Fix:** Extract to a shared types file:

```typescript
// src/components/my-cases/types.ts
export interface CaseRow {
  id: string;
  code: string;
  statusText: string;
  type: string;
  typeEn: string;
  statusBadge: 'review' | 'pending' | 'approved' | 'overdue' | 'submitted';
  specialistName: string;
  specialistRole: string;
  updatedDate: string;
  updatedTime: string;
  slaText: string;
  slaVariant: 'green' | 'orange' | 'red' | 'blue';
  remainingHours?: number;
  actionText: string;
  actionHref: string;
}
```

Then import in both files: `import type { CaseRow } from './types';`

---

### IN-02: Accessibility - Dropdown Menus Lack ARIA Attributes

**File:** `src/components/my-cases/MyCasesToolbar.tsx:77-135`
**Issue:** Both status and type dropdowns lack proper ARIA attributes for screen reader support:
- No `aria-expanded` on toggle buttons
- No `aria-haspopup` on toggle buttons
- No `role="listbox"` on dropdown menus
- No `role="option"` on dropdown items
- Click-outside-to-close not implemented (users can't dismiss dropdowns with Escape key)

**Fix:** Add ARIA attributes:

```tsx
<button
  className="tool-btn"
  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
  aria-expanded={showStatusDropdown}
  aria-haspopup="listbox"
>
  {t('statusLabel')}
  <ChevronDown size={16} />
</button>
{showStatusDropdown && (
  <div className="dropdown-menu" role="listbox">
    <button
      className={`dropdown-item ${!selectedStatus ? 'active' : ''}`}
      onClick={() => handleStatusSelect(null)}
      role="option"
      aria-selected={!selectedStatus}
    >
      {t('all')}
    </button>
    ...
  </div>
)}
```

---

## Structural Findings (fallow)

None provided for this phase.

---

_Reviewed: 2026-06-21T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
