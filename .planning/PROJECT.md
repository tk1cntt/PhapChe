# Legal-as-a-Service Platform

## Current Milestone: v2.2 Legacy UI Enhancement

**Goal:** Hoàn thiện backend integration cho 12 phases (73-84) đã có UI từ v2.0, biến mock UI thành production-ready với đầy đủ business logic, workflow, permissions và data model.

**Critical Constraint:** Tuân thủ nghiêm ngặt 9 tài liệu trong `src/docs/` (DOMAIN_STRUCTURE, API_STANDARDS, API_REGISTRY, SERVICE_LAYER, CODE_STANDARDS, I18N_RULES, FORM_DEFINITION, WORKFLOW_DEFINITION, TEMPLATE_ENGINE).

**Methodology:** Specification-first — mỗi phase phải qua System Discovery → UI Analysis → Gap Analysis → Target System Design → API Design → Frontend Architecture → Implementation Plan → Implementation.

**Target features:**
- User Settings: Profile, password, notifications, language preferences
- User Management (Admin): CRUD with organization context
- Create Request Wizard: 4-step form with service type, intake questions, document upload
- My Cases: Case list, search, filter, pagination
- User Dashboard: Real data with 6 panels
- Request Management (Admin): Assign specialist, change status, view details
- Admin Dashboard: Stats, workload, alerts, audit timeline
- Operations (Admin): Workload monitoring, SLA tracking
- Messages: Thread list, chat, info panel
- Audit (Admin): Security logs, search, filter, pagination
- Workspace Management (Admin): CRUD, member invites, role changes
- Vault (Admin): File management, folders, tags, upload/download

---

## Current State (v2.1 SHIPPED — 2026-06-19)

**GitNexus Legal** đã hoàn thành milestone v2.1 với:
- Multi-tenant architecture (Tenant → Organization → Workspace → Partner)
- 19 phases shipped (55-72, 85), 359 commits, +114K LOC
- Partner portal (auth, dashboard, request management, member management)
- Database schema improvements (4-wave migration)

**Total to date:** v1.0 + v1.1 + v2.0 + v2.1 = 48 phases, ~112 plans, 340+ tasks

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

### Active (v2.2 Legacy UI Enhancement)

**User-facing:**
- [ ] **SET-01 to SET-06**: User Settings (profile, password, notifications, language, audit log)
- [ ] **CREQ-01 to CREQ-10**: Create Request Wizard (4-step form, service types, document upload)
- [ ] **MYCASE-01 to MYCASE-09**: My Cases (list, search, filter, pagination)
- [ ] **U-DASH-01 to U-DASH-08**: User Dashboard (real data, 6 panels, clickable stats)
- [ ] **MSG-01 to MSG-08**: Messages (3-column layout, thread list, chat, info panel)

**Admin-facing:**
- [ ] **ADM-USER-01 to ADM-USER-09**: User Management (CRUD, search, filter, org context)
- [ ] **ADM-REQ-01 to ADM-REQ-09**: Request Management (assign, status change, filters)
- [ ] **ADM-DASH-01 to ADM-DASH-08**: Admin Dashboard (stats, workload, alerts, audit)
- [ ] **ADM-OPS-01 to ADM-OPS-07**: Operations (workload, SLA bars, audit timeline)
- [ ] **ADM-AUD-01 to ADM-AUD-10**: Audit (security logs, search, filter, pagination)
- [ ] **ADM-WS-01 to ADM-WS-08**: Workspace Management (CRUD, invites, role changes)
- [ ] **VAULT-01 to VAULT-12**: Vault (file management, folders, tags, signed URLs)

**Architecture (deferred from v2.1):**
- [ ] **ARCH-01 to ARCH-09**: Type safety, error handling, performance optimization

### Future (v2.3 AI Features)

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
| Multi-tenant architecture v2.1 | Separate Tenant → Organization → Workspace → Partner hierarchy | ✅ Good |
| Specification-first approach for v2.2 | Tuân thủ nghiêm ngặt 9 tài liệu trong src/docs/ để AI agent hiểu đúng business logic | — Pending |

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
