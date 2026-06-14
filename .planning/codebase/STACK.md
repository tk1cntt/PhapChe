# Technology Stack

**Analysis Date:** 2026-06-14

## Languages

**Primary:**
- TypeScript (latest) - Full-stack type safety
- TSX/JSX - React components

**Secondary:**
- CSS/Tailwind CSS (latest) - Styling

## Runtime

**Environment:**
- Node.js (latest) - Server-side rendering and API routes
- Next.js (latest) - React framework with App Router

**Package Manager:**
- npm (bundled with Node.js)
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Next.js (latest) - Full-stack React framework with App Router and API routes
- React (latest) - UI library
- TanStack Query v5 (5.101.0) - Server state management and data fetching

**UI:**
- Ant Design v6 (6.4.3) - Component library
- Tailwind CSS v4 (latest) - Utility-first CSS with PostCSS plugin
- Lucide React (latest) - Icon library

**Internationalization:**
- next-intl v4 (4.13.0) - Internationalization with locale routing

**Testing:**
- Vitest v4 (4.1.8) - Unit testing with jsdom environment
- Playwright v1.60 (1.60.0) - End-to-end testing
- Testing Library v16 (16.3.2) - React component testing

**Build/Dev:**
- TypeScript (latest) - Type checking
- ESLint (latest) - Linting
- PostCSS (latest) - CSS processing
- Autoprefixer (latest) - CSS vendor prefixes

## Key Dependencies

**Database:**
- Prisma v6 (6.19.0) - Type-safe database ORM
- Prisma Client - Database adapter

**Authentication:**
- better-auth v1.6.14 - Authentication framework
- @noble/hashes v2.2.0 - Cryptographic hashing
- bcryptjs v3.0.3 - Password hashing

**Validation/Utilities:**
- (Implicit via Prisma/better-auth)

## Configuration

**Environment:**
- SQLite (development) - Database via Prisma with file-based storage
- PostgreSQL (production) - Database via Prisma with connection string
- Environment files: `.env`, `.env.example`, `.env.local`, `.env.test`

**Key environment variables:**
- `DATABASE_URL` - SQLite: `file:./prisma/data/legal_service_dev.db` or PostgreSQL connection string
- `BETTER_AUTH_SECRET` - 64-character hex secret for authentication
- `BETTER_AUTH_URL` - Base URL for auth endpoints (default: `http://localhost:3000`)

**Build:**
- `next.config.ts` - Next.js configuration with next-intl plugin
- `tsconfig.json` - TypeScript with path aliases (`@/*` → `./src/*`)
- `tailwind.config.ts` - Tailwind CSS with CSS variable theming
- `vitest.config.ts` - Vitest with jsdom environment and path aliases
- `playwright.config.ts` - Playwright with Chromium, custom port 3000

## Platform Requirements

**Development:**
- Node.js (latest)
- npm for package management
- SQLite3 or PostgreSQL depending on setup

**Production:**
- Node.js runtime
- PostgreSQL database (SQLite not recommended)
- Environment variables configured

---

*Stack analysis: 2026-06-14*
