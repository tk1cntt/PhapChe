# Technology Stack

**Analysis Date:** 2026-06-18

## Languages

**Primary:**
- TypeScript (latest) - Full-stack type safety across Next.js app
- JavaScript - Legacy files and test configurations

**Secondary:**
- SQL - Database queries via Prisma ORM

## Runtime

**Environment:**
- Node.js (latest) - Server runtime for Next.js

**Package Manager:**
- npm - Node package management
- Lockfile: `package-lock.json` (implicit)

## Frameworks

**Core:**
- Next.js (latest) - Full-stack React framework with App Router
- React (latest) - UI library

**UI Component Libraries:**
- Ant Design 6.x - Enterprise UI components
- shadcn/ui 4.x - Headless Radix-based components
- Radix UI 1.5.x - Unstyled accessible primitives
- Tailwind CSS (latest) - Utility-first CSS framework
- Lucide React - Icon library

**Internationalization:**
- next-intl 4.x - Internationalization for Next.js

**API Documentation:**
- swagger-ui-react 5.x - API documentation UI
- next-swagger-doc 0.4.x - OpenAPI spec generation

**State Management:**
- TanStack React Query 5.x - Server state management

**Authentication:**
- better-auth 1.6.x - Authentication framework
- bcryptjs 3.x - Password hashing

**Security:**
- @noble/hashes 2.x - Cryptographic hashing (SHA-256)

## Testing

**Unit Testing:**
- Vitest 4.x - Vite-native testing framework
- @testing-library/react 16.x - Component testing
- @testing-library/dom 10.x - DOM testing utilities
- jsdom - DOM environment for Node.js

**E2E Testing:**
- Playwright 1.60.x - End-to-end testing
- @playwright/test - Playwright test runner

**Test Utilities:**
- @testing-library/jest-dom 6.x - Custom Jest matchers

## Build/Dev

**Build:**
- Next.js build pipeline (esbuild, SWC)
- TypeScript compiler (tsc)

**Code Quality:**
- ESLint (latest) - Linting with Next.js config
- TypeScript - Static type checking

**Database:**
- Prisma 6.x - Next-generation ORM
- SQLite (dev) - Local development database
- PostgreSQL (prod) - Production database

**Utilities:**
- tsx 4.x - TypeScript execution for scripts
- postcss - CSS processing
- autoprefixer - Vendor prefixing

## Key Dependencies

**Critical:**
- `next` (latest) - Framework core
- `react` / `react-dom` (latest) - UI library
- `antd` 6.x - Enterprise components
- `prisma` / `@prisma/client` 6.x - Database ORM

**Infrastructure:**
- `better-auth` 1.6.x - Auth framework
- `@tanstack/react-query` 5.x - State management
- `next-intl` 4.x - i18n

## Configuration

**Environment:**
- `.env` / `.env.local` / `.env.example` - Environment variables
- Key vars: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`
- `STORAGE_DRIVER` - File storage backend (local/S3)

**Build:**
- `next.config.ts` - Next.js configuration with next-intl plugin
- `tailwind.config.ts` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration
- `vitest.config.ts` - Vitest configuration with path aliases
- `playwright.config.ts` - E2E test configuration
- `.eslintrc.js` - ESLint rules

## Platform Requirements

**Development:**
- Node.js latest
- npm or compatible package manager
- SQLite (via Prisma) for local dev

**Production:**
- Node.js runtime
- PostgreSQL database
- File storage (local filesystem or S3)

---

*Stack analysis: 2026-06-18*
