# Phase 40: v2 Create Request Wizard — Specification

**Created:** 2026-06-13
**Ambiguity score:** 0.18
**Requirements:** 4 locked

## Goal

Connect Create Request wizard Steps 3-4 to real API endpoints, enabling document upload and request submission to the database.

## Background

Phase 27 created the Create Request wizard UI with 4 steps (Service, Questions, Docs, Review). Phase 39 established the v2 foundation with multilingual schema. The wizard currently uses mock data. This phase connects Steps 3-4 (document upload and request submission) to actual API endpoints and the database.

**Current state:**
- Step 1-2 (Service selection, Questions): Already connected via Phase 27
- Step 3 (Documents): Upload UI exists but no API call
- Step 4 (Review + Submit): Review UI exists but no submission API
- `src/legacy/api/intake/create-draft` exists as reference
- Prisma schema has IntakeSubmission model with multilingual MatterType support

**Delta:**
- Step 3: Add API endpoint for document upload (presigned URL pattern)
- Step 4: Add API endpoint for final submission (creates IntakeSubmission record)
- Integrate MatterType selection with multilingual labels

## Requirements

1. **Document Upload (Step 3)**: Users can upload supporting documents for their request.
   - Current: Upload UI exists but no backend endpoint
   - Target: POST /api/v2/intake/documents returns presigned URL; files upload to storage
   - Acceptance: User can select file, upload completes, file reference stored with request

2. **Request Submission (Step 4)**: Users can submit completed request to database.
   - Current: Review UI shows summary but submit button does nothing
   - Target: POST /api/v2/intake/submit creates IntakeSubmission with MatterType, documents, workspace
   - Acceptance: Submission creates database record, redirects to confirmation page, request appears in My Cases

3. **MatterType Integration**: Request submission uses MatterType key and multilingual labels.
   - Current: MatterType selection exists but label comes from mock data
   - Target: Submission uses MatterType.key from seed data, displays label_vi from database
   - Acceptance: Selected matter type shows correct VI/EN/ZH/JA label based on user locale

4. **Form Validation**: Client-side validation prevents invalid submissions.
   - Current: Basic required field validation exists
   - Target: Validate all required fields (service, questions, at least 1 document) before submit
   - Acceptance: Submit button disabled until all required fields complete; error messages shown inline

## Boundaries

**In scope:**
- Step 3 document upload endpoint (presigned URL pattern)
- Step 4 submission endpoint (creates IntakeSubmission)
- MatterType key integration with multilingual labels
- Client-side form validation
- Error handling and loading states

**Out of scope:**
- Real-time upload progress (basic upload completion only)
- File type conversion or processing (accepts any file type)
- Multi-file batch upload optimization
- Document preview or thumbnail generation
- Email notification on submission (separate backlog item)

## Constraints

- Use existing IntakeSubmission model in Prisma schema
- MatterType key must exist in database (seed data from Phase 39)
- Document storage: Use existing S3/blob storage pattern if exists, else local filesystem
- API responses must include error messages for validation failures
- Locale-aware labels from getLocalized() utility

## Acceptance Criteria

- [ ] Step 3: POST /api/v2/intake/documents returns upload URL
- [ ] Step 3: Uploaded file reference stored with request ID
- [ ] Step 4: POST /api/v2/intake/submit creates IntakeSubmission in database
- [ ] Step 4: Submission redirects to confirmation page
- [ ] MatterType labels display in user's locale (VI/EN/ZH/JA)
- [ ] Form validation prevents submission with missing required fields
- [ ] Error messages display inline for validation failures
- [ ] Loading states shown during API calls

## Ambiguity Report

| Dimension          | Score | Min  | Status | Notes                            |
|--------------------|-------|------|--------|----------------------------------|
| Goal Clarity       | 0.85 | 0.75 | ✓      | Clear API endpoints defined       |
| Boundary Clarity  | 0.90 | 0.70 | ✓      | Explicit out-of-scope list       |
| Constraint Clarity | 0.80 | 0.65 | ✓      | Storage pattern TBD              |
| Acceptance Criteria| 0.85 | 0.70 | ✓      | 8 pass/fail criteria             |
| **Ambiguity**      | 0.18 | ≤0.20| ✓      |                                 |

## Interview Log

| Round | Perspective     | Question summary              | Decision locked                         |
|-------|----------------|-----------------------------|-----------------------------------------|
| 1     | Researcher     | What exists in Create Request today? | UI wizard complete, mock data only |
| 1     | Researcher     | What API endpoints needed?   | Documents upload + submission endpoints |
| 2     | Simplifier     | Minimum viable submission?   | Create record + redirect only           |
| 3     | Boundary Keeper| What's NOT this phase?       | Email, preview, batch upload excluded   |

---

*Phase: 40-v2-create-request-wizard*
*Spec created: 2026-06-13*
*Next step: /gsd-discuss-phase 40 — implementation decisions (API structure, storage pattern, etc.)*
