---
phase: 10
slug: ux-hardening
status: draft
shadcn_initialized: false
preset: none
created: 2026-06-03
---

# Phase 10 — UI Design Contract

> Surgical UX hardening for 3 surfaces: specialist workbench version list, customer download, specialist deliver/close feedback. No new design system components.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (reuses project primitives) |
| Preset | not applicable |
| Component library | none (in-house primitives) |
| Icon library | none (text + badge labels only) |
| Font | inherits Next.js default sans-serif |

Reuses existing primitives from `src/app/admin/components/ui.tsx` (Card, Table, Badge, Button, PageHeader) and existing specialist/customer page styles. No new components.

---

## Spacing Scale

Inherits 4px / 8px / 16px / 24px / 32px scale. No new tokens.

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon-to-label gaps |
| sm | 8px | Between action result text and badges |
| md | 16px | Default gap inside Cards |
| lg | 24px | Card padding |
| xl | 32px | Section gap (only on specialist workbench) |
| 2xl | 48px | Reserved — not used in this phase |
| 3xl | 64px | Reserved — not used in this phase |

---

## Typography

Inherits Tailwind defaults.

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 14px | 400 | 1.6 |
| Label | 13px | 600 | 1.3 |
| Heading | 30px | 600 | 1.15 |
| Display | 30px | 600 | 1.15 |

---

## Color

Inherits existing palette. No new tokens.

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#FFFFFF` / `#F8FAFC` | Page background, card surfaces |
| Secondary (30%) | `#E2E8F0` / `#CBD5E1` | Borders, table headers |
| Accent (10%) | `#0F766E` (teal-700) | Download link, action result success badge |
| Destructive | `#DC2626` / `#B91C1C` | Error feedback badge |

Accent reserved for: success badges (`Badge tone="accent"`) and primary download link color. Error feedback uses `Badge tone="destructive"`.

---

## Copywriting Contract

Vietnamese copy throughout. No English fallback strings.

| Element | Copy |
|---------|------|
| Success: delivered | "Đã giao tài liệu thành công" |
| Success: closed | "Đã đóng hồ sơ" |
| Failure: generic | "Không thể thực hiện thao tác. Vui lòng thử lại." |
| Download link label | "Tải xuống" |
| Version history heading | "Lịch sử phiên bản" |
| Empty version history | "Chưa có phiên bản nào được tạo." |
| Version row status | Dùng label theo RequestStatus mapping hiện có |

---

## Layout Primitives

### 1. Specialist Workbench (`src/app/specialist/requests/[requestId]/page.tsx`)

**Version list fix** (D-01, D-02):
- After unblocking `listDocumentVersions`, the existing version history table renders normally.
- No UI change required once the Prisma select is corrected. Use existing `<Table headers={['Phiên bản', 'Trạng thái', 'Ngày tạo', 'Hành động']}>`.

### 2. Customer Download (`src/app/customer/requests/[requestId]/page.tsx`)

**Inline signed URL** (D-03, D-04):
- Replace bare `/api/vault/{id}/download` link with the actual signed URL returned by `requestVaultFileAccess()`.
- The link element becomes `<a href={signedUrl} ...>` with the existing label.
- Single browser request, no redirect round-trip.

### 3. Specialist Deliver/Close Feedback (D-06, D-07, D-08)

**Action result rendering**:
- Add a state slot above the action buttons.
- When `markDeliveredAction` returns `{ ok: true, message }`: render `<Badge tone="accent">Đã giao tài liệu thành công</Badge>`.
- When `markDeliveredAction` returns `{ ok: false, message }`: render `<Badge tone="destructive">{message}</Badge>`.
- Same for `closeDeliveredAction` with copy "Đã đóng hồ sơ".
- The result disappears on next form submit (no persistence).

---

## Server Action Feedback Flow

- Use `useActionState` if the page is a client component, OR call the action and dispatch the result via local state if the page is a server component with form actions.
- Render Badge inline, no toast library.
- No animation; instant render.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not required |
| third-party npm packages | none | not required |

No new npm packages. All visuals come from existing primitives and Tailwind.

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS — Vietnamese copy complete
- [x] Dimension 2 Visuals: PASS — reuses existing primitives, no new visual idioms
- [x] Dimension 3 Color: PASS — accent reserved for success states only
- [x] Dimension 4 Typography: PASS — inherits existing Tailwind defaults
- [x] Dimension 5 Spacing: PASS — 4px multiples only
- [x] Dimension 6 Registry Safety: PASS — no new dependencies

**Approval:** approved 2026-06-03 (auto-mode, generated inline from CONTEXT.md D-01..D-08 and existing page patterns)
