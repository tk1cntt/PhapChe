# Phase 76: Create Request - Context

**Gathered:** 2026-06-20
**Status:** Ready for planning
**Mode:** --auto (all decisions auto-selected)

<domain>
## Phase Boundary

Create Request wizard 5 bước với 2-layer service selection (Legal Domain → Service Type), dynamic intake questions, document upload, draft persistence, priority selection, contact info pre-fill, và redirect đến My Cases sau submit thành công.

</domain>

<spec_lock>
## Requirements (locked via SPEC.md)

**14 requirements are locked.** See `76-SPEC.md` for full requirements, boundaries, and acceptance criteria.

Downstream agents MUST read `76-SPEC.md` before planning or implementing. Requirements are not duplicated here.

**In scope (from SPEC.md):**
- Legal domain taxonomy (13 domains) + service type expansion (30+)
- 2-layer service selection UI (Domain grid → Service list)
- 5-step wizard flow (Domain → Service → Questions → Upload → Review)
- Draft persistence (save/resume)
- Priority selection (normal/urgent)
- Contact info pre-fill từ user profile
- Redirect to My Cases
- Review step summary comprehensive
- Side panels update
- i18n 100% coverage
- Error handling consistent
- Unit + E2E tests ≥ 90%

**Out of scope (from SPEC.md):**
- AI-powered service recommendation
- Multi-language questions (questions chỉ bằng tiếng Việt)
- Real-time collaboration
- Advanced document preview
- Payment integration
- E-signature
- OCR/Document parsing
- Workflow automation (no auto-assign after submit)
- External plugin integration (domain "external-plugins" chỉ placeholder)

</spec_lock>

<decisions>
## Implementation Decisions

### Wizard State Management
- **D-01:** Dùng React Context + useReducer cho wizard state (không dùng react-hook-form). State phức tạp 5 bước cần centralized, Context + useReducer là pattern native React, không cần thêm dependency.
- **D-02:** WizardState type gồm: step, domainId, serviceType, answers (Record<string,string>), files, priority, contactInfo, draftId. Actions: SET_STEP, SET_DOMAIN, SET_SERVICE, SET_ANSWERS, ADD_FILE, REMOVE_FILE, SET_PRIORITY, SET_CONTACT, SET_DRAFT_ID.

### Draft Persistence
- **D-03:** Auto-save chỉ trước step transition (4 lần save: step 1→2, 2→3, 3→4, 4→5). Không debounce on change, không timeout. Giảm API calls, đơn giản implementation.
- **D-04:** Draft resume qua query param `?draftId=xxx`. Load page với draftId → show banner "Tiếp tục từ lần trước" + button "Xóa và bắt đầu mới".

### Service Type Data
- **D-05:** Single file `src/lib/i18n/seed-legal-domains.ts` chứa SEED_LEGAL_DOMAINS (13 domains) + mở rộng SEED_MATTER_TYPES (30+ types). Questions lazy-loaded khi service type selected (dynamic import).
- **D-06:** Constraint: file < 500 lines. Domain objects chứa label multilingual, icon name, matterTypeKeys. Matter types chứa label, questions (lazy), checklist (optional).

### File Upload
- **D-07:** Upload ngay khi user chọn file (immediate upload), không queue. Draft tạo trước nếu chưa có draftId. Dùng existing API `POST /api/intake/attach-file`. User có thể remove/re-upload trước submit.

### Review Step Edit
- **D-08:** "Chỉnh sửa" button navigate back to target step, preserve all state. User edit xong click "Next" → back to step 5 (Review). State giữ nguyên trong Context.

### Domain Icons
- **D-09:** Dùng Lucide React icons (đã install). Map domain key → icon name: commercial-legal→briefcase, corporate-legal→building, employment-legal→users, privacy-legal→shield, product-legal→package, regulatory-legal→file-check, ai-governance-legal→bot, ip-legal→lightbulb, litigation-legal→scale, legal-clinic→heart-handshake, law-student→graduation-cap, legal-builder-hub→wrench, external-plugins→plug.

### Success Message & Redirect
- **D-10:** Show success message 2s, button "Xem hồ sơ của tôi" visible ngay. Auto-redirect sau 2s về `/${locale}/cases`. User có thể click button để redirect sớm.

### Mobile Progress
- **D-11:** Compact progress bar với current step name. Desktop: hiện tất cả 5 step names. Mobile: progress bar % + current step label only.

### Form Validation
- **D-12:** Validate on blur + on submit (pattern từ Phase 74). Không real-time validation (noisy). Submit-only quá trễ. Blur cho immediate feedback, submit cho final check.

### Draft Resume UX
- **D-13:** Banner "Tiếp tục từ lần trước" khi resume draft (không phải toast, không silent). Banner có button "Xóa và bắt đầu mới" → clear draft, start fresh wizard.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Spec & Requirements
- `.planning/phases/76-create-request/76-SPEC.md` — Locked requirements (14 requirements, acceptance criteria, edge coverage, prohibitions)
- `.planning/phases/73-shared-foundation/73-SPEC.md` — Constraint: no Ant Design, custom Tailwind only

### Prior Phase Context
- `.planning/phases/74-sign-in/74-CONTEXT.md` — Validation pattern (on blur + on submit), useLocale() for redirects
- `.planning/phases/73-shared-foundation/73-CONTEXT.md` — Toast strategy (react-hot-toast), shared components, API client patterns

### Architecture & Standards
- `src/docs/API_STANDARDS.md` — API conventions, response envelope patterns
- `src/docs/CODE_STANDARDS.md` — Naming conventions, coding patterns
- `src/docs/I18N_RULES.md` — i18n patterns, translation key structure
- `src/docs/FORM_DEFINITION.md` — Dynamic form schema pattern
- `src/docs/SERVICE_LAYER.md` — Service layer boundaries
- `src/docs/WORKFLOW_DEFINITION.md` — Workflow state machine (request status)

### Existing Code
- `src/components/ui/button.tsx` — shadcn/ui button pattern (Radix + CVA)
- `src/components/ui/input.tsx` — Custom Input component (created in Phase 74)
- `src/components/shared/` — ErrorBoundary, LoadingSkeleton, EmptyState
- `src/hooks/useAuth.ts` — useAuth hook (session access)
- `src/lib/auth-client.ts` — Better Auth client
- `src/lib/api/client.ts` — API client (auto-retry, 401 redirect)
- `src/lib/i18n/seed-multilingual.ts` — Current SEED_MATTER_TYPES (4 types, extend to 30+)
- `src/app/api/intake/` — Existing intake API routes (submit, attach-file)
- `src/lib/intake/catalog.ts` — Matter type catalog (getMatterType, getMatterQuestions)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/button.tsx` — shadcn/ui button pattern, reuse cho wizard buttons (Back, Next, Submit, Save Draft)
- `src/components/ui/input.tsx` — Custom Input component (Phase 74), reuse cho contact info fields, answer inputs
- `src/components/shared/LoadingSkeleton.tsx` — Loading skeleton cho wizard steps khi fetch data
- `src/components/shared/EmptyState.tsx` — Empty state khi no domains/services available
- `src/hooks/useAuth.ts` — Auth state access cho contact info pre-fill
- `src/lib/api/client.ts` — API client với auto-retry cho draft save, file upload, submit
- `src/lib/i18n/seed-multilingual.ts` — Current SEED_MATTER_TYPES structure to extend
- `src/lib/intake/catalog.ts` — getMatterType, getMatterQuestions functions to extend
- Lucide React — Icon library cho 13 domain cards

### Established Patterns
- **React Context + useReducer**: Centralized state management (native React, no external lib)
- **shadcn/ui + CVA**: Component styling pattern (Radix primitives + class-variance-authority)
- **react-hot-toast**: Toast notifications for errors/success
- **useLocale() + useRouter()**: Locale-aware navigation (Phase 74 pattern)
- **Controlled inputs + inline validation**: Phase 74 validation pattern (on blur + on submit)
- **Array-based query keys**: `['entity', { filters }]` (Phase 73 pattern)
- **Auto-retry 3x with exponential backoff**: API client error handling (Phase 73)
- **401 → redirect to /login**: Automatic auth redirect (Phase 73)

### Integration Points
- `src/app/[locale]/create/page.tsx` — Current create request page (enhance with 5-step wizard)
- `src/app/api/intake/submit/route.ts` — Existing submit API (extend with priority, contactInfo)
- `src/app/api/intake/attach-file/route.ts` — Existing file upload API
- `src/app/[locale]/cases/page.tsx` — Redirect target after submit (My Cases)
- `src/lib/types/request.ts` — Request types (add priority field if missing)
- `src/messages/{vi,en,zh,ja}.json` — i18n translations (add wizard keys)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 76-create-request*
*Context gathered: 2026-06-20*
