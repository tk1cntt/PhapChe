from pathlib import Path
base = Path('D:/PhapChe/.planning/phases/03-routing')

def patch(name, reps):
    p = base / name
    s = p.read_text(encoding='utf-8')
    for a, b in reps:
        if a not in s:
            print('MISS', name, a[:100])
        s = s.replace(a, b)
    p.write_text(s, encoding='utf-8')

patch('03-01-PLAN.md', [
('@.planning/phases/03-routing/03-RESEARCH.md\n@prisma/schema.prisma', '@.planning/phases/03-routing/03-RESEARCH.md\n@.planning/phases/03-routing/03-PATTERNS.md\n@.planning/phases/03-routing/03-VALIDATION.md\n@prisma/schema.prisma'),
('Add Prisma model `RoutingCapability` with fields', 'Following `03-PATTERNS.md` analog for `prisma/schema.prisma` (`RequestAssignment`, `MatterType`, `WorkspaceMembership`), add Prisma model `RoutingCapability` with fields'),
('Then create failing tests for `upsertMatterType`', 'Following `03-PATTERNS.md` analogs for `src/lib/routing/routing-service.test.ts` (`src/lib/intake/intake.test.ts`, `src/lib/workflow/request-workflow.test.ts`), create failing tests for `upsertMatterType`'),
('Create `src/lib/routing/routing-service.ts`.', 'Following `03-PATTERNS.md` analog for `src/lib/routing/routing-service.ts` (`src/lib/intake/intake-service.ts`), create `src/lib/routing/routing-service.ts`.'),
('Run `npx tsx src/lib/routing/routing-service.test.ts` and `npx tsc --noEmit`.', 'Run `npx tsx src/lib/routing/routing-service.test.ts` and `npx tsc --noEmit`. Follow `.planning/phases/03-routing/03-VALIDATION.md`: typecheck after task, full test after wave.')
])

patch('03-02-PLAN.md', [
('@.planning/phases/03-routing/03-RESEARCH.md\n@src/lib/routing/routing-service.ts', '@.planning/phases/03-routing/03-RESEARCH.md\n@.planning/phases/03-routing/03-PATTERNS.md\n@.planning/phases/03-routing/03-VALIDATION.md\n@src/lib/routing/routing-service.ts'),
('Extend routing service tests for exported `assignRequest`.', 'Following `03-PATTERNS.md` analogs for `src/lib/routing/routing-service.test.ts` (`src/lib/intake/intake.test.ts`, `src/lib/workflow/request-workflow.test.ts`), extend routing service tests for exported `assignRequest`.'),
('- `intake_submitted` assignment reaches `assigned` through backend `triage` then `assigned` transitions, not direct frontend status mutation per D-07.', '- `intake_submitted` assignment reaches `assigned` through backend `intake_submitted -> triage -> assigned` transitions, not direct frontend status mutation per D-07 and resolved research question.'),
('- Audit metadata includes kind, assignee id, request id, matter type, and reason presence/short reason only; no intake answer text per D-15.', '- Audit metadata includes kind, assignee id, request id, matter type, and reason presence/short reason only; no intake answer text per D-15.\n    - If workflow transition fails, no assignment fields, `RequestAssignment` history rows, or `AuditEvent` rows are created.'),
('In one controlled transaction or transaction-compatible sequence: update `LegalRequest.assignedSpecialistId` for `specialist` or `assignedReviewerId` for `reviewer`; append `RequestAssignment` row with full reason; if status is `intake_submitted`, use backend workflow path `intake_submitted -> triage -> assigned`; if status is `triage`, use `triage -> assigned`; if already `assigned`, keep status and append reassignment history.', 'Following `03-PATTERNS.md` analog for `src/lib/routing/routing-service.ts` (`src/lib/intake/intake-service.ts`), use exact assignment contract: first transition workflow using backend `transitionRequestStatus`; for `intake_submitted`, call `intake_submitted -> triage` then `triage -> assigned`; for `triage`, call `triage -> assigned`; for `assigned`, skip workflow transition. Only after successful required workflow transition(s), run one DB transaction that updates `LegalRequest.assignedSpecialistId` for `specialist` or `assignedReviewerId` for `reviewer`, appends `RequestAssignment` row with full reason, and writes audit. If any workflow transition fails, do not create assignment field updates, `RequestAssignment` rows, or audit rows.'),
('- `LegalRequest.status` becomes `assigned` from `intake_submitted` or `triage` through workflow rows.', '- `LegalRequest.status` becomes `assigned` from `intake_submitted` through `intake_submitted -> triage -> assigned`, or from `triage` through `triage -> assigned`.'),
('- `metadataSummary` contains `reasonProvided=true` and does not contain intake answer text.', '- `metadataSummary` contains `reasonProvided=true` and does not contain intake answer text.\n    - Simulated workflow transition failure leaves no assignee field update, no `RequestAssignment`, and no `AuditEvent`.'),
('Run `npx tsx src/lib/routing/routing-service.test.ts` and `npx tsc --noEmit`.', 'Run `npx tsx src/lib/routing/routing-service.test.ts` and `npx tsc --noEmit`. Follow `.planning/phases/03-routing/03-VALIDATION.md`: typecheck after task, full test after wave.')
])

patch('03-03-PLAN.md', [
('@.planning/phases/03-routing/03-UI-SPEC.md\n@src/app/admin/components/ui.tsx', '@.planning/phases/03-routing/03-UI-SPEC.md\n@.planning/phases/03-routing/03-PATTERNS.md\n@.planning/phases/03-routing/03-VALIDATION.md\n@src/app/admin/components/ui.tsx'),
('Create server actions `saveMatterTypeAction`', 'Following `03-PATTERNS.md` analog for `src/app/admin/routing/actions.ts` (`src/app/intake/actions.ts`), create server actions `saveMatterTypeAction`'),
('Create server component page at `/admin/routing`.', 'Following `03-PATTERNS.md` analog for `src/app/admin/routing/page.tsx` (`src/app/admin/requests/page.tsx`), create server component page at `/admin/routing`.'),
('Run `npx tsc --noEmit`. Then manually visit `/admin/routing` in app if dev server available.', 'Run `npx tsc --noEmit`. Follow `.planning/phases/03-routing/03-VALIDATION.md`: typecheck after task, full test after wave. Then manually visit `/admin/routing` in app if dev server available.')
])

patch('03-04-PLAN.md', [
('@.planning/phases/03-routing/03-UI-SPEC.md\n@src/app/admin/components/ui.tsx', '@.planning/phases/03-routing/03-UI-SPEC.md\n@.planning/phases/03-routing/03-PATTERNS.md\n@.planning/phases/03-routing/03-VALIDATION.md\n@src/app/admin/components/ui.tsx'),
('Create server component page `/specialist/requests`.', 'Following `03-PATTERNS.md` analog for `src/app/specialist/requests/page.tsx` (`src/app/admin/requests/page.tsx`), create server component page `/specialist/requests`.'),
('Create server component detail page `/specialist/requests/[requestId]`.', 'Following `03-PATTERNS.md` analog for `src/app/specialist/requests/[requestId]/page.tsx` (`src/app/requests/[requestId]/page.tsx`), create server component detail page `/specialist/requests/[requestId]`.'),
('Run `npx tsc --noEmit`. Manually verify specialist session sees only assigned queue if session fixture available.', 'Run `npx tsc --noEmit`. Follow `.planning/phases/03-routing/03-VALIDATION.md`: typecheck after task, full test after wave. Manually verify specialist session sees only assigned queue if session fixture available.')
])

patch('03-05-PLAN.md', [
('@.planning/phases/03-routing/03-RESEARCH.md\n@package.json', '@.planning/phases/03-routing/03-RESEARCH.md\n@.planning/phases/03-routing/03-VALIDATION.md\n@package.json'),
('Required full check: `npx prisma db push && npx prisma generate && npx tsx src/lib/routing/routing-service.test.ts && npx tsc --noEmit`.', 'Required full check: `npx prisma db push && npx prisma generate && npx tsx src/lib/routing/routing-service.test.ts && npx tsc --noEmit`. Follow `.planning/phases/03-routing/03-VALIDATION.md` before `/gsd-verify-work`: full suite green.')
])
