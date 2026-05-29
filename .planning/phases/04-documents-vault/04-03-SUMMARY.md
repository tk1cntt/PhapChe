---
phase: 04-documents-vault
plan: 03
subsystem: ui
tags: [nextjs, react, prisma, server-components, client-components, legal-workbench]

requires:
  - phase: 04-documents-vault
    provides: "template-service (getTemplatesForGeneration), draft-service (generateDraft, listDocumentVersions, submitForReview), vault-service (listVaultFiles)"
  - phase: 04-documents-vault
    provides: "DocumentTemplate, DocumentVersion, VaultFile Prisma models"
provides:
  - "Specialist workbench UI: draft generation form, document version list, vault file display"
  - "Server actions wrapping draft-service and submit-for-review for client components"
affects: [05-reviewer-portal, 06-customer-delivery]

tech-stack:
  added: []
  patterns: [server-actions-for-client-components, inline-confirmation-dialog]

key-files:
  created:
    - src/app/specialist/requests/[requestId]/actions.ts
    - src/app/specialist/requests/[requestId]/components/generate-draft-form.tsx
    - src/app/specialist/requests/[requestId]/components/document-versions.tsx
    - src/app/specialist/requests/[requestId]/components/vault-files.tsx
  modified:
    - src/app/specialist/requests/[requestId]/page.tsx
    - src/lib/documents/template-service.ts

key-decisions:
  - "Server actions in dedicated actions.ts file to wrap service calls requiring session"
  - "Native buttons instead of Button component for onClick handlers (Button lacks onClick prop)"
  - "Export TemplateVariable type from template-service for client component type safety"

patterns-established:
  - "Server action wrapper pattern: 'use server' file wraps service functions with requireAppSession()"
  - "Inline confirmation for destructive actions instead of modal dialog (MVP simplicity)"

requirements-completed: [DOC-04, DOC-06, VLT-04, VLT-05]

duration: 9min
completed: 2026-05-29
---

# Phase 04 Plan 03: Specialist Workbench Summary

**Specialist workbench UI with template-based draft generation, version history with status tracking, vault file metadata display, and submit-for-review action**

## Performance

- **Duration:** 9 min
- **Started:** 2026-05-29T16:29:11Z
- **Completed:** 2026-05-29T16:37:57Z
- **Tasks:** 4 (+ 1 auto-approved checkpoint)
- **Files modified:** 6

## Accomplishments
- Extended specialist request detail page into full workbench with 3 new sections
- Generate draft form with template selection, variable pre-fill from intake answers, and validation
- Document version list with status badges, content preview, and inline submit-for-review confirmation
- Vault file display with file kind badges (Tai len / Ban nhap) and no storageKey exposure
- Server actions created to bridge client components with server-side services

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend specialist request detail page with workbench sections** - `cf31767` (feat)
2. **Task 2: Create generate draft form component** - `02c8a39` (feat)
3. **Task 3: Create document versions list component** - `72c658c` (feat)
4. **Task 4: Create vault files list component** - `edcb9ce` (feat)
5. **Task 5: Verify specialist workbench functionality** - auto-approved (checkpoint:human-verify)

**Bug fix:** `c2fba88` (fix) - Replace Button with native buttons for onClick support

## Files Created/Modified
- `src/app/specialist/requests/[requestId]/page.tsx` - Extended with workbench sections: templates, versions, vault files
- `src/app/specialist/requests/[requestId]/actions.ts` - Server actions for generateDraft and submitForReview
- `src/app/specialist/requests/[requestId]/components/generate-draft-form.tsx` - Client component: template selection + variable form
- `src/app/specialist/requests/[requestId]/components/document-versions.tsx` - Client component: version list + submit for review
- `src/app/specialist/requests/[requestId]/components/vault-files.tsx` - Client component: vault file metadata display
- `src/lib/documents/template-service.ts` - Exported TemplateVariable type

## Decisions Made
- Created dedicated server actions file (actions.ts) to wrap service functions requiring session authentication
- Used native button elements instead of Button component for click handlers since Button lacks onClick prop
- Exported TemplateVariable type from template-service for type safety in client components

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Exported TemplateVariable type from template-service**
- **Found during:** Task 1 (Extend specialist page)
- **Issue:** TemplateVariable type was not exported but needed by client components
- **Fix:** Added `export` keyword to type definition
- **Files modified:** src/lib/documents/template-service.ts
- **Verification:** TypeScript compilation passes for import statements
- **Committed in:** cf31767 (Task 1 commit)

**2. [Rule 1 - Bug] Replaced Button with native buttons for onClick support**
- **Found during:** Task 3 (Document versions list)
- **Issue:** Button component from admin/ui.tsx does not accept onClick prop in its type definition
- **Fix:** Replaced Button usage with native button elements styled consistently with design system
- **Files modified:** src/app/specialist/requests/[requestId]/components/document-versions.tsx
- **Verification:** TypeScript compilation passes with no errors in workbench files
- **Committed in:** c2fba88 (separate fix commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes necessary for TypeScript compilation. No scope creep.

## Issues Encountered
None beyond the deviations documented above.

## User Setup Required
None - no external service configuration required.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| T-DOC-08 | page.tsx | Server-side RBAC via canAccessRequest gates all data access |
| T-DOC-09 | actions.ts | Server actions validate session via requireAppSession before service calls |

All threat model mitigations from plan satisfied: session-based auth + RBAC on server actions, no storageKey exposure in client components.

## Known Stubs

None. All components wire to real service functions and data sources.

## Next Phase Readiness
- Specialist workbench complete for draft generation and review submission workflow
- Document versions track status through draft -> submitted_for_review -> final lifecycle
- Phase 5 (Reviewer Portal) can consume submitted_for_review versions for QC workflow
- Phase 6 (Customer Delivery) can consume final versions for delivery

## Self-Check: PASSED

All 6 created/modified files verified present. All 5 commit hashes verified in git log.

---
*Phase: 04-documents-vault*
*Completed: 2026-05-29*
