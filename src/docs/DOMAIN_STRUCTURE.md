# Domain Structure

**Purpose:** Document folder organization for the Legal-as-a-Service platform

**Last Updated:** 2026-06-14

---

## Overview

This document defines the canonical folder structure for the GitNexus Legal platform. All new code must follow this structure.

## Source Directory Structure

```
src/
├── app/
│   ├── [locale]/          # i18n routing: [locale]/requests, [locale]/admin/*
│   │   ├── requests/
│   │   │   ├── my-cases/
│   │   │   ├── create/
│   │   │   └── [id]/
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
│   └── api/              # API routes by domain
│       ├── admin/
│       ├── auth/
│       ├── intake/
│       ├── messages/
│       ├── settings/
│       ├── vault/
│       ├── workspace/
│       └── workspaces/
│
├── components/
│   ├── shared/           # Reusable components
│   │   ├── ui/          # Atoms & Molecules (Level 1-2)
│   │   ├── table/       # Table components (Level 2-3)
│   │   ├── timeline/    # Timeline components (Level 2-3)
│   │   ├── layout/      # Layout templates (Level 4)
│   │   └── forms/       # Form components (Level 3)
│   │
│   └── [domain]/         # Domain-specific: requests, vault, messages, admin
│       ├── requests/
│       ├── vault/
│       ├── messages/
│       └── admin/
│
└── lib/
    ├── [domain]/         # Services, types, forms per domain
    │   ├── requests/
    │   ├── vault/
    │   ├── workflow/
    │   ├── users/
    │   └── audit/
    ├── types/            # Shared types (src/lib/types/)
    └── api/              # Central API client (src/lib/api/)
```

## Component Granularity Levels

### Level 1: Atoms (Basic UI Primitives)

Smallest reusable units that cannot be broken down further:

| Component | Purpose | File |
|-----------|---------|------|
| Button | Primary actions | shared/ui/Button.tsx |
| Input | Text input | shared/ui/Input.tsx |
| Select | Dropdown selection | shared/ui/Select.tsx |
| Checkbox | Boolean control | shared/ui/Checkbox.tsx |
| Radio | Single selection | shared/ui/Radio.tsx |
| Textarea | Multi-line text | shared/ui/Textarea.tsx |
| DatePicker | Date selection | shared/ui/DatePicker.tsx |
| FileUpload | File selection | shared/ui/FileUpload.tsx |
| Badge | Generic label | shared/ui/Badge.tsx |
| Avatar | User representation | shared/ui/Avatar.tsx |
| Icon | Icon wrapper | shared/ui/Icon.tsx |

### Level 2: Molecules (Composited Components)

Combinations of atoms that form a specific UI pattern:

| Component | Purpose | File |
|-----------|---------|------|
| StatCard | Metrics display | shared/ui/StatCard.tsx |
| StatusBadge | Status indicator | shared/ui/StatusBadge.tsx |
| SLABar | Progress indicator | shared/ui/SLABar.tsx |
| EmptyState | No data state | shared/ui/EmptyState.tsx |
| LoadingSkeleton | Loading placeholder | shared/ui/LoadingSkeleton.tsx |
| Pagination | Page navigation | shared/ui/Pagination.tsx |
| TimelineItem | Timeline entry | shared/timeline/TimelineItem.tsx |
| TableCell | Table cell | shared/table/TableCell.tsx |
| FormField | Form wrapper | shared/forms/FormField.tsx |

### Level 3: Organisms (Complex Components)

Complex UI sections composed of molecules and atoms:

| Component | Purpose | File |
|-----------|---------|------|
| DataTable | Generic table | shared/table/DataTable.tsx |
| AuditTimeline | Audit events | shared/timeline/AuditTimeline.tsx |
| RequestTable | Request list | shared/table/RequestTable.tsx |
| UserTable | User list | shared/table/UserTable.tsx |
| VaultFileTable | Vault files | shared/table/VaultFileTable.tsx |
| FormRenderer | Dynamic form | shared/forms/FormRenderer.tsx |
| Modal | Dialog | shared/ui/Modal.tsx |

### Level 4: Templates (Layout Components)

Full page layouts composed of organisms:

| Component | Purpose | File |
|-----------|---------|------|
| AppLayout | Root layout | shared/layout/AppLayout.tsx |
| AdminLayout | Admin layout | shared/layout/AdminLayout.tsx |
| UserLayout | User layout | shared/layout/UserLayout.tsx |
| Sidebar | Navigation sidebar | shared/layout/Sidebar.tsx |
| Header | Page header | shared/layout/Header.tsx |
| Breadcrumb | Navigation trail | shared/layout/Breadcrumb.tsx |

## Domain Modules

### Requests Domain

```
src/lib/requests/
├── services/
│   ├── createRequest.ts
│   ├── updateRequest.ts
│   ├── assignRequest.ts
│   └── workflowTransition.ts
├── types/
│   ├── request.ts
│   └── intake.ts
└── forms/
    └── definitions/      # FormDefinition engine
```

### Vault Domain

```
src/lib/vault/
├── services/
│   ├── uploadFile.ts
│   ├── downloadFile.ts
│   └── manageTags.ts
├── types/
│   └── vault.ts
└── storage/              # S3/local storage abstraction
```

### Workflow Domain

```
src/lib/workflow/
├── definitions/
│   └── legalRequest.ts   # WorkflowDefinition engine
├── engine.ts              # State machine logic
└── transitions.ts        # Transition validation
```

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase.tsx | StatCard.tsx |
| Files | kebab-case.ts | user-service.ts |
| Functions | camelCase | getUserById |
| Constants | UPPER_SNAKE_CASE | REQUEST_STATUS |
| Types | PascalCase | UserProfile |
| Directories | kebab-case | user-management |

## Import Paths

```typescript
// Shared components
import { StatCard } from '@/components/shared/ui/StatCard';
import { DataTable } from '@/components/shared/table/DataTable';

// Domain services
import { createRequest } from '@/lib/requests/services/createRequest';

// Types
import type { User } from '@/lib/types/user';
import { REQUEST_STATUS } from '@/lib/types';
```

## File Organization Rules

1. **Barrel exports** in each directory (index.ts)
2. **Co-locate** component tests with component (Button.test.tsx)
3. **Separate** API types from business types
4. **No barrel exports** for deeply nested modules (performance)

---

*Document: DOMAIN_STRUCTURE.md*
*Part of: Phase 55 - Architecture Standards*
