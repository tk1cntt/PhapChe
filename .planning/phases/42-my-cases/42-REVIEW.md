---
phase: 42-my-cases
reviewed: 2026-06-13T00:00:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - src/legacy/[locale]/[workspaceSlug]/cases/page.tsx
  - src/legacy/[locale]/[workspaceSlug]/cases/MyCasesClient.tsx
  - tests/my-cases/my-cases-stats.test.tsx
  - tests/my-cases/my-cases-client.test.tsx
  - tests/my-cases/my-cases-integration.spec.tsx
findings:
  critical: 0
  warning: 3
  info: 2
  total: 5
status: issues_found
---

# Phase 42: Code Review Report

**Reviewed:** 2026-06-13
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

Da xem xet 5 file (2 component chinh, 3 file test). Code co chat luong tot, tu dong hoa du lieu tu DB, xu ly filter/sort deu dung. Gap 3 warning va 2 info can luu y.

## Warnings

### WR-01: Redundant SLA variant logic

**File:** `src/legacy/[locale]/[workspaceSlug]/cases/page.tsx:91`
**Issue:** Logic so sanh `remainingHours < 24` tao nhanh `orange`, nhung ngay sau do `remainingHours < 72` cung tra ve `orange`. Nhanh `< 24` la dead code vi no da nam trong `remainingHours < 72`.

```javascript
const slaVariant = remainingHours <= 0 ? 'red' : remainingHours < 24 ? 'orange' : remainingHours < 72 ? 'orange' : 'green';
```

**Fix:** Loai bo so sanh thua, hoac bo sung test case cho 24-72h:
```javascript
const slaVariant = remainingHours <= 0 ? 'red' : remainingHours < 72 ? 'orange' : 'green';
```

---

### WR-02: Empty cleanup effect

**File:** `src/legacy/[locale]/[workspaceSlug]/cases/MyCasesClient.tsx:68-72`
**Issue:** useEffect co cleanup rong, khong lam gi ngoai viec tra ve ham khong co thuc thi. Chung thuc ra `debouncedUpdateURL` da tu quan ly timeout ben trong, nen effect nay khong can thiet.

```javascript
useEffect(() => {
  return () => {
    // Cleanup handled by returning clearTimeout
  };
}, []);
```

**Fix:** Xoa useEffect nay neu khong co cong viec cleanup thuc su:
```javascript
// Remove this entire useEffect block
```

---

### WR-03: Type fallback co the tao chuoi sai

**File:** `src/legacy/[locale]/[workspaceSlug]/cases/page.tsx:115`
**Issue:** Neu `req.matterType` co gia tri (vi du "Contract Review") nhung `intakeSubmission` null, thi ket qua se la:
`"Contract Review".split(' ').slice(0, 3).join(' ')` = `"Contract Review"`

Vi du nay co vẻ OK, nhung neu `req.matterType = "Employment Agreement"` va `req.title = "Employment Contract Review"` thi:
`type = "Employment Agreement"` (tu matterType) + `" "` + `title.split(' ').slice(0, 3)` = `"Employment Employment Contract"` (ke qua sai)

Thuc te `req.matterType` co vẻ la truong optional tren LegalRequest model, nen can kiem tra xem du lieu co gap case nay khong.

**Fix:** Neu `req.matterType` co gia tri, su dung truc tiep; khong merge voi title:
```javascript
const matterTypeLabel = req.intakeSubmission?.matterType?.label_vi 
  ?? req.intakeSubmission?.matterType?.label_en 
  ?? req.matterType 
  ?? req.title.split(' ').slice(0, 3).join(' ');
```

---

## Info

### IN-01: Code smell - so sanh `req.statusBadge !== statusMap[selectedStatus]` co the undefined

**File:** `src/legacy/[locale]/[workspaceSlug]/cases/MyCasesClient.tsx:101`
**Issue:** Neu `statusMap[selectedStatus]` tra ve undefined (vi du `selectedStatus = 'triage'`), thi so sanh `req.statusBadge !== undefined` se luon true, khong loc gi ca. Tuy nhien day co vẻ la hanh vi mong muon (khong hien thi request neu filter khong khop).

**Fix:** Them fallback hoac log warning:
```javascript
const mappedStatus = statusMap[selectedStatus];
if (mappedStatus === undefined) {
  console.warn(`Unknown status filter: ${selectedStatus}`);
  return true; // Hoac return false de an tat ca
}
if (req.statusBadge !== mappedStatus) return false;
```

---

### IN-02: Tests khong cover component rendering thuc su

**File:** `tests/my-cases/my-cases-integration.spec.tsx:4-5`
**Issue:** Ghi chu trong file noi rang "Full component integration tests require next-intl mocking which is complex." Cac test hien tai chi kiem tra filter logic tach biet, khong render MyCasesClient that su.

**Fix:** Neu co the, them it nhat 1 test render component voi mock nho gon:
```javascript
// Ví dụ với React Testing Library
import { render, screen } from '@testing-library/react';
import { MyCasesClient } from '@/legacy/[locale]/[workspaceSlug]/cases/MyCasesClient';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));
```

---

_Reviewed: 2026-06-13_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
