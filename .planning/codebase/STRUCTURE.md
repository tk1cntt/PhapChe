# Codebase Structure

**Analysis Date:** 2026-06-18

## Directory Layout

```
D:/PhapChe/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── [locale]/          # Locale-prefixed pages (vi, en, zh, ja)
│   │   │   ├── admin/         # Admin dashboard pages
│   │   │   ├── cases/         # Customer cases pages
│   │   │   ├── create/        # Create request pages
│   │   │   ├── dashboard/     # User dashboard
│   │   │   ├── messages/      # Messaging pages
│   │   │   ├── settings/      # User settings
│   │   │   ├── sign-in/       # Sign-in page
│   │   │   └── workspace/     # Workspace pages
│   │   ├── api/               # API routes
│   │   │   ├── admin/         # Admin API (partners, users, workspaces, audit)
│   │   │   ├── intake/        # Intake submission API
│   │   │   ├── messages/      # Messaging API
│   │   │   ├── partner/       # Partner API
│   │   │   ├── requests/      # Request API
│   │   │   ├── service-types/ # Service types API
│   │   │   ├── settings/      # Settings API
│   │   │   ├── swagger/        # OpenAPI docs
│   │   │   ├── vault/          # Vault file API
│   │   │   ├── workspace/      # Workspace API
│   │   │   └── workspaces/    # Workspaces API
│   │   ├── (auth)/            # Auth pages (sign-in, etc.)
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── admin/            # Admin-specific components
│   │   ├── auth/             # Auth components
│   │   ├── create-request/   # Request creation UI
│   │   ├── dashboard/         # Dashboard components
│   │   ├── layout/           # Layout components
│   │   ├── messages/         # Messaging UI
│   │   ├── my-cases/         # Customer case components
│   │   ├── partners/         # Partner components
│   │   ├── providers/        # React providers
│   │   ├── settings/         # Settings components
│   │   ├── shared/           # Shared UI components
│   │   ├── ui/               # Base UI components
│   │   ├── workspace/        # Workspace components
│   │   └── COMPONENT_REGISTRY.md
│   ├── lib/                  # Business logic
│   │   ├── admin/            # Admin operations
│   │   ├── api/              # API client utilities
│   │   ├── audit/            # Audit logging
│   │   ├── config/           # Configuration
│   │   ├── constants/        # App constants
│   │   ├── delivery/         # Document delivery
│   │   ├── documents/        # Document/vault management
│   │   ├── hooks/            # Custom React hooks
│   │   ├── i18n/             # Internationalization
│   │   ├── intake/           # Intake processing
│   │   ├── middleware/       # Middleware utilities
│   │   ├── navigation/       # Navigation helpers
│   │   ├── ops/              # Operations utilities
│   │   ├── repositories/     # Data access
│   │   ├── reviews/          # Quality review
│   │   ├── routing/          # Assignment routing
│   │   ├── rules/            # ESLint rules
│   │   ├── security/         # Auth & RBAC
│   │   ├── services/         # Service layer
│   │   ├── storage/          # File storage
│   │   ├── types/            # TypeScript types
│   │   ├── workflow/         # Workflow state machine
│   │   ├── prisma.ts         # Prisma client singleton
│   │   ├── types.ts          # Shared type constants
│   │   └── utils.ts          # Utilities
│   ├── hooks/                # Client hooks
│   │   ├── useAuditEvents.ts
│   │   ├── useRequests.ts
│   │   └── useUsers.ts
│   ├── stories/              # Storybook stories
│   ├── auth.ts               # Better Auth configuration
│   ├── i18n.ts               # i18n configuration
│   ├── middleware.ts         # Next.js middleware
│   ├── routing.ts            # Locale routing config
│   └── constants/            # App constants
├── prisma/
│   └── schema.prisma         # Database schema
├── .claude/                  # Agent configuration
├── .storybook/               # Storybook config
└── package.json
```

## Directory Purposes

**`src/app/`:**
- Purpose: Next.js App Router pages and layouts
- Contains: Page components, route handlers, layouts
- Key files: `layout.tsx`, `globals.css`

**`src/app/[locale]/`:**
- Purpose: Locale-prefixed page routes
- Contains: Dashboard, admin, cases, settings, messages, create pages
- Key files: `layout.tsx` (locale-aware layout)

**`src/app/api/`:**
- Purpose: API route handlers (HTTP endpoints)
- Contains: REST API routes organized by domain
- Key files: `route.ts` files in each domain folder

**`src/components/`:**
- Purpose: React UI components
- Contains: Shared components, domain-specific components
- Key files: `COMPONENT_REGISTRY.md`

**`src/lib/`:**
- Purpose: Business logic, services, utilities
- Contains: Core application logic
- Key files: `prisma.ts`, `types.ts`, `audit/`, `workflow/`, `security/`

**`src/lib/types/`:**
- Purpose: TypeScript type definitions
- Contains: Domain types (user, request, workspace, audit, vault, review, workflow)
- Key files: `index.ts` (barrel export)

**`prisma/`:**
- Purpose: Database schema and migrations
- Contains: `schema.prisma`, migrations folder
- Key files: `schema.prisma`

## Key File Locations

**Entry Points:**
- `src/auth.ts`: Better Auth configuration
- `src/middleware.ts`: Request middleware (i18n, auth)
- `src/routing.ts`: Locale routing configuration
- `src/app/[locale]/layout.tsx`: Locale layout wrapper

**Configuration:**
- `src/i18n.ts`: i18n configuration
- `prisma/schema.prisma`: Database schema
- `.storybook/main.ts`: Storybook configuration

**Core Logic:**
- `src/lib/workflow/request-workflow.ts`: Request state machine
- `src/lib/routing/routing-service.ts`: Assignment logic
- `src/lib/security/rbac.ts`: Authorization checks
- `src/lib/security/session.ts`: Session management
- `src/lib/audit/audit.ts`: Audit event recording

**API Routes:**
- `src/app/api/requests/route.ts`: Request CRUD
- `src/app/api/intake/submit/route.ts`: Intake submission
- `src/app/api/vault/route.ts`: Vault file operations
- `src/app/api/admin/requests/[id]/assign/route.ts`: Request assignment

**Testing:**
- `src/lib/foundation.e2e.test.ts`: E2E tests
- `src/lib/*/*.test.ts`: Unit tests co-located with source

## Naming Conventions

**Files:**
- PascalCase for components: `StatCard.tsx`, `ReviewService.ts`
- kebab-case for routes: `route.ts`, `use-requests.ts`
- camelCase for utilities: `audit.ts`, `rbac.ts`

**Directories:**
- kebab-case: `create-request/`, `my-cases/`, `vault-service.ts`

**Types/Constants:**
- SCREAMING_SNAKE_CASE for constants: `REQUEST_STATUS`, `ROLE`
- PascalCase for types: `AppSession`, `RequestStatus`

## Where to Add New Code

**New API Endpoint:**
1. Create route file: `src/app/api/{domain}/{action}/route.ts`
2. Import services from `src/lib/{domain}/`
3. Return NextResponse with proper status codes

**New Service:**
1. Create service file: `src/lib/{domain}/{service-name}-service.ts`
2. Export functions for business logic
3. Import types from `src/lib/types/`
4. Use Prisma via `import { prisma } from '@/lib/prisma'`

**New Component:**
1. Create component file: `src/components/{domain}/{ComponentName}.tsx`
2. Follow component naming in `src/components/COMPONENT_REGISTRY.md`
3. Export from barrel file if applicable

**New Type:**
1. Add to existing file in `src/lib/types/` or create new domain file
2. Export via `src/lib/types/index.ts` barrel

**New Database Model:**
1. Add model to `prisma/schema.prisma`
2. Run `prisma generate` to regenerate types
3. Add type exports if needed

## Special Directories

**`.claude/`:**
- Purpose: Claude agent configuration, skills, workflows
- Generated: Yes (by GSD framework)
- Committed: Yes (version controlled)

**`.storybook/`:**
- Purpose: Storybook configuration and stories
- Generated: Partially
- Committed: Yes

**`src/stories/`:**
- Purpose: Component documentation via Storybook
- Generated: Yes (manual stories)
- Committed: Yes

**`prisma/`:**
- Purpose: Database schema
- Generated: Migrations created by Prisma
- Committed: Schema yes, migrations optional

---

*Structure analysis: 2026-06-18*
