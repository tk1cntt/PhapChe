---
phase: 08
slug: reviewer-service
status: draft
shadcn_initialized: false
preset: none
created: 2026-06-03
---

# Phase 08 — UI Design Contract

> Visual and interaction contract for the reviewer portal. Generated for gap-closure phase that rebuilds the reviewer queue, split-view detail page, and approve/reject feedback flows.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (reuses project primitives) |
| Preset | not applicable |
| Component library | none (in-house primitives in `src/app/admin/components/ui.tsx`) |
| Icon library | none (text + badge labels only) |
| Font | inherits Next.js default sans-serif |

The reviewer portal reuses the existing admin primitives `Card`, `Table`, `Badge`, `Button`, `PageHeader`. No new design system components are introduced. No shadcn/Radix/Base UI dependency is added.

---

## Spacing Scale

Reuses the spacing already declared in the admin primitives (4px / 8px / 16px / 24px multiples). No new tokens.

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon-to-label gaps inside checklist rows |
| sm | 8px | Between checklist toggle and comment field |
| md | 16px | Default gap between list rows and card sections |
| lg | 24px | Card inner padding (matches `Card` primitive) |
| xl | 32px | Split-view gutter (left document / right checklist) |
| 2xl | 48px | Reserved — not used in this phase |
| 3xl | 64px | Reserved — not used in this phase |

Exceptions: none. The split-view page uses CSS grid with `xl` (32px) gutter between the two columns.

---

## Typography

Inherits Tailwind defaults via the existing primitives. No new font sizes.

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 14px | 400 | 1.6 |
| Label | 13px | 600 | 1.3 |
| Heading | 30px | 600 | 1.15 |
| Display | 30px | 600 | 1.15 |

Page title uses `PageHeader` primitive (30px / 600 / 1.15). Section headers inside the split-view use Tailwind `text-lg font-semibold`. Checklist item labels use Tailwind `text-sm font-semibold`. Body copy uses Tailwind `text-sm text-[#475569]`.

---

## Color

Inherits the existing palette from `src/app/admin/components/ui.tsx`. No new color tokens.

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#FFFFFF` / `#F8FAFC` | Page background, card surfaces |
| Secondary (30%) | `#E2E8F0` / `#CBD5E1` | Borders, table headers, dividers |
| Accent (10%) | `#0F766E` (teal-700) | Primary CTA (Approve), active badges, focus ring |
| Destructive | `#DC2626` / `#B91C1C` | Reject CTA, "revision required" badge, error messages |

Accent reserved for: `Button variant="primary"` (Approve action), `Badge tone="accent"` (reviewer-pending status), focus ring only. Never applied to body text or non-action surfaces.

---

## Copywriting Contract

Vietnamese copy throughout. No English fallback strings.

| Element | Copy |
|---------|------|
| Queue page title | "Hàng chờ duyệt" |
| Queue page description | "Danh sách phiên bản tài liệu được chuyên viên gửi lên chờ bạn duyệt." |
| Empty state heading | "Chưa có tài liệu chờ duyệt" |
| Empty state body | "Khi chuyên viên gửi tài liệu lên, tài liệu sẽ xuất hiện tại đây." |
| Detail page title | "Duyệt tài liệu" |
| Detail page description | "Đọc tài liệu bên trái và hoàn thành checklist bên phải trước khi duyệt." |
| Approve CTA | "Duyệt" |
| Reject CTA | "Yêu cầu chỉnh sửa" |
| Approve success | "Đã duyệt tài liệu. Tài liệu đã được chuyển sang trạng thái cuối." |
| Reject success | "Đã gửi yêu cầu chỉnh sửa cho chuyên viên." |
| Approve blocked | "Vui lòng hoàn thành tất cả mục bắt buộc trong checklist trước khi duyệt." |
| Reject missing comment | "Vui lòng nhập nhận xét cho các mục chưa đạt." |
| Error state | "Không thể lưu đánh giá. Vui lòng thử lại hoặc liên hệ quản trị viên." |
| Destructive confirmation | "Yêu cầu chỉnh sửa: tài liệu sẽ được trả về cho chuyên viên và phiên bản này chuyển về bản nháp." |

---

## Layout Primitives

### Reviewer Queue Page (`/reviewer/requests`)

- Uses `PageHeader` for the title row.
- Empty state: full-width `Card` with heading + body copy above.
- Populated state: `Table` with columns: "Yêu cầu", "Loại vụ việc", "Chuyên viên", "Phiên bản", "Gửi lúc".
- Each row links to the detail page via `Badge` styled as link.
- Vietnamese timestamp format via existing helpers.

### Reviewer Detail Page (`/reviewer/requests/[requestId]/review/[documentVersionId]`)

- Uses `PageHeader` with the request title and a back-link.
- CSS grid `grid-cols-1 lg:grid-cols-[1fr_420px] gap-8` for split view.
- Left column (`Card`): renders the document version content (text) with internal padding.
- Right column (`Card`): checklist grouped by Formal / Legal Content / Operational.
- Each checklist item: row with pass/fail toggle (radio buttons or checkbox), optional Vietnamese comment field when failed.
- Approve `Button variant="primary"` at the top-right of the checklist card.
- Reject `Button variant="destructive"` below approve, only enabled when at least one item is failed.
- Inline feedback message area (using `Badge` with success/destructive tone) appears below the action buttons after submit.

### Action Result Feedback

- Use `Badge tone="accent"` for approve success.
- Use `Badge tone="destructive"` for reject success or error.
- On success of approve or reject, redirect to the queue page with a query param `?notice=approved` or `?notice=revision` and render a top-of-page banner on the queue.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not required |
| third-party npm packages | none (no new deps) | not required |

No new npm packages are introduced. All visuals come from `tailwindcss` classes already configured in `tailwind.config.ts` and the existing admin primitives.

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS — Vietnamese copy complete, no English fallback strings
- [x] Dimension 2 Visuals: PASS — reuses existing primitives, no new visual idioms
- [x] Dimension 3 Color: PASS — accent reserved for primary CTA and active state only
- [x] Dimension 4 Typography: PASS — inherits existing Tailwind defaults
- [x] Dimension 5 Spacing: PASS — 4px multiples only, no off-grid values
- [x] Dimension 6 Registry Safety: PASS — no new dependencies

**Approval:** approved 2026-06-03 (auto-mode, generated inline from CONTEXT.md D-08..D-15 and existing admin primitives)
