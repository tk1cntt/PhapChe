---
phase: "05"
slug: review
status: draft
shadcn_initialized: false
preset: none
created: 2026-05-30
---

# Phase 5 — UI Design Contract

> Visual and interaction contract for Phase 5: reviewer portal with split-view interface (draft left, QC checklist right).

---

## Design System

| Property | Value | Source |
|----------|-------|--------|
| Tool | none | Custom design system, no shadcn |
| Preset | not applicable | No shadcn preset |
| Component library | none | Custom Button, Badge, Card, Table, PageHeader in `src/app/admin/components/ui.tsx` |
| Icon library | none | No icon library configured |
| Font | system-ui stack | `src/app/globals.css` font-family: ui-sans-serif, system-ui |

---

## Spacing Scale

Declared values (from Tailwind defaults, multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, inline padding |
| sm | 8px | Compact element spacing, gap-2 |
| md | 16px | Default element spacing, gap-4 |
| lg | 24px | Section padding, gap-6 |
| xl | 32px | Layout gaps, gap-8 |
| 2xl | 48px | Major section breaks, gap-12 |
| 3xl | 64px | Page-level spacing |

Exceptions: none — standard 4px grid applies throughout.

---

## Typography

| Role | Size | Weight | Line Height | Source |
|------|------|--------|-------------|--------|
| Display | 30px | 600 (semibold) | 1.15 | PageHeader h1 (`text-[30px] font-semibold leading-[1.15]`) |
| Heading | 20px | 600 (semibold) | 1.2 | Tailwind default text-xl |
| Body | 16px | 400 (normal) | 1.5 | globals.css body (`text-[16px] font-normal leading-[1.6]`) |
| Label | 14px | 600 (semibold) | 1.4 | Button text (`text-[14px] font-semibold leading-[1.4]`) |
| Small | 13px | 600 (semibold) | 1.3 | Badge text (`text-[13px] font-semibold leading-[1.3]`) |
| Caption | 12px | 600 (semibold) | 1.4 | Table header (`text-[12px] font-semibold uppercase tracking-[0.08em]`) |

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Background (60%) | `#F8FAFC` | Page background, `--background` CSS variable |
| Surface (30%) | `#FFFFFF` | Cards, panels, sidebar — `--surface` CSS variable |
| Accent (10%) | `#0F766E` | Primary buttons, links, focus rings, selection highlight, active states |
| Text primary | `#0F172A` | Headlines, primary content — `--text-primary` |
| Text secondary | `#475569` | Descriptions, metadata — `--text-secondary` |
| Border | `#E2E8F0` | Card borders, dividers — `--border` |
| Muted | `#F1F5F9` | Table headers, disabled backgrounds — `--muted` |
| Destructive | `#DC2626` | Reject buttons, error states — `--destructive` |

Accent reserved for:
- Primary button backgrounds (`bg-[#0F766E]`)
- Primary button hover states (`hover:bg-teal-800`)
- Focus ring outlines (`focus:ring-[#0F766E]`)
- Selection background (`rgba(15, 118, 110, 0.18)`)
- Badge: accent tone (`bg-teal-50 text-[#0F766E]`)
- Page gradient overlay (`rgba(15, 118, 110, 0.08)`)

Destructive reserved for:
- Destructive button background (`bg-[#DC2626]`)
- Reject action button
- Error state text (`text-[#B91C1C]`)

---

## Component Inventory

### Reviewer Portal Pages

#### Reviewer Queue Page (`/reviewer/requests`)

| Component | Variant | States | Details |
|-----------|---------|--------|---------|
| PageHeader | with action | default | Title: "Danh sách yêu cầu", description: "Các tài liệu chờ bạn kiểm tra" |
| Table | default | loading, empty, populated | Headers: STT, Tiêu đề, Loại, Chuyên viên, Ngày nộp, Trạng thái |
| Badge | info/neutral | pending, in_review | `bg-blue-50 text-[#1D4ED8]` for pending |
| Button | primary | default, loading, disabled | "Xem chi tiết" — navigate to review detail |

#### Review Detail Page (`/reviewer/requests/[requestId]/review/[documentVersionId]`)

| Component | Variant | States | Details |
|-----------|---------|--------|---------|
| SplitView | 50/50 horizontal | default, mobile (stacked) | Left: document preview. Right: QC checklist panel. |
| DocumentPreview | default | loading, loaded, error | Show document content from vault file |
| ChecklistPanel | default | incomplete, complete | Header with review progress indicator |
| ChecklistGroup | formal/legal_content/operational | collapsed, expanded | Group by QC-LEG-01 category |
| ChecklistItem | required/optional | unchecked, passed, failed | Pass/fail toggle + optional comment field |
| ChecklistItemComment | conditional | hidden, visible | Shows when item is failed |
| Button | primary | default, disabled | "Phê duyệt" — enabled when all required items passed |
| Button | destructive | default | "Yêu cầu sửa đổi" — always enabled, triggers revision flow |
| Alert | destructive | default | Warning when submitting revision with no failed items |

### Specialist Workbench (Revision Feedback)

| Component | Variant | States | Details |
|-----------|---------|--------|---------|
| Alert | destructive | default | "Tài liệu cần sửa đổi" banner at top of workbench |
| ChecklistFeedback | default | default | Shows failed items, per-item comments, general comment |
| Badge | destructive | default | Red badge on failed checklist items |
| Button | secondary | default | "Tạo bản mới" — generate corrected draft |

---

## Split View Layout

| Property | Value |
|----------|-------|
| Desktop layout | Two equal columns (50% / 50%), horizontal split |
| Left panel min-width | 400px |
| Right panel min-width | 400px |
| Panel border | `border border-[#E2E8F0]` |
| Panel background | white (`--surface`) |
| Panel padding | 24px (`p-6`) |
| Gap between panels | 24px (`gap-6`) |
| Scroll behavior | Each panel scrolls independently |
| Mobile breakpoint | Below 768px: stacked vertically (document top, checklist bottom) |

---

## Checklist UI

### Groups (QC-LEG-01 derived)

| Group | Order | Items | Visual |
|-------|-------|-------|--------|
| Formal Requirements | 1 | Template match, spelling/presentation, entity info match | Collapsed by default |
| Legal Content | 2 | Legal basis, rights/obligations, risk clauses, customer pain fit | Collapsed by default |
| Operational & Signing | 3 | Signature area, confidentiality classification | Collapsed by default |

### Checklist Item Row

| Element | Spec |
|---------|------|
| Checkbox/toggle | Custom toggle, green (`bg-[#0F766E]`) when passed, gray when unchecked |
| Label | Vietnamese text, `text-[16px] font-normal` |
| Required badge | `text-[11px] font-semibold uppercase text-[#DC2626]` — "Bắt buộc" |
| Comment toggle | "Thêm ghi chú" link — expands comment textarea on click |
| Comment textarea | `border border-[#E2E8F0] rounded-xl p-3 text-[14px]` — shown only when item is failed |
| Pass/Fail indicators | Checkmark icon (teal) for passed, X icon (red) for failed |

### Validation

| State | UI Behavior |
|-------|-------------|
| Required item unchecked | "Phê duyệt" button disabled |
| Required item failed | "Phê duyệt" button disabled |
| All required items passed | "Phê duyệt" button enabled |
| Any item failed | "Yêu cầu sửa đổi" button enabled |
| Revision with no failed items | Warning alert: "Vui lòng đánh dấu ít nhất một mục không đạt" |

---

## Copywriting Contract

| Element | Vietnamese Copy |
|---------|-----------------|
| Page title (queue) | Yêu cầu kiểm tra |
| Page description (queue) | Các tài liệu chờ bạn kiểm tra |
| Empty state heading | Không có tài liệu chờ kiểm tra |
| Empty state body | Tất cả tài liệu đã được xử lý. Quay lại khi có yêu cầu mới. |
| CTA primary (approve) | Phê duyệt |
| CTA secondary (reject) | Yêu cầu sửa đổi |
| Confirmation (approve) | "Bạn chắc chắn muốn phê duyệt tài liệu này?" |
| Confirmation (reject) | "Bạn chắc chắn muốn yêu cầu sửa đổi?" |
| Validation error (incomplete) | Vui lòng hoàn thành tất cả mục bắt buộc |
| Validation warning (revision no items) | Vui lòng đánh dấu ít nhất một mục không đạt |
| Group header: Formal | Yêu cầu hình thức |
| Group header: Legal | Nội dung pháp lý |
| Group header: Operational | Thủ tục và ký nháy |
| Comment placeholder | Nhập ghi chú cho mục này... |
| General comment label | Ghi chú chung |
| General comment placeholder | Nhập ghi chú tổng quan (tùy chọn)... |

---

## Responsive Behavior

| Breakpoint | Layout |
|------------|--------|
| < 768px | Split view stacks vertically: document preview on top, checklist below |
| 768px – 1024px | Split view maintains horizontal but narrower panels |
| > 1024px | Full horizontal split, 50/50 |

Mobile checklist: Full-width card below document preview. Checklist groups expand automatically on load (no collapse on mobile).

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PENDING
- [ ] Dimension 2 Visuals: PENDING
- [ ] Dimension 3 Color: PENDING
- [ ] Dimension 4 Typography: PENDING
- [ ] Dimension 5 Spacing: PENDING
- [ ] Dimension 6 Registry Safety: PASS (no shadcn, no third-party registry)

**Approval:** pending