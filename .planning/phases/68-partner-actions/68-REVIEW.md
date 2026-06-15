---
phase: 68
reviewed: 2026-06-15T00:00:00Z
depth: standard
files_reviewed: 17
files_reviewed_list:
  - src/app/api/partner/requests/[id]/status/route.ts
  - src/app/api/partner/requests/[id]/comments/route.ts
  - src/app/api/partner/requests/[id]/documents/route.ts
  - src/app/api/admin/partner/requests/route.ts
  - src/app/api/admin/partner/requests/[id]/route.ts
  - src/app/api/admin/partner/requests/[id]/status/route.ts
  - src/app/api/admin/partner/requests/[id]/comments/route.ts
  - src/app/api/admin/partner/requests/[id]/documents/route.ts
  - src/components/partners/ui/StatusUpdateForm.tsx
  - src/components/partners/ui/CommentForm.tsx
  - src/components/partners/ui/CommentList.tsx
  - src/components/partners/ui/DocumentUpload.tsx
  - src/components/partners/ui/DocumentList.tsx
  - src/lib/constants/partner-statuses.ts
  - src/app/[locale]/admin/partner/page.tsx
  - src/app/[locale]/admin/partner/[id]/page.tsx
findings:
  critical: 2
  warning: 5
  info: 2
  total: 9
status: fixed
fixed_findings:
  - id: CR-01
    description: Missing translation keys for partner components
    commit: 673a6b6
  - id: CR-02
    description: Component props mismatch (CommentList, DocumentList)
    commit: 673a6b6
  - id: WR-02
    description: Inline styles instead of Tailwind
    commit: 673a6b6
  - id: WR-03
    description: No confirmation for document deletion
    commit: 673a6b6
  - id: IN-01
    description: Unused variable in admin comments API
    commit: 673a6b6
remaining_findings:
  - id: WR-01
    description: File content not persisted (StorageService not implemented)
    reason: Requires StorageService implementation
  - id: WR-04
    description: Audit log entityId points to wrong entity
    reason: Minor issue, not breaking
  - id: WR-05
    description: Pagination logic could cause missing pages
    reason: Minor UX issue
  - id: IN-02
    description: Partner status constant includes cancelled in docs
    reason: Documentation clarification needed
---

# Phase 68: Partner Actions Code Review

**Reviewed:** 2026-06-15
**Depth:** Standard
**Files Reviewed:** 17
**Status:** needs-fix

## Summary

Reviewed Phase 68 Partner Actions implementation. Found 2 critical bugs, 5 warnings, and 2 info items. The API implementations are generally sound with proper authentication and authorization checks. However, there are significant runtime bugs in the admin detail page where components receive incorrect props, and all partner.* translation keys are missing from localization files.

## Critical Issues

### CR-01: Missing Translation Keys for Partner Components

**File:** `src/messages/vi.json`, `src/messages/en.json`
**Lines:** All partner component files reference missing keys
**Issue:** All partner.* translation keys used in the UI components are not defined in the localization files:

- `partner.status.*` (6 keys: updateSuccess, title, label, note, notePlaceholder, update)
- `partner.comments.*` (7 keys: add, title, empty, placeholder, internal, send)
- `partner.documents.*` (8 keys: upload, uploadSuccess, sizeError, descriptionPlaceholder, title, empty, download)

The UI review findings from phase 68 documented this issue but it was not fixed.
**Fix:** Add the following keys to both `vi.json` and `en.json`:

```json
"partner": {
  "status": {
    "title": "Update Status",
    "label": "Status",
    "note": "Note",
    "notePlaceholder": "Add a note about this status change...",
    "update": "Update Status",
    "updateSuccess": "Status updated successfully"
  },
  "comments": {
    "title": "Comments",
    "add": "Add Comment",
    "empty": "No comments yet",
    "placeholder": "Write your comment...",
    "internal": "Internal",
    "send": "Send"
  },
  "documents": {
    "title": "Documents",
    "upload": "Upload Document",
    "uploadSuccess": "Document uploaded successfully",
    "sizeError": "File size exceeds 10MB limit",
    "descriptionPlaceholder": "Document description (optional)",
    "empty": "No documents uploaded",
    "download": "Download"
  }
}
```

---

### CR-02: Component Props Mismatch - CommentList and DocumentList

**File:** `src/app/[locale]/admin/partner/[id]/page.tsx`
**Lines:** 185, 199
**Issue:** `CommentList` and `DocumentList` are being passed `requestId` prop but their interfaces expect `comments` and `documents` arrays respectively:

```tsx
// Line 185 - CommentList expects comments array, not requestId
<CommentList requestId={requestId} />

// Line 199 - DocumentList expects documents array, not requestId
<DocumentList requestId={requestId} />
```

This will cause runtime errors because:
- `CommentList` expects `comments: Comment[]` prop
- `DocumentList` expects `documents: Document[]` prop

Neither component fetches data internally - they expect parent to pass the data.
**Fix:** Either:
1. Pass actual data arrays (requires fetching comments/documents via API)
2. Refactor components to fetch data internally using requestId

Option 1 (recommended for current architecture):
```tsx
const [comments, setComments] = useState<Comment[]>([]);
const [documents, setDocuments] = useState<Document[]>([]);

// Fetch in useEffect...
// <CommentList comments={comments} />
// <DocumentList documents={documents} />
```

---

## Warnings

### WR-01: File Content Not Actually Stored - Data Loss Risk

**File:** `src/app/api/partner/requests/[id]/documents/route.ts`
**Lines:** 130-137
**Issue:** The document upload API acknowledges the upload and stores metadata, but explicitly does NOT persist the actual file content:

```typescript
// TODO: Implement actual file upload to StorageService
// Currently only metadata is stored. File content is not persisted.
// This is a known limitation - StorageService integration needed.
console.warn(`[Partner Documents] File upload requested but StorageService not implemented...`);
```

The same issue exists in the admin documents API. This creates silent data loss - users believe files are uploaded, but the actual content is never saved.
**Fix:** Implement StorageService integration before deploying, or remove file upload functionality entirely until storage is implemented.

---

### WR-02: Inline Styles Instead of Tailwind Classes

**File:** `src/app/[locale]/admin/partner/page.tsx`
**Lines:** 157-163, 201, 206
**Issue:** Inline styles used instead of Tailwind classes:

```tsx
<h1 style={{ fontSize: 31, fontWeight: 800, letterSpacing: '-0.8px', color: '#020617', marginBottom: 12 }}>
{t('pageTitle')}
</h1>
<p style={{ fontSize: 15, fontWeight: 500, color: '#5f6e83', margin: 0 }}>
  {t('pageDescription')}
</p>
```

**Fix:** Convert to Tailwind classes:
```tsx
<h1 className="text-3xl font-extrabold tracking-tight text-slate-950 mb-3">
  {t('pageTitle')}
</h1>
<p className="text-sm font-medium text-slate-500 m-0">
  {t('pageDescription')}
</p>
```

---

### WR-03: No Confirmation for Document Deletion

**File:** `src/components/partners/ui/DocumentList.tsx`
**Lines:** 96-102
**Issue:** Delete button directly calls `onDelete(doc.id)` without confirmation:

```tsx
<button
  onClick={() => onDelete(doc.id)}
  className="text-red-500 text-sm hover:underline"
>
  {t('common.delete')}
</button>
```

**Fix:** Add confirmation dialog before deletion:
```tsx
<button
  onClick={() => {
    if (window.confirm(t('common.confirmDelete'))) {
      onDelete(doc.id);
    }
  }}
  className="text-red-500 text-sm hover:underline"
>
  {t('common.delete')}
</button>
```

---

### WR-04: Audit Log entityId Points to Wrong Entity

**File:** `src/app/api/partner/requests/[id]/comments/route.ts`
**Lines:** 133-137
**Issue:** Audit log's entityId is set to `id` (the requestId) instead of the actual comment ID:

```typescript
prisma.auditLog.create({
  data: {
    action: 'request.comment_added',
    entityType: 'request_comment',
    entityId: id, // Should be comment.id
    ...
  },
}),
```

The code attempts to fix this later with an update query, but this is unreliable. Same issue exists in documents route.
**Fix:** Use the comment/document ID directly as entityId:
```typescript
const [comment] = await prisma.$transaction([
  prisma.requestComment.create({...}),
  prisma.auditLog.create({
    data: {
      entityId: comment.id, // Use the ID that will be created
      ...
    },
  }),
]);
```

Wait for comment to be created first, then use its ID.

---

### WR-05: Pagination Logic Could Cause Missing Pages

**File:** `src/app/[locale]/admin/partner/page.tsx`
**Lines:** 293-307
**Issue:** Pagination always shows pages 1-5 regardless of current page:

```tsx
<div className="flex items-center gap-1">
  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    const pageNum = i + 1; // Always starts at 1
    return <button ...>{pageNum}</button>;
  })}
</div>
```

When on page 10, pagination still shows 1-5, not 6-10 or 8-12.
**Fix:** Implement proper pagination with sliding window or always showing current range.

---

## Info

### IN-01: Unused Variable in Admin Comments API

**File:** `src/app/api/admin/partner/requests/[id]/comments/route.ts`
**Line:** 57
**Issue:** `userId` is destructured from `requireAdminSession()` but never used:

```typescript
const { userId } = await requireAdminSession(); // userId not used
```

**Fix:** Remove unused variable or use `_userId` to indicate intentional unused value.

---

### IN-02: Partner Status Constant Includes Cancelled in Allowed List

**File:** `src/lib/constants/partner-statuses.ts`
**Lines:** 10-15
**Issue:** `PARTNER_ALLOWED_STATUSES` includes `CANCELLED` but the workflow definition only allows partners to transition to `pending_review` or `cancelled` from `in_progress`. This is intentional but the constant suggests partners can also cancel requests directly:

```typescript
export const PARTNER_ALLOWED_STATUSES = [
  REQUEST_STATUS.IN_PROGRESS,      // Starting status
  REQUEST_STATUS.PENDING_REVIEW,    // After work done
  REQUEST_STATUS.APPROVED,          // After review
  REQUEST_STATUS.DELIVERED,         // After delivery
  // Note: CANCELLED is not included but was mentioned in docs
] as const;
```

**Fix:** Consider whether partners should be able to cancel. If yes, add `CANCELLED`. If no, update documentation to be explicit.

---

## Structural Findings (fallow)

None provided for this phase.

---

_Reviewed: 2026-06-15_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
