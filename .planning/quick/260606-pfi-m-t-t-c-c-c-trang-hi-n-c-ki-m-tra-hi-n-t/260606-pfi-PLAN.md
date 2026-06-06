---
quick_id: 260606-pfi
slug: validate-screenshots
mode: quick-full
status: planned
must_haves:
  truths:
    - All currently available app pages/routes are discovered before capture.
    - Each page is opened and validated for visible render correctness before screenshot capture.
    - Screenshots are only saved for pages that pass validation; failures are documented instead of silently captured.
  artifacts:
    - .planning/quick/260606-pfi-m-t-t-c-c-c-trang-hi-n-c-ki-m-tra-hi-n-t/screenshots/
    - .planning/quick/260606-pfi-m-t-t-c-c-c-trang-hi-n-c-ki-m-tra-hi-n-t/260606-pfi-SUMMARY.md
  key_links:
    - package.json
    - .planning/STATE.md
---

# Quick Task 260606-pfi: validate-screenshots

Mở tất cả các trang hiện có, kiểm tra hiển thị đã đúng chưa, thực hiện chụp tất cả các màn hình sau khi đã validate hiển thị đúng. Không chụp các trang đang lỗi như lần trước.

## Assumptions

- “Tất cả các trang hiện có” nghĩa là các route/frontend pages có thể truy cập trong app hiện tại, không bao gồm API route hoặc tài nguyên tĩnh.
- Nếu trang cần auth/test data, dùng trạng thái local/dev hợp lệ hiện có; nếu không truy cập được thì ghi rõ lý do trong summary.
- Không thay đổi UI trừ khi phát hiện lỗi render ngăn trang hiển thị đúng và có thể sửa tối thiểu.

## Tasks

### 1. Discover app routes and launch target

- files:
  - package.json
  - app/** hoặc src/** route files
  - .planning/STATE.md
- action:
  - Xác định framework/app entrypoint và danh sách route/page hiện có.
  - Khởi chạy app local bằng script phù hợp.
- verify:
  - Có danh sách route cần validate.
  - App chạy được và browser có thể truy cập local URL.
- done:
  - Route inventory sẵn sàng cho bước validate/capture.

### 2. Validate each page before capture

- files:
  - route/page files liên quan nếu cần sửa lỗi render tối thiểu
  - browser/dev-server logs
- action:
  - Mở từng route bằng browser automation.
  - Kiểm tra visible errors: blank page, Next/runtime error overlay, hydration/runtime exception, console/page error nghiêm trọng, layout vỡ rõ ràng.
  - Nếu phát hiện lỗi render có thể sửa tối thiểu, sửa và chạy lại trang.
  - Nếu không thể sửa trong phạm vi quick task, ghi failed route và không lưu screenshot đạt chuẩn cho route đó.
- verify:
  - Mỗi route có trạng thái PASS hoặc FAIL kèm lý do.
  - Không có screenshot được lưu cho route FAIL như thể đã pass.
- done:
  - Chỉ các route PASS được chuyển sang chụp screenshot.

### 3. Capture screenshots and summarize evidence

- files:
  - .planning/quick/260606-pfi-m-t-t-c-c-c-trang-hi-n-c-ki-m-tra-hi-n-t/screenshots/
  - .planning/quick/260606-pfi-m-t-t-c-c-c-trang-hi-n-c-ki-m-tra-hi-n-t/260606-pfi-SUMMARY.md
- action:
  - Chụp screenshot cho từng route PASS vào thư mục screenshots.
  - Tạo summary liệt kê route, kết quả validate, screenshot path, lỗi còn lại nếu có.
- verify:
  - Screenshot files tồn tại cho tất cả route PASS.
  - Summary phân biệt rõ PASS/FAIL và nêu rằng ảnh chỉ được chụp sau validate.
- done:
  - Artifact screenshots + summary hoàn chỉnh.
