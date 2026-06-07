---
quick_id: 260606-udu
type: quick
mode: quick-full
status: in_progress
created: 2026-06-06
---

## Verify All Screens with Screenshot Evidence

Xác minh tất cả 14 route đã sửa trong Phase 16 bằng screenshot thực tế. Mỗi screenshot phải xác nhận:

1. URL đúng (route đã đăng nhập → redirect đúng)
2. Nội dung trang hiển thị đúng (heading, UI elements, không phải blank/error)
3. Không phải màn hình login (trừ khi route là `/sign-in`)

### Must-Haves

- **14 screenshots** trong `.planning/quick/260606-udu-verify-all-screens-with-screenshot-evide/screenshots/`
- Mỗi screenshot đặt tên theo format: `{group}-{route-slug}.png`
- File `validation-results.json` ghi nhận mỗi route: `{route, status, screenshot, content_verified}`
- Build phải pass (`npm run build`) trước khi screenshot

### Verification Criteria

| Route | Nội dung cần thấy | Role |
|-------|-------------------|------|
| `/admin/ops` | "Điều phối & Giám sát" heading | admin |
| `/admin/ops/[requestId]` | Timeline với audit events | admin |
| `/admin/routing` | "Điều phối yêu cầu pháp lý" heading | admin |
| `/admin/templates` | "Quản lý mẫu tài liệu" heading | admin |
| `/admin/templates/[templateId]` | Detail view với template content | admin |
| `/admin/templates/new` | "Tạo mẫu tài liệu mới" form | admin |
| `/admin/users` | "Quản lý người dùng" heading | admin |
| `/admin/vault` | "Phân loại vault" heading | admin |
| `/specialist/requests` | Bảng yêu cầu specialist | specialist |
| `/reviewer/requests` | Bảng yêu cầu reviewer | reviewer |
| `/customer/requests/[requestId]` | Trạng thái request + documents | customer |
| `/requests/[requestId]` | Trạng thái + thông tin hồ sơ | customer |
| `/reviewer/requests/[requestId]/review/[documentVersionId]` | Review form + document content | reviewer |
| `/specialist/requests/[requestId]` | Chi tiết yêu cầu specialist | specialist |

### Files

- `validate-and-capture.cjs` - Node.js validation + screenshot harness
- `screenshots/` - Thư mục chứa ảnh chụp
- `validation-results.json` - Kết quả validation

### Action

1. Viết `validate-and-capture.cjs` dùng Puppeteer/Playwright hoặc cách khác để:
   - Khởi động dev server (hoặc dùng existing)
   - Đăng nhập với role phù hợp
   - Navigate đến từng route
   - Chờ page load hoàn chỉnh (networkidle)
   - Kiểm tra nội dung trang (không chỉ HTTP 200)
   - Chụp screenshot
   - Lưu kết quả vào validation-results.json
2. Chạy validation
3. Kiểm tra từng screenshot đảm bảo nội dung đúng
4. Cập nhật validation-results.json với content_verified field
5. Ghi nhận routes không thể verify (DB down, missing fixtures) vào results

### Done

Khi `validation-results.json` có 14 entries với screenshot paths, mỗi entry có `content_verified: true` hoặc `content_verified: false` kèm lý do cụ thể.
