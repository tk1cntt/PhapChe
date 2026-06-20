---
status: resolved
trigger: "ESM import issue in prisma/seed.ts - Cannot find module '../src/lib/i18n/seed-multilingual'. Pre-existing from Phase 58."
created: 2026-06-20
updated: 2026-06-20
resolved: 2026-06-20
---

# Debug Session: seed-esm-import

## Symptoms

- **Expected:** `npm run seed` chạy thành công, populates database
- **Actual:** `Cannot find module '../src/lib/i18n/seed-multilingual'` — esbuild fails during transform
- **Error:** Transform failed due to duplicate symbol declaration
- **Timeline:** Pre-existing issue from Phase 58, not caused by Phase 73
- **Reproduction:** Run `npm run seed` from project root

## Current Focus

- **hypothesis:** ✅ CONFIRMED — Duplicate symbol `seedPartners` in prisma/seed/partners.ts
- **next_action:** ✅ COMPLETED — Renamed variable to `partnerData`

## Evidence

- **timestamp:** 2026-06-20T10:15:00Z
- **finding:** File `prisma/seed/partners.ts` has duplicate symbol declaration:
  - Line 3: `const seedPartners = [...]` (array of partner data)
  - Line 19: `export default async function seedPartners(...)` (seed function)
  - esbuild fails with: "The symbol 'seedPartners' has already been declared"

- **timestamp:** 2026-06-20T10:16:00Z
- **finding:** The "Cannot find module" error was a misleading error message from esbuild transform failure, not an actual ESM path issue

## Eliminated

- **hypothesis:** ESM import path incorrect - relative path should be different
- **reason:** Import path was actually correct. esbuild transform failed before module resolution.

- **hypothesis:** Missing .ts extension for ESM
- **reason:** Not applicable. Transform failed at parse stage before module resolution.

- **hypothesis:** tsconfig module resolution misconfiguration
- **reason:** Not applicable. Transform failed before tsconfig module resolution applied.

## Resolution

**Root cause:** Duplicate symbol `seedPartners` in `prisma/seed/partners.ts` caused esbuild transform to fail. The error message "Cannot find module" was misleading — actual problem was symbol redeclaration.

**Fix:** Renamed array variable `seedPartners` → `partnerData` in `prisma/seed/partners.ts`:
- Line 3: `const partnerData = [...]`
- Updated loop reference to use `partnerData`

**Verification:** Script now runs past import phase successfully.

**Files changed:**
- `prisma/seed/partners.ts`

**Note:** New issue discovered — Foreign key constraint (P2003) when deleting data in wrong order. This is a separate issue in `seed/index.ts` requiring tables to be deleted in reverse dependency order (child tables before parent tables).

