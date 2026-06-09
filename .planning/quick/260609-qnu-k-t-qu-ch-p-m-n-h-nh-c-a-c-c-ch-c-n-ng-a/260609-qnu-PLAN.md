---
phase: quick-260609-qnu
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - e2e/all-screens-i18n-screenshots.spec.ts
autonomous: true
requirements: []

must_haves:
  truths:
    - "Admin screens (users, requests, ops, routing, templates, vault, audit, workspaces) chụp màn hình thành công với tất cả 4 locale"
    - "Specialist screens chụp màn hình thành công với tất cả 4 locale"
    - "Reviewer screens chụp màn hình thành công với tất cả 4 locale"
    - "Tất cả public screens (home, sign-in, intake) vẫn chụp màn hình thành công"
    - "Tất cả customer screens vẫn chụp màn hình thành công"
  artifacts:
    - path: "e2e/all-screens-i18n-screenshots.spec.ts"
      provides: "Fix localized flag cho admin/specialist/reviewer screens"
  key_links:
    - from: "localizedPath() function"
      to: "ROLE_SCREENS.screen.localized field"
      via: "localized flag quyết định có thêm locale prefix hay không"
      pattern: "localized: false"
    - from: "localizedPath() return value"
      to: "page.goto()"
      via: "URL sinh ra phải khớp với cấu trúc route Next.js"
      pattern: "/admin/users|/specialist/requests|/reviewer/requests"
---

<objective>
Sửa lỗi tất cả màn hình admin/specialist/reviewer bị 404 khi chụp screenshot i18n.
Nguyên nhân: các screen này có `localized: true` khiến `localizedPath()` thêm locale prefix (`/en/admin/users`) trong khi route thực tế nằm ngoài `[locale]` directory (`/admin/users`).

Purpose: Khôi phục khả năng chụp màn hình toàn bộ ứng dụng.
Output: Tất cả screen chụp màn hình thành công với 4 locale.
</objective>

<execution_context>
@.claude/get-shit-done/workflows/execute-plan.md
@.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@e2e/all-screens-i18n-screenshots.spec.ts

<interfaces>
## Root cause: localized flag conflict with route structure

Next.js route structure:
```
src/app/[locale]/customer/  → /en/customer ✓ (có locale prefix)
src/app/[locale]/intake/    → /en/intake ✓ (có locale prefix)
src/app/admin/              → /admin/users ✓ (KHÔNG có locale prefix)
src/app/specialist/         → /specialist/requests ✓ (KHÔNG có locale prefix)
src/app/reviewer/           → /reviewer/requests ✓ (KHÔNG có locale prefix)
```

localizedPath() function:
```ts
function localizedPath(screen: Screen, locale: Locale) {
  if (!screen.localized) return screen.path;           // localized=false → path gốc
  if (screen.path === '/') return `/${locale}`;
  return `/${locale}${screen.path}`;                   // localized=true → /en + /admin/users = /en/admin/users → 404!
}
```

**Fix:** Đổi `localized: true` → `localized: false` cho tất cả screen có page nằm NGOÀI `src/app/[locale]/`:
- Tất cả admin screens (8 screens)
- Specialist screen (1 screen)
- Reviewer screen (1 screen)

**Giữ nguyên `localized: true` cho:**
- PUBLIC_SCREENS: home (`/`), intake (`/intake` — vì `[locale]/intake/` tồn tại)
- PUBLIC_SCREENS: sign-in (`/sign-in` — đã có `localized: false`)
- Customer screens: `/customer`, `/customer/requests` (vì `[locale]/customer/` tồn tại)
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Sửa localized flag cho admin, specialist, reviewer screens</name>
  <files>e2e/all-screens-i18n-screenshots.spec.ts</files>
  <action>
Trong `e2e/all-screens-i18n-screenshots.spec.ts`, sửa `localized: true` → `localized: false` cho tất cả screen trong ROLE_SCREENS có route nằm ngoài `[locale]`:

**ROLE_SCREENS.admin** (tất cả 8 screens):
```
{ name: 'admin-users', path: '/admin/users', localized: false },
{ name: 'admin-requests', path: '/admin/requests', localized: false },
{ name: 'admin-ops', path: '/admin/ops', localized: false },
{ name: 'admin-routing', path: '/admin/routing', localized: false },
{ name: 'admin-templates', path: '/admin/templates', localized: false },
{ name: 'admin-vault', path: '/admin/vault', localized: false },
{ name: 'admin-audit', path: '/admin/audit', localized: false },
{ name: 'admin-workspaces', path: '/admin/workspaces', localized: false },
```

**ROLE_SCREENS.specialist** (1 screen):
```
{ name: 'specialist-requests', path: '/specialist/requests', localized: false },
```

**ROLE_SCREENS.reviewer** (1 screen):
```
{ name: 'reviewer-requests', path: '/reviewer/requests', localized: false },
```

**Không sửa** PUBLIC_SCREENS và ROLE_SCREENS.customer — các screen này có route nằm trong `[locale]` directory và đang hoạt động đúng.
</action>
  <verify>
    <automated>grep -c "localized: true" e2e/all-screens-i18n-screenshots.spec.ts | awk '{if ($1 == 4) print "PASS: Only 4 localized:true remaining (home, intake, customer-dashboard, customer-requests)"; else print "FAIL: Expected 4, got "$1}'</automated>
  </verify>
  <done>Chỉ còn 4 screen có localized: true (home, intake, customer-dashboard, customer-requests). Tất cả admin/specialist/reviewer screens đã đổi sang localized: false.</done>
</task>

<task type="auto">
  <name>Task 2: Chạy e2e test và xác nhận tất cả màn hình chụp được</name>
  <files>e2e/all-screens-i18n-screenshots.spec.ts</files>
  <action>
Chạy e2e test với 1 locale để xác nhận fix hoạt động:

```
npx playwright test e2e/all-screens-i18n-screenshots.spec.ts --reporter=list 2>&1 | Select-String "failed|captured|PASS|FAIL"
```

Nếu có bất kỳ screen nào vẫn failed, kiểm tra URL thực tế được generate và điều chỉnh thêm.

Sau khi xác nhận fix hoạt động, chạy full test với tất cả locale để tạo lại toàn bộ ảnh:

```
npx playwright test e2e/all-screens-i18n-screenshots.spec.ts
```

Không dùng taskkill để dừng process. Để test chạy tự nhiên.
</action>
  <verify>
    <automated>npx playwright test e2e/all-screens-i18n-screenshots.spec.ts --reporter=list 2>&1</automated>
  </verify>
  <done>Tất cả test cases pass. Không còn screen nào bị failed. Tất cả màn hình admin/specialist/reviewer đã chụp được ảnh với 4 locale.</done>
</task>

</tasks>

<verification>
Chạy `npx playwright test e2e/all-screens-i18n-screenshots.spec.ts` và xác nhận:
- Không có test failed (không còn 404)
- Tất cả screen đều có status "captured"
- Ảnh được tạo trong `.planning/quick/260609-apr-e2e-all-screenshots/screenshots/` cho từng locale
</verification>

<success_criteria>
- Tất cả admin screens (8 screens x 4 locale = 32 ảnh) chụp thành công
- Specialist screen (1 screen x 4 locale = 4 ảnh) chụp thành công
- Reviewer screen (1 screen x 4 locale = 4 ảnh) chụp thành công
- Public screens và customer screens vẫn hoạt động bình thường
- Toàn bộ test suite pass, không có failed screens
</success_criteria>

<output>
Sau khi hoàn thành, tạo `.planning/quick/260609-qnu-k-t-qu-ch-p-m-n-h-nh-c-a-c-c-ch-c-n-ng-a/260609-qnu-SUMMARY.md`
</output>
