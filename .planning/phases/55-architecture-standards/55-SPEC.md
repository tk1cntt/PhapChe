# Phase 55: Architecture & Standards — Specification

**Created:** 2026-06-14
**Updated:** 2026-06-14
**Ambiguity score:** 0.08 (gate: ≤ 0.20)
**Requirements:** 11 locked

## Goal

Establish architecture foundation for a metadata-driven Legal-as-a-Service platform with:
1. Granular shared components for maximum reuse
2. Domain-based folder structure
3. Dynamic Form/Workflow/Template patterns
4. Consistent coding standards

## Decisions Confirmed

All decisions below are locked and will be implemented.

---

## Requirements

### 1. Component Registry (ARCH-01)

**Output:** `src/components/COMPONENT_REGISTRY.md`

**Granular Components - SHARED:**

#### Level 1: Atoms
| Component | Purpose | File |
|-----------|---------|------|
| Button | Actions | `shared/ui/Button.tsx` |
| Input | Text input | `shared/ui/Input.tsx` |
| Select | Dropdown | `shared/ui/Select.tsx` |
| Checkbox | Check control | `shared/ui/Checkbox.tsx` |
| Radio | Radio control | `shared/ui/Radio.tsx` |
| Textarea | Multi-line | `shared/ui/Textarea.tsx` |
| DatePicker | Date selection | `shared/ui/DatePicker.tsx` |
| FileUpload | File upload | `shared/ui/FileUpload.tsx` |
| Badge | Generic badge | `shared/ui/Badge.tsx` |
| Avatar | User avatar | `shared/ui/Avatar.tsx` |
| Icon | Icon wrapper | `shared/ui/Icon.tsx` |

#### Level 2: Molecules
| Component | Purpose | File |
|-----------|---------|------|
| StatCard | Metrics display | `shared/ui/StatCard.tsx` |
| StatusBadge | Status indicator | `shared/ui/StatusBadge.tsx` |
| SLABar | SLA progress | `shared/ui/SLABar.tsx` |
| EmptyState | Empty data | `shared/ui/EmptyState.tsx` |
| LoadingSkeleton | Loading state | `shared/ui/LoadingSkeleton.tsx` |
| Pagination | Pagination | `shared/ui/Pagination.tsx` |
| TimelineItem | Timeline entry | `shared/timeline/TimelineItem.tsx` |
| TableCell | Table cell | `shared/table/TableCell.tsx` |
| FormField | Form field | `shared/forms/FormField.tsx` |

#### Level 3: Organisms
| Component | Purpose | File |
|-----------|---------|------|
| DataTable | Generic table | `shared/table/DataTable.tsx` |
| AuditTimeline | Audit events | `shared/timeline/AuditTimeline.tsx` |
| RequestTable | Request list | `shared/table/RequestTable.tsx` |
| UserTable | User list | `shared/table/UserTable.tsx` |
| VaultFileTable | Vault files | `shared/table/VaultFileTable.tsx` |
| FormRenderer | Dynamic form | `shared/forms/FormRenderer.tsx` |
| Modal | Modal dialog | `shared/ui/Modal.tsx` |

#### Level 4: Templates
| Component | Purpose | File |
|-----------|---------|------|
| AppLayout | Root layout | `shared/layout/AppLayout.tsx` |
| AdminLayout | Admin layout | `shared/layout/AdminLayout.tsx` |
| UserLayout | User layout | `shared/layout/UserLayout.tsx` |
| Sidebar | Navigation | `shared/layout/Sidebar.tsx` |
| Header | Page header | `shared/layout/Header.tsx` |
| Breadcrumb | Navigation | `shared/layout/Breadcrumb.tsx` |

---

### 2. Domain Structure (ARCH-02)

**Output:** `src/docs/DOMAIN_STRUCTURE.md`

```
src/
├── app/
│   ├── [locale]/
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
│   └── api/
│       └── [domain]/
│
├── components/
│   ├── shared/
│   │   ├── ui/        # Level 1-2: Atoms & Molecules
│   │   ├── table/    # Level 2-3: Table components
│   │   ├── timeline/  # Level 2-3: Timeline components
│   │   ├── layout/   # Level 4: Templates
│   │   └── forms/    # Level 3: Form components
│   │
│   ├── requests/     # Domain: Requests
│   ├── vault/        # Domain: Vault
│   ├── messages/     # Domain: Messages
│   └── admin/        # Domain: Admin
│
└── lib/
    ├── requests/
    │   ├── services/
    │   ├── types/
    │   └── forms/
    ├── vault/
    ├── workflow/
    │   └── definitions/
    ├── users/
    ├── audit/
    └── types/
```

---

### 3. Form Definition Pattern (ARCH-03)

**Output:** `src/docs/FORM_DEFINITION.md`

**Core:** Form schemas in DB, not hardcoded.

**Schema:**
```typescript
interface FormDefinition {
  id: string;
  code: string;           // "employment_contract"
  name: string;            // "Hợp đồng lao động"
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
  options?: { value: string; label: string }[];  // For select
  validation?: ValidationRule[];
  dependsOn?: string;  // Conditional field
}
```

---

### 4. Workflow Definition Pattern (ARCH-04)

**Output:** `src/docs/WORKFLOW_DEFINITION.md`

**Core:** Workflow states in DB, configurable.

**Schema:**
```typescript
interface WorkflowDefinition {
  id: string;
  code: string;           // "legal_request"
  name: string;
  states: WorkflowState[];
  transitions: WorkflowTransition[];
}

interface WorkflowState {
  code: string;          // "draft", "submitted"
  name: string;
  nameKey?: string;
  order: number;
  color?: string;
  requiresAssignment: boolean;
}

interface WorkflowTransition {
  from: string;
  to: string;
  allowedRoles: Role[];
  actionLabel?: string;
  actionLabelKey?: string;
}
```

---

### 5. Template Engine Pattern (ARCH-05)

**Output:** `src/docs/TEMPLATE_ENGINE.md`

**Core:** Templates with `{{variables}}`, engine merges data.

**Example:**
```txt
BÊN A: {{company_name}}
Mã số thuế: {{tax_code}}
Ngày ký: {{signing_date}}
```

---

### 6. API Standards (ARCH-06)

**Output:** `src/docs/API_STANDARDS.md`

```typescript
// Success
{ data: T, meta?: { page, pageSize, total } }

// Error
{ error: string, detail?: string }

// Naming
GET    /api/[resource]
GET    /api/[resource]/:id
POST   /api/[resource]
PUT    /api/[resource]/:id
DELETE /api/[resource]/:id
```

---

### 7. Service Layer (ARCH-07)

**Output:** `src/docs/SERVICE_LAYER.md`

| What | Where |
|-------|-------|
| Business logic | `lib/[domain]/services/` |
| Validation | Service functions |
| UI state | Components |
| Server state | TanStack Query |

---

### 8. TypeScript Types (ARCH-08)

**Output:** `src/lib/types/`

```
lib/types/
├── index.ts
├── user.ts
├── workspace.ts
├── request.ts
├── audit.ts
├── vault.ts
├── review.ts
└── workflow.ts
```

---

### 9. Code Standards (ARCH-09)

**Output:** `src/docs/CODE_STANDARDS.md`

| Type | Convention |
|------|------------|
| Components | PascalCase.tsx |
| Files | kebab-case.ts |
| Functions | camelCase |
| Constants | UPPER_SNAKE_CASE |
| Types | PascalCase |

---

### 10. i18n Rules (ARCH-10)

**Output:** `src/docs/I18N_RULES.md`

| What | i18n? |
|------|--------|
| UI text | ✓ |
| Internal logs | ✗ |

---

### 11. Shared Component Extraction (ARCH-11)

**Output:** `src/components/shared/ui/StatCard.tsx`

**Variants:** blue, green, orange, purple, red

---

## Boundaries

**In scope:**
- Architecture documentation
- Component registry with granular breakdown
- Domain structure
- Form/Workflow/Template patterns
- Standards for new code

**Out of scope:**
- NestJS migration
- PostgreSQL migration
- Full implementation of dynamic patterns
- Retroactive refactoring

---

## Acceptance Criteria

- [ ] `src/docs/DOMAIN_STRUCTURE.md` with folder organization
- [ ] `src/docs/FORM_DEFINITION.md` with schema
- [ ] `src/docs/WORKFLOW_DEFINITION.md` with schema
- [ ] `src/docs/TEMPLATE_ENGINE.md` with patterns
- [ ] `src/docs/API_STANDARDS.md` with envelope pattern
- [ ] `src/docs/SERVICE_LAYER.md` with boundaries
- [ ] `src/docs/CODE_STANDARDS.md` with conventions
- [ ] `src/docs/I18N_RULES.md` with decision matrix
- [ ] `src/components/COMPONENT_REGISTRY.md` with 30+ components
- [ ] `src/lib/types/` with unified interfaces
- [ ] `src/components/shared/ui/StatCard.tsx` unified

---

## Ambiguity Report

| Dimension | Score | Min | Status |
|-----------|-------|------|--------|
| Goal Clarity | 0.95 | 0.75 | ✓ |
| Boundary Clarity | 0.90 | 0.70 | ✓ |
| Constraint Clarity | 0.90 | 0.65 | ✓ |
| Acceptance Criteria | 0.95 | 0.70 | ✓ |
| **Ambiguity** | **0.08** | ≤0.20 | ✓ |

---

*Phase: 55-architecture-standards*
*Spec updated: 2026-06-14 - Architecture Redesign (Hybrid Approach)*
*All decisions confirmed by user*
