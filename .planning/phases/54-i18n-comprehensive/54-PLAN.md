---
wave: 1
depends_on: []
autonomous: true
requirements_addressed:
  - REQ-i18n-01
  - REQ-i18n-02
  - REQ-i18n-03
files_modified:
  - src/components/dashboard/*.tsx
  - src/components/layout/*.tsx
  - src/messages/vi.json
  - src/messages/en.json
  - src/messages/zh.json
  - src/messages/ja.json
---

# Phase 54: i18n Comprehensive Migration

## Objective

Replace all hardcoded Vietnamese/English strings in src/components with i18n translation keys using next-intl. Support 4 languages: vi, en, zh, ja.

## Scope

**41 components** need i18n migration across these groups:
- Dashboard (6 files)
- Layout (3 files)
- Admin (15 files)
- My Cases (5 files)
- Messages (5 files)
- Settings (8 files)
- Create Request (7 files)
- Workspace (4 files)
- Auth (1 file)
- UI Components (5 files)

## Wave Structure

### Wave 1: Dashboard + Layout Components (Priority: HIGH)
**Files:** 8 files
- Dashboard: WelcomeBanner, RecentDocuments, RecentCases, DeadlineSLA, ActivityTimeline
- Layout: UserLayout, LanguageSwitcher, AdminLayout (remaining)

**Tasks:**

<task>
<read_first>
- src/components/dashboard/WelcomeBanner.tsx
- src/messages/vi.json
</read_first>
<action>
Add Dashboard namespace translations to all 4 language files, then update WelcomeBanner.tsx:
1. Add `useTranslations('Dashboard')` import
2. Replace hardcoded strings with t() calls:
   - "Workspace của bạn đang hoạt động ổn định" → t('workspace.statusOk')
   - "hồ sơ đang được xử lý" → t('requests.processing', {count})
   - "tài liệu cần xác nhận" → t('documents.pendingConfirm', {count})
   - "phản hồi mới từ chuyên viên pháp lý" → t('replies.newFromSpecialist', {count})
   - "Workspace hoạt động bình thường" → t('workspace.statusNormal')
   - "Xem tài liệu" → t('actions.viewDocuments')
   - "Gửi phản hồi" → t('actions.sendFeedback')
</action>
<acceptance_criteria>
- WelcomeBanner.tsx imports useTranslations('Dashboard')
- All 7 hardcoded strings replaced with t() calls
- vi.json, en.json, zh.json, ja.json contain Dashboard.workspace.* keys
</acceptance_criteria>
</task>

<task>
<read_first>
- src/components/dashboard/RecentDocuments.tsx
- src/messages/vi.json
</read_first>
<action>
Update RecentDocuments.tsx:
1. Add `useTranslations('Dashboard')` import
2. Replace hardcoded strings:
   - "Tài liệu gần đây" → t('recentDocuments.title')
   - "Mở vault →" → t('recentDocuments.openVault')
   - "Không có tài liệu nào" → t('recentDocuments.empty')
   - "cập nhật" → t('common.updatedAt')
3. Add translation keys for status badges:
   - "Đã mã hóa" → t('status.encrypted')
   - "Cần xem" → t('status.pendingReview')
   - "Đã lưu trữ" → t('status.archived')
</action>
<acceptance_criteria>
- RecentDocuments.tsx uses t() for panel title, empty state, links
- Status badge text uses Common namespace or Dashboard status keys
- All 4 language files updated
</acceptance_criteria>
</task>

<task>
<read_first>
- src/components/dashboard/RecentCases.tsx
- src/messages/vi.json
</read_first>
<action>
Update RecentCases.tsx:
1. Add `useTranslations('Dashboard')` import
2. Replace hardcoded strings:
   - "Hồ sơ đang xử lý" → t('recentCases.title')
   - "Xem tất cả →" → t('recentCases.seeAll')
   - "Không có hồ sơ nào đang xử lý" → t('recentCases.empty')
   - "Mở →" → t('actions.open')
</action>
<acceptance_criteria>
- RecentCases.tsx uses t() for title, link, empty state
- All 4 language files updated
</acceptance_criteria>
</task>

<task>
<read_first>
- src/components/dashboard/DeadlineSLA.tsx
- src/messages/vi.json
</read_first>
<action>
Update DeadlineSLA.tsx:
1. Add `useTranslations('Dashboard')` import
2. Replace hardcoded strings:
   - "Deadline & SLA" → t('deadline.title')
   - "Không có deadline nào trong tuần này" → t('deadline.empty')
   - "Cần xử lý ngay" → t('deadline.urgent')
   - "Sắp đến hạn" → t('deadline.warning')
   - "Còn thời gian" → t('deadline.safe')
</action>
<acceptance_criteria>
- DeadlineSLA.tsx uses t() for title, empty state, status notes
- All 4 language files updated
</acceptance_criteria>
</task>

<task>
<read_first>
- src/components/dashboard/ActivityTimeline.tsx
- src/messages/vi.json
</read_first>
<action>
Update ActivityTimeline.tsx:
1. Add `useTranslations('Dashboard')` import
2. Replace hardcoded strings:
   - "Hoạt động gần đây" → t('activity.title')
   - "Không có hoạt động nào" → t('activity.empty')
</action>
<acceptance_criteria>
- ActivityTimeline.tsx uses t() for title and empty state
- All 4 language files updated
</acceptance_criteria>
</task>

<task>
<read_first>
- src/components/layout/UserLayout.tsx
- src/messages/vi.json
</read_first>
<action>
Update UserLayout.tsx:
1. Check existing i18n usage (Nav namespace for nav items)
2. Replace hardcoded strings:
   - "Đăng xuất" → t('signOut') in Actions namespace (already exists)
   - Help card: "Need help?" → t('needHelp'), "View docs & guides →" → t('viewGuide')
3. Update Dashboard namespace for UserDashboard.needHelp, UserDashboard.viewGuide
</action>
<acceptance_criteria>
- UserLayout.tsx uses t() for logout label and help card
- UserDashboard namespace has needHelp and viewGuide keys
</acceptance_criteria>
</task>

<task>
<read_first>
- src/components/layout/LanguageSwitcher.tsx
- src/messages/vi.json
</read_first>
<action>
Update LanguageSwitcher.tsx:
1. Keep language labels hardcoded (flags + native names are language-specific)
2. Add tooltip: "Đổi ngôn ngữ" → t('switchLanguage') from Language namespace
3. Add screen reader text if needed
</action>
<acceptance_criteria>
- LanguageSwitcher.tsx uses t() for tooltip/screen reader text
- Language namespace has switch key in all 4 files
</acceptance_criteria>
</task>

<task>
<read_first>
- src/components/layout/AdminLayout.tsx
- src/messages/vi.json
</read_first>
<action>
Update AdminLayout.tsx (remaining hardcoded):
1. "Need help?" → t('helpCard.needHelp') in AdminNav namespace
2. "View docs & guides →" → t('helpCard.viewGuide')
3. "Admin Dashboard" → t('adminDashboard.title') or use from context
4. "Đăng xuất" → tCommon('signOut') (use Common namespace)
</action>
<acceptance_criteria>
- AdminLayout.tsx uses t() for help card and logout
- AdminNav namespace has helpCard.needHelp and helpCard.viewGuide
</acceptance_criteria>
</task>

---

### Wave 2: Admin Components (Priority: HIGH)
**Files:** 15 files in src/components/admin/

**Tasks:**

<task>
<read_first>
- src/components/admin/AdminRequestsClient.tsx
- src/components/admin/AdminRequestsTable.tsx
- src/messages/vi.json
</read_first>
<action>
1. Add AdminRequests namespace to all 4 language files
2. Update AdminRequestsClient.tsx - add t() for page title, filters
3. Update AdminRequestsTable.tsx - add t() for column headers, empty state, pagination
4. Keys needed: pageTitle, searchPlaceholder, status.*, priority.*, empty, pagination.*
</action>
<acceptance_criteria>
- AdminRequestsClient.tsx and AdminRequestsTable.tsx use t() calls
- All 4 language files contain AdminRequests namespace
</acceptance_criteria>
</task>

<task>
<read_first>
- src/components/admin/AdminOperationsClient.tsx
- src/components/admin/AdminOperationsStats.tsx
- src/components/admin/AdminOperationsTable.tsx
- src/components/admin/AdminOperationsTimeline.tsx
- src/messages/vi.json
</read_first>
<action>
1. Add AdminOperations namespace to all 4 language files
2. Update all 4 files with t() calls
3. Keys needed: pageTitle, stats.*, table.*, timeline.*, empty, specialist.*
</action>
<acceptance_criteria>
- All 4 Operations files use t() calls
- All 4 language files contain AdminOperations namespace
</acceptance_criteria>
</task>

<task>
<read_first>
- src/components/admin/AdminAuditClient.tsx
- src/components/admin/AdminAuditStats.tsx
- src/components/admin/AdminAuditTable.tsx
- src/components/admin/AdminAuditTimeline.tsx
- src/messages/vi.json
</read_first>
<action>
1. Add AdminAudit namespace to all 4 language files
2. Update all 4 files with t() calls
3. Keys needed: pageTitle, stats.*, table.*, timeline.*, security.*
</action>
<acceptance_criteria>
- All 4 Audit files use t() calls
- All 4 language files contain AdminAudit namespace
</acceptance_criteria>
</task>

<task>
<read_first>
- src/components/admin/AdminVaultClient.tsx
- src/components/admin/AdminVaultStats.tsx
- src/components/admin/AdminVaultFilesTable.tsx
- src/components/admin/AdminVaultFoldersPanel.tsx
- src/components/admin/AdminVaultTagsPanel.tsx
- src/messages/vi.json
</read_first>
<action>
1. Add AdminVault namespace to all 4 language files
2. Update all files with t() calls
3. Keys needed: pageTitle, stats.*, table.*, folders.*, tags.*, security.*
</action>
<acceptance_criteria>
- All Vault-related files use t() calls
- All 4 language files contain AdminVault namespace
</acceptance_criteria>
</task>

<task>
<read_first>
- src/components/admin/AdminWorkspaceClient.tsx
- src/components/admin/AdminBanner.tsx
- src/components/admin/AdminToolbar.tsx
- src/components/admin/WorkloadPanel.tsx
- src/components/admin/AlertPanel.tsx
- src/components/admin/ApprovalPanel.tsx
- src/components/admin/WorkspacePanel.tsx
- src/components/admin/AuditTimeline.tsx
- src/messages/vi.json
</read_first>
<action>
1. Add AdminDashboard namespace for shared components
2. Update all files with t() calls
3. Keys needed: banner.*, toolbar.*, panels.*, workload.*, alerts.*, approvals.*, workspace.*, audit.*
</action>
<acceptance_criteria>
- All shared Admin components use t() calls
- AdminDashboard namespace exists in all 4 language files
</acceptance_criteria>
</task>

---

### Wave 3: My Cases, Messages, Settings (Priority: MEDIUM)
**Files:** 18 files

<task>
<read_first>
- src/components/my-cases/MyCasesClient.tsx
- src/components/my-cases/MyCasesTable.tsx
- src/components/my-cases/MyCasesToolbar.tsx
- src/components/my-cases/SummaryBanner.tsx
- src/components/my-cases/StatCard.tsx
- src/components/my-cases/StatusBadge.tsx
- src/components/my-cases/SlaBadge.tsx
- src/components/my-cases/FloatingChatButton.tsx
- src/messages/vi.json
</read_first>
<action>
1. Add MyCases namespace to all 4 language files
2. Update all 9 files with t() calls
3. Keys needed: pageTitle, summary.*, stats.*, table.*, toolbar.*, badges.*, floatingChat.*
</action>
<acceptance_criteria>
- All MyCases files use t() calls
- All 4 language files contain MyCases namespace
</acceptance_criteria>
</task>

<task>
<read_first>
- src/components/messages/MessagesClient.tsx
- src/components/messages/MessagesContainer.tsx
- src/components/messages/ChatPanel.tsx
- src/components/messages/MessageBubble.tsx
- src/components/messages/ThreadItem.tsx
- src/components/messages/ThreadListPanel.tsx
- src/components/messages/Composer.tsx
- src/components/messages/InfoPanel.tsx
- src/messages/vi.json
</read_first>
<action>
1. Add Messages namespace to all 4 language files
2. Update all 8 files with t() calls
3. Keys needed: pageTitle, threadList.*, chat.*, composer.*, info.*, empty.*
</action>
<acceptance_criteria>
- All Messages files use t() calls
- All 4 language files contain Messages namespace
</acceptance_criteria>
</task>

<task>
<read_first>
- src/components/settings/SettingsMenu.tsx
- src/components/settings/SettingsStats.tsx
- src/components/settings/ProfileForm.tsx
- src/components/settings/SecuritySettings.tsx
- src/components/settings/NotificationSettings.tsx
- src/components/settings/LanguageSettings.tsx
- src/components/settings/ToggleRow.tsx
- src/components/settings/AuditSettings.tsx
- src/messages/vi.json
</read_first>
<action>
1. Add Settings namespace to all 4 language files
2. Update all 9 files with t() calls
3. Keys needed: pageTitle, menu.*, form.*, security.*, notifications.*, language.*, audit.*
</action>
<acceptance_criteria>
- All Settings files use t() calls
- All 4 language files contain Settings namespace
</acceptance_criteria>
</task>

---

### Wave 4: Create Request, Workspace, Auth, UI (Priority: LOW)
**Files:** 17 files

<task>
<read_first>
- src/components/create-request/CreateRequestForm.tsx
- src/components/create-request/IntakeQuestionsForm.tsx
- src/components/create-request/ServiceTypeSelector.tsx
- src/components/create-request/ServiceCard.tsx
- src/components/create-request/WizardSteps.tsx
- src/components/create-request/SummaryPanel.tsx
- src/components/create-request/ChecklistPanel.tsx
- src/components/create-request/FloatingChatButton.tsx
- src/messages/vi.json
</read_first>
<action>
1. Add CreateRequest namespace to all 4 language files
2. Update all 8 files with t() calls
3. Keys needed: pageTitle, wizard.*, service.*, form.*, summary.*, checklist.*
</action>
<acceptance_criteria>
- All CreateRequest files use t() calls
- All 4 language files contain CreateRequest namespace
</acceptance_criteria>
</task>

<task>
<read_first>
- src/components/workspace/WorkspaceBanner.tsx
- src/components/workspace/StatsGrid.tsx
- src/components/workspace/MemberGrid.tsx
- src/components/workspace/ResourceTable.tsx
- src/messages/vi.json
</read_first>
<action>
1. Add Workspace namespace to all 4 language files
2. Update all 4 files with t() calls
3. Keys needed: pageTitle, banner.*, stats.*, members.*, resources.*
</action>
<acceptance_criteria>
- All Workspace files use t() calls
- All 4 language files contain Workspace namespace
</acceptance_criteria>
</task>

<task>
<read_first>
- src/components/auth/SignInForm.tsx
- src/components/ui/ErrorFallback.tsx
- src/components/ui/PageSkeleton.tsx
- src/components/ui/CardSkeleton.tsx
- src/components/ui/Paging.tsx
- src/messages/vi.json
</read_first>
<action>
1. Update SignInForm.tsx with Auth namespace
2. Update UI components with Ui namespace
3. Update Paging with Common.pagination.* keys
</action>
<acceptance_criteria>
- Auth and Ui namespaces exist in all 4 language files
- SignInForm.tsx uses t() for all labels
</acceptance_criteria>
</task>

---

## Verification

1. **Build verification:** `npm run build` passes without missing translation key errors
2. **Coverage check:** Run grep to ensure no remaining hardcoded strings:
   ```bash
   grep -r "hardcoded\|[A-Z][a-z]* [A-Z][a-z]*" src/components --include="*.tsx" | grep -v "\.test\."
   ```
3. **Runtime test:** Switch between 4 languages in UI, verify no missing key warnings in console

## Must-Haves (Goal-Backward)

1. ✅ All 41 components use i18n (no hardcoded strings in render)
2. ✅ All 4 language files (vi, en, zh, ja) contain all required keys
3. ✅ Build passes without translation errors
4. ✅ Language switcher works for all 4 languages

## Artifacts This Phase Produces

- Updated: src/components/dashboard/*.tsx (5 files)
- Updated: src/components/layout/*.tsx (3 files)
- Updated: src/components/admin/*.tsx (15 files)
- Updated: src/components/my-cases/*.tsx (8 files)
- Updated: src/components/messages/*.tsx (8 files)
- Updated: src/components/settings/*.tsx (9 files)
- Updated: src/components/create-request/*.tsx (8 files)
- Updated: src/components/workspace/*.tsx (4 files)
- Updated: src/components/auth/*.tsx (1 file)
- Updated: src/components/ui/*.tsx (5 files)
- Updated: src/messages/vi.json, en.json, zh.json, ja.json
