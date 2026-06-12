---
phase: 39-v2-0-foundation-multilingual-database-schema
fixed_at: 2026-06-12T23:45:00Z
review_path: .planning/phases/39-v2-0-foundation-multilingual-database-schema/39-REVIEW.md
iteration: 1
findings_in_scope: 4
fixed: 4
skipped: 0
status: all_fixed
---

# Phase 39: Code Review Fix Report

**Fixed at:** 2026-06-12T23:45:00Z
**Source review:** .planning/phases/39-v2-0-foundation-multilingual-database-schema/39-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 4 (Critical: 1, Warning: 3)
- Fixed: 4
- Skipped: 0

## Fixed Issues

### CR-01: LanguageSwitcher mat query parameters khi chuyen doi locale

**Files modified:** `src/components/LanguageSwitcher.tsx`
**Commit:** b08fb41
**Applied fix:** Added query string and hash extraction/preservation logic to `getLocalizedPath` function. The function now extracts `?query` and `#hash` from the pathname before locale replacement, then appends them to the resulting localized path.

### WR-01: Redundant check trong getLocalized function

**Files modified:** `src/lib/i18n/get-localized-content.ts`
**Commit:** 641bd32
**Applied fix:** Removed redundant `|| ''` after `return field[localeKey]` since the condition `if (localeKey !== 'vi' && field[localeKey])` already guarantees field[localeKey] is truthy.

### WR-02: Missing error handling trong i18n-coverage.ts

**Files modified:** `scripts/i18n-coverage.ts`
**Commit:** 92dbd26
**Applied fix:** Wrapped `fs.readFileSync` and `JSON.parse` calls in try-catch block. Script now throws descriptive error if message file is missing or corrupted.

### WR-03: No explicit type annotation cho locale parameter

**Files modified:** `scripts/i18n-coverage.ts`
**Commit:** 92dbd26
**Applied fix:** Added explicit `locale: string` parameter type and `CoverageResult` return type interface to `loadMessages` function. Also added `CoverageResult` interface for better type safety.

---

_Fixed: 2026-06-12_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
