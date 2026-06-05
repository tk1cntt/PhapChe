---
phase: 09
slug: folder-tag
status: draft
shadcn_initialized: false
preset: none
created: 2026-06-03
---

# Phase 09 — UI Design Contract

> Visual and interaction contract for the admin vault browse UI. Reuses the existing admin primitives; no new design system components.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (reuses project primitives) |
| Preset | not applicable |
| Component library | none (in-house primitives in `src/app/admin/components/ui.tsx`) |
| Icon library | none (text + badge labels only) |
| Font | inherits Next.js default sans-serif |

Reuses `AdminShell`, `Card`, `Table`, `Badge`, `Button`, `PageHeader`. No new components.

---

## Spacing Scale

Inherits the existing 4px / 8px / 16px / 24px / 32px scale. No new tokens.

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon-to-label gaps |
| sm | 8px | Between row actions and labels |
| md | 16px | Default gap inside Cards |
| lg | 24px | Card padding |
| xl | 32px | Section gap (folders ↔ tags) |
| 2xl | 48px | Page-level breathing room |
| 3xl | 64px | Reserved — not used in this phase |

---

## Typography

Inherits Tailwind defaults via existing primitives.

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 14px | 400 | 1.6 |
| Label | 13px | 600 | 1.3 |
| Heading | 30px | 600 | 1.15 |
| Display | 30px | 600 | 1.15 |

Page title uses `PageHeader` primitive. Section subheaders inside Cards use Tailwind `text-lg font-semibold`.

---

## Color

Inherits the existing palette. No new tokens.

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#FFFFFF` / `#F8FAFC` | Page background, card surfaces |
| Secondary (30%) | `#E2E8F0` / `#CBD5E1` | Borders, table headers |
| Accent (10%) | `#0F766E` (teal-700) | Primary CTA (Create folder/tag, Save) |
| Destructive | `#DC2626` / `#B91C1C` | Delete folder/tag, error states |

Accent reserved for: `Button variant="primary"` and `Badge tone="accent"` only. Folder/tag chips use `Badge tone="outline"` to stay visually quiet.

---

## Copywriting Contract

Vietnamese copy throughout. No English fallback strings.

| Element | Copy |
|---------|------|
| Page title | "Phân loại vault" |
| Page description | "Tạo thư mục và thẻ để tổ chức hồ sơ pháp lý. Chỉ quản trị viên mới thấy mục này." |
| Folders section header | "Thư mục" |
| Tags section header | "Thẻ phân loại" |
| Create folder CTA | "Tạo thư mục mới" |
| Create tag CTA | "Tạo thẻ mới" |
| Move file CTA | "Chuyển vào thư mục" |
| Apply tag CTA | "Gắn thẻ" |
| Remove tag CTA | "Gỡ thẻ" |
| Folder name label | "Tên thư mục" |
| Tag key label | "Mã thẻ (key)" |
| Tag label label | "Tên hiển thị" |
| Empty folders state | "Chưa có thư mục nào. Tạo thư mục đầu tiên để bắt đầu phân loại." |
| Empty tags state | "Chưa có thẻ nào. Tạo thẻ đầu tiên để gắn nhãn hồ sơ." |
| Success message | "Đã lưu thay đổi phân loại." |
| Error state | "Không thể lưu phân loại. Vui lòng thử lại hoặc liên hệ quản trị viên." |
| Destructive confirmation | "Xóa thư mục: các tệp trong thư mục sẽ được giữ nguyên nhưng mất liên kết phân loại." |

---

## Layout Primitives

### Page: `/admin/vault`

- `PageHeader` at top with title + description.
- Two-column CSS grid `grid-cols-1 lg:grid-cols-2 gap-8`:
  - Left: folders card (tree/list of folders with create + move-file actions).
  - Right: tags card (flat list of tags with create + apply-tag actions).
- Below: file browser card (table of vault files with column "Thư mục" + "Thẻ" + actions).

### Folder Tree

- Recursive nesting via `parentId` self-relation.
- Visual depth indicator: Tailwind `pl-{depth*4}` per level.
- Each row: folder name (left), file count badge (right), action menu (right) with "Đổi tên" / "Xóa".
- "Tạo thư mục mới" button at top of card.

### Tag List

- Flat list. Each row: key (monospace) + label + usage count badge + remove action.
- "Tạo thẻ mới" button at top of card.

### File Browser

- `Table` with columns: "Tên tệp", "Yêu cầu", "Thư mục" (badge), "Thẻ" (badge list), "Cập nhật" (timestamp).
- Per-row actions: "Chuyển thư mục" (opens folder picker) + "Gắn thẻ" (opens tag picker) + "Gỡ thẻ" (per-tag remove).
- Empty state when no files: Card with "Chưa có tệp nào trong vault này."

---

## Server Action Feedback

- Inline `Badge tone="accent"` for success after a server action.
- Inline `Badge tone="destructive"` for errors.
- No page reload; actions update local state on success.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not required |
| third-party npm packages | none | not required |

No new npm packages. All visuals come from Tailwind + existing admin primitives.

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS — Vietnamese copy complete
- [x] Dimension 2 Visuals: PASS — reuses existing primitives
- [x] Dimension 3 Color: PASS — accent reserved for primary CTA only
- [x] Dimension 4 Typography: PASS — inherits existing Tailwind defaults
- [x] Dimension 5 Spacing: PASS — 4px multiples only
- [x] Dimension 6 Registry Safety: PASS — no new dependencies

**Approval:** approved 2026-06-03 (auto-mode, generated inline from CONTEXT.md D-08..D-12 and existing admin primitives)
