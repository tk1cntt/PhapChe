---
phase: "31"
plan: "31-02"
subsystem: customer-settings
tags: [settings, profile, notifications, security, toggles]
dependency_graph:
  requires: ["31-01"]
  provides: ["ToggleRow", "ProfileForm", "SettingsForm"]
  affects: ["customer-portal"]
tech_stack:
  added: ["react", "typescript"]
  patterns: ["controlled-components", "toggle-state"]
key_files:
  created:
    - "src/app/[locale]/customer/components/Settings/ToggleRow.tsx"
    - "src/app/[locale]/customer/components/Settings/ProfileForm.tsx"
    - "src/app/[locale]/customer/components/Settings/SettingsForm.tsx"
decisions: []
metrics:
  duration: "00:02:00"
  completed_date: "2026-06-11T03:51:00Z"
  tasks_completed: 3
  files_created: 3
---

# Phase 31 Plan 02: Profile Form va Toggles Summary

## One-liner

Tao ToggleRow, ProfileForm, SettingsForm components cho Settings page.

## Completed Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | ToggleRow component | 2936198 | ToggleRow.tsx |
| 2 | ProfileForm component | 9e3951f | ProfileForm.tsx |
| 3 | SettingsForm component | 651f5b5 | SettingsForm.tsx |

## Must-haves Verification

- [x] User thay 6-field profile form voi 2-column grid
- [x] User thay 3 notification toggles voi correct on/off states
- [x] User thay 2 security toggles voi correct on/off states
- [x] User thay 'Doi mat khau' button trong ghost style

## Component Details

### ToggleRow

Props interface:
```typescript
interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}
```

CSS classes:
- `.toggle-row` - Container với flex layout
- `.toggle-content` - Content wrapper
- `.toggle-label` - Label text
- `.toggle-description` - Description text
- `.toggle` - Toggle switch (ON state - green)
- `.toggle.off` - Toggle switch (OFF state - gray)

### ProfileForm

6 fields trong 2-column grid:
1. Ho va ten: "Mai Phuong"
2. Email: "mai.phuong@anphat.vn"
3. So dien thoai: "+84 912 345 678"
4. Chuc danh: "Head of Legal Operations"
5. Workspace mac dinh: "Cong ty An Phat"
6. Mui gio: "Asia/Ho_Chi_Minh (ICT)"

CSS classes:
- `.profile-form` - Form container
- `.field-grid` - 2-column grid layout
- `.field` - Individual field wrapper
- `.field label` - Label styling

### SettingsForm

3 sections kết hợp ToggleRow và ProfileForm:

**Section 1: Profile**
- Render ProfileForm component

**Section 2: Notifications (3 toggles)**
- Email khi chuyen vien phan hoi - ON
- Nhac SLA truoc han - ON
- Tom tat hang tuan - OFF

**Section 3: Security (2 toggles + button)**
- Xac thuc 2 buoc - ON
- Thong bao dang nhap la - ON
- Doi mat khau button (ghost-btn class)

## Commits

- `2936198` - feat(31-02): create ToggleRow component
- `9e3951f` - feat(31-02): create ProfileForm component
- `651f5b5` - feat(31-02): create SettingsForm component

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

- ToggleRow.tsx: FOUND
- ProfileForm.tsx: FOUND
- SettingsForm.tsx: FOUND
- Commits verified in git log
