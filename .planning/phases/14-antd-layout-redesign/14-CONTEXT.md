# Phase 14: antd-layout-redesign - Context

**Gathered:** 2026-06-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Integrate Ant Design (antd) UI library and redesign the layout system across all route groups (admin, specialist, customer, reviewer). Replace the current hand-rolled Tailwind-only components with Ant Design components. Introduce role-specific layouts using Ant Design Layout, Sider, Menu, and Breadcrumb components.

This phase does **not** change business logic, backend services, data models, or workflow state machines. It is a **UI-layer migration** — the visual shell and component library, not the application behavior.

</domain>

<decisions>
## Implementation Decisions

### Ant Design Scope
- **D-01:** Full Ant Design adoption. Replace all existing components (Table, Form, Button, Badge, Card, PageHeader, Modal, DatePicker) with Ant Design equivalents. Remove the hand-rolled `src/app/admin/components/ui.tsx` component set.
- **D-02:** Ant Design components are the primary UI toolkit going forward. Custom CSS (Tailwind) is used only for layout spacing and edge cases where Ant Design has no equivalent.

### Layout Architecture
- **D-03:** Each route group gets its own layout using Ant Design's `Layout`, `Sider`, `Menu`:
  - `(admin)/layout.tsx` — AdminShell replaced by Ant Design Layout + Sider + Menu
  - `(specialist)/layout.tsx` — Specialist layout (simpler sidebar, focus on case queue)
  - `(customer)/layout.tsx` — Minimal layout, no sidebar, only header with status
  - `(reviewer)/layout.tsx` — Reviewer layout (split view support, minimal chrome)
- **D-04:** Current `AdminShell` component at `src/app/admin/components/admin-shell.tsx` is replaced entirely. The nav items configuration moves into a shared config or each route group's layout.

### Theme & Styling
- **D-05:** Ant Design ConfigProvider is the primary theme system. Use `ConfigProvider` at root layout to define Design Tokens (color, font, border-radius) that match the existing brand: teal accent (`#0F766E`), neutral backgrounds (`#F8FAFC`), etc.
- **D-06:** Tailwind CSS v4 is retained for utility classes (spacing, flex, grid) and will coexist with Ant Design. Ant Design components receive no Tailwind class overrides — styling goes through Ant Design's `theme` tokens or inline `style` prop where needed.
- **D-07:** The existing CSS custom properties in `src/app/globals.css` (`--accent`, `--background`, `--text-primary`, etc.) are migrated to Ant Design theme tokens. The CSS variables file may be retained as a reference or removed.

### Migration Strategy
- **D-08:** Page-by-page migration, not a bulk swap. Order of priority:
  1. Admin layout (replace AdminShell)
  2. Admin pages one at a time (audit, users, workspaces, requests, ops, vault)
  3. Specialist layout + pages
  4. Customer layout + pages
  5. Reviewer layout + pages
- **D-09:** Each page migration is a separate task/commit. Each route group layout migration is a separate plan. Easy to rollback, easy to review.

### Responsive Layout
- **D-10:** Use Ant Design `Layout.Sider` with `breakpoint` prop for responsive sidebar. On mobile screens, the sidebar collapses automatically to an icon menu (Ant Design default behavior). No additional responsive patterns needed.

### Breadcrumb
- **D-11:** Use Ant Design `Breadcrumb` component with auto-generation from the current route path. Map route segments to Vietnamese labels via a lookup config. Breadcrumbs appear inside each role layout, below the header and above the page content.

### Claude's Discretion
- Exact Ant Design version (latest stable as of planning)
- Exact Design Token values (researcher to match brand colors)
- Whether to keep or remove `components/ui.tsx` after all pages are migrated (safe to remove after last consumer is gone)
- How to handle the `src/app/globals.css` transition (keep as minimal reset or remove entirely)
- Breadcrumb route-to-label mapping implementation (centralized config vs inline)
- Provider tree structure (nesting ConfigProvider, AntDesignRegistry, etc.)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing implementation
- `src/app/admin/components/admin-shell.tsx` — Current admin layout, to be replaced
- `src/app/admin/components/ui.tsx` — Current custom UI components (Badge, Button, Card, Table, PageHeader), to be replaced
- `src/app/globals.css` — Current CSS custom properties, to be migrated to Ant Design tokens
- `src/app/layout.tsx` — Root layout, to receive ConfigProvider

### Route groups needing layouts
- `src/app/admin/` — Admin pages (users, workspaces, requests, ops, audit, vault)
- `src/app/specialist/requests/` — Specialist workbench
- `src/app/reviewer/requests/` — Reviewer portal
- `src/app/customer/requests/` — Customer delivery

### UI patterns
- `src/app/admin/audit/page.tsx` — Example page consuming Table, Badge, Card, PageHeader from custom components
- `src/app/specialist/requests/[requestId]/page.tsx` — Example specialist page consuming Card, Badge, PageHeader

### Theme reference
- `src/app/globals.css` — Current CSS variables: `--accent: #0F766E`, `--background: #F8FAFC`, `--text-primary: #0F172A`, `--text-secondary: #475569`, `--border: #E2E8F0`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/admin/components/ui.tsx` — 5 exported components (Badge, Button, Card, Table, PageHeader) that will be replaced by Ant Design equivalents
- `src/app/admin/components/admin-shell.tsx` — Admin shell with header + sidebar nav, to be replaced by Ant Design Layout + Sider + Menu
- `globals.css` — CSS custom properties and base styles for brand colors

### Established Patterns
- Current pattern: Tailwind utility classes with hardcoded hex colors (`text-[#0F172A]`, `bg-[#F8FAFC]`)
- Admin pages are mostly server-rendered async components under `AdminShell`
- Pages use `Card`, `Table`, `PageHeader`, `Badge`, `Button` from `ui.tsx` consistently

### Integration Points
- Root layout at `src/app/layout.tsx` — needs `ConfigProvider` + Ant Design registry
- Admin pages all import from `'../components/admin-shell'` and `'../components/ui'` — need import path updates
- Each route group needs a new layout file (`src/app/(admin)/layout.tsx`, etc.)

</code_context>

<specifics>
## Specific Ideas

- The Ant Design App component (ConfigProvider + App wrapper) from antd v5 provides `message`, `modal`, `notification` via hooks — useful for the existing success/error toast patterns
- Consider using Ant Design's `@ant-design/cssinjs` for SSR compatibility with Next.js App Router
- Breadcrumb labels can use a simple `Record<string, string>` map: `{ 'admin': 'Quản trị', 'users': 'Người dùng', 'requests': 'Hồ sơ yêu cầu' }`

</specifics>

<deferred>
## Deferred Ideas

- **Ant Design Charts / @ant-design/charts** — separate from core layout migration
- **Dark mode support** — beyond ConfigProvider scope for now
- **Internationalization (antd i18n)** — Ant Design supports Vietnamese locale already, can be enabled but not a blocker
- None — discussion stayed within phase scope

</deferred>

---

*Phase: 14-antd-layout-redesign*
*Context gathered: 2026-06-05*
