---
phase: 76-create-request
status: COMPLETED
date: "2026-06-20"
commit: various
---

# Phase 76: Create Request Wizard — SUMMARY

## Overview

Xây dựng Create Request Wizard 5 bước cho Legal-as-a-Service Platform: chọn lĩnh vực pháp lý → chọn dịch vụ → điền câu hỏi → upload tài liệu → review & submit.

## Deliverables

### Wave 1: Foundation
- ✅ `src/lib/i18n/seed-legal-domains.ts` — 13 legal domains, 32 service types với multilingual support (VI/EN/ZH/JA)
- ✅ `src/lib/types/wizard.ts` — WizardState, WizardAction (11 types), initial state, validation types

### Wave 2: Backend APIs
- ✅ `prisma/schema.prisma` — Draft model + Request fields (priority, contactInfo, submittedAt)
- ✅ `src/app/api/intake/draft/save/route.ts` — POST endpoint cho draft save/update với Zod validation
- ✅ `src/app/api/intake/draft/[id]/route.ts` — GET + DELETE endpoints cho draft load/delete
- ✅ `src/app/api/intake/submit/route.ts` — Enhanced submit với priority (urgent=24h, normal=72h SLA) và contactInfo

### Wave 3: Frontend Components
- ✅ `src/components/create-request/WizardProvider.tsx` — React Context + useReducer với auto-save + debounce
- ✅ `src/components/create-request/WizardStepsEnhanced.tsx` — 5-step progress indicator (hoặc cập nhật WizardSteps)
- ✅ `src/components/create-request/LegalDomainSelector.tsx` — Domain grid cards (13 domains, icons, responsive 4/3/2 cols)
- ✅ `src/components/create-request/ServiceTypeList.tsx` — Service list với search/filter + keyboard navigation
- ✅ `src/components/create-request/IntakeQuestionsFormEnhanced.tsx` — Dynamic questions với validation on blur
- ✅ `src/components/create-request/FileUploadZone.tsx` — Drag-drop upload với progress bar + file preview
- ✅ `src/components/create-request/ReviewStep.tsx` — Review summary (5 sections) + submit button + success modal
- ✅ `src/components/create-request/CreateRequestForm.tsx` — Wizard orchestrator tích hợp tất cả components
- ✅ `src/components/create-request/SummaryPanel.tsx` — Dynamic service name lookup
- ✅ `src/components/create-request/ChecklistPanel.tsx` — Service-specific checklist

### Wave 4: Integration + Tests
- ✅ `src/app/[locale]/create/page.tsx` — Page integration với auth check + user data + layout
- ✅ `src/messages/{vi,en,zh,ja}.json` — 50+ i18n keys (steps, domains, buttons, messages, errors, labels)
- ✅ Unit tests: 125 tests (91 component + 34 API)
- ✅ E2E tests: 3 spec files (20 test cases)

## Files Modified/Created

### New Files (21)
- `src/lib/i18n/seed-legal-domains.ts`
- `src/lib/types/wizard.ts`
- `src/app/api/intake/draft/save/route.ts`
- `src/app/api/intake/draft/[id]/route.ts`
- `src/components/create-request/WizardProvider.tsx`
- `src/components/create-request/WizardStepsEnhanced.tsx`
- `src/components/create-request/LegalDomainSelector.tsx`
- `src/components/create-request/ServiceTypeList.tsx`
- `src/components/create-request/IntakeQuestionsFormEnhanced.tsx`
- `src/components/create-request/FileUploadZone.tsx`
- `src/components/create-request/ReviewStep.tsx`
- `src/components/create-request/__tests__/WizardProvider.test.tsx`
- `src/components/create-request/__tests__/LegalDomainSelector.test.tsx`
- `src/components/create-request/__tests__/ServiceTypeList.test.tsx`
- `src/components/create-request/__tests__/IntakeQuestionsFormEnhanced.test.tsx`
- `src/components/create-request/__tests__/FileUploadZone.test.tsx`
- `src/components/create-request/__tests__/ReviewStep.test.tsx`
- `src/app/api/intake/draft/save/__tests__/route.test.ts`
- `src/app/api/intake/draft/[id]/__tests__/route.test.ts`
- `src/app/api/intake/submit/__tests__/route.test.ts`
- `e2e/076-wizard-flow.spec.ts`
- `e2e/076-draft-save-resume.spec.ts`
- `e2e/076-file-upload-submit.spec.ts`

### Modified Files (6)
- `prisma/schema.prisma` — Draft model + Request fields
- `src/app/api/intake/submit/route.ts` — Enhanced với priority, contactInfo, SLA
- `src/components/create-request/CreateRequestForm.tsx` — Wizard integration
- `src/components/create-request/SummaryPanel.tsx` — Dynamic lookup
- `src/components/create-request/ChecklistPanel.tsx` — Service-specific
- `src/app/[locale]/create/page.tsx` — Page integration
- `src/messages/vi.json` — 50+ keys
- `src/messages/en.json` — 50+ keys
- `src/messages/zh.json` — 50+ keys
- `src/messages/ja.json` — 50+ keys

## Test Results

### Unit Tests: 125/125 passed ✅
- Component tests: 91 tests (WizardProvider, LegalDomainSelector, ServiceTypeList, IntakeQuestionsFormEnhanced, FileUploadZone, ReviewStep)
- API tests: 34 tests (draft save: 11, draft load: 12, submit: 11)

### E2E Tests: 20 test cases (chạy qua Playwright)
- `076-wizard-flow.spec.ts` — 6 tests (complete flow, navigation, validation, edit, priority, contact info)
- `076-draft-save-resume.spec.ts` — 6 tests (auto-save, manual save, resume, delete, save failure, load failure)
- `076-file-upload-submit.spec.ts` — 8 tests (upload via click, drag-drop, multiple, size validation, type validation, remove, submit with/without files)

## Bugs Fixed During Phase

1. **Draft save 400 on nullable fields** — domainId/serviceType was `.string().min(1)`, changed to `.string().nullable().optional()` cho partial auto-saves
2. **Draft save 400 on empty email** — `contactInfo.email` was `.string().email()`, changed to `.string().optional().default('')`
3. **WizardProvider response parsing** — Response was `{ data: { draftId } }` but code was accessing `data.draftId` directly, fixed to `result.data?.draftId`
4. **Validation test updates** — Updated tests to match relaxed schema (optional fields for partial drafts)

## Security

- IDOR prevention: draft ownership validated in both save and load endpoints
- Session validation: requireAppSession() for all API endpoints
- File upload validation: type whitelist (PDF, DOC, DOCX, JPG, PNG), 50MB limit, 20 file max
- Audit logging: draft.save, draft.load, draft.delete, request.priority.escalated
- Zod schema validation: all request bodies validated server-side

## Requirements Coverage

| Req ID | Description | Status |
|--------|-------------|--------|
| CREQ-01 | 13 legal domains với multilingual labels | ✅ |
| CREQ-02 | 32 service types với dynamic questions | ✅ |
| CREQ-03 | 5-step wizard flow với progress indicator | ✅ |
| CREQ-04 | Dynamic intake questions với validation | ✅ |
| CREQ-05 | File upload với drag-and-drop + progress | ✅ |
| CREQ-06 | Review step với summary sections | ✅ |
| CREQ-07 | Submit với success modal + redirect | ✅ |
| CREQ-08 | Page integration với auth check | ✅ |
| CREQ-09 | Priority selection (normal/urgent) | ✅ |
| CREQ-10 | Contact info pre-fill từ user profile | ✅ |
| CREQ-11 | Draft auto-save + resume | ✅ |

## Deviations from Plan

1. **Nullable fields in draft save** — Schema relaxed từ required `.string().min(1)` thành `.string().nullable().optional()` để hỗ trợ partial auto-saves. Điều này phát hiện qua bug thực tế (400 error) khi auto-save ở step 1-2.
2. **ContactInfo.email optional** — Từ `.string().email()` thành `.string().optional().default('')` vì initial state có email rỗng.
3. **Test count adjustment** — API tests từ plan 21 → thực tế 34 do test scenarios mở rộng.

## Next Steps

Phase 76 hoàn thành. Các phase tiếp theo trong milestone v2.2:
- Phase 73-02: Shared Components (ErrorBoundary, LoadingSkeleton, EmptyState)
- Phase 73-03: API Client & Hooks
- Phase 73-04: i18n & Tests
- Phase 77: (theo ROADMAP.md)
