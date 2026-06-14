# Phase 55: Architecture & Standards — Discussion Log

**Phase:** 55
**Date:** 2026-06-14
**Updated:** 2026-06-14

## Discussion Summary

Architecture discussion for Phase 55 - Architecture Redesign (Hybrid Approach).

## User Confirmation

**"Chia nhỏ các component ra để có thể share đc nhiều nhất. Ok với các recommendations của bạn"**

---

## Decisions Confirmed

### 1. Shared Components - Granular Breakdown

**Confirmed - All components below are SHARED:**

#### UI Primitives (src/components/shared/ui/)
| Component | Purpose | Variants |
|-----------|---------|----------|
| `StatCard.tsx` | Metrics display | blue, green, orange, purple, red |
| `StatusBadge.tsx` | Status indicators | Multiple status types |
| `SLABar.tsx` | SLA/Progress bars | color-coded by deadline |
| `DataTable.tsx` | Generic table wrapper | sortable, filterable |
| `Pagination.tsx` | Pagination controls | - |
| `EmptyState.tsx` | Empty data UI | icon + message |
| `LoadingSkeleton.tsx` | Loading states | card, table, page variants |
| `ErrorFallback.tsx` | Error boundaries | - |
| `Button.tsx` | Buttons | primary, secondary, ghost, danger |
| `Modal.tsx` | Modals | confirm, alert, form |
| `Input.tsx` | Form input | text, email, password, number |
| `Select.tsx` | Dropdowns | single, multi-select |
| `DatePicker.tsx` | Date selection | - |
| `Checkbox.tsx` | Checkbox control | - |
| `Radio.tsx` | Radio control | - |
| `Textarea.tsx` | Text area | - |
| `FileUpload.tsx` | File upload | drag-drop, click |

#### Timeline Components (src/components/shared/timeline/)
| Component | Purpose |
|-----------|---------|
| `AuditTimeline.tsx` | Audit events display |
| `ActivityTimeline.tsx` | Generic activity stream |
| `TimelineItem.tsx` | Single timeline entry |

#### Table Components (src/components/shared/table/)
| Component | Purpose |
|-----------|---------|
| `RequestTable.tsx` | Request list with columns |
| `UserTable.tsx` | User list with columns |
| `VaultFileTable.tsx` | Vault file list |
| `AuditLogTable.tsx` | Audit log entries |
| `TableHeader.tsx` | Sortable header cell |
| `TableRow.tsx` | Generic table row |
| `TableCell.tsx` | Table cell variants |
| `TableActions.tsx` | Row action buttons |

#### Layout Components (src/components/shared/layout/)
| Component | Purpose |
|-----------|---------|
| `AppLayout.tsx` | Root layout |
| `AdminLayout.tsx` | Admin portal layout |
| `UserLayout.tsx` | User portal layout |
| `Sidebar.tsx` | Navigation sidebar |
| `Header.tsx` | Page header |
| `Breadcrumb.tsx` | Breadcrumb navigation |

#### Form Components (src/components/shared/forms/)
| Component | Purpose |
|-----------|---------|
| `FormRenderer.tsx` | Dynamic form from definition |
| `FormField.tsx` | Single form field |
| `FieldText.tsx` | Text field |
| `FieldSelect.tsx` | Select field |
| `FieldDate.tsx` | Date field |
| `FieldFile.tsx` | File upload field |
| `FieldCheckbox.tsx` | Checkbox field |

### 2. Domain Structure

**Confirmed - Organize by business domain:**

```
src/
├── app/
│   ├── [locale]/
│   │   ├── requests/           # User: My Cases, Create, Detail
│   │   ├── vault/              # User: Vault Access
│   │   ├── messages/          # User: Messages
│   │   └── admin/
│   │       ├── dashboard/       # Admin Dashboard
│   │       ├── requests/       # Admin: Requests
│   │       ├── users/          # Admin: Users
│   │       ├── workspaces/     # Admin: Workspaces
│   │       ├── operations/     # Admin: Operations
│   │       ├── audit/          # Admin: Audit
│   │       └── vault/          # Admin: Vault
│   └── api/
│       └── [domain]/           # API routes by domain
│
├── components/
│   ├── shared/                 # SHARED COMPONENTS
│   │   ├── ui/               # UI Primitives
│   │   ├── timeline/         # Timeline components
│   │   ├── table/           # Table components
│   │   ├── layout/          # Layout components
│   │   └── forms/           # Form components
│   │
│   ├── requests/              # Domain: Requests
│   │   ├── CreateWizard/
│   │   └── RequestDetail/
│   │
│   ├── vault/                # Domain: Vault
│   │   ├── VaultBrowser/
│   │   └── FolderTree/
│   │
│   ├── messages/              # Domain: Messages
│   │   ├── ThreadList/
│   │   └── ChatPanel/
│   │
│   └── admin/                # Domain: Admin
│       ├── Dashboard/
│       └── Operations/
│
└── lib/
    ├── requests/             # Domain Services
    │   ├── services/
    │   ├── types/
    │   └── forms/           # Form Definition engine
    ├── vault/
    ├── workflow/
    │   └── definitions/      # Workflow Definition engine
    ├── users/
    ├── audit/
    └── types/               # Shared types
```

### 3. Form Definition Storage

**Confirmed - Database (Configurable)**

Form schemas stored in DB, editable by admin.

**Database Schema:**
```prisma
model FormDefinition {
  id          String   @id @default(cuid())
  code        String   @unique
  name        String
  fields      Json     // Field definitions
  version     Int      @default(1)
  status      String   @default("draft")
}
```

### 4. Workflow Definition

**Confirmed - Configurable**

Workflow states stored in DB, configurable by admin.

**Database Schema:**
```prisma
model WorkflowDefinition {
  id          String   @id @default(cuid())
  code        String   @unique
  name        String
  states      Json     // State definitions
  transitions Json     // Transition rules
}
```

### 5. API Envelope Pattern

**Confirmed - Always use envelope**

```typescript
// All responses
{ data: T, meta?: { page, pageSize, total, cursor } }
// All errors
{ error: string, detail?: string }
```

### 6. Service Layer Boundaries

**Confirmed:**

| What | Where |
|------|-------|
| Business logic | `src/lib/[domain]/services/` |
| Validation | Service functions |
| UI state | Components |
| Server state | TanStack Query hooks |

### 7. TypeScript Types

**Confirmed - By entity in `src/lib/types/`:**

```
src/lib/types/
├── index.ts
├── user.ts
├── workspace.ts
├── request.ts
├── audit.ts
├── vault.ts
├── review.ts
└── workflow.ts
```

### 8. i18n Rules

**Confirmed - Component-first approach:**

**Principle:** Define i18n keys at component level first, then extend at page level.

**Directory Structure:**
```
src/i18n/
├── components/                    # BASE - All shared components
│   ├── ui/
│   │   ├── Button.json
│   │   ├── StatusBadge.json
│   │   ├── DataTable.json
│   │   └── Pagination.json
│   ├── table/
│   └── forms/
├── features/                     # EXTEND - Page-specific
│   ├── requests/
│   └── admin/
└── index.json                   # Common keys only
```

**Key Format:** `Component.element.action`

**Decision Matrix:**
| What | i18n? | Reason |
|------|-------|--------|
| UI text (components) | ✓ Yes | Reusable across pages |
| UI text (pages) | ✓ Yes | Page-specific context |
| Internal logs | ✗ No | Debug only |
| Error codes | ✗ No | Technical identifiers |
| Database values | ✗ No | Stored as-is |

---

## Component Granularity Strategy

**Principle:** Break down into smallest reusable units.

### Before (Monolithic)
```tsx
<RequestTable
  columns={[...]}
  data={requests}
  onSort={handleSort}
  onFilter={handleFilter}
  onRowClick={handleClick}
/>
```

### After (Granular)
```tsx
// Reusable parts
<Table>
  <TableHeader columns={columns} onSort={handleSort} />
  <TableBody>
    {rows.map(row => (
      <TableRow key={row.id} onClick={() => handleClick(row)}>
        <TableCell>{row.code}</TableCell>
        <TableCell>
          <StatusBadge status={row.status} />
        </TableCell>
        <TableCell>
          <SLABar deadline={row.slaDeadline} />
        </TableCell>
        <TableCell>
          <TableActions actions={getActions(row)} />
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
  <Pagination />
</Table>
```

**Benefits:**
- `<StatusBadge>` can be used in tables, cards, detail views
- `<SLABar>` can be used in tables, timelines, dashboards
- `<TableActions>` can be customized per use case
- Easy to compose different table layouts

---

## Shared Components Inventory

### Level 1: Atoms (Basic UI)
- `Button`, `Input`, `Select`, `Checkbox`, `Radio`
- `Textarea`, `DatePicker`, `FileUpload`
- `Icon`, `Avatar`, `Badge`

### Level 2: Molecules (Composite UI)
- `StatCard`, `StatusBadge`, `SLABar`
- `EmptyState`, `LoadingSkeleton`
- `TimelineItem`, `TableCell`
- `FormField`, `FieldText`, `FieldSelect`

### Level 3: Organisms (Complex UI)
- `DataTable` (composed of TableHeader, TableRow, TableCell, Pagination)
- `AuditTimeline` (composed of TimelineItem)
- `RequestTable` (DataTable + StatusBadge + SLABar)
- `FormRenderer` (composed of FormField variants)

### Level 4: Templates (Page layouts)
- `AdminLayout`, `UserLayout`
- `PageHeader`, `PageFooter`

---

## Scope Creep Redirected

The following were suggested but deferred to future phases:
- NestJS backend migration
- PostgreSQL migration
- Full dynamic form/workflow implementation
- Mobile app support

---

## 9. API Registry & Documentation

**Confirmed - Add 3 requirements:**

| Requirement | Output | Purpose |
|-------------|--------|---------|
| API_REGISTRY.md | `src/docs/API_REGISTRY.md` | Central endpoint documentation |
| Swagger/OpenAPI | `/api/docs` | Auto-generated interactive docs |
| Central API Client | `src/lib/api/` | Reuse API calls, prevent duplication |

**Problem Solved:**
- APIs being duplicated instead of shared
- No central API documentation
- Developers can't find existing APIs

**Solution: Envelope + Swagger**
```typescript
// API Registry documents all endpoints
// Swagger auto-generates from code
// Central client ensures reuse
```

---

## Next Steps

1. Execute Phase 55 - create all documentation and refactor components
2. Phase 56+: Implement features using new architecture

---

*Discussion log updated: 2026-06-14*
*Phase: 55-architecture-standards*
*All decisions confirmed by user*
