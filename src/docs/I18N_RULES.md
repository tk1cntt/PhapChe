# i18n Rules

**Purpose:** Document internationalization patterns and decision matrix

**Last Updated:** 2026-06-14

---

## Overview

The GitNexus platform uses next-intl for internationalization. All user-facing text must be translated.

## Directory Structure

```
src/i18n/
├── locales/
│   ├── vi.json
│   └── en.json
├── components/                    # BASE - Component i18n
│   ├── ui/
│   │   ├── Button.json
│   │   ├── Input.json
│   │   ├── Select.json
│   │   ├── StatusBadge.json
│   │   ├── DataTable.json
│   │   └── Pagination.json
│   ├── table/
│   │   └── TableCell.json
│   └── forms/
│       └── FormField.json
├── features/                       # EXTEND - Feature/Page i18n
│   ├── requests/
│   │   ├── list.json
│   │   ├── detail.json
│   │   └── create.json
│   └── admin/
│       ├── dashboard.json
│       └── users.json
└── index.json                     # Common keys only
```

## Key Naming Convention

Format: `Component.element.action`

```json
{
  "Button.save": "Lưu",
  "Button.cancel": "Hủy",
  "Button.delete": "Xóa",

  "StatusBadge.draft": "Bản nháp",
  "StatusBadge.submitted": "Đã gửi",
  "StatusBadge.in_progress": "Đang xử lý",

  "DataTable.empty": "Không có dữ liệu",
  "DataTable.loading": "Đang tải...",
  "DataTable.total": "Tổng cộng: {{count}}",

  "RequestList.title": "Danh sách yêu cầu",
  "RequestList.create": "Tạo yêu cầu mới",

  "Error.required": "Trường này là bắt buộc",
  "Error.invalid_email": "Email không hợp lệ"
}
```

## Decision Matrix

| What | i18n? | Reason |
|------|-------|--------|
| UI text (components) | Yes | Reusable across pages |
| UI text (pages) | Yes | Page-specific context |
| User-generated content | No | Stored as-is |
| Internal logs | No | Debug only |
| Error codes | No | Technical identifiers |
| Database values | No | Stored as-is |
| File names | No | User-provided |
| Email addresses | No | User-provided |

## Component-first Approach

### Base Components (src/i18n/components/)

Define translations at component level:

```json
// src/i18n/components/ui/Button.json
{
  "Button.save": "Lưu",
  "Button.cancel": "Hủy",
  "Button.submit": "Gửi",
  "Button.delete": "Xóa",
  "Button.edit": "Sửa",
  "Button.loading": "Đang xử lý..."
}
```

### Feature Pages (src/i18n/features/)

Extend with page-specific keys:

```json
// src/i18n/features/requests/list.json
{
  "RequestList.title": "Danh sách yêu cầu",
  "RequestList.create": "Tạo yêu cầu mới",
  "RequestList.empty": "Bạn chưa có yêu cầu nào",
  "RequestList.filter.all": "Tất cả",
  "RequestList.filter.draft": "Bản nháp",
  "RequestList.filter.in_progress": "Đang xử lý"
}
```

## Usage in Components

### Using next-intl

```typescript
// Server component
import { getTranslations } from 'next-intl/server';

export default async function Page() {
  const t = await getTranslations('components:ui');
  return <Button>{t('Button.save')}</Button>;
}

// Client component
import { useTranslations } from 'next-intl';

export function RequestList() {
  const t = useTranslations('features:requests');
  return <h1>{t('list.title')}</h1>;
}
```

### Using Multiple Namespaces

```typescript
// Combine component + feature namespaces
import { useTranslations } from 'next-intl';

export function RequestForm() {
  const t = useTranslations(['components:ui', 'features:requests']);

  return (
    <form>
      <Button>{t('Button.save')}</Button>
      <span>{t('features:requests.form.submit_success')}</span>
    </form>
  );
}
```

## Common Keys (index.json)

Only for truly common text:

```json
// src/i18n/index.json
{
  "app.name": "GitNexus Legal",
  "common.loading": "Đang tải...",
  "common.error": "Đã xãy ra lỗi",
  "common.retry": "Thử lại",
  "common.close": "Đóng",
  "common.confirm": "Xác nhận",
  "common.yes": "Có",
  "common.no": "Không"
}
```

## Status Translation Pattern

```typescript
// src/i18n/components/ui/StatusBadge.json
{
  "StatusBadge.draft_intake": "Bản nháp",
  "StatusBadge.intake_submitted": "Đã gửi",
  "StatusBadge.triage": "Phân loại",
  "StatusBadge.assigned": "Đã giao",
  "StatusBadge.in_progress": "Đang xử lý",
  "StatusBadge.pending_review": "Chờ phê duyệt",
  "StatusBadge.revision_required": "Cần sửa đổi",
  "StatusBadge.approved": "Đã phê duyệt",
  "StatusBadge.delivered": "Đã bàn giao",
  "StatusBadge.closed": "Đã đóng",
  "StatusBadge.cancelled": "Đã hủy"
}
```

```typescript
// Usage
const t = useTranslations('components:ui');
const statusKey = `StatusBadge.${status}` as const;
<span>{t(statusKey)}</span>
```

## Pluralization

```json
{
  "RequestList.count_one": "{{count}} yêu cầu",
  "RequestList.count_other": "{{count}} yêu cầu",
  "UserList.count_one": "{{count}} người dùng",
  "UserList.count_other": "{{count}} người dùng"
}
```

```typescript
const t = useTranslations('features:requests');
<span>{t('list.count', { count: 5 })}</span>
// Output: "5 yêu cầu"
```

## Date/Number Formatting

```typescript
import { useFormatter } from 'next-intl';

export function RequestRow({ request }: Props) {
  const format = useFormatter();

  return (
    <tr>
      <td>{format.number(request.amount)}</td>
      <td>{format.dateTime(request.deadline)}</td>
    </tr>
  );
}
```

## Best Practices

1. **Never hardcode text** - Always use translation keys
2. **Use descriptive keys** - `Button.save` not `btn1`
3. **Group by component** - Components own their translations
4. **Use namespaces** - Separate concerns with `:` delimiter
5. **Include context** - `StatusBadge.draft_intake` not `draft`
6. **Plan for growth** - Leave room for new keys

---

*Document: I18N_RULES.md*
*Part of: Phase 55 - Architecture Standards*
