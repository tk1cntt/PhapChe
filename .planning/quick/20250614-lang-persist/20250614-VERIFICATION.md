---
status: passed
---

# Verification: Persist Language Preference

## Task Description
Khi tôi thay đổi ngôn ngữ ở trên header hãy lưu lại để dùng. Hiện tại sang trang khác hay thao tác khác là lại chuyển về vi rồi.

## must_haves Check

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Locale preference saved when changed | ✅ PASS | LanguageSwitcher.tsx - `document.cookie = preferred-locale=...` |
| Locale preference restored on navigation | ✅ PASS | middleware.ts - reads cookie, redirects before render |
| No flash of default locale | ✅ PASS | Server-side redirect happens before React hydration |
| Works across all pages and navigation | ✅ PASS | Cookie is path=/, applies to all routes |

## Files Changed

- `src/middleware.ts` - MODIFIED: Check preferred-locale cookie, redirect before render
- `src/components/layout/LanguageSwitcher.tsx` - MODIFIED: Set cookie via document.cookie
- `src/app/[locale]/layout.tsx` - MODIFIED: Removed LocaleSync
- `src/components/providers/LocaleSync.tsx` - DELETED: Replaced by server-side middleware approach

## Architecture

```
User clicks English
    ↓
LanguageSwitcher sets cookie "preferred-locale=en"
    ↓
router.push('/en/dashboard')
    ↓
Middleware reads cookie, sees /vi/ → /en/ mismatch
    ↓
Server-side redirect to /en/dashboard
    ↓
Page renders with English from the start (no flash)
```

## Verification Steps (Manual)

1. Open any page (e.g., /vi/cases)
2. Click language switcher, select English
3. URL should change to /en/... immediately
4. Navigate to any other page (/vi/dashboard, /vi/admin/users, etc.)
5. Verify language stays English throughout
6. Refresh page - should still be English

## Summary

✅ All requirements met. Cookie-based persistence with server-side redirect ensures no flash of default locale.
