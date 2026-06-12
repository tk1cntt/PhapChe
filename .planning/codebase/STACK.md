# Technology Stack

**Analysis Date:** 2026-06-12

## Languages

**Primary:**
- TypeScript latest - Core application development
- JSON - Configuration and message files

**Secondary:**
- CSS - Styling with Tailwind CSS and CSS modules

## Runtime

**Environment:**
- Node.js (via Next.js)

**Package Manager:**
- npm (implied by package.json)
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Next.js (latest) - Full-stack React framework with App Router
- React (latest) - UI library
- React DOM (latest) - DOM rendering

**UI Components:**
- Ant Design v6.4.3 - Component library (`antd`)
- @ant-design/cssinjs v2.1.2 - CSS-in-JS engine for Ant Design
- @ant-design/icons v6.2.5 - Icon library
- @ant-design/nextjs-registry v1.3.0 - Ant Design SSR support
- Lucide React (latest) - Additional icon library

**Internationalization:**
- next-intl v4.13.0 - i18n routing and translations
- Supported locales: vi, en, zh, ja

**State Management:**
- @tanstack/react-query v5.101.0 - Server state management
- @tanstack/react-query-devtools v5.101.0 - Query debugging

## Database

**ORM:**
- Prisma v6.19.0 - Database ORM
- @prisma/client v6.19.0 - Prisma client runtime

**Database:**
- SQLite (development) - Default development database
- PostgreSQL (production) - Production database via DATABASE_URL

## Authentication

**Framework:**
- better-auth v1.6.14 - Authentication framework
- better-auth/adapters/prisma - Prisma adapter for better-auth
- better-auth/next-js - Next.js integration

**Session:**
- Cookie-based sessions via nextCookies() plugin
- Session expires in 7 days (60 * 60 * 24 * 7 seconds)
- Session refresh every 24 hours

## Testing

**Unit Testing:**
- Vitest v4.1.8 - Unit test runner
- @testing-library/react v16.3.2 - React testing utilities
- @testing-library/dom v10.4.1 - DOM testing utilities
- @testing-library/jest-dom v6.9.1 - Jest DOM matchers
- jsdom v29.1.1 - DOM simulation for Node.js

**E2E Testing:**
- Playwright v1.60.0 - End-to-end testing
- playwright.config.ts - Playwright configuration

**Test Setup:**
- tests/setup.ts - Global test setup file

## Build & Development

**Build:**
- TypeScript (tsc) - Type checking
- Next.js build system - Production builds

**Linting:**
- ESLint (latest) - Code linting
- eslint-config-next (latest) - Next.js ESLint config

**CSS:**
- Tailwind CSS (latest) - Utility-first CSS framework
- @tailwindcss/postcss v4.3.0 - Tailwind PostCSS integration
- PostCSS (latest) - CSS transformation
- Autoprefixer (latest) - Vendor prefix automation

**Development:**
- @vitejs/plugin-react v6.0.2 - Vite React plugin
- tsx v4.22.3 - TypeScript execution for scripts
- @types/node, @types/react, @types/react-dom - Type definitions

## Configuration

**Environment:**
- .env - Environment variables (local overrides)
- .env.example - Template for required env vars
- .env.local - Local overrides (gitignored)
- .env.test - Test environment variables

**Key env vars:**
- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Authentication secret (64-char hex)
- `BETTER_AUTH_URL` - Auth base URL (default: http://localhost:3000)

**Build Config:**
- `next.config.ts` - Next.js configuration with next-intl plugin
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `vitest.config.ts` - Vitest configuration
- `playwright.config.ts` - Playwright configuration
- `postcss.config.mjs` - PostCSS configuration

## Path Aliases

**Configured in tsconfig.json and vitest.config.ts:**
- `@/*` maps to `./src/*`

---

*Stack analysis: 2026-06-12*
