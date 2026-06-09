---
quick_id: 260609-t8t
status: complete
---

# Quick Summary: restore-admin-sidebar

## Task Completed

**Date:** 2026-06-09
**Commit:** 2cf624d

## Problem

The `[locale]/admin/layout.tsx` only provided `NextIntlClientProvider` but didn't render the sidebar layout. The sidebar was defined in `src/app/admin/layout.tsx` but wasn't being used for routes like `/zh/admin/users`.

## Solution

Updated `[locale]/admin/layout.tsx` to import and render `AdminLayout` (which contains the sidebar):

```tsx
import AdminLayout from '@/app/admin/layout';

export default async function AdminLocaleLayout({ children }) {
  const messages = await getMessages();
  return (
    <NextIntlClientProvider messages={messages}>
      <AdminLayout>{children}</AdminLayout>
    </NextIntlClientProvider>
  );
}
```

## Result

- `/zh/admin/users` now renders with sidebar menu
- All admin pages under `[locale]/admin/*` have sidebar navigation
- Sidebar shows: Người dùng, Workspace, Hồ sơ yêu cầu, Vận hành, Audit, Phân loại vault
