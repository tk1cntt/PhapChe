---
quick_id: 260613-nxg
status: complete
date: 2026-06-13
commit: c0d3aed
---

# Summary: Fix Admin Requests Page Layout/Style

## Completed Tasks

### Task 1: Update Table Columns ✅
- **File:** `src/components/admin/AdminRequestsTable.tsx`
- Changed from: Mã hồ sơ, Workspace, Khách hàng, Trạng thái, Người phụ trách, SLA, Thao tác
- Changed to: Mã hồ sơ, Workspace, Khách hàng, Trạng thái, Loại yêu cầu, Phụ trách, Thao tác
- Updated grid template to `0.9fr 1.1fr 1.1fr 1fr 1.1fr 1.2fr 1fr`
- Added translations prop for i18n support

### Task 2: Update Page Header and Create Button ✅
- **File:** `src/components/admin/AdminRequestsClient.tsx`
- Added proper page title: "Hồ sơ yêu cầu"
- Added subtitle about backend workflow
- Added blue gradient create button: `linear-gradient(180deg, #3ba3e7, #2389d0)`

### Task 3: Add Floating SLA Warning Button ✅
- **File:** `src/components/admin/AdminRequestsClient.tsx`
- Added floating red button with yellow border
- Shows when `stats.highPriority > 0`
- Matches template: red gradient, yellow border, "N" badge with issue count

## Changes Made
- 2 files changed: `AdminRequestsClient.tsx`, `AdminRequestsTable.tsx`
- +114 lines, -40 lines
- Commit: `c0d3aed`

## Verification
- Refresh `/vi/admin/requests` page
- Check: Table has 7 columns matching template
- Check: Header with proper title and blue create button
- Check: Floating SLA warning button (when high priority)
