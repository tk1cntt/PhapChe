---
phase: 39-v2-0-foundation-multilingual-database-schema
plan: "02"
subsystem: database
tags: [prisma, seed, i18n, multilingual, typescript]

# Dependency graph
requires:
  - phase: 39-01
    provides: Multilingual schema with label/description columns for VI/EN/ZH/JA
provides:
  - Multilingual seed data for MatterTypes, Folders, Tags
  - Seed versioning for rollback support
  - Translation coverage report script
affects: [39-03, 39-04]

# Tech tracking
tech-stack:
  added: [tsx]
  patterns: [seed versioning, translation coverage reporting]

key-files:
  created:
    - src/lib/i18n/seed-multilingual.ts
    - scripts/seed-coverage.ts
    - scripts/README.md
  modified:
    - prisma/seed.ts
    - src/lib/intake/catalog.ts

key-decisions:
  - "Used SEED_MATTER_TYPES as single source of truth for multilingual seed data"
  - "Folder upsert uses findFirst/create pattern instead of upsert due to SQLite unique constraint limitation"
  - "catalog.ts imports from seed-multilingual.ts for backward compatibility"

patterns-established:
  - "Seed versioning: SEED_VERSION constant tracks seed data version"
  - "Coverage reporting: calculateCoverage() function for all locales"

requirements-completed: [ARCH-02, REQ-39-02, REQ-39-05]

# Metrics
duration: 12min
completed: 2026-06-12
---

# Phase 39: Multilingual Database Schema - Plan 02 Summary

**Multilingual seed data with VI/EN/ZH/JA translations, seed versioning, and translation coverage reporting**

## Performance

- **Duration:** 12 min
- **Started:** 2026-06-12T16:06:27Z
- **Completed:** 2026-06-12T16:18:00Z
- **Tasks:** 5
- **Files modified:** 4

## Accomplishments

- Created comprehensive multilingual seed data structure with all 4 languages
- Implemented seed versioning (v1.0.0) for rollback and migration tracking
- Built translation coverage report script to identify gaps
- Updated seed.ts to use new multilingual data with all 8 columns for MatterTypes
- Maintained backward compatibility in catalog.ts

## Task Commits

Each task was committed atomically:

1. **Task 1: Create seed-multilingual.ts** - `4af1b33` (feat)
2. **Task 2: Create seed-coverage.ts** - `d895fbf` (feat)
3. **Task 3: Update seed.ts** - `1856d22` (feat)
4. **Fix: Folder upsert issue** - `9e91b21` (fix)
5. **Task 5: Update catalog.ts** - `5a79e96` (feat)

**Plan metadata commit:** Included in task commits

## Files Created/Modified

- `src/lib/i18n/seed-multilingual.ts` - Multilingual seed data with versioning
- `scripts/seed-coverage.ts` - Translation coverage report script
- `scripts/README.md` - Documentation for seed scripts
- `prisma/seed.ts` - Updated to use multilingual seed data
- `src/lib/intake/catalog.ts` - Updated for backward compatibility

## Database Verification

After seed execution:

```
MatterTypes (4 locales):
  agency_contract: VI=Soạn hợp đồng đại lý EN=Agency Contract ZH=代理合同 JA=代理店契約
  labor_contract: VI=Soạn hợp đồng lao động EN=Labor Contract ZH=劳动合同 JA=労働契約
  trademark_registration: VI=Đăng ký nhãn hiệu EN=Trademark Registration ZH=商标注册 JA=商标登録
  unsupported: VI=Dịch vụ khác / chưa rõ loại việc EN=Other / Unclear ZH=其他 / 不明确 JA=その他 / 不明

Folders (4 locales):
  Hợp đồng: EN=Contracts ZH=合同 JA=契約
  Thỏa thuận: EN=Agreements ZH=协议 JA=合意
  Nhãn hiệu: EN=Trademark ZH=商标 JA=商标
  Thành lập công ty: EN=Incorporation ZH=公司成立 JA=会社設立

Tags (4 locales):
  urgent: VI=Khẩn cấp EN=Urgent ZH=紧急 JA=緊急
  confidential: VI=Bí mật EN=Confidential ZH=机密 JA=機密
  contract_signed: VI=Đã ký EN=Signed ZH=已签署 JA=署名済み
  draft: VI=Bản nháp EN=Draft ZH=草稿 JA=下書き
```

## Decisions Made

- Used SEED_MATTER_TYPES as single source of truth for multilingual seed data
- Folder upsert uses findFirst/create pattern instead of upsert due to SQLite unique constraint limitation with nullable parentId
- catalog.ts imports from seed-multilingual.ts for backward compatibility with existing code

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed Folder upsert to use findFirst/create pattern**
- **Found during:** Task 3 (seed.ts execution)
- **Issue:** SQLite unique constraint on (workspaceId, parentId, name_vi) fails when parentId is null - upsert cannot handle this
- **Fix:** Changed Folder seeding to use findFirst to check existence, then create or update
- **Files modified:** prisma/seed.ts
- **Verification:** Seed runs successfully, Folders have all 4 translations
- **Committed in:** 9e91b21 (fix)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Auto-fix was necessary for seed to complete. No scope creep.

## Issues Encountered

- SQLite unique constraint limitation with nullable parentId required changing Folder upsert logic
- seed-coverage.ts module resolution issues (resolved by using direct node execution for verification)

## Next Phase Readiness

- Multilingual seed data complete and verified in database
- MatterType, Folder, Tag tables have all 4 languages populated
- Ready for Phase 39-03: Integrate multilingual data into UI components

---
*Phase: 39-v2-0-foundation-multilingual-database-schema*
*Completed: 2026-06-12*
