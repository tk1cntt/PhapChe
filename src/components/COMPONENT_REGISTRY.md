# Component Registry

**Generated:** 2026-06-14
**Last Updated:** 2026-06-14

This document catalogs all shared and domain-specific components in the GitNexus Legal platform.

---

## Granular Components - SHARED

### Level 1: Atoms (Basic UI Primitives)

| Component | Purpose | File | Props |
|-----------|---------|------|-------|
| Button | Primary actions | shared/ui/Button.tsx | variant, size, onClick, disabled, loading |
| Input | Text input | shared/ui/Input.tsx | value, onChange, placeholder, type, status |
| Select | Dropdown selection | shared/ui/Select.tsx | value, onChange, options, placeholder |
| Checkbox | Boolean control | shared/ui/Checkbox.tsx | checked, onChange, label |
| Radio | Single selection | shared/ui/Radio.tsx | checked, onChange, options |
| Textarea | Multi-line text | shared/ui/Textarea.tsx | value, onChange, rows, placeholder |
| DatePicker | Date selection | shared/ui/DatePicker.tsx | value, onChange, format, disabled |
| FileUpload | File selection | shared/ui/FileUpload.tsx | onUpload, accept, multiple, maxSize |
| Badge | Generic label | shared/ui/Badge.tsx | children, color, variant |
| Avatar | User representation | shared/ui/Avatar.tsx | src, alt, size, shape |
| Icon | Icon wrapper | shared/ui/Icon.tsx | name, size, color |
| Tooltip | Hover info | shared/ui/Tooltip.tsx | title, placement, children |
| Tag | Categorization label | shared/ui/Tag.tsx | children, color, closable, onClose |

### Level 2: Molecules (Composited Components)

| Component | Purpose | File | Props |
|-----------|---------|------|-------|
| StatCard | Metrics display | shared/ui/StatCard.tsx | title, value, icon, variant, loading |
| StatusBadge | Status indicator | shared/ui/StatusBadge.tsx | status, size |
| SLABar | Progress indicator | shared/ui/SLABar.tsx | progress, variant, showLabel |
| EmptyState | No data state | shared/ui/EmptyState.tsx | icon, message, action |
| LoadingSkeleton | Loading placeholder | shared/ui/LoadingSkeleton.tsx | width, height, variant |
| Pagination | Page navigation | shared/ui/Pagination.tsx | page, pageSize, total, onChange |
| TimelineItem | Timeline entry | shared/timeline/TimelineItem.tsx | icon, title, description, timestamp |
| TableCell | Table cell | shared/table/TableCell.tsx | children, align, ellipsis |
| FormField | Form wrapper | shared/forms/FormField.tsx | label, error, required, helpText |
| SearchInput | Search with icon | shared/ui/SearchInput.tsx | value, onSearch, placeholder |
| FilterDropdown | Filter selection | shared/ui/FilterDropdown.tsx | options, selected, onChange |
| ActionMenu | Row actions | shared/ui/ActionMenu.tsx | actions, icon, placement |

### Level 3: Organisms (Complex Components)

| Component | Purpose | File | Props |
|-----------|---------|------|-------|
| DataTable | Generic table | shared/table/DataTable.tsx | columns, data, loading, pagination |
| AuditTimeline | Audit events | shared/timeline/AuditTimeline.tsx | events, loading |
| RequestTable | Request list | shared/table/RequestTable.tsx | requests, onAction, loading |
| UserTable | User list | shared/table/UserTable.tsx | users, onAction, loading |
| VaultFileTable | Vault files | shared/table/VaultFileTable.tsx | files, onAction, loading |
| FormRenderer | Dynamic form | shared/forms/FormRenderer.tsx | definition, onSubmit, disabled |
| Modal | Dialog | shared/ui/Modal.tsx | open, onClose, title, footer |
| ConfirmDialog | Confirmation | shared/ui/ConfirmDialog.tsx | title, message, onConfirm, onCancel |
| FilterBar | Combined filters | shared/ui/FilterBar.tsx | filters, onChange, onReset |
| DetailPanel | Side panel | shared/ui/DetailPanel.tsx | title, open, onClose, children |

### Level 4: Templates (Layout Components)

| Component | Purpose | File |
|-----------|---------|------|
| AppLayout | Root layout | shared/layout/AppLayout.tsx |
| AdminLayout | Admin layout | shared/layout/AdminLayout.tsx |
| UserLayout | User layout | shared/layout/UserLayout.tsx |
| Sidebar | Navigation sidebar | shared/layout/Sidebar.tsx |
| Header | Page header | shared/layout/Header.tsx |
| Breadcrumb | Navigation trail | shared/layout/Breadcrumb.tsx |
| PageContainer | Content wrapper | shared/layout/PageContainer.tsx |
| CardGrid | Grid layout | shared/layout/CardGrid.tsx |

---

## Domain-Specific Components

### Requests Domain

| Component | Purpose | File |
|-----------|---------|------|
| ServiceCard | Service selection | requests/ServiceCard.tsx |
| IntakeForm | Intake questions | requests/IntakeForm.tsx |
| RequestStatus | Status display | requests/RequestStatus.tsx |
| RequestDetail | Request details | requests/RequestDetail.tsx |
| RequestTimeline | Request history | requests/RequestTimeline.tsx |

### Messages Domain

| Component | Purpose | File |
|-----------|---------|------|
| ThreadList | Message threads | messages/ThreadList.tsx |
| ChatBubble | Message display | messages/ChatBubble.tsx |
| MessageInput | Message composer | messages/MessageInput.tsx |

### Vault Domain

| Component | Purpose | File |
|-----------|---------|------|
| FolderTree | Folder navigation | vault/FolderTree.tsx |
| FilePreview | File preview | vault/FilePreview.tsx |
| UploadZone | Drag-drop upload | vault/UploadZone.tsx |

### Admin Domain

| Component | Purpose | File |
|-----------|---------|------|
| AdminStatCard | Admin metrics | admin/AdminStatCard.tsx |
| AdminDataTable | Admin tables | admin/AdminDataTable.tsx |
| WorkspaceSelector | Workspace picker | admin/WorkspaceSelector.tsx |

---

## Usage Guidelines

### Component Selection Priority

1. **Prefer shared components** over domain-specific when possible
2. **Use atoms first**, then compose into molecules
3. **Molecules for repeated patterns**, organisms for complex UI sections
4. **Templates for layout consistency** across pages

### StatCard Variants

| Variant | Color | Use Case |
|---------|-------|----------|
| blue | #1677ff | Total counts, neutral metrics |
| green | #52c41a | Positive metrics, completed |
| orange | #fa8c16 | Warning, pending, in-progress |
| purple | #722ed1 | Review, special status |
| red | #ff4d4f | Urgent, overdue, critical |

### Form Components

- Use `FormRenderer` for dynamic forms defined in database
- Use `FormField` wrapper for consistent field styling
- Always include validation feedback via `error` prop

### Table Components

- Use `DataTable` as base with custom columns
- Extend with `RequestTable`, `UserTable`, `VaultFileTable` for domain-specific
- Include `LoadingSkeleton` rows when loading

---

## Adding New Components

### Checklist

1. **Identify scope**: Is this reusable (shared) or domain-specific?
2. **Find level**: Atom, molecule, organism, or template?
3. **Choose location**: `shared/ui/`, `shared/table/`, etc.
4. **Follow naming**: PascalCase.tsx for component files
5. **Document props**: Add entry to this registry
6. **Add story**: Create `.stories.tsx` for Storybook
7. **Export properly**: Export from `index.ts` in component directory
8. **Update generator**: Run `node scripts/generate-component-registry.mjs`

### Naming Rules

| Type | Convention | Example |
|------|------------|---------|
| Component file | PascalCase.tsx | `StatCard.tsx` |
| Props interface | {Name}Props | `StatCardProps` |
| Index export | Named export | `export { StatCard }` |

### Props Documentation

```typescript
interface ComponentProps {
  /** Primary label displayed in the component */
  title: string;
  /** Numeric or string value to display */
  value: number | string;
  /** Icon identifier from available set */
  icon?: 'file' | 'check' | 'clock' | 'warning' | 'done';
  /** Color variant affecting icon and styling */
  variant?: 'blue' | 'green' | 'orange' | 'purple' | 'red';
  /** Shows loading spinner when true */
  loading?: boolean;
  /** Click handler for interactive cards */
  onClick?: () => void;
}
```

---

*Document: COMPONENT_REGISTRY.md*
*Part of: Phase 55 - Architecture Standards*
*Run `node scripts/generate-component-registry.mjs` to regenerate*
