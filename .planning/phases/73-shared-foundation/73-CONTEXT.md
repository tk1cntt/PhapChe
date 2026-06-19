# Phase 73: Shared Foundation — Implementation Context

**Phase:** 73-shared-foundation
**Date:** 2026-06-19
**Status:** Decisions locked, ready for planning

## Goal

Thiết lập shared infrastructure cho v2.2 bằng cách tạo organized seed data framework, enhanced API client với full automation error handling, centralized React Query setup với domain hooks, và reusable shared UI components để 23 screens có thể consume data từ database thay vì hardcode.

## Implementation Decisions

### 1. Seed Data Organization

**Structure:** By business layer
- `prisma/seed/foundation.ts` — Users, Orgs, Workspaces
- `prisma/seed/operations.ts` — Requests, Audit events, Vault files, Messages
- `prisma/seed/partners.ts` — Partners và partner-related data
- `prisma/seed/index.ts` — Orchestrates execution

**Execution Strategy:**
- Sequential execution với transaction rollback
- Wipe all tables trước khi insert (DELETE cascade)
- Default export pattern cho mỗi file
- Topological sort tự động dựa trên foreign key dependencies

**Data Volume:** 10 users, 3 orgs, 5 workspaces, 50 requests, 100 audit events, 20 vault files, 30 messages, 5 partners

### 2. API Client + Hooks Conventions

**Client Enhancement:** Enhance existing `src/lib/api/client.ts` (non-breaking)
- Add auto-retry 3x với exponential backoff (500ms, 1s, 2s)
- Add toast notifications (react-hot-toast, Tailwind-stylable)
- Add automatic 401 redirect to /login
- Keep existing API surface unchanged

**Hook Migration:** Refactor existing hooks (useRequests, useUsers) in place
- Migrate từ direct fetch() sang dùng ApiClient
- Hook wraps domain API modules từ `src/lib/api/index.ts`
- Non-breaking: giữ nguyên API signature, chỉ thay đổi internal implementation

**Query Key Pattern:** Array-based keys
- Format: `['entity', { filters }]` hoặc `['entity', id]`
- Examples: `['requests', { status: 'pending' }]`, `['users', '123']`

**Error Handling:** Hook throws errors, components catch and decide behavior

### 3. Shared Component Standards

**Styling:** Pure Tailwind CSS (no Ant Design dependencies)

**Components to Create:**
- **ErrorBoundary** (`src/components/shared/ui/ErrorBoundary.tsx`)
  - Catches React render errors
  - Displays fallback UI với retry button
  - Logs errors to console
  
- **LoadingSkeleton** (`src/components/shared/ui/LoadingSkeleton.tsx`)
  - Single component với variants: card, table-row, list-item, text-line
  - Shimmer animation
  
- **EmptyState** (`src/components/shared/ui/EmptyState.tsx`)
  - Icon, title, description, optional action button
  - Configurable layout

**Toast:** react-hot-toast (lightweight library, stylable với Tailwind)

**i18n Keys:** Per-component namespace
- `ErrorBoundary.title`, `ErrorBoundary.message`, `ErrorBoundary.retry`
- `LoadingSkeleton.text`
- `EmptyState.title`, `EmptyState.description`, `EmptyState.action`

### 4. Integration với Existing Code

**QueryClient Setup:** Centralized at root
- File: `src/lib/react-query.tsx`
- Wrap app trong layout.tsx
- Provide QueryClient instance cho toàn bộ app

**Hook Pattern:** Each hook wraps corresponding API module
- `useRequests` wraps `requestsApi`
- `useUsers` wraps `usersApi`
- `useWorkspaces` wraps `workspacesApi`
- Hook throws errors, components catch

**Error Strategy:** 
- Hooks throw errors (không handle internally)
- Components catch và quyết định: show toast, render error UI, hoặc retry

### 5. Auth Access Pattern

**Strategy:** Wrap next-auth `useSession()`
- `useAuth` hook wraps `useSession()` từ next-auth/react
- Return type: `{ user, isLoading, isAuthenticated }`
- Không reinvent wheel, leverage existing auth system

**Permissions:** Separate hook
- `usePermissions` hook nhận user từ useAuth
- Return permission checks dựa trên user role
- Separation of concerns: auth vs permissions

**No Session Storage:** Auth state managed by next-auth, không dùng localStorage/cookies directly

### 6. Cache Strategy Details

**staleTime (Per-entity):**
- Requests: 2 minutes (frequently changing)
- Users: 5 minutes (relatively stable)
- Audit events: 1 minute (real-time needs)
- Messages: 1 minute (chat-like behavior)
- Vault files: 5 minutes (file metadata stable)

**cacheTime:** 30 minutes (global default)

**Retry Strategy:** 3 lần exponential backoff
- Attempt 1: immediate
- Attempt 2: 1s delay
- Attempt 3: 2s delay
- Attempt 4: 4s delay

**Prefetch:** Yes, common queries
- Prefetch requests list khi user login
- Prefetch user profile data
- Giảm perceived latency ở first load

### 7. Seed Data Relationships

**Foreign Key Strategy:** Cascade delete
- Khi delete parent entity, auto delete all children
- Database-level protection, no orphaned records
- Self-documenting relationships

**Seeding Order:** Topological sort tự động
- Entities với ít foreign keys seed trước (users, orgs)
- Entities với nhiều dependencies seed sau (requests, audit events)
- Self-documenting based on schema

**Error Handling:** Full rollback (all-or-nothing)
- Nếu một entity fail, rollback toàn bộ transaction
- Không có partial data state
- User phải fix issue và re-run seed

### 8. Migration Safety

**Breaking Changes:** Không cho phép (non-breaking)
- Giữ nguyên API signatures của existing hooks
- Chỉ thay đổi internal implementation
- Existing components không cần update

**Testing Strategy:**
- Write unit tests trước khi refactor
- Ensure existing behavior preserved
- Coverage ≥90% cho refactored code

**Rollback Plan:** Git revert nếu có issues
- Atomic commits cho mỗi migration step
- Easy revert nếu production issues

**Verification:** Manual testing sau khi migrate
- Test critical user flows
- Verify data fetching still works
- Check error handling paths

## Key Files & References

**Existing Code:**
- `src/lib/api/client.ts` — API client to enhance
- `src/lib/api/index.ts` — Domain API modules (requestsApi, usersApi, etc.)
- `src/hooks/useRequests.ts` — Existing hook to refactor
- `src/hooks/useUsers.ts` — Existing hook to refactor
- `prisma/seed.ts` — Current seed entry point
- `prisma/seed-*.ts` — Scattered seed files to consolidate

**To Create:**
- `prisma/seed/foundation.ts`
- `prisma/seed/operations.ts`
- `prisma/seed/partners.ts`
- `prisma/seed/index.ts`
- `src/lib/react-query.tsx`
- `src/hooks/useAuth.ts`
- `src/hooks/usePermissions.ts`
- `src/components/shared/ui/ErrorBoundary.tsx`
- `src/components/shared/ui/LoadingSkeleton.tsx`
- `src/components/shared/ui/EmptyState.tsx`

**Documentation:**
- `docs/SPECIFICATION_INDEX.md` — Architecture standards
- `src/docs/API_STANDARDS.md` — API conventions
- `src/docs/CODE_STANDARDS.md` — Code patterns
- `src/docs/I18N_RULES.md` — i18n guidelines

## Next Steps

Phase 73 is ready for:
1. **Research Phase:** Investigate implementation patterns, best practices
2. **Plan Phase:** Create detailed implementation plan với task breakdown
3. **Execute Phase:** Implement foundation components, hooks, and seed data
4. **Verify Phase:** Test all components, ensure 90%+ coverage

## Success Criteria

- All seed data created với realistic Vietnamese data
- API client enhanced với retry, toast, 401 redirect
- QueryClient centralized tại root
- 3 shared UI components implemented (ErrorBoundary, LoadingSkeleton, EmptyState)
- Auth hooks (useAuth, usePermissions) functional
- i18n keys added cho shared components
- Existing hooks refactored to use ApiClient
- Unit tests đạt 90%+ coverage
- No breaking changes to existing code
- All components dùng Tailwind CSS (no Ant Design)
