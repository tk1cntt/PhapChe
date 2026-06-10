---
quick_id: 260610-axj
slug: test-e2e-admin-dashboard
description: "test e2e 6 tính năng ở admin dashboard. Kiểm tra dữ liệu hiển thị đúng hay chưa. Bổ sung thêm data test. Chụp ảnh từng màn hình kết quả"
status: in-progress
date: "2026-06-10"
must_haves:
  - truth: "Dev server running with SQLite database seeded"
    artifacts:
      - "prisma/seed.ts"
    key_links:
      - "src/app/[locale]/admin/audit/page.tsx"
      - "src/app/[locale]/admin/workspaces/page.tsx"
      - "src/app/[locale]/admin/requests/page.tsx"
      - "src/app/[locale]/admin/users/page.tsx"
      - "src/app/[locale]/admin/vault/page.tsx"
      - "src/app/[locale]/admin/templates/page.tsx"
  - truth: "E2E tests created for 6 admin features with data validation"
    artifacts:
      - "e2e/admin-dashboard.spec.ts"
    key_links: []
  - truth: "Screenshot evidence of each admin screen"
    artifacts:
      - "e2e/screenshots/admin-dashboard/"
    key_links: []
---

# Plan: Test E2E 6 Tính Năng Admin Dashboard

## Task 1: Kiểm tra trạng thái dev server và database

**Action:**
1. Kiểm tra dev server có đang chạy không (`curl localhost:3000`)
2. Kiểm tra database SQLite đã được seed chưa
3. Nếu chưa seed, chạy seed script

**Verify:** Dev server trả về HTTP 200, database có data

**Files:** prisma/seed.ts, prisma/schema.prisma

---

## Task 2: Bổ sung test data nếu cần

**Action:**
1. Kiểm tra xem database đã có đủ data test chưa:
   - Workspaces (ít nhất 2)
   - Requests (ít nhất 3 với various statuses)
   - Users (admin, specialist, reviewer)
   - Templates (ít nhất 2)
   - Documents/Vault items (ít nhất 2)
2. Bổ sung seed data nếu thiếu

**Verify:** Tất cả các bảng có data test hợp lệ

**Files:** prisma/seed.ts

---

## Task 3: Viết E2E tests cho 6 tính năng admin

**Action:**
Tạo file `e2e/admin-dashboard.spec.ts` với tests cho:
1. **Workspaces** - `/[locale]/admin/workspaces` - Kiểm tra table hiển thị đúng
2. **Requests** - `/[locale]/admin/requests` - Kiểm tra table với status filter
3. **Users** - `/[locale]/admin/users` - Kiểm tra user list
4. **Vault** - `/[locale]/admin/vault` - Kiểm tra document list
5. **Templates** - `/[locale]/admin/templates` - Kiểm tra template list
6. **Audit** - `/[locale]/admin/audit` - Kiểm tra audit log

**Verify:** Tests chạy pass, data hiển thị đúng

**Files:** e2e/admin-dashboard.spec.ts

---

## Task 4: Chụp ảnh từng màn hình kết quả

**Action:**
1. Thêm screenshot capture vào tests
2. Chạy tests và lưu screenshots vào `e2e/screenshots/admin-dashboard/`
3. Đặt tên file theo format: `{feature}-{locale}-{timestamp}.png`

**Verify:** Screenshots được tạo cho mỗi feature

**Files:** e2e/screenshots/admin-dashboard/
