# External Integrations

**Analysis Date:** 2026-06-18

## APIs & External Services

**No external API integrations detected.**

The platform currently operates without third-party API integrations, relying on internal services for all functionality.

## Data Storage

**Primary Database:**
- SQLite (development)
- PostgreSQL (production)
  - Connection: `DATABASE_URL` env var
  - Client: Prisma ORM 6.x
  - Models: User, Workspace, LegalRequest, Document, Review, VaultFile, etc.

**File Storage:**
- Local filesystem (default, development)
  - Provider: `src/lib/storage/providers/local-storage.provider.ts`
  - Path: `STORAGE_BASE_PATH` or default uploads directory
- S3 (planned/infrastructure ready)
  - Driver: `STORAGE_DRIVER=s3` (configured but not implemented)
  - Migration command: `npm run storage:migrate`

## Authentication & Identity

**Auth Provider:**
- better-auth 1.6.x (self-hosted)
  - Prisma adapter with session management
  - Cookie-based sessions (7-day expiry)
  - Email/password authentication enabled
  - Config: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`

**Session Configuration:**
- Expires: 7 days
- Update age: 24 hours
- Storage: Prisma Session model

**User Account Types:**
- `staff` - Internal users (super_admin, coordinator, specialist, reviewer)
- `customer` - External clients

## Monitoring & Observability

**Error Tracking:**
- None detected (no Sentry, LogRocket, etc.)

**Logs:**
- Console logging via Next.js
- Audit events stored in database (`AuditEvent` model)

## CI/CD & Deployment

**Hosting:**
- Self-hosted / On-premise deployment
- No specific hosting platform detected (Vercel, AWS, etc.)

**CI Pipeline:**
- None detected (no GitHub Actions, CircleCI, etc.)

## Environment Configuration

**Required env vars:**
| Variable | Purpose | Example |
|----------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `BETTER_AUTH_SECRET` | Auth encryption key | 64-char hex string |
| `BETTER_AUTH_URL` | Auth base URL | `http://localhost:3000` |
| `STORAGE_DRIVER` | File storage backend | `local` or `s3` |
| `STORAGE_BASE_PATH` | Local storage root | `./storage` (optional) |

**Secrets location:**
- `.env` (gitignored, local secrets)
- `.env.local` (local overrides)
- `.env.example` (template, committed)

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- None detected

## Internal Service Architecture

**Service Layer:**
- `src/lib/storage/storage.service.ts` - File operations
- `src/lib/audit/audit-service.ts` - Audit logging
- `src/lib/documents/draft-service.ts` - Document management
- `src/lib/documents/vault-service.ts` - Legal vault
- `src/lib/documents/template-service.ts` - Template rendering
- `src/lib/delivery/delivery-service.ts` - Document delivery
- `src/lib/intake/upload-service.ts` - Intake file uploads

**API Client:**
- `src/lib/api/client.ts` - Central API client with typed responses
- Domain modules: requests, users, workspaces, messages, vault, settings, admin, intake, workflows, templates

---

*Integration audit: 2026-06-18*
