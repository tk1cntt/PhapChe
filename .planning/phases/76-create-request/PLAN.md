---
wave: 1
depends_on: []
files_modified:
  - src/lib/i18n/seed-legal-domains.ts (NEW)
  - src/lib/types/wizard.ts (NEW)
  - src/app/api/intake/draft/save/route.ts (NEW)
  - src/app/api/intake/draft/[id]/route.ts (NEW)
  - src/app/api/intake/submit/route.ts (MODIFY)
  - src/components/create-request/LegalDomainSelector.tsx (NEW)
  - src/components/create-request/ServiceTypeList.tsx (NEW)
  - src/components/create-request/WizardProvider.tsx (NEW)
  - src/components/create-request/WizardStepsEnhanced.tsx (NEW)
  - src/components/create-request/IntakeQuestionsFormEnhanced.tsx (NEW)
  - src/components/create-request/FileUploadZone.tsx (NEW)
  - src/components/create-request/ReviewStep.tsx (NEW)
  - src/components/create-request/SummaryPanel.tsx (MODIFY)
  - src/components/create-request/ChecklistPanel.tsx (MODIFY)
  - src/components/create-request/CreateRequestForm.tsx (MODIFY)
  - src/app/[locale]/create/page.tsx (MODIFY)
  - src/messages/vi.json (MODIFY)
  - src/messages/en.json (MODIFY)
  - src/messages/zh.json (MODIFY)
  - src/messages/ja.json (MODIFY)
  - src/components/create-request/__tests__/LegalDomainSelector.test.tsx (NEW)
  - src/components/create-request/__tests__/WizardProvider.test.tsx (NEW)
  - src/components/create-request/__tests__/IntakeQuestionsFormEnhanced.test.tsx (NEW)
  - src/components/create-request/__tests__/ReviewStep.test.tsx (NEW)
  - src/app/api/intake/draft/save/__tests__/route.test.ts (NEW)
  - src/app/api/intake/draft/[id]/__tests__/route.test.ts (NEW)
  - e2e/076-wizard-flow.spec.ts (NEW)
  - e2e/076-draft-save-resume.spec.ts (NEW)
  - e2e/076-file-upload-submit.spec.ts (NEW)
autonomous: true
---

## Artifacts this phase produces

### Wave 1: Foundation
- `src/lib/i18n/seed-legal-domains.ts` — SEED_LEGAL_DOMAINS (13 domains), helper functions
- `src/lib/types/wizard.ts` — WizardState, WizardAction, initial state, validation types

### Wave 2: Backend APIs
- `src/app/api/intake/draft/save/route.ts` — POST endpoint for draft save/resume
- `src/app/api/intake/draft/[id]/route.ts` — GET endpoint for draft load
- `src/app/api/intake/submit/route.ts` — Enhanced submit with priority, contactInfo

### Wave 3: Frontend Components
- `src/components/create-request/LegalDomainSelector.tsx` — Domain grid component
- `src/components/create-request/ServiceTypeList.tsx` — Service list per domain
- `src/components/create-request/WizardProvider.tsx` — Context + useReducer provider
- `src/components/create-request/WizardStepsEnhanced.tsx` — 5-step progress indicator
- `src/components/create-request/IntakeQuestionsFormEnhanced.tsx` — Validation enhanced questions
- `src/components/create-request/FileUploadZone.tsx` — Drag-drop upload with progress
- `src/components/create-request/ReviewStep.tsx` — Comprehensive review summary
- `src/components/create-request/SummaryPanel.tsx` — Dynamic service name lookup
- `src/components/create-request/ChecklistPanel.tsx` — Service-specific checklist
- `src/components/create-request/CreateRequestForm.tsx` — Main wizard orchestrator

### Wave 4: Integration + Tests
- `src/app/[locale]/create/page.tsx` — Main page integration
- `src/messages/{vi,en,zh,ja}.json` — i18n keys added (50+ new keys)
- `src/components/create-request/__tests__/LegalDomainSelector.test.tsx`
- `src/components/create-request/__tests__/WizardProvider.test.tsx`
- `src/components/create-request/__tests__/IntakeQuestionsFormEnhanced.test.tsx`
- `src/components/create-request/__tests__/ReviewStep.test.tsx`
- `src/app/api/intake/draft/save/__tests__/route.test.ts`
- `src/app/api/intake/draft/[id]/__tests__/route.test.ts`
- `e2e/076-wizard-flow.spec.ts` — Full wizard E2E tests
- `e2e/076-draft-save-resume.spec.ts` — Draft persistence E2E tests
- `e2e/076-file-upload-submit.spec.ts` — Upload and submit E2E tests

<threat_model>
### Security Considerations

**ASVS Level:** L2 (Application-level security controls)
**Blocking Threshold:** Medium

**Threats Identified:**
1. **Unauthorized Draft Access (IDOR)**
   - Risk: User A accesses User B's draft via draftId manipulation
   - Mitigation: Validate draft ownership in GET /api/intake/draft/:id (check userId matches session)
   - Verification: Unit test confirms 403 when accessing another user's draft

2. **File Upload Abuse**
   - Risk: Malicious file upload (executable, oversized, path traversal)
   - Mitigation: Server-side validation (file type whitelist, 50MB limit, sanitized filename)
   - Verification: Unit test rejects .exe files, files > 50MB, filenames with ../

3. **Draft Data Injection**
   - Risk: Malicious JSON in draft save request (XSS, SQL injection)
   - Mitigation: Zod schema validation, parameterized queries, output encoding
   - Verification: Unit test confirms XSS payloads are escaped in responses

4. **Priority Escalation**
   - Risk: User manipulates priority field to bypass queue
   - Mitigation: Server-side validation of priority enum, audit log for priority changes
   - Verification: Unit test confirms only 'normal' | 'urgent' accepted

5. **Contact Info Spoofing**
   - Risk: User submits contact info for different organization
   - Mitigation: Validate contactInfo against user profile, warn on mismatch
   - Verification: Unit test logs warning when taxCode doesn't match user's organization

**Non-blocking threats (documented for future phases):**
- Rate limiting on draft save (defer to Phase 77)
- Concurrent draft save conflict resolution (defer, single-user assumption for MVP)
</threat_model>

<task>
<id>76-01-seed-legal-domains</id>
<name>Legal Domain Taxonomy Seed Data</name>
<description>Tạo file seed data chứa 13 legal domains và mở rộng SEED_MATTER_TYPES từ 4 lên 30+ service types với multilingual support (VI/EN/ZH/JA).</description>

<requirements>
  <req_id>CREQ-01</req_id>
  <req_id>CREQ-02</req_id>
  <req_id>CREQ-04</req_id>
</requirements>

<read_first>
  <file>src/lib/i18n/seed-multilingual.ts</file>
  <file>src/lib/i18n/types.ts</file>
  <file>.planning/phases/76-create-request/76-SPEC.md</file>
</read_first>

<action>
Tạo file src/lib/i18n/seed-legal-domains.ts với cấu trúc:

1. Export SEED_LEGAL_DOMAINS object chứa 13 domains theo spec:
   - commercial-legal (3 services: distribution_contract, nda, commercial_review)
   - corporate-legal (3 services: incorporation, shareholder_agreement, m_and_a)
   - employment-legal (3 services: labor_contract [existing], internal_regulations, labor_dispute)
   - privacy-legal (3 services: privacy_policy, dpia, data_processing_agreement)
   - product-legal (3 services: terms_of_service, return_policy, product_liability)
   - regulatory-legal (2 services: business_license, compliance_report)
   - ai-governance-legal (2 services: ai_policy, algorithm_audit)
   - ip-legal (3 services: trademark_registration [existing], copyright, patent)
   - litigation-legal (3 services: lawsuit_filing, settlement_agreement, litigation_consultation)
   - legal-clinic (2 services: internal_consultation, legal_training)
   - law-student (2 services: case_study, legal_research)
   - legal-builder-hub (2 services: template_engine, workflow_builder)
   - external-plugins (2 services: cocounsel, legal_research_tools)

2. Mỗi domain object có structure:
   - label: MultilingualString (vi/en/zh/ja)
   - icon: string (Lucide icon name)
   - description: MultilingualText (optional)
   - matterTypeKeys: string[] (reference to SEED_MATTER_TYPES)

3. Mở rộng SEED_MATTER_TYPES trong seed-multilingual.ts:
   - Giữ nguyên 3 existing types: labor_contract, agency_contract, trademark_registration
   - Thêm 27+ new types với questions array (3-5 questions mỗi type)
   - Mỗi question: { key, label, required, type: 'text' | 'textarea' }
   - Tất cả labels translated VI/EN/ZH/JA

4. Tạo helper functions:
   - getLegalDomains(): return array of domain objects
   - getDomainByServiceType(serviceTypeKey): return domain containing this service
   - getServiceTypesByDomain(domainKey): return filtered service types
</action>

<acceptance_criteria>
  <criterion>File src/lib/i18n/seed-legal-domains.ts tồn tại và export SEED_LEGAL_DOMAINS với 13 domains</criterion>
  <criterion>Mỗi domain có label multilingual (vi/en/zh/ja), icon name, và matterTypeKeys array</criterion>
  <criterion>Tất cả 13 domains có ít nhất 2 service types (total 30+ types)</criterion>
  <criterion>3 existing types (labor_contract, agency_contract, trademark_registration) giữ nguyên structure</criterion>
  <criterion>Mỗi service type có questions array với 3-5 questions (required field marked)</criterion>
  <criterion>Helper functions getLegalDomains(), getDomainByServiceType(), getServiceTypesByDomain() hoạt động</criterion>
  <criterion>TypeScript strict mode pass, không có any types</criterion>
  <criterion>Test command: npx vitest run src/lib/i18n/__tests__/seed-legal-domains.test.ts - tất cả tests pass</criterion>
</acceptance_criteria>
</task>

---

<task>
<id>76-02-wizard-types</id>
<name>Wizard State Type Definitions</name>
<description>Định nghĩa TypeScript types cho wizard state, actions, và context để đảm bảo type safety xuyên suốt implementation.</description>

<requirements>
  <req_id>CREQ-03</req_id>
  <req_id>CREQ-06</req_id>
</requirements>

<read_first>
  <file>src/lib/types/index.ts</file>
  <file>src/lib/types/request.ts</file>
  <file>src/lib/types/vault.ts</file>
</read_first>

<action>
Tạo file src/lib/types/wizard.ts với definitions:

1. WizardState type:
   - step: 1 | 2 | 3 | 4 | 5
   - domainId: string | null
   - serviceType: string | null
   - answers: Record<string, string>
   - files: UploadedFile[] (import from vault.ts)
   - priority: 'normal' | 'urgent'
   - contactInfo: { email: string, phone?: string, companyName?: string, taxCode?: string }
   - draftId: string | null
   - isDirty: boolean (track unsaved changes)

2. WizardAction union type:
   - SET_STEP: { payload: 1 | 2 | 3 | 4 | 5 }
   - SET_DOMAIN: { payload: string }
   - SET_SERVICE: { payload: string }
   - SET_ANSWER: { key: string, value: string }
   - ADD_FILE: { payload: UploadedFile }
   - REMOVE_FILE: { payload: string }
   - SET_PRIORITY: { payload: 'normal' | 'urgent' }
   - SET_CONTACT: { payload: Partial<WizardState['contactInfo']> }
   - SET_DRAFT_ID: { payload: string }
   - SET_DIRTY: { payload: boolean }
   - RESET: {}

3. Initial state constant:
   - step: 1, domainId: null, serviceType: null, answers: {}, files: [], priority: 'normal', contactInfo: { email: '' }, draftId: null, isDirty: false

4. Validation types:
   - ValidationErrors: Record<string, string>
   - StepValidation: (state: WizardState) => ValidationErrors
</action>

<acceptance_criteria>
  <criterion>File src/lib/types/wizard.ts tồn tại và export WizardState, WizardAction types</criterion>
  <criterion>WizardState có đầy đủ fields: step, domainId, serviceType, answers, files, priority, contactInfo, draftId, isDirty</criterion>
  <criterion>WizardAction là union type với 11 action types (SET_STEP, SET_DOMAIN, etc.)</criterion>
  <criterion>Initial state constant exported với step: 1, priority: 'normal'</criterion>
  <criterion>TypeScript compile pass: npx tsc --noEmit src/lib/types/wizard.ts</criterion>
  <criterion>Import từ barrel export: import { WizardState } from '@/lib/types' hoạt động</criterion>
</acceptance_criteria>
</task>

---

## Wave 2: Backend APIs

<task>
<id>76-03-database-schema</id>
<name>Draft Persistence Database Schema</name>
<description>Tạo bảng DRAFT trong Prisma schema để lưu trữ wizard draft data với user ownership tracking.</description>

<requirements>
  <req_id>CREQ-11</req_id>
</requirements>

<read_first>
  <file>prisma/schema.prisma</file>
  <file>.planning/phases/76-create-request/76-SPEC.md</file>
</read_first>

<action>
Thêm Draft model vào prisma/schema.prisma:

1. Draft model fields:
   - id: String @id @default(cuid())
   - userId: String (foreign key to User)
   - domainId: String? (nullable, lưu domain selection)
   - serviceType: String? (nullable, lưu service type selection)
   - answers: Json (lưu Record<string, string> answers)
   - files: Json (lưu UploadedFile[] array)
   - priority: String @default("normal") (enum: normal, urgent)
   - contactInfo: Json (lưu contact info object)
   - status: String @default("draft") (enum: draft, submitted, deleted)
   - createdAt: DateTime @default(now())
   - updatedAt: DateTime @updatedAt
   - User relation: @relation(fields: [userId], references: [id])

2. Indexes:
   - @@index([userId, status]) — query drafts by user
   - @@index([updatedAt]) — cleanup old drafts

3. Add relation to User model:
   - drafts: Draft[]

4. Create migration:
   - Run: npx prisma migrate dev --name add_draft_table
   - Verify migration file created in prisma/migrations/
</action>

<acceptance_criteria>
  <criterion>prisma/schema.prisma chứa Draft model với tất cả fields: id, userId, domainId, serviceType, answers, files, priority, contactInfo, status, createdAt, updatedAt</criterion>
  <criterion>Draft model có userId foreign key và User relation</criterion>
  <criterion>Indexes tạo trên [userId, status] và [updatedAt]</criterion>
  <criterion>Migration file tạo trong prisma/migrations/ với tên add_draft_table</criterion>
  <criterion>Test command: npx prisma migrate dev --create-only --name add_draft_table tạo migration thành công</criterion>
  <criterion>Test command: npx prisma generate không lỗi</criterion>
</acceptance_criteria>
</task>

---

<task>
<id>76-04-draft-save-api</id>
<name>Draft Save/Update API Endpoint</name>
<description>Tạo POST endpoint /api/intake/draft/save để lưu hoặc cập nhật draft với user ownership validation.</description>

<requirements>
  <req_id>CREQ-11</req_id>
</requirements>

<read_first>
  <file>src/app/api/intake/create-draft/route.ts</file>
  <file>src/lib/security/session.ts</file>
  <file>src/docs/API_STANDARDS.md</file>
</read_first>

<action>
Tạo file src/app/api/intake/draft/save/route.ts:

1. Request validation với Zod schema:
   - draftId: string (optional, tạo mới nếu không có)
   - domainId: string (required, từ SEED_LEGAL_DOMAINS)
   - serviceType: string (required, từ SEED_MATTER_TYPES)
   - answers: Record<string, string> (required, validate keys exist trong service type questions)
   - files: UploadedFile[] (optional, max 20 files)
   - priority: 'normal' | 'urgent' (required, default 'normal')
   - contactInfo: { email: string, phone?: string, companyName?: string, taxCode?: string } (required)

2. User authentication:
   - Extract userId từ session (requireAppSession)
   - Validate user exists trong database

3. Draft save logic:
   - Nếu draftId provided:
     - Query draft từ database
     - Validate userId matches (prevent IDOR)
     - Update draft với new data
   - Nếu không có draftId:
     - Create new draft với userId
   - Set status: 'draft'
   - Update updatedAt timestamp

4. Response format (theo API_STANDARDS.md):
   - Success: { success: true, data: { draftId: string, updatedAt: string } }
   - Error 400: Validation errors (Zod)
   - Error 401: Unauthorized (no session)
   - Error 403: Forbidden (draftId belongs to another user)
   - Error 500: Database error

5. Security hardening:
   - Sanitize all string inputs (escape HTML entities)
   - Validate file types: only PDF, DOC, DOCX, JPG, PNG
   - Validate file sizes: max 50MB per file
   - Log audit event: 'draft.save' với draftId, userId
</action>

<acceptance_criteria>
  <criterion>File src/app/api/intake/draft/save/route.ts tồn tại với POST handler</criterion>
  <criterion>Zod schema validate tất cả request fields với error messages rõ ràng</criterion>
  <criterion>API trả 401 nếu không có session (requireAppSession fail)</criterion>
  <criterion>API trả 403 nếu draftId provided nhưng userId không match</criterion>
  <criterion>API tạo new draft nếu draftId không provided, trả về draftId mới</criterion>
  <criterion>API update existing draft nếu draftId provided và userId matches</criterion>
  <criterion>Response format đúng chuẩn: { success: true, data: { draftId, updatedAt } }</criterion>
  <criterion>Test command: npx vitest run src/app/api/intake/draft/save/__tests__/route.test.ts - tất cả 8 tests pass (create, update, validation, auth, ownership)</criterion>
</acceptance_criteria>
</task>

---

<task>
<id>76-05-draft-load-api</id>
<name>Draft Load API Endpoint</name>
<description>Tạo GET endpoint /api/intake/draft/:id để load draft data với user ownership validation.</description>

<requirements>
  <req_id>CREQ-11</req_id>
</requirements>

<read_first>
  <file>src/lib/security/session.ts</file>
  <file>src/docs/API_STANDARDS.md</file>
</read_first>

<action>
Tạo file src/app/api/intake/draft/[id]/route.ts:

1. Path parameter extraction:
   - Extract id từ URL params
   - Validate id format (cuid string)

2. User authentication:
   - Extract userId từ session (requireAppSession)

3. Draft load logic:
   - Query draft từ database by id
   - Validate draft exists (return 404 if not)
   - Validate draft.userId matches session.userId (prevent IDOR)
   - Validate draft.status === 'draft' (không load submitted/deleted drafts)

4. Response format:
   - Success: { success: true, data: { draftId, domainId, serviceType, answers, files, priority, contactInfo, updatedAt } }
   - Error 400: Invalid draftId format
   - Error 401: Unauthorized
   - Error 403: Forbidden (draft belongs to another user)
   - Error 404: Draft not found or deleted

5. Security hardening:
   - Không expose internal fields (createdAt, userId)
   - Sanitize output (escape HTML in strings)
   - Log audit event: 'draft.load' với draftId, userId
</action>

<acceptance_criteria>
  <criterion>File src/app/api/intake/draft/[id]/route.ts tồn tại với GET handler</criterion>
  <criterion>API trả 400 nếu draftId format invalid (not cuid)</criterion>
  <criterion>API trả 401 nếu không có session</criterion>
  <criterion>API trả 403 nếu draft.userId không match session.userId</criterion>
  <criterion>API trả 404 nếu draft không tồn tại hoặc status !== 'draft'</criterion>
  <criterion>API trả draft data đầy đủ: draftId, domainId, serviceType, answers, files, priority, contactInfo, updatedAt</criterion>
  <criterion>Response không expose internal fields (createdAt, userId)</criterion>
  <criterion>Test command: npx vitest run src/app/api/intake/draft/[id]/__tests__/route.test.ts - tất cả 6 tests pass (load success, not found, unauthorized, forbidden, invalid id, deleted draft)</criterion>
</acceptance_criteria>
</task>

---

## Wave 3: Frontend Components

<task>
<id>76-07-wizard-provider</id>
<name>Wizard Context Provider with useReducer</name>
<description>Tạo WizardProvider component sử dụng React Context + useReducer để quản lý wizard state tập trung.</description>

<requirements>
  <req_id>CREQ-03</req_id>
  <req_id>CREQ-06</req_id>
</requirements>

<read_first>
  <file>src/lib/types/wizard.ts</file>
  <file>src/components/auth/AuthProvider.tsx</file>
</read_first>

<action>
Tạo file src/components/create-request/WizardProvider.tsx:

1. WizardContext definition:
   - state: WizardState
   - dispatch: Dispatch<WizardAction>
   - actions: Helper functions (goToStep, setDomain, setService, setAnswer, addFile, removeFile, setPriority, setContact, setDraftId, reset)

2. wizardReducer function:
   - SET_STEP: Update state.step
   - SET_DOMAIN: Update state.domainId, reset serviceType và answers
   - SET_SERVICE: Update state.serviceType, reset answers
   - SET_ANSWER: Update state.answers[key] = value, set isDirty: true
   - ADD_FILE: Append file to state.files, set isDirty: true
   - REMOVE_FILE: Filter out file from state.files, set isDirty: true
   - SET_PRIORITY: Update state.priority, set isDirty: true
   - SET_CONTACT: Merge state.contactInfo với payload
   - SET_DRAFT_ID: Update state.draftId, set isDirty: false
   - RESET: Return initialState

3. WizardProvider component:
   - Props: children, initialDraft?: WizardState (optional, từ query param)
   - Initialize state từ initialDraft nếu provided, else initialState
   - Wrap children trong Context.Provider

4. useWizard hook:
   - Return context value
   - Throw error nếu sử dụng ngoài Provider

5. Action helpers:
   - goToStep(step): dispatch SET_STEP
   - nextStep(): dispatch SET_STEP với current + 1 (max 5)
   - prevStep(): dispatch SET_STEP với current - 1 (min 1)
   - Các helpers khác wrap dispatch calls

6. Draft auto-save logic (trong useEffect):
   - Trigger save khi isDirty && step thay đổi
   - Call POST /api/intake/draft/save
   - Dispatch SET_DRAFT_ID với response
   - Set isDirty: false
</action>

<acceptance_criteria>
  <criterion>File src/components/create-request/WizardProvider.tsx tồn tại</criterion>
  <criterion>WizardContext export với state và dispatch</criterion>
  <criterion>wizardReducer handle tất cả 10 action types (SET_STEP, SET_DOMAIN, etc.)</criterion>
  <criterion>SET_DOMAIN action reset serviceType và answers về null/{}</criterion>
  <criterion>SET_SERVICE action reset answers về {}</criterion>
  <criterion>useWizard hook throw error nếu dùng ngoài Provider</criterion>
  <criterion>Action helpers (goToStep, nextStep, prevStep) hoạt động đúng</criterion>
  <criterion>initialDraft prop initialize state từ draft data</criterion>
  <criterion>Test command: npx vitest run src/components/create-request/__tests__/WizardProvider.test.tsx - tất cả 12 tests pass (reducer actions, context, hooks, helpers)</criterion>
</acceptance_criteria>
</task>

---

<task>
<id>76-08-wizard-steps-enhanced</id>
<name>Enhanced 5-Step Wizard Progress Indicator</name>
<description>Cập nhật WizardSteps component để hiển thị 5 steps với progress bar và validation states.</description>

<requirements>
  <req_id>CREQ-03</req_id>
</requirements>

<read_first>
  <file>src/components/create-request/WizardSteps.tsx</file>
  <file>src/lib/types/wizard.ts</file>
</read_first>

<action>
Cập nhật file src/components/create-request/WizardSteps.tsx:

1. Props mở rộng:
   - currentStep: number (1-5)
   - totalSteps: number (default 5)
   - completedSteps: number[] (steps đã hoàn thành)
   - validationErrors: Record<number, boolean> (step có lỗi validation)

2. Step labels (5 steps):
   - Step 1: "Lĩnh vực" (Domain)
   - Step 2: "Dịch vụ" (Service)
   - Step 3: "Thông tin" (Questions)
   - Step 4: "Tài liệu" (Upload)
   - Step 5: "Xác nhận" (Review)

3. Visual states:
   - Completed: Xanh lá (bg-green-500, text-white) với checkmark icon
   - Current: Xanh dương (bg-blue-500, text-white) với số step
   - Upcoming: Xám (bg-gray-200, text-gray-500) với số step
   - Error: Đỏ (bg-red-500, text-white) với exclamation icon

4. Progress bar:
   - Hiển thị phía trên steps
   - Width: ((currentStep - 1) / (totalSteps - 1)) * 100%
   - Color: gradient từ xanh lá (completed) sang xanh dương (current)

5. Step navigation:
   - Click vào completed step: navigate về step đó (dispatch SET_STEP)
   - Click vào current/upcoming step: disabled (không cho skip)
   - Tooltip trên hover: "Bước X: [label]"

6. Responsive:
   - Mobile (< 768px): Thu nhỏ labels, chỉ hiện số
   - Desktop (>= 768px): Hiện đầy đủ labels
</action>

<acceptance_criteria>
  <criterion>File src/components/create-request/WizardSteps.tsx cập nhật với 5 steps</criterion>
  <criterion>Component nhận props: currentStep, totalSteps, completedSteps, validationErrors</criterion>
  <criterion>Step labels: Lĩnh vực, Dịch vụ, Thông tin, Tài liệu, Xác nhận</criterion>
  <criterion>Completed steps hiển thị xanh lá với checkmark icon</criterion>
  <criterion>Current step hiển thị xanh dương với số</criterion>
  <criterion>Upcoming steps hiển thị xám</criterion>
  <criterion>Progress bar width tính đúng: ((currentStep - 1) / (totalSteps - 1)) * 100%</criterion>
  <criterion>Click vào completed step dispatch SET_STEP action</criterion>
  <criterion>Click vào current/upcoming step bị disabled</criterion>
  <criterion>Responsive: mobile thu nhỏ labels, desktop hiện đầy đủ</criterion>
</acceptance_criteria>
</task>

---

<task>
<id>76-09-legal-domain-selector</id>
<name>Legal Domain Selector Grid Component</name>
<description>Tạo component hiển thị 13 legal domains dưới dạng grid cards với icon, label, và description.</description>

<requirements>
  <req_id>CREQ-01</req_id>
  <req_id>CREQ-02</req_id>
</requirements>

<read_first>
  <file>src/lib/i18n/seed-legal-domains.ts</file>
  <file>src/components/ui/card.tsx</file>
</read_first>

<action>
Tạo file src/components/create-request/LegalDomainSelector.tsx:

1. Props:
   - selectedDomainId: string | null
   - onSelect: (domainId: string) => void
   - locale: string (vi, en, zh, ja)

2. Data fetching:
   - Import SEED_LEGAL_DOMAINS từ seed-legal-domains.ts
   - Map domains thành array với: id, label (multilingual), icon, description, serviceCount

3. Grid layout:
   - Desktop (>= 1024px): 4 columns
   - Tablet (768px - 1023px): 3 columns
   - Mobile (< 768px): 2 columns
   - Gap: 16px

4. Domain card design:
   - Height: 160px
   - Border: 2px solid gray-200, hover: gray-300, selected: blue-500
   - Background: white, selected: blue-50
   - Padding: 20px
   - Border radius: 12px
   - Cursor: pointer

5. Card content:
   - Icon: Lucide icon (40x40px, color: blue-500)
   - Label: font-semibold (16px, gray-900)
   - Description: font-normal (14px, gray-600, line-clamp-2)
   - Service count badge: "X dịch vụ" (12px, gray-500, bg-gray-100, rounded-full, px-2 py-1)

6. Icon mapping:
   - commercial-legal: Briefcase
   - corporate-legal: Building
   - employment-legal: Users
   - privacy-legal: Shield
   - product-legal: Package
   - regulatory-legal: FileCheck
   - ai-governance-legal: Bot
   - ip-legal: Lightbulb
   - litigation-legal: Scale
   - legal-clinic: Heart
   - law-student: GraduationCap
   - legal-builder-hub: Hammer
   - external-plugins: Plug

7. Interaction:
   - Click card: call onSelect(domainId)
   - Hover: scale(1.02) transition
   - Selected: ring-2 ring-blue-500
</action>

<acceptance_criteria>
  <criterion>File src/components/create-request/LegalDomainSelector.tsx tồn tại</criterion>
  <criterion>Component nhận props: selectedDomainId, onSelect, locale</criterion>
  <criterion>Import SEED_LEGAL_DOMAINS từ seed-legal-domains.ts</criterion>
  <criterion>Grid layout responsive: 4/3/2 columns cho desktop/tablet/mobile</criterion>
  <criterion>Mỗi card có height 160px, border 2px, padding 20px, border-radius 12px</criterion>
  <criterion>Card content: icon (40x40), label (16px semibold), description (14px, line-clamp-2), service count badge</criterion>
  <criterion>13 Lucide icons map đúng với domain keys</criterion>
  <criterion>Click card gọi onSelect(domainId)</criterion>
  <criterion>Hover effect: scale(1.02) transition</criterion>
  <criterion>Selected card: border-blue-500, bg-blue-50, ring-2 ring-blue-500</criterion>
  <criterion>Test command: npx vitest run src/components/create-request/__tests__/LegalDomainSelector.test.tsx - tất cả 8 tests pass (render, click, hover, selected state, responsive)</criterion>
</acceptance_criteria>
</task>

---

<task>
<id>76-10-service-type-list</id>
<name>Service Type List Component</name>
<description>Tạo component hiển thị danh sách service types của domain đã chọn với search và filter.</description>

<requirements>
  <req_id>CREQ-02</req_id>
</requirements>

<read_first>
  <file>src/lib/i18n/seed-legal-domains.ts</file>
  <file>src/components/ui/input.tsx</file>
</read_first>

<action>
Tạo file src/components/create-request/ServiceTypeList.tsx:

1. Props:
   - domainId: string
   - selectedServiceType: string | null
   - onSelect: (serviceTypeKey: string) => void
   - locale: string

2. Data fetching:
   - Import SEED_LEGAL_DOMAINS và SEED_MATTER_TYPES
   - Filter matter types theo domain.matterTypeKeys
   - Map thành array: key, label (multilingual), description, questions count

3. Search functionality:
   - Input field ở đầu list
   - Placeholder: "Tìm kiếm dịch vụ..."
   - Filter by label hoặc description (case-insensitive)
   - Debounce 300ms

4. List layout:
   - Vertical list, max-height: 500px, overflow-y: auto
   - Mỗi item: height 80px, border-bottom: 1px solid gray-200
   - Padding: 16px 20px

5. Service type item design:
   - Label: font-semibold (15px, gray-900)
   - Description: font-normal (14px, gray-600, line-clamp-1)
   - Questions count badge: "X câu hỏi" (12px, gray-500, bg-gray-100)
   - Selected state: bg-blue-50, border-left: 4px solid blue-500

6. Interaction:
   - Click item: call onSelect(serviceTypeKey)
   - Hover: bg-gray-50
   - Keyboard navigation: Arrow keys, Enter to select

7. Empty state:
   - Nếu không có service types (sau filter): "Không tìm thấy dịch vụ phù hợp"
   - Icon: Search (48x48, gray-400)
</action>

<acceptance_criteria>
  <criterion>File src/components/create-request/ServiceTypeList.tsx tồn tại</criterion>
  <criterion>Component nhận props: domainId, selectedServiceType, onSelect, locale</criterion>
  <criterion>Filter service types theo domain.matterTypeKeys</criterion>
  <criterion>Search input với debounce 300ms, filter by label/description</criterion>
  <criterion>List layout: vertical, max-height 500px, overflow-y auto</criterion>
  <criterion>Mỗi item: height 80px, padding 16px 20px, border-bottom 1px</criterion>
  <criterion>Item content: label (15px semibold), description (14px line-clamp-1), questions count badge</criterion>
  <criterion>Click item gọi onSelect(serviceTypeKey)</criterion>
  <criterion>Hover effect: bg-gray-50</criterion>
  <criterion>Selected item: bg-blue-50, border-left 4px blue-500</criterion>
  <criterion>Empty state: icon + message khi không có kết quả</criterion>
  <criterion>Keyboard navigation: Arrow keys + Enter hoạt động</criterion>
</acceptance_criteria>
</task>

---

<task>
<id>76-11-intake-questions-enhanced</id>
<name>Enhanced Intake Questions Form with Validation</name>
<description>Cập nhật IntakeQuestionsForm với validation on blur, error messages, và controlled inputs.</description>

<requirements>
  <req_id>CREQ-04</req_id>
</requirements>

<read_first>
  <file>src/components/create-request/IntakeQuestionsForm.tsx</file>
  <file>src/components/ui/input.tsx</file>
  <file>src/lib/types/wizard.ts</file>
</read_first>

<action>
Cập nhật file src/components/create-request/IntakeQuestionsForm.tsx:

1. Props mở rộng:
   - serviceType: string (thay vì selectedService)
   - answers: Record<string, string> (từ WizardContext)
   - onAnswerChange: (key: string, value: string) => void
   - errors: Record<string, string> (validation errors)
   - locale: string

2. Validation logic:
   - validateField(key, value): Kiểm tra required fields
   - validateEmail(value): Regex validation cho email fields
   - validatePhone(value): Regex validation cho phone fields (VN format)
   - Return error message hoặc empty string

3. Controlled inputs:
   - Input value: answers[question.key] || ''
   - onChange: call onAnswerChange(key, e.target.value)
   - onBlur: validate field, update errors state

4. Error display:
   - Dưới mỗi input: error message (14px, red-500)
   - Input border: red-500 khi có lỗi
   - Icon: AlertCircle (16x16, red-500) bên cạnh error message

5. Question types:
   - text: Input component (height 44px)
   - textarea: Textarea component (min-height 100px, resize vertical)
   - email: Input type="email" với email validation
   - phone: Input type="tel" với phone validation

6. Required field indicator:
   - Asterisk (*) màu đỏ sau label
   - Label: "Câu hỏi X" + required indicator

7. Form validation helper:
   - export validateQuestionsForm(questions, answers): Record<string, string>
   - Validate tất cả required fields
   - Return errors object
</action>

<acceptance_criteria>
  <criterion>File src/components/create-request/IntakeQuestionsForm.tsx cập nhật</criterion>
  <criterion>Props: serviceType, answers, onAnswerChange, errors, locale</criterion>
  <criterion>Controlled inputs: value từ answers[key], onChange gọi onAnswerChange</criterion>
  <criterion>Validation functions: validateField, validateEmail, validatePhone</criterion>
  <criterion>onBlur trigger validation và update errors</criterion>
  <criterion>Error display: message (14px red-500) + AlertCircle icon dưới input</criterion>
  <criterion>Input border: red-500 khi có lỗi</criterion>
  <criterion>Required field indicator: asterisk (*) đỏ sau label</criterion>
  <criterion>Question types: text, textarea, email, phone với validation phù hợp</criterion>
  <criterion>Export validateQuestionsForm helper function</criterion>
  <criterion>Test command: npx vitest run src/components/create-request/__tests__/IntakeQuestionsFormEnhanced.test.tsx - tất cả 10 tests pass (render, validation, controlled inputs, error display)</criterion>
</acceptance_criteria>
</task>

---

<task>
<id>76-12-file-upload-zone</id>
<name>Drag-and-Drop File Upload Zone with Progress</name>
<description>Tạo component upload zone với drag-and-drop, progress bar, và file preview.</description>

<requirements>
  <req_id>CREQ-05</req_id>
</requirements>

<read_first>
  <file>src/lib/types/vault.ts</file>
  <file>src/lib/api/client.ts</file>
</read_first>

<action>
Tạo file src/components/create-request/FileUploadZone.tsx:

1. Props:
   - files: UploadedFile[] (từ WizardContext)
   - onFileAdd: (file: UploadedFile) => void
   - onFileRemove: (fileId: string) => void
   - locale: string

2. Drag-and-drop zone:
   - Height: 200px, border: 2px dashed gray-300
   - Background: gray-50, hover: gray-100, dragover: blue-50
   - Border radius: 12px
   - Icon: Upload (48x48, gray-400)
   - Text: "Kéo thả file vào đây hoặc click để chọn"
   - Subtext: "Hỗ trợ: PDF, DOC, DOCX, JPG, PNG (tối đa 50MB)"

3. File input:
   - Hidden input type="file" multiple
   - Accept: .pdf,.doc,.docx,.jpg,.jpeg,.png
   - Click zone: trigger input.click()

4. Upload logic:
   - onFileSelect(files): Validate và upload từng file
   - Validate file size: <= 50MB, else show error toast
   - Validate file type: whitelist, else show error toast
   - Call POST /api/intake/attach-file với FormData
   - Track upload progress: uploadProgress state (0-100%)
   - On success: dispatch ADD_FILE action
   - On error: show error toast

5. Progress bar:
   - Hiển thị khi uploading
   - Height: 4px, bg-gray-200, fill: blue-500
   - Width: uploadProgress%
   - Text: "Đang tải lên... X%"

6. File preview list:
   - Grid layout: 3 columns (desktop), 2 columns (mobile)
   - Mỗi file card: 120x120px, border: 1px solid gray-200, border-radius: 8px
   - Content:
     - Thumbnail: PDF icon, DOC icon, hoặc image preview
     - Filename: line-clamp-2 (14px, gray-900)
     - File size: "X MB" (12px, gray-500)
     - Remove button: X icon (top-right, red-500, hover: red-600)

7. Remove file:
   - Click X button: call DELETE /api/intake/attach-file/:fileId
   - Dispatch REMOVE_FILE action
   - Confirmation dialog: "Xóa file này?"

8. Empty state:
   - Nếu files.length === 0: "Chưa có file nào được tải lên"
</action>

<acceptance_criteria>
  <criterion>File src/components/create-request/FileUploadZone.tsx tồn tại</criterion>
  <criterion>Props: files, onFileAdd, onFileRemove, locale</criterion>
  <criterion>Drag-and-drop zone: height 200px, border 2px dashed, hover/dragover states</criterion>
  <criterion>Hidden file input: accept .pdf,.doc,.docx,.jpg,.jpeg,.png, multiple</criterion>
  <criterion>Click zone trigger file input</criterion>
  <criterion>File validation: size <= 50MB, type whitelist</criterion>
  <criterion>Upload progress tracking: 0-100% với progress bar</criterion>
  <criterion>Progress bar: height 4px, bg-gray-200, fill blue-500, width = progress%</criterion>
  <criterion>File preview grid: 3/2 columns desktop/mobile, cards 120x120px</criterion>
  <criterion>File card: thumbnail, filename (line-clamp-2), size, remove button</criterion>
  <criterion>Remove file: confirmation dialog + DELETE API call + dispatch REMOVE_FILE</criterion>
  <criterion>Empty state khi files.length === 0</criterion>
</acceptance_criteria>
</task>

---

<task>
<id>76-13-review-step</id>
<name>Review Step Component with Summary</name>
<description>Tạo component hiển thị summary của wizard: domain, service, answers, files, priority, contact info.</description>

<requirements>
  <req_id>CREQ-06</req_id>
  <req_id>CREQ-07</req_id>
  <req_id>CREQ-09</req_id>
  <req_id>CREQ-10</req_id>
</requirements>

<read_first>
  <file>src/lib/types/wizard.ts</file>
  <file>src/lib/i18n/seed-legal-domains.ts</file>
</read_first>

<action>
Tạo file src/components/create-request/ReviewStep.tsx:

1. Props:
   - state: WizardState (từ WizardContext)
   - onEdit: (step: number) => void (navigate về step để edit)
   - locale: string

2. Layout:
   - 2 columns: 70% summary, 30% actions
   - Gap: 24px

3. Summary sections:
   
   a) Domain & Service:
      - Domain label (từ SEED_LEGAL_DOMAINS)
      - Service type label (từ SEED_MATTER_TYPES)
      - Edit button: "Chỉnh sửa" → onEdit(1) hoặc onEdit(2)
   
   b) Answers:
      - List tất cả answers: key → value
      - Format: "Câu hỏi X: [answer]"
      - Edit button: "Chỉnh sửa" → onEdit(3)
   
   c) Files:
      - Count: "X file đã tải lên"
      - List filenames (line-clamp-1)
      - Edit button: "Chỉnh sửa" → onEdit(4)
   
   d) Priority:
      - Radio group: Normal (default), Urgent
      - Normal: bg-gray-100, text-gray-700
      - Urgent: bg-red-100, text-red-700, icon: AlertCircle
      - onChange: dispatch SET_PRIORITY
   
   e) Contact Info:
      - Email: input (editable)
      - Phone: input (editable)
      - Company name: input (editable)
      - Tax code: input (editable)
      - onChange: dispatch SET_CONTACT
      - Pre-fill từ user profile (fetch GET /api/users/me nếu chưa có)

4. Actions column:
   - Submit button: "Gửi yêu cầu" (bg-blue-500, hover: blue-600, disabled nếu chưa đủ data)
   - Validation: disable nếu thiếu domain, service, hoặc required answers
   - Loading state: spinner khi submitting

5. Success state:
   - Modal overlay: bg-black/50
   - Modal content: 480x320px, bg-white, border-radius 12px
   - Icon: CheckCircle (64x64, green-500)
   - Title: "Yêu cầu đã được gửi thành công!"
   - Message: "Chúng tôi sẽ xử lý yêu cầu của bạn trong vòng X giờ."
   - Button: "Xem hồ sơ của tôi" → navigate /cases
   - Auto-redirect sau 2s

6. Error handling:
   - Submit error: toast error message
   - Retry button: "Thử lại"
</action>

<acceptance_criteria>
  <criterion>File src/components/create-request/ReviewStep.tsx tồn tại</criterion>
  <criterion>Props: state, onEdit, locale</criterion>
  <criterion>Layout: 2 columns 70/30, gap 24px</criterion>
  <criterion>Summary sections: Domain & Service, Answers, Files, Priority, Contact Info</criterion>
  <criterion>Mỗi section có Edit button gọi onEdit(step)</criterion>
  <criterion>Priority radio group: Normal (gray), Urgent (red với AlertCircle icon)</criterion>
  <criterion>Contact info inputs: email, phone, companyName, taxCode (editable)</criterion>
  <criterion>Contact info pre-fill từ user profile (fetch GET /api/users/me)</criterion>
  <criterion>Submit button disabled nếu thiếu domain/service/required answers</criterion>
  <criterion>Loading state: spinner khi submitting</criterion>
  <criterion>Success modal: overlay, modal 480x320px, CheckCircle icon, title, message, button</criterion>
  <criterion>Auto-redirect sau 2s về /cases</criterion>
  <criterion>Error handling: toast error + retry button</criterion>
  <criterion>Test command: npx vitest run src/components/create-request/__tests__/ReviewStep.test.tsx - tất cả 10 tests pass (render, edit navigation, priority selection, contact info, submit, success modal)</criterion>
</acceptance_criteria>
</task>

---

<task>
<id>76-14-create-request-form-integration</id>
<name>CreateRequestForm Wizard Integration</name>
<description>Tích hợp tất cả components vào CreateRequestForm với WizardProvider, step navigation, và draft auto-save.</description>

<requirements>
  <req_id>CREQ-03</req_id>
  <req_id>CREQ-11</req_id>
</requirements>

<read_first>
  <file>src/components/create-request/CreateRequestForm.tsx</file>
  <file>src/components/create-request/WizardProvider.tsx</file>
  <file>src/lib/types/wizard.ts</file>
</read_first>

<action>
Cập nhật file src/components/create-request/CreateRequestForm.tsx:

1. Wrap trong WizardProvider:
   - Import WizardProvider từ WizardProvider.tsx
   - Wrap toàn bộ form trong WizardProvider
   - Pass initialDraft prop nếu có query param ?draftId=xxx

2. Step rendering logic:
   - Step 1: LegalDomainSelector
   - Step 2: ServiceTypeList (chỉ render nếu state.domainId đã chọn)
   - Step 3: IntakeQuestionsFormEnhanced
   - Step 4: FileUploadZone
   - Step 5: ReviewStep

3. Step navigation:
   - Back button: dispatch prevStep()
   - Next button: validate current step, dispatch nextStep()
   - Validation trước khi next:
     - Step 1: Kiểm tra domainId đã chọn
     - Step 2: Kiểm tra serviceType đã chọn
     - Step 3: Validate tất cả required questions
     - Step 4: Không validation (files optional)
   - Nếu validation fail: show error toast, không navigate

4. Draft auto-save:
   - useEffect trigger khi step thay đổi
   - Call POST /api/intake/draft/save trước khi next
   - Dispatch SET_DRAFT_ID với response
   - Error handling: toast error nhưng vẫn cho navigate

5. Draft resume:
   - Parse query param ?draftId=xxx từ URL
   - Nếu có: fetch GET /api/intake/draft/:id
   - Pass draft data vào WizardProvider initialDraft prop
   - Show banner: "Đang tiếp tục từ bản nháp" với button "Xóa và bắt đầu mới"

6. Side panels:
   - Render SummaryPanel và ChecklistPanel bên phải
   - Pass state.domainId, state.serviceType vào SummaryPanel
   - ChecklistPanel hiển thị dựa trên serviceType

7. URL state sync:
   - Update URL query params khi step thay đổi: ?step=2
   - Preserve draftId trong URL: ?step=2&draftId=xxx
   - Use next/navigation useRouter() và useSearchParams()

8. Loading states:
   - Skeleton khi fetching draft
   - Spinner khi submitting
   - Disabled buttons khi API calls in progress
</action>

<acceptance_criteria>
  <criterion>File src/components/create-request/CreateRequestForm.tsx cập nhật</criterion>
  <criterion>Wrap trong WizardProvider với initialDraft prop</criterion>
  <criterion>Step rendering: Step 1-5 với đúng components</criterion>
  <criterion>Step 2 chỉ render nếu state.domainId đã chọn</criterion>
  <criterion>Back button dispatch prevStep(), Next button dispatch nextStep()</criterion>
  <criterion>Validation trước khi next: step 1 (domainId), step 2 (serviceType), step 3 (required questions)</criterion>
  <criterion>Validation fail show error toast và không navigate</criterion>
  <criterion>Draft auto-save: useEffect trigger khi step thay đổi, call POST /api/intake/draft/save</criterion>
  <criterion>Draft auto-save dispatch SET_DRAFT_ID với response</criterion>
  <criterion>Draft resume: parse query param ?draftId, fetch GET /api/intake/draft/:id</criterion>
  <criterion>Draft resume banner: "Đang tiếp tục từ bản nháp" với button "Xóa và bắt đầu mới"</criterion>
  <criterion>Side panels: SummaryPanel và ChecklistPanel render với state props</criterion>
  <criterion>URL state sync: update query params ?step=X&draftId=XXX</criterion>
  <criterion>Loading states: skeleton khi fetching draft, spinner khi submitting, disabled buttons</criterion>
</acceptance_criteria>
</task>

---

## Wave 4: Integration + Tests

<task>
<id>76-15-page-integration</id>
<name>Create Request Page Integration</name>
<description>Cập nhật page.tsx để tích hợp CreateRequestForm với auth check và layout.</description>

<requirements>
  <req_id>CREQ-01</req_id>
  <req_id>CREQ-08</req_id>
</requirements>

<read_first>
  <file>src/app/[locale]/create/page.tsx</file>
  <file>src/app/[locale]/layout.tsx</file>
</read_first>

<action>
Cập nhật file src/app/[locale]/create/page.tsx:

1. Server component:
   - Import requireAppSession từ security/session
   - Check auth: redirect /login nếu chưa login
   - Fetch user data: name, email, organization
   - Pass user data vào CreateRequestForm

2. Layout:
   - Sử dụng UserLayout component
   - Sidebar navigation: Dashboard, Cases, Create, Messages, Settings
   - Main content: CreateRequestForm component

3. Metadata:
   - Title: "Tạo yêu cầu mới"
   - Description: "Tạo yêu cầu pháp lý mới"

4. Draft ID query param:
   - Parse searchParams.draftId
   - Pass vào CreateRequestForm prop

5. Breadcrumb:
   - Home > Tạo yêu cầu

6. Responsive:
   - Mobile: Hide sidebar, full-width form
   - Desktop: Sidebar + form (max-width 1200px, centered)
</action>

<acceptance_criteria>
  <criterion>File src/app/[locale]/create/page.tsx cập nhật</criterion>
  <criterion>Server component với requireAppSession auth check</criterion>
  <criterion>Redirect /login nếu chưa login</criterion>
  <criterion>Fetch user data: name, email, organization</criterion>
  <criterion>Pass user data vào CreateRequestForm</criterion>
  <criterion>Sử dụng UserLayout component</criterion>
  <criterion>Metadata: title "Tạo yêu cầu mới", description "Tạo yêu cầu pháp lý mới"</criterion>
  <criterion>Parse searchParams.draftId và pass vào CreateRequestForm</criterion>
  <criterion>Breadcrumb: Home > Tạo yêu cầu</criterion>
  <criterion>Responsive: mobile hide sidebar, desktop sidebar + form max-width 1200px</criterion>
</acceptance_criteria>
</task>

---

<task>
<id>76-16-i18n-translations</id>
<name>Add i18n Translations for Wizard</name>
<description>Thêm tất cả translation keys cho wizard components vào 4 locale files (vi, en, zh, ja).</description>

<requirements>
  <req_id>CREQ-01</req_id>
</requirements>

<read_first>
  <file>src/messages/vi.json</file>
  <file>src/docs/I18N_RULES.md</file>
</read_first>

<action>
Thêm translation keys vào src/messages/{vi,en,zh,ja}.json:

1. CreateRequest namespace:

   a) Wizard steps:
      - CreateRequest.wizard.step1: "Lĩnh vực" / "Domain" / "领域" / "ドメイン"
      - CreateRequest.wizard.step2: "Dịch vụ" / "Service" / "服务" / "サービス"
      - CreateRequest.wizard.step3: "Thông tin" / "Information" / "信息" / "情報"
      - CreateRequest.wizard.step4: "Tài liệu" / "Documents" / "文档" / "ドキュメント"
      - CreateRequest.wizard.step5: "Xác nhận" / "Review" / "确认" / "確認"
   
   b) Domain labels (13 domains):
      - CreateRequest.domain.commercial-legal: "Thương mại" / "Commercial" / "商业" / "商事"
      - CreateRequest.domain.corporate-legal: "Doanh nghiệp" / "Corporate" / "企业" / "企業"
      - CreateRequest.domain.employment-legal: "Lao động" / "Employment" / "劳动" / "労働"
      - CreateRequest.domain.privacy-legal: "Bảo mật dữ liệu" / "Data Privacy" / "数据隐私" / "データプライバシー"
      - CreateRequest.domain.product-legal: "Sản phẩm" / "Product" / "产品" / "製品"
      - CreateRequest.domain.regulatory-legal: "Tuân thủ" / "Compliance" / "合规" / "コンプライアンス"
      - CreateRequest.domain.ai-governance-legal: "Quản trị AI" / "AI Governance" / "AI治理" / "AIガバナンス"
      - CreateRequest.domain.ip-legal: "Sở hữu trí tuệ" / "Intellectual Property" / "知识产权" / "知的財産"
      - CreateRequest.domain.litigation-legal: "Tranh tụng" / "Litigation" / "诉讼" / "訴訟"
      - CreateRequest.domain.legal-clinic: "Phòng pháp chế" / "Legal Clinic" / "法务诊所" / "法務クリニック"
      - CreateRequest.domain.law-student: "Sinh viên luật" / "Law Student" / "法学生" / "法学生"
      - CreateRequest.domain.legal-builder-hub: "Xây dựng pháp lý" / "Legal Builder Hub" / "法律构建中心" / "法律ビルダーハブ"
      - CreateRequest.domain.external-plugins: "Plugin bên ngoài" / "External Plugins" / "外部插件" / "外部プラグイン"
   
   c) Buttons:
      - CreateRequest.button.next: "Tiếp tục" / "Next" / "下一步" / "次へ"
      - CreateRequest.button.back: "Quay lại" / "Back" / "返回" / "戻る"
      - CreateRequest.button.saveDraft: "Lưu nháp" / "Save Draft" / "保存草稿" / "下書き保存"
      - CreateRequest.button.submit: "Gửi yêu cầu" / "Submit Request" / "提交请求" / "リクエスト送信"
      - CreateRequest.button.edit: "Chỉnh sửa" / "Edit" / "编辑" / "編集"
      - CreateRequest.button.viewCases: "Xem hồ sơ của tôi" / "View My Cases" / "查看我的案件" / "私の案件を見る"
      - CreateRequest.button.startOver: "Xóa và bắt đầu mới" / "Delete and Start Over" / "删除并重新开始" / "削除してやり直す"
   
   d) Messages:
      - CreateRequest.message.draftSaved: "Đã lưu nháp" / "Draft saved" / "草稿已保存" / "下書きを保存しました"
      - CreateRequest.message.submitSuccess: "Yêu cầu đã được gửi thành công!" / "Request submitted successfully!" / "请求已成功提交！" / "リクエストが正常に送信されました！"
      - CreateRequest.message.resumeDraft: "Đang tiếp tục từ bản nháp" / "Resuming from draft" / "从草稿继续" / "下書きから再開"
      - CreateRequest.message.uploadProgress: "Đang tải lên..." / "Uploading..." / "上传中..." / "アップロード中..."
      - CreateRequest.message.uploadSuccess: "Tải lên thành công" / "Upload successful" / "上传成功" / "アップロード成功"
      - CreateRequest.message.redirecting: "Chuyển hướng sau {seconds} giây..." / "Redirecting in {seconds} seconds..." / "{seconds}秒后重定向..." / "{seconds}秒後にリダイレクト..."
   
   e) Errors:
      - CreateRequest.error.required: "Trường này là bắt buộc" / "This field is required" / "此字段为必填项" / "この項目は必須です"
      - CreateRequest.error.invalidEmail: "Email không hợp lệ" / "Invalid email" / "无效的邮箱" / "無効なメール"
      - CreateRequest.error.fileTooLarge: "File vượt quá 50MB" / "File exceeds 50MB" / "文件超过50MB" / "ファイルが50MBを超えています"
      - CreateRequest.error.uploadFailed: "Không thể tải lên" / "Upload failed" / "上传失败" / "アップロード失敗"
      - CreateRequest.error.draftSaveFailed: "Không thể lưu nháp" / "Failed to save draft" / "保存草稿失败" / "下書きの保存に失敗しました"
      - CreateRequest.error.submitFailed: "Không thể gửi yêu cầu" / "Failed to submit request" / "提交请求失败" / "リクエストの送信に失敗しました"
      - CreateRequest.error.selectDomain: "Vui lòng chọn lĩnh vực" / "Please select a domain" / "请选择领域" / "ドメインを選択してください"
      - CreateRequest.error.selectService: "Vui lòng chọn dịch vụ" / "Please select a service" / "请选择服务" / "サービスを選択してください"
   
   f) Labels:
      - CreateRequest.label.priority: "Mức độ ưu tiên" / "Priority" / "优先级" / "優先度"
      - CreateRequest.label.normal: "Bình thường" / "Normal" / "普通" / "通常"
      - CreateRequest.label.urgent: "Khẩn cấp" / "Urgent" / "紧急" / "緊急"
      - CreateRequest.label.contactInfo: "Thông tin liên hệ" / "Contact Information" / "联系信息" / "連絡先情報"
      - CreateRequest.label.email: "Email" / "Email" / "邮箱" / "メール"
      - CreateRequest.label.phone: "Số điện thoại" / "Phone" / "电话" / "電話"
      - CreateRequest.label.companyName: "Tên công ty" / "Company Name" / "公司名称" / "会社名"
      - CreateRequest.label.taxCode: "Mã số thuế" / "Tax Code" / "税番号" / "税番号"

2. Tổng cộng: 50+ translation keys
3. Format JSON đúng chuẩn, không trailing comma
4. Validate: npm run i18n:check (nếu có script)
</action>

<acceptance_criteria>
  <criterion>File src/messages/vi.json cập nhật với 50+ CreateRequest keys</criterion>
  <criterion>File src/messages/en.json cập nhật với 50+ CreateRequest keys</criterion>
  <criterion>File src/messages/zh.json cập nhật với 50+ CreateRequest keys</criterion>
  <criterion>File src/messages/ja.json cập nhật với 50+ CreateRequest keys</criterion>
  <criterion>Tất cả wizard step labels translated (5 steps)</criterion>
  <criterion>Tất cả domain labels translated (13 domains)</criterion>
  <criterion>Tất cả button labels translated (7 buttons)</criterion>
  <criterion>Tất cả message labels translated (6 messages)</criterion>
  <criterion>Tất cả error labels translated (8 errors)</criterion>
  <criterion>Tất cả label labels translated (8 labels)</criterion>
  <criterion>JSON format đúng chuẩn, không trailing comma</criterion>
  <criterion>Validation: npm run i18n:check pass (nếu có script)</criterion>
</acceptance_criteria>
</task>

---

<task>
<id>76-17-unit-tests-components</id>
<name>Unit Tests for Wizard Components</name>
<description>Viết unit tests cho tất cả wizard components: LegalDomainSelector, ServiceTypeList, IntakeQuestionsFormEnhanced, FileUploadZone, ReviewStep, WizardProvider.</description>

<requirements>
  <req_id>CREQ-01</req_id>
  <req_id>CREQ-02</req_id>
  <req_id>CREQ-03</req_id>
  <req_id>CREQ-04</req_id>
  <req_id>CREQ-05</req_id>
  <req_id>CREQ-06</req_id>
</requirements>

<read_first>
  <file>src/components/auth/__tests__/SignInForm.test.tsx</file>
  <file>src/components/create-request/WizardProvider.tsx</file>
</read_first>

<action>
Tạo unit tests trong src/components/create-request/__tests__/:

1. WizardProvider.test.tsx (12 tests):
   - Render provider với children
   - useWizard hook return state và dispatch
   - Reducer actions: SET_STEP, SET_DOMAIN, SET_SERVICE, SET_ANSWER, ADD_FILE, REMOVE_FILE, SET_PRIORITY, SET_CONTACT, SET_DRAFT_ID, RESET
   - Action helpers: goToStep, nextStep, prevStep
   - initialDraft prop initialize state
   - Error khi dùng useWizard ngoài Provider

2. LegalDomainSelector.test.tsx (8 tests):
   - Render 13 domain cards
   - Grid layout responsive (mock window.innerWidth)
   - Click card gọi onSelect
   - Selected state: border-blue-500, bg-blue-50
   - Hover effect: scale transform
   - Icons render đúng (13 Lucide icons)
   - Labels render từ SEED_LEGAL_DOMAINS
   - Service count badge hiển thị

3. ServiceTypeList.test.tsx (7 tests):
   - Filter service types theo domainId
   - Render list items
   - Search input filter by label/description
   - Click item gọi onSelect
   - Selected state: bg-blue-50, border-left blue-500
   - Empty state khi không có kết quả
   - Keyboard navigation: Arrow keys + Enter

4. IntakeQuestionsFormEnhanced.test.tsx (10 tests):
   - Render questions từ service type
   - Controlled inputs: value từ answers, onChange gọi onAnswerChange
   - Validation on blur: required fields
   - Email validation: invalid format show error
   - Phone validation: invalid format show error
   - Error display: message + AlertCircle icon
   - Input border red khi có lỗi
   - Required field indicator: asterisk
   - Textarea render cho multiline questions
   - validateQuestionsForm helper function

5. FileUploadZone.test.tsx (9 tests):
   - Render drag-and-drop zone
   - Click zone trigger file input
   - Drag over: bg-blue-50, border-blue-500
   - File validation: size > 50MB show error toast
   - File validation: invalid type show error toast
   - Upload progress bar render
   - File preview grid render
   - Remove file: confirmation dialog + dispatch REMOVE_FILE
   - Empty state khi files.length === 0

6. ReviewStep.test.tsx (10 tests):
   - Render 2 columns layout
   - Summary sections: Domain & Service, Answers, Files, Priority, Contact Info
   - Edit buttons gọi onEdit(step)
   - Priority radio group: Normal, Urgent
   - Contact info inputs: email, phone, companyName, taxCode
   - Contact info pre-fill từ user profile (mock API)
   - Submit button disabled khi thiếu data
   - Loading state: spinner khi submitting
   - Success modal render sau submit
   - Error handling: toast error + retry button

Mocking strategy:
- Mock next/navigation (useRouter, useSearchParams)
- Mock next-intl (useTranslations)
- Mock API calls (fetch, POST /api/intake/draft/save, GET /api/intake/draft/:id)
- Mock Lucide icons (simple div placeholders)
- Mock react-hot-toast (toast.success, toast.error)

Test command: npm run test -- src/components/create-request/__tests__/
Coverage target: ≥ 90% line coverage
</action>

<acceptance_criteria>
  <criterion>File WizardProvider.test.tsx tồn tại với 12 tests</criterion>
  <criterion>File LegalDomainSelector.test.tsx tồn tại với 8 tests</criterion>
  <criterion>File ServiceTypeList.test.tsx tồn tại với 7 tests</criterion>
  <criterion>File IntakeQuestionsFormEnhanced.test.tsx tồn tại với 10 tests</criterion>
  <criterion>File FileUploadZone.test.tsx tồn tại với 9 tests</criterion>
  <criterion>File ReviewStep.test.tsx tồn tại với 10 tests</criterion>
  <criterion>Tổng cộng: 56 unit tests</criterion>
  <criterion>Tất cả tests pass: npm run test -- src/components/create-request/__tests__/</criterion>
  <criterion>Coverage ≥ 90% line coverage</criterion>
  <criterion>Mocking: next/navigation, next-intl, API calls, Lucide icons, react-hot-toast</criterion>
  <criterion>Test scenarios: render, user interaction, validation, error handling, loading states</criterion>
</acceptance_criteria>
</task>

---

<task>
<id>76-18-unit-tests-api</id>
<name>Unit Tests for API Endpoints</name>
<description>Viết unit tests cho 3 API endpoints: draft save, draft load, submit enhancement.</description>

<requirements>
  <req_id>CREQ-07</req_id>
  <req_id>CREQ-09</req_id>
  <req_id>CREQ-10</req_id>
  <req_id>CREQ-11</req_id>
</requirements>

<read_first>
  <file>src/app/api/auth/sign-in/__tests__/route.test.ts</file>
  <file>src/app/api/intake/draft/save/route.ts</file>
</read_first>

<action>
Tạo unit tests trong src/app/api/intake/draft/ và submit/:

1. src/app/api/intake/draft/save/__tests__/route.test.ts (8 tests):
   - POST request với valid data → 200, return draftId
   - POST request không có session → 401
   - POST request với invalid data (missing required fields) → 400
   - POST request với draftId không tồn tại → 200, create new draft
   - POST request với draftId của user khác → 403
   - POST request với draftId của user hiện tại → 200, update draft
   - Validation: invalid domainId → 400
   - Validation: invalid serviceType → 400

2. src/app/api/intake/draft/[id]/__tests__/route.test.ts (6 tests):
   - GET request với valid draftId → 200, return draft data
   - GET request không có session → 401
   - GET request với draftId không tồn tại → 404
   - GET request với draftId của user khác → 403
   - GET request với draftId invalid format → 400
   - GET request với deleted draft → 404

3. src/app/api/intake/submit/__tests__/route.test.ts (7 tests):
   - POST request với valid data + priority normal → 200, slaDeadline = now + 72h
   - POST request với valid data + priority urgent → 200, slaDeadline = now + 24h, log audit
   - POST request không có session → 401
   - POST request với requestId của user khác → 403
   - POST request với requestId không tồn tại → 404
   - Validation: invalid priority (not normal/urgent) → 400
   - Validation: invalid email format in contactInfo → 400

Mocking strategy:
- Mock requireAppSession: return { userId: 'test-user-id' }
- Mock prisma: draft.findUnique, draft.create, draft.update, request.findUnique, request.update
- Mock NextRequest, NextResponse
- Mock audit log service
- Mock Zod validation

Test command: npm run test -- src/app/api/intake/
Coverage target: ≥ 90% line coverage
</action>

<acceptance_criteria>
  <criterion>File src/app/api/intake/draft/save/__tests__/route.test.ts tồn tại với 8 tests</criterion>
  <criterion>File src/app/api/intake/draft/[id]/__tests__/route.test.ts tồn tại với 6 tests</criterion>
  <criterion>File src/app/api/intake/submit/__tests__/route.test.ts tồn tại với 7 tests</criterion>
  <criterion>Tổng cộng: 21 unit tests</criterion>
  <criterion>Tất cả tests pass: npm run test -- src/app/api/intake/</criterion>
  <criterion>Coverage ≥ 90% line coverage</criterion>
  <criterion>Mocking: requireAppSession, prisma, NextRequest, NextResponse, audit log, Zod</criterion>
  <criterion>Test scenarios: success, auth errors, validation errors, ownership errors, not found errors</criterion>
  <criterion>Priority logic: normal = 72h SLA, urgent = 24h SLA + audit log</criterion>
</acceptance_criteria>
</task>

---

<task>
<id>76-19-e2e-tests-wizard-flow</id>
<name>E2E Tests for Wizard Flow</name>
<description>Viết E2E tests cho full wizard flow: domain selection, service selection, questions, upload, review, submit.</description>

<requirements>
  <req_id>CREQ-01</req_id>
  <req_id>CREQ-02</req_id>
  <req_id>CREQ-03</req_id>
  <req_id>CREQ-04</req_id>
  <req_id>CREQ-05</req_id>
  <req_id>CREQ-06</req_id>
  <req_id>CREQ-07</req_id>
</requirements>

<read_first>
  <file>e2e/074-sign-in.spec.ts</file>
  <file>e2e/fixtures/users.ts</file>
</read_first>

<action>
Tạo file e2e/076-wizard-flow.spec.ts:

1. Test suite: "Create Request Wizard Flow"

2. Setup:
   - Login với customer user trước mỗi test
   - Navigate đến /vi/create
   - Wait for page load

3. Test 1: "Complete wizard flow from domain to submit"
   - Step 1: Select domain "Thương mại" (commercial-legal)
   - Verify: 13 domain cards render, click card navigate to step 2
   - Step 2: Select service "Hợp đồng phân phối" (distribution_contract)
   - Verify: Service list render, click item navigate to step 3
   - Step 3: Fill 3 required questions
   - Verify: Questions render, fill inputs, validation pass
   - Step 4: Skip upload (optional)
   - Verify: Next button enabled without files
   - Step 5: Review summary
   - Verify: All sections render (Domain, Service, Answers, Files, Priority, Contact)
   - Select priority: Urgent
   - Click submit button
   - Verify: Success modal render, redirect to /vi/cases sau 2s

4. Test 2: "Navigate back and forth between steps"
   - Step 1: Select domain
   - Step 2: Select service
   - Click back button → return to step 1
   - Verify: Domain still selected
   - Click next button → return to step 2
   - Verify: Service still selected

5. Test 3: "Validation prevents navigation without selection"
   - Step 1: Không chọn domain, click next
   - Verify: Error toast "Vui lòng chọn lĩnh vực"
   - Verify: Stay on step 1
   - Select domain, click next → navigate to step 2

6. Test 4: "Edit from review step"
   - Complete steps 1-5
   - Click "Chỉnh sửa" button trong Domain section
   - Verify: Navigate to step 1
   - Change domain
   - Click next → navigate to step 2 (service reset)
   - Verify: Service list updated theo new domain

7. Test 5: "Priority selection affects SLA"
   - Complete steps 1-4
   - Step 5: Select "Bình thường" priority
   - Submit
   - Verify: API call với priority: 'normal'
   - Repeat test với "Khẩn cấp" priority
   - Verify: API call với priority: 'urgent'

8. Test 6: "Contact info pre-fill from user profile"
   - Complete steps 1-4
   - Step 5: Verify contact info inputs pre-filled
   - Verify: Email = user.email, Phone = user.phone, CompanyName = user.organization.name
   - Edit email field
   - Submit
   - Verify: API call với edited email

Test command: npx playwright test e2e/076-wizard-flow.spec.ts
Browser: Chromium, Firefox, WebKit
</action>

<acceptance_criteria>
  <criterion>File e2e/076-wizard-flow.spec.ts tồn tại với 6 tests</criterion>
  <criterion>Setup: Login customer user, navigate /vi/create</criterion>
  <criterion>Test 1: Complete wizard flow 5 steps → success modal → redirect /vi/cases</criterion>
  <criterion>Test 2: Navigate back and forth, verify state preserved</criterion>
  <criterion>Test 3: Validation prevents navigation without selection, show error toast</criterion>
  <criterion>Test 4: Edit from review step navigate back, change domain reset service</criterion>
  <criterion>Test 5: Priority selection (normal/urgent) send đúng value trong API call</criterion>
  <criterion>Test 6: Contact info pre-fill từ user profile, editable</criterion>
  <criterion>Tất cả tests pass: npx playwright test e2e/076-wizard-flow.spec.ts</criterion>
  <criterion>Browser: Chromium, Firefox, WebKit</criterion>
</acceptance_criteria>
</task>

---

<task>
<id>76-20-e2e-tests-draft-persistence</id>
<name>E2E Tests for Draft Persistence</name>
<description>Viết E2E tests cho draft auto-save, manual save, và resume functionality.</description>

<requirements>
  <req_id>CREQ-11</req_id>
</requirements>

<read_first>
  <file>e2e/076-wizard-flow.spec.ts</file>
  <file>src/app/api/intake/draft/save/route.ts</file>
</read_first>

<action>
Tạo file e2e/076-draft-save-resume.spec.ts:

1. Test suite: "Draft Persistence"

2. Setup:
   - Login với customer user trước mỗi test
   - Mock API: POST /api/intake/draft/save, GET /api/intake/draft/:id

3. Test 1: "Auto-save draft on step navigation"
   - Step 1: Select domain
   - Click next button
   - Verify: API call POST /api/intake/draft/save với domainId
   - Verify: URL update ?step=2&draftId=xxx
   - Step 2: Select service
   - Click next button
   - Verify: API call POST /api/intake/draft/save với serviceType
   - Verify: URL update ?step=3&draftId=xxx

4. Test 2: "Manual save draft button"
   - Step 1: Select domain
   - Click "Lưu nháp" button
   - Verify: API call POST /api/intake/draft/save
   - Verify: Success toast "Đã lưu nháp"
   - Verify: URL update ?draftId=xxx

5. Test 3: "Resume draft from URL"
   - Navigate đến /vi/create?draftId=test-draft-id
   - Verify: API call GET /api/intake/draft/test-draft-id
   - Verify: Banner "Đang tiếp tục từ bản nháp" render
   - Verify: Domain pre-selected
   - Verify: Service pre-selected
   - Verify: Answers pre-filled
   - Verify: Files pre-loaded

6. Test 4: "Delete draft and start over"
   - Navigate đến /vi/create?draftId=test-draft-id
   - Verify: Banner render
   - Click "Xóa và bắt đầu mới" button
   - Verify: Confirmation dialog render
   - Click "Xóa" button
   - Verify: API call DELETE /api/intake/draft/test-draft-id
   - Verify: URL update /vi/create (no draftId)
   - Verify: Form reset to initial state

7. Test 5: "Draft save failure handling"
   - Mock API POST /api/intake/draft/save return 500 error
   - Step 1: Select domain
   - Click next button
   - Verify: Error toast "Không thể lưu nháp"
   - Verify: Still navigate to step 2 (non-blocking)
   - Verify: Continue wizard bình thường

8. Test 6: "Draft load failure handling"
   - Navigate đến /vi/create?draftId=invalid-draft-id
   - Mock API GET /api/intake/draft/invalid-draft-id return 404
   - Verify: Error toast "Không thể tải bản nháp"
   - Verify: Form render with initial state (no pre-fill)
   - Verify: Continue wizard bình thường

Test command: npx playwright test e2e/076-draft-save-resume.spec.ts
Browser: Chromium, Firefox, WebKit
</action>

<acceptance_criteria>
  <criterion>File e2e/076-draft-save-resume.spec.ts tồn tại với 6 tests</criterion>
  <criterion>Setup: Login customer user, mock draft API endpoints</criterion>
  <criterion>Test 1: Auto-save trigger khi step thay đổi, URL update với draftId</criterion>
  <criterion>Test 2: Manual save button gọi API, show success toast, URL update</criterion>
  <criterion>Test 3: Resume draft từ URL query param, pre-fill form data</criterion>
  <criterion>Test 4: Delete draft button show confirmation, call DELETE API, reset form</criterion>
  <criterion>Test 5: Draft save failure show error toast, non-blocking (continue wizard)</criterion>
  <criterion>Test 6: Draft load failure show error toast, render initial state</criterion>
  <criterion>Tất cả tests pass: npx playwright test e2e/076-draft-save-resume.spec.ts</criterion>
  <criterion>Browser: Chromium, Firefox, WebKit</criterion>
</acceptance_criteria>
</task>

---

<task>
<id>76-21-e2e-tests-file-upload</id>
<name>E2E Tests for File Upload and Submit</name>
<description>Viết E2E tests cho file upload functionality và submit workflow.</description>

<requirements>
  <req_id>CREQ-05</req_id>
  <req_id>CREQ-07</req_id>
</requirements>

<read_first>
  <file>e2e/076-wizard-flow.spec.ts</file>
  <file>src/app/api/intake/attach-file/route.ts</file>
</read_first>

<action>
Tạo file e2e/076-file-upload-submit.spec.ts:

1. Test suite: "File Upload and Submit"

2. Setup:
   - Login với customer user trước mỗi test
   - Navigate đến /vi/create
   - Complete steps 1-3 (domain, service, questions)
   - Mock API: POST /api/intake/attach-file, DELETE /api/intake/attach-file/:id, POST /api/intake/submit

3. Test 1: "Upload file via click"
   - Step 4: Click upload zone
   - Verify: File picker dialog open
   - Select test file (test.pdf, 1MB)
   - Verify: Upload progress bar render
   - Verify: API call POST /api/intake/attach-file
   - Verify: Success toast "Tải lên thành công"
   - Verify: File preview card render với filename, size

4. Test 2: "Upload file via drag-and-drop"
   - Step 4: Drag file over upload zone
   - Verify: Zone highlight (bg-blue-50, border-blue-500)
   - Drop file
   - Verify: Upload progress bar render
   - Verify: File preview card render

5. Test 3: "Upload multiple files"
   - Step 4: Upload 3 files (test1.pdf, test2.docx, test3.jpg)
   - Verify: 3 file preview cards render
   - Verify: File count badge "3 files"

6. Test 4: "File validation: size limit"
   - Step 4: Upload large file (test-large.pdf, 60MB)
   - Verify: Error toast "File vượt quá 50MB"
   - Verify: File không render trong preview list
   - Verify: No API call

7. Test 5: "File validation: type whitelist"
   - Step 4: Upload invalid file (test.exe)
   - Verify: Error toast "Loại file không được hỗ trợ"
   - Verify: File không render trong preview list
   - Verify: No API call

8. Test 6: "Remove file"
   - Step 4: Upload file
   - Verify: File preview card render
   - Click remove button (X icon)
   - Verify: Confirmation dialog "Xóa file này?"
   - Click "Xóa" button
   - Verify: API call DELETE /api/intake/attach-file/:id
   - Verify: File preview card removed

9. Test 7: "Submit with files"
   - Step 4: Upload 2 files
   - Step 5: Review summary
   - Verify: Files section render "2 files đã tải lên"
   - Verify: File list render
   - Click submit button
   - Verify: API call POST /api/intake/submit với files array
   - Verify: Success modal render

10. Test 8: "Submit without files"
    - Step 4: Skip upload (không upload file nào)
    - Step 5: Review summary
    - Verify: Files section render "0 files đã tải lên"
    - Click submit button
    - Verify: API call POST /api/intake/submit với files: []
    - Verify: Success modal render (files optional)

Test command: npx playwright test e2e/076-file-upload-submit.spec.ts
Browser: Chromium, Firefox, WebKit
</action>

<acceptance_criteria>
  <criterion>File e2e/076-file-upload-submit.spec.ts tồn tại với 8 tests</criterion>
  <criterion>Setup: Login customer user, complete steps 1-3, mock upload/submit APIs</criterion>
  <criterion>Test 1: Upload via click trigger file picker, progress bar, success toast, preview card</criterion>
  <criterion>Test 2: Upload via drag-and-drop highlight zone, progress bar, preview card</criterion>
  <criterion>Test 3: Upload multiple files render multiple preview cards</criterion>
  <criterion>Test 4: File size validation: > 50MB show error toast, no upload</criterion>
  <criterion>Test 5: File type validation: invalid type show error toast, no upload</criterion>
  <criterion>Test 6: Remove file show confirmation, call DELETE API, remove preview card</criterion>
  <criterion>Test 7: Submit with files render files in review, send files array trong API</criterion>
  <criterion>Test 8: Submit without files render "0 files", send empty array trong API</criterion>
  <criterion>Tất cả tests pass: npx playwright test e2e/076-file-upload-submit.spec.ts</criterion>
  <criterion>Browser: Chromium, Firefox, WebKit</criterion>
</acceptance_criteria>
</task>

---

## Verification Criteria

<verification>

### Build Verification
- `npm run build` completes without errors
- `npm run type-check` passes (TypeScript strict mode)
- `npm run lint` passes (ESLint rules)

### Test Verification
- Unit tests: `npm run test` - all 77 tests pass (56 component + 21 API)
- E2E tests: `npx playwright test` - all 20 tests pass (6 wizard + 6 draft + 8 upload)
- Coverage: `npm run test:coverage` - ≥ 90% line coverage

### Manual Verification
1. Navigate to /vi/create
2. Complete 5-step wizard flow
3. Verify draft auto-save on step navigation
4. Verify draft resume from URL
5. Verify file upload with progress
6. Verify submit with priority and contact info
7. Verify redirect to /vi/cases after submit
8. Test responsive design (mobile, tablet, desktop)
9. Test all 4 locales (vi, en, zh, ja)

### Performance Verification
- Initial wizard load < 2s (Lighthouse)
- Step transition < 500ms (user-perceived latency)
- File upload (10MB) < 5s (network request time)
- Draft save API < 1s (response time)

</verification>

---

## Must-Haves

<must_haves>

### Functional Requirements
- 13 legal domains render trong grid layout
- 30+ service types filter theo domain
- 5-step wizard flow với progress indicator
- Dynamic questions render theo service type
- File upload với drag-and-drop và progress bar
- Draft auto-save trước mỗi step transition
- Draft resume từ URL query param
- Priority selection (normal/urgent)
- Contact info pre-fill từ user profile
- Submit với priority và contact info
- Redirect to /cases sau submit thành công

### Edge Coverage (từ SPEC)
- Empty domains: Tất cả 13 domains có ít nhất 2 service types
- Invalid draftId: GET /api/intake/draft/:id trả 404, form start fresh
- Draft save failure: Toast error, user retry, không block wizard
- No user profile: Contact fields empty với label "Cập nhật sau"
- File upload 50MB+: Client-side validation trước khi upload, toast error
- Network failure submit: Auto-retry 3x, toast error, draft vẫn còn
- Back navigation: Browser back button giữ nguyên state
- Rapid step clicks: Disable next button khi API call in progress
- Service type deprecated: Filter out deprecated types trong UI
- Missing translation: Fallback to Vietnamese nếu key missing
- Concurrent draft saves: Debounce save calls (500ms), chỉ save latest
- Large file list: Virtualized list nếu > 20 files (future optimization)
- Priority change after submit: Priority locked sau submit
- Mobile touch targets: Tất cả buttons/cards min 44px touch target

### Prohibitions
- MUST NOT hardcode service names trong UI (dynamic lookup từ SEED_LEGAL_DOMAINS)
- MUST NOT skip draft save on step transition (auto-save trước mỗi step)
- MUST NOT use Ant Design components (custom Tailwind CSS only)
- MUST NOT redirect to dashboard after submit (redirect to /cases)
- MUST NOT show flat service list > 5 items (2-layer selection: domain → service)
- MUST NOT block wizard on draft save failure (toast error, continue wizard)
- MUST NOT pre-fill contact info without user consent (fields editable, user can override)
- MUST NOT allow submit without required answers (validation blocks submit)

### Test Coverage
- Unit tests: 77 tests (56 component + 21 API)
- E2E tests: 20 tests (6 wizard + 6 draft + 8 upload)
- Coverage: ≥ 90% line coverage

### Performance
- Initial wizard load < 2s
- Step transition < 500ms
- File upload (10MB) < 5s
- Draft save API < 1s

</must_haves>

---

<task>
<id>76-06-submit-enhancement</id>
<name>Enhanced Submit API with Priority and Contact Info</name>
<description>Cập nhật POST /api/intake/submit để nhận priority và contactInfo từ request body, validate và lưu vào database.</description>

<requirements>
  <req_id>CREQ-09</req_id>
  <req_id>CREQ-10</req_id>
</requirements>

<read_first>
  <file>src/app/api/intake/submit/route.ts</file>
  <file>src/lib/types/request.ts</file>
</read_first>

<action>
Cập nhật file src/app/api/intake/submit/route.ts:

1. Request body validation với Zod:
   - requestId: string (required, existing field)
   - priority: 'normal' | 'urgent' (optional, default 'normal')
   - contactInfo: { email: string, phone?: string, companyName?: string, taxCode?: string } (optional)

2. Request update logic:
   - Query request từ database by requestId
   - Validate request.userId matches session.userId
   - Update request.priority field (add to Request model if not exists)
   - Update request.contactInfo field (add to Request model if not exists)
   - Set request.status: 'submitted'
   - Update request.submittedAt: new Date()

3. Contact info validation:
   - Nếu contactInfo provided:
     - Validate email format (regex)
     - Warn nếu contactInfo.taxCode khác user.organization.taxCode (log warning, không block)
   - Nếu không provided:
     - Use default from user profile

4. Priority handling:
   - Nếu priority === 'urgent':
     - Set request.slaDeadline: now() + 24 hours
     - Log audit event: 'request.priority.escalated'
   - Nếu priority === 'normal':
     - Set request.slaDeadline: now() + 72 hours

5. Response format:
   - Success: { success: true, data: { requestId, status: 'submitted', submittedAt, slaDeadline } }
   - Error 400: Validation errors
   - Error 401: Unauthorized
   - Error 403: Forbidden (request belongs to another user)
   - Error 404: Request not found

6. Database schema updates (nếu cần):
   - Add priority field to Request model (String @default("normal"))
   - Add contactInfo field to Request model (Json?)
   - Add submittedAt field to Request model (DateTime?)
   - Create migration if fields added
</action>

<acceptance_criteria>
  <criterion>File src/app/api/intake/submit/route.ts cập nhật với priority và contactInfo validation</criterion>
  <criterion>API accept priority field ('normal' | 'urgent'), default 'normal' nếu không provided</criterion>
  <criterion>API accept contactInfo object với email, phone, companyName, taxCode fields</criterion>
  <criterion>API validate email format trong contactInfo (reject invalid emails)</criterion>
  <criterion>API set slaDeadline dựa trên priority: urgent = 24h, normal = 72h</criterion>
  <criterion>API log audit event 'request.priority.escalated' khi priority === 'urgent'</criterion>
  <criterion>API trả 403 nếu request.userId không match session.userId</criterion>
  <criterion>Response chứa: requestId, status: 'submitted', submittedAt, slaDeadline</criterion>
  <criterion>Test command: npx vitest run src/app/api/intake/submit/__tests__/route.test.ts - tất cả 7 tests pass (submit with priority, submit with contact, validation, auth, ownership, sla calculation)</criterion>
</acceptance_criteria>
</task>
