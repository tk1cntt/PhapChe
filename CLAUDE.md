# GitNexus — Code Intelligence

Mọi trao đổi phải dùng tiếng Việt.

Cấm sử dụng lệnh taskkill //F //IM node.exe.

**KHÔNG sử dụng Ant Design components** — tất cả shared components dùng custom Tailwind CSS. Ant Design sẽ được replace nếu đang được dùng.

Mỗi tính năng UI cần phải có whitebox testcase, blackbox testcase, abnormal testcase, error testcase kèm theo. Fix bất kỳ một lỗi nào đều phải có e2e testcase đi kèm. Coverage phải tối thiểu 90%.

Tên slug của từng phase hay quick phải là tiếng anh và ngắn gọn.

Đọc .planning\phases\73-shared-foundation\73-SPEC.md để nắm được spec đã chốt trước khi tự quyết định làm gì đó.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

<!-- GSD:project-start source:PROJECT.md -->
## Project

**Legal-as-a-Service Platform**

Hệ thống quản trị pháp lý thông minh cho SME, dùng giao diện hội thoại để tiếp nhận yêu cầu pháp lý, chuẩn hóa thông tin đầu vào, điều phối chuyên viên xử lý, kiểm soát chất lượng bởi reviewer, giao tài liệu cuối cùng cho khách hàng và lưu hồ sơ trong Legal Vault.

Sản phẩm không phải “AI lawyer” tự tư vấn luật thay con người. Giá trị chính là biến dịch vụ pháp lý thuê ngoài thành quy trình số có trạng thái, checklist, phân quyền, tài liệu, audit trail và chất lượng đầu ra nhất quán.

**Core Value:** SME gửi yêu cầu pháp lý theo cách đơn giản như nhắn tin và nhận tài liệu/tư vấn đã qua kiểm soát chất lượng, có thể truy vết toàn bộ quá trình xử lý.

### Constraints

- **Legal accuracy**: Nội dung/tài liệu pháp lý phải qua reviewer trước khi final — giảm rủi ro tư vấn sai.
- **Security**: Hồ sơ pháp lý doanh nghiệp nhạy cảm — file phải private, phân quyền theo tenant/request, signed URL ngắn hạn, audit đầy đủ.
- **MVP scope**: Ưu tiên workflow end-to-end hơn OCR/e-sign/AI nâng cao — chứng minh vận hành trước khi automation.
- **Template governance**: Template phải versioned, có trạng thái approved/published/deprecated — tránh dùng nhầm mẫu cũ.
- **Workflow integrity**: Status thay đổi qua backend state machine — không hard-code logic ở frontend.
- **Traceability**: Review phải gắn với document version cụ thể — tránh duyệt bản này nhưng gửi bản khác.
<!-- GSD:project-end -->

---

## Architecture Standards Summary

**Comprehensive architecture foundation with 9 documentation files, 8 TypeScript type modules, Component Registry, Central API Client, Swagger, ESLint rules, and Storybook**

## Accomplishments

- Created comprehensive architecture documentation suite covering domain structure, form/workflow/template patterns, API standards, service layer, code standards, and i18n rules
- Established TypeScript type unification with 8 type modules (user, workspace, request, audit, workflow, vault, review) with barrel exports
- Built Component Registry documenting 30+ shared components across atoms, molecules, organisms, and templates
- Implemented unified StatCard with 5 color variants (blue, green, orange, purple, red) and 10 icon types
- Created Central API Client with modular exports for all domains (requests, users, workspaces, messages, vault, settings, admin, intake, workflows, templates)
- Configured Swagger/OpenAPI documentation at /api/swagger
- Added custom ESLint rule for component naming enforcement
- Setup Storybook with component stories for visual documentation

## Task Commits

Each task was committed atomically:

1. **Task 1: Architecture Documentation Suite** - `931de21` (docs)
2. **Task 2: TypeScript Type Unification** - `13e21bc` (feat)
3. **Task 3: Component Registry and Generator** - `0b5674a` (feat)
4. **Task 4: StatCard and Central API Client** - `d15a42a` (feat)
5. **Task 5: Swagger/OpenAPI Documentation** - `980d537` (feat)
6. **Task 6: ESLint Component Naming Rule** - `9c96307` (feat)
7. **Task 7: Storybook Setup** - `d183a33` (feat)

## Files Created/Modified

Phải đọc các tài liệu liên quan trước khi tạo mới.

### Documentation (src/docs/)
- `DOMAIN_STRUCTURE.md` - Folder organization and component granularity levels
- `FORM_DEFINITION.md` - Dynamic form schema pattern with database storage
- `WORKFLOW_DEFINITION.md` - Workflow state machine with role-based transitions
- `TEMPLATE_ENGINE.md` - Template rendering with {{variable}} syntax
- `API_STANDARDS.md` - API conventions and response envelope patterns
- `API_REGISTRY.md` - Centralized API endpoint documentation
- `SERVICE_LAYER.md` - Service layer boundaries and responsibilities
- `CODE_STANDARDS.md` - Naming conventions and coding patterns
- `I18N_RULES.md` - Internationalization patterns and decision matrix

### TypeScript Types (src/lib/types/)
- `index.ts` - Barrel export with constants re-export
- `user.ts` - User, UserProfile, Session, NotificationSettings
- `workspace.ts` - Workspace, Membership, WorkspaceSettings
- `request.ts` - LegalRequest, IntakeSubmission, filters, stats
- `audit.ts` - AuditLog, filters, summary, common actions
- `workflow.ts` - WorkflowDefinition, states, transitions
- `vault.ts` - VaultFile, VaultFolder, VaultTag, upload/download
- `review.ts` - Review, ReviewComment, Document, DocumentVersion

### Components
- `src/components/COMPONENT_REGISTRY.md` - 30+ component catalog
- `src/components/shared/ui/StatCard.tsx` - Unified metrics display

### API Layer
- `src/lib/api/index.ts` - Modular API exports
- `src/lib/api/client.ts` - Central API client
- `src/app/api/swagger/route.ts` - OpenAPI spec

### Code Quality
- `src/lib/rules/no-duplicate-component.js` - ESLint naming rule
- `.eslintrc.js` - ESLint configuration

### Scripts
- `scripts/generate-component-registry.mjs` - Auto-generate registry

### Storybook
- `.storybook/main.ts` - Storybook configuration
- `.storybook/preview.ts` - Preview configuration
- `src/stories/Button.stories.tsx` - Button stories
- `src/stories/Input.stories.tsx` - Input stories
- `src/stories/StatCard.stories.tsx` - StatCard stories

## Decisions Made

1. **Component Granularity**: Established 4-level component hierarchy (Atoms, Molecules, Organisms, Templates) for maximum reusability
2. **Type Unification**: Centralized type exports from src/lib/types/ with barrel index file
3. **API Client Pattern**: Singleton ApiClient with domain-specific export modules
4. **Documentation First**: Created comprehensive architecture docs before implementation
5. **Storybook for Visual Docs**: Component stories provide live documentation and visual testing

## Deviations from Plan

**None - plan executed exactly as written.**

All 7 tasks completed as specified:
- 9 architecture docs created
- 8 TypeScript type modules created
- Component Registry with generator script created
- StatCard with 5 variants implemented
- Central API Client with modular exports created
- Swagger/OpenAPI configured
- ESLint naming rule created
- Storybook with 3 component stories setup

## User Setup Required

**External services require manual configuration:**

1. **Storybook Dependencies**: Run `npm install` after creating .storybook files (packages are already in package.json)
2. **Verify Storybook**: Run `npm run storybook` to start Storybook at http://localhost:6006
3. **ESLint Rule**: The `no-duplicate-component` rule requires ESLint to be configured in your IDE