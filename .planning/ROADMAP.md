# Roadmap: Legal-as-a-Service Platform

**Created:** 2026-05-26
**Last updated:** 2026-06-01
**Milestone:** v1.0 — Complete
**Total phases:** 7
**v1 requirements covered:** 46/46
**Plans executed:** 30/30

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

## Requirement Coverage

| Phase | Requirements | Count | Status |
|---|---|---:|---|
| 01 foundation | FND-01..FND-05 | 05 | Complete |
| 02 intake | INT-01..INT-06 | 06 | Complete |
| 03 routing | RTE-01..RTE-05 | 05 | Complete |
| 04 documents-vault | DOC-01..DOC-06, VLT-01..VLT-05 | 11 | Complete in traceability; verification gaps recorded |
| 05 review | REV-01..REV-09 | 9 | Complete in traceability; verification artifact missing |
| 06 delivery | DLV-01..DLV-05 | 05 | Complete in traceability; verification gaps recorded |
| 07 ops | OPS-01..OPS-05 | 05 | Complete |

**Coverage:** 46/46 v1 requirements mapped.  
**Traceability:** 46/46 marked complete in `.planning/REQUIREMENTS.md`.  
**Execution:** 30/30 planned phase summaries present.
