# Phase 31: Settings - Context

**Gathered:** 2026-06-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Settings page renders with 6 tabs, profile form, notification toggles, and security settings matching template `layout/user-settings.html` exactly with sample data for user "Mai Phương".

</domain>

<decisions>
## Implementation Decisions

### Stats Cards (D-01)
- 4 stat cards matching template: Tài khoản (Active), Bảo mật (2FA), Thông báo (6), Workspace (1)
- StatCard component reuse with mixed content (text for "Active", "2FA")
- StatCard variant mapping: green for Account, blue for Security, orange for Notifications, purple for Workspace

### Settings Menu Navigation (D-02)
- Tab-based navigation with vertical menu on left (360px width)
- 6 tabs matching template order: Hồ sơ cá nhân, Bảo mật đăng nhập, Thông báo, Workspace, Ngôn ngữ & giao diện, Audit cá nhân
- Active tab: background #ecfdf9, color #087f78
- Inactive tabs: color #64748b

### Profile Form Fields (D-03)
- 6 fields in 2-column grid matching template:
  - Column 1: Họ và tên, Email, Số điện thoại
  - Column 2: Chức danh, Workspace mặc định, Múi giờ
- Field style: height 44px, border 1px solid var(--border), border-radius 8px
- Save button: gradient background (green teal), "Lưu thay đổi"

### Notification Toggles (D-04)
- 3 toggle rows matching template:
  - Email khi chuyên viên phản hồi (on)
  - Nhắc SLA trước hạn (on)
  - Tóm tắt hàng tuần (off)
- Toggle style: 46x26px, green when on, gray when off
- Each toggle has title (bold) and description text

### Security Toggles (D-05)
- 2 toggle rows + password change button:
  - Xác thực 2 bước (on) - OTP email
  - Thông báo đăng nhập lạ (on)
- Password change button: ghost style, "Đổi mật khẩu"

### Floating Chat Button (D-06)
- Position: fixed right:22px, bottom:20px
- Red gradient background with yellow border
- Badge: "2 Tin mới"
- Reuse FloatingChatButton component pattern from Phase 26

### Page Layout (D-07)
- Content grid: settings-grid with 360px menu + 1fr form
- Content padding: 31px 36px 42px
- Gap between elements: 20px

### Data Source (D-08)
- All data from database queries via Prisma (User, UserSettings models)
- Sample user: "Mai Phương" with workspace "Công ty An Phát"
- No hardcoded data in components - fetch from DB

### Sample Data Values (D-09)
- User: Mai Phương, mai.phuong@anphat.vn, +84 912 345 678, Head of Legal Operations
- Settings: 2FA on (OTP email), 6 notification channels active
- Workspace: "Công ty An Phát" (an-phat)
- Timezone: Asia/Ho_Chi_Minh (ICT)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Templates
- `layout/user-settings.html` — Full template with all UI elements, colors, spacing, and sample data

### Phase Requirements
- `.planning/REQUIREMENTS.md` §CUST-SET-01..05 — 5 requirements for Settings screen

### Existing Components
- `src/app/[locale]/customer/components/UserLayout.tsx` — Layout wrapper with sidebar/topbar
- `src/app/[locale]/customer/components/StatCard.tsx` — Reusable stat card component
- `src/app/[locale]/customer/components/FloatingChatButton.tsx` — Floating chat button

### Database Schema
- `prisma/schema.prisma` — User, UserSettings models

</canonical_refs>

<codebase_context>
## Existing Code Insights

### Reusable Assets
- `StatCard` component: Can reuse with mixed icon/text content
- `FloatingChatButton` component: Exists and can be reused
- `UserLayout` component: Sidebar navigation already configured

### Established Patterns
- Stats grid: 4-column layout with stat cards
- Panel style: border-radius: 15px, border: 1px solid var(--border), box-shadow
- Toggle row style: flex justify-between, border 1px solid #edf2f7
- Form grid: 2-column layout with gap 16px

### Integration Points
- Route: `src/app/[locale]/[workspaceSlug]/settings/page.tsx`
- Components go in: `src/app/[locale]/customer/components/Settings/`
- Database queries via Prisma in page component
</codebase_context>

<specifics>
## Specific Ideas

- Toggle animation: smooth transition when switching on/off
- Active tab indicator uses background color change, not border
- Save button has gradient teal background matching brand colors
- Password change is a separate action, not inline form

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 31-settings*
*Context gathered: 2026-06-11*
