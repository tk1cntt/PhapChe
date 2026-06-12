# Phase 40: v2 Route Scaffold — Context

**Created:** 2026-06-13

## Decisions

### 1. Layout Wrapper Pattern

**Decision:** All pages wrap with existing UserLayout/AdminLayout.

**Rationale:** Consistent navigation structure, shared auth handling.

**Implementation:**
- User pages: `import { UserLayout } from '@/components/layout/UserLayout'`
- Admin pages: `import { AdminLayout } from '@/components/layout/AdminLayout'`

## Technical Notes

### Page Structure Pattern

```typescript
// User pages
import { UserLayout } from '@/components/layout/UserLayout';

export default function Page() {
  return (
    <UserLayout>
      <div>{/* placeholder content */}</div>
    </UserLayout>
  );
}

// Admin pages
import { AdminLayout } from '@/components/layout/AdminLayout';
```

### Route Check

Routes to verify exist:
```
User Portal:
- src/v2/app/[locale]/dashboard/
- src/v2/app/[locale]/create/
- src/v2/app/[locale]/cases/
- src/v2/app/[locale]/messages/
- src/v2/app/[locale]/workspace/
- src/v2/app/[locale]/settings/

Admin Portal:
- src/v2/app/[locale]/admin/dashboard/
- src/v2/app/[locale]/admin/users/
- src/v2/app/[locale]/admin/requests/
- src/v2/app/[locale]/admin/vault/
- src/v2/app/[locale]/admin/audit/
- src/v2/app/[locale]/admin/workspace/
- src/v2/app/[locale]/admin/operations/
```

---

*Phase: 40-scaffold-v2-routes*
*Context created: 2026-06-13*
