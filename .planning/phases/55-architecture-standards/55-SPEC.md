# Phase 55: Architecture & Standards — Specification

**Created:** 2026-06-14
**Updated:** 2026-06-14
**Ambiguity score:** 0.15 (gate: ≤ 0.20)
**Requirements:** 9 locked

## Goal

Establish consistent development patterns and architecture foundation for a metadata-driven Legal-as-a-Service platform. Create standards that enable dynamic forms, workflows, and templates without code changes.

## Background

The codebase has grown organically during v1.0 and v2.0. Current architecture is a standard NextJS CRUD app. For the platform to scale to 100+ legal services without code changes, we need:

1. **Domain-based structure** - organize by business domain, not by technical type
2. **Dynamic Form Definition** - store form schemas in DB, not hardcoded
3. **Dynamic Workflow Definition** - store workflow states in DB, not hardcoded
4. **Template Engine** - variables in templates, not hardcoded values

**Current state:**
- NextJS App Router with API Routes (works fine, keep it)
- SQLite with Prisma (keep for MVP, PostgreSQL later)
- Hardcoded forms in components
- Hardcoded workflow states in code
- 87+ components across 10 directories

---

## Requirements

### 1. Component Registry (ARCH-01)

**Output:** `src/components/COMPONENT_REGISTRY.md`

**Format:** Markdown table
| Component | Props | Usage | Location | Type |
|-----------|-------|-------|----------|------|

**Types:**
- `shared` - reusable across pages
- `page-specific` - single page only
- `layout` - layout components

**Minimum:** 20+ components documented

---

### 2. API Standards Document (ARCH-02)

**Output:** `src/docs/API_STANDARDS.md`

#### Response Envelope Pattern
```typescript
// Success
{ data: T, meta?: { page, pageSize, total, cursor } }
// Error
{ error: string, detail?: string }
```

#### Naming Conventions
```
GET    /api/[resource]         // List
GET    /api/[resource]/:id    // Get one
POST   /api/[resource]         // Create
PUT    /api/[resource]/:id    // Update
DELETE /api/[resource]/:id    // Delete
```

---

### 3. Shared Components Extraction (ARCH-03)

**Output:** `src/components/ui/StatCard.tsx` (unified)

**Variants:** blue, green, orange, purple, red

**Props:**
```typescript
interface StatCardProps {
  title: string;
  titleKey?: string;
  value: number | string;
  description?: string;
  descriptionKey?: string;
  icon: 'file' | 'clock' | 'check' | 'folder' | 'alert';
  variant: 'blue' | 'green' | 'orange' | 'purple' | 'red';
}
```

---

### 4. Service Layer Separation (ARCH-04)

**Output:** `src/docs/SERVICE_LAYER.md`

#### Service Boundaries
| What | Where | Example |
|------|-------|---------|
| Business logic | `src/lib/[domain]/[service].ts` | `createDraftIntake()` |
| Validation | Service functions | `assertAdmin()` |
| UI state | Components/hooks | `useState` |
| Server state | TanStack Query | `useRequests()` |

---

### 5. TypeScript Type Unification (ARCH-05)

**Output:** `src/lib/types/` directory

```
src/lib/types/
├── index.ts
├── user.ts
├── workspace.ts
├── request.ts
├── audit.ts
├── vault.ts
└── review.ts
```

---

### 6. Code Standards Document (ARCH-06)

**Output:** `src/docs/CODE_STANDARDS.md`

#### Naming Conventions
| Type | Convention | Example |
|------|------------|---------|
| React components | PascalCase | `AdminDashboard.tsx` |
| Regular files | kebab-case | `intake-service.ts` |
| Functions | camelCase | `createUser()` |
| Constants | UPPER_SNAKE_CASE | `ADMIN_ROLES` |

#### Import Order
1. React & Next.js core
2. Third-party libraries
3. Internal (@/) aliases
4. Relative imports

---

### 7. i18n Implementation Rules (ARCH-07)

**Output:** `src/docs/I18N_RULES.md`

#### Decision Matrix
| What | i18n? | Example |
|------|--------|---------|
| UI text | ✓ | `t('Common.save')` |
| Internal logs | ✗ | `console.error()` |

---

### 8. Domain Structure [NEW] (ARCH-08)

**Output:** `src/docs/DOMAIN_STRUCTURE.md`

**Organize code by business domain, not technical type:**

```
src/
├── app/
│   ├── [locale]/           # Pages (grouped by domain)
│   │   ├── requests/       # Request-related pages
│   │   ├── vault/         # Vault-related pages
│   │   └── admin/         # Admin pages
│   └── api/               # API routes
│       ├── requests/       # Request APIs
│       ├── vault/          # Vault APIs
│       └── admin/          # Admin APIs
│
├── components/
│   ├── requests/           # Request components
│   │   ├── StatCard.tsx
│   │   └── RequestList.tsx
│   ├── vault/              # Vault components
│   └── admin/              # Admin components
│
└── lib/
    ├── requests/           # Request services
    │   ├── request-service.ts
    │   ├── intake-service.ts
    │   └── types.ts
    ├── vault/              # Vault services
    │   ├── vault-service.ts
    │   └── types.ts
    └── shared/             # Cross-domain utilities
```

**NOT by technical type:**
```
❌ src/components/buttons/
❌ src/components/cards/
❌ src/hooks/useSomething.ts
```

---

### 9. Form Definition Pattern [NEW - KEY] (ARCH-09)

**Output:** `src/docs/FORM_DEFINITION.md`

**Core Concept:** Form schemas stored in DB, not hardcoded in components.

**Database Schema:**
```prisma
model FormDefinition {
  id          String   @id @default(cuid())
  code        String   @unique  // e.g., "employment_contract"
  name        String            // Vietnamese: "Hợp đồng lao động"
  description String?
  fields      Json              // Field definitions array
  version     Int      @default(1)
  status      String   @default("draft")  // draft, published, deprecated
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Field Definition Schema:**
```typescript
interface FormField {
  key: string;           // "employee_name"
  type: FieldType;       // "text" | "number" | "date" | "select" | "textarea" | "file"
  label: string;         // "Tên nhân viên"
  labelKey?: string;     // i18n key
  placeholder?: string;
  required?: boolean;
  validation?: ValidationRule[];
  options?: SelectOption[];  // For select type
  dependsOn?: string;       // Conditional field
}

type FieldType = 'text' | 'number' | 'date' | 'select' | 'textarea' | 'file' | 'checkbox';
```

**Form Renderer Component:**
```typescript
// src/components/forms/FormRenderer.tsx
interface FormRendererProps {
  formCode: string;      // Load form definition from DB
  initialValues?: Record<string, any>;
  onSubmit: (values: Record<string, any>) => void;
}
```

**Benefits:**
- Add new form field = insert to DB, no code change
- Change field order = update JSON array
- Different forms for different request types = different FormDefinition records

---

### 10. Workflow Definition Pattern [NEW - KEY] (ARCH-10)

**Output:** `src/docs/WORKFLOW_DEFINITION.md`

**Core Concept:** Workflow states stored in DB, not hardcoded in code.

**Database Schema:**
```prisma
model WorkflowDefinition {
  id          String   @id @default(cuid())
  code        String   @unique  // e.g., "legal_request"
  name        String            // "Quy trình yêu cầu pháp lý"
  states      Json              // Array of state definitions
  transitions Json              // Array of transition rules
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model WorkflowState {
  id                 String  @id @default(cuid())
  code               String  // "draft", "submitted", "review", "approved"
  name               String  // "Bản nháp", "Đã gửi", "Phê duyệt"
  nameKey           String? // i18n key
  order              Int     // Display order
  color              String? // For UI badges
  requiresAssignment Boolean @default(false)
}

model WorkflowTransition {
  id             String  @id @default(cuid())
  fromState      String  // Source state code
  toState        String  // Target state code
  allowedRoles   String[] // Who can trigger this transition
  actionLabel    String? // Button label
  actionLabelKey String? // i18n key
}
```

**Workflow Service:**
```typescript
// src/lib/workflow/workflow-service.ts
interface WorkflowService {
  getAvailableTransitions(workflowCode: string, currentState: string, actorRole: Role): Transition[];
  canTransition(workflowCode: string, from: string, to: string, actorRole: Role): boolean;
  executeTransition(requestId: string, toState: string, actor: AppSession): Promise<void>;
}
```

**Benefits:**
- Add new workflow step = insert to DB, no code change
- Change approval flow = update transitions JSON
- Different workflows = different WorkflowDefinition records

---

### 11. Template Engine Pattern [NEW] (ARCH-11)

**Output:** `src/docs/TEMPLATE_ENGINE.md`

**Core Concept:** Templates with variables, not hardcoded values.

**Template Example:**
```txt
CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc

HỢP ĐỒNG LAO ĐỘNG

Hôm nay, ngày {{signing_date}}, tại {{location}}

BÊN A: {{company_name}}
Mã số thuế: {{tax_code}}
Địa chỉ: {{company_address}}
Người đại diện: {{representative_name}}
Chức vụ: {{representative_title}}

BÊN B: {{employee_name}}
Số CCCD: {{employee_id_number}}
Địa chỉ: {{employee_address}}
```

**Template Processing:**
```typescript
// src/lib/documents/template-service.ts
interface TemplateService {
  render(templateId: string, variables: Record<string, string>): Promise<string>;
  extractVariables(templateId: string): string[];  // For form field mapping
}
```

---

## Boundaries

**In scope:**
- Architecture standards documents
- Component registry
- Shared component extraction (StatCard)
- Domain-based folder structure
- Form/Workflow/Template definition patterns
- Standards for new code

**Out of scope:**
- Migrate to NestJS backend
- Migrate to PostgreSQL
- Implement full dynamic forms/workflows (future phases)
- Retroactively fix all existing code
- Create new features

---

## Acceptance Criteria

- [ ] `src/components/COMPONENT_REGISTRY.md` with 20+ components
- [ ] `src/docs/API_STANDARDS.md` with envelope pattern
- [ ] `src/docs/CODE_STANDARDS.md` with naming conventions
- [ ] `src/docs/SERVICE_LAYER.md` with boundaries
- [ ] `src/docs/I18N_RULES.md` with decision matrix
- [ ] `src/docs/DOMAIN_STRUCTURE.md` with folder organization
- [ ] `src/docs/FORM_DEFINITION.md` with schema and renderer design
- [ ] `src/docs/WORKFLOW_DEFINITION.md` with state machine design
- [ ] `src/docs/TEMPLATE_ENGINE.md` with variable system
- [ ] Unified `StatCard` component in `ui/`
- [ ] `src/lib/types/` with unified interfaces

---

## Ambiguity Report

| Dimension | Score | Min | Status |
|-----------|-------|------|--------|
| Goal Clarity | 0.90 | 0.75 | ✓ |
| Boundary Clarity | 0.85 | 0.70 | ✓ |
| Constraint Clarity | 0.85 | 0.65 | ✓ |
| Acceptance Criteria | 0.90 | 0.70 | ✓ |
| **Ambiguity** | **0.15** | ≤0.20 | ✓ |

---

*Phase: 55-architecture-standards*
*Spec updated: 2026-06-14 - Architecture Redesign (Hybrid Approach)*
*Next step: Discuss architecture decisions*
