---
phase: quick-260609-qnu
plan: 01
subsystem: testing
tags: [playwright, e2e, screenshots, i18n, localized-routes]

# Dependency graph
requires: []
provides:
  - Fix localized flag for admin, specialist, and reviewer screens so i18n screenshot capture works without 404
affects: [e2e-screenshots]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Routes outside [locale] directory must have localized: false to prevent locale prefix in URLs"

key-files:
  modified:
    - e2e/all-screens-i18n-screenshots.spec.ts

key-decisions:
  - "Admin/specialist/reviewer routes nằm ngoài src/app/[locale]/ nên cần localized: false — sửa 10 screen"
  - "Giữ nguyên localized: true cho public screens (home, intake) và customer screens vì route nằm trong [locale]"

requirements-completed: []

# Metrics
duration: 5min
completed: 2026-06-09
---

# Quick 260609-qnu: Fix i18n screenshot capture for admin/specialist/reviewer screens

**Sửa localized: false cho 10 screen có route nằm ngoài [locale] directory — khôi phục khả năng chụp màn hình toàn bộ ứng dụng với 4 ngôn ngữ**

## Performance

- **Duration:** 5 phút
- **Started:** 2026-06-09T12:23:42Z
- **Completed:** 2026-06-09T12:28:00Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Sửa 8 admin screens, 1 specialist screen, 1 reviewer screen từ `localized: true` → `localized: false`
- Tất cả 20 e2e tests pass (5 public + 8 admin + 2 customer + 1 specialist + 1 reviewer) × 4 locale
- 60 ảnh chụp màn hình được tạo (15 screen/locale × 4 locale) trong thư mục screenshots

## Task Commits

Each task was committed atomically:

1. **Task 1: Sửa localized flag cho admin, specialist, reviewer screens** - `ba8559a` (fix)
2. **Task 2: Chạy e2e test và xác nhận** - Không có code changes, chỉ chạy test verify

## Files Created/Modified
- `e2e/all-screens-i18n-screenshots.spec.ts` - Sửa `localized: true` → `localized: false` cho ROLE_SCREENS.admin (8 screens), ROLE_SCREENS.specialist (1 screen), ROLE_SCREENS.reviewer (1 screen)

## Decisions Made
None - followed plan as specified. Root cause xác nhận: routes `/admin/*`, `/specialist/*`, `/reviewer/*` nằm ngoài `src/app/[locale]/` nên không cần locale prefix.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## Known Stubs
None.

## User Setup Required
None - no external service configuration required.

---

*Quick: 260609-qnu*
*Completed: 2026-06-09*
