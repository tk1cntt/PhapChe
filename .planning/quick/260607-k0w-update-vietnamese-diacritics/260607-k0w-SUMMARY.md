---
quick_id: "260607-k0w"
status: complete
---

# Quick Task: Update Vietnamese Diacritics

## Objective
Update all Vietnamese text to use proper diacritics (dấu) instead of letters without marks.

## Changes Made

### Auth UI
- `Nguoi dung` → `Người dùng`
- `Nguoi duyet` → `Người duyệt`
- `Dang nhap` → `Đăng nhập`
- `Mat khau` → `Mật khẩu`
- `Email la bat buoc` → `Email là bắt buộc`
- `Email khong hop le` → `Email không hợp lệ`
- `Email hoac mat khau khong dung` → `Email hoặc mật khẩu không đúng`
- `Co loi xay ra, vui long thu lai` → `Có lỗi xảy ra, vui lòng thử lại`

### Role Names
- `Chuyen vien` → `Chuyên viên`

### Queue/Status Terms
- `Hang cho` → `Hàng chờ`
- `Hang cho duyet` → `Hàng chờ duyệt`
- `Hang cho xu ly` → `Hàng chờ xử lý`

### Request Terms
- `Ho so yeu cau` → `Hồ sơ yêu cầu`
- `Yeu cau` → `Yêu cầu`

## Files Modified (11 total)

1. `src/app/admin/layout.tsx` - Navigation labels
2. `src/app/admin/users/AdminUsersTable.tsx` - Role label
3. `src/app/admin/users/UsersPageClient.tsx` - Role label
4. `src/app/reviewer/layout.tsx` - Navigation labels
5. `src/app/reviewer/requests/page.tsx` - Page titles
6. `src/app/reviewer/requests/[requestId]/review/[documentVersionId]/components/review-form.tsx`
7. `src/app/specialist/layout.tsx` - Navigation labels
8. `src/components/auth/SignInForm.tsx` - Login form labels
9. `src/lib/navigation/breadcrumb-labels.ts` - Breadcrumb labels

## Commits
- `a167010` - Initial diacritics fixes
- `b082d26` - Complete SignInForm Vietnamese text

## Verification
All UI text now displays proper Vietnamese diacritics.
