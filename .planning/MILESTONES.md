# Milestones

## v1.0 MVP (Shipped: 2026-06-05)

**Phases completed:** 14 phases, 49 plans, 70 tasks

**Key accomplishments:**

- 1. [Rule 3 - Blocking] Pinned Prisma 6.19.x for datasource compatibility
- Server-side RBAC with workspace isolation plus append-only audit writer constrained to non-sensitive metadata summaries
- 1. [Rule 3 - Blocking] Added minimal missing RBAC, audit, Prisma, and session dependencies
- Vietnamese admin shell, user/workspace/request/audit pages, and audited admin user mutation service with backend workflow-safe controls
- Prisma-backed legal intake catalog with schema-versioned answer snapshots, backend validation, audit-safe metadata, and workflow-owned unsupported triage
- Vietnamese customer intake flow with server-action mutations, private upload metadata, review submit, and RBAC-guarded read-only status page
- Request-authorized intake uploads create private VaultFile metadata with audit-safe filename, size, and hash summaries
- Request-scoped intake flow with env-backed server session and real persisted review data
- Routing capability matrix with Prisma persistence and service-owned specialist/reviewer eligibility suggestions
- Atomic coordinator assignment with workflow-safe status changes, append-only history, and safe audit metadata
- Vietnamese coordinator routing screen with explicit assignment forms and service-backed admin actions
- Server-authorized specialist work entry with assigned queue, intake summary, and file metadata only
- Seeded routing capability demo data; schema push blocked by missing DATABASE_URL
- What was built:
- What was built:
- Specialist workbench UI with template-based draft generation, version history with status tracking, vault file metadata display, and submit-for-review action
- Fixed two non-blocking warnings from 04-VERIFICATION.md: added missing VaultFile schema fields and built variable schema builder for template creation.
- 1. [Rule 3 - Blocking] Used direct node:test command after missing npm test script
- 1. [Rule 3 - Blocking] Used direct node:test command after missing npm test script
- 1. [Rule 3 - Blocking] Used direct node:test command after missing npm test script
- 1. [Rule 1 - Bug] Made specialist form actions compatible with current Next typing
- 1. [Rule 3 - Blocking] Installed dependencies before running `npx tsx`
- 1. [Rule 3 - Blocking] Scoped typecheck result to plan files because repository-wide typecheck fails outside this plan
- 1. [Rule 3 - Blocking] Scoped typecheck result to the timeline page because repository-wide typecheck fails outside this plan
- 1. [Rule 3 - Blocking] Installed dependencies before running the local test runner
- 1. [Rule 3 - Blocking] Installed missing @esbuild/linux-x64 binary
- Reviewer portal UI: fixed queue Prisma traversal, rebuilt split-view detail page with real data, and wired approve/reject server actions with Vietnamese error feedback.
- Source file:
- One-liner:
- Removed orphaned raw prisma.vaultFile.create calls in upload-service and draft-service by routing all vault file creation through storeVaultFile, with optional Prisma.TransactionClient support for transaction-safe reuse
- Replace hardcoded mock audit events with a live Prisma query against the `AuditEvent` table, with `requireAppSession()` auth and workspace filtering.
- 1. [Rule 1 - Bug] Replaced AntdRegistry with StyleProvider
- Admin route group layout with antd Layout, Sider (6 nav items with icons), Header (Breadcrumb from route), and Content area on F8FAFC background
- Migrated 3 admin pages from custom ui.tsx components to antd equivalents, removing AdminShell wrapper and relying on the route group layout from Plan 02.
- Migrated the remaining 6 admin pages from custom ui.tsx components to antd equivalents, removing AdminShell wrapper from all admin pages and relying on the route group layout from Plan 02.
- Created specialist route group layout with compact antd Sider (width 200) and migrated all 6 specialist-facing pages and sub-components from custom ui.tsx imports to antd components (Tag, Button, Card, Table, Typography, Flex).
- Customer delivery page
- Created reviewer route group layout and migrated all 4 reviewer files from hand-rolled ui.tsx components to antd. The reviewer layout uses a compact Sider with a single queue nav item, matching the specialist layout pattern. All page-level Badge/PageHeader/Button/Card/Table imports replaced with antd Tag/Typography/Button/Card/Table equivalents.
- Deleted `ui.tsx` and `admin-shell.tsx` after verifying zero remaining consumers in the project

