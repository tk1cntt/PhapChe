# Technology Stack

**Analysis Date:** 2026-06-17

## Languages

**Primary:**
- TypeScript 5.x - Full-stack type safety across Next.js app

**Secondary:**
- JavaScript (ESNext) - Configuration files and scripts

## Runtime

**Environment:**
- Node.js (latest) - Server-side execution
- React (latest) - UI framework
- Next.js (latest) - Full-stack framework with App Router

**Package Manager:**
- npm (Node Package Manager)
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Next.js - App Router, Server Components, API Routes
- React 19 - UI library with Server Components
- Ant Design 6.x - Enterprise UI component library
- Tailwind CSS 4.x - Utility-first CSS

**State Management:**
- TanStack Query (React Query) 5.x - Server state management
- React Context - Client-side state

**Authentication:**
- better-auth 1.6.x - Authentication with Prisma adapter
- Session-based auth with cookie handling

**Internationalization:**
- next-intl 4.x - i18n routing and translations

**API Documentation:**
- swagger-ui-react - OpenAPI documentation
- next-swagger-doc - Auto-generated API docs

## Database

**ORM:**
- Prisma 6.x - Type-safe database access
- Database: SQLite (development), PostgreSQL (production)

## Testing

**Unit Testing:**
- Vitest 4.x - Vite-native test runner
- @testing-library/react 16.x - React component testing
- @testing-library/dom 10.x - DOM testing utilities
- jsdom 29.x - DOM environment for Node.js

**E2E Testing:**
- Playwright 1.60.x - End-to-end browser testing
- @playwright/test - Test runner

**Test Configuration:**
- `vitest.config.ts` - Unit test configuration
- `playwright.config.ts` - E2E configuration

## Build & Development

**Bundler:**
- Next.js built-in (Turbopack/Vite)
- TypeScript compiler (tsc)

**Linting:**
- ESLint (latest) - Code linting
- next/core-web-vitals - Next.js ESLint rules
- Custom `no-duplicate-component` rule

**Formatting:**
- ESLint `prefer-const`, `no-var` rules

## Styling

**CSS Framework:**
- Tailwind CSS (latest) - Utility classes
- PostCSS - CSS processing
- Autoprefixer - Vendor prefixes
- shadcn/ui - Component primitives
- radix-ui - Headless UI components
- class-variance-authority - Variant management
- tw-animate-css - Animation utilities

**UI Components:**
- Ant Design - Enterprise components
- Lucide React - Icon library
- @ant-design/icons - Additional icons

## Security

**Password Hashing:**
- bcryptjs 3.x - Password hashing
- @noble/hashes 2.x - Cryptographic hashing
- better-auth hashPassword - Auth-specific hashing

## Configuration Files

**Key Config Files:**
- `tsconfig.json` - TypeScript configuration
- `next.config.ts` - Next.js configuration with next-intl plugin
- `.eslintrc.js` - ESLint configuration
- `vitest.config.ts` - Vitest configuration
- `playwright.config.ts` - Playwright configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `postcss.config.mjs` - PostCSS configuration
- `components.json` - shadcn/ui configuration

## Platform Requirements

**Development:**
- Node.js (latest)
- npm or yarn
- SQLite or PostgreSQL

**Production:**
- Node.js server or serverless deployment
- PostgreSQL recommended
- S3-compatible storage (optional)

---

*Stack analysis: 2026-06-17*
