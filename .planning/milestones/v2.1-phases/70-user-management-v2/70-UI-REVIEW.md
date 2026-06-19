# Phase 70 — UI Review

**Audited:** 2026-06-15
**Baseline:** Abstract 6-pillar standards (no UI-SPEC.md found)
**Screenshots:** Captured (dev server running at localhost:3000)

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 2/4 | Multiple hardcoded strings instead of i18n keys |
| 2. Visuals | 3/4 | Role pills show raw role keys alongside translations |
| 3. Color | 2/4 | Heavy inline color usage with no design tokens |
| 4. Typography | 3/4 | Consistent sizes but uses inline styles not Tailwind |
| 5. Spacing | 2/4 | Inline pixel values instead of Tailwind spacing scale |
| 6. Experience Design | 2/4 | Missing error states, non-functional buttons |

**Overall: 14/24**

---

## Top 3 Priority Fixes

1. **Hardcoded "System Roles" string** — Not translated, violates i18n contract — Change `RolePills.tsx:51` from hardcoded string to `t('systemRoles')` using existing translation key
2. **Hardcoded "users total" in pagination** — English-only string — Change `UserTable.tsx:400` from `"${pagination.total} users total"` to use i18n with `t('totalUsersCount', { total: pagination.total })`
3. **No error state on API fetch failure** — Users see empty table with no feedback when API fails — Add error handling with error message display in `UsersPageClient.tsx`

---

## Detailed Findings

### Pillar 1: Copywriting (2/4)

**Hardcoded strings found:**

| File | Line | Issue | Fix |
|------|------|-------|-----|
| `RolePills.tsx` | 51 | Hardcoded `"System Roles"` | Use `t('systemRoles')` |
| `RolePills.tsx` | 78 | Displays `{label} ({role})` — raw role key | Remove redundant role key display |
| `UserTable.tsx` | 238 | Hardcoded `` `Team ${row.role}` `` | Use i18n: `t('team')` |
| `UserTable.tsx` | 301 | Hardcoded `"workspace-scope"` | Use i18n key |
| `UserTable.tsx` | 400 | Hardcoded `"users total"` | Use `t('totalUsersCount')` |

**Evidence:** `RolePills.tsx:51` shows plain string instead of translation:
```tsx
System Roles  // Should be {t('systemRoles')}
```

### Pillar 2: Visuals (3/4)

**Role Pills show redundant data:**

`RolePills.tsx:78` displays:
```
Khách hàng (customer)    0
Chuyên viên (specialist) 0
...
```

The translated label already includes the role key in parentheses — confusing duplication.

**Checkbox column non-functional:**

`UserTable.tsx:72-90` renders checkbox column without select-all or individual select logic. Icon-only buttons missing aria-labels.

**Good patterns:**
- Avatar initials with role-based colors
- Status badges with dot indicators
- Consistent card shadows and borders

### Pillar 3: Color (2/4)

**Heavy inline color usage (no design tokens):**

| Component | Inline Color Count |
|-----------|-------------------|
| `UsersPageClient.tsx` | ~15 hardcoded colors |
| `UserTable.tsx` | ~35 hardcoded colors |
| `UserToolbar.tsx` | ~20 hardcoded colors |
| `RolePills.tsx` | ~12 hardcoded colors |
| `AdminStatGrid.tsx` | ~10 hardcoded colors |

**Example from `UserTable.tsx:120-129`:**
```tsx
const rColor = roleColors?.[row.role] || { bg: '#dbeafe', color: '#2563eb' };
// Hardcoded hex values throughout component
```

**Missing:** CSS custom properties or Tailwind classes for consistent color palette.

**Recommendation:** Extract to design tokens or use Tailwind classes (e.g., `bg-blue-100`, `text-blue-600`).

### Pillar 4: Typography (3/4)

**Font sizes (inline, not Tailwind):**
- H1: 31px, weight 800
- Body: 15px, weight 500
- Table headers: 14px, weight 700
- Secondary text: 12px, weight 400-500

**Consistent patterns but inline styles instead of Tailwind:**
```tsx
// Current (inline)
<h1 style={{ fontSize: 31, fontWeight: 800, ... }}>

// Preferred (Tailwind)
<h1 className="text-[31px] font-extrabold">
```

**Note:** 31px is not a standard Tailwind size — consider using `text-4xl` (14px base) or `text-[1.94rem]`.

### Pillar 5: Spacing (2/4)

**All inline pixel values instead of Tailwind spacing:**

| Location | Current | Expected (Tailwind) |
|----------|---------|---------------------|
| Page header marginBottom | 22px | `mb-5` (20px) or `mb-6` (24px) |
| StatGrid gap | 18px | `gap-5` (20px) |
| Toolbar padding | 20px | `p-5` (20px) |
| RolePills padding | 24px | `p-6` (24px) |
| Card padding | 22-24px | `p-5` or `p-6` |

**All components audited:**
- `UsersPageClient.tsx` — inline spacing throughout
- `UserTable.tsx` — inline spacing throughout
- `UserToolbar.tsx` — inline spacing throughout
- `RolePills.tsx` — inline spacing throughout
- `AdminStatGrid.tsx` — inline spacing throughout

**Arbitrary pixel values:** 22px, 18px, 20px, 24px, 52px (width), 38px (height), 28px (height) — not matching 4px scale.

### Pillar 6: Experience Design (2/4)

**Missing error state:**

`UsersPageClient.tsx:94-111` — `useQuery` handles errors but UI doesn't display them:
```tsx
const { data, isLoading, refetch } = useQuery<PaginatedResponse>({
  queryKey: ['users', ...],
  queryFn: async () => {
    const res = await fetch(...);
    if (!res.ok) throw new Error('Failed to fetch'); // Error thrown but not caught
    return res.json();
  },
  // No onError handler
});
```

**Non-functional buttons:**

| Button | Issue | Location |
|--------|-------|----------|
| Refresh | No loading indicator during refetch | `UserToolbar.tsx:209-231` |
| Columns | Click handler missing | `UserToolbar.tsx:244-246` |
| Export | Only `console.log('Export clicked')` | `UserToolbar.tsx:234` |
| Create User | Click handler missing | `UsersPageClient.tsx:173-199` |

**Good patterns:**
- Loading state with Spin component (`UsersPageClient.tsx:116-122`)
- Debounced search (300ms)
- Pagination with Paging component

---

## Registry Safety

Registry audit: No shadcn components.json found — skipped.

---

## Files Audited

| File | Path |
|------|------|
| UsersPageClient | `src/components/admin/UsersPageClient.tsx` |
| UserTable | `src/components/admin/UserTable.tsx` |
| UserToolbar | `src/components/admin/UserToolbar.tsx` |
| RolePills | `src/components/admin/RolePills.tsx` |
| AdminStatGrid | `src/components/admin/AdminStatGrid.tsx` |
| Paging | `src/components/ui/Paging.tsx` |
| Page | `src/app/[locale]/admin/users/page.tsx` |
| Translations VI | `src/messages/vi.json` (AdminUsers namespace) |
| Translations EN | `src/messages/en.json` (AdminUsers namespace) |
