---
phase: "39"
plan: "01"
subsystem: "database"
tags: ["multilingual", "prisma", "i18n", "schema"]
dependency_graph:
  requires: []
  provides: ["ARCH-01", "ARCH-02", "REQ-39-01"]
  affects: ["src/lib/i18n", "prisma/schema.prisma", "scripts"]
tech_stack:
  added: ["src/lib/i18n/types.ts", "src/lib/i18n/get-localized-content.ts"]
  patterns: ["multilingual-column-suffix", "locale-fallback-chain"]
key_files:
  created:
    - "src/lib/i18n/types.ts"
    - "src/lib/i18n/index.ts"
    - "src/lib/i18n/README.md"
    - "src/lib/i18n/get-localized-content.ts"
    - "scripts/migrate-existing-data.ts"
    - "scripts/README.md"
    - "scripts/VERIFICATION.md"
  modified:
    - "prisma/schema.prisma"
decisions:
  - "Column suffix pattern (_vi/_en/_zh/_ja) for multilingual fields"
  - "VI is primary/fallback locale"
  - "Other locales are nullable"
  - "Legacy columns kept during migration, dropped after data copy"
metrics:
  duration: "5 minutes"
  completed: "2026-06-12"
  tasks: 7
  files: 10
---

# Phase 39 Plan 01: Multilingual Database Schema Foundation

## One-liner

Added multilingual column support (VI/EN/ZH/JA) to MatterType, DocumentTemplate, Folder, and Tag models with fallback resolution utilities.

## Summary

This plan implements the multilingual database schema foundation for the Legal-as-a-Service platform. Four core models now support content in Vietnamese (primary), English, Chinese, and Japanese.

## What Was Built

### 1. i18n Type Definitions (`src/lib/i18n/`)

- **types.ts**: TypeScript types for multilingual content
  - `SupportedLocale` type: 'vi' | 'en' | 'zh' | 'ja'
  - `MultilingualString`: { vi: string; en?: string | null; zh?: string | null; ja?: string | null }
  - `MultilingualText`: { vi?, en?, zh?, ja? }
  - `DEFAULT_LOCALE`: 'vi'
  - `LOCALE_TO_SUFFIX` mapping

- **get-localized-content.ts**: Content resolution utilities
  - `getLocalized(locale, field)`: Fallback chain requested → vi → first available
  - `setLocalized(field, locale, value)`: Set value for specific locale
  - `hasLocalizedContent(field)`: Check if field has any content
  - `getAvailableLocales(field)`: Get all available locales

### 2. Prisma Schema Updates

**MatterType Model:**
- Added: `label_vi` (primary), `label_en`, `label_zh`, `label_ja`
- Added: `description_vi`, `description_en`, `description_zh`, `description_ja`

**DocumentTemplate Model:**
- Added: `label_vi` (primary), `label_en`, `label_zh`, `label_ja`
- Added: `description_vi`, `description_en`, `description_zh`, `description_ja`

**Folder Model:**
- Added: `name_vi` (primary), `name_en`, `name_zh`, `name_ja`
- Updated unique constraint to use `name_vi`

**Tag Model:**
- Added: `label_vi` (primary), `label_en`, `label_zh`, `label_ja`

### 3. Migration Infrastructure

- **scripts/migrate-existing-data.ts**: Copies legacy column data to _vi columns
- **scripts/VERIFICATION.md**: Manual verification checklist

## Migration Results

Successfully migrated existing data:
- 4 MatterTypes
- 3 DocumentTemplates
- 3 Folders
- 3 Tags

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - SQLite Limitation] Two-phase migration required**
- **Found during:** Task 7
- **Issue:** SQLite does not allow adding NOT NULL columns without default values when table has data
- **Fix:** Used two-phase approach: (1) Add new nullable columns + keep legacy columns, (2) Run migration script, (3) Remove legacy columns
- **Files modified:** prisma/schema.prisma
- **Commits:** de0ced7

## Commits

| Task | Name | Hash | Files |
|------|------|------|-------|
| 1 | i18n type definitions | 2dea1af | types.ts, index.ts, README.md |
| 2 | MatterType multilingual | 0b64770 | schema.prisma |
| 3 | DocumentTemplate multilingual | 7f31015 | schema.prisma |
| 4 | Folder and Tag multilingual | f4e22ba | schema.prisma |
| 5 | getLocalized utility | b64772c | get-localized-content.ts |
| 6 | Migration script | c832ade | migrate-existing-data.ts, README.md, VERIFICATION.md |
| 7 | Final schema | de0ced7 | schema.prisma |

## Verification

- `npx prisma validate` - PASSED
- `npx prisma db push` - PASSED
- `npx prisma generate` - PASSED
- Migration script execution - PASSED (4+3+3+3 records migrated)

## Self-Check

- [x] All 4 models have multilingual columns
- [x] getLocalized utility works with fallback chain
- [x] Migration script handles existing data
- [x] Database schema matches Prisma schema
- [x] Prisma client generated successfully

## Next Steps

1. **Plan 39-02**: Update seed data with multilingual content (VI/EN/ZH/JA for all MatterTypes and templates)
2. **Plan 39-03**: Update frontend components to use getLocalized utility
3. **Plan 39-04**: Add i18n tests

## Notes

- Legacy columns (label, description, name) were dropped after successful migration
- All _vi columns are nullable in current schema (SQLite limitation); enforce NOT NULL at application level
- The schema follows the hybrid i18n approach: database content is multilingual, UI text uses next-intl messages files
