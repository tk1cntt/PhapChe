---
gsd_state_version: 1.0
milestone: v1.4
milestone_name: Template Parity — Full Coverage
status: Planning
stopped_at: Roadmap created
last_updated: "2026-06-10T16:00:00.000Z"
last_activity: 2026-06-10
progress:
  total_phases: 13
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# State: v1.4 Template Parity — Full Coverage

## Project Reference

**Project:** GitNexus Legal - Legal-as-a-Service Platform
**Core Value:** SME gửi yêu cầu pháp lý đơn giản như nhắn tin và nhận tài liệu/tư vấn đã qua kiểm soát chất lượng, có thể truy vết toàn bộ quá trình xử lý.
**Current Milestone:** v1.4 Template Parity — Full Coverage

## Current Position

**Phase:** Not started (defining requirements)
**Plan:** None (waiting for planning)
**Status:** Ready to plan Phase 26

### v1.4 Progress

```
[Phase 26-38]
Phase 26: Customer Dashboard |                    | 0%
Phase 27: Create Request     |                    | 0%
Phase 28: My Cases          |                    | 0%
Phase 29: Messages          |                    | 0%
Phase 30: Workspace         |                    | 0%
Phase 31: Settings          |                    | 0%
Phase 32: Admin Dashboard   |                    | 0%
Phase 33: User Management   |                    | 0%
Phase 34: Admin Requests    |                    | 0%
Phase 35: Admin Operations  |                    | 0%
Phase 36: Admin Audit      |                    | 0%
Phase 37: Admin Vault      |                    | 0%
Phase 38: Admin Workspace  |                    | 0%
```

## Performance Metrics

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Phases | 13 | 13 | Ready |
| Requirements | 70 | 70 | Mapped |
| Plans | 0 | 13 | Pending |
| Milestone commits | 0 | - | - |

## v1.4 Requirements Summary

| Screen | Phase | Requirements |
|--------|-------|--------------|
| Customer Dashboard | 26 | CUST-DASH-01..10 (10) |
| Create Request | 27 | CUST-CREATE-01..06 (6) |
| My Cases | 28 | CUST-CASES-01..05 (5) |
| Messages | 29 | CUST-MSG-01..04 (4) |
| Workspace | 30 | CUST-WS-01..04 (4) |
| Settings | 31 | CUST-SET-01..05 (5) |
| Admin Dashboard | 32 | ADMIN-DASH-01..10 (10) |
| User Management | 33 | ADMIN-USER-01..06 (6) |
| Admin Requests | 34 | ADMIN-REQ-01..05 (5) |
| Admin Operations | 35 | ADMIN-OPS-01..06 (6) |
| Admin Audit | 36 | ADMIN-AUD-01..03 (3) |
| Admin Vault | 37 | ADMIN-VAULT-01..06 (6) |
| Admin Workspace | 38 | ADMIN-WS-01..04 (4) |

**Total: ~70 requirements across 13 phases**

## Accumulated Context

### Template Sources

All screens must align with HTML templates in `layout/` folder:

**User Portal:**
- `layout/user-dashboard.html` - Stats (12 hồ sơ, 3 đang xử lý, 8 hoàn tất, 36 vault), welcome banner, case list, deadlines, recent docs, activity timeline
- `layout/user-create-request.html` - 4-step wizard, service options, summary sidebar
- `layout/user-cases.html` - Summary banner, stats, toolbar filters, 7-column requests table
- `layout/user-messages.html` - 3-column (thread list, chat panel, info panel)
- `layout/user-workspace.html` - Stats, member grid, permissions, resource table
- `layout/user-settings.html` - Settings menu, profile form, notification toggles

**Admin Portal:**
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
- Sample workspaces: "Công ty An Phát", "Công ty Minh Khang", "Workspace nội bộ"
- Sample users: Alex Nguyen (Super Admin), Hà Linh, Quang Dũng, Minh Trang, Khánh An, Mai Phương

### UI Verification Requirements

Each phase must verify:
1. UI matches template EXACTLY (colors, fonts, spacing, shadows)
2. Sample data matches template values
3. Shared UserLayout/AdminLayout components used
4. e2e test verifies render

## Session Continuity

### Last Session

Milestone v1.4 initialized, expanded scope from 7 admin screens to 13 total (6 user + 7 admin).

### Next Steps

1. Start Phase 26 planning with `/gsd-plan-phase 26`
2. Align user-dashboard.html with template
3. Add e2e test verifying render

### Blockers

None.

---
*Last updated: 2026-06-10*
