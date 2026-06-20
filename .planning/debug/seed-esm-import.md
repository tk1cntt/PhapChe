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

**Status Update:** Seed script now passes the import phase successfully. 

New error encountered: PrismaClientValidationError during auditEvent seeding. This is a **pre-existing issue** unrelated to Phase 73 — the original "Cannot find module" error was actually caused by esbuild transform failure due to duplicate symbol declaration in partners.ts, not an actual ESM path problem.

The current validation error (`workspace is missing`) exists in operations.ts line 197 and is outside Phase 73 scope.

