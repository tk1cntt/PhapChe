# Finding #8 — POST /admin/users password không được store — FIX KẾT QUẢ

**Task:** t_aea53299 (fix-security)
**Commit:** `944d52ac` (master, 2026-08-29)
**Verdict:** ✅ **ĐÃ FIX + VERIFIED** (16 unit tests pass + E2E trên DB thật)

---

## 1. Fix chính — POST /api/admin/users store password (scrypt)

`src/app/api/admin/users/route.ts` POST handler:

- Khi `password` được truyền → tạo **User + Account credential** trong `prisma.$transaction` (atomic):
  - `accountId = email` (lowercase — đúng convention BetterAuth, khớp seed `prisma/seed.ts`)
  - `providerId = 'credential'`
  - `password = hashPassword(password)` từ `@better-auth/utils/password` (scrypt N=16384 r=16 p=1 dkLen=64, format `saltHex:keyHex`, 161 chars — cùng format hash trong DB)
- Khi **không** có `password` → hành vi cũ giữ nguyên (invite-style, không tạo Account)
- Bỏ `console.warn` cũ; **không log password**
- Email được lowercase+trim (phối hợp t_bd10f516 — case-collision)
- P2002 (race duplicate) → 400 VALIDATION_ERROR (phối hợp t_bd10f516)

## 2. Fix liên quan — PUT /api/settings/password dùng scrypt

`src/app/api/settings/password/route.ts`:

- Thay `bcryptjs` (`compare`/`hash`) → `verifyPassword`/`hashPassword` từ `@better-auth/utils/password` (scrypt)
- Hash mới đúng format BetterAuth → user đổi password xong **login được bằng password mới**
- Hash legacy/malformed (vd bcrypt cũ) → verify throw → xử lý thành `400 Current password is incorrect` (không leak format, không 500)
- Vẫn invalidate toàn bộ session sau khi đổi password

## 3. Verification

### Unit tests (vitest, 16/16 pass)
| Suite | Tests |
|---|---|
| `src/app/api/admin/users/__tests__/route.test.ts` | 9 (5 POST của Finding #8 + 4 GET của t_bd10f516) |
| `src/app/api/settings/password/__tests__/route.test.ts` | 7 |

POST tests cover: tạo User+Account scrypt (hash verify được), omit password → không tạo Account, transaction fail → 500 (atomic), email trùng → 400, non-admin → 403.
Password tests cover: current password sai → 400, new = current → 400, hash mới verify được bằng scrypt, session invalidation, bcrypt-hash bị reject, weak password → 400, không có account → 400.

### E2E trên DB thật (SQLite `prisma/data/legal_service_dev.db`)
1. Tạo user qua logic route-fix (transaction + hashPassword) → `verifyPassword(correct)=true`, `verifyPassword(wrong)=false`
2. Đổi password qua logic route-fix → login password mới `true`, password cũ bị reject
3. Hash mới 161 chars — khớp format 29/29 account credential trong DB (0 bcrypt)
4. Cleanup test user thành công (cascade)

## 4. Ghi chú phối hợp

- File `src/app/api/admin/users/route.ts` là **kết quả merge của 2 task chạy song song**: t_aea53299 (password store) + t_bd10f516 (email normalize + GET lowercase + P2002). Cả 2 phần bổ sung cho nhau, test chung pass 16/16.
- Lưu ý môi trường: vitest không resolve được `next/server` exports map (test cũ `settings/profile` cũng fail) → test mới mock `next/server` tối thiểu (NextResponse/NextRequest).
