# Phase 75: Create Request — Specification

**Created:** 2026-06-20
**Ambiguity score:** 0.150 (gate: ≤ 0.20) ✅ Passed
**Requirements:** 14 locked

## Goal

Xây dựng Create Request wizard 5 bước với 2-layer service selection (Legal Domain → Service Type), dynamic intake questions, document upload, review & submit, tích hợp draft persistence, priority selection, contact info pre-fill, và redirect đến My Cases sau khi submit thành công.

## Background

**Current state:**
- `CreateRequestForm.tsx` có 4-step wizard (Service → Questions → Upload → Review)
- `ServiceTypeSelector.tsx` hiển thị flat list 3+1 service types từ `SEED_MATTER_TYPES`
- `IntakeQuestionsForm.tsx` render dynamic questions từ catalog
- Draft creation qua `POST /api/intake/create-draft` hoạt động
- File upload qua `POST /api/intake/attach-file` hoạt động
- Submit qua `POST /api/intake/submit` hoạt động
- Redirect sau submit đi về `/dashboard` thay vì `/cases`

**Gap:**
- Chỉ có 3+1 service types (labor_contract, agency_contract, trademark_registration, unsupported) — không đủ cho 13+ legal domains
- Flat list không scale — 13+ items không nhóm khiến user khó tìm
- Không có khái niệm "lĩnh vực pháp lý" (legal domain) để routing
- Draft save không hoạt động — button không wire vào API
- Không có priority selection (urgent/normal)
- Contact info không pre-fill từ user profile
- Không redirect đến "My Cases" sau submit

**Trigger:**
- SME cần gửi yêu cầu pháp lý theo cách đơn giản như nhắn tin
- Hệ thống cần taxonomy rõ ràng để route request đến đúng specialist

## Requirements

### R1. Legal Domain Taxonomy (NEW)
Tạo 2-layer service selection: Legal Domain → Service Type.

- **Current:** Flat list 3+1 items trong `SEED_MATTER_TYPES`
- **Target:** `SEED_LEGAL_DOMAINS` chứa 13+ domains, mỗi domain có 2-5 service types
- **Data structure:**
  ```typescript
  SEED_LEGAL_DOMAINS = {
    'commercial-legal': {
      label: { vi: 'Thương mại', en: 'Commercial' },
      icon: 'briefcase',
      matterTypeKeys: ['distribution_contract', 'nda', 'commercial_review'],
    },
    'corporate-legal': {
      label: { vi: 'Doanh nghiệp', en: 'Corporate' },
      icon: 'building',
      matterTypeKeys: ['incorporation', 'shareholder_agreement', 'm_and_a'],
    },
    // ... 11 domains nữa
  }
  ```
- **Acceptance:**
  - File `src/lib/i18n/seed-legal-domains.ts` tồn tại với 13 domains
  - Mỗi domain có label multilingual (VI/EN/ZH/JA), icon name, matterTypeKeys
  - `SEED_MATTER_TYPES` mở rộng từ 4 lên 30+ service types
  - Backward compatible: 3 existing types (labor_contract, agency_contract, trademark_registration) giữ nguyên

### R2. 2-Layer Service Selection UI (NEW)
Step 1 chia thành 2 sub-steps: chọn lĩnh vực → chọn dịch vụ.

- **Current:** `ServiceTypeSelector` render flat list
- **Target:** 
  - Sub-step 1a: `LegalDomainSelector` — grid 2-3 cột hiển thị 13 domain cards
  - Sub-step 1b: `ServiceTypeList` — list service types trong domain đã chọn
- **Acceptance:**
  - User click domain card → hiển thị service types của domain đó
  - User có thể back từ 1b về 1a để đổi domain
  - Grid responsive: 3 columns desktop, 2 columns tablet, 1 column mobile
  - Mỗi domain card hiển thị icon + label + số lượng service types
  - Không dùng Ant Design components

### R3. 5-Step Wizard Flow (MODIFIED)
Cập nhật wizard từ 4 steps thành 5 steps.

- **Current:** 4 steps (Service → Questions → Upload → Review)
- **Target:** 5 steps (Domain → Service → Questions → Upload → Review)
- **Acceptance:**
  - `WizardSteps` component render 5 steps
  - Progress indicator hiển thị đúng step hiện tại
  - Navigation: back/next hoạt động giữa các steps
  - Domain selection là step 1, Service selection là step 2

### R4. Dynamic Intake Questions (UNCHANGED)
Questions form render dynamic theo selected service type.

- **Current:** `IntakeQuestionsForm` đọc từ `SEED_MATTER_TYPES`
- **Target:** Giữ nguyên logic, chỉ mở rộng catalog
- **Acceptance:**
  - Questions render đúng theo matterTypeKey đã chọn
  - Required fields validate đúng
  - Textarea/text input render đúng type
  - **TODO (future phase):** Fetch questions từ API thay vì hardcode

### R5. Document Upload (UNCHANGED)
Drag-drop + file picker với preview.

- **Current:** File input + upload API hoạt động
- **Target:** Giữ nguyên, thêm drag-drop visual feedback
- **Acceptance:**
  - File picker hoạt động qua click
  - Drag-drop zone highlight khi drag file vào
  - Upload progress hiển thị
  - File preview thumbnails
  - Supported formats: PDF, DOC, DOCX, JPG, PNG (max 50MB)
  - Backend: `multipart/form-data` qua `POST /api/intake/attach-file`

### R6. Draft Persistence (NEW)
Save draft trước mỗi step để user có thể resume.

- **Current:** `createDraft()` chỉ gọi khi transition step 2→3
- **Target:** 
  - `POST /api/intake/draft/save` — lưu draft data
  - `GET /api/intake/draft/:id` — load draft
  - Auto-save trước mỗi step transition
  - "Lưu nháp" button cho explicit save
- **Acceptance:**
  - Draft save trước khi chuyển step (step 1→2, 2→3, 3→4, 4→5)
  - Query param `?draftId=xxx` trên URL khi resume
  - Page load với draftId → pre-fill form data
  - "Lưu nháp" button visible ở tất cả steps (trừ step 5)
  - API: `POST /api/intake/draft/save` body `{ draftId?, domainId, serviceType, answers, files, priority, contactInfo }`
  - API: `GET /api/intake/draft/:id` response `{ draftId, data, updatedAt }`

### R7. Priority Selection (NEW)
User chọn priority khi submit.

- **Current:** Không có priority
- **Target:** Priority dropdown trong step 5 (Review)
- **Acceptance:**
  - Dropdown với 2 options: Normal (mặc định), Urgent
  - Visual badge: 🟡 Normal, 🔴 Urgent
  - Priority gửi kèm khi submit
  - Summary panel hiển thị priority đã chọn

### R8. Contact Info Pre-fill (NEW)
Tự động điền thông tin liên hệ từ user profile.

- **Current:** Không pre-fill
- **Target:** Fetch `GET /api/users/me` và pre-fill contact fields
- **Acceptance:**
  - Contact info section trong step 5 (Review) hiển thị: email, phone, company name, tax code
  - Fields editable nếu cần sửa tạm thời
  - Loading state khi fetch profile
  - Fallback: nếu API fail, hiển thị empty fields với label "Cập nhật sau"

### R9. Redirect to My Cases (NEW)
Sau submit thành công, redirect đến My Cases.

- **Current:** Redirect về `/dashboard` sau 2s
- **Target:** Redirect về `/${locale}/cases` sau submit
- **Acceptance:**
  - Success message hiển thị 2s trước khi redirect
  - Button "Xem hồ sơ của tôi" visible ngay (click để redirect sớm)
  - Optional auto-redirect sau 5s (user có thể cancel)

### R10. Review Step Summary (MODIFIED)
Step 5 hiển thị summary đầy đủ trước khi submit.

- **Current:** Basic summary (service type, files count, status)
- **Target:** Comprehensive summary với tất cả thông tin
- **Acceptance:**
  - Hiển thị: Legal domain, Service type, Answers (key-value pairs), Files list, Priority, Contact info
  - Mỗi section có "Chỉnh sửa" button → navigate về step tương ứng
  - Submit button disabled nếu chưa có service type hoặc answers required

### R11. Side Panels Update (MODIFIED)
SummaryPanel và ChecklistPanel cập nhật theo domain taxonomy.

- **Current:** SummaryPanel hardcode service names
- **Target:** 
  - SummaryPanel đọc service name từ `SEED_MATTER_TYPES` dynamic
  - ChecklistPanel hiển thị checklist theo service type (nếu có)
- **Acceptance:**
  - SummaryPanel hiển thị đúng tên service type từ catalog
  - ChecklistPanel: nếu service type có checklist → hiển thị, nếu không → hide
  - Không hardcode service names

### R12. Internationalization (MODIFIED)
Tất cả text mới phải có translation VI/EN/ZH/JA.

- **Current:** Inline Vietnamese text trong một số components
- **Target:** 100% translation coverage
- **Acceptance:**
  - Tất cả labels, placeholders, error messages, success messages translated
  - Translation keys trong `messages/[locale].json`
  - Fallback to Vietnamese nếu key missing

### R13. Error Handling (NEW)
Consistent error handling strategy.

- **Current:** Ad-hoc error display (inline text)
- **Target:** Sử dụng toast notifications từ Phase 73
- **Acceptance:**
  - Network errors → toast error (auto-retry 3x)
  - Validation errors → inline dưới field
  - API errors → toast error với message từ backend
  - 401 → redirect to login

### R14. Test Coverage (NEW)
Unit tests + E2E tests ≥ 90% coverage.

- **Current:** Không có tests cho Create Request flow
- **Target:** 
  - Unit tests: Vitest + @testing-library/react
  - E2E tests: Playwright
- **Acceptance:**
  - Unit tests: ServiceTypeSelector, IntakeQuestionsForm, WizardSteps, CreateRequestForm
  - E2E tests: Full 5-step wizard flow, draft save/resume, file upload, submit success
  - Coverage ≥ 90%
  - Test scenarios: happy path, validation errors, network errors, empty states

## Legal Domains Catalog

### 13 Legal Domains

| Domain Key | VI Label | EN Label | Example Service Types |
|---|---|---|---|
| `commercial-legal` | Thương mại | Commercial | Hợp đồng phân phối, NDA, Review HĐ thương mại |
| `corporate-legal` | Doanh nghiệp | Corporate | Thành lập công ty, Thỏa thuận cổ đông, M&A |
| `employment-legal` | Lao động | Employment | HĐ lao động, Nội quy, Tranh chấp lao động |
| `privacy-legal` | Bảo mật dữ liệu | Privacy | Chính sách bảo mật, DPIA, Data processing agreement |
| `product-legal` | Sản phẩm | Product | Điều khoản sử dụng, Chính sách hoàn trả, Product liability |
| `regulatory-legal` | Tuân thủ | Regulatory | Giấy phép, Báo cáo tuân thủ, Compliance audit |
| `ai-governance-legal` | Quản trị AI | AI Governance | AI policy, Algorithm audit, AI ethics review |
| `ip-legal` | Sở hữu trí tuệ | Intellectual Property | Đăng ký nhãn hiệu, Bản quyền, Sáng chế |
| `litigation-legal` | Tranh tụng | Litigation | Đơn khởi kiện, Thỏa thuận hòa giải, Tư vấn kiện tụng |
| `legal-clinic` | Phòng pháp chế | Legal Clinic | Tư vấn nội bộ, Training pháp lý, Legal ops |
| `law-student` | Sinh viên luật | Law Student | Bài tập tình huống, Nghiên cứu pháp lý, Thực tập |
| `legal-builder-hub` | Xây dựng pháp lý | Legal Builder Hub | Template engine, Workflow builder, Form builder |
| `external-plugins` | Plugin bên ngoài | External Plugins | CoCounsel, Legal research tools, Integration |

### Service Types Expansion (từ 4 → 30+)

Mỗi domain có 2-5 service types. Ví dụ:
```typescript
SEED_MATTER_TYPES = {
  // Existing (giữ nguyên)
  labor_contract: { ... },
  agency_contract: { ... },
  trademark_registration: { ... },
  unsupported: { ... },
  
  // New - Commercial Legal
  distribution_contract: { label: { vi: 'Hợp đồng phân phối', ... }, questions: [...] },
  nda: { label: { vi: 'Thỏa thuận bảo mật (NDA)', ... }, questions: [...] },
  commercial_review: { label: { vi: 'Review hợp đồng thương mại', ... }, questions: [...] },
  
  // New - Corporate Legal
  incorporation: { label: { vi: 'Thành lập công ty', ... }, questions: [...] },
  shareholder_agreement: { label: { vi: 'Thỏa thuận cổ đông', ... }, questions: [...] },
  
  // ... 20+ more
}
```

## Boundaries

**In scope:**
- Legal domain taxonomy (13 domains) + service type expansion (30+)
- 2-layer service selection UI (Domain grid → Service list)
- 5-step wizard flow
- Draft persistence (save/resume)
- Priority selection (normal/urgent)
- Contact info pre-fill từ user profile
- Redirect to My Cases
- Review step summary comprehensive
- Side panels update
- i18n 100% coverage
- Error handling consistent
- Unit + E2E tests ≥ 90%

**Out of scope:**
- **AI-powered service recommendation** — user tự chọn, không gợi ý tự động
- **Multi-language questions** — questions chỉ bằng tiếng Việt (en/zh/ja trong phase sau)
- **Real-time collaboration** — không có multi-user editing
- **Advanced document preview** — chỉ thumbnail, không full preview trong wizard
- **Payment integration** — không xử lý thanh toán
- **E-signature** — không tích hợp chữ ký số
- **OCR/Document parsing** — không trích xuất dữ liệu từ file upload
- **Workflow automation** — request submit xong chờ human xử lý, không auto-assign
- **External plugin integration** — domain "external-plugins" chỉ placeholder, chưa integrate thật

## Constraints

- **Data volume:** SEED_LEGAL_DOMAINS + SEED_MATTER_TYPES phải fit trong 1 file (< 500 lines)
- **Performance:** Wizard phải load < 2s initial, step transition < 500ms
- **TypeScript strict:** All new code pass TypeScript strict mode
- **Architecture compliance:** Tuân thủ 9 docs trong `src/docs/` (API_STANDARDS, SERVICE_LAYER, CODE_STANDARDS, etc.)
- **No breaking changes:** Existing Create Request consumers không break
- **Locale support:** 4 languages (VI/EN/ZH/JA) từ đầu
- **UI framework:** **KHÔNG dùng Ant Design** — custom Tailwind CSS only
- **Cache strategy:** Draft data cache staleTime: 1 minute (frequent updates)
- **Auth access:** Strict hook-only — `useAuth()` cho client-side
- **File size limit:** Upload max 50MB per file
- **Browser support:** Chrome, Safari, Edge (latest 2 versions)
- **Mobile responsive:** Wizard hoạt động trên mobile (breakpoints: 640px, 768px, 1024px)

## Acceptance Criteria

- [ ] `SEED_LEGAL_DOMAINS` tồn tại với 13 domains, mỗi domain có label multilingual + icon + matterTypeKeys
- [ ] `SEED_MATTER_TYPES` mở rộng từ 4 lên 30+ service types
- [ ] 3 existing service types (labor_contract, agency_contract, trademark_registration) backward compatible
- [ ] `LegalDomainSelector` component render 13 domain cards trong grid responsive (3/2/1 columns)
- [ ] `ServiceTypeList` component render filtered service types theo domain đã chọn
- [ ] User có thể back từ service selection về domain selection
- [ ] Wizard có 5 steps (Domain → Service → Questions → Upload → Review)
- [ ] Progress indicator hiển thị đúng 5 steps với step hiện tại highlighted
- [ ] Draft auto-save trước mỗi step transition
- [ ] "Lưu nháp" button visible ở steps 1-4
- [ ] Draft resume hoạt động khi load page với `?draftId=xxx`
- [ ] `POST /api/intake/draft/save` API hoạt động
- [ ] `GET /api/intake/draft/:id` API hoạt động
- [ ] Priority dropdown trong step 5 với 2 options (Normal default, Urgent)
- [ ] Priority badge hiển thị đúng (🟡 Normal, 🔴 Urgent)
- [ ] Contact info pre-fill từ `GET /api/users/me` trong step 5
- [ ] Contact fields editable
- [ ] Redirect về `/${locale}/cases` sau submit thành công
- [ ] Success message hiển thị 2s trước khi redirect
- [ ] "Xem hồ sơ của tôi" button visible ngay sau submit
- [ ] Review step hiển thị full summary (domain, service, answers, files, priority, contact)
- [ ] "Chỉnh sửa" button trong review step navigate về step tương ứng
- [ ] SummaryPanel đọc service name từ `SEED_MATTER_TYPES` dynamic
- [ ] ChecklistPanel hiển thị theo service type (nếu có checklist)
- [ ] 100% i18n coverage (VI/EN/ZH/JA) cho tất cả text mới
- [ ] Toast notifications cho network/API errors
- [ ] Inline validation cho form fields
- [ ] Unit tests ≥ 90% coverage
- [ ] E2E tests: full 5-step wizard flow
- [ ] E2E tests: draft save/resume
- [ ] E2E tests: file upload
- [ ] E2E tests: submit success + redirect
- [ ] **KHÔNG dùng Ant Design components**
- [ ] Mobile responsive (640px, 768px, 1024px breakpoints)
- [ ] Wizard load < 2s initial
- [ ] Step transition < 500ms

## Edge Coverage

**Coverage:** 14/14 applicable edges resolved · 0 unresolved

| Category | Requirement | Status | Resolution / Reason |
|----------|-------------|--------|---------------------|
| Empty domains | R1 | ✅ covered | Tất cả 13 domains có ít nhất 2 service types |
| Invalid draftId | R6 | ✅ covered | GET /api/intake/draft/:id trả 404, form start fresh |
| Draft save failure | R6 | ✅ covered | Toast error, user có thể retry, không block wizard |
| No user profile | R8 | ✅ covered | Contact fields empty với label "Cập nhật sau" |
| File upload 50MB+ | R5 | ✅ covered | Client-side validation trước khi upload, toast error |
| Network failure submit | R9 | ✅ covered | Auto-retry 3x, toast error, draft vẫn còn |
| Back navigation | R3 | ✅ covered | Browser back button giữ nguyên state (không lose data) |
| Rapid step clicks | R3 | ✅ covered | Disable next button khi API call in progress |
| Service type deprecated | R1 | ✅ covered | Filter out deprecated types trong UI, giữ trong catalog |
| Missing translation | R12 | ✅ covered | Fallback to Vietnamese nếu key missing |
| Concurrent draft saves | R6 | ✅ covered | Debounce save calls (500ms), chỉ save latest |
| Large file list | R5 | ✅ covered | Virtualized list nếu > 20 files (future optimization) |
| Priority change after submit | R7 | ✅ covered | Priority locked sau submit, muốn đổi phải create new request |
| Mobile touch targets | R2 | ✅ covered | Tất cả buttons/cards min 44px touch target |

## Prohibitions (must-NOT)

**Coverage:** 8/8 applicable prohibitions resolved · 0 unresolved

| Prohibition (must-NOT statement) | Requirement | Status | Verification / Reason |
|----------------------------------|-------------|--------|------------------------|
| MUST NOT hardcode service names in UI | R11 | resolved | verification: judgment - code review enforces dynamic lookup |
| MUST NOT skip draft save on step transition | R6 | resolved | verification: test - draft save called before every transition |
| MUST NOT use Ant Design components | All | resolved | verification: judgment - custom Tailwind only |
| MUST NOT redirect to dashboard after submit | R9 | resolved | verification: test - redirect to /cases |
| MUST NOT show flat service list (> 5 items) | R2 | resolved | verification: judgment - 2-layer selection enforced |
| MUST NOT block wizard on draft save failure | R6 | resolved | verification: test - toast error, continue wizard |
| MUST NOT pre-fill contact info without user consent | R8 | resolved | verification: judgment - fields editable, user can override |
| MUST NOT allow submit without required answers | R4 | resolved | verification: test - validation blocks submit |

## Ambiguity Report

| Dimension          | Score | Min  | Status | Notes                              |
|--------------------|-------|------|--------|------------------------------------|
| Goal Clarity       | 0.95  | 0.75 | ✓      | 5-step wizard với domain taxonomy |
| Boundary Clarity   | 0.92  | 0.70 | ✓      | Explicit out-of-scope list         |
| Constraint Clarity | 0.93  | 0.65 | ✓      | All constraints resolved           |
| Acceptance Criteria| 0.94  | 0.70 | ✓      | 39 pass/fail criteria              |
| **Ambiguity**      | 0.15  | ≤0.20| ✅      | All edges and prohibitions resolved|

Status: ✓ = met minimum, ⚠ = below minimum (planner treats as assumption)

## Interview Log

| Round | Perspective    | Question summary         | Decision locked                    |
|-------|----------------|-------------------------|------------------------------------|
| 1     | Researcher     | API approach cho Phase 75? | Hardcode catalog hiện tại, API integration ở phase sau |
| 1     | Researcher     | Missing features cần bổ sung? | Draft save, priority selection, contact pre-fill, redirect My Cases |
| 1     | Researcher     | Draft save strategy? | Explicit "Lưu nháp" button + auto-save trước step transitions |
| 2     | Simplifier     | Redirect strategy sau submit? | Redirect về /cases sau 2s success message |
| 2     | Simplifier     | Priority placement? | Dropdown trong step 5 (Review), default Normal |
| 2     | Simplifier     | Contact info display? | Read-only từ profile, editable nếu cần, section trong step 5 |
| 2     | Simplifier     | Draft view behavior? | Resume với query param ?draftId=xxx, pre-fill form |
| 3     | Failure Analyst | Out-of-scope items? | AI recommendation, multi-lang questions, real-time collab, OCR, payment, e-sign |
| 3     | Failure Analyst | Edge cases? | Empty domains, invalid draftId, upload >50MB, concurrent saves |
| 4     | Boundary Keeper | Domain taxonomy scope? | Phase 75 implement 2-layer selection với 13 domains + 30+ service types |
| 4     | Boundary Keeper | Backward compatibility? | 3 existing service types giữ nguyên, mở rộng thêm |
| 4     | Boundary Keeper | Wizard steps count? | 5 steps (Domain → Service → Questions → Upload → Review) |

## Key Decisions Summary

1. **2-Layer Service Selection**: Legal Domain (13 domains, grid) → Service Type (30+ types, list)
2. **5-Step Wizard**: Domain → Service → Questions → Upload → Review
3. **Draft Persistence**: Auto-save trước transitions + explicit "Lưu nháp" button
4. **Priority**: Normal (default) / Urgent, chọn trong step 5
5. **Contact Pre-fill**: Từ user profile, editable
6. **Redirect**: Về /cases sau submit, không phải /dashboard
7. **No AI Features**: User tự chọn service, không auto-recommend
8. **No Ant Design**: Custom Tailwind CSS only
9. **Backward Compatible**: 3 existing service types giữ nguyên
10. **i18n 100%**: Tất cả text mới translated VI/EN/ZH/JA

---

*Phase: 75-create-request*
*Spec created: 2026-06-20*
*Next step: /gsd-discuss-phase 75 — implementation decisions (file structure, naming conventions, specific patterns)*
