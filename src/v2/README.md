# v2 Implementation

## Architecture

v2 follows Next.js App Router native patterns with route-based
structure. No feature flags - clean separation from v1.

## Directory Structure

```
src/v2/
├── app/           # Next.js App Router pages
│   ├── [locale]/ # i18n routing (native)
│   ├── (auth)/   # Auth routes
│   └── api/      # API routes
├── components/   # v2-specific components
└── lib/          # v2-specific services (if needed)
```

## Key Principles

1. **Route-based**: Each page = one route directory
2. **Shared code**: Import from src/lib/ and src/components/
3. **No duplication**: Never copy from legacy, reference only
4. **Incremental**: Migrate page by page

## Component Patterns

See src/v2/docs/COMPONENTS.md

## Migration Guide

See MIGRATION-POLICY.md
