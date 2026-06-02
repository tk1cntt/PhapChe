# Requirements: Legal-as-a-Service Platform

**Defined:** 2026-05-26
**Core Value:** SME sends legal requests through simple chat and receives quality-reviewed deliverables with full traceability.

## v1 Requirements

### Foundation

- [x] **FND-01**: Admin can manage customer, specialist, reviewer, coordinator, and super admin users.
- [x] **FND-02**: System enforces server-side RBAC for requests, documents, reviews, and vault files.
- [x] **FND-03**: System records append-only audit events for all critical actions.
- [x] **FND-04**: System isolates each SME in its own customer workspace.
- [x] **FND-05**: Request status changes only through backend workflow transitions.

### Intake

- [x] **INT-01**: Customer can start a legal request from chat/form by selecting service type.
- [x] **INT-02**: System asks structured intake questions based on selected service type.
- [x] **INT-03**: System saves answers as structured intake data with schema version.
- [x] **INT-04**: Customer can upload supporting files to a request.
- [x] **INT-05**: Customer can see request status after submission.
- [x] **INT-06**: System marks unsupported requests as requiring human triage.

### Routing

- [x] **RTE-01**: Admin can define matter types.
- [x] **RTE-02**: Admin can define specialist and reviewer capabilities.
- [x] **RTE-03**: System suggests eligible specialists and reviewers from capability matrix.
- [x] **RTE-04**: Coordinator can assign or reassign requests with audit reason.
- [x] **RTE-05**: Specialist can see assigned queue and request details.

### Documents

- [x] **DOC-01**: Admin can create document templates with matter type, version, status, and variables.
- [x] **DOC-02**: Published templates cannot be edited directly; changes create new version.
- [x] **DOC-03**: Specialist can generate draft from approved template and intake answers.
- [x] **DOC-04**: System stores drafts and final documents as versioned vault items.
- [x] **DOC-05**: System stores template version and input snapshot for each generated document.
- [x] **DOC-06**: Specialist can submit a specific document version for review.

### Vault

- [x] **VLT-01**: Users can access vault files only when role and assignment allow it.
- [x] **VLT-02**: System stores uploaded files, drafts, final documents, and review artifacts with metadata.
- [x] **VLT-03**: System supports file version history for documents.
- [x] **VLT-04**: System logs file preview, download, upload, and delete actions.
- [ ] **VLT-05**: System supports folder/tag classification for legal files.

### Review

- [ ] **REV-01**: Reviewer can see queue of document versions awaiting review.
- [ ] **REV-02**: Reviewer can review split view: draft left, QC checklist right.
- [ ] **REV-03**: Checklist includes latest template, spelling/presentation, and entity info matching files.
- [ ] **REV-04**: Checklist includes current legal basis, clear rights/obligations, risk clauses, and fit to customer pain.
- [ ] **REV-05**: Checklist includes signature area and confidentiality classification.
- [ ] **REV-06**: Reviewer can approve only after completing required checklist items.
- [ ] **REV-07**: Reviewer can request revision with failed checklist items and comments.
- [ ] **REV-08**: System returns rejected documents to specialist and preserves comments.
- [ ] **REV-09**: System marks approved version as final-ready and audits decision.

### Delivery

- [x] **DLV-01**: Customer can view approved final documents for own requests.
- [x] **DLV-02**: Customer can download final documents through short-lived signed links.
- [x] **DLV-03**: System hides internal notes, reviewer-only comments, and unapproved drafts from customers.
- [x] **DLV-04**: System notifies customer when document is ready.
- [x] **DLV-05**: Coordinator or specialist can close request after final delivery.

### Operations

- [x] **OPS-01**: Admin can view dashboard counts by status, specialist, reviewer, and aging.
- [x] **OPS-02**: Admin can filter requests by customer, matter type, status, assignee, reviewer, and date.
- [x] **OPS-03**: Admin can view workload per specialist and reviewer.
- [x] **OPS-04**: System tracks basic SLA timestamps.
- [x] **OPS-05**: Admin can view audit timeline for a request.

## v2 Requirements

### Automation

- **AUT-01**: System can OCR uploaded business licenses, IDs, contracts, and official letters.
- **AUT-02**: System can suggest matter type and missing intake fields from uploaded files.
- **AUT-03**: AI can summarize request context for specialists with citations.
- **AUT-04**: AI can draft low-risk sections from approved template/clause library.
- **AUT-05**: System can flag risk items before reviewer review.

### Signature

- **SIG-01**: System can create e-signature requests from approved final documents.
- **SIG-02**: System can sync signature status from provider webhooks.
- **SIG-03**: System can store signed documents in Legal Vault.

### Compliance

- **CMP-01**: Customer can create compliance calendar items.
- **CMP-02**: System can send recurring reminders.
- **CMP-03**: System can link deadlines to documents and requests.

## Out of Scope

| Feature | Reason |
|---------|--------|
| AI lawyer final advice | Human reviewer remains source of approval |
| OCR in MVP | Not required for request to review to delivery workflow |
| E-sign in MVP | Integrate after final document workflow stabilizes |
| Open lawyer marketplace | Quality control risk |
| Workflow builder | Fixed state machine safer for MVP |
| Enterprise CLM | Too broad for SME MVP |
| Billing automation | Can be manual until service model validates |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FND-01 | Phase 01 | Complete |
| FND-02 | Phase 01 | Complete |
| FND-03 | Phase 01 | Complete |
| FND-04 | Phase 01 | Complete |
| FND-05 | Phase 01 | Complete |
| INT-01 | Phase 02 | Complete |
| INT-02 | Phase 02 | Complete |
| INT-03 | Phase 02 | Complete |
| INT-04 | Phase 02 | Complete |
| INT-05 | Phase 02 | Complete |
| INT-06 | Phase 02 | Complete |
| RTE-01 | Phase 03 | Complete |
| RTE-02 | Phase 03 | Complete |
| RTE-03 | Phase 03 | Complete |
| RTE-04 | Phase 03 | Complete |
| RTE-05 | Phase 03 | Complete |
| DOC-01 | Phase 04 | Complete |
| DOC-02 | Phase 04 | Complete |
| DOC-03 | Phase 04 | Complete |
| DOC-04 | Phase 10 | Pending (Prisma duplicate key bug) |
| DOC-05 | Phase 04 | Complete |
| DOC-06 | Phase 04 | Complete |
| VLT-01 | Phase 04 | Complete |
| VLT-02 | Phase 04 | Complete |
| VLT-03 | Phase 04 | Complete |
| VLT-04 | Phase 04 | Complete |
| VLT-05 | Phase 09 | Pending |
| REV-01 | Phase 08 | Pending |
| REV-02 | Phase 08 | Pending |
| REV-03 | Phase 08 | Pending |
| REV-04 | Phase 08 | Pending |
| REV-05 | Phase 08 | Pending |
| REV-06 | Phase 08 | Pending |
| REV-07 | Phase 08 | Pending |
| REV-08 | Phase 08 | Pending |
| REV-09 | Phase 08 | Pending |
| DLV-01 | Phase 06 | Complete |
| DLV-02 | Phase 06, 10 | Complete; UX gap in Phase 10 |
| DLV-03 | Phase 06 | Complete |
| DLV-04 | Phase 06 | Complete |
| DLV-05 | Phase 06, 10 | Complete; UX gap in Phase 10 |
| OPS-01 | Phase 07 | Complete |
| OPS-02 | Phase 07 | Complete |
| OPS-03 | Phase 07 | Complete |
| OPS-04 | Phase 07 | Complete |
| OPS-05 | Phase 07 | Complete |

**Coverage:**
- v1 requirements: 46 total
- Mapped to phases: 46
- Unmapped: 0
- Pending (gap-closure): 10 (REV-01..09, VLT-05, DOC-04)
- Complete: 36

---
*Requirements defined: 2026-05-26*
*Last updated: 2026-05-26 after initial definition*
