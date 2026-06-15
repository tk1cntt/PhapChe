# Phase 69 - UI Review

**Audited:** 2026-06-15
**Baseline:** Abstract 6-pillar standards (no UI-SPEC.md exists)
**Screenshots:** captured (dev server running at localhost:3000)

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 3/4 | Translations present, but status badge displays raw English values |
| 2. Visuals | 2/4 | Inconsistent styling: inline styles mixed with Tailwind, mixed border-radius (15px vs lg) |
| 3. Color | 2/4 | Hardcoded hex colors scattered, no CSS variable usage for brand colors |
| 4. Typography | 2/4 | Inline styles for headings, inconsistent font size approach |
| 5. Spacing | 3/4 | Generally consistent with standard Tailwind scale, minor inconsistencies |
| 6. Experience Design | 2/4 | Data mismatch causes runtime error; status displays raw English |

**Overall: 14/24**

---

## Top 3 Priority Fixes

1. **BLOCKER: Runtime crash on detail page** (`[id]/page.tsx:358`) - Code references `organization.slug` but the Organization model/schema does not have a `slug` field. This will cause `TypeError: Cannot read properties of undefined (reading 'slug')` when viewing any organization detail. Fix: Remove line 358 or replace with `organization.id` for display.

2. **BLOCKER: Status badge displays raw English** (`[id]/page.tsx:216, 280`) - Status badge renders raw `org.status` string (e.g., "active", "inactive") instead of translated labels. User sees untranslated text. Fix: Use translation keys `t('statusActive')` / `t('statusInactive')` or a proper i18n lookup.

3. **WARNING: Inline styles mixed with Tailwind** (`page.tsx:138, 141, 211`) - Headings use inline `style={{}}` objects while rest of component uses Tailwind classes. Inconsistent approach makes maintenance harder. Fix: Convert to Tailwind classes (e.g., `text-3xl font-extrabold tracking-tight`).

---

## Detailed Findings

### Pillar 1: Copywriting (3/4)

**Score: 3/4 - Good: Minor issues, contract substantially met**

**Findings:**
- All UI text uses i18n keys from `AdminOrganizations` namespace
- Translations exist for both VI and EN languages
- Empty state uses `t('emptyTitle')` properly
- No generic labels like "Submit", "OK", "Click Here" found

**Issues:**
- **WARNING**: Status badge displays raw `org.status` value (line 280: `{org.status}`, line 216: `{organization.status}`) instead of translated status labels. The raw string "active"/"inactive" is shown to users instead of "Active"/"Inactive" or translated equivalents.
- Line 237 in list page: empty state only shows `t('emptyTitle')` without `emptyDesc` description

**Files:** `page.tsx:280`, `[id]/page.tsx:216,280`

---

### Pillar 2: Visuals (2/4)

**Score: 2/4 - Needs work: Notable gaps, contract partially met**

**Findings:**
- Clear focal point: page title and primary action button are prominent
- Icon buttons paired with visible labels
- Visual hierarchy present through size differentiation

**Issues:**
- **WARNING**: Mixed styling approaches - some elements use Tailwind classes, others use inline `style={}` objects for typography:
  - `page.tsx:138` - `<h1 style={{ fontSize: 31, fontWeight: 800, ...`
  - `page.tsx:141` - `<p style={{ fontSize: 15, fontWeight: 500, ...`
  - `[id]/page.tsx:211` - `<h1 style={{ fontSize: 28, fontWeight: 700, ...`
- **WARNING**: Inconsistent border-radius values:
  - Cards use `rounded-[15px]` (custom value)
  - Buttons use `rounded-lg` (Tailwind default)
  - This creates visual inconsistency between card containers and interactive elements
- **WARNING**: Hardcoded inline styles for colors instead of Tailwind:
  - `page.tsx:138` - `color: '#020617'`
  - `page.tsx:141` - `color: '#5f6e83'`

**Files:** `page.tsx:138,141`, `[id]/page.tsx:211`

---

### Pillar 3: Color (2/4)

**Score: 2/4 - Needs work: Notable gaps, contract partially met**

**Findings:**
- Primary color (teal-600) used consistently for primary actions
- Status colors defined in `getStatusColor()` function with proper Tailwind classes
- No accent color overuse detected

**Issues:**
- **WARNING**: Multiple hardcoded hex colors instead of Tailwind:
  - `page.tsx:138` - `#020617` (should be `text-gray-950` or CSS variable)
  - `page.tsx:141` - `#5f6e83` (should be `text-gray-500`)
  - `page.tsx:212` - `#dfe7f1` (should be `border-gray-200`)
  - `[id]/page.tsx:157` - `#64748b` (should be `text-gray-500`)
- **WARNING**: Custom box-shadow inline style at `page.tsx:212` - `'0 10px 25px rgba(15, 23, 42, 0.04)'` should be a CSS variable or utility class
- **WARNING**: CSS variable usage inconsistent - `page.tsx:207` uses `style={{ borderColor: 'var(--border)' }}` while other borders use hardcoded colors

**Files:** `page.tsx:138,141,207,212`, `[id]/page.tsx:157,280,369,385,406`

---

### Pillar 4: Typography (2/4)

**Score: 2/4 - Needs work: Notable gaps, contract partially met**

**Findings:**
- Font sizes used: xs, sm, base, lg, xl, 2xl (reasonable range)
- Font weights used: normal, medium, semibold, bold (consistent)
- Table headers use `uppercase tracking-wider` for visual hierarchy

**Issues:**
- **WARNING**: Inline styles override Tailwind for headings:
  - Page title: `fontSize: 31, fontWeight: 800` (should use `text-3xl font-extrabold`)
  - Subtitle: `fontSize: 15, fontWeight: 500` (should use `text-sm font-medium`)
  - Detail title: `fontSize: 28, fontWeight: 700` (should use `text-2xl font-bold`)
- **WARNING**: Non-standard font size `31px` used instead of Tailwind scale (32px for 3xl)
- **WARNING**: Letter-spacing hardcoded (`-0.8px`) instead of using Tailwind's `tracking-tight`

**Files:** `page.tsx:138,141`, `[id]/page.tsx:211`

---

### Pillar 5: Spacing (3/4)

**Score: 3/4 - Good: Minor issues, contract substantially met**

**Findings:**
- Spacing uses standard Tailwind scale (4, 6, 8, 10, 12)
- Consistent padding: `px-6 py-4` for table cells
- Card spacing: `p-6` or `p-8` consistent
- Gap values: `gap-2`, `gap-3`, `gap-4` used appropriately

**Issues:**
- **MINOR**: `rounded-[15px]` is a custom value not in standard Tailwind scale (should use `rounded-2xl` which equals 16px)
- **MINOR**: `min-h-[400px]` is a custom value for loading container height

**Files:** `page.tsx:186,207,212`, `[id]/page.tsx:164,280,369`

---

### Pillar 6: Experience Design (2/4)

**Score: 2/4 - Needs work: Notable gaps, contract partially met**

**Findings:**
- Loading state handled: shows text with `tCommon('loading')`
- Error state handled: displays error message with retry button
- Empty state handled: shows `t('emptyTitle')` when no data
- Delete confirmation: uses `confirm(t('deleteConfirm'))` before destructive action
- Disabled state: save button shows `disabled={saving}` with opacity-50
- Pagination implemented with page navigation
- Search with debounce (300ms) implemented

**Issues:**
- **BLOCKER**: `organization.slug` referenced but field does not exist in Prisma schema - will crash page
- **WARNING**: Browser `confirm()` dialog used for delete confirmation (`[id]/page.tsx:125`) instead of a custom modal component
- **WARNING**: No skeleton loading state - just plain text "Loading..." shown
- **WARNING**: Form field mislabeled: `formData.description` maps to `registrationNumber` field (semantically incorrect)
- **MINOR**: Search/filter state not persisted in URL params
- **MINOR**: No toast/notification after successful save operation
- **MINOR**: `_count.users` always shows 0 because API only returns `workspaces` count

**Files:** `page.tsx:206-209`, `[id]/page.tsx:154-160,124-125,264-268,358`

---

## Registry Safety

Registry audit: Not applicable (no shadcn components or third-party registries used in this phase)

---

## Files Audited

- `src/app/[locale]/admin/organizations/page.tsx` - Organization list page
- `src/app/[locale]/admin/organizations/[id]/page.tsx` - Organization detail page
- `src/messages/vi.json` - Vietnamese translations (AdminOrganizations namespace)
- `src/messages/en.json` - English translations (AdminOrganizations namespace)
- `src/app/api/admin/organizations/[id]/route.ts` - API route for verification
- `prisma/schema.prisma` - Schema verification for `slug` field
