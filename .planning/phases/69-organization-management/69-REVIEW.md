---
phase: 69
reviewed: 2026-06-15T00:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - src/app/api/admin/organizations/route.ts
  - src/app/api/admin/organizations/[id]/route.ts
  - src/app/[locale]/admin/organizations/page.tsx
  - src/app/[locale]/admin/organizations/[id]/page.tsx
findings:
  critical: 2
  warning: 3
  info: 4
  total: 9
status: needs-fix
---

# Phase 69: Code Review Report

**Reviewed:** 2026-06-15
**Depth:** standard
**Files Reviewed:** 4
**Status:** needs-fix

## Summary

Reviewed Organization Management implementation across 4 files. Found 2 critical runtime issues that will cause crashes, including accessing a non-existent `slug` field from Prisma schema. Multiple inconsistencies between frontend form data and API expectations, plus missing data in the response chain.

## Critical Issues

### CR-01: Runtime crash - `organization.slug` does not exist in Prisma schema

**File:** `src/app/[locale]/admin/organizations/[id]/page.tsx:358`
**Issue:** The code accesses `organization.slug` but the Prisma `Organization` model does not have a `slug` field. The schema only contains: `id`, `tenantId`, `name`, `businessType`, `registrationNumber`, `address`, `contactEmail`, `status`, `isDefault`, `createdAt`, `updatedAt`. Accessing `organization.slug` will return `undefined` and display "undefined" to users.
**Fix:**
```typescript
// Line 358: Remove this block entirely, or replace with id
<div className="text-sm text-gray-500">{t('formSlug')}</div>
<div className="text-sm font-medium text-gray-900 font-mono">{organization.id}</div>
```
Or simply remove lines 356-359 since there's no slug field.

---

### CR-02: Incorrect API field name - `isActive` vs `status`

**File:** `src/app/[locale]/admin/organizations/[id]/page.tsx:105`
**Issue:** The PATCH request sends `isActive: formData.status === 'active'` but the API at `[id]/route.ts:111` expects `status` field, not `isActive`. This means the status update will silently fail - the API receives an unknown field and ignores it.
**Fix:**
```typescript
// Line 99-107: Change isActive to status
body: JSON.stringify({
  name: formData.name,
  description: formData.description,
  businessType: formData.businessType || undefined,
  contactEmail: formData.contactEmail || undefined,
  address: formData.address || undefined,
  status: formData.status,  // Changed from isActive
}),
```

---

## Warnings

### WR-01: Mismatched field name - `description` vs `registrationNumber`

**File:** `src/app/[locale]/admin/organizations/[id]/page.tsx:76, 101`
**Issue:** `formData.description` is used to store `registrationNumber` (line 76: `description: data.data.registrationNumber || ''`) but is sent to API as `description` instead of `registrationNumber`. The API expects `registrationNumber` (line 101 of route.ts).
**Fix:**
```typescript
// Line 76: Store as registrationNumber
registrationNumber: data.data.registrationNumber || '',

// Line 101: Send as registrationNumber
registrationNumber: formData.registrationNumber || undefined,
```
Also update the form state interface to use `registrationNumber` instead of `description`.

---

### WR-02: Users count always shows 0

**File:** `src/app/[locale]/admin/organizations/[id]/page.tsx:378`
**Issue:** The detail page displays `organization._count?.users` but the API does not query user count - only `_count.workspaces` is included in the Prisma query. This will always show 0.
**Fix:** Either add `_count: { select: { workspaces: true, users: true } }` to the API query (requires verifying the relation exists), or remove the users display from the detail page.

---

### WR-03: Users column in table accesses non-existent data

**File:** `src/app/[locale]/admin/organizations/page.tsx:275`
**Issue:** The list table shows `{org._count?.users || 0}` but `_count.users` is never queried from the API. The API only returns `_count.workspaces`.
**Fix:** Remove line 275 or add user count to the API query.

---

## Info

### IN-01: Raw status values displayed instead of translated labels

**File:** `src/app/[locale]/admin/organizations/page.tsx:280` and `src/app/[locale]/admin/organizations/[id]/page.tsx:216`
**Issue:** The status badge shows raw `org.status` (e.g., "active", "inactive") instead of translated values. The i18n has `statusActive` and `statusInactive` keys available.
**Fix:**
```typescript
// Line 280 (list page) and line 216 (detail page)
<span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor(org.status)}`}>
  {org.status === 'active' ? t('statusActive') : org.status === 'inactive' ? t('statusInactive') : org.status}
</span>
```

---

### IN-02: Duplicate i18n keys in translation files

**Files:** `src/messages/vi.json:187,443` and `src/messages/en.json:187,443`
**Issue:** `statusActive` is defined twice in each file - once in a global section (line 187) and once in AdminOrganizations namespace (line 443). JavaScript JSON parsers use the last occurrence, which may cause confusion.
**Fix:** Remove the duplicate from one location or consolidate to use consistent namespaces.

---

### IN-03: Native browser confirm() for destructive action

**File:** `src/app/[locale]/admin/organizations/[id]/page.tsx:125`
**Issue:** Uses `window.confirm()` for delete confirmation. This is inconsistent with the design system and cannot be styled. Consider using a proper modal component.
**Fix:** Replace with a styled modal component for better UX consistency.

---

### IN-04: Missing registrationNumber in form data initialization

**File:** `src/app/[locale]/admin/organizations/[id]/page.tsx:44-51`
**Issue:** The form state uses `description` instead of `registrationNumber` (see WR-01). The form also lacks a field for `registrationNumber` in the UI while the Organization model includes this field.
**Fix:** Add registrationNumber to form state and include it in the edit form.

---

_Reviewed: 2026-06-15_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
