# Phase 16 — Pattern Map

## Purpose

Map Phase 16 repairs to existing code patterns so implementation stays surgical.

## Files and Closest Analogs

| Target | Role | Closest analog / pattern | Notes |
|---|---|---|---|
| `.planning/phases/16-.../validate-phase-16-routes.cjs` | validation harness | `.planning/quick/260606-pfi-.../validate-and-capture.cjs` | Reuse route discovery, error checks, screenshot-after-pass rule; add role-specific sessions and groups. |
| `src/app/specialist/requests/page.tsx` | server page/data fetch | existing page itself; `src/app/admin/requests/page.tsx` as client-safe AntD usage | Keep Prisma/session server-side; pass DTO to client table. |
| `src/app/specialist/requests/*client*.tsx` | client table | AntD `Table` usage in existing client pages like `src/app/admin/requests/page.tsx` | New small client component may hold render functions. |
| `src/app/reviewer/requests/page.tsx` | server page/data fetch | specialist requests pattern | Same server/client table split. |
| `src/app/reviewer/requests/*client*.tsx` | client table | AntD Table client component pattern | Convert Date to strings before props. |
| `src/app/admin/ops/page.tsx` | ops dashboard | existing ops page + `src/app/admin/audit/page.tsx` | Preserve safe audit metadata; fix invalid element/boundary. |
| `src/app/admin/ops/[requestId]/page.tsx` | ops timeline detail | existing timeline page + audit route | Preserve safe identifiers and timeline table. |
| `src/app/admin/routing/page.tsx` | admin-only page | existing role-gated admin pages | Validate with admin user; do not weaken auth. |
| `src/app/admin/templates/**/page.tsx` | template governance UI | existing template service/actions | Fix valid admin scenario rendering/form action issues only if blocking. |
| `src/app/admin/users/page.tsx` | admin users UI | current users page | Validate with admin/coordinator role; keep role tags. |
| `src/app/admin/vault/page.tsx` | vault classification UI | current vault page + form components in `components/` under route | Validate with admin role and workspace fixture. |
| dynamic request routes | detail pages | current page files + Prisma request ownership relations | Use role-owned request IDs; deliberate denied/not-found only for invalid scenarios. |

## Implementation Rules

- Keep server-only data access in Server Components/services.
- Move render-function-heavy AntD tables into client components when Next complains.
- Use serializable DTO props across server/client boundary.
- Reuse existing AntD components and page copy patterns.
- Validation script is the source of truth for screenshots; do not manually capture broken pages.
