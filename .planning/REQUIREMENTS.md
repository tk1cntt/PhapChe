# Requirements: GitNexus Legal — v1.4 Template Parity

**Defined:** 2026-06-10
**Milestone:** v1.4 Template Parity — Full Coverage
**Core Value:** SME gửi yêu cầu pháp lý đơn giản như nhắn tin và nhận tài liệu/tư vấn đã qua kiểm soát chất lượng, có thể truy vết toàn bộ quá trình xử lý.

## Testing Requirements

### Per-Screen Test Coverage

Mỗi màn hình phase phải có đầy đủ test coverage:

| Test Type | Description | Coverage Target |
|-----------|-------------|----------------|
| **Whitebox** | Unit tests cho components, hooks, utilities | ≥80% line coverage |
| **Blackbox** | Integration tests cho API endpoints, database queries | ≥90% endpoint coverage |
| **Abnormal** | Edge cases, boundary conditions, empty states | All user flows covered |
| **Error** | Error boundaries, fallback UI, retry logic | All error paths covered |
| **E2E** | Full user flows từ UI → DB → UI | All critical paths |

### Data Rules

**Strict DB-only data:**
- ✅ Tất cả sample data phải insert vào SQLite qua Prisma seed scripts
- ✅ Hiển thị từ database queries
- ❌ Không hardcode bất kỳ giá trị nào trong UI components
- ❌ Không mock data trong components (chỉ mock trong unit tests nếu cần)

### Database Seeding

Mỗi phase cần có seed script tạo:
- Sample workspaces (An Phát, Minh Khang, Internal)
- Sample users với roles (128 users total)
- Sample requests với statuses
- Sample vault files với folders/tags
- Sample audit events

### E2E Test Requirements

- Playwright tests cho every user flow
- Coverage minimum 90% lines/statement
- Tests phải chạy trên CI
- Data reset giữa các tests

## v1.4 Requirements

### User Portal

#### Customer Dashboard (user-dashboard.html)

- [ ] **CUST-DASH-01**: Display 4 stat cards (Tổng hồ sơ: 12, Đang xử lý: 3, Đã hoàn tất: 8, Tài liệu vault: 36) with matching icons and colors
- [ ] **CUST-DASH-02**: Display welcome banner with workspace status message
- [ ] **CUST-DASH-03**: Display case list with status badges (Đang review, Cần phản hồi, Đã duyệt)
- [ ] **CUST-DASH-04**: Display deadline/SLA panel with progress bars
- [ ] **CUST-DASH-05**: Display recent documents panel with file type badges (PDF, DOC)
- [ ] **CUST-DASH-06**: Display activity timeline with relative timestamps (12 phút, 38 phút, 2 giờ)
- [ ] **CUST-DASH-07**: Display full requests table with 7 columns (mã, loại, trạng thái, phụ trách, cập nhật, SLA, thao tác)
- [ ] **CUST-DASH-08**: Table shows 4 sample rows matching template data (REQ-2026-021, 019, 018, 016)
- [ ] **CUST-DASH-09**: Toolbar with search and filter buttons functional
- [ ] **CUST-DASH-10**: Floating chat button visible with "2 Tin mới" notification badge

#### Create Request (user-create-request.html)

- [ ] **CUST-CREATE-01**: Display 4-step wizard (Service→Questions→Docs→Review) with step indicators
- [ ] **CUST-CREATE-02**: Service options display with radio selection (5 service types)
- [ ] **CUST-CREATE-03**: Service cards show tags (Khuyến nghị, Nhanh, IP, Cần tài liệu, Phân loại)
- [ ] **CUST-CREATE-04**: Sidebar summary panel shows selected service and workspace info
- [ ] **CUST-CREATE-05**: Checklist panel displays 4 preparation items with checkmarks
- [ ] **CUST-CREATE-06**: Form fields for workspace, priority, contact info functional

#### My Cases (user-cases.html)

- [ ] **CUST-CASES-01**: Summary banner shows total cases message
- [ ] **CUST-CASES-02**: 4 stats cards display (Tổng: 12, Đang xử lý: 3, Hoàn tất: 8, Quá hạn: 1)
- [ ] **CUST-CASES-03**: Toolbar with search, filters, status/loại dropdowns functional
- [ ] **CUST-CASES-04**: Requests table shows 7 columns matching template
- [ ] **CUST-CASES-05**: Table rows display sample data (REQ-2026-021, 019, 018, 016, 012)

#### Messages (user-messages.html)

- [ ] **CUST-MSG-01**: 3-column layout renders (thread list, chat panel, info panel)
- [ ] **CUST-MSG-02**: Thread list shows 4 sample threads with avatars (HL, QD, MT, KA) and timestamps
- [ ] **CUST-MSG-03**: Chat panel shows message history with in/out styling
- [ ] **CUST-MSG-04**: Info panel shows request metadata (mã, SLA, tài liệu, người tham gia)

#### Workspace (user-workspace.html)

- [ ] **CUST-WS-01**: 4 stats cards display (Workspace: Active, Thành viên: 6, Hồ sơ: 12, Vault scope: 96%)
- [ ] **CUST-WS-02**: Workspace banner shows company name (Công ty An Phát) and description
- [ ] **CUST-WS-03**: Member grid displays 4 sample members with role badges (Owner, Finance, Legal Contact, Viewer)
- [ ] **CUST-WS-04**: Permission/security panel shows tenant isolation info

#### Settings (user-settings.html)

- [ ] **CUST-SET-01**: Settings menu shows 6 tabs (Hồ sơ cá nhân, Bảo mật đăng nhập, Thông báo, Workspace, Ngôn ngữ & giao diện, Audit cá nhân)
- [ ] **CUST-SET-02**: Profile form shows 6 fields matching template (name, email, phone, title, workspace, timezone)
- [ ] **CUST-SET-03**: Notification toggles display 3 items with on/off states
- [ ] **CUST-SET-04**: Security toggles show 2FA and login alerts options
- [ ] **CUST-SET-05**: 4 stats cards show account status (Account: Active, Security: 2FA, Notifications: 6, Workspace: 1)

### Admin Portal

#### Admin Dashboard (admin-dashboard.html)

- [ ] **ADMIN-DASH-01**: Display 4 stat cards (128 users, 12 workspaces, 6 SLA warnings, 3 alerts) — exact values
- [ ] **ADMIN-DASH-02**: Admin banner shows system status message
- [ ] **ADMIN-DASH-03**: Workload list displays 4 specialists with progress bars and case counts
- [ ] **ADMIN-DASH-04**: Alerts panel shows 4 alert items with badge types (Audit, SLA, Role, Vault)
- [ ] **ADMIN-DASH-05**: Workspace panel shows 3 sample workspaces
- [ ] **ADMIN-DASH-06**: Approvals panel shows 3 pending items
- [ ] **ADMIN-DASH-07**: Audit timeline shows 3 recent entries
- [ ] **ADMIN-DASH-08**: Requests table shows 7 columns and 5 sample rows
- [ ] **ADMIN-DASH-09**: Toolbar filters functional (Status, Workspace dropdowns)
- [ ] **ADMIN-DASH-10**: Floating chat shows "3 Alerts" notification

#### User Management (admin-user-management.html)

- [ ] **ADMIN-USER-01**: Stats show 4 cards (Total Users: 128, Active: 112, Workspaces: 12, Pending: 9)
- [ ] **ADMIN-USER-02**: Role pills display 6 roles with counts (72 customer, 18 specialist, 14 reviewer, 10 coordinator, 4 super_admin, 9 pending)
- [ ] **ADMIN-USER-03**: User table shows 8 columns (checkbox, name, email, role, workspace, status, last active, action)
- [ ] **ADMIN-USER-04**: Table displays 8 sample users matching template (Alex Nguyen, Hà Linh, Quang Dũng, Minh Trang, Mai Phương, Trần Nam, Khánh An, Linh Anh)
- [ ] **ADMIN-USER-05**: Role badges color-coded (red=super_admin, blue=specialist/customer, orange=reviewer, green=coordinator_admin, purple=audit_admin)
- [ ] **ADMIN-USER-06**: Toolbar search and filter dropdowns functional

#### Admin Requests (admin-request.html)

- [ ] **ADMIN-REQ-01**: Stats show 4 cards (Tổng: 18, Đang chờ: 5, Đã duyệt: 9, Ưu tiên cao: 3)
- [ ] **ADMIN-REQ-02**: Requests table shows 6 columns (mã, workspace, khách hàng, trạng thái, loại, phụ trách)
- [ ] **ADMIN-REQ-03**: Table displays 6 sample rows with status badges
- [ ] **ADMIN-REQ-04**: Priority badges show High/Medium/Low styling
- [ ] **ADMIN-REQ-05**: Toolbar search and filter functional

#### Admin Operations (admin-operations.html)

- [ ] **ADMIN-OPS-01**: Stats show 4 cards (Hồ sơ đang mở: 24, Sắp quá SLA: 6, Hoàn tất hôm nay: 11, Cảnh báo: 3)
- [ ] **ADMIN-OPS-02**: Workload panel displays 4 specialists with progress bars
- [ ] **ADMIN-OPS-03**: Audit timeline shows 4 recent operations
- [ ] **ADMIN-OPS-04**: Operations table shows 7 columns including SLA bars
- [ ] **ADMIN-OPS-05**: SLA bars color-coded (green=ok, orange=warn, red=danger)
- [ ] **ADMIN-OPS-06**: Toolbar filters functional

#### Admin Audit (admin-audit.html)

- [ ] **ADMIN-AUD-01**: Stats show 4 cards (Tổng sự kiện: 1,284, Thao tác hợp lệ: 1,239, Cần rà soát: 32, Cảnh báo: 7)
- [ ] **ADMIN-AUD-02**: Security notice explains safe display principles
- [ ] **ADMIN-AUD-03**: Security list shows 3 items (Truy cập bị từ chối: 7, Thay đổi role: 12, Audit hoàn chỉnh: 98%)
- [ ] **ADMIN-AUD-04**: Activity timeline shows 4 recent entries
- [ ] **ADMIN-AUD-05**: Audit table shows 7 columns including correlation ID and metadata
- [ ] **ADMIN-AUD-06**: Correlation IDs displayed in monospace font
- [ ] **ADMIN-AUD-07**: Action badges color-coded by type

#### Admin Vault (admin-vault.html)

- [ ] **ADMIN-VAULT-01**: Stats show 4 cards (Tổng thư mục: 12, Tệp pháp lý: 248, Thẻ phân loại: 18, Bảo mật: 96%)
- [ ] **ADMIN-VAULT-02**: Folder panel shows 4 sample folders with file counts
- [ ] **ADMIN-VAULT-03**: Tag panel shows 4 sample tags with file counts
- [ ] **ADMIN-VAULT-04**: Vault table shows 7 columns (tên, thư mục, thẻ, workspace, chủ sở hữu, bảo mật, thao tác)
- [ ] **ADMIN-VAULT-05**: Table displays 6 sample files
- [ ] **ADMIN-VAULT-06**: Security badges show encryption/permission status

#### Admin Workspace (admin-workspace.html)

- [ ] **ADMIN-WS-01**: Permission card shows workspace scope and security info
- [ ] **ADMIN-WS-02**: Workspace table shows permissions and member counts
- [ ] **ADMIN-WS-03**: Sample workspaces include An Phát, Minh Khang, Internal
- [ ] **ADMIN-WS-04**: Toolbar search and filter functional

## v2 Requirements

### AI Features

- **AI-01**: OCR tự động nhận dạng giấy tờ upload
- **AI-02**: AI đề xuất loại nghiệp vụ và trường intake từ file upload
- **AI-03**: AI tóm tắt hồ sơ cho specialist với citation
- **AI-04**: AI draft section từ template/clause library
- **AI-05**: AI flag rủi ro trước khi reviewer review

### Integration

- **INT-01**: Tích hợp e-sign (ký số)
- **INT-02**: Compliance calendar với reminders
- **INT-03**: Billing automation

## Out of Scope

| Feature | Reason |
|---------|--------|
| AI tự kết luận pháp lý | Rủi ro sai luật và liability cao |
| Open lawyer marketplace | Khó kiểm soát chất lượng |
| Workflow builder tùy biến | Overbuild; dùng state machine cố định |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CUST-DASH-01..10 | Phase 26 | Pending |
| CUST-CREATE-01..06 | Phase 27 | Pending |
| CUST-CASES-01..05 | Phase 28 | Pending |
| CUST-MSG-01..04 | Phase 29 | Pending |
| CUST-WS-01..04 | Phase 30 | Pending |
| CUST-SET-01..05 | Phase 31 | Pending |
| ADMIN-DASH-01..10 | Phase 32 | Pending |
| ADMIN-USER-01..06 | Phase 33 | Pending |
| ADMIN-REQ-01..05 | Phase 34 | Pending |
| ADMIN-OPS-01..06 | Phase 35 | Pending |
| ADMIN-AUD-01..07 | Phase 36 | Pending |
| ADMIN-VAULT-01..06 | Phase 37 | Pending |
| ADMIN-WS-01..04 | Phase 38 | Pending |

**Coverage:**
- v1.4 requirements: 78 total
- Mapped to phases: 78
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-10*
*Last updated: 2026-06-10 after v1.4 milestone initialized*
