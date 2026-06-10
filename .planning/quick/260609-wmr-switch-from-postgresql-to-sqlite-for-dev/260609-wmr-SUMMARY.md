---
quick_id: 260609-wmr
slug: switch-from-postgresql-to-sqlite-for-dev
status: complete
completed: 2026-06-10
commits:
  - 8afbd54: "feat: switch from PostgreSQL to SQLite for development"
---

# Quick Task 260609-wmr: Switch to SQLite for Development

## Summary

Successfully switched from PostgreSQL to SQLite for local development.

## Changes Made

### 1. Prisma Schema (`prisma/schema.prisma`)
- Changed provider from `postgresql` to `sqlite`
- Removed all enums (SQLite doesn't support them)
- Enum fields changed to String with default values

### 2. Auth Configuration (`src/auth.ts`)
- Added auto-detection based on NODE_ENV
- Uses `sqlite` for development, `postgresql` for production

### 3. Middleware (`src/middleware.ts`)
- Skip API routes from i18n routing
- API routes now work without locale prefix

### 4. Routing (`src/routing.ts`)
- Updated to handle API routes properly

### 5. API Routes
- Moved from `/intake/api/` to `/api/intake/`
- Updated components to use new paths

## Database Setup

### Development (SQLite)
```bash
# Database already seeded at: prisma/data/legal_service_dev.db
DATABASE_URL="file:./prisma/data/legal_service_dev.db"
```

### Production (PostgreSQL)
```bash
DATABASE_URL="postgresql://user:password@host:5432/dbname"
```

## Verification

Tested API endpoint:
```bash
curl -X POST http://localhost:3000/api/intake/create-draft \
  -d "matterTypeKey=agency_contract"
# Response: {"requestId":"cmq7bdt5d00034wnwna376el1"}
```

## Files Changed
- `prisma/schema.prisma` - SQLite provider, no enums
- `prisma/seed.ts` - Updated seed script
- `src/auth.ts` - Auto-detect DB provider
- `src/middleware.ts` - Skip API from i18n
- `src/routing.ts` - Better API handling
- `src/app/api/intake/*` - New API routes
- `src/app/intake/components.tsx` - Updated API paths
