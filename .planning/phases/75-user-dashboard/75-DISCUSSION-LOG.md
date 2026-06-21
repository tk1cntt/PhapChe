# Phase 75: User Dashboard - Discussion Log

**Auto mode:** All gray areas auto-resolved based on SPEC.md requirements.

## Auto-Resolution Log

### Clickable Stat Cards
- **Area:** Navigation behavior
- **Options:** onClick handler, href prop, Link component
- **[auto]** Selected: `StatCard with href prop using Next.js Link` — recommended pattern for client-side navigation
- **Rationale:** SPEC.md requires "clickable navigate to relevant page"

### Floating Chat Badge
- **Area:** Unread count behavior
- **Options:** Real-time (WebSocket), Periodic fetch, Client-side mount
- **[auto]** Selected: `Client-side fetch on mount` — SPEC.md requires dynamic count
- **Rationale:** SPEC.md requires "fetch unread count từ API, display badge nếu count > 0"

### Loading States
- **Area:** Loading behavior
- **Options:** Spinners, Skeleton components, Progressive loading
- **[auto]** Selected: `Skeleton components from phase 73` — follows established pattern
- **Rationale:** SPEC.md constraints require skeleton components from foundation

### Empty States
- **Area:** Empty data behavior
- **Options:** Hide panel, Show placeholder, Show EmptyState component
- **[auto]** Selected: `EmptyState component from phase 73` — consistent with foundation
- **Rationale:** SPEC.md requires "empty state khi no data"

### Error States
- **Area:** Error handling behavior
- **Options:** Hide panel, Show error message, Show error with retry
- **[auto]** Selected: `Error with retry button` — matches SPEC.md requirement
- **Rationale:** SPEC.md requires "error state với retry button"

### Cases Table Pagination
- **Area:** Pagination behavior
- **Options:** Server-side, Client-side, Infinite scroll
- **[auto]** Selected: `Client-side pagination with state` — simpler for MVP
- **Rationale:** Data already loaded, only needs client-side pagination

### CSS Matching
- **Area:** CSS approach
- **Options:** Tailwind, Custom CSS, Tailwind + Custom mix
- **[auto]** Selected: `Custom CSS (existing)` — SPEC.md requires custom classes
- **Rationale:** SPEC.md constraints require "CSS must match mock UI design system"

### i18n
- **Area:** Internationalization
- **Options:** Inline text, i18n keys
- **[auto]** Selected: `i18n namespace DashboardClient` — follows established pattern
- **Rationale:** SPEC.md requires i18n namespace

---

*Phase: 75-user-dashboard*
*Discussion completed: 2026-06-21 (auto mode)*
