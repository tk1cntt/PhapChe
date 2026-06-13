---
phase: "45"
plan: "02"
subsystem: "settings-api"
tags: ["settings", "api", "security"]
dependency_graph:
  requires:
    - "45-01"
  provides:
    - "Profile update API"
    - "Password change API"
    - "Notification preferences API"
    - "Language preference API"
    - "Audit log API"
  affects:
    - "prisma/schema.prisma"
    - "src/app/api/settings/*"
tech_stack:
  added:
    - "5 API route files"
  modified:
    - "prisma/schema.prisma (locale field)"
tech_patterns:
  - "requireAppSession authentication"
  - "bcrypt password hashing"
  - "Prisma upsert pattern"
key_files:
  created:
    - "src/app/api/settings/profile/route.ts"
    - "src/app/api/settings/password/route.ts"
    - "src/app/api/settings/notifications/route.ts"
    - "src/app/api/settings/language/route.ts"
    - "src/app/api/settings/audit/route.ts"
  modified:
    - "prisma/schema.prisma"
decisions:
  - "Added locale field to User model for language preference persistence"
metrics:
  duration: "fast"
  completed: "2026-06-13T03:20:00Z"
  tasks_completed: 2
  files_created: 5
  files_modified: 1
---

# Phase 45 Plan 02: Settings API Routes Summary

## Objective

Create API routes for all settings endpoints. Each route uses requireAppSession() for authentication and implements proper validation.

## One-liner

5 settings API routes with bcrypt password auth and session validation.

## Tasks Executed

| # | Task | Status | Commit |
|---|------|--------|--------|
| 1 | Create profile and password API routes | Completed | 8a4c442 |
| 2 | Create notifications, language, and audit API routes | Completed | c1c0118 |

## Artifacts Created

| Artifact | Type | Location |
|----------|------|----------|
| `PUT /api/settings/profile` | route | profile/route.ts |
| `PUT /api/settings/password` | route | password/route.ts |
| `GET /api/settings/notifications` | route | notifications/route.ts |
| `PUT /api/settings/notifications` | route | notifications/route.ts |
| `PUT /api/settings/language` | route | language/route.ts |
| `GET /api/settings/audit` | route | audit/route.ts |

## API Endpoints

### Profile API

**PUT /api/settings/profile**
- Authentication: requireAppSession
- Body: `{ name, email, phone, title, timezone }`
- Validates: name and email required, email format, email uniqueness
- Returns: `{ success: true, user: {...} }`
- Status codes: 400 (validation), 401 (auth), 500 (server error)

### Password API

**PUT /api/settings/password**
- Authentication: requireAppSession
- Body: `{ currentPassword, newPassword }`
- Validates: current password correct, new password min 8 chars, new password different from current
- Uses: bcrypt.compare for verification, bcrypt.hash for new password
- Returns: `{ success: true, message: '...' }`
- Status codes: 400 (validation/invalid password), 401 (auth), 500 (server error)

### Notifications API

**GET /api/settings/notifications**
- Authentication: requireAppSession
- Returns defaults: `{ emailOnReply: true, slaReminder: true, weeklySummary: false }` if no preferences exist
- Returns: `{ success: true, data: {...} }`

**PUT /api/settings/notifications**
- Authentication: requireAppSession
- Body: `{ emailOnReply?, slaReminder?, weeklySummary? }` (all optional booleans)
- Uses: Prisma upsert pattern
- Returns: `{ success: true, data: {...} }`

### Language API

**PUT /api/settings/language**
- Authentication: requireAppSession
- Body: `{ locale }` (valid values: vi, en, zh, ja)
- Updates: User.locale field
- Returns: `{ success: true, locale: '...' }`
- Status codes: 400 (invalid locale), 401 (auth), 500 (server error)

### Audit API

**GET /api/settings/audit**
- Authentication: requireAppSession
- Returns: Max 50 events ordered by createdAt desc
- Includes: workspace name, request title
- Returns: `{ success: true, data: [...], count: N }`

## Deviations from Plan

**1. [Rule 2 - Auto-add missing critical functionality] Added locale field to User model**
- **Found during:** Task 2 (language API implementation)
- **Issue:** Language API needed to persist locale preference, but User model lacked locale field
- **Fix:** Added `locale String? @default("vi")` to User model in schema.prisma
- **Files modified:** prisma/schema.prisma

## Threat Surface Scan

| Flag | File | Description |
|------|------|-------------|
| T-45-03 | All routes | Information disclosure mitigated via requireAppSession() auth |
| T-45-04 | Password route | Tampering mitigated via bcrypt compare/hash |
| T-45-05 | Language route | Elevation mitigated via locale whitelist validation |

## Self-Check

- [x] All 5 API routes created
- [x] All routes require authentication (requireAppSession)
- [x] Profile route validates name and email required
- [x] Password route uses bcrypt for compare and hash
- [x] Password route verifies current password before updating
- [x] Notifications route returns defaults if no preferences
- [x] Notifications route uses upsert pattern
- [x] Language route validates locale is one of: vi, en, zh, ja
- [x] Audit route returns max 50 events ordered by createdAt desc
- [x] All routes return proper error codes (400, 401, 500)
- [x] Locale field added to User model
- [x] Prisma schema validated

## Next Steps

Plan 45-03: Connect settings components to API routes (integration with Settings page).
