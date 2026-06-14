# Phase 55: Architecture & Standards — Specification

**Created:** 2026-06-14
**Updated:** 2026-06-14
**Ambiguity score:** 0.10 (gate: ≤ 0.20) ← improved from 0.14
**Requirements:** 7 locked

## Goal

Establish consistent development patterns across the codebase: shared component registry, API standards, service layer separation, type safety, and code conventions that prevent ad-hoc implementation.

## Background

The codebase has grown organically during v1.0 and v2.0. Components were created without a centralized registry, API endpoints use inconsistent response formats, and business logic is scattered between components and API routes. This phase creates the standards foundation for all subsequent feature phases.

**Current state:**
- 87+ components in `src/components/` across 10 directories
- Service layer partially exists (`src/lib/workflow/`, `src/lib/intake/`, etc.)
- API routes use different response patterns
- TypeScript has scattered `as any` casts
- No shared component documentation

---

## Requirements

### 1. Component Registry (ARCH-01)

**Output:** `src/components/COMPONENT_REGISTRY.md`

**Format:** Markdown với markdown table columns:
| Component | Props Interface | Usage | Location |
|-----------|----------------|-------|----------|

**Minimum deliverables:**
- 20+ components documented
- Each entry có: tên component, props interface (typed), mô tả usage, file path
- Phân loại: `shared` (reusable) vs `internal` (one-time use)

**Example entry:**
```markdown
### StatCard
**Props:**
```typescript
interface StatCardProps {
  title: string;           // Display text
  titleKey?: string;       // i18n key (alternative to title)
  value: number | string;
  icon: 'file' | 'clock' | 'check' | 'folder' | 'alert';
  variant: 'blue' | 'green' | 'orange' | 'purple' | 'red';
}
```
**Usage:** Hiển thị metrics với icon và color-coded background
**Location:** `src/components/ui/StatCard.tsx`
```

---

### 2. API Standards Document (ARCH-02)

**Output:** `src/docs/API_STANDARDS.md`

**Must define:**

#### Response Envelope Pattern
```typescript
// Success
{
  data: T | T[],      // Response payload
  meta?: {            // Optional pagination metadata
    page?: number,
    pageSize?: number,
    total?: number,
    cursor?: string
  }
}

// Error
{
  error: string,      // Error code: FORBIDDEN, NOT_FOUND, VALIDATION_ERROR, etc.
  detail?: string     // Optional debug info (strip in production)
}
```

#### HTTP Status Codes
| Status | Usage |
|--------|-------|
| 200 | Success |
| 201 | Created |
| 400 | Validation error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not found |
| 500 | Internal error |

#### Naming Conventions
```
GET    /api/[resource]           // List
GET    /api/[resource]/:id       // Get one
POST   /api/[resource]           // Create
PUT    /api/[resource]/:id       // Update
DELETE /api/[resource]/:id       // Delete
```

#### Pagination
- Offset-based: `?page=1&pageSize=20`
- Response includes `meta.total` for total count

---

### 3. Shared Components Extraction (ARCH-03)

**Output:** `src/components/ui/StatCard.tsx` (unified)

**Variants to support:** 5 variants
- `blue` - Primary metrics, totals
- `green` - Success, completed
- `orange` - Warning, attention needed
- `purple` - Neutral/informational
- `red` - Error, critical

**Props Interface:**
```typescript
interface StatCardProps {
  title: string;           // Display text
  titleKey?: string;       // i18n key (alternative to title)
  value: number | string;
  description?: string;
  descriptionKey?: string; // i18n key for description
  icon: 'file' | 'clock' | 'check' | 'folder' | 'alert';
  variant: 'blue' | 'green' | 'orange' | 'purple' | 'red';
}
```

**Backward Compatibility:**
- Components using old implementations must be updated to import from `src/components/ui/StatCard.tsx`
- Verify: `grep -r "AdminStatCard\|StatCard" src/` shows all imports from unified location

---

### 4. Service Layer Separation (ARCH-04)

**Output:** `src/docs/SERVICE_LAYER.md`

**Must define:**

#### Service Boundaries
| What | Where | Example |
|------|-------|---------|
| Business logic | `src/lib/[domain]/[service].ts` | `createDraftIntake()`, `transitionRequestStatus()` |
| Validation | Service functions | `assertAdmin()`, `validateEmail()` |
| Data access | Service or Prisma directly | `prisma.user.findMany()` |
| UI state | Components/hooks | `useState`, `useQuery` |
| Server state | TanStack Query hooks | `useRequests()`, `useUsers()` |

#### Service Pattern
```typescript
// src/lib/[domain]/[service].ts
export async function serviceFunction({ 
  actor,    // AppSession - who is doing this
  input,    // Validated input
  db = prisma  // For testing
}) {
  // 1. Authorization check
  assertAdmin(actor);
  
  // 2. Input validation
  validateInput(input);
  
  // 3. Business logic
  const result = await db.operation(...);
  
  // 4. Audit logging
  await recordAuditEvent({...}, db);
  
  return result;
}
```

#### Directory Structure
```
src/lib/
├── workflow/          # State machine, transitions
├── intake/           # Intake form handling
├── documents/        # Vault, templates
├── security/          # RBAC, session
├── audit/            # Audit logging
└── ops/              # Operations utilities
```

---

### 5. TypeScript Type Unification (ARCH-05)

**Output:** `src/lib/types/` directory

**Directory Structure:**
```
src/lib/types/
├── index.ts          # Re-exports all types
├── user.ts          # User, AppSession, notification preferences
├── workspace.ts     # Workspace, Membership, role mappings
├── request.ts       # LegalRequest, IntakeSubmission, Assignment
├── audit.ts         # AuditEvent, AuditTargetType
├── vault.ts         # VaultFile, DocumentVersion
└── review.ts        # Review, ChecklistAnswer
```

**User Types (user.ts):**
```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  title?: string;
  role: Role;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface AppSession {
  userId: string;
  activeWorkspaceId: string;
  roles: Role[];
}

export interface NotificationPreferences {
  emailOnReply: boolean;
  slaReminder: boolean;
  weeklySummary: boolean;
}
```

**Workspace Types (workspace.ts):**
```typescript
export interface Workspace {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'inactive';
  createdAt: Date;
}

export interface Membership {
  id: string;
  userId: string;
  workspaceId: string;
  role: Role;
  joinedAt: Date;
}
```

**Request Types (request.ts):**
```typescript
export interface LegalRequest {
  id: string;
  code: string;
  type: MatterType;
  status: RequestStatus;
  priority: 'low' | 'medium' | 'high';
  customerId: string;
  workspaceId: string;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
  slaDeadline?: Date;
}
```

**Acceptance:** Zero `as any` in new code. Legacy code may have `as any` with `// TODO: fix type` comment.

---

### 6. Code Standards Document (ARCH-06)

**Output:** `src/docs/CODE_STANDARDS.md`

**Must define:**

#### Naming Conventions
| Type | Convention | Example |
|------|------------|---------|
| React components | PascalCase | `AdminDashboard.tsx` |
| Regular files | kebab-case | `intake-service.ts` |
| Functions | camelCase | `createUser()` |
| Constants | UPPER_SNAKE_CASE | `ADMIN_ROLES` |
| Types/Interfaces | PascalCase | `AppSession` |
| Enums | PascalCase | `RequestStatus` |

#### File Structure
```
src/
├── app/                    # Next.js App Router
│   ├── [locale]/          # Locale-prefixed pages
│   └── api/               # API routes
├── components/             # React components
│   ├── ui/                # Shared UI components
│   └── [feature]/         # Feature-specific
├── lib/                   # Business logic
│   ├── [domain]/          # Domain services
│   ├── types/             # Type definitions
│   └── hooks/             # Custom hooks
└── constants/              # Static constants
```

#### Import Order
```typescript
// 1. React & Next.js core
import React, { useState } from 'react';
import { NextRequest } from 'next/server';

// 2. Third-party libraries
import { prisma } from '@prisma/client';
import { useQuery } from '@tanstack/react-query';

// 3. Internal path aliases
import { canAccessRequest } from '@/lib/security/rbac';

// 4. Relative imports
import { CHECKLIST_ITEMS } from './checklist';
```

#### TypeScript Rules
- Use `strict` mode
- Use `import type` for type-only imports
- No `as any` except legacy code with TODO
- Explicit return types for exported functions

---

### 7. i18n Implementation Rules (ARCH-07)

**Output:** `src/docs/I18N_RULES.md`

**Decision Matrix:**

| What | i18n? | Example |
|------|--------|---------|
| Button labels | ✓ | `t('Common.save')` |
| Headings/Titles | ✓ | `t('Dashboard.welcome')` |
| Table headers | ✓ | `t('Requests.status')` |
| Error messages (user-facing) | ✓ | `t('Errors.invalidEmail')` |
| Placeholder text | ✓ | `t('Forms.searchPlaceholder')` |
| Tooltips | ✓ | `t('Common.required')` |
| Internal logs | ✗ | `console.error('DB error')` |
| Debug output | ✗ | `console.log(value)` |
| Error codes | ✗ | `'FORBIDDEN'`, `'NOT_FOUND'` |
| API paths | ✗ | `'/api/users'` |
| CSS class names | ✗ | `'stat-card'` |

**Implementation Pattern:**
```typescript
// User-facing: use i18n
const t = useTranslations('ComponentName');
<Button>{t('save')}</Button>

// Internal: use hardcoded strings
console.error('FORBIDDEN: insufficient permissions');
```

**Translation Key Structure:**
```
[ComponentName].[action|field]
Common.save
Common.cancel
Dashboard.welcome
Errors.invalidEmail
Forms.searchPlaceholder
```

---

## Boundaries

**In scope:**
- Documentation files (`src/docs/*.md`)
- Component registry (`src/components/COMPONENT_REGISTRY.md`)
- Shared component extraction (StatCard)
- Type unification in `src/lib/types/`
- Standards enforcement in new code

**Out of scope:**
- Retroactively fixing all existing components (deferred to feature phases)
- Creating new features
- Database schema changes
- Performance optimization
- Test coverage improvement

---

## Acceptance Criteria

- [ ] `src/components/COMPONENT_REGISTRY.md` exists with 20+ components documented
- [ ] `src/docs/API_STANDARDS.md` defines response format, error codes, pagination
- [ ] `src/docs/CODE_STANDARDS.md` defines naming, structure, import conventions
- [ ] `src/docs/SERVICE_LAYER.md` documents service layer responsibilities
- [ ] `src/docs/I18N_RULES.md` defines translation scope and implementation
- [ ] Single `StatCard` component replaces all duplicate implementations
- [ ] `src/lib/types/` contains unified interfaces for core entities
- [ ] Zero `as any` in new code (legacy code with TODO acceptable)

---

## Ambiguity Report

| Dimension | Score | Min | Status | Notes |
|-----------|-------|------|--------|-------|
| Goal Clarity | 0.95 | 0.75 | ✓ | Foundation phase for consistent patterns |
| Boundary Clarity | 0.90 | 0.70 | ✓ | Documentation + extraction, no new features |
| Constraint Clarity | 0.90 | 0.65 | ✓ | Standards only for new code |
| Acceptance Criteria | 0.95 | 0.70 | ✓ | 8 pass/fail checkboxes |
| **Ambiguity** | **0.10** | ≤0.20 | ✓ | Improved from 0.14 |

---

## Interview Log

| Round | Perspective | Question summary | Decision locked |
|-------|-------------|-----------------|----------------|
| 1 | Researcher | What exists in codebase today? | 87+ components, partial service layer, inconsistent API patterns |
| 1 | Researcher | What triggers this work? | Ad-hoc implementation causing inconsistency across phases |
| 2 | Simplifier | Minimum viable foundation? | Component registry + API standards + shared components |
| 3 | Boundary Keeper | What's NOT this phase? | No retroactively fixing all legacy code |
| 4 | Failure Analyst | What goes wrong without standards? | Duplicate components, inconsistent APIs, type errors |

---

*Phase: 55-architecture-standards*
*Spec created: 2026-06-14*
*Spec updated: 2026-06-14 with specific deliverables*
*Next step: /gsd-execute-phase 55*
