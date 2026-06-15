# Phase 68 — UI Review

**Audited:** 2026-06-15
**Baseline:** UI-SPEC.md (abstract 6-pillar standards)
**Screenshots:** not captured (dev server returns 307 redirect)

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 1/4 | BLOCKER: Missing translation keys `partner.status.*`, `partner.comments.*`, `partner.documents.*` across all partner UI components |
| 2. Visuals | 2/4 | Inline styles mixed with Tailwind; inconsistent heading hierarchy |
| 3. Color | 2/4 | Hardcoded colors in page files; accent color not applied per design system |
| 4. Typography | 3/4 | Uses 4 font sizes appropriately; inline styles bypass design system |
| 5. Spacing | 2/4 | Inconsistent mix of Tailwind and inline styles for spacing |
| 6. Experience Design | 2/4 | Loading states are text-only; no confirmation for destructive actions |

**Overall: 12/24**

---

## Top 3 Priority Fixes

1. **[BLOCKER] Missing translation keys in partner UI components** — Components display blank text or "Missing key" — Add `partner` namespace with `status.*`, `comments.*`, `documents.*` keys to `src/messages/vi.json` and `src/messages/en.json`

2. **Hardcoded inline styles instead of Tailwind classes** — `src/app/[locale]/admin/partner/page.tsx:157-162` uses inline styles for heading; inconsistent with design system — Convert to Tailwind classes `text-3xl font-extrabold text-slate-900`

3. **No confirmation dialog for document deletion** — `DocumentList.tsx` delete action fires immediately — Add confirmation modal before destructive action

---

## Detailed Findings

### Pillar 1: Copywriting (1/4)

**Finding 1.1 [BLOCKER]: Missing translation keys in StatusUpdateForm**
- **File:** `src/components/partners/ui/StatusUpdateForm.tsx`
- **Lines:** 62, 77, 81, 99, 106, 127
- **Issue:** Uses `t('partner.status.*')` keys that do not exist in translation files
- **Missing keys:** `partner.status.updateSuccess`, `partner.status.title`, `partner.status.label`, `partner.status.note`, `partner.status.notePlaceholder`, `partner.status.update`

**Finding 1.2 [BLOCKER]: Missing translation keys in CommentList**
- **File:** `src/components/partners/ui/CommentList.tsx`
- **Lines:** 33, 40, 63
- **Issue:** Uses `t('partner.comments.*')` keys that do not exist
- **Missing keys:** `partner.comments.title`, `partner.comments.empty`, `partner.comments.internal`

**Finding 1.3 [BLOCKER]: Missing translation keys in CommentForm**
- **File:** `src/components/partners/ui/CommentForm.tsx`
- **Lines:** 50, 58, 70, 78
- **Issue:** Uses `t('partner.comments.*')` keys that do not exist
- **Missing keys:** `partner.comments.add`, `partner.comments.placeholder`, `partner.comments.send`

**Finding 1.4 [BLOCKER]: Missing translation keys in DocumentList**
- **File:** `src/components/partners/ui/DocumentList.tsx`
- **Lines:** 63, 70, 93, 100
- **Issue:** Uses `t('partner.documents.*')` keys that do not exist
- **Missing keys:** `partner.documents.title`, `partner.documents.empty`, `partner.documents.download`

**Finding 1.5 [BLOCKER]: Missing translation keys in DocumentUpload**
- **File:** `src/components/partners/ui/DocumentUpload.tsx`
- **Lines:** 48, 62, 79, 118, 142, 149
- **Issue:** Uses `t('partner.documents.*')` keys that do not exist
- **Missing keys:** `partner.documents.uploadSuccess`, `partner.documents.sizeError`, `partner.documents.upload`, `partner.documents.descriptionPlaceholder`

**Score justification:** Score is 1/4 (Poor) because all 5 partner UI components rely on translation keys that do not exist in either `vi.json` or `en.json`. This is a blocker - components will display "Missing translation key" or blank text at runtime.

---

### Pillar 2: Visuals (2/4)

**Finding 2.1: Mixed inline styles with Tailwind classes**
- **File:** `src/app/[locale]/admin/partner/page.tsx`
- **Lines:** 157-162
- **Issue:** Header uses inline styles `style={{ fontSize: 31, fontWeight: 800, letterSpacing: '-0.8px', color: '#020617', marginBottom: 12 }}` instead of Tailwind
- **Expected:** Should use `className="text-3xl font-extrabold tracking-tight text-slate-900 mb-3"`

**Finding 2.2: Visual hierarchy inconsistency in section headings**
- **Files:** Both page files use `<h2>` with inconsistent styles
- **Issue:** `page.tsx` uses `<h2 className="text-lg font-semibold text-gray-900 mb-4">` but other pages may have different heading styles
- **Impact:** Reduced visual consistency across the admin section

**Score justification:** Score is 2/4 (Needs work) due to inconsistent styling patterns. The admin partner list page uses inline styles for the main heading while other sections use Tailwind classes, breaking visual consistency.

---

### Pillar 3: Color (2/4)

**Finding 3.1: Hardcoded color values in page files**
- **File:** `src/app/[locale]/admin/partner/page.tsx`
- **Lines:** 157, 160, 202, 206
- **Issue:** Uses hardcoded colors `color: '#020617'`, `color: '#5f6e83'`, `color: '#64748b'`, `borderColor: '#dfe7f1'`
- **Count:** 4 hardcoded colors

**Finding 3.2: Hardcoded color values in detail page**
- **File:** `src/app/[locale]/admin/partner/[id]/page.tsx`
- **Lines:** 97, 127, 167, 181, 195
- **Issue:** Uses hardcoded colors `color: '#64748b'`, `borderColor: '#dfe7f1'`, `boxShadow: 'rgba(15, 23, 42, 0.04)'`
- **Count:** 5 hardcoded colors

**Finding 3.3: Accent color usage inconsistent**
- **Files:** Partner UI components use `bg-primary`, `text-primary` (5 occurrences across 4 files)
- **Issue:** Primary color is used for buttons and links but design system tokens are not defined in CSS

**Score justification:** Score is 2/4 (Needs work) because hardcoded colors are scattered across page files (9 total) instead of using CSS custom properties or Tailwind's color scale from a design system.

---

### Pillar 4: Typography (3/4)

**Finding 4.1: Font size distribution is reasonable**
- **Files audited:** `admin/partner/page.tsx`, `admin/partner/[id]/page.tsx`, all partner UI components
- **Distinct sizes used:** `text-xs` (table headers), `text-sm` (body), `text-base` (form labels), `text-lg` (section headings), `text-2xl`/`text-3xl` (page titles)
- **Count:** 5 distinct sizes - within acceptable range for admin dashboard

**Finding 4.2: Font weight distribution is appropriate**
- **Weights used:** `font-medium` (labels), `font-semibold` (headings), `font-bold` (titles)
- **Count:** 3 distinct weights - reasonable for hierarchy

**Finding 4.3: Inline styles bypass design system**
- **File:** `page.tsx:157`
- **Issue:** Uses `fontWeight: 800` (inline) instead of `font-black` (Tailwind)
- **Impact:** Design system enforcement is inconsistent

**Score justification:** Score is 3/4 (Good) because font sizes and weights are appropriately distributed with clear hierarchy. Minor deduction for inline style usage that bypasses the design system.

---

### Pillar 5: Spacing (2/4)

**Finding 5.1: Inconsistent spacing patterns**
- **File:** `src/app/[locale]/admin/partner/page.tsx`
- **Issue:** Header section uses `marginBottom: 12` (inline) while other sections use Tailwind `mb-6`
- **Expected:** All spacing should use Tailwind scale (2, 4, 6, 8 = 0.5rem, 1rem, 1.5rem, 2rem)

**Finding 5.2: Border radius inconsistency**
- **Issue:** Uses `rounded-[15px]` (custom) for cards but `rounded-lg` for buttons
- **Expected:** Standard design system should use consistent border radius tokens

**Finding 5.3: Shadow values hardcoded**
- **Files:** Both page files
- **Issue:** Uses `boxShadow: '0 10px 25px rgba(15, 23, 42, 0.04)'` inline instead of Tailwind `shadow-sm` or `shadow-md`

**Score justification:** Score is 2/4 (Needs work) due to mixing inline styles for spacing with Tailwind classes, and inconsistent border radius usage.

---

### Pillar 6: Experience Design (2/4)

**Finding 6.1: Loading states are text-only**
- **Files:** Both page files
- **Issue:** Displays `{tCommon('loading')}` as plain text in a centered div
- **Expected:** Should use skeleton loader or spinner component per design system
- **Code reference:** `page.tsx:201-203`, `[id]/page.tsx:96-98`

**Finding 6.2: No confirmation for destructive actions**
- **File:** `src/components/partners/ui/DocumentList.tsx`
- **Lines:** 95-102
- **Issue:** Delete button fires immediately without confirmation dialog
- **Expected:** Should show confirmation modal before deleting documents

**Finding 6.3: Missing API endpoint in CommentForm**
- **File:** `src/components/partners/ui/CommentForm.tsx`
- **Line:** 26
- **Issue:** Uses `/api/partner/requests/${requestId}/comments` but admin detail page may need `/api/admin/partner/requests/${requestId}/comments`
- **Impact:** Comments may not post correctly from admin context

**Finding 6.4: No document upload endpoint for admin**
- **File:** `src/components/partners/ui/DocumentUpload.tsx`
- **Line:** 35
- **Issue:** Uses `/api/partner/requests/${requestId}/documents` but should use admin endpoint

**Finding 6.5: No pagination for comments/documents**
- **Files:** `CommentList.tsx`, `DocumentList.tsx`
- **Issue:** Components render all comments/documents without pagination
- **Impact:** Performance issues with large datasets

**Score justification:** Score is 2/4 (Needs work) due to text-only loading states, missing confirmation for destructive actions, and potential API endpoint mismatches between admin and partner contexts.

---

## Registry Safety

Registry audit: No shadcn components detected in this phase. Components are custom-built.

---

## Files Audited

- `src/app/[locale]/admin/partner/page.tsx`
- `src/app/[locale]/admin/partner/[id]/page.tsx`
- `src/components/partners/ui/StatusUpdateForm.tsx`
- `src/components/partners/ui/CommentList.tsx`
- `src/components/partners/ui/CommentForm.tsx`
- `src/components/partners/ui/DocumentList.tsx`
- `src/components/partners/ui/DocumentUpload.tsx`
- `src/components/admin/AdminStatGrid.tsx`
- `src/components/admin/AdminToolbar.tsx`
- `src/messages/vi.json`
- `src/messages/en.json`
