---
phase: "44"
name: "Workspace"
slug: "workspace"
created: "2026-06-13"
status: "in_progress"
---

# Phase 44: Workspace — Real-time Data Integration

## Domain

Connect the Workspace page (`/vi/workspace`) to real Prisma queries instead of mock data.

## Carried Forward from Phase 43

- **Architecture:** Components in `src/components/`, NOT `src/legacy/`
- **Source code:** `src/legacy/` for reference only — clone and adapt

## Canonical Refs

| Ref | Path | Purpose |
|-----|------|---------|
| Phase 43 Context | `.planning/phases/43-messages/43-CONTEXT.md` | Architecture pattern reference |
| Legacy Workspace Page | `src/legacy/[locale]/[workspaceSlug]/workspace/page.tsx` | Prisma queries reference |
| Workspace Components | `src/legacy/[locale]/customer/components/Workspace/` | UI component source |
| UserWorkspace translations | `src/messages/vi.json` | i18n keys |

## Legacy Components to Clone

From `src/legacy/[locale]/customer/components/Workspace/`:

| Component | Purpose |
|-----------|---------|
| `WorkspaceBanner.tsx` | Banner with workspace name + invite button |
| `StatsGrid.tsx` | 4 stat cards (Workspace, Members, Requests, Vault) |
| `MemberGrid.tsx` | Member list with role badges + permission panel |
| `ResourceTable.tsx` | Resource table (requests, vault, invites) |

## Decisions

### D-44-01: Invite Member API
**Decision:** Create `POST /api/workspace/invite` endpoint

**Rationale:** User wants full functionality, not placeholder

### D-44-02: Vault Scope Calculation
**Decision:** Calculate from real data

**Formula:** `(encryptedVaultFiles / totalVaultFiles) * 100`

**Rationale:** Real data provides accurate metrics for dashboard

## Implementation Scope

### Must Have
1. `src/components/workspace/` directory with cloned components
2. `src/app/[locale]/workspace/page.tsx` with Prisma queries
3. Stats from database (members, requests, vault files)
4. Member list with role badges from WorkspaceMembership
5. Resource table with real data
6. Invite member API (`POST /api/workspace/invite`)

### Deferred
- Email invitation sending (Phase 51+)
- Member role editing (Phase 45+)
- Workspace settings CRUD

## Page Structure

```
src/app/[locale]/workspace/page.tsx     # Server component
├── Prisma queries (members, requests, vault, messages)
├── Stats data transformation
├── WorkspaceBanner
├── StatsGrid
├── MemberGrid (with permission panel)
└── ResourceTable

src/app/api/workspace/
└── invite/route.ts   # POST - Invite member by email
```
