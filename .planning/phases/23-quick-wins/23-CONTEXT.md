# Phase 23: Quick Wins - Context

**Gathered:** 2026-06-10 (auto mode)
**Status:** Ready for planning

<domain>
## Phase Boundary

Admin pages display skeleton loading screens during data fetch and catch errors gracefully with retry capability. Error boundaries and skeleton components are shared across all pages.

</domain>

<decisions>
## Implementation Decisions

### Error Handling
- **D-01:** Use existing error.tsx files in admin routes (already created in Phase 22)
- **D-02:** Error fallback displays error message + Retry button (window.location.reload())
- **D-03:** Shared ErrorFallback component in src/components/ui/ErrorFallback.tsx
- **D-04:** Errors logged to console with stack trace

### Skeleton Loading
- **D-05:** Use Ant Design Skeleton component (antd v6 ships with built-in Skeleton)
- **D-06:** Create PageSkeleton component in src/components/ui/PageSkeleton.tsx for table pages
- **D-07:** Create CardSkeleton component in src/components/ui/CardSkeleton.tsx for card-based pages
- **D-08:** Skeleton components are reusable — imported from src/components/ui/, not hard-coded per page
- **D-09:** Skeleton matches actual layout structure (table rows, card layouts)

### Existing Error Boundaries
- **D-10:** Error boundaries already exist at: src/app/[locale]/admin/*.tsx (9 files)
- **D-11:** New error boundaries should follow same pattern for remaining routes

</decisions>

<canonical_refs>
## Canonical References

### UI/UX Advisory
- `.planning/UI-UX-ADVISORY.md` — Full analysis with recommendations for error handling and skeleton loading

### Existing Patterns
- `src/app/[locale]/admin/error.tsx` — Existing error boundary pattern
- `src/app/reviewer/requests/loading.tsx` — Existing Suspense boundary pattern

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Ant Design Skeleton component (from antd v6)
- Existing error.tsx files in admin routes
- Existing loading.tsx in reviewer/requests

### Established Patterns
- Next.js error.tsx pattern for Error Boundaries
- Next.js loading.tsx pattern for Suspense boundaries
- Ant Design component imports

### Integration Points
- Error boundaries wrap admin page segments
- Skeleton components replace Spin during loading states
- Both integrate with existing page components

</code_context>

<specifics>
## Specific Ideas

From UI-UX-ADVISORY.md:
- "Replace Spin → Skeleton for Users page (as template)"
- "Extract loading/error logic to shared component"
- Error boundary with retry button for user-friendly error recovery

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 23-quick-wins*
*Context gathered: 2026-06-10*
