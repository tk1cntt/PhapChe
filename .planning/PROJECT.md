# Legal-as-a-Service Platform

## Current State (v2.0 SHIPPED — 2026-06-14)

**GitNexus Legal** đã hoàn thành milestone v2.0 với:
- Admin Portal kết nối Prisma database (Audit, Vault, Workspace, Operations, Users, Requests)
- User Dashboard với real data từ database
- i18n comprehensive: 43 components, 200+ keys, 4 languages
- Cookie-based language persistence

**Total to date:** v1.0 + v1.1 + v2.0 = 29 phases, 92 plans, 240+ tasks

**Tech stack:** Next.js 14 (App Router), TypeScript, Prisma + SQLite, Ant Design 6, Tailwind CSS, Better Auth, next-intl

---

## What This Is

Hệ thống quản trị pháp lý thông minh cho SME, dùng giao diện hội thoại để tiếp nhận yêu cầu pháp lý, chuẩn hóa thông tin đầu vào, điều phối chuyên viên xử lý, kiểm soát chất lượng bởi reviewer, giao tài liệu cuối cùng cho khách hàng và lưu hồ sơ trong Legal Vault.

Sản phẩm không phải "AI lawyer" tự tư vấn luật thay con người. Giá trị chính là biến dịch vụ pháp lý thuê ngoài thành quy trình số có trạng thái, checklist, phân quyền, tài liệu, audit trail và chất lượng đầu ra nhất quán.

---

## Core Value

SME gửi yêu cầu pháp lý theo cách đơn giản như nhắn tin và nhận tài liệu/tư vấn đã qua kiểm soát chất lượng, có thể truy vết toàn bộ quá trình xử lý.

---

## Requirements

### Validated

**v1.0 MVP:**
- ✅ Foundation — RBAC, audit, workspace isolation, workflow state machine
- ✅ Intake — Vietnamese chat/form intake, structured answers, file upload, status page
- ✅ Routing — Capability matrix, coordinator assignment, specialist/reviewer queues
- ✅ Documents — Versioned templates, draft generation, submit-for-review
- ✅ Vault — Private file storage, versioning, permissioned access, audit trail
- ✅ Review — Split-view reviewer portal, QC checklist, approve/reject with comments
- ✅ Delivery — Customer delivery page, signed URL downloads, request close
- ✅ Operations — Dashboard, filters, workload, SLA, audit timeline
- ✅ Folder/Tag — Internal file classification for vault organization
- ✅ Ant Design UI — Complete migration to antd across all route groups

**v1.1 Auth & i18n:**
- ✅ Better Auth — Password hashing, session management, protected routes
- ✅ i18n — 4 languages (VI/EN/ZH/JA), middleware routing, LanguageSwitcher
- ✅ E2E Tests — 75 Playwright tests covering auth, intake, specialist, reviewer, admin screens

**v2.0 Admin Portal + User Dashboard:**
- ✅ Admin Audit Real Data — Stats, timeline, paginated table with correlation IDs
- ✅ Admin Vault Real Data — Files/folders/tags, signed URLs for secure access
- ✅ Admin Workspace Real Data — Permissions, members, invite functionality
- ✅ Admin User Management Real Data — CRUD operations, search/filter/paging
- ✅ Admin Request Management Real Data — Status badges, SLA bars, toolbar filters
- ✅ Admin Operations Real Data — Workload panel, operations table, audit timeline
- ✅ User Dashboard Real Data — 6 panels with real Prisma queries
- ✅ i18n Comprehensive — 43 components, 200+ keys, cookie-based persistence

### Active (v2.1 Architecture Refactor)

**Phase 1: Type Safety**
- [ ] **ARCH-01**: Remove `as any` casts throughout codebase
- [ ] **ARCH-02**: Proper TypeScript interfaces for all components
- [ ] **ARCH-03**: Type-safe Prisma queries

**Phase 2: Error Handling**
- [ ] **ARCH-04**: Error boundaries on all pages
- [ ] **ARCH-05**: Consistent API error responses
- [ ] **ARCH-06**: Loading states and skeletons

**Phase 3: Performance**
- [ ] **ARCH-07**: API response caching
- [ ] **ARCH-08**: Lazy loading for heavy components
- [ ] **ARCH-09**: Database query optimization

### Future (v2.2 AI Features)

- [ ] **AI-01**: AI Intake Assistant — chatbot-style guidance
- [ ] **AI-02**: Document Analysis (OCR) — auto-extract from uploads
- [ ] **AI-03**: Risk Flagging — AI suggestions before review
- [ ] **AI-04**: Smart Routing — ML-based specialist matching

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| AI tự kết luận pháp lý | Rủi ro sai luật và liability cao; AI chỉ hỗ trợ intake/draft/tóm tắt khi có guardrails. |
| Open lawyer marketplace | Khó kiểm soát chất lượng; MVP dùng pool specialist/reviewer nội bộ. |
| Workflow builder tùy biến | Overbuild; MVP dùng state machine cố định theo request. |

---

## Context

### Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: Prisma + SQLite (dev), PostgreSQL (prod)
- **UI**: Ant Design 6, Tailwind CSS
- **Auth**: Better Auth with password hashing, session management
- **i18n**: next-intl with 4 languages (VI, EN, ZH, JA)
- **Testing**: Vitest (unit), Playwright (E2E)

### Database Schema

Key entities:
- **User**: id, email, name, role, workspaceId
- **Workspace**: id, name, slug, settings
- **LegalRequest**: id, workspaceId, status, type, assignee, slaDeadline
- **AuditEvent**: id, actorId, action, targetType, targetId, metadata
- **VaultFile**: id, workspaceId, folderId, name, encryptedUrl, version
- **Message**: id, threadId, senderId, content, timestamp

### i18n Coverage

| Namespace | Keys | Status |
|-----------|------|--------|
| Dashboard | 25 | ✅ Complete |
| AdminDashboard | 30 | ✅ Complete |
| AdminOps | 45 | ✅ Complete |
| AuditEvents | 30 | ✅ Complete |
| Vault | 35 | ✅ Complete |
| UserMessages | 20 | ✅ Complete |
| UserCases | 15 | ✅ Complete |
| Intake | 40 | ✅ Complete |
| Auth | 25 | ✅ Complete |
| Common | 15 | ✅ Complete |

---

## Constraints

- **Legal accuracy**: Nội dung/tài liệu pháp lý phải qua reviewer trước khi final — giảm rủi ro tư vấn sai.
- **Security**: Hồ sơ pháp lý doanh nghiệp nhạy cảm — file phải private, phân quyền theo tenant/request, signed URL ngắn hạn, audit đầy đủ.
- **MVP scope**: Ưu tiên workflow end-to-end hơn OCR/e-sign/AI nâng cao — chứng minh vận hành trước khi automation.
- **Template governance**: Template phải versioned, có trạng thái approved/published/deprecated — tránh dùng nhầm mẫu cũ.
- **Workflow integrity**: Status thay đổi qua backend state machine — không hard-code logic ở frontend.
- **Traceability**: Review phải gắn với document version cụ thể — tránh duyệt bản này nhưng gửi bản khác.

---

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| MVP là legal operations cockpit, không phải AI lawyer | Giảm rủi ro pháp lý, tập trung core value xử lý request có QC | ✅ Good |
| Intake dùng chat/form hybrid nhưng output phải structured | Raw chat khó route, khó review, khó generate document | ✅ Good |
| Reviewer QC bắt buộc trước delivery/final | Chất lượng pháp lý là niềm tin cốt lõi | ✅ Good |
| Capability Matrix rule-based trước, auto-routing sau | Tránh overbuild khi chưa có dữ liệu vận hành | ✅ Good |
| Legal Vault versioned + audit từ đầu | Hồ sơ pháp lý cần truy vết và phân quyền | ✅ Good |
| OCR/e-sign/compliance calendar nâng cao để v2 | Không chặn end-to-end MVP | ✅ Good |
| Stack: modular monolith Next.js + PostgreSQL/Prisma + S3/R2 | Nhanh cho MVP, ít infra, vẫn đủ mở rộng | ✅ Good |
| Gap-closure phases (08-14) sau milestone audit | Fix broken flows và design gaps trước khi ship | ✅ Good |
| Ant Design UI cho phase 14 | Component library chuẩn, giảm maintenance UI custom | ✅ Good |
| Better Auth cho v1.1 | Password hashing, session management, protected routes | ✅ Good |
| i18n với next-intl | Locale routing, middleware, LanguageSwitcher | ✅ Good |
| SQLite cho dev | Simplify local development, avoid Docker | ✅ Good |
| Mock UI Pattern cho v2.0 | UI đẹp đã có, chỉ cần connect backend | ✅ Good |
| Cookie-based locale persistence | No flash on navigation, server-side redirect | ✅ Good |
| Parallel Prisma queries for dashboard | Optimize performance with Promise.all() | ✅ Good |

---

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state (users, feedback, metrics)

---

*Last updated: 2026-06-14 after v2.0 milestone completion*
