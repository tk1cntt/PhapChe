---
phase: 02-intake
verified: 2026-05-28T00:00:00Z
status: gaps_found
score: 7/10 must-haves verified
overrides_applied: 0
gaps:
  - truth: "Customer can complete service selection, guided questions, upload, review, and submit from /intake."
    status: failed
    reason: "/intake page is static around demo data; later forms use hard-coded requestId instead of draft id returned by createIntakeDraftAction."
    artifacts:
      - path: "src/app/intake/page.tsx"
        issue: "Uses requestId='demo-request', static review answers, and static uploaded file ho-so-mau.pdf. No data-flow from created draft to answer/upload/submit forms."
    missing:
      - "Carry created request id into subsequent answer/upload/submit steps."
      - "Render review summary from saved/customer-entered answers and attached upload results, not sample placeholders."
  - truth: "Customer actions and status page use actual server-side session, not demo identity."
    status: failed
    reason: "requireAppSession still returns hard-coded demo-customer from database; auth/session fix only moved demo session into shared helper."
    artifacts:
      - path: "src/lib/security/session.ts"
        issue: "where: { id: 'demo-customer', isActive: true } hard-codes actor and workspace source."
      - path: "src/app/intake/actions.ts"
        issue: "Actions call requireAppSession, so all mutations run as demo-customer."
      - path: "src/app/requests/[requestId]/page.tsx"
        issue: "Status route calls requireAppSession, so RBAC is checked against demo-customer, not current customer."
    missing:
      - "Connect requireAppSession to real auth/session source or explicit project-approved auth boundary."
  - truth: "Review step shows actual matter type, answers, uploaded filenames/sizes, and privacy note before submit."
    status: failed
    reason: "Review UI exists but displays placeholder answer text and static uploaded file metadata."
    artifacts:
      - path: "src/app/intake/page.tsx"
        issue: "reviewAnswers uses 'Sẽ được lưu từ câu trả lời của khách hàng'; uploadedFiles uses fixed ho-so-mau.pdf."
    missing:
      - "Populate review from saved answers and attached file metadata for current request."
---

# Phase 2: intake Verification Report

**Phase Goal:** Let SME customers submit legal requests through structured chat/form intake.
**Verified:** 2026-05-28T00:00:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|---|---|---|
| 1 | Customer can select legal service type and answer guided questions. | VERIFIED | `src/lib/intake/catalog.ts` defines supported and unsupported services with question schemas; `src/app/intake/components.tsx` renders service cards and question inputs. |
| 2 | System stores structured intake answers with schema version. | VERIFIED | `prisma/schema.prisma` has `IntakeSubmission` with `matterTypeKey`, `schemaVersion`, `answers`, `answerLabels`; `saveIntakeAnswers` updates structured JSON and labels. |
| 3 | Customer can upload files to request with private metadata. | VERIFIED | `attachIntakeFileAction` calls `attachIntakeFile`; service checks `canAccessRequest`, creates `vaultFile`, returns filename/size only, private storageKey not returned. |
| 4 | Customer can see submitted request status. | VERIFIED | `src/app/requests/[requestId]/page.tsx` loads request, maps statuses to Vietnamese copy, no mutation controls. |
| 5 | Unsupported requests are marked for human triage. | VERIFIED | `submitIntake` validates coordinator before submit, transitions to `intake_submitted`, then to `triage` for `unsupported`. |
| 6 | Customer can complete service selection, guided questions, upload, review, and submit from `/intake`. | FAILED | `/intake` uses `demo-request`, sample review answers, and sample file; created draft id does not flow into later forms. |
| 7 | Upload step calls backend attachIntakeFile and displays filename and size only. | VERIFIED | `UploadStep` displays filename/size only; action returns `{ filename, size }`. |
| 8 | Review step shows matter type, answers, uploaded filenames/sizes, and privacy note before submit. | FAILED | `ReviewSummary` can render these, but page passes placeholders/static data, not actual saved answers/uploads. |
| 9 | Submitted request redirects to read-only Vietnamese status view. | VERIFIED | `submitIntakeAction` redirects to `/requests/${submitted.id}`; status route is read-only Vietnamese. |
| 10 | Customer actions and status page use actual server-side session, not demo identity. | FAILED | `requireAppSession` queries `id: 'demo-customer'`; actions and status page depend on it. |

**Score:** 7/10 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `prisma/schema.prisma` | MatterType, IntakeSubmission, VaultFile request linkage | VERIFIED | Models and relations exist. |
| `prisma/seed.ts` | Seed MVP matter types | VERIFIED | Seeds all `MATTER_CATALOG` entries. |
| `src/lib/intake/catalog.ts` | MVP service catalog and question schemas | VERIFIED | Contains agency, labor, trademark, unsupported. |
| `src/lib/intake/intake-service.ts` | Create/save/submit service and triage path | VERIFIED | Uses RBAC, answer validation, workflow transitions, audit summaries. |
| `src/lib/intake/upload-service.ts` | Private upload attachment service | VERIFIED | Uses `canAccessRequest`, creates `VaultFile`, audits filename/size/hash, returns no storageKey/URL. |
| `src/app/intake/actions.ts` | Server actions | PARTIAL | Actions wired, but session source is demo via `requireAppSession`. |
| `src/app/intake/page.tsx` | Customer intake route | FAILED | Static demo request/data breaks end-to-end current-request flow. |
| `src/app/intake/components.tsx` | Guided UI components | VERIFIED | Components substantive and Vietnamese; can render required flow. |
| `src/app/requests/[requestId]/page.tsx` | Read-only customer status route | PARTIAL | Read-only and RBAC check exists; session source is demo. |
| `src/lib/security/session.ts` | Server-side session helper | FAILED | Hard-coded `demo-customer`; not actual current customer session. |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `src/app/intake/actions.ts` | `src/lib/intake/intake-service.ts` | server action calls create/save/submit | WIRED | Imports and calls `createDraftIntake`, `saveIntakeAnswers`, `submitIntake`. |
| `src/app/intake/actions.ts` | `src/lib/intake/upload-service.ts` | attachIntakeFileAction calls attachIntakeFile | WIRED | Imports and calls `attachIntakeFile`. |
| `src/app/intake/actions.ts` | `/requests/[requestId]` | submit redirect | WIRED | `redirect(`/requests/${submitted.id}`)`. |
| `src/lib/intake/intake-service.ts` | workflow state machine | transitionRequestStatus | WIRED | Submit and unsupported triage use `transitionRequestStatus`. |
| `src/lib/intake/upload-service.ts` | RBAC | canAccessRequest | WIRED | Upload rejects forbidden request before metadata write. |
| `src/app/intake/page.tsx` | current request state | draft id to later forms | NOT_WIRED | Later forms use `demo-request`, not created draft id. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|---|---|---|---|---|
| `src/app/intake/page.tsx` | `requestId` hidden inputs | hard-coded `demo-request` | No | HOLLOW_PROP |
| `src/app/intake/page.tsx` | `reviewAnswers` | static strings | No | STATIC |
| `src/app/intake/page.tsx` | `uploadedFiles` | static `ho-so-mau.pdf` | No | STATIC |
| `src/app/requests/[requestId]/page.tsx` | `request` | Prisma `legalRequest.findUnique` after RBAC | Yes | FLOWING |
| `src/lib/intake/intake-service.ts` | `answers` | Prisma `intakeSubmission` JSON | Yes | FLOWING |
| `src/lib/intake/upload-service.ts` | `vaultFile` | Prisma `vaultFile.create` | Yes | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|---|---|---|---|
| Automated tests/typecheck | Orchestrator supplied `intake.test.ts`, `upload-service.test.ts`, `actions.test.ts`, `npm run typecheck`, schema drift false | Passed before verification | PASS |
| Static data-flow grep | Search for `demo-request`, sample review text, `ho-so-mau`, `demo-customer` | Found in `src/app/intake/page.tsx` and `src/lib/security/session.ts` | FAIL |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| INT-01 | 02-01, 02-02 | Customer can start legal request from chat/form by selecting service type. | PARTIAL | Service catalog/UI/action exist, but `/intake` does not carry created draft id into rest of flow. |
| INT-02 | 02-01, 02-02 | System asks structured intake questions based on selected service type. | SATISFIED | Catalog question schemas and `QuestionStep` render fields. |
| INT-03 | 02-01, 02-02 | System saves answers as structured intake data with schema version. | SATISFIED | `IntakeSubmission` and `saveIntakeAnswers` persist JSON answers and labels with schemaVersion. |
| INT-04 | 02-02, 02-03 | Customer can upload supporting files to a request. | PARTIAL | Backend upload works, but `/intake` hard-codes `demo-request`, so actual current request upload flow is broken. |
| INT-05 | 02-02 | Customer can see request status after submission. | PARTIAL | Status route exists, but session source is hard-coded demo user. |
| INT-06 | 02-01, 02-02 | System marks unsupported requests as requiring human triage. | SATISFIED | Backend unsupported path transitions through workflow to `triage`; UI/status uses Vietnamese triage copy. |

All required IDs INT-01 through INT-06 accounted for from PLAN frontmatter and `.planning/REQUIREMENTS.md`.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---:|---|---|---|
| `src/app/intake/page.tsx` | 38, 43, 48 | `requestId="demo-request"` | Blocker | Later actions do not operate on created customer draft. |
| `src/app/intake/page.tsx` | 8-11 | Placeholder answer/file data | Blocker | Review does not show actual customer answers/uploads. |
| `src/lib/security/session.ts` | 12 | `id: 'demo-customer'` | Blocker | RBAC/audit/session identity not actual customer. |

### Human Verification Required

None. Automated/static verification already found blocking gaps.

### Gaps Summary

Phase 2 backend foundation is mostly real: catalog, structured persistence, workflow submit/triage, private upload metadata, audit summaries, and read-only status route exist. Goal still not achieved because customer-facing `/intake` is not end-to-end wired to current request state and session identity remains demo-based. User cannot reliably submit own legal request through structured intake from `/intake` without demo data assumptions.

---

_Verified: 2026-05-28T00:00:00Z_
_Verifier: Claude (gsd-verifier)_
