---
phase: quick
plan: 260609-sq4
slug: fix-i18n-m-n-h-nh-zh-admin-users-hi-n-th
description: Fix i18n for admin users page - Chinese users were seeing untranslated Vietnamese
tags:
  - i18n
  - admin
  - translation
tech_stack:
  - next-intl
  - antd
  - react
key_files:
  created: []
  modified:
    - src/messages/vi.json
    - src/messages/zh.json
    - src/messages/en.json
    - src/messages/ja.json
    - src/app/admin/users/UsersPageClient.tsx
decisions:
  - Add AdminUsers section to all 4 locale files with consistent keys
  - Use labelKey approach for roles to enable dynamic translation lookup
  - Include proper Vietnamese diacritics (Khách hàng, Điều phối viên, etc.)
metrics:
  duration: ~2 minutes
  completed: 2026-06-09
---

# Quick Plan 260609-sq4: Fix i18n Admin Users Page Summary

## One-liner

Added complete i18n translations for admin users page across 4 locales (vi, zh, en, ja) with proper Vietnamese diacritics and updated component to use translations.

## Completed Tasks

| Task | Description | Status |
|------|-------------|--------|
| 1 | Add AdminUsers i18n keys to all locale files | Done |
| 2 | Update UsersPageClient to use i18n | Done |
| 3 | Verify all locales are complete and consistent | Done |

## Changes Made

### Task 1: Add i18n keys to locale files

Added `AdminUsers` section to all 4 locale files with these keys:
- `pageTitle` - Main page title
- `pageDescription` - Platform description
- `systemRoles` - System roles section header
- `roleChangeNote` - Audit logging note
- `createUserButton` - Create user button text
- `role_customer` - Customer role label
- `role_specialist` - Specialist role label
- `role_reviewer` - Reviewer role label
- `role_coordinator_admin` - Coordinator Admin role label
- `role_super_admin` - Super Admin role label

**Vietnamese translations (with proper diacritics):**
- Khách hàng (not "Khach hang")
- Chuyên viên
- Người duyệt
- Điều phối viên (not "Dieu phoi vien")
- Quản trị viên

**Chinese translations:**
- 用户管理, 客户, 专员, 审核员, 协调员, 管理员

**Japanese translations:**
- ユーザー管理, 顧客, スペシャリスト, レビュアー, コーディネーター, スーパーユーザー

### Task 2: Update UsersPageClient

- Imported `useTranslations` from `@/i18n`
- Added `const t = useTranslations('AdminUsers');` hook
- Replaced hardcoded Vietnamese text with `t('xxx')` calls
- Changed roles array to use `labelKey` for dynamic translation lookup

### Task 3: Verification

- Verified vi.json has proper Vietnamese diacritics (grep found "Khách hàng", no "Khach hang")
- Verified zh.json has Chinese characters (用户管理)
- Verified ja.json has Japanese characters (ユーザー管理)
- All 4 locale files have consistent AdminUsers keys at same line numbers

## Commits

| Hash | Description |
|------|-------------|
| b8ff192 | feat(quick-260609-sq4): add AdminUsers i18n keys to all 4 locales |
| 5ef970a | feat(quick-260609-sq4): use i18n translations in UsersPageClient |

## Self-Check: PASSED

- [x] vi.json has AdminUsers section with proper diacritics
- [x] zh.json has Chinese translations (not Vietnamese)
- [x] en.json has English translations
- [x] ja.json has Japanese translations
- [x] UsersPageClient.tsx uses useTranslations hook
- [x] All hardcoded Vietnamese text replaced with t() calls
- [x] Commits b8ff192 and 5ef970a verified in git log
