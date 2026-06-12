# Phase 40: v2 Create Request Wizard — Context

**Created:** 2026-06-13
**Phase:** 40-v2-create-request-wizard
**Requirements:** 4 locked (from SPEC.md)

## Decisions

### 1. Upload Flow

**Decision:** Use direct upload via existing `attachIntakeFile()` service.

**Rationale:** The service exists at `src/lib/intake/upload-service.ts` and handles storage. No presigned URL pattern needed.

**Implementation:**
- Client sends file as multipart form to `POST /api/v2/intake/attach-file`
- API handler calls `attachIntakeFile()` from upload-service.ts
- Returns `{ vaultFileId, filename, size }` on success

**Reference:**
- `src/lib/intake/upload-service.ts` — existing upload logic

### 2. Submission Flow

**Decision:** Create new v2 endpoint at `src/v2/app/api/intake/submit/route.ts`, reference legacy logic.

**Rationale:** Clean v2 implementation. Reference `src/legacy/api/intake/submit/route.ts` for the submission logic pattern.

**Implementation:**
- Create `POST /api/v2/intake/submit` endpoint
- Create `IntakeSubmission` record with MatterType, workspace, documents
- On success: redirect to confirmation page
- Reference legacy submit for request creation pattern

**Reference:**
- `src/legacy/api/intake/submit/route.ts` — submission logic reference

### 3. MatterType Labels

**Decision:** Import directly from seed constants.

**Rationale:** No API call needed. Wizard loads MatterTypes immediately on step 1.

**Implementation:**
- Import `SEED_MATTER_TYPES` from `src/lib/i18n/seed-multilingual.ts`
- Use `getLocalized(locale, matterType.label)` to get locale-appropriate label
- No new API endpoint needed

**Reference:**
- `src/lib/i18n/seed-multilingual.ts` — seed data
- `src/lib/i18n/get-localized-content.ts` — `getLocalized()` utility

### 4. Error Handling

**Decision:** Inline errors below form fields.

**Rationale:** Clear, specific feedback for form validation. Toasts are for async operations.

**Implementation:**
- API errors return `{ error: "ERROR_CODE", message: "Human readable message" }`
- Client displays error message below relevant form field
- Submit button disabled until validation passes
- Loading state shown during API calls

## Technical Notes

### API Structure (v2)

```
src/v2/app/api/intake/
├── attach-file/
│   └── route.ts      # POST - attach file to draft
└── submit/
    └── route.ts      # POST - submit intake request
```

### Data Flow

1. User selects MatterType → uses SEED_MATTER_TYPES
2. User answers questions → saved locally or via save-answers
3. User uploads documents → POST /api/v2/intake/attach-file
4. User reviews and submits → POST /api/v2/intake/submit
5. Success → redirect to confirmation page

### MatterType Display

```typescript
import { SEED_MATTER_TYPES } from '@/lib/i18n/seed-multilingual';
import { getLocalized } from '@/lib/i18n/get-localized-content';

// In component
const label = getLocalized(locale, SEED_MATTER_TYPES[key].label);
```

## Out of Scope (from SPEC.md)

- Email notifications on submission
- File preview or thumbnails
- Multi-file batch optimization
- Real-time upload progress

## Deferred Ideas

[None identified]

---

*Phase: 40-v2-create-request-wizard*
*Context created: 2026-06-13*
*Next step: /gsd-plan-phase 40 — implementation planning*
