# Phase 55: Architecture & Standards — Context

**Phase:** 55
**Created:** 2026-06-14
**Updated:** 2026-06-14
**Domain:** Architecture Foundation - Hybrid Approach

## Goal

Establish architecture foundation with granular shared components, domain-based structure, and dynamic form/workflow patterns.

---

## Decisions Locked

### 1. Component Granularity

**Principle:** Break down into smallest reusable units for maximum sharing.

#### Shared Components Structure:

```
src/components/shared/
├── ui/               # Level 1-2: Atoms & Molecules
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Select.tsx
│   ├── Checkbox.tsx
│   ├── Radio.tsx
│   ├── Textarea.tsx
│   ├── DatePicker.tsx
│   ├── FileUpload.tsx
│   ├── Badge.tsx
│   ├── Avatar.tsx
│   ├── Icon.tsx
│   ├── StatCard.tsx        # 5 variants: blue, green, orange, purple, red
│   ├── StatusBadge.tsx     # Multiple status types
│   ├── SLABar.tsx          # SLA/Progress bars
│   ├── EmptyState.tsx
│   ├── LoadingSkeleton.tsx
│   ├── Pagination.tsx
│   └── Modal.tsx
│
├── table/            # Level 2-3: Table components
│   ├── DataTable.tsx       # Generic table wrapper
│   ├── TableHeader.tsx
│   ├── TableRow.tsx
│   ├── TableCell.tsx
│   ├── TableActions.tsx
│   ├── RequestTable.tsx   # Request list
│   ├── UserTable.tsx
│   ├── VaultFileTable.tsx
│   └── AuditLogTable.tsx
│
├── timeline/          # Level 2-3: Timeline components
│   ├── TimelineItem.tsx
│   ├── AuditTimeline.tsx   # Audit events
│   └── ActivityTimeline.tsx
│
├── layout/            # Level 4: Templates
│   ├── AppLayout.tsx
│   ├── AdminLayout.tsx
│   ├── UserLayout.tsx
│   ├── Sidebar.tsx
│   ├── Header.tsx
│   └── Breadcrumb.tsx
│
└── forms/             # Level 3: Form components
    ├── FormRenderer.tsx    # Dynamic form
    ├── FormField.tsx
    ├── FieldText.tsx
    ├── FieldSelect.tsx
    ├── FieldDate.tsx
    ├── FieldFile.tsx
    └── FieldCheckbox.tsx
```

### 2. Domain Structure

```
src/
├── app/
│   ├── [locale]/
│   │   ├── requests/           # User pages
│   │   ├── vault/
│   │   ├── messages/
│   │   └── admin/
│   │       ├── dashboard/
│   │       ├── requests/
│   │       ├── users/
│   │       ├── workspaces/
│   │       ├── operations/
│   │       ├── audit/
│   │       └── vault/
│   └── api/
│       └── [domain]/
│
├── components/
│   ├── shared/                 # All shared components
│   ├── requests/               # Domain: Requests
│   ├── vault/                 # Domain: Vault
│   ├── messages/               # Domain: Messages
│   └── admin/                 # Domain: Admin
│
└── lib/
    ├── requests/
    │   ├── services/
    │   ├── types/
    │   └── forms/             # Form Definition engine
    ├── vault/
    ├── workflow/
    │   └── definitions/       # Workflow Definition engine
    ├── users/
    ├── audit/
    └── types/                 # Shared types
```

### 3. Form Definition Pattern

**Storage:** Database (configurable by admin)

**Schema:**
```typescript
interface FormDefinition {
  id: string;
  code: string;           // "employment_contract"
  name: string;
  fields: FormField[];
  version: number;
  status: 'draft' | 'published' | 'deprecated';
}

interface FormField {
  key: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'file' | 'checkbox';
  label: string;
  labelKey?: string;
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  validation?: ValidationRule[];
  dependsOn?: string;
}
```

### 4. Workflow Definition Pattern

**Storage:** Database (configurable by admin)

**Schema:**
```typescript
interface WorkflowDefinition {
  id: string;
  code: string;
  name: string;
  states: WorkflowState[];
  transitions: WorkflowTransition[];
}

interface WorkflowState {
  code: string;
  name: string;
  order: number;
  color?: string;
  requiresAssignment: boolean;
}

interface WorkflowTransition {
  from: string;
  to: string;
  allowedRoles: Role[];
}
```

### 5. Template Engine Pattern

**Templates use `{{variables}}`, engine merges data at render time.**

### 6. API Standards

```typescript
// Success
{ data: T, meta?: { page, pageSize, total } }
// Error
{ error: string, detail?: string }
```

### 7. Service Layer

| What | Where |
|------|-------|
| Business logic | `lib/[domain]/services/` |
| Validation | Service functions |
| UI state | Components |
| Server state | TanStack Query |

### 8. TypeScript Types

`src/lib/types/` organized by entity:
- user.ts, workspace.ts, request.ts, audit.ts, vault.ts, review.ts, workflow.ts

### 9. i18n Rules

- UI text: ✓ i18n (`t('ComponentName.action')`)
- Internal logs: ✗ hardcoded

---

## Boundaries

**In scope:**
- Architecture documentation
- Component registry (30+ components)
- Domain structure
- Form/Workflow/Template patterns
- Standards

**Out of scope:**
- NestJS migration
- PostgreSQL migration
- Full dynamic pattern implementation
- Retroactive refactoring

---

## Deferred Ideas

- NestJS backend (future migration)
- PostgreSQL (future upgrade)
- Mobile app support
- Public API

---

## Canonical Refs

- `src/components/` — Current components
- `src/lib/` — Current services
- `src/lib/types.ts` — Current types
- `prisma/schema.prisma` — Database schema

---

*Context updated: 2026-06-14*
*Next step: /gsd-execute-phase 55*
