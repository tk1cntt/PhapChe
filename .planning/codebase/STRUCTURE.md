<!-- refreshed: 2026-06-12 -->
# Codebase Structure

**Analysis Date:** 2026-06-12

## Directory Layout

```
D:\PhapChe/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── [locale]/           # i18n routing segment
│   │   │   ├── admin/          # Admin portal pages
│   │   │   ├── customer/       # Customer portal pages
│   │   │   ├── specialist/     # Specialist portal pages
│   │   │   ├── reviewer/       # Reviewer portal pages
│   │   │   └── intake/         # Public intake form
│   │   ├── api/                # API routes (legacy)
│   │   ├── intake/             # Intake Server Actions
│   │   └── page.tsx            # Root page
│   ├── lib/                    # Service layer
│   │   ├── audit/              # Audit logging
│   │   ├── delivery/           # Notifications
│   │   ├── documents/          # Document & vault services
│   │   ├── intake/             # Intake processing
│   │   ├── reviews/            # Review service
│   │   ├── routing/            # Routing service
│   │   ├── security/           # RBAC & session
│   │   ├── workflow/           # State machine
│   │   ├── prisma.ts           # Prisma singleton
│   │   └── types.ts            # Type constants
│   ├── components/             # Shared React components
│   ├── constants/              # App constants
│   ├── messages/               # i18n translation files
│   ├── auth.ts                 # Better Auth configuration
│   ├── routing.ts              # Next-intl routing config
│   └── i18n.ts                 # i18n configuration
├── prisma/
│   ├── schema.prisma            # Database schema
│   ├── seed.ts                  # Database seed
│   └── seed-unified.ts          # Unified seed
├── public/                     # Static assets
└── .claude/                    # GSD framework
```

## Directory Purposes

**src/app/[locale]/:**
- Purpose: Locale-specific pages with i18n support
- Contains: `admin/`, `customer/`, `specialist/`, `reviewer/` subdirectories
- Key files: `layout.tsx` - locale layout with NextIntlProvider

**src/app/[locale]/admin/:**
- Purpose: Admin portal pages
- Contains: Users, templates, routing, vault, ops pages
- Key files: `users/page.tsx`, `templates/page.tsx`, `routing/page.tsx`, `vault/page.tsx`, `ops/page.tsx`

**src/app/[locale]/customer/:**
- Purpose: Customer-facing pages
- Contains: Request list, request detail, create request
- Key files: `requests/page.tsx`, `requests/[requestId]/page.tsx`

**src/app/[locale]/specialist/:**
- Purpose: Specialist work portal
- Contains: Request list, request detail with document management
- Key files: `requests/page.tsx`, `requests/[requestId]/page.tsx`

**src/app/[locale]/reviewer/:**
- Purpose: Reviewer quality control portal
- Contains: Request list, review page with checklist
- Key files: `requests/page.tsx`, `requests/[requestId]/review/[documentVersionId]/page.tsx`

**src/lib/:**
- Purpose: Service layer with business logic
- Contains: Service modules, Prisma client, type constants
- Key files: `prisma.ts`, `types.ts`, `auth-client.ts`

**src/lib/routing/:**
- Purpose: Assignment and routing logic
- Contains: `routing-service.ts`, `routing-service.test.ts`
- Key functions: `assignRequest`, `getRoutingSuggestions`, `upsertRoutingCapability`

**src/lib/intake/:**
- Purpose: Intake form processing
- Contains: `intake-service.ts`, `upload-service.ts`, `catalog.ts`
- Key functions: `createIntakeDraft`, `saveIntakeAnswers`, `submitIntake`

**src/lib/documents/:**
- Purpose: Document generation, templates, vault storage
- Contains: `vault-service.ts`, `draft-service.ts`, `template-service.ts`, `classification-service.ts`
- Key functions: `listVaultFiles`, `storeVaultFile`, `generateDraft`, `submitForReview`

**src/lib/reviews/:**
- Purpose: Quality control reviews
- Contains: `review-service.ts`, `review-service.test.ts`, `checklist.ts`
- Key functions: `startReview`, `answerChecklistItem`, `approveReview`, `rejectReview`

**src/lib/security/:**
- Purpose: Authentication session and RBAC
- Contains: `rbac.ts`, `session.ts`
- Key functions: `canAccessRequest`, `canAccessWorkspace`, `canAccessDocument`

**src/lib/audit/:**
- Purpose: Immutable audit event logging
- Contains: `audit.ts`, `audit.test.ts`
- Key functions: `recordAuditEvent`

**src/lib/workflow/:**
- Purpose: Request state machine
- Contains: `request-workflow.ts`, `request-workflow.test.ts`
- Key functions: `transitionRequestStatus`, `canTransitionRequestStatus`, `getAllowedTransitions`

**src/components/:**
- Purpose: Shared React components
- Contains: `LanguageSwitcher.tsx`, `CreateRequestForm.tsx`
- Pattern: No barrel export file detected

**src/constants/:**
- Purpose: Hardcoded constants
- Contains: `checklist-items.ts` - QC checklist definitions
- Pattern: Plain JS objects exported as constants

**src/messages/:**
- Purpose: i18n translation files
- Contains: `en.json`, `vi.json`, `zh.json`, `ja.json`
- Pattern: Key-value translation objects

## Key File Locations

**Entry Points:**
- `src/app/[locale]/page.tsx`: Root locale page
- `src/app/[locale]/intake/page.tsx`: Customer intake form
- `src/app/[locale]/admin/routing/page.tsx`: Admin routing dashboard

**Configuration:**
- `src/auth.ts`: Better Auth configuration
- `src/routing.ts`: Next-intl routing configuration
- `prisma/schema.prisma`: Database schema

**Core Logic:**
- `src/lib/workflow/request-workflow.ts`: Status state machine
- `src/lib/routing/routing-service.ts`: Assignment logic
- `src/lib/reviews/review-service.ts`: QC checklist flow
- `src/lib/documents/vault-service.ts`: File storage abstraction

**Testing:**
- `src/**/*.test.ts`: Unit tests (Vitest)
- `tests/e2e/*.test.ts`: E2E tests (Playwright)

## Naming Conventions

**Files:**
- PascalCase for React components: `CustomerRequestsTable.tsx`
- kebab-case for pages/directories: `create-request/page.tsx`
- camelCase for service modules: `routing-service.ts`
- kebab-case for CSS files: `audit.css`, `vault.css`

**Functions:**
- camelCase: `assignRequest`, `canAccessRequest`
- PascalCase for React components only

**Variables:**
- camelCase: `workspaceId`, `requestId`
- UPPER_SNAKE_CASE for constants: `REQUEST_STATUS`, `ROLE`

**Types:**
- PascalCase: `RequestStatus`, `Role`, `AppSession`
- Type constants in `types.ts` use UPPER_SNAKE_CASE

## Where to Add New Code

**New Service Module:**
- Primary code: `src/lib/{feature}/`
- Example: `src/lib/notifications/notification-service.ts`

**New Page:**
- Pages: `src/app/[locale]/{role}/{page}/page.tsx`
- Example: `src/app/[locale]/admin/settings/page.tsx`
- Server Actions: `src/app/[locale]/admin/settings/actions.ts`

**New API Route:**
- Location: `src/app/api/{resource}/route.ts`
- Example: `src/app/api/notifications/route.ts`

**New Database Model:**
- Location: `prisma/schema.prisma`
- Follow existing model patterns with `@id`, `@default`, `@@index`

**New Shared Component:**
- Location: `src/components/`
- Name: `PascalCase.tsx`

**New Test:**
- Unit: Co-located `*.test.ts` next to source file
- E2E: `tests/e2e/*.test.ts`

## Special Directories

**.claude/:**
- Purpose: GSD framework configuration and commands
- Generated: Partially
- Committed: Yes

**prisma/:**
- Purpose: Database schema and seeds
- Generated: `node_modules/.prisma` (not committed)
- Committed: `schema.prisma`, seed files

**src/messages/:**
- Purpose: Translation files
- Generated: No
- Committed: Yes (JSON files)

---

*Structure analysis: 2026-06-12*
