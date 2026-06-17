# Codebase Structure

**Analysis Date:** 2026-06-17

## Directory Layout

```
D:\PhapChe\
├── src/
│   ├── app/               # Next.js App Router pages and API routes
│   ├── components/        # React components (shared and domain-specific)
│   ├── lib/               # Service layer, utilities, types
│   ├── hooks/             # Custom React hooks
│   ├── auth.ts            # Better-auth configuration
│   ├── middleware.ts      # Next.js middleware
│   ├── i18n.ts            # Internationalization config
│   └── routing.ts         # Locale routing config
├── prisma/
│   └── schema.prisma      # Database schema
├── tests/                 # Vitest unit tests
│   ├── setup.ts           # Test setup
│   ├── dashboard/         # Dashboard tests
│   └── api/               # API route tests
├── e2e/                   # Playwright E2E tests
├── .planning/codebase/    # This directory - codebase mapping
├── .storybook/            # Storybook configuration
├── docs/                  # Architecture documentation
├── scripts/               # Utility scripts
└── [config files]        # package.json, tsconfig.json, etc.
```

## Directory Purposes

**src/app/:**
- Purpose: Next.js App Router structure
- Contains: `[locale]/` pages, `api/` routes, layouts
- Key files: `src/app/layout.tsx`, `src/app/middleware.ts`

**src/components/:**
- Purpose: React UI components
- Contains: `shared/` (reusable), domain-specific folders
- Key files: `StatCard.tsx`, `DataTable.tsx`, domain components

**src/lib/:**
- Purpose: Business logic and services
- Contains: `api/` (client), `workflow/` (state machines), domain services
- Key files: `prisma.ts`, `types/`, service modules

**prisma/:**
- Purpose: Database schema and migrations
- Contains: `schema.prisma`, seed files
- Key files: `seed.ts`, `seed-unified.ts`

**tests/:**
- Purpose: Unit and integration tests
- Contains: Vitest setup and test files
- Key files: `setup.ts`, `*.test.ts` files

**e2e/:**
- Purpose: End-to-end browser tests
- Contains: Playwright test files
- Key files: `*.spec.ts`, `helpers/` directory

## Key File Locations

**Entry Points:**
- `src/app/[locale]/layout.tsx`: Root locale layout with providers
- `src/app/[locale]/page.tsx`: Landing page (if exists)
- `src/middleware.ts`: Request middleware

**Configuration:**
- `package.json`: Dependencies and scripts
- `tsconfig.json`: TypeScript configuration
- `vitest.config.ts`: Unit test configuration
- `playwright.config.ts`: E2E test configuration
- `prisma/schema.prisma`: Database schema

**Core Logic:**
- `src/lib/api/client.ts`: Central API client
- `src/lib/workflow/request-workflow.ts`: Request state machine
- `src/lib/security/rbac.ts`: Role-based access control
- `src/lib/audit/audit.ts`: Audit logging

**Authentication:**
- `src/auth.ts`: Better-auth configuration
- `src/lib/security/session.ts`: Session management

**Testing:**
- `tests/setup.ts`: Test environment setup
- `tests/dashboard/Dashboard.test.ts`: Example test suite

## Naming Conventions

**Files:**
- React components: PascalCase.tsx (e.g., `StatCard.tsx`)
- Services/Utilities: kebab-case.ts (e.g., `audit-service.ts`)
- Types: PascalCase.ts (e.g., `types/user.ts`)
- Tests: *.test.ts or *.spec.ts

**Directories:**
- General: kebab-case (e.g., `my-cases/`)
- Domain modules: kebab-case (e.g., `audit/`)
- Component folders: kebab-case matching component name

**Functions & Variables:**
- camelCase: `getUserById`, `isActive`
- PascalCase: React components, TypeScript types
- UPPER_SNAKE_CASE: Constants (e.g., `REQUEST_STATUS`)

## Where to Add New Code

**New Feature (Full Stack):**
1. Database model: `prisma/schema.prisma`
2. Service layer: `src/lib/[domain]/[service].ts`
3. API routes: `src/app/api/[domain]/route.ts`
4. Page component: `src/app/[locale]/[feature]/page.tsx`
5. Components: `src/components/[domain]/`
6. Tests: `tests/[domain]/[feature].test.ts`

**New Component:**
1. Shared component: `src/components/shared/ui/`
2. Domain component: `src/components/[domain]/`
3. Export from barrel: `src/components/[domain]/index.ts`
4. Test: `src/components/[domain]/[Component].test.tsx`

**New API Endpoint:**
1. Route handler: `src/app/api/[domain]/[action]/route.ts`
2. Service delegation: `src/lib/[domain]/[service].ts`
3. Types: `src/lib/types/[domain].ts`
4. Test: `tests/api/[domain]/[action].test.ts`

**Utilities:**
- Shared utilities: `src/lib/utils/`
- Domain utilities: `src/lib/[domain]/utils/`

## Special Directories

**.storybook/:**
- Purpose: Storybook visual documentation
- Generated: No
- Committed: Yes

**.planning/codebase/:**
- Purpose: GSD codebase mapping documents
- Generated: Yes (by this process)
- Committed: Yes

**docs/:**
- Purpose: Architecture documentation
- Contains: `DOMAIN_STRUCTURE.md`, `API_STANDARDS.md`, etc.
- Generated: No
- Committed: Yes

---

*Structure analysis: 2026-06-17*
