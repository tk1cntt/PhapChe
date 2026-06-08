---
quick_id: 260608-ufb
slug: fix-draft-intake-edit-delete-and-pdf-upl
type: quick
status: in-progress
---

# Quick Task: Fix draft intake edit/delete and PDF upload 500 error

## Bugs

1. **Request "Đang nhập thông tin"/"Nháp tiếp nhận" không sửa được** — Khi user submit form câu trả lời trên step 1, `saveIntakeAnswersAction` gọi `transitionRequestStatus` (wrong call) hoặc không có transition nào cho draft status. Request vẫn giữ status `draft_intake`. User không thể edit.

2. **Request "Đang nhập thông tin"/"Nháp tiếp nhận" không xóa được** — Không có action/API endpoint để xóa draft request. User bị stuck với draft không muốn giữ.

3. **Upload file PDF bị lỗi 500** — `attachIntakeFile` → `storeVaultFile` gọi S3/OSS upload nhưng không có storage config (S3 credentials, bucket, endpoint). Request upload thất bại ở bước lưu file → trả 500.

## Fix

### Bug 1 & 2: Draft intake không có edit/delete

Root cause: `saveIntakeAnswersAction` chỉ lưu answers, không chuyển request sang `intake_submitted`. Submit chỉ xảy ra ở step 3 (`submitIntakeAction`). Draft request không có hành động edit hay delete — user phải hoàn tất submit hoặc admin mới xóa được.

**Fix 1:** Thêm `deleteDraftIntakeAction` trong `src/app/intake/actions.ts` cho phép user xóa draft request của chính mình (chỉ khi status còn là `draft_intake`).

**Fix 2:** User đã submit rồi nên muốn sửa thì phải quay lại step 1 (URL có `requestId` và `step=1`). Không cần thêm transition.

### Bug 3: PDF upload 500

Root cause: `storeVaultFile` không implement upload thực sự — nó chỉ lưu metadata vào DB nhưng không upload file lên S3/OSS. Storage config không tồn tại.

**Fix:** Sửa `attachIntakeFile` trong `src/lib/intake/upload-service.ts` để validate file, lưu metadata DB mà KHÔNG gọi `storeVaultFile` (vì `storeVaultFile` không tồn tại storage thực). Thay vào đó, validate và lưu `VaultFile` record trực tiếp với `fileKind: 'intake_upload'` và mock storageKey (vì chưa có S3). Đánh dấu upload là "pending" nếu không có S3.

## Tasks

<task id="1" files="src/app/intake/actions.ts,src/lib/intake/upload-service.ts" action="
1. Thêm `deleteDraftIntakeAction` vào `src/app/intake/actions.ts`:
   - Import `requireAppSession`, `canAccessRequest` từ rbac
   - Kiểm tra requestId có tồn tại và status === 'draft_intake' và `createdById === session.userId`
   - Nếu không phải draft hoặc không phải của user → throw 'FORBIDDEN'
   - Xóa `LegalRequest` (cascade xóa IntakeSubmission, VaultFiles)
   - Redirect về `/intake`

2. Sửa `src/lib/intake/upload-service.ts`:
   - Bọc `attachIntakeFile` trong try/catch
   - Khi lỗi (ví dụ không có S3), throw lỗi cụ thể 'UPLOAD_STORAGE_NOT_CONFIGURED'
   - Không throw generic Error

3. Thêm error handling ở `src/app/intake/api/attach-file/route.ts`:
   - Catch 'UPLOAD_STORAGE_NOT_CONFIGURED' → trả 503 Service Unavailable với message rõ ràng
" done="no">
<read_first>
- src/app/intake/actions.ts
- src/lib/intake/upload-service.ts
- src/app/intake/api/attach-file/route.ts
</read_first>
</task>

