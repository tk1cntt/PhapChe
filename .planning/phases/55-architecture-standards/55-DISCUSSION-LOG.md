# Phase 55: Architecture & Standards — Discussion Log

**Phase:** 55
**Date:** 2026-06-14
**Updated:** 2026-06-14

## Discussion Summary

Architecture discussion for Phase 55 - Component Audit (Tiêu chí 1). This document captures all architectural decisions made during the discussion phase.

---

## Tiêu chí 1: Component Audit

### Mục tiêu
Lập danh sách toàn bộ components hiện có, phân loại reusable vs one-time, xác định duplicate và phát hiện violations.

### Hiện trạng phát hiện được

| Category | Files | Status |
|----------|-------|--------|
| Layout | `AdminLayout.tsx`, `UserLayout.tsx`, `Sidebar.tsx` | ✓ Tách riêng |
| UI Primitives | `src/components/ui/` (4 files) | Cần mở rộng |
| StatCard variants | `AdminStatCard.tsx`, `my-cases/StatCard.tsx` | ⚠️ DUPLICATE |
| Admin components | `AdminDashboardClient.tsx`, `AdminStatGrid.tsx`, `AdminOperationsStats.tsx`, `AdminRequestsClient.tsx` | Dashboard cluster |
| User components | `DashboardClient.tsx`, `MyCasesClient.tsx` | Dashboard cluster |
| Create Request | `CreateRequestWizard.tsx`, step components | Wizard pattern |
| Messages | `MessagesClient.tsx`, `ThreadList.tsx`, `ChatPanel.tsx` | 3-column layout |

### Issues phát hiện

```
□ Duplicate components (StatCard - 2 implementations)
□ Components chứa business logic (cần verify)
□ Hardcoded text trong JSX (cần audit chi tiết)
□ Hardcoded data/metadata trong components (cần audit chi tiết)
```

---

## Decision 1.1: Component Directory Structure

**Proposed:**
```
src/components/
├── ui/                      # SHARED - Reusable across ALL pages
│   ├── StatCard.tsx         # Metrics display
│   ├── Badge.tsx            # Status badges
│   ├── Button.tsx           # Primary/secondary/ghost
│   ├── Modal.tsx            # Confirm/alert/form modals
│   ├── Input.tsx            # Form inputs
│   ├── Select.tsx           # Dropdowns
│   ├── Table.tsx            # Data tables
│   ├── Paging.tsx           # Pagination
│   ├── Skeleton.tsx         # Loading states
│   └── ErrorFallback.tsx    # Error boundaries
│
├── layout/                  # SHARED - Layout structures
│   ├── AdminLayout.tsx
│   ├── UserLayout.tsx
│   └── Sidebar.tsx
│
├── admin/                   # PAGE-SPECIFIC - Admin portal
│   ├── dashboard/
│   ├── users/
│   └── requests/
│
└── user/                    # PAGE-SPECIFIC - User portal
    ├── dashboard/
    ├── my-cases/
    ├── create-request/
    └── messages/
```

**Status:** PENDING CONFIRMATION

---

## Decision 1.2: Duplicate StatCard Resolution

**Current State:**
- `src/components/admin/AdminStatCard.tsx` - dùng `title/value/description`, 4 variants (blue/green/orange/red)
- `src/components/my-cases/StatCard.tsx` - dùng `titleKey/value`, 5 icons

**Options:**
- Option A: Unify thành 1 component trong `ui/StatCard.tsx`
- Option B: Giữ 2 riêng

**Decision:** PENDING

---

## Decision 1.3: When to Extract to Shared

**Criteria:**
```
✓ Dùng từ 2 pages trở lên
✓ Có props interface rõ ràng
✓ Không chứa business logic
✓ Không hardcode domain-specific data
✓ Có thể test độc lập
```

**Threshold options:**
- Dùng từ 2 pages
- Dùng từ 3 pages
- Team decision

**Decision:** PENDING

---

## Decision 1.4: Component Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Page components | `[PageName]Client.tsx` | `DashboardClient.tsx` |
| Section components | `[SectionName].tsx` | `StatGrid.tsx` |
| Shared UI | `PascalCase.tsx` | `StatCard.tsx` |
| Layout | `[Type]Layout.tsx` | `AdminLayout.tsx` |

**Status:** PENDING CONFIRMATION

---

## Checklist cho Tiêu chí 1

```
□ Danh sách 87+ components đã được phân loại
□ Duplicate StatCard đã xử lý
□ Component Directory Structure đã áp dụng
□ Naming Convention đã được document
□ Shared vs Page-specific đã phân tách rõ ràng
□ Business Logic violations đã được ghi nhận
□ Hardcoded Text violations đã được ghi nhận
□ SPEC.md đã update với specific deliverables
```

---

## Earlier Decisions (Session 1)

### 1. StatCard Extraction Strategy

**Question:** Nên unify StatCard thành một component hay giữ riêng admin/user?

**Options presented:**
1. Unified component — Một StatCard duy nhất trong ui/, hỗ trợ 5 variants, prop i18n optional
2. Giữ 2 riêng — AdminStatCard cho admin pages, StatCard cho user pages

**Decision:** Unified component ✓

**Rationale:** Single component reduces duplication, supports all variants, optional i18n prop.

---

### 2. Type Unification Structure

**Question:** Tổ chức types theo entity hay theo layer?

**Options presented:**
1. By Entity — user.ts, workspace.ts, request.ts, audit.ts
2. By Layer — domain-types.ts, api-types.ts, ui-types.ts

**Decision:** By Entity ✓

**Rationale:** Aligns with Prisma schema structure, intuitive navigation.

---

### 3. Component Registry Format

**Question:** Markdown hay YAML/JSON format?

**Options presented:**
1. Markdown — Dễ đọc, tự động render trong GitHub
2. YAML/JSON — Machine-readable, generate docs tự động

**Decision:** Markdown ✓

**Rationale:** Simple, no build step, auto-renders in GitHub/GitLab.

---

### 4. API Response Format

**Question:** Envelope pattern hay flat response?

**Options presented:**
1. Envelope — {data, meta} với pagination metadata
2. Flat — Trả trực tiếp data, metadata qua headers

**Decision:** Envelope pattern ✓

**Rationale:** Consistent across endpoints, supports pagination, extensible for metadata.

---

## Deferred Ideas

- Tiêu chí 2: API Patterns - chưa discuss chi tiết
- Tiêu chí 3: Shared Components - chưa discuss chi tiết
- Tiêu chí 4: Service Layer - chưa discuss chi tiết
- Tiêu chí 5: Type Definitions - chưa discuss chi tiết
- Tiêu chí 6: Code Standards - chưa discuss chi tiết
- Tiêu chí 7: i18n Rules - chưa discuss chi tiết

---

## Notes

- Phase 55 là foundation phase - tạo standards trước khi implement features
- SPEC.md đã được update với specific deliverables
- Tiêu chí 1 (Component Audit) đang trong quá trình thảo luận
- Cần confirm decisions trước khi tiếp tục sang tiêu chí tiếp theo

---

*Discussion log updated: 2026-06-14*
*Phase: 55-architecture-standards*
