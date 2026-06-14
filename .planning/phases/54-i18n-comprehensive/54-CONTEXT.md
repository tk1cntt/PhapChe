# Phase 54: i18n Comprehensive Migration - Context

**Gathered:** 2026-06-14
**Status:** Ready for planning
**Source:** Quick task analysis + codebase scan

## Phase Boundary

Thay thế tất cả hardcoded strings (tiếng Việt/tiếng Anh) trong src/components bằng i18n translation keys sử dụng next-intl. Phase này đảm bảo tất cả UI text có thể thay đổi theo ngôn ngữ (vi, en, zh, ja).

## Implementation Decisions

### Namespace Strategy
- Mỗi component/page có namespace riêng (VD: `Dashboard`, `MyCases`, `AdminRequests`)
- Common strings dùng namespace `Common` đã có
- Navigation labels dùng `AdminNav` / `Nav`
- Status texts dùng `RequestStatus` đã có

### Translation Key Naming Convention
```
namespace.section.element
VD: dashboard.recentDocuments.title
VD: dashboard.recentDocuments.openVault
VD: dashboard.activity.empty
VD: myCases.caseList.seeAll
VD: admin.requests.status.pending
```

### Components cần migrate (41 files):
1. **Dashboard (6 files):**
   - WelcomeBanner.tsx → Dashboard namespace
   - RecentDocuments.tsx → Dashboard namespace
   - RecentCases.tsx → Dashboard namespace
   - DeadlineSLA.tsx → Dashboard namespace
   - ActivityTimeline.tsx → Dashboard namespace
   - StatCard.tsx (check if needed)

2. **Layout (3 files):**
   - AdminLayout.tsx → AdminNav namespace (partially done)
   - UserLayout.tsx → Nav namespace (check remaining)
   - LanguageSwitcher.tsx → Language namespace

3. **Admin Components (15+ files):**
   - AdminRequestsClient.tsx, AdminRequestsTable.tsx
   - AdminOperationsClient.tsx, AdminOperationsStats.tsx, AdminOperationsTable.tsx, AdminOperationsTimeline.tsx
   - AdminAuditClient.tsx, AdminAuditStats.tsx, AdminAuditTable.tsx
   - AdminVaultClient.tsx, AdminVaultStats.tsx, AdminVaultFilesTable.tsx
   - AdminWorkspaceClient.tsx
   - AdminBanner.tsx, AdminToolbar.tsx, AuditTimeline.tsx, AlertPanel.tsx, etc.

4. **My Cases (4 files):**
   - MyCasesClient.tsx, MyCasesTable.tsx, MyCasesToolbar.tsx
   - FloatingChatButton.tsx
   - StatusBadge.tsx, SlaBadge.tsx, Badge.tsx, StatCard.tsx, SummaryBanner.tsx

5. **Messages (5 files):**
   - MessagesClient.tsx, MessagesContainer.tsx
   - ChatPanel.tsx, MessageBubble.tsx, ThreadItem.tsx, ThreadListPanel.tsx, Composer.tsx, InfoPanel.tsx

6. **Settings (8 files):**
   - SettingsMenu.tsx, SettingsStats.tsx, ProfileForm.tsx
   - SecuritySettings.tsx, NotificationSettings.tsx, LanguageSettings.tsx
   - ToggleRow.tsx, AuditSettings.tsx
   - AuditSection.tsx, LanguageSection.tsx, ProfileSection.tsx, WorkspaceSection.tsx

7. **Create Request (7 files):**
   - CreateRequestForm.tsx, IntakeQuestionsForm.tsx
   - ServiceTypeSelector.tsx, ServiceCard.tsx, WizardSteps.tsx
   - SummaryPanel.tsx, ChecklistPanel.tsx
   - FloatingChatButton.tsx (user side)

8. **Workspace (4 files):**
   - WorkspaceBanner.tsx, StatsGrid.tsx, MemberGrid.tsx, ResourceTable.tsx

9. **Auth (1 file):**
   - SignInForm.tsx

10. **UI Components:**
    - ErrorFallback.tsx, PageSkeleton.tsx, CardSkeleton.tsx
    - Paging.tsx

## Claude's Discretion

### Translation approach
- Sử dụng `useTranslations('Namespace')` cho mỗi component
- Nếu component nhỏ (<50 lines), có thể gom chung vào namespace của page cha
- Empty states và error messages cũng cần translate

### Tên slug
- Slug: `i18n-comprehensive`
- Phase number: 54

### Translation files cần update
- src/messages/vi.json
- src/messages/en.json
- src/messages/zh.json
- src/messages/ja.json

### Priority
1. Dashboard components (user-facing, high visibility)
2. Layout components (navigation)
3. Admin components
4. Settings, My Cases, Messages
5. Create Request, Workspace, Auth

## Specific Ideas

### Hardcoded strings đã phát hiện:

**WelcomeBanner.tsx:**
- "Workspace của bạn đang hoạt động ổn định"
- "Workspace hoạt động bình thường"
- "hồ sơ đang được xử lý"
- "tài liệu cần xác nhận"
- "phản hồi mới từ chuyên viên pháp lý"
- "Xem tài liệu", "Gửi phản hồi"

**RecentDocuments.tsx:**
- "Tài liệu gần đây"
- "Mở vault →"
- "Không có tài liệu nào"
- "cập nhật"
- Status: "Đã mã hóa", "Cần xem", "Đã lưu trữ"

**RecentCases.tsx:**
- "Hồ sơ đang xử lý"
- "Xem tất cả →"
- "Không có hồ sơ nào đang xử lý"
- "Mở →"

**DeadlineSLA.tsx:**
- "Deadline & SLA"
- "Không có deadline nào trong tuần này"
- "Cần xử lý ngay"
- "Sắp đến hạn"
- "Còn thời gian"

**ActivityTimeline.tsx:**
- "Hoạt động gần đây"
- "Không có hoạt động nào"

**AdminLayout.tsx (còn hardcoded):**
- "Need help?", "View docs & guides →"
- "Admin Dashboard" (topbar title)
- "Đăng xuất" (user menu)

**LanguageSwitcher.tsx:**
- "Tiếng Việt", "English", "中文", "日本語" (labels)

## Deferred Ideas

- Automated i18n testing (visual regression)
- Translation memory / glossary management
- RTL support (future)
