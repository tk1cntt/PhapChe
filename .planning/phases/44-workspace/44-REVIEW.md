---
phase: 44-workspace
reviewed: 2026-06-13T00:00:00Z
depth: standard
files_reviewed: 10
files_reviewed_list:
  - src/components/workspace/WorkspaceBanner.tsx
  - src/components/workspace/StatsGrid.tsx
  - src/components/workspace/MemberGrid.tsx
  - src/components/workspace/ResourceTable.tsx
  - src/components/workspace/workspace.css
  - src/components/workspace/index.ts
  - src/app/[locale]/workspace/page.tsx
  - src/app/api/workspace/invite/route.ts
  - src/messages/vi.json
  - src/messages/en.json
findings:
  critical: 2
  warning: 5
  info: 4
  total: 11
status: issues_found
---

# Phase 44: Code Review Report

**Reviewed:** 2026-06-13
**Depth:** standard
**Files Reviewed:** 10
**Status:** issues_found

## Summary

Da review 10 file trong phase 44 workspace. Phat hien 2 loi nghiem trong (hardcoded data thay vi i18n), 5 canh bao ve security/quality, va 4 ghi chu can cai thien. Cac thanh phan chinh (Prisma queries, session auth) duoc implement dung, nhung con mot so noi can xu ly tot hon.

## Critical Issues

### CR-01: Hardcoded percentage value trong vault scope stat

**File:** `src/components/workspace/StatsGrid.tsx:54`
**Issue:** Gia tri '96%' la hardcoded placeholder khong co y nghia:
```typescript
value: stats.vaultFileCount > 0 ? '96%' : '0%',
```
Day la mock data - neu co file vault thi hien 96%, khong thi 0%. Khong co logic tinh toan thuc su.
**Fix:**
```typescript
value: stats.vaultFileCount > 0 
  ? t('vaultPercentage', { percent: Math.round((stats.vaultFileCount / stats.requestCount) * 100) || 100 })
  : '0%',
```
Hoac neu chi la indicator don gian:
```typescript
value: stats.vaultFileCount > 0 ? t('enabled') : t('disabled'),
```

---

### CR-02: Hardcoded status strings thay vi i18n keys

**File:** `src/components/workspace/ResourceTable.tsx:40,50,60`
**Issue:** Cac gia tri trang thai la hardcoded English strings, khong su dung i18n:
```typescript
status: 'Healthy' as const,
status: 'Encrypted' as const,
status: 'Pending' as const,
```
Day se khong translate duoc sang tieng Viet.
**Fix:**
```typescript
status: t('statusHealthy'),
status: t('statusEncrypted'),
status: t('statusPending'),
```
Voi cac key tuong ung trong messages/vi.json va en.json.

---

## Warnings

### WR-01: No rate limiting tren invite API

**File:** `src/app/api/workspace/invite/route.ts`
**Issue:** API khong co rate limiting, co the bi su dung de:
- Enumerate email addresses (user exists/not exists responses)
- Spam invite requests
**Fix:** Them rate limiting:
```typescript
import { rateLimit } from '@/lib/rate-limit';

const rateLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  limit: 5, // 5 requests per minute
});

export async function POST(request: NextRequest) {
  const identifier = request.ip ?? 'anonymous';
  const { success } = await rateLimiter.limit(identifier);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  // ... rest of handler
}
```

---

### WR-02: Missing audit logging cho invite action

**File:** `src/app/api/workspace/invite/route.ts`
**Issue:** Theo CLAUDE.md, moi thao tac deu phai co audit trail. Viec invite thanh vien khong duoc ghi log.
**Fix:** Them audit log:
```typescript
import { createAuditLog } from '@/lib/audit';

await createAuditLog({
  actorId: userId,
  workspaceId: activeWorkspaceId,
  action: 'WORKSPACE_MEMBER_INVITED',
  targetId: membership.id,
  targetType: 'WorkspaceMembership',
  metadata: {
    invitedUserId: invitedUser.id,
    invitedEmail: email,
    role: role,
  },
});
```

---

### WR-03: Empty string fallback cho wsId

**File:** `src/app/[locale]/workspace/page.tsx:34`
**Issue:** Su dung empty string lam fallback co the gay loi:
```typescript
const wsId = workspace?.id ?? activeWorkspaceId ?? '';
```
Neu ca hai deu undefined/null, `wsId` se la `''`, va Prisma queries se khong tim thay gi nhung khong throw error.
**Fix:**
```typescript
if (!workspace?.id && !activeWorkspaceId) {
  throw new Error('No workspace available');
}
const wsId = workspace?.id ?? activeWorkspaceId;
```

---

### WR-04: window.location.reload() harsh UX pattern

**File:** `src/components/workspace/WorkspaceBanner.tsx:66`
**Issue:** Sau khi invite thanh cong, dung `window.location.reload()` de refresh page. Day:
- Mat trang thai form neu co loi
- Khong co smooth transition
- Khong tot cho UX
**Fix:**
```typescript
setSuccess(t('inviteSuccess'));
setTimeout(() => {
  handleCloseDialog();
  // Use router.refresh() hoac goi callback de update data
  router.refresh(); // Next.js App Router
}, 1500);
```

---

### WR-05: No authorization check cho invite action

**File:** `src/app/api/workspace/invite/route.ts`
**Issue:** API khong kiem tra xem user hien tai co quyen invite thanh vien khong. Bat ky user nao trong workspace deu co the goi API nay.
**Fix:**
```typescript
// Check if user has permission to invite
const currentMembership = await prisma.workspaceMembership.findFirst({
  where: { workspaceId: activeWorkspaceId, userId },
});

const allowedRoles = ['owner', 'admin', 'coordinator_admin'];
if (!currentMembership || !allowedRoles.includes(currentMembership.role)) {
  return NextResponse.json(
    { error: 'You do not have permission to invite members' },
    { status: 403 }
  );
}
```

---

## Info

### IN-01: Hardcoded arrow character trong Link

**File:** `src/components/workspace/MemberGrid.tsx:87-89`
**Issue:** Arrow character `→` duoc hardcoded thay vi trong i18n:
```typescript
<Link href="#" className="small-link">
  {t('manage')} →
</Link>
```
**Fix:** Them vao translation string:
```typescript
// messages/vi.json
"manage": "Quản lý →"
// messages/en.json  
"manage": "Manage →"
```
Hoac tao key rieng `manageLink: "Quản lý →"`.

---

### IN-02: Placeholder href="#" cho manage link

**File:** `src/components/workspace/MemberGrid.tsx:87`
**Issue:** Link den trang quan ly thanh vien nhung dung `#` placeholder.
**Fix:**
```typescript
<Link href={`/${locale}/workspace/members`} className="small-link">
  {t('manage')}
</Link>
```

---

### IN-03: Dead data - lastInviteUpdate luon null

**File:** `src/app/[locale]/workspace/page.tsx:86`
**Issue:** `lastInviteUpdate` luon la `null` vi khong co query nao lay timestamp nay:
```typescript
lastInviteUpdate: null as string | null,
```
**Fix:** Them query hoac bo qua field nay trong ResourceTable neu khong can thiet.

---

### IN-04: Date parsing co the throw

**File:** `src/components/workspace/ResourceTable.tsx:22-29`
**Issue:** `new Date(dateStr)` se throw TypeError neu truyen invalid string:
```typescript
const date = new Date(dateStr);
```
**Fix:**
```typescript
function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '-';
  // ... rest
}
```

---

## Recommendations

1. **Tien hanh fix CR-01 va CR-02 truoc khi release** - Day la i18n compliance issue, anh huong nguoi dung khong noi tieng Anh.

2. **Bo sung rate limiting va audit logging** cho cac API route quan trong (theo security requirements trong CLAUDE.md).

3. **Them authorization checks** cho cac action nhu invite, delete, edit (phan quyen workspace-level).

4. **Tranh dung `window.location`** - Su dung Next.js `router.refresh()` hoac callback pattern.

5. **Them error boundary** cho workspace page de handle Prisma errors gracefully.

---

_Reviewed: 2026-06-13_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
