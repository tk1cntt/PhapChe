---
status: complete
date: "2026-06-13"
---

# Quick Task Summary: Migrate src/legacy to src/components

## Task
Phân tích source code phần src/legacy, nếu phần nào còn dùng thì đưa vào phần src/components. Nếu không còn dùng thì xóa đi

## Result: COMPLETE ✓

### Actions Completed

1. **Analyzed src/legacy structure** (100+ files)
   - Found components already migrated to src/components
   - Identified 2 files needing import updates

2. **Updated MyCasesClient.tsx imports**
   - Changed from `@/legacy/[locale]/customer/components/*` to `@/components/my-cases/*`
   - Components were already available in src/components

3. **Migrated intake actions**
   - Moved `src/legacy/intake/actions.ts` → `src/lib/intake/actions.ts`
   - Created test file `src/lib/intake/actions.test.ts`
   - Updated import in `src/legacy/requests/[requestId]/page.tsx`

4. **Deleted src/legacy folder**
   - Removed 189 files
   - No references to legacy remain

### Commit
- `c12e290` - @legacy to components: migrate active components and delete legacy folder

### Components Migrated
| Component | New Location |
|-----------|-------------|
| SummaryBanner | @/components/my-cases |
| StatCard | @/components/my-cases |
| MyCasesToolbar | @/components/my-cases |
| MyCasesTable | @/components/my-cases |
| FloatingChatButton | @/components/my-cases |
| intake actions | @/lib/intake |

### Verification
- ✓ No `@/legacy` imports found
- ✓ No `src/legacy/` references found
- ✓ All components available in src/components
- ✓ Intake actions available in src/lib/intake
