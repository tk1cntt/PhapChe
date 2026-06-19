# Phase 55: Architecture & Standards — Specification

**Created:** 2026-06-14
**Updated:** 2026-06-14
**Ambiguity score:** 0.06 (gate: ≤ 0.20)
**Requirements:** 17 locked

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

**Principle:** Component-first — define i18n keys at component level first, then extend at page level.

**Directory Structure:**
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
│   └── forms/
├── features/                     # EXTEND - Feature/Page i18n
│   ├── requests/
│   └── admin/
└── index.json                   # Common keys only
```

**Key Naming Convention:** `Component.element.action`

```json
{
  "Button.save": "Lưu",
  "Button.cancel": "Hủy",
  "StatusBadge.draft": "Bản nháp",
  "StatusBadge.submitted": "Đã gửi",
  "DataTable.empty": "Không có dữ liệu",
  "DataTable.loading": "Đang tải..."
}
```

**Rules:**
| What | i18n? | Reason |
|------|-------|--------|
| UI text (components) | ✓ | Reusable across pages |
| UI text (pages) | ✓ | Page-specific context |
| Internal logs | ✗ | Debug only |
| Error codes | ✗ | Technical identifiers |
| Database values | ✗ | Stored as-is |

**Usage:**
```tsx
// Component - use component namespace
const { t } = useTranslation('components:ui');
<span>{t('Button.save')}</span>

// Page - extend with feature namespace
const { t } = useTranslation(['components:ui', 'features:requests']);
<span>{t('RequestList.title')}</span>
```

---

### 11. Shared Component Extraction (ARCH-11)

**Output:** `src/components/shared/ui/StatCard.tsx`

**Variants:** blue, green, orange, purple, red

---

### 12. Storybook Setup (ARCH-12)

**Output:** Storybook configuration for visual documentation

**Purpose:** Live demo documentation for all shared components

**Setup:**
```bash
npm install -D storybook @storybook/react @storybook/addon-essentials
```

**Stories location:** `src/components/shared/**/*.stories.tsx`

**Example story:**
```tsx
// src/components/shared/ui/StatCard.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { StatCard } from './StatCard';

const meta: Meta<typeof StatCard> = {
  title: 'Shared/UI/StatCard',
  component: StatCard,
};
export default meta;

export const Blue: StoryObj = {
  args: {
    title: 'Tổng yêu cầu',
    value: 42,
    icon: 'file',
    variant: 'blue',
  },
};
```

**Benefits:**
- Visual testing without running app
- Component playground for designers
- Auto-generated documentation

---

### 13. Automated Component Registry Generator (ARCH-13)

**Output:** `scripts/generate-component-registry.mjs`

**Purpose:** Scan codebase, auto-generate COMPONENT_REGISTRY.md

**Features:**
- Scan `src/components/` recursively
- Extract props interfaces
- Detect usage locations
- Generate markdown table

**Usage:**
```bash
node scripts/generate-component-registry.mjs
```

**Output:** Updated `src/components/COMPONENT_REGISTRY.md`

**Example output:**
```markdown
# Component Registry

Generated: 2024-01-15

## Shared Components

| Component | File | Props | Used By |
|----------|------|-------|---------|
| StatCard | shared/ui/StatCard.tsx | title, value, icon, variant | AdminDashboard, UserDashboard |
| StatusBadge | shared/ui/StatusBadge.tsx | status, size | RequestTable, MyCases |

## Page-Specific Components

| Component | File | Used By |
|----------|------|---------|
| CreateWizard | requests/CreateWizard.tsx | Create Request page |
```

---

### 14. ESLint Component Naming Rule (ARCH-14)

**Output:** Custom ESLint rule to detect duplicate/unnamed components

**Rule:** Warn when creating component with similar name to existing shared component

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'no-duplicate-component': {
      // Warn if creating component with similar name to shared
      // Suggest using existing shared component instead
    }
  }
};
```

**Example warnings:**
```
⚠️ Creating 'Card' component - similar to existing 'StatCard' in shared/ui/
   Consider using shared component or choose a more specific name.

⚠️ Component 'AdminTable' used only in 1 place
   Consider if this should be in shared/table/ instead.
```

---

### 15. API Registry (ARCH-15)

**Output:** `src/docs/API_REGISTRY.md`

**Purpose:** Central documentation of all API endpoints to prevent duplication.

**Structure:**
```markdown
# API Registry

## Core APIs

| Method | Endpoint | Description | Params |
|--------|----------|-------------|--------|
| GET | /api/requests | List all requests | ?page, ?status, ?type |
| GET | /api/requests/:id | Get request detail | - |
| POST | /api/requests | Create new request | body |
| PUT | /api/requests/:id | Update request | body |
| DELETE | /api/requests/:id | Soft delete | - |

## Reusable Patterns

### Pagination
GET /api/[resource]?page=1&pageSize=20

### Filtering
?status=draft_intake&type=employment_contract

### Sorting
?sort=createdAt&order=desc
```

**Naming Conventions:**
- Plural nouns: `/api/requests` not `/api/request`
- REST methods: GET, POST, PUT, DELETE
- Versioning: `/api/v1/[resource]`

---

### 16. Swagger/OpenAPI Documentation (ARCH-16)

**Output:** Auto-generated API documentation via `/api/docs`

**Dependencies:**
```bash
npm install swagger-ui-react next-swagger-doc
```

**Configuration:** `src/app/api/swagger/route.ts`

**Benefits:**
- Auto-generated docs from code
- Interactive API explorer (Swagger UI)
- Standard OpenAPI 3.0 format
- Easy to find existing APIs

---

### 17. Central API Client (ARCH-17)

**Output:** `src/lib/api/index.ts`

**Purpose:** Single API client for all API calls - reuse instead of duplicate.

```typescript
// Central API client
import { apiClient } from '@/lib/api/client';

export const requestsApi = {
  list: (params) => apiClient.get('/api/requests', { params }),
  get: (id) => apiClient.get(`/api/requests/${id}`),
  create: (data) => apiClient.post('/api/requests', data),
  update: (id, data) => apiClient.put(`/api/requests/${id}`, data),
  delete: (id) => apiClient.delete(`/api/requests/${id}`),
};
```

**Usage:**
```tsx
// ✅ Good - reuse existing API client
import { requestsApi } from '@/lib/api';
const { data } = await requestsApi.list({ status: 'draft' });

// ❌ Bad - creating duplicate API call
fetch('/api/requests').then(...)
```

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
- [ ] `src/docs/API_REGISTRY.md` with endpoint documentation
- [ ] `src/docs/SERVICE_LAYER.md` with boundaries
- [ ] `src/docs/CODE_STANDARDS.md` with conventions
- [ ] `src/docs/I18N_RULES.md` with decision matrix
- [ ] `src/components/COMPONENT_REGISTRY.md` with 30+ components
- [ ] `src/lib/types/` with unified interfaces
- [ ] `src/components/shared/ui/StatCard.tsx` unified
- [ ] Storybook configured with shared component stories
- [ ] `scripts/generate-component-registry.mjs` auto-generates registry
- [ ] ESLint rule warns on duplicate component names
- [ ] Swagger/OpenAPI configured at `/api/docs`
- [ ] `src/lib/api/` central API client

---

## Ambiguity Report

| Dimension | Score | Min | Status |
|-----------|-------|------|--------|
| Goal Clarity | 0.98 | 0.75 | ✓ |
| Boundary Clarity | 0.95 | 0.70 | ✓ |
| Constraint Clarity | 0.92 | 0.65 | ✓ |
| Acceptance Criteria | 0.96 | 0.70 | ✓ |
| **Ambiguity** | **0.06** | ≤0.20 | ✓ |

---

*Phase: 55-architecture-standards*
*Spec updated: 2026-06-14 - Architecture Redesign (Hybrid Approach)*
*All decisions confirmed by user*
