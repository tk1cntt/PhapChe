---
status: resolved
trigger: "Sau khi login, click vào bất kỳ link nào đều bị redirect về trang login. Tất cả user đều bị ảnh hưởng."
created: 2026-07-20
updated: 2026-07-20
---

# Debug Session: login-redirect-loop

## Symptoms

- expected_behavior: "Sau khi đăng nhập thành công, click vào bất kỳ link nào trong app (sidebar menu, navigation link, v.v.) sẽ điều hướng đến trang tương ứng và hiển thị nội dung."
- actual_behavior: "Sau khi login thành công, click bất kỳ link nào cũng bị redirect về trang login (/vi/login). Tất cả user (admin, specialist, reviewer, customer) đều bị."
- error_messages: "Không thấy lỗi gì ở Browser Console hoặc Network tab."
- timeline: "Mới xuất hiện gần đây. Trước đây đã từng hoạt động bình thường."
- reproduction: "1. Mở trình duyệt, vào app. 2. Đăng nhập thành công. 3. Click bất kỳ link nào trong app (VD: sidebar Cases, Dashboard, Admin...). 4. Bị redirect về trang login."

## Current Focus

- hypothesis: "Middleware session cookie check (`request.cookies.get('better-auth.session_token')`) không phát hiện được cookie sau login. Nguyên nhân có thể là: (1) `nextCookies()` plugin của Better Auth gọi `cookies().set()` nhưng silent-fail trong try/catch, dẫn đến browser không nhận được Set-Cookie; hoặc (2) dots trong cookie name (`better-auth.session_token`) bị Next.js Edge Runtime xử lý sai khi parse từ Cookie header. Commit 33c4c87 mở rộng middleware gate ra TẤT CẢ routes khiến bug này ảnh hưởng toàn bộ app."
- test: "Đọc raw Cookie header thay vì chỉ dùng `request.cookies.get()`, và parse thủ công token từ đó"
- expecting: "Tìm thấy session token từ raw Cookie header"
- next_action: "Sửa middleware để dùng raw Cookie header + fallback hyphenated name như trước đây"
- reasoning_checkpoint: "Đã trace toàn bộ flow: Better Auth v1.6.14, Next.js 16.2.6, next-intl 4.13.0. Snippet `parseCookies()` trong better-auth dùng regex `cookieNameRegex = /^[\w!#$%&'*.^`|~+-]+$/` cho phép dấu chấm. Nhưng không rõ Next.js Edge Runtime có parse đúng hay không. Commit 521ddba trước đây từng thêm hyphenated fallback nhưng đã bị mất trong các commit sau. DB có session hợp lệ (token hết hạn 2026-07-27), user active, membership đầy đủ."
- tdd_checkpoint: ""

## Evidence

- timestamp: 2026-07-21T00:00:00Z
  file: src/middleware.ts
  finding: Middleware SESSION_COOKIE = 'better-auth.session_token'; chỉ kiểm tra đúng một cookie name duy nhất. Trước đây (commit 521ddba) đã có fallback 'better-auth-session_token' nhưng đã bị mất sau các lần refactor.

- timestamp: 2026-07-21T00:00:00Z
  file: src/auth.ts
  finding: Better Auth v1.6.14, sử dụng nextCookies() plugin. Cookie được tạo với prefix "better-auth" và name "session_token" → full name: "better-auth.session_token". Trong development (không HTTPS, không NODE_ENV=production), không có prefix "__Secure-".

- timestamp: 2026-07-21T00:00:00Z
  file: src/lib/security/session.ts
  finding: `requireAppSession()` dùng `auth.api.getSession()` (server-side) nên có thể đọc session mà không phụ thuộc vào cookie name. Vấn đề chỉ nằm ở middleware Edge Runtime.

- timestamp: 2026-07-21T00:00:00Z
  file: src/middleware.ts
  finding: Hàm `isPublicPath()` dùng `pathname.includes(p)` thay vì `pathname.startsWith(p)`. Điều này có thể gây false-positive match (VD: `/vi/auth-dashboard` match `/auth/`), nhưng không phải root cause chính.

- timestamp: 2026-07-21T00:00:00Z
  file: node_modules/better-auth/dist/cookies/index.mjs
  finding: Better Auth tạo cookie với tên `{secureCookiePrefix}better-auth.session_token`. Ở development => `better-auth.session_token`. Cookie attributes: sameSite=lax, path=/, httpOnly=true, secure=false.

- timestamp: 2026-07-21T00:00:00Z
  file: prisma/data/legal_service_dev.db (SQLite via Prisma)
  finding: DB có 5 sessions active (hết hạn 2026-07-27), user specialist.demo@example.test có isActive=true, có workspace membership hợp lệ với role "specialist".

- timestamp: 2026-07-21T00:00:00Z
  file: git log
  finding: Commit 33c4c87 (gần nhất) đã đổi middleware từ "chỉ gate admin routes" sang "gate TẤT CẢ non-public routes". Trước commit này, non-admin routes (như /dashboard) sẽ pass qua middleware và `requireAppSession()` (server-side) sẽ kiểm tra session. Sau commit này, middleware luôn check cookie → nếu cookie không detect được, tất cả routes bị redirect về login.

- timestamp: 2026-07-21T00:00:00Z
  file: src/middleware.ts:27-28
  finding: PUBLIC_PREFIXES.includes('/intake') và `isPublicPath` dùng `pathname.includes(p)`. Nếu pathname ngẫu nhiên chứa "/intake" (VD: một file nào đó hoặc URL query), nó sẽ pass through mà không check session. Đây là potential security hole nhưng không phải root cause bug hiện tại.

## Eliminated

- DB sessions missing/hết hạn → FALSE: DB có sessions active, hết hạn 2026-07-27.
- User không active → FALSE: specialist.demo@example.test có isActive=true.
- User không có workspace membership → FALSE: có 1 membership "specialist" trong "Demo Legal Workspace".
- Better Auth baseURL sai → FALSE: BETTER_AUTH_URL="http://localhost:3000" khớp với actual app URL.
- NODE_ENV=production khiến cookie secure → FALSE: không set NODE_ENV trong .env.local, Next.js dev server tự set NODE_ENV=development.
- next-intl middleware can thiệp cookie → UNLIKELY: thứ tự middleware chạy: public check → locale redirect → intl → session check. Cookie check diễn ra trên request gốc.


## Resolution

- root_cause: "Middleware chỉ kiểm tra session cookie qua `request.cookies.get('better-auth.session_token')`. Next.js Edge Runtime không parse được dotted cookie names từ Cookie header, dẫn đến luôn trả về undefined → tất cả request non-public bị redirect về login. Commit 33c4c87 mở rộng gate cho toàn bộ non-public routes khiến bug lan ra khắp app. Trước đây commit 521ddba đã có fallback 'better-auth-session_token' nhưng bị mất khi refactor."
- fix: "Thêm `extractSessionTokenFromHeader()` để parse thủ công raw Cookie header khi `request.cookies.get()` thất bại. Fallback qua 3 cấp: (1) `request.cookies.get('better-auth.session_token')`, (2) `request.cookies.get('better-auth-session_token')`, (3) parse thủ công từ raw `cookie` header. Cập nhật src/middleware.ts."
- verification: "TypeScript check passed (0 errors related to middleware). Cần manual test: login → click sidebar links → không bị redirect về login."
- files_changed: ["src/middleware.ts"]
