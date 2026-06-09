---
gsd_quick: true
quick_id: 260609-thz
slug: translate-admin-sidebar-menu-to-all-lang
description: Translate admin sidebar menu to all languages using i18n
date: 2026-06-09
status: planned
must_haves:
  - Admin layout uses useTranslations for sidebar menu labels
  - All 4 locale files have consistent AdminNav keys
---

# Quick Plan: translate-admin-sidebar

## Task 1: Add AdminNav i18n keys to all locales

**files:**
- `src/messages/vi.json`
- `src/messages/zh.json`
- `src/messages/en.json`
- `src/messages/ja.json`

**action:**
Add `AdminNav` section with menu item translations:

```json
"AdminNav": {
  "users": "Người dùng",       // 用户 / Users / ユーザー
  "workspaces": "Workspace",   // 工作区 / Workspaces / ワークスペース
  "requests": "Hồ sơ yêu cầu", // 请求 / Requests / リクエスト
  "ops": "Vận hành",           // 运营 / Operations / 運用
  "audit": "Audit",            // 审计 / Audit / 監査
  "vault": "Phân loại vault"   // 档案 / Vault / ボルト
}
```

**verify:**
- All 4 locale files have AdminNav section with same keys
- Vietnamese keys have proper diacritics

**done:**
- All locales have AdminNav translations

---

## Task 2: Update AdminLayout to use i18n

**files:**
- `src/app/admin/layout.tsx`

**action:**
1. Import `useTranslations` from `next-intl`
2. Add `const t = useTranslations('AdminNav')` hook
3. Replace hardcoded labels with `t('xxx')`:
   - "Người dùng" → t('users')
   - "Workspace" → t('workspaces')
   - "Hồ sơ yêu cầu" → t('requests')
   - "Van hanh" → t('ops')
   - "Audit" → t('audit')
   - "Phan loai vault" → t('vault')

**verify:**
- grep for "Van hanh" and "Phan loai vault" returns nothing
- Component uses t() for all menu labels

**done:**
- AdminLayout uses i18n translations
