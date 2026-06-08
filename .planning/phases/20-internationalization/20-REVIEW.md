---
phase: 20
status: clean
files_reviewed: 11
findings:
  critical: 0
  warning: 0
  info: 1
  total: 1
reviewed_at: 2026-06-09
---

# Phase 20: internationalization - Code Review

## Scope

Reviewed source files changed for Phase 20:

- `next.config.ts`
- `src/i18n.ts`
- `src/middleware.ts`
- `src/components/LanguageSwitcher.tsx`
- `src/app/[locale]/layout.tsx`
- `src/app/[locale]/page.tsx`
- `src/app/[locale]/customer/page.tsx`
- `src/app/[locale]/customer/requests/page.tsx`
- `src/app/[locale]/customer/requests/[requestId]/page.tsx`
- `src/app/[locale]/intake/page.tsx`
- `e2e/internationalization.spec.ts`

## Findings

### Info

#### INFO-01 — LanguageSwitcher preserves pathname, not query string

`LanguageSwitcher` now preserves the logical pathname when changing locale, e.g. `/vi/customer` → `/en/customer`. It does not preserve query strings such as `?page=2`.

This is acceptable for Phase 20 because the locked decision and e2e acceptance criteria require preserving the logical page path. Query preservation can be refined later if pagination language switching becomes a user-visible requirement.

## Security Review

- `/sign-in` and `/api/auth` remain excluded from locale prefix/auth middleware matching.
- Localized protected routes still redirect unauthenticated users to `/sign-in`.
- Existing page-level `requireAppSession()` checks are reused via wrappers and not weakened.
- No changes were made to vault signed URLs, tenant/workspace checks, or document access rules.

## Quality Review

- Route wrappers are minimal and avoid duplicating customer/intake business logic.
- `next-intl` plugin path explicitly points to existing `src/i18n.ts`, avoiding unnecessary file moves.
- E2E coverage was added for the UI-visible i18n behavior.

## Result

No blocking issues found.
