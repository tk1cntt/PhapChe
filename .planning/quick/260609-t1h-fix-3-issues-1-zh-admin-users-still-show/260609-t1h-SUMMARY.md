---
phase: quick
plan: 260609-t1h
subsystem: admin
tags: [i18n, admin, users, quick-fix]
dependency_graph:
  requires: []
  provides: []
  affects: [admin/users, api/users]
tech_stack:
  added: []
  patterns: [i18n, useTranslations, NextIntlClientProvider]
key_files:
  created:
    - src/app/[locale]/admin/layout.tsx
  modified:
    - src/app/admin/users/AdminUsersTable.tsx
    - src/app/api/users/route.ts
    - src/messages/vi.json
    - src/messages/zh.json
    - src/messages/en.json
    - src/messages/ja.json
    - prisma/seed.ts
decisions: []
metrics:
  duration: ""
  completed: "2026-06-09"
---

# Quick 260609-t1h: Fix 3 Issues + zh Admin Users

## Summary

Fixed i18n issues for /zh/admin/users, added NextIntlClientProvider to admin layouts, and updated demo seed data with 5 user roles.

## Completed Tasks

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Fix AdminUsersTable.tsx to use i18n | 334c87e | 5 files |
| 2 | Create [locale]/admin/layout.tsx | d32145e | 1 file |
| 3 | Update seed.ts with super_admin | 0f3646c | 1 file |
| 4 | API returns i18n-ready status | b985fb3 | 1 file |

## Task Details

### Task 1: Fix AdminUsersTable.tsx to use i18n

**Changes:**
- Added `useTranslations` import from `next-intl`
- Added `TableUsers` section to all 4 locale files (vi, zh, en, ja) with keys: name, email, role, workspace, status, active, inactive
- Replaced hardcoded column headers: "Ten" -> t('TableUsers.name'), etc.
- Replaced role labels with t('AdminUsers.role_*') 
- Updated status rendering to use translation keys (active/inactive)

**Commit:** 334c87e

### Task 2: Create [locale]/admin/layout.tsx

**Changes:**
- Created new layout file at `src/app/[locale]/admin/layout.tsx`
- Wraps children with `NextIntlClientProvider` using `getMessages()`
- Ensures /zh/admin/* routes have access to translations

**Commit:** d32145e

### Task 3: Update seed.ts with super_admin

**Changes:**
- Added 5th demo user: superadmin.demo@example.test with super_admin role
- Updated seedUsers type to include 'super_admin' role
- All 5 roles now seedable: customer, specialist, reviewer, coordinator_admin, super_admin

**Commit:** 0f3646c

### Task 4: API returns i18n-ready status

**Changes:**
- Changed status from hardcoded Vietnamese to translation keys
- "Dang hoat dong" -> "active"
- "Vo hieu hoa" -> "inactive"
- Frontend now renders translated status via t('TableUsers.active')/t('TableUsers.inactive')

**Commit:** b985fb3

## Verification

- All commits verified with `git log --oneline`
- No hardcoded Vietnamese text remaining in AdminUsersTable.tsx
- [locale]/admin/layout.tsx exists with NextIntlClientProvider
- API returns 'active'/'inactive' instead of 'Dang hoat dong'/'Vo hieu hoa'

## Self-Check: PASSED
