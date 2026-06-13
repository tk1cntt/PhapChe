---
phase: "45"
name: "settings"
slug: "settings"
created: 2026-06-13
status: discussed
---

# Phase 45: Settings — Real Data Integration

## Domain

Connect Settings page (`/vi/settings`) to real Prisma queries. Replace placeholder "Settings coming soon" with full settings functionality including profile form, security settings, notification preferences, workspace settings, language switch, and audit log viewer.

## Source Reference (Legacy → Clone)

Source: `src/legacy/[locale]/customer/components/Settings/`
Target: `src/components/settings/`

| Legacy File | Purpose | Lines |
|-------------|---------|-------|
| SettingsMenu.tsx | 6-tab navigation menu | 47 |
| SettingsStats.tsx | Stats summary card | ~50 |
| ProfileForm.tsx | 6-field profile form | 72 |
| ToggleRow.tsx | Toggle switch component | 32 |
| SettingsForm.tsx | Main form container | ~100 |

## Components to Create

```
src/components/settings/
├── SettingsMenu.tsx      # 6-tab menu (profile/security/notifications/workspace/language/audit)
├── SettingsStats.tsx      # Stats summary (requests processed, SLA met, etc.)
├── ProfileForm.tsx        # 6 fields: name, email, phone, title, workspace, timezone
├── ToggleRow.tsx         # Reusable toggle component
├── SecuritySettings.tsx   # Password change + 2FA toggles
├── NotificationSettings.tsx  # Email/sms toggle preferences
├── LanguageSettings.tsx  # Language selector
├── AuditSettings.tsx     # Audit log viewer
├── index.ts              # Barrel exports
└── settings.css          # All settings styles
```

## Tabs Structure

1. **Profile** (tabProfile) — ProfileForm with 6 fields
2. **Security** (tabSecurity) — Password change + 2FA toggles
3. **Notifications** (tabNotifications) — Email/sms preference toggles
4. **Workspace** (tabWorkspace) — Default workspace selector
5. **Language** (tabLanguage) — Language switcher
6. **Audit** (tabAudit) — Audit log viewer

## Data Requirements

### Profile Tab
- Read: `prisma.user.findUnique` for current user
- Update: `prisma.user.update` for profile changes
- Fields: name, email, phone, title, timezone

### Security Tab
- Read: User security preferences
- Update: Password change via `POST /api/auth/change-password`
- 2FA: Via existing auth system

### Notifications Tab
- Store: User notification preferences in DB
- Options: emailOnReply, slaReminder, weeklySummary

### Language Tab
- Use: `next-intl` locale switching
- Store: User preference in `prisma.user.locale`

### Audit Tab
- Read: `prisma.auditLog` for user actions
- Display: Recent audit entries with timestamps

## Decisions Needed

### Gray Area 1: API Strategy
**Question:** How to handle settings API endpoints?

Options:
- **Option A**: Create new API routes in `src/app/api/settings/`
  - `PUT /api/settings/profile` — Update profile
  - `PUT /api/settings/password` — Change password
  - `PUT /api/settings/notifications` — Update preferences
  - `PUT /api/settings/language` — Change locale
  
- **Option B**: Extend existing auth API with settings endpoints
  - Reuse `/api/auth/` routes with additional methods

- **Option C**: Use server actions (Next.js App Router pattern)
  - Direct Prisma calls from components via server actions

**Recommendation:** Option A — cleaner separation of concerns, follows existing API pattern

### Gray Area 2: Notification Storage
**Question:** Where to store notification preferences?

Options:
- **Option A**: Add to existing `User` model (simple, one table)
- **Option B**: Create `UserPreferences` model (normalized, extensible)
- **Option C**: Use JSON field in `User` model (flexible, less queries)

**Recommendation:** Option B — normalized design for future extensibility

### Gray Area 3: Password Change Validation
**Question:** How to validate current password?

Options:
- **Option A**: Require current password to change (secure)
- **Option B**: Send verification email for password change (more secure)
- **Option C**: Skip current password (MVP, less friction)

**Recommendation:** Option A — standard practice, MVP-appropriate

## Deferred Ideas

- Email verification on email change
- OAuth provider linking
- Session management
- Password strength meter

## Success Criteria

1. User sees 6-tab settings menu with icons
2. User sees profile form pre-filled with real data
3. User can update profile (name, email, phone, title)
4. User can change password (requires current password)
5. User can toggle notification preferences
6. User can switch language (vi/en)
7. User can view audit log entries

## Next Steps

`/gsd-plan-phase 45`
