---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: Foundation â€” Restructure + Multilingual Schema
status: planning
last_updated: "2026-06-13T12:34:05.982Z"
progress:
  total_phases: 25
  completed_phases: 16
  total_plans: 38
  completed_plans: 38
  percent: 60
---

# State: v2.0 Admin Portal Real Data — Full Coverage

## Project Reference

**Project:** GitNexus Legal - Legal-as-a-Service Platform
**Core Value:** SME gui yeu cau phap ly don gian nhu nhan tin va nhan tai lieu/tu van da qua kiem soat chat luong, co the truy vet toan bo qua trinh xu ly.
**Current Milestone:** v2.0 Admin Portal Real Data — Full Coverage

## Current Position

Phase: 50 — COMPLETE
Plan: 01 of 01
**Plan:** Completed
**Status:** Phase 50 complete. Commits: 6862538, 5154e85, e36f32a, db4a095, 15b94d9, ece01f6, b7fdb8f.

### Phase 32: Admin Dashboard

- [x] 32-CONTEXT.md — Context gathered (auto mode)
- [x] 32-01-PLAN.md — AdminStatCard, AdminBanner, page (2ef5069, 9b38bf2, 9077499)
- [x] 32-02-PLAN.md — WorkloadPanel, AlertPanel, WorkspacePanel, ApprovalPanel (f3bd64b, 01ce6be, 2b5b88f, 49302c3)
- [x] 32-03-PLAN.md — AuditTimeline, AdminRequestsTable, AdminToolbar, FloatingAlertButton (f406f80, 5f93775, a39be38, 114718e, 00a4a2b)

### Phase 46: Admin Dashboard Real Data

- [x] 46-01-PLAN.md — Clone 8 admin components + Prisma page (6f50af4, 1551bae)

### Phase 47: User Management Real Data

- [x] 47-01-PLAN.md — Admin users API integration, table, toolbar, paging

### Phase 48: Request Management Real Data

- [x] 48-01-PLAN.md — Admin request management API integration and UI parity

### Phase 49: Operations Real Data

- [x] 49-01-PLAN.md — Operations real data integration (b07a3f3, d72fb1d, 6d1beb6, 4e98d28)

### Phase 50: Audit Real Data

- [x] 50-CONTEXT.md — Context gathered (auto mode)
- [x] 50-01-PLAN.md — Audit real data integration (41ca14b, 6862538, 5154e85, e36f32a, db4a095, 15b94d9, ece01f6, b7fdb8f)
- [x] 50-01-VERIFICATION.md — PASSED (6/6 must-haves)

### Phase 51: Vault Real Data

- [ ] 51-01-PLAN.md — Vault real data integration

### Phase 52: Workspace Real Data

- [ ] 52-01-PLAN.md — Admin workspace real data integration

### Phase 33: User Management

- [x] 33-CONTEXT.md — Context gathered (auto mode)
- [x] 33-01-PLAN.md — UserStatCard component (2f20a02)
- [x] 33-02-PLAN.md — RolePill, UserTable, UserRow, RoleBadge components (7d17852, 0b1f2c0, 81cb178)
- [x] 33-03-PLAN.md — UserToolbar, integration, tests (336a6cc, 238b9a1, 0f3b190)

### Phase 27: Create Request

- [x] 27-01-PLAN.md — Page route with UserLayout and WizardSteps
- [x] 27-02-PLAN.md — Service selection components and sidebar panels
- [x] 27-03-PLAN.md — Form fields, integration, and floating chat

### Phase 29: Messages

- [x] 29-01-PLAN.md — Messages page route with UserLayout and 3-column layout
- [x] 29-02-PLAN.md — ThreadListPanel with ThreadItem components
- [x] 29-03-PLAN.md — ChatPanel and InfoPanel components with integration

### Phase 30: Workspace

- [x] 30-CONTEXT.md — Context gathered (auto mode)</parameter>

### v2.0 Admin Real Data Progress

```
[Phase 46-52]
Phase 46: Admin Dashboard      |****                | 100%
Phase 47: User Management      |****                | 100%
Phase 48: Request Management   |****                | 100%
Phase 49: Operations           |****                | 100%
Phase 50: Audit                |****                | 100%
Phase 51: Vault                |                    | 0%
Phase 52: Workspace            |                    | 0%
```

## Performance Metrics

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Phases | 7 | 7 | In progress |
| Requirements | 28 | 28 | Mapped |
| Plans | 3 | 7 | Phase 49 next |
| Completed phases | 4 | 7 | 57% |
| Admin template screens | 7 | 7 | Covered |

## v2.0 Admin Real Data Requirements Summary

| Screen | Phase | Requirements | Status |
|--------|-------|--------------|--------|
| Admin Dashboard | 46 | ADMIN-DASH-REAL-01..04 | Complete |
| User Management | 47 | ADMIN-USER-REAL-01..04 | Complete |
| Request Management | 48 | ADMIN-REQ-REAL-01..04 | Complete |
| Operations | 49 | ADMIN-OPS-REAL-01..04 | Complete |
| Audit | 50 | ADMIN-AUDIT-REAL-01..04 | Complete |
| Vault | 51 | ADMIN-VAULT-REAL-01..04 | Pending |
| Workspace | 52 | ADMIN-WS-REAL-01..04 | Pending |

**Total: 28 requirements across 7 admin real-data phases**

## Accumulated Context

### Template Sources

All screens must align with HTML templates in `layout/` folder:

**User Portal (6 screens):**

- `layout/user-dashboard.html` - Stats (12 ho so, 3 dang xu ly, 8 hoan tat, 36 vault), welcome banner, case list, deadlines, recent docs, activity timeline
- `layout/user-create-request.html` - 4-step wizard, service options, summary sidebar
- `layout/user-cases.html` - Summary banner, stats, toolbar filters, 7-column requests table
- `layout/user-messages.html` - 3-column (thread list, chat panel, info panel)
- `layout/user-workspace.html` - Stats, member grid, permissions, resource table
- `layout/user-settings.html` - Settings menu, profile form, notification toggles

**Admin Portal (7 screens):**

- `layout/admin-dashboard.html` - Stats (128 users, 12 workspaces, 6 SLA warnings, 3 alerts), workload, alerts, audit timeline
- `layout/admin-user-management.html` - Stats, role pills (6 roles), 8-column user table
- `layout/admin-request.html` - Stats, requests table with status/priority badges
- `layout/admin-operations.html` - Stats, workload panel, SLA bars
- `layout/admin-audit.html` - Stats, security notice, 7-column audit table with correlation IDs
- `layout/admin-vault.html` - Stats, folder/tag panels, vault table
- `layout/admin-workspace.html` - Permission card, workspace table

### Sample Data Requirements

- 128 users across 12 workspaces
- Role distribution: 72 customer, 18 specialist, 14 reviewer, 10 coordinator, 4 super_admin, 9 pending
- Sample workspaces: "Cong ty An Phat", "Cong ty Minh Khang", "Workspace noi bo"
- Sample users: Alex Nguyen (Super Admin), Ha Linh, Quang Dung, Minh Trang, Khanh An, Mai Phuong

### UI Verification Requirements

Each phase must verify:

1. UI matches template EXACTLY (colors, fonts, spacing, shadows)
2. Sample data matches template values
3. Shared UserLayout/AdminLayout components used
4. e2e test verifies render

## Session Continuity

### Last Session

Updated admin real-data roadmap/state coverage through Phase 52. Phase 49 Operations real data integration is complete. Phase 50 Audit is next.

### Next Steps

1. Phase 50: Audit real data integration
2. Phase 51: Vault real data integration
3. Phase 52: Workspace real data integration

### Blockers

None.

### Quick Tasks Completed

| # | Description | Date | Commit | Status | Directory |
|---|-------------|------|--------|--------|-----------|
| 260613-34v | Form /create CSS styling and file upload JSON error fix | 2026-06-12 | cd8a9ef | Verified | [260613-34v](./quick/260613-34v-form-create-css-styling-and-file-upload-/) |
| 260613-3ee | Setup login form with default credentials and auth redirect | 2026-06-12 | 0fb9c37 | Verified | [260613-3ee](./quick/260613-3ee-setup-login-form-with-default-credential/) |
| 260613-4uv | Fix 404 error in CreateRequestForm - Intake submission not found | 2026-06-12 | d22ab11 | Verified | [260613-4uv](./quick/260613-4uv-fix-404-error-in-createrequestform-intak/) |
| 260613-51w | Fix submit validation - required answers missing in CreateRequestForm | 2026-06-12 | 8bc5457 | Verified | [260613-51w](./quick/260613-51w-fix-submit-validation-required-answers-m/) |
| 260613-nts | Fix pagination missing next/prev buttons on admin users page | 2026-06-13 | 3bb72db | Verified | [260613-nts](./quick/260613-nts-ph-n-trang-nh-ng-thi-u-next-sang-trang-m/) |
| 260613-nxg | Fix admin requests page layout/style to match template | 2026-06-13 | c0d3aed | Verified | [260613-nxg](./quick/260613-nxg-fix-admin-requests-page-layout-style-to-/) |
| 260613-ops-fix | Fix admin operations page bugs - menu link, timeline scroll | 2026-06-13 | b499c0d | Verified | [260613-ops-fix](./quick/260613-ops-fix/) |
| 260613-lgc | Migrate src/legacy to src/components and delete legacy | 2026-06-13 | c12e290 | Verified | [260613-lgc](./quick/260613-lgc-migrate-src-legacy-to-src-components/) |
| 260614-fix | Fix messages poll - merge threads instead of replace | 2026-06-14 | 8d0d2ca | Verified | [260614-fix](./quick/260614-fix-messages-poll/) |
| 260614-msg | Enhance msg-list display with sender colors and names | 2026-06-14 | 8750354 | - | - |

---
*Last updated: 2026-06-14*
