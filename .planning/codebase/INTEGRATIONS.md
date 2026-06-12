# External Integrations

**Analysis Date:** 2026-06-12

## APIs & External Services

**Not detected** - No external API integrations (e.g., Stripe, OpenAI) found in codebase.

## Data Storage

**Primary Database:**
- PostgreSQL (production)
  - Connection: `DATABASE_URL` environment variable
  - ORM: Prisma v6.19.0
  - Schema location: `prisma/schema.prisma`

**Development Database:**
- SQLite
  - Same Prisma ORM with sqlite provider
  - Auto-detected via NODE_ENV

**ORM Client:**
- `src/lib/prisma.ts` - Singleton Prisma client instance

## Authentication & Identity

**Auth Provider:**
- better-auth v1.6.14
- Prisma adapter for database storage
- Supports email/password authentication

**Session Management:**
- Cookie-based sessions via nextCookies() plugin
- Session token stored in `better-auth.session_token` cookie

**Auth Configuration:**
- `src/auth.ts` - Main auth configuration
- `src/app/api/auth/[...all]/route.ts` - Auth API routes
- `src/middleware.ts` - Session validation middleware

**Supported Auth Flows:**
- Email/password sign-in
- Session cookie validation
- Multi-origin trusted origins (localhost:3000-3005)

## Internationalization

**Supported Locales:**
- Vietnamese (vi) - default
- English (en)
- Chinese (zh)
- Japanese (ja)

**i18n Provider:**
- next-intl v4.13.0
- Message files: `src/messages/{locale}.json`
- Routing: `src/routing.ts`

## File Storage

**Not detected** - No external file storage (S3, Cloudflare R2, etc.) integrated.

**Local file handling:**
- Vault files stored with `storageKey` references in `VaultFile` model
- File metadata tracked in database

## Caching

**Not detected** - No Redis or in-memory caching layer.

**Server State:**
- @tanstack/react-query for client-side data caching

## Monitoring & Observability

**Not detected** - No external monitoring services integrated.

**Local Development:**
- React Query DevTools available in development
- Console logging for debugging

## CI/CD & Deployment

**Hosting:**
- Next.js application (likely Vercel, self-hosted, or similar)

**CI Pipeline:**
- Playwright for E2E tests in CI (retries: 2, workers: 1)

**Test Commands:**
```bash
npm run dev              # Development server
npm run build            # Production build
npm run lint             # ESLint check
npm run typecheck        # TypeScript check
npm run test:e2e         # Playwright E2E tests
npm run test:e2e:ui      # Playwright UI mode
```

**Database Commands:**
```bash
npm run prisma:generate   # Generate Prisma client
npm run db:push          # Push schema to database
npm run seed             # Run database seed
```

## Environment Configuration

**Required env vars:**
- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Random 64-char hex string
- `BETTER_AUTH_URL` - Application base URL

**Secrets location:**
- `.env` - Local development (gitignored)
- `.env.example` - Template with placeholders
- `.env.local` - Local overrides
- `.env.test` - Test environment

## Webhooks & Callbacks

**Incoming:**
- Not detected

**Outgoing:**
- Not detected

## Key Integration Files

| File | Purpose |
|------|---------|
| `src/auth.ts` | better-auth configuration |
| `src/lib/prisma.ts` | Prisma client singleton |
| `src/middleware.ts` | Auth session validation |
| `src/routing.ts` | Locale routing configuration |
| `src/i18n.ts` | Internationalization config |
| `prisma/schema.prisma` | Database schema |

## Planned/Optional Integrations

Based on CLAUDE.md constraints, these may be added later:
- **OCR** - Document processing (MVP scope excluded)
- **E-sign** - Digital signatures (MVP scope excluded)
- **AI** - Advanced AI features (MVP scope excluded)

---

*Integration audit: 2026-06-12*
