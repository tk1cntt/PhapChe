# Roadmap: Legal-as-a-Service Platform

**Created:** 2026-05-26
**Last updated:** 2026-06-04
**Milestone:** v1.0 — Gap closure in progress
**Total phases:** 13
**v1 requirements covered:** 46/46
**Plans executed:** 31/31
**Audit:** `.planning/v1.0-MILESTONE-AUDIT.md`

## Progress

| Phase | Name | Requirements | Plans | Status | Completed |
|---|---|---|---:|---|---|
| 01 | foundation | FND-01, FND-02, FND-03, FND-04, FND-05 | 4/4 | Complete with human review debt | 2026-06-01 |
| 02 | intake | INT-01, INT-02, INT-03, INT-04, INT-05, INT-06 | 4/4 | Complete | 2026-06-01 |
| 03 | routing | RTE-01, RTE-02, RTE-03, RTE-04, RTE-05 | 5/5 | Complete | 2026-06-01 |
| 04 | documents-vault | DOC-01..DOC-06, VLT-01..VLT-05 | 4/4 | Executed; verification gaps recorded | 2026-06-01 |
| 05 | review | REV-01..REV-09 | 3/3 | Executed | 2026-06-01 |
| 06 | delivery | DLV-01..DLV-05 | 6/6 | Executed; verification gaps recorded | 2026-06-01 |
| 07 | ops | OPS-01..OPS-05 | 4/4 | Complete | 2026-06-01 |
| 08 | reviewer-service | REV-01..REV-09 | 2/2 | Executed | 2026-06-03 |
| 09 | folder-tag | VLT-05 | 0/0 | Gap closure | — |
| 10 | ux-hardening | DLV-02 UX, DOC-04 listDocumentVersions, deliver/close feedback | 0/0 | Gap closure | — |
| 11 | wire-review-init | REV-02, REV-06, REV-07, REV-08, REV-09 | 1/1 | Gap closure (planned) | — |
| 12 | ops-sla-drill-in | OPS-04 | 0/0 | Gap closure (planned) | — |
| 13 | service-cleanup-wiring | — | 0/0 | Gap closure (planned) | — |

## Phase 01: foundation

**Status:** Complete with human review debt  
**Plans:** 4/4 executed  
**Goal:** Establish secure tenant, user, role, workflow, and audit foundations.  
**Requirements:** FND-01, FND-02, FND-03, FND-04, FND-05  
**UI hint:** yes

Success criteria:
1. Admin can manage users across customer, specialist, reviewer, coordinator, and super admin roles.
2. Requests, documents, reviews, and vault files enforce server-side role and workspace access.
3. Critical actions produce append-only audit events.
4. Request status transitions run through backend workflow rules.

Artifacts:
- `.planning/phases/01-foundation/01-CONTEXT.md`
- `.planning/phases/01-foundation/01-01-SUMMARY.md` through `01-04-SUMMARY.md`
- `.planning/phases/01-foundation/01-VERIFICATION.md` — status: `human_needed`

## Phase 02: intake

**Status:** Complete  
**Plans:** 4/4 executed  
**Goal:** Let SME customers submit legal requests through structured chat/form intake.  
**Requirements:** INT-01, INT-02, INT-03, INT-04, INT-05, INT-06  
**UI hint:** yes

Success criteria:
1. Customer can select legal service type and answer guided questions.
2. System stores structured intake answers with schema version.
3. Customer can upload files and see submitted request status.
4. Unsupported requests are marked for human triage.

Artifacts:
- `.planning/phases/02-intake/02-CONTEXT.md`
- `.planning/phases/02-intake/02-01-SUMMARY.md` through `02-04-SUMMARY.md`
- `.planning/phases/02-intake/02-VERIFICATION.md` — status: `passed`

## Phase 03: routing

**Status:** Complete  
**Plans:** 5/5 executed  
**Goal:** Route requests to the right specialist/reviewer using capability matrix and manual assignment.  
**Requirements:** RTE-01, RTE-02, RTE-03, RTE-04, RTE-05  
**UI hint:** yes

Success criteria:
1. Admin defines matter types and capabilities.
2. System suggests eligible specialists/reviewers for a request.
3. Coordinator can assign/reassign with audit reason.
4. Specialist sees assigned queue and request details.

Artifacts:
- `.planning/phases/03-routing/03-CONTEXT.md`
- `.planning/phases/03-routing/03-01-SUMMARY.md` through `03-05-SUMMARY.md`
- `.planning/phases/03-routing/03-VERIFICATION.md` — status: `passed`

## Phase 04: documents-vault

**Status:** Executed; verification gaps recorded  
**Plans:** 4/4 executed  
**Goal:** Manage templates, generate drafts, and store request artifacts in versioned Legal Vault.  
**Requirements:** DOC-01, DOC-02, DOC-03, DOC-04, DOC-05, DOC-06, VLT-01, VLT-02, VLT-03, VLT-04, VLT-05  
**UI hint:** yes

Success criteria:
1. Admin creates versioned document templates with variables and statuses.
2. Published templates create new versions when changed.
3. Specialist generates draft from approved template and intake answers.
4. Vault stores uploads, drafts, finals, and review artifacts with metadata/versioning.
5. Vault access and file actions are permissioned and audited.

Artifacts:
- `.planning/phases/04-documents-vault/04-CONTEXT.md`
- `.planning/phases/04-documents-vault/04-01-SUMMARY.md` through `04-04-SUMMARY.md`
- `.planning/phases/04-documents-vault/04-VERIFICATION.md` — status: `gaps_found`

## Phase 05: review

**Status:** Executed  
**Plans:** 3/3 executed  
**Goal:** Enforce legal quality control through reviewer portal and checklist approval loop.  
**Requirements:** REV-01, REV-02, REV-03, REV-04, REV-05, REV-06, REV-07, REV-08, REV-09  
**UI hint:** yes

Success criteria:
1. Reviewer sees queue of document versions awaiting review.
2. Reviewer uses split view: draft left, QC checklist right.
3. Checklist covers formal, legal content, and operational/signing criteria.
4. Approval requires completed checklist.
5. Rejection returns document to specialist with failed criteria and comments.
6. Approved version becomes final-ready and decision is audited.

Artifacts:
- `.planning/phases/05-review/05-CONTEXT.md`
- `.planning/phases/05-review/05-01-SUMMARY.md` through `05-03-SUMMARY.md`
- No `05-VERIFICATION.md` currently present.

## Phase 06: delivery

**Status:** Executed; verification gaps recorded  
**Plans:** 6/6 executed  
**Goal:** Deliver approved final documents securely to customers and close requests.  
**Requirements:** DLV-01, DLV-02, DLV-03, DLV-04, DLV-05  
**UI hint:** yes

Success criteria:
1. Customer sees only approved final documents for own requests.
2. Downloads use short-lived signed links.
3. Internal notes, reviewer comments, and drafts stay hidden from customer.
4. Customer receives ready notification.
5. Request can be closed after delivery with audit trail.

Artifacts:
- `.planning/phases/06-delivery/06-CONTEXT.md`
- `.planning/phases/06-delivery/06-01-SUMMARY.md` through `06-06-SUMMARY.md`
- `.planning/phases/06-delivery/06-VERIFICATION.md` — status: `gaps_found`

## Phase 07: ops

**Status:** Complete  
**Plans:** 4/4 executed  
**Goal:** Provide operational dashboard, filters, workload, SLA, and audit timeline.  
**Requirements:** OPS-01, OPS-02, OPS-03, OPS-04, OPS-05  
**UI hint:** yes

Success criteria:
1. Admin sees counts by status, assignee, reviewer, and aging.
2. Admin filters requests by customer, matter type, status, assignee, reviewer, and date.
3. Admin sees workload per specialist/reviewer.
4. SLA timestamps are tracked across workflow states.
5. Admin views request audit timeline.

Artifacts:
- `.planning/phases/07-ops/07-CONTEXT.md`
- `.planning/phases/07-ops/07-01-SUMMARY.md` through `07-04-SUMMARY.md`
- `.planning/phases/07-ops/07-REVIEW.md`
- `.planning/phases/07-ops/07-REVIEW-FIX.md`
- `.planning/phases/07-ops/07-VERIFICATION.md` — final verifier result: passed after GAP-01 fix

## Phase 08: reviewer-service

**Status:** Gap closure (planned)  
**Goal:** Build the missing reviewer service layer and split-view UI so REV-01..REV-09 are satisfied end-to-end and the `approved → delivered → closed` flow becomes reachable.  
**Requirements:** REV-01, REV-02, REV-03, REV-04, REV-05, REV-06, REV-07, REV-08, REV-09  
**UI hint:** yes

Plans:
- [x] 08-01-PLAN.md — review-service layer (startReview, answerChecklistItem, approveReview, rejectReview) + checklist re-export + node:test coverage
- [x] 08-02-PLAN.md — fix reviewer queue Prisma query, rebuild split-view detail page, server actions, ReviewForm client component

Success criteria:
1. `src/lib/reviews/review-service.ts` exposes start, answer, approve, reject primitives; approve marks `DocumentVersion.status = 'final'` and `request.status_changed → approved` in one transaction.
2. Reviewer queue (`/reviewer/requests`) shows `DocumentVersion` rows assigned to the current reviewer with a working Prisma query (no `legalRequest.assignedReviewerId` traversal; use `document.request.assignedReviewerId`).
3. Reviewer detail page loads the real document version + checklist + previous review; no hardcoded `passedItemIds`.
4. Approve requires all required checklist items passed; reject with comments returns `DocumentVersion.status = 'draft` and request `revision_required` while preserving the previous review record (REV-08).
5. Every review action emits an append-only audit event with safe metadata.

## Phase 09: folder-tag

**Status:** Gap closure (planned)  
**Goal:** Add Folder/Tag models, classification service and admin browse UI to satisfy VLT-05.  
**Requirements:** VLT-05  
**UI hint:** yes

Success criteria:
1. `prisma/schema.prisma` adds `Folder` (workspaceId, name, parentId) and `Tag` (workspaceId, key, label) plus join tables `VaultFileFolder` and `VaultFileTag` with proper indexes.
2. `src/lib/documents/classification-service.ts` exposes folder/tag CRUD and file-to-folder/tag association with server-side RBAC.
3. Admin browse UI at `/admin/vault` lists folders/tags and lets coordinator move files between folders or apply tags.
4. Customer delivery page and ops dashboard do not leak folder/tag mutation controls; folder/tag are internal admin concern.
5. Classification changes are audited with safe metadata summary only.

## Phase 10: ux-hardening

**Status:** Gap closure (planned)  
**Goal:** Close DLV-02 UX degradation, fix `listDocumentVersions` Prisma duplicate, and surface deliver/close feedback to specialist.  
**Requirements:** DOC-04, DLV-02, DLV-05  
**UI hint:** yes

Success criteria:
1. `src/lib/documents/draft-service.ts` `listDocumentVersions` uses a single `document` block in the Prisma select; specialist workbench renders version history at runtime.
2. `src/app/customer/requests/[requestId]/page.tsx` inlines the signed URL in the download link so the browser makes a single request without redirect.
3. `src/app/specialist/requests/[requestId]/page.tsx` consumes the `markDeliveredAction`/`closeDeliveredAction` result state and renders success/failure messages.
4. Add regression tests covering the customer download bare-link redirect path and the specialist deliver/close feedback path.

## Phase 11: wire-review-init

**Status:** Gap closure (planned)  
**Goal:** Wire `startReview` to reviewer UI so reviewer can initialize a review session, unblocking the `approved → delivered → closed` flow.  
**Requirements:** REV-02, REV-06, REV-07, REV-08, REV-09  
**UI hint:** yes  
**Gap Closure:** Closes G-6 from v1.0-MILESTONE-AUDIT.md (Flow B broken at step 4)

Plans:
- [ ] 11-01-PLAN.md — Add startReviewAction server action, StartReviewButton client component, wire into detail page

Success criteria:
1. Reviewer detail page shows "Bat dau duyet" button when no review exists for the document version.
2. Clicking the button calls `startReviewAction` which invokes `startReview` from `review-service.ts`.
3. On success, the page re-renders the review form (split-view with checklist).
4. All review actions (approve/reject) now work end-to-end because `reviewId` is available.
5. `startReview` emits an audit event with safe metadata.

## Phase 12: ops-sla-drill-in

**Status:** Gap closure (planned)  
**Goal:** Render SLA context on request-specific ops drill-in page to satisfy OPS-04.  
**Requirements:** OPS-04  
**UI hint:** yes  
**Gap Closure:** Closes OPS-04 partial gap from v1.0-MILESTONE-AUDIT.md

Success criteria:
1. `/admin/ops/[requestId]/page.tsx` renders basic SLA context (currentStatusSince, pendingReviewSince, deliveredAt, closedAt).
2. Uses `getOpsRequestTimeline` from `ops-service.ts` which already computes SLA fields.
3. SLA display is safe (no raw legal content, no PII).
4. Vietnamese labels for each SLA field.

## Phase 13: service-cleanup-wiring

**Status:** Gap closure (planned)  
**Goal:** Clean up orphaned service exports — wire `listDocumentVersions` to specialist workbench, adopt `storeVaultFile` in draft/upload services, and fix `/admin/audit` mock data.  
**Requirements:** none (technical debt)  
**UI hint:** no  
**Gap Closure:** Closes tech debt items from v1.0-MILESTONE-AUDIT.md (orphaned exports, mock data)

Success criteria:
1. Specialist workbench calls `listDocumentVersions` from `draft-service.ts` instead of raw Prisma query.
2. `draft-service.ts` and `upload-service.ts` use `storeVaultFile` wrapper with audit events instead of raw `prisma.vaultFile.create`.
3. `/admin/audit/page.tsx` fetches real audit events from Prisma instead of hardcoded mock data.
4. All changes pass `npm run typecheck` (pre-existing TS errors in `/admin/templates/` excluded).
5. No regressions in existing tests.

---

## Requirements Summary

| Phase | Requirements | Count | Status |
|---|---|---:|---|
| 01 foundation | FND-01..FND-05 | 05 | Complete |
| 02 intake | INT-01..INT-06 | 06 | Complete |
| 03 routing | RTE-01..RTE-05 | 05 | Complete |
| 04 documents-vault | DOC-01..DOC-06, VLT-01..VLT-04 | 10 | Complete in traceability; verification gaps recorded |
| 05 review | (REV-01..09 reassigned to 08) | 0 | Stub only; no service layer; see Phase 08 gap-closure |
| 06 delivery | DLV-01..DLV-05 | 05 | Complete in traceability; DLV-02 UX gap addressed in Phase 10 |
| 07 ops | OPS-01..OPS-05 | 05 | Complete |
| 08 reviewer-service | REV-01..REV-09 | 9 | Executed | 2026-06-03 |
| 09 folder-tag | VLT-05 | 1 | Executed | 2026-06-03 |
| 10 ux-hardening | DOC-04, DLV-02, DLV-05 | 0/0 | Executed | 2026-06-03 |
| 11 wire-review-init | REV-02, REV-06, REV-07, REV-08, REV-09 | 0/0 | Gap closure (planned) | — |
| 12 ops-sla-drill-in | OPS-04 | 0/0 | Gap closure (planned) | — |
| 13 service-cleanup-wiring | — | 0/0 | Gap closure (planned) | — |

**Coverage:** 46/46 v1 requirements mapped.  
**Traceability:** 10 requirements moved to Pending under gap-closure phases per `.planning/v1.0-MILESTONE-AUDIT.md`.  
**Execution:** 30/30 original phase summaries present; gap-closure phases 11..13 planned in this session.
