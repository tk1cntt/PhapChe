# External Integrations

**Analysis Date:** 2026-06-14

## APIs & External Services

**Email:**
- Stub email provider (development) - `src/lib/delivery/notification-service.ts`
  - Currently returns stub responses
  - Ready for integration with SendGrid, Resend, or similar
  - No production email service configured

**AI/Claude (Development Setup):**
- Anthropic Claude API - `D:\PhapChe\.env.local`
  - Base URL: `http://172.21.80.1:20128/v1` (internal development proxy)
  - API Key configured for development
  - Used by Claude Code Telegram Bot (separate service)

## Data Storage

**Databases:**
- SQLite (development) - `file:./prisma/data/legal_service_dev.db`
  - Prisma Client ORM
  - Connection via `DATABASE_URL` environment variable
- PostgreSQL (production) - Connection string format: `postgresql://user:password@host:5432/dbname`
  - Same Prisma Client ORM
  - Schema defined in `prisma/schema.prisma`

**File Storage:**
- Local filesystem - No external cloud storage service detected
  - Vault files stored with `storageKey` reference
  - File uploads handled locally

**Caching:**
- None - No Redis or in-memory cache service detected

## Authentication & Identity

**Auth Provider:**
- better-auth v1.6.14 - `src/auth.ts`, `src/lib/auth-client.ts`
  - Email/password authentication enabled
  - Session-based with 7-day expiry
  - Session refresh every 24 hours
  - Prisma adapter with multi-database support (SQLite/PostgreSQL)

**Client Auth:**
- `createAuthClient` from `better-auth/react` - `src/lib/auth-client.ts`
- `signIn`, `signUp`, `signOut`, `useSession` hooks exposed
- Session management via server-side `requireAppSession()` - `src/lib/security/session.ts`

**Role-based Access:**
- Workspace-scoped roles: `customer`, `specialist`, `reviewer`, `coordinator_admin`, `super_admin`
- RBAC implementation in `src/lib/security/rbac.ts`

## Monitoring & Observability

**Error Tracking:**
- None - No Sentry, LogRocket, or similar services configured

**Logs:**
- Console-based logging via `console.log/error`
- Audit events stored in database (`AuditEvent` model)

**Development Debug:**
- `/api/debug-session` route for debugging authentication - `src/app/api/debug-session/route.ts`

## CI/CD & Deployment

**Hosting:**
- Self-hosted / custom deployment
- Next.js standard deployment targets (Vercel, Node.js server, Docker)

**CI Pipeline:**
- None detected - No GitHub Actions, CircleCI, or similar configured

## Environment Configuration

**Required env vars:**
- `DATABASE_URL` - Database connection string (SQLite file path or PostgreSQL)
- `BETTER_AUTH_SECRET` - 64-character hex string for authentication signing
- `BETTER_AUTH_URL` - Base URL for authentication (default: `http://localhost:3000`)

**Secrets location:**
- `.env.local` - Local development secrets (NOT committed)
- `.env.example` - Template with placeholder values
- `.env.test` - Test environment configuration

## Webhooks & Callbacks

**Incoming:**
- None - No webhook endpoints detected

**Outgoing:**
- Email notifications (stubbed, ready for provider integration)
- Delivery ready notifications via email stub

## Project Structure

**Database Schema (`prisma/schema.prisma`):**
- User & Authentication: `User`, `Account`, `Session`, `Verification`, `UserPreferences`
- Workspace & Multi-tenancy: `Workspace`, `WorkspaceMembership`
- Legal Requests: `LegalRequest`, `IntakeSubmission`, `RequestAssignment`, `MatterType`
- Documents: `Document`, `DocumentVersion`, `DocumentTemplate`, `Review`, `ReviewChecklistAnswer`
- Vault & Storage: `VaultFile`, `Folder`, `Tag`, `VaultFileFolder`, `VaultFileTag`
- Workflow: `WorkflowTransition`, `RoutingCapability`
- Messaging: `Message`
- Audit: `AuditEvent`

---

*Integration audit: 2026-06-14*
