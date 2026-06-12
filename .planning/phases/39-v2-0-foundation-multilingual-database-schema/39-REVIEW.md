---
phase: 39-v2-0-foundation-multilingual-database-schema
reviewed: 2026-06-12T00:00:00Z
depth: standard
files_reviewed: 24
files_reviewed_list:
  - prisma/schema.prisma
  - src/lib/i18n/types.ts
  - src/lib/i18n/get-localized-content.ts
  - src/lib/i18n/seed-multilingual.ts
  - src/lib/i18n/index.ts
  - src/lib/i18n/README.md
  - src/components/LanguageSwitcher.tsx
  - scripts/migrate-existing-data.ts
  - scripts/seed-coverage.ts
  - scripts/i18n-coverage.ts
  - scripts/README.md
  - scripts/VERIFICATION.md
  - src/lib/intake/catalog.ts
  - src/v2/README.md
  - src/v2/docs/COMPONENTS.md
  - src/v2/docs/API_CONVENTIONS.md
  - src/v2/docs/I18N_PATTERN.md
  - src/v2/lib/index.ts
  - src/v2/components/ui/index.ts
  - src/legacy/README.md
  - MIGRATION-POLICY.md
  - tests/e2e/multilingual.spec.ts
findings:
  critical: 1
  warning: 3
  info: 4
  total: 8
status: issues_found
---

# Phase 39: Code Review Report

**Reviewed:** 2026-06-12
**Depth:** standard
**Files Reviewed:** 24
**Status:** issues_found

## Summary

Implementation multilingual database schema cho Phase 39. Schema Prisma va cac utilities i18n co总体结构良好, tuy nhien co 1 bug nghiêm trong ve mat loss query parameters trong LanguageSwitcher va 3 warnings can chu y.

## Critical Issues

### CR-01: LanguageSwitcher mat query parameters khi chuyen doi locale

**File:** `src/components/LanguageSwitcher.tsx:24-28`
**Issue:** Ham `getLocalizedPath` khong preserve query strings hoac hash fragments khi chuyen doi locale. User dang o `/vi/dashboard?q=search` se mat query parameter sau khi chuyen sang locale khac.

**Fix:**
```typescript
function getLocalizedPath(pathname: string, locale: string) {
  const segments = pathname.split('/').filter(Boolean);
  const [pathnameOnly, queryHash] = segments[segments.length - 1].split(/[?#]/);
  
  if (routing.locales.includes(segments[0] as (typeof routing.locales)[number])) {
    segments[0] = locale;
    segments[segments.length - 1] = queryHash ? `${pathnameOnly}${queryHash}` : pathnameOnly;
  } else {
    segments.unshift(locale);
  }
  
  const basePath = '/' + segments.join('/');
  return queryHash ? `${basePath}${queryHash.startsWith('?') ? queryHash : '?' + queryHash.split('#')[0]}` : basePath;
}
```

## Warnings

### WR-01: Redundant check trong getLocalized function

**File:** `src/lib/i18n/get-localized-content.ts:22-23`
**Issue:** Condition `if (localeKey !== 'vi' && field[localeKey])` da kiem tra field[localeKey] truthy, nhung return statement la `field[localeKey] || ''` du thua. Neu field[localeKey] la truthy, no se always return field[localeKey]; phan `|| ''` khong bao gio duoc execute.

**Fix:**
```typescript
// Try requested locale first
if (localeKey !== 'vi' && field[localeKey]) {
  return field[localeKey];
}
```

### WR-02: Missing error handling trong i18n-coverage.ts

**File:** `scripts/i18n-coverage.ts:15-18`
**Issue:** `loadMessages` function su dung `fs.readFileSync` va `JSON.parse` ma khong co try-catch. Neu file JSON bi corrupt hoac missing, script se crash voi unhandled exception.

**Fix:**
```typescript
function loadMessages(locale: string) {
  const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    // ... rest of function
  } catch (error) {
    throw new Error(`Failed to load messages for locale ${locale}: ${error instanceof Error ? error.message : String(error)}`);
  }
}
```

### WR-03: No explicit type annotation cho locale parameter

**File:** `scripts/i18n-coverage.ts:15`
**Issue:** Function parameter `locale` khong co type annotation, su dung implicit `any` from CommonJS. Nên annotate ro rang.

**Fix:**
```typescript
function loadMessages(locale: string): { locale: string; keys: Set<string>; missing: string[]; extra: string[] } {
```

## Info

### IN-01: Unused variable declaration

**File:** `scripts/seed-coverage.ts:14`
**Issue:** `type Locale = 'vi' | 'en' | 'zh' | 'ja';` duoc khai bao nhung khong su dung trong code. Bien nay trung lap voi `SUPPORTED_LOCALES` tu types.ts.

**Fix:** Xoa dong khai bao hoac su dung trong code.

### IN-02: Unreachable code path in getLocalized

**File:** `src/lib/i18n/get-localized-content.ts:23`
**Issue:** `return field[localeKey] || '';` - phan `|| ''` khong bao gio execute vi condition o line 22 da dam bao field[localeKey] la truthy. Day la dead code nhung khong gay loi.

### IN-03: Redundant cast trong LanguageSwitcher

**File:** `src/components/LanguageSwitcher.tsx:27`
**Issue:** Cast `routing.locales[number]` la mot workaround cua TypeScript, co the lam giam kha nang doc code. Co the dinh nghia mot type rieng de tang claridad.

### IN-04: Documentation-only files khong co issues

**Files:** `src/lib/i18n/README.md`, `scripts/README.md`, `scripts/VERIFICATION.md`, `src/v2/docs/*.md`, `src/legacy/README.md`, `MIGRATION-POLICY.md`
**Issue:** Cac file nay la documentation, khong co logic code de review.

---

_Reviewed: 2026-06-12_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
