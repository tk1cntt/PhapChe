---
phase: 02-intake
reviewed: 2026-05-28T00:00:00Z
depth: standard
files_reviewed: 13
files_reviewed_list:
  - prisma/schema.prisma
  - prisma/seed.ts
  - src/app/intake/actions.test.ts
  - src/app/intake/actions.ts
  - src/app/intake/components.tsx
  - src/app/intake/page.tsx
  - src/app/requests/[requestId]/page.tsx
  - src/lib/audit/audit.ts
  - src/lib/intake/catalog.ts
  - src/lib/intake/intake-service.ts
  - src/lib/intake/intake.test.ts
  - src/lib/intake/upload-service.test.ts
  - src/lib/intake/upload-service.ts
findings:
  critical: 1
  warning: 2
  info: 1
  total: 4
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-05-28T00:00:00Z
**Depth:** standard
**Files Reviewed:** 13
**Status:** issues_found

## Summary

Đã review luồng intake, lưu câu trả lời, upload metadata file riêng tư, audit và trang trạng thái request. Vấn đề chính: server actions và trang status dùng session demo hard-code thay vì session người dùng thật; upload service chưa chuẩn hóa filename trước khi nhúng vào storage key; submit unsupported tạo hai transition trạng thái không nhất quán.

## Critical Issues

### CR-01: Server actions and request page use hard-coded demo session

**File:** `src/app/intake/actions.ts:7-11`, `src/app/requests/[requestId]/page.tsx:7-11`
**Issue:** Server actions và trang status bỏ qua session thật, luôn chạy với `demo-customer` / `demo-workspace`. Trong môi trường có dữ liệu thật, mọi thao tác intake được ghi nhận dưới cùng actor/workspace demo, RBAC không phản ánh người dùng đang đăng nhập, audit trail sai và khách hàng thật không thể/hoặc có thể thao tác sai tenant tùy dữ liệu demo tồn tại. Đây là authentication/authorization gap trên dữ liệu hồ sơ pháp lý nhạy cảm.
**Fix:** Lấy session từ cơ chế auth server-side hiện có, rồi truyền vào service. Không hard-code user/workspace trong server action hoặc page.
```ts
import { requireAppSession } from '@/lib/security/session';

export async function createIntakeDraftAction(formData: FormData) {
  const session = await requireAppSession();
  return createDraftIntake({
    session,
    matterTypeKey: stringValue(formData, 'matterTypeKey'),
    correlationId: correlationId(),
  });
}
```

## Warnings

### WR-01: Filename is embedded in private storage key without sanitization

**File:** `src/lib/intake/upload-service.ts:33-42`
**Issue:** `filename` chỉ được `trim()` rồi ghép trực tiếp vào `storageKey`. Tên file chứa `/`, `\\`, `..`, ký tự điều khiển hoặc chuỗi rất dài có thể tạo object key gây nhầm path, phá convention `private/intake/{workspace}/{request}/...`, làm khó audit/lifecycle policy hoặc làm UI/log xử lý sai filename.
**Fix:** Tách display filename khỏi storage key, hoặc sanitize basename trước khi tạo key.
```ts
const filename = input.file.name.trim();
if (!filename) throw new Error('FILE_NAME_REQUIRED');
const safeFilename = filename
  .replace(/[\\/\0-\x1f\x7f]+/g, '-')
  .replace(/\.\.+/g, '.')
  .slice(0, 180);

storageKey: `private/intake/${request.workspaceId}/${request.id}/${randomUUID()}-${safeFilename}`,
```

### WR-02: Unsupported intake can leave submitted request when triage assignment fails

**File:** `src/lib/intake/intake-service.ts:188-230`
**Issue:** `submitIntake` first transitions request to `intake_submitted`, then updates `submittedAt`, then looks for coordinator and may throw `COORDINATOR_REQUIRED_FOR_TRIAGE`. If coordinator missing, request remains `intake_submitted` although unsupported intake requires triage. Caller sees failure but persisted state changed, causing retry/state inconsistency and broken workflow integrity.
**Fix:** Validate coordinator before first transition, or wrap intended state changes in one transaction/state-machine operation.
```ts
let coordinator: { userId: string } | null = null;
if (submission.matterTypeKey === 'unsupported') {
  coordinator = await prisma.workspaceMembership.findFirst({
    where: { workspaceId: submission.request.workspaceId, role: 'coordinator_admin', isActive: true, user: { isActive: true } },
    select: { userId: true },
  });
  if (!coordinator) throw new Error('COORDINATOR_REQUIRED_FOR_TRIAGE');
}

await transitionRequestStatus({ ...input, toStatus: 'intake_submitted', reason: 'intake submitted' });
```

## Info

### IN-01: Intake page submits hard-coded demo request id

**File:** `src/app/intake/page.tsx:38-48`
**Issue:** Forms for answers, uploads, and submit use `requestId="demo-request"` instead of request id returned by draft creation. This makes page unusable outside seeded demo data and masks real flow integration bugs.
**Fix:** Persist draft id in route/search params/server state after draft creation, then render later forms with actual request id.

---

_Reviewed: 2026-05-28T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
