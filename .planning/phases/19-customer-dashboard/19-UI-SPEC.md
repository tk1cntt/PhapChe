---
phase: 19
slug: customer-dashboard
status: approved
shadcn_initialized: false
preset: none
created: 2026-06-08
---

# Phase 19 — UI Design Contract

> Visual and interaction contract for `/customer/requests`, verified against existing Ant Design customer/request screens.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none |
| Preset | not applicable |
| Component library | Ant Design (`Card`, `Table`, `Tag`, `Button`, `Flex`, `Typography`) |
| Icon library | none required |
| Font | existing app font stack |

---

## Spacing Scale

Declared values (must be multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Tag/button inline gaps |
| sm | 8px | Text stack spacing inside cards |
| md | 16px | Card body padding, mobile page padding |
| lg | 24px | Gap between header, CTA, and table card |
| xl | 32px | Desktop page vertical padding |
| 2xl | 48px | Not required for this compact dashboard |
| 3xl | 64px | Not required |

Exceptions: none.

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 16px | 400 | 1.5 |
| Label | 14px | 600 | 1.4 |
| Heading | 30px | 600 | 1.2 |
| Table row title | 16px | 400 | 1.5 |

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#F8FAFC` | Page background and subtle empty-state surface |
| Secondary (30%) | `#FFFFFF` | Ant Design card/table surfaces |
| Text primary | `#0F172A` | Headings and request titles |
| Text secondary | `#475569` | Descriptive copy and metadata |
| Border | `#E2E8F0` | Empty-state/card boundaries if custom card content is needed |
| Accent (10%) | Ant Design primary blue | Primary CTA `Tạo yêu cầu mới`, status/detail action buttons |
| Destructive | Ant Design red / `red` tag | Cancelled status only; no destructive customer action in this phase |

Accent reserved for: primary CTA to `/intake`, row action to view status, row action to view delivered results.

Status tag colors must reuse the existing mapping:

| Status tone | Ant Design color |
|-------------|------------------|
| neutral | `default` |
| info | `blue` |
| warning | `orange` |
| accent | `cyan` |
| destructive | `red` |
| outline | `default` |

---

## Layout Contract

### Route `/customer/requests`

- Page max width: `960px`.
- Page padding: `32px 16px` on small screens; may use existing customer layout padding if inherited.
- Header stack:
  - H1: `Yêu cầu của tôi`.
  - Body: `Theo dõi các yêu cầu pháp lý bạn đã gửi và mở tài liệu cuối cùng khi hồ sơ đã được giao.`
- Top/right or below-header CTA: `Tạo yêu cầu mới` linking to `/intake`.
- Main content: one `Card` containing a `Table` or responsive customer cards.
- If using `Table`, pagination can be disabled for MVP unless existing list size patterns require it.

### Row/card fields

Every request row/card must show:

- Request title.
- Status `Tag` with Vietnamese label.
- Matter type, fallback `Chưa có loại vụ việc`.
- Created date formatted with `vi-VN` medium date.
- Updated date formatted with `vi-VN` medium date when selected; otherwise omit and do not fake it.
- Action `Xem trạng thái` linking to `/requests/{requestId}`.
- Conditional action `Xem tài liệu` linking to `/customer/requests/{requestId}` only when status is `delivered` or `closed`.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Page title | `Yêu cầu của tôi` |
| Page body | `Theo dõi các yêu cầu pháp lý bạn đã gửi và mở tài liệu cuối cùng khi hồ sơ đã được giao.` |
| Primary CTA | `Tạo yêu cầu mới` |
| Status action | `Xem trạng thái` |
| Delivery action | `Xem tài liệu` |
| Empty state heading | `Bạn chưa có yêu cầu nào` |
| Empty state body | `Hãy gửi yêu cầu pháp lý đầu tiên để đội ngũ Pháp Chế bắt đầu tiếp nhận và xử lý.` |
| Error state | Use framework/session behavior; authenticated access is enforced by `requireAppSession()` and sign-in redirect patterns. |
| Destructive confirmation | Not applicable — no destructive customer action in this phase. |

---

## Interaction Contract

- Clicking `Tạo yêu cầu mới` navigates to `/intake`.
- Clicking `Xem trạng thái` navigates to `/requests/{requestId}` for every listed request.
- Clicking `Xem tài liệu` navigates to `/customer/requests/{requestId}` only for `delivered`/`closed` requests.
- Non-delivered requests must not show download/final-document actions on the dashboard.
- `/requests/{requestId}` must include a visible CTA/link back to `/customer/requests` with copy `Xem tất cả yêu cầu của tôi` or `Quay lại danh sách yêu cầu`.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not required |
| third-party | none | not required |

No registry components or third-party UI blocks are allowed for this phase.

---

## UI Test Contract

- `e2e/customer-dashboard.spec.ts` must cover `/customer/requests`.
- Test must verify an intake-created request appears in the dashboard.
- Test must verify navigation from dashboard to `/requests/[requestId]` works.
- Test must verify a non-delivered request does not expose `Xem tài liệu`.
- If delivered seed data is available, test may additionally verify `Xem tài liệu` appears for delivered/closed rows.

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-06-08

## UI-SPEC VERIFIED
