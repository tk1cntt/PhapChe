# Requirements: Legal-as-a-Service Platform

**Defined:** 2026-06-10
**Milestone:** v1.3 Template Parity
**Core Value:** SME gửi yêu cầu pháp lý theo cách đơn giản như nhắn tin và nhận tài liệu/tư vấn đã qua kiểm soát chất lượng, có thể truy vết toàn bộ quá trình xử lý.

## v1.3 Requirements (Template Parity)

Requirements for aligning admin screens with HTML templates in layout/ folder. Each screen = 1 phase.

### Admin Dashboard (admin-dashboard.html)

- [ ] **DASH-01**: Display 4 stat cards (Total Users: 128, Workspaces: 12, SLA Warnings: 6, Audit Alerts: 3) with matching icons and colors
- [ ] **DASH-02**: Display Admin Banner with status message "Hệ thống đang hoạt động ổn định" and action buttons
- [ ] **DASH-03**: Display Workload Panel with progress bars for 4 team members (Hà Linh, Quang Dũng, Minh Trang, Khánh An)
- [ ] **DASH-04**: Display Alerts Panel with 4 alert items (Audit, SLA, Role, Vault)
- [ ] **DASH-05**: Display Workspace Panel with 3 workspace items
- [ ] **DASH-06**: Display Approval Panel with 3 pending items
- [ ] **DASH-07**: Display Audit Timeline with 3 recent events
- [ ] **DASH-08**: Display Toolbar with search, filters, status dropdown, workspace dropdown
- [ ] **DASH-09**: Display Requests Table with 5 sample rows including SLA countdown
- [ ] **DASH-10**: Display Floating Chat button with "3 Alerts" badge

### User Management (admin-user-management.html)

- [ ] **USER-01**: Display 4 stat cards (Total Users: 128, Active: 112, Workspaces: 12, Pending: 9) with matching icons
- [ ] **USER-02**: Display Role Pills for 6 roles (customer: 72, specialist: 18, reviewer: 14, coordinator_admin: 10, super_admin: 4, invited: 9)
- [ ] **USER-03**: Display User Table with 8 columns (checkbox, name, email, role, workspace, status, last active, action)
- [ ] **USER-04**: Display sample users with avatar initials and badge colors per role
- [ ] **USER-05**: Display Toolbar with search, filters, role dropdown, workspace dropdown
- [ ] **USER-06**: Display table with 8 sample rows (Alex Nguyen, Hà Linh, Quang Dũng, Minh Trang, Mai Phương, Trần Nam, Khánh An, Linh Anh)

### Admin Requests (admin-request.html)

- [ ] **REQ-01**: Display 4 stat cards (Total: 18, Pending: 5, Approved: 9, High Priority: 3)
- [ ] **REQ-02**: Display Toolbar with search, filters, status dropdown, workspace dropdown
- [ ] **REQ-03**: Display Requests Table with 7 columns (code, workspace, customer, status, type, assignee, action)
- [ ] **REQ-04**: Display sample request rows with status badges and action links
- [ ] **REQ-05**: Display Create Request button (blue variant)

### Admin Operations (admin-operations.html)

- [ ] **OPS-01**: Display 4 stat cards (Open: 24, SLA Warnings: 6, Completed: 11, Audit Alerts: 3)
- [ ] **OPS-02**: Display Workload Overview Panel with progress bars for 4 team members
- [ ] **OPS-03**: Display Audit Timeline Panel with 4 recent events
- [ ] **OPS-04**: Display Toolbar with search, filters, SLA dropdown, assignee dropdown
- [ ] **OPS-05**: Display Requests Table with SLA progress bars per row
- [ ] **OPS-06**: Display 6 sample rows with case codes and SLA indicators

### Admin Audit (admin-audit.html)

- [ ] **AUD-01**: Display Audit Events Table with columns (time, actor, workspace, action, target, correlationId, metadata)
- [ ] **AUD-02**: Display Security Note card with permission warning message
- [ ] **AUD-03**: Display sample audit events matching template format

### Admin Vault (admin-vault.html)

- [ ] **VAULT-01**: Display 4 stat cards (Total Folders: 12, Legal Files: 248, Tags: 18, Security: 96%)
- [ ] **VAULT-02**: Display Folder Panel with 4 folders (Customer Contracts, NDA, Internal Compliance, Dispute)
- [ ] **VAULT-03**: Display Tag Panel with 4 tags (Contract Review, Urgent SLA, Internal Only, Compliance)
- [ ] **VAULT-04**: Display Toolbar with vault search and folder/tag filters
- [ ] **VAULT-05**: Display Files Table with 7 columns (name, folder, tag, workspace, owner, security, action)
- [ ] **VAULT-06**: Display 5 sample file rows with file icons (PDF, DOC, XLS, ZIP) and status badges

### Admin Workspace (admin-workspace.html)

- [ ] **WS-01**: Display Permission Card with access boundary warning message
- [ ] **WS-02**: Display Workspace Table with 4 columns (name, slug, members, status)
- [ ] **WS-03**: Display 3 sample workspace rows with workspace icons and status badges
- [ ] **WS-04**: Display Create Workspace buttons (primary and secondary)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Template HTML/CSS refactoring | Pure UI alignment, not new features |
| Backend API changes | Data is mock/sample, APIs already exist |
| Authentication changes | Already implemented in v1.1 |
| New business logic | Scope is UI parity only |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DASH-01..10 | Phase 26 | Pending |
| USER-01..06 | Phase 27 | Pending |
| REQ-01..05 | Phase 28 | Pending |
| OPS-01..06 | Phase 29 | Pending |
| AUD-01..03 | Phase 30 | Pending |
| VAULT-01..06 | Phase 31 | Pending |
| WS-01..04 | Phase 32 | Pending |

**Coverage:**
- v1.3 requirements: 37 total
- Mapped to phases: 37
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-10*
*Last updated: 2026-06-10 after v1.3 milestone initialized*
