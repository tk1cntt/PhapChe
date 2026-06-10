# Phase 22: tech-debt-cleanup - Context

**Gathered:** 2026-06-10 (auto mode)
**Status:** Ready for planning

<domain>
## Phase Boundary

Address accumulated tech debt from v1.1 development — fix TypeScript errors, fix useSearchParams Suspense issue in /reviewer/requests, add error boundaries to admin pages.

**In scope:**
- TypeScript error audit and fixes across the codebase
- Fix useSearchParams Suspense boundary issue in /reviewer/requests
- Add Error Boundaries to admin pages
- Verify fixes don't introduce regressions

**Out of scope:**
- New feature development
- Database schema changes
- UI redesign work

</domain>

<decisions>
## Implementation Decisions

### TypeScript Error Fixes
- **D-01:** Audit TypeScript errors using `npx tsc --noEmit`
- **D-02:** Fix pre-existing TypeScript errors in template pages
- **D-03:** Ensure ops code is TypeScript-clean
- **D-04:** Use `// @ts-ignore` sparingly and only with inline comment explaining why

### useSearchParams Suspense Fix
- **D-05:** Wrap `/reviewer/requests` page components using useSearchParams in Suspense boundary
- **D-06:** Follow Next.js App Router pattern for Suspense-wrapped client components
- **D-07:** Add loading.tsx or use Suspense with skeleton for loading states

### Error Boundary Implementation
- **D-08:** Add Error Boundary components to admin route segments
- **D-09:** Use Next.js error.tsx pattern for route-level error boundaries
- **D-10:** Create custom error UI with retry functionality
- **D-11:** Error boundaries should log errors for debugging

### Verification Strategy
- **D-12:** Run `npx tsc --noEmit` to verify TypeScript fixes
- **D-13:** Test /reviewer/requests route in browser
- **D-14:** Test error boundary triggers on simulated errors

### Claude's Discretion
- Exact component structure for Suspense boundaries
- Specific error boundary placement (per route vs shared)
- Loading state design for Suspense fallback

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Context
- `.planning/phases/21-gap-validation/21-CONTEXT.md` — Prior phase context (i18n auth fixes)
- `.planning/PROJECT.md` — Project constraints including tech debt acknowledgment

### Tech Debt References
- `.planning/STATE.md` — Known issues section mentions pre-existing TypeScript errors
- `src/app/reviewer/requests/page.tsx` — Page needing useSearchParams fix

### Next.js Patterns
- `src/app/**/error.tsx` — Error boundary pattern for route segments
- `src/app/**/loading.tsx` — Loading state pattern
- Next.js App Router Suspense documentation

</canonical_refs>

<codebase_context>
## Existing Code Insights

### Reusable Assets
- Next.js error.tsx pattern — existing route-level error boundary pattern
- Suspense boundary infrastructure — available in Next.js App Router
- Ant Design ErrorBoundary patterns if available

### Established Patterns
- Next.js 14 App Router with route groups
- Ant Design is the UI library (from Phase 14)
- TypeScript strict mode checking

### Integration Points
- /reviewer/requests page uses useSearchParams hook
- Admin route segments need error boundary wrapping
- TypeScript fixes may touch multiple files across codebase

</codebase_context>

<specifics>
## Specific Ideas

- useSearchParams requires Suspense boundary in Next.js 14 App Router
- Error boundaries should provide user-friendly error messages
- TypeScript errors in template pages were acknowledged as pre-existing debt

</specifics>

<deferred>
## Deferred Ideas

- Full typecheck pass across entire codebase — focus on ops code only
- Pre-existing typecheck failures in template pages — deferred if too extensive

---

*Phase: 22-tech-debt-cleanup*
*Context gathered: 2026-06-10 (auto mode)*
