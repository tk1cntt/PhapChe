# Phase 16: Fix 14 Failed Routes Discovered By Validated Screenshot Capture - Context

**Gathered:** 2026-06-06 (updated)
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix the 14 routes that failed the validated screenshot pass from quick task `260606-pfi`, then re-run the validation/capture workflow so those routes no longer produce accidental 404/500/runtime failures. This phase is a repair and hardening phase for existing pages only; it does not add new product capabilities.

The canonical fail list is the quick task report. Passing routes from the quick task are not in scope except where a shared fix is needed.

</domain>

<decisions>
## Implementation Decisions

### Failure Scope
- **D-01:** Use `.planning/quick/260606-pfi-m-t-t-c-c-c-trang-hi-n-c-ki-m-tra-hi-n-t/validation-results.json` and `260606-pfi-SUMMARY.md` as the canonical list of 14 failed routes.
- **D-02:** Do not broaden this phase into general UI cleanup or full typecheck cleanup. Fix only issues needed to make the 14 failed routes render correctly and validate cleanly.
- **D-03:** Preserve the prior guarantee: screenshots must only be taken after route validation passes. Failed routes should remain documented, not captured as if successful.

### Auth And Role Coverage
- **D-04:** Validate routes with role-appropriate sessions/users instead of relying only on the specialist demo login. Admin-only pages should be checked with coordinator/admin role; reviewer pages with reviewer role; specialist pages with specialist role; customer pages with customer role or valid customer ownership fixture.
- **D-05:** A route may show an intentional access-denied/empty state when the current user lacks permission, but it must not crash into raw 500 or accidental Next error overlay.
- **D-06:** Seed or reuse minimal demo users/data needed to exercise each role safely. Do not hard-code frontend status transitions or bypass backend permission/state-machine rules.

### Server/Client Component Boundaries
- **D-07:** Fix Ant Design `Table` failures by keeping Prisma/data fetching in Server Components and moving interactive/render-function table definitions into small Client Components where needed.
- **D-08:** Prefer surgical per-page client table components over broad rewrites. Reuse existing Ant Design layout/style patterns and avoid speculative abstractions.
- **D-09:** Known error class to eliminate: `Functions cannot be passed directly to Client Components` on `/specialist/requests` and `/reviewer/requests`.

### Route And Data Handling
- **D-10:** Dynamic routes must be validated with real IDs derived from seeded/dev data, not placeholder IDs. If required records are missing, create minimal fixtures through existing Prisma/seed patterns.
- **D-11:** Template, vault, request detail, reviewer detail, and specialist detail routes should render valid content, a deliberate empty state, or a deliberate not-found/access-denied UI. They should not return accidental 404/500 for valid seeded test scenarios.
- **D-12:** Known error class to eliminate: `Element type is invalid` on `/admin/ops` and `/admin/ops/[requestId]`.

### Verification
- **D-13:** Re-run the same validation/capture script approach from quick task `260606-pfi` after fixes. Update it only if needed to support role-specific sessions and valid fixture discovery.
- **D-14:** Success means every route from the original 14-route fail list either passes validation and gets a screenshot, or is explicitly classified as an intentional non-error access-denied/empty/not-found state with no runtime overlay, blank body, or HTTP 500.
- **D-15:** Run `npm run typecheck` as a diagnostic. Existing unrelated type errors should be documented, but not allowed to expand phase scope unless they directly block the 14 failed routes.

### Claude's Discretion
- Exact client component filenames and whether to use one table component per page or a small shared helper are left to planner/executor, with the simplicity rule: no abstraction unless reused by more than one failing route naturally.
- Exact seed fixture shape is left to planner/executor, constrained by role correctness, tenant/workspace isolation, and existing Prisma schema.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Failure evidence
- `.planning/quick/260606-pfi-m-t-t-c-c-c-trang-hi-n-c-ki-m-tra-hi-n-t/260606-pfi-SUMMARY.md` — Human-readable fail list and screenshot policy from the validated capture quick task.
- `.planning/quick/260606-pfi-m-t-t-c-c-c-trang-hi-n-c-ki-m-tra-hi-n-t/validation-results.json` — Raw route-by-route validation evidence, concrete routes, sample IDs, and error messages.
- `.planning/quick/260606-pfi-m-t-t-c-c-c-trang-hi-n-c-ki-m-tra-hi-n-t/validate-and-capture.cjs` — Current validation/capture harness to rerun or adapt for role-specific validation.

### Project constraints
- `.planning/REQUIREMENTS.md` — Product requirements, v1.0 shipped scope, known technical debt, and constraints for legal accuracy, security, workflow integrity, and traceability.
- `.planning/STATE.md` — Current milestone state and quick task record for `260606-pfi`.
- `.planning/ROADMAP.md` — Phase 16 roadmap entry and dependency on Phase 15 auth.

### Failing route source files
- `src/app/admin/ops/page.tsx` — Failing `/admin/ops`, currently reports `Element type is invalid`.
- `src/app/admin/ops/[requestId]/page.tsx` — Failing `/admin/ops/[requestId]`, currently reports `Element type is invalid`.
- `src/app/admin/routing/page.tsx` — Failing `/admin/routing` for specialist demo user with `FORBIDDEN`; needs role-appropriate validation and/or intentional access-denied handling.
- `src/app/admin/templates/page.tsx` — Failing `/admin/templates` in validation as 404.
- `src/app/admin/templates/[templateId]/page.tsx` — Failing template detail route as 404/typecheck form-action errors.
- `src/app/admin/templates/new/page.tsx` — Failing new template route as 404/typecheck form-action errors.
- `src/app/admin/users/page.tsx` — Failing `/admin/users` as 404 for current validation scenario.
- `src/app/admin/vault/page.tsx` — Failing `/admin/vault` as 404 for current validation scenario.
- `src/app/customer/requests/[requestId]/page.tsx` — Failing customer request detail as 404 for current sample/user.
- `src/app/requests/[requestId]/page.tsx` — Failing generic request detail as 404.
- `src/app/reviewer/requests/page.tsx` — Failing reviewer queue due to Server/Client component boundary with AntD Table columns.
- `src/app/reviewer/requests/[requestId]/review/[documentVersionId]/page.tsx` — Failing reviewer detail/review route as 404.
- `src/app/specialist/requests/page.tsx` — Failing specialist queue due to Server/Client component boundary with AntD Table columns.
- `src/app/specialist/requests/[requestId]/page.tsx` — Failing specialist request detail as 404.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/(auth)/sign-in/page.tsx` and `src/components/auth/SignInForm.tsx` — Existing Better Auth login flow used by validation bootstrap.
- `src/lib/security/session` — Existing `requireAppSession()` and role/workspace session semantics used by protected routes.
- `prisma/seed.ts` — Existing seed pattern for specialist/reviewer demo users and workspace/routing capability data.
- `src/lib/ops/ops-service` — Existing ops dashboard/timeline service used by `/admin/ops*` routes.
- `.planning/quick/260606-pfi-.../validate-and-capture.cjs` — Existing Playwright route discovery/validation/capture harness.

### Established Patterns
- Next.js App Router route files live under `src/app/**/page.tsx`.
- Data fetching is generally done in async Server Components with Prisma/service calls.
- Ant Design components are used across admin/specialist/customer/reviewer pages after Phase 14 migration.
- Protected pages rely on backend/session/role checks; frontend must not hard-code workflow or permission decisions.

### Integration Points
- Role-specific validation must integrate with Better Auth session cookies and seeded users from Phase 15.
- Failing queue pages integrate with AntD `Table` and need client-safe column/render handling.
- Dynamic detail routes integrate with Prisma IDs for legal requests, templates, document versions, reviews, and vault data.
- Verification integrates with the screenshot capture artifacts under `.planning/quick/260606-pfi-.../screenshots/`.

</code_context>

<specifics>
## Specific Ideas

- User explicitly complained that previous screenshots were taken while pages were visibly broken. This phase must keep the strict rule: validate first, screenshot second.
- The phase should prioritize making the known 14 routes render correctly over broad cleanup.
- The final evidence should make it obvious which route was fixed and which screenshot corresponds to it.

</specifics>

<deferred>
## Deferred Ideas

- Full visual regression testing framework is out of scope unless required by planner for minimal validation; current requirement is to fix the known failed routes and rerun validated screenshot capture.
- Broad TypeScript debt unrelated to the 14 failed routes remains deferred unless it directly blocks these route fixes.
- Product enhancements to templates, vault, routing, or review workflows are out of scope; this is a repair phase.

</deferred>

---

*Phase: 16-fix-14-failed-routes-discovered-by-validated-screenshot-capt*
*Context gathered: 2026-06-06*
