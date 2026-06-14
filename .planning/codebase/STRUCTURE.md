# Codebase Structure

**Analysis Date:** 2026-06-14

## Directory Layout

```
D:\PhapChe/
├── prisma/                    # Database schema and seeds
│   ├── schema.prisma         # Prisma schema (SQLite)
│   └── seed*.ts              # Database seed scripts
├── src/                      # Main application source
│   ├── app/                  # Next.js App Router
│   ├── components/          # React components
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Service layer and utilities
│   ├── constants/            # Static constants
│   ├── middleware.ts         # Request middleware
│   ├── auth.ts               # Better-Auth configuration
│   ├── routing.ts            # i18n routing config
│   └── i18n.ts               # i18n configuration
├── .planning/                # GSD planning documents
└── package.json
```

## Directory Purposes

**`src/app/`:**
- Purpose: Next.js App Router pages and API routes
- Contains: `[locale]/` pages, `api/` routes, layouts
- Key files: `src/app/layout.tsx`, `src/app/middleware.ts`

**`src/components/`:**
- Purpose: React UI components
- Contains: Admin, auth, create-request, layout, messages, my-cases, settings, ui
- Key files: Component subdirectories with `index.ts` barrel exports

**`src/lib/`:**
- Purpose: Business logic, services, utilities
- Contains: audit, documents, intake, ops, reviews, security, workflow, hooks
- Key files: `src/lib/prisma.ts`, `src/lib/types.ts`, `src/lib/security/session.ts`

**`src/hooks/`:**
- Purpose: Custom React hooks for data fetching
- Contains: `useRequests.ts`, `useUsers.ts`, `useAuditEvents.ts`
- Note: Lowercase directory, different from `src/lib/hooks/`

**`src/lib/hooks/`:**
- Purpose: Utility hooks (not data fetching)
- Contains: `usePaginationParams.ts`, `useDebounce.ts`

**`prisma/`:**
- Purpose: Database schema and seed data
- Contains: `schema.prisma`, seed files for different datasets

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx`: Root layout with AntdRegistry
- `src/middleware.ts`: Request middleware (i18n + auth)
- `src/routing.ts`: Locale routing configuration

**Configuration:**
- `src/auth.ts`: Better-Auth setup with Prisma adapter
- `src/lib/prisma.ts`: Prisma client singleton
- `src/lib/types.ts`: Type constants and enums
- `prisma/schema.prisma`: Database schema

**Core Logic:**
- `src/lib/workflow/request-workflow.ts`: Request state machine
- `src/lib/intake/intake-service.ts`: Intake form handling
- `src/lib/documents/vault-service.ts`: File vault operations
- `src/lib/security/rbac.ts`: Access control
- `src/lib/security/session.ts`: Session management
- `src/lib/audit/audit.ts`: Audit event recording

**API Routes:**
- `src/app/api/intake/create-draft/route.ts`
- `src/app/api/intake/submit/route.ts`
- `src/app/api/intake/attach-file/route.ts`
- `src/app/api/vault/[vaultFileId]/download/route.ts`
- `src/app/api/admin/requests/[id]/assign/route.ts`

**Testing:**
- `src/**/*.test.ts`: Unit tests
- `src/**/*.test.tsx`: Component tests
- `src/**/*.e2e.test.ts`: E2E tests
- `src/lib/foundation.e2e.test.ts`: Core functionality E2E

## Naming Conventions

**Files:**
- PascalCase for React components: `AdminDashboardClient.tsx`
- kebab-case for utilities: `audit-service.ts`, `vault-service.ts`
- snake_case for seed files: `seed-customers.ts`, `seed-messages.ts`

**Directories:**
- kebab-case for feature directories: `src/lib/documents/`, `src/app/api/intake/`
- kebab-case for component directories: `src/components/admin/`, `src/components/my-cases/`
- lowercase for hooks directories: `src/hooks/`, `src/lib/hooks/`

**TypeScript/React:**
- camelCase for functions and variables
- PascalCase for types and components
- UPPER_SNAKE_CASE for constants: `REQUEST_STATUS`, `ROLE`

## Where to Add New Code

**New Feature Service:**
- Primary code: `src/lib/[feature]/[feature]-service.ts`
- Tests: `src/lib/[feature]/[feature]-service.test.ts`
- Example: `src/lib/delivery/delivery-service.ts`

**New API Route:**
- Location: `src/app/api/[domain]/[action]/route.ts`
- Example: `src/app/api/admin/users/route.ts` for GET/POST users

**New Component:**
- Primary: `src/components/[domain]/[ComponentName].tsx`
- Tests: `src/components/[domain]/[ComponentName].test.tsx`
- Index: `src/components/[domain]/index.ts` (barrel export)

**New Database Model:**
- Schema: `prisma/schema.prisma`
- After edit: Run `npx prisma generate`

**Utilities/Helpers:**
- Feature-specific: `src/lib/[feature]/[helper].ts`
- Shared: `src/lib/utils/` (create if not exists)

## Special Directories

**`src/app/[locale]/`:**
- Purpose: Locale-prefixed pages
- Generated: No (Next-intl routing)
- Committed: Yes

**`src/lib/intake/`:**
- Purpose: Intake form logic
- Contains: `intake-service.ts`, `catalog.ts`, `actions.ts`, upload service

**`src/lib/documents/`:**
- Purpose: Document and vault management
- Contains: `vault-service.ts`, `template-service.ts`, `draft-service.ts`, `classification-service.ts`

**`src/components/layout/`:**
- Purpose: Layout components
- Contains: `AdminLayout.tsx`, `UserLayout.tsx`

---

*Structure analysis: 2026-06-14*
