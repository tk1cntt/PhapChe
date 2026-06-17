# External Integrations

**Analysis Date:** 2026-06-17

## Database

**SQLite (Development):**
- Provider: SQLite via Prisma
- Connection: `DATABASE_URL` in `.env`
- ORM: Prisma Client

**PostgreSQL (Production):**
- Provider: PostgreSQL via Prisma
- Connection: `DATABASE_URL` in `.env`
- ORM: Prisma Client

## Authentication

**Auth Provider:**
- Self-hosted using better-auth
- Database adapter: Prisma adapter
- Session management: Cookie-based with nextCookies plugin
- Supported providers: Email/Password

**Configuration:**
- `BETTER_AUTH_URL` - Base URL for auth endpoints
- `NODE_ENV` - Switches between SQLite (dev) and PostgreSQL (prod)

## Storage

**Local Storage (Current):**
- Provider: Local filesystem
- Service: `LocalStorageProvider` in `src/lib/storage/providers/`
- Location: Configured via `STORAGE_DRIVER=local`

**S3 Storage (Planned):**
- Provider: S3-compatible storage
- Status: Migration command exists but S3 provider not implemented
- See: `src/lib/storage/commands/migrate.ts`

## API Integrations

**Swagger/OpenAPI:**
- Endpoint: `/api/swagger`
- Auto-generated documentation
- Package: `next-swagger-doc`

**External API Clients:**
- Central API Client: `src/lib/api/client.ts`
- Domain-specific API modules: `src/lib/api/index.ts`

## Email & Notifications

**Email:**
- Status: Not fully configured
- Notification service: `src/lib/delivery/notification-service.ts`

## Environment Configuration

**Required Environment Variables:**
- `DATABASE_URL` - Database connection string
- `BETTER_AUTH_URL` - Authentication base URL
- `NODE_ENV` - Development/Production mode

**Optional Variables:**
- `STORAGE_DRIVER` - local or s3
- `S3_*` - S3 configuration (when applicable)

**Secrets Location:**
- `.env` file (git-ignored)
- `.env.example` (template, committed)
- `.env.local` (local overrides)
- `.env.test` (test environment)

## Monitoring & Observability

**Error Tracking:**
- Not configured - Console logging via `console.error/warn`
- Error boundary: `src/components/ui/ErrorFallback.tsx`

**Logging:**
- Console-based logging
- Audit events recorded in database via `AuditEvent` model

## CI/CD & Deployment

**Testing Pipeline:**
- Playwright E2E tests: `npm run test:e2e`
- Vitest unit tests: Via vitest
- Type checking: `npm run typecheck`

**Deployment:**
- Platform: Next.js (can deploy to Vercel, AWS, etc.)
- Database migrations: `prisma migrate`
- Seed data: `npm run seed`

---

*Integration audit: 2026-06-17*
