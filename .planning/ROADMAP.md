# Roadmap: Legal-as-a-Service Platform

**Created:** 2026-05-26
**Total phases:** 7
**v1 requirements covered:** 46/46

## Phase 1: foundation

**Goal:** Establish secure tenant, user, role, workflow, and audit foundations.
**Requirements:** FND-01, FND-02, FND-03, FND-04, FND-05
**UI hint:** yes

Success criteria:
1. Admin can manage users across customer, specialist, reviewer, coordinator, and super admin roles.
2. Requests, documents, reviews, and vault files enforce server-side role and workspace access.
3. Critical actions produce append-only audit events.
4. Request status transitions run through backend workflow rules.

## Phase 2: intake

**Goal:** Let SME customers submit legal requests through structured chat/form intake.
**Requirements:** INT-01, INT-02, INT-03, INT-04, INT-05, INT-06
**UI hint:** yes

Success criteria:
1. Customer can select legal service type and answer guided questions.
2. System stores structured intake answers with schema version.
3. Customer can upload files and see submitted request status.
4. Unsupported requests are marked for human triage.

## Phase 3: routing

**Goal:** Route requests to the right specialist/reviewer using capability matrix and manual assignment.
**Requirements:** RTE-01, RTE-02, RTE-03, RTE-04, RTE-05
**UI hint:** yes

Success criteria:
1. Admin defines matter types and capabilities.
2. System suggests eligible specialists/reviewers for a request.
3. Coordinator can assign/reassign with audit reason.
4. Specialist sees assigned queue and request details.

## Phase 4: documents-vault

**Goal:** Manage templates, generate drafts, and store request artifacts in versioned Legal Vault.
**Requirements:** DOC-01, DOC-02, DOC-03, DOC-04, DOC-05, DOC-06, VLT-01, VLT-02, VLT-03, VLT-04, VLT-05
**UI hint:** yes

Success criteria:
1. Admin creates versioned document templates with variables and statuses.
2. Published templates create new versions when changed.
3. Specialist generates draft from approved template and intake answers.
4. Vault stores uploads, drafts, finals, and review artifacts with metadata/versioning.
5. Vault access and file actions are permissioned and audited.

## Phase 5: review

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

## Phase 6: delivery

**Goal:** Deliver approved final documents securely to customers and close requests.
**Requirements:** DLV-01, DLV-02, DLV-03, DLV-04, DLV-05
**UI hint:** yes

Success criteria:
1. Customer sees only approved final documents for own requests.
2. Downloads use short-lived signed links.
3. Internal notes, reviewer comments, and drafts stay hidden from customer.
4. Customer receives ready notification.
5. Request can be closed after delivery with audit trail.

## Phase 7: ops

**Goal:** Provide operational dashboard, filters, workload, SLA, and audit timeline.
**Requirements:** OPS-01, OPS-02, OPS-03, OPS-04, OPS-05
**UI hint:** yes

Success criteria:
1. Admin sees counts by status, assignee, reviewer, and aging.
2. Admin filters requests by customer, matter type, status, assignee, reviewer, and date.
3. Admin sees workload per specialist/reviewer.
4. SLA timestamps are tracked across workflow states.
5. Admin views request audit timeline.

## Requirement Coverage

| Phase | Requirements | Count |
|---|---|---:|
| 1 foundation | FND-01..FND-05 | 5 |
| 2 intake | INT-01..INT-06 | 6 |
| 3 routing | RTE-01..RTE-05 | 5 |
| 4 documents-vault | DOC-01..DOC-06, VLT-01..VLT-05 | 11 |
| 5 review | REV-01..REV-09 | 9 |
| 6 delivery | DLV-01..DLV-05 | 5 |
| 7 ops | OPS-01..OPS-05 | 5 |

**Coverage:** 46/46 v1 requirements mapped.
