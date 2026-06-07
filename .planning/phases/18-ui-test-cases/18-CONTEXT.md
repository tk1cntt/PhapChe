# Phase 18: UI Test Cases - Context

**Gathered:** 2026-06-07
**Status:** Ready for planning
**Source:** User request

<domain>
## Task Boundary

Create UI testcases for each screen based on functionality, test flow transitions between screens, run tests and fix bugs if any found. Report 100% completion when done.

</domain>

<decisions>
## Implementation Decisions

### Test Coverage
- Create testcases for ALL screens/screens in the application
- Cover: login, intake, specialist queue, reviewer queue, admin dashboard, routing, templates, users, vault
- Test user flows: login → intake submission → specialist review → reviewer approval → delivery

### Test Approach
- Use Playwright for E2E UI testing
- Each testcase should verify: page loads, content displays, user interactions work
- Include screenshot capture for each test
- Test screen transitions and state changes

### Screens to Test
1. **Sign-In Screen** (/sign-in)
   - Login form renders
   - Email/password validation
   - Successful login redirects to intake

2. **Intake Screen** (/intake)
   - Service selection renders
   - Questions render based on selection
   - File upload works
   - Review summary shows answers
   - Submit creates request

3. **Specialist Queue** (/specialist/requests)
   - Queue list renders
   - Click navigates to request detail
   - Accept/reject actions work

4. **Reviewer Queue** (/reviewer/requests)
   - Queue list renders
   - Click navigates to review form
   - Approve/reject with comments works

5. **Admin Operations** (/admin/ops)
   - Dashboard renders with metrics
   - Timeline shows activity

6. **Admin Routing** (/admin/routing)
   - Routing table renders
   - Assign/dispatch actions work

7. **Admin Templates** (/admin/templates)
   - Template list renders
   - Create new template works
   - Edit template works

8. **Admin Users** (/admin/users)
   - User list renders
   - Add user works

9. **Admin Vault** (/admin/vault)
   - File list renders
   - File organization works

### Success Criteria
- All screens pass UI tests
- All user flows complete successfully
- No console errors
- 100% test pass rate before final report

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Validation Harness
- `.planning/phases/16-fix-14-failed-routes-discovered-by-validated-screenshot-capt/validate-phase-16-routes.cjs` — Existing Playwright validation pattern

### Components
- `src/app/intake/components.tsx` — Intake UI components
- `src/app/sign-in/page.tsx` — Sign-in page
- `src/app/specialist/requests/page.tsx` — Specialist queue
- `src/app/reviewer/requests/page.tsx` — Reviewer queue
- `src/app/admin/*` — Admin screens

</canonical_refs>

<specifics>
## Specific Ideas

### Test Structure
```
e2e/
├── auth.spec.ts       # Sign-in tests
├── intake.spec.ts    # Intake flow tests
├── specialist.spec.ts  # Specialist queue tests
├── reviewer.spec.ts  # Reviewer queue tests
└── admin.spec.ts     # Admin screens tests
```

### Key Test Scenarios
1. Happy path: Customer submits intake request
2. Specialist receives and processes request
3. Reviewer approves and document generated
4. Customer downloads document

</specifics>

<deferred>
## Deferred Ideas

None — comprehensive UI testing required

</deferred>

---

*Phase: 18-ui-test-cases*
*Context gathered: 2026-06-07 via user request*
