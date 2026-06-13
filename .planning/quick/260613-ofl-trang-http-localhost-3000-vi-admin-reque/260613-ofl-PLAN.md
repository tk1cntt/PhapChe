---
phase: quick-260613-ofl-admin-requests-parity
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/admin/AdminRequestsClient.tsx
  - src/components/admin/AdminRequestsTable.tsx
  - src/components/admin/AdminToolbar.tsx
  - src/components/admin/AdminStatGrid.tsx
  - tests/admin-requests/admin-requests-layout.spec.tsx
  - e2e/admin-requests-layout-fix.spec.ts
autonomous: true
requirements:
  - QUICK-260613-OFL
must_haves:
  truths:
    - "Trang /vi/admin/requests có layout, spacing, màu sắc, shadow, card, toolbar, table và floating issue button khớp src/legacy/[locale]/admin/requests/page.tsx và layout/admin-request.html."
    - "Dữ liệu hiển thị trên trang vẫn được fetch từ /api/admin/requests rồi render từ DB/API response, không hardcode row/stat data trong UI."
    - "Khi API lỗi hoặc trả danh sách rỗng, trang vẫn giữ shell layout đúng template và hiển thị trạng thái lỗi/rỗng rõ ràng."
    - "Fix UI có đủ whitebox, blackbox, abnormal, error testcase và e2e testcase theo CLAUDE.md."
  artifacts:
    - path: "src/components/admin/AdminRequestsClient.tsx"
      provides: "Page composition, API fetch, loading/error/empty wiring, stats/toolbar/table/floating issue button"
    - path: "src/components/admin/AdminRequestsTable.tsx"
      provides: "Template-parity 7-column request table rendered from rows"
    - path: "src/components/admin/AdminToolbar.tsx"
      provides: "Template-parity toolbar with search/filter/status/workspace/refresh/export/columns controls"
    - path: "src/components/admin/AdminStatGrid.tsx"
      provides: "Template-parity stat cards with correct request icons and dimensions"
    - path: "tests/admin-requests/admin-requests-layout.spec.tsx"
      provides: "Whitebox, blackbox, abnormal, and error component tests for admin requests layout/style fix"
    - path: "e2e/admin-requests-layout-fix.spec.ts"
      provides: "Playwright e2e regression for /vi/admin/requests layout/style bug fix"
  key_links:
    - from: "src/app/[locale]/admin/requests/page.tsx"
      to: "src/components/admin/AdminRequestsClient.tsx"
      via: "page renders AdminRequestsClient"
      pattern: "<AdminRequestsClient />"
    - from: "src/components/admin/AdminRequestsClient.tsx"
      to: "/api/admin/requests"
      via: "fetch with page/pageSize/search/status/priority/workspace params"
      pattern: "fetch\\(`/api/admin/requests"
    - from: "src/components/admin/AdminRequestsClient.tsx"
      to: "src/components/admin/AdminRequestsTable.tsx"
      via: "passes API-derived rows into AdminRequestsTable"
      pattern: "<AdminRequestsTable rows={requests}"
    - from: "tests/admin-requests/admin-requests-layout.spec.tsx"
      to: "src/components/admin/AdminRequestsClient.tsx"
      via: "mocks fetch and asserts rendered template structure/states"
      pattern: "AdminRequestsClient"
---

<objective>
Cập nhật trang `http://localhost:3000/vi/admin/requests` để phần layout, CSS và style khớp 100% với `src/legacy/[locale]/admin/requests/page.tsx` và mock `layout/admin-request.html`, đồng thời giữ nguyên nguyên tắc dữ liệu lấy từ DB/API thay vì hardcode.

Purpose: Sửa lỗi parity UI của Admin Requests mà người dùng báo, bảo đảm screen hiện tại giống template legacy/mock về header, stats, toolbar, table, pagination và floating issue indicator.
Output: Một quick fix tự-contained gồm cập nhật component Admin Requests và bộ test bắt buộc cho UI layout/style bug fix.
</objective>

<execution_context>
@D:/PhapChe/.claude/gsd-core/workflows/execute-plan.md
@D:/PhapChe/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@D:/PhapChe/CLAUDE.md
@D:/PhapChe/.planning/STATE.md
@D:/PhapChe/src/app/[locale]/admin/requests/page.tsx
@D:/PhapChe/src/components/admin/AdminRequestsClient.tsx
@D:/PhapChe/src/components/admin/AdminRequestsTable.tsx
@D:/PhapChe/src/components/admin/AdminToolbar.tsx
@D:/PhapChe/src/components/admin/AdminStatGrid.tsx
@D:/PhapChe/src/legacy/[locale]/admin/requests/page.tsx
@D:/PhapChe/layout/admin-request.html
@D:/PhapChe/package.json
@D:/PhapChe/e2e/admin-users-fix.spec.ts
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Tạo regression tests cho Admin Requests layout/style parity</name>
  <files>tests/admin-requests/admin-requests-layout.spec.tsx, e2e/admin-requests-layout-fix.spec.ts</files>
  <behavior>
    - Whitebox testcase: render `AdminRequestsClient` với mocked fetch trả API data, assert có 4 stat cards, toolbar-card, table-card 7 cột, row grid template `0.9fr 1.1fr 1.1fr 1fr 1.1fr 1.2fr 1fr`, button tạo hồ sơ màu xanh gradient, floating issue button khi `stats.highPriority > 0`.
    - Blackbox testcase: user thấy tiêu đề `Hồ sơ yêu cầu`, subtitle giống mock, các header bảng `Mã hồ sơ`, `Workspace`, `Khách hàng`, `Trạng thái`, `Loại yêu cầu`, `Phụ trách`, `Thao tác`, và dữ liệu row đến từ mocked `/api/admin/requests`.
    - Abnormal testcase: API trả `data: []`, `stats` hợp lệ, trang vẫn render header/stats/toolbar/table empty state mà không crash và không tự tạo row hardcode.
    - Error testcase: API trả 500/JSON error, trang vẫn giữ shell layout và hiển thị `Lỗi khi tải dữ liệu` cùng nút `Thử lại`.
    - E2E testcase: Playwright vào `/vi/admin/requests`, kiểm tra không có error boundary, có template selectors/text chính, table/toolbar/floating indicator nếu DB seed hiện có trả highPriority, và không thấy lỗi console nghiêm trọng liên quan render layout.
  </behavior>
  <action>Tạo test trước khi sửa UI. Dùng Vitest + Testing Library theo dependency hiện có trong `package.json`; mock `global.fetch`, `next/navigation` `useRouter`, và timers/debounce khi cần. Không mock dữ liệu bằng constant trong production code; test fixture chỉ nằm trong test để chứng minh UI render từ API response. E2E nên theo style `e2e/admin-users-fix.spec.ts`: tập trung regression bug fix, không yêu cầu login thủ công nếu môi trường test đang redirect/auth; vẫn phải assert không có error boundary và body có nội dung đủ để phát hiện layout crash. Bao phủ đủ whitebox, blackbox, abnormal, error, e2e theo CLAUDE.md.</action>
  <verify>
    <automated>npm exec vitest run tests/admin-requests/admin-requests-layout.spec.tsx --coverage</automated>
    <automated>npm exec playwright test e2e/admin-requests-layout-fix.spec.ts</automated>
  </verify>
  <done>Regression tests tồn tại, chạy được, ban đầu phải bắt được ít nhất một khác biệt layout/style hiện tại so với mock trước khi Task 2 hoàn tất; các test không phụ thuộc hardcoded production data.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Căn chỉnh Admin Requests components theo legacy và mock</name>
  <files>src/components/admin/AdminRequestsClient.tsx, src/components/admin/AdminRequestsTable.tsx, src/components/admin/AdminToolbar.tsx, src/components/admin/AdminStatGrid.tsx</files>
  <behavior>
    - Header/page shell khớp mock: margin bottom 22px, h1 31px weight 800 letter spacing -0.8px, subtitle 15px #5f6e83, create button blue gradient #3ba3e7 -> #2389d0 shadow rgba(35,137,208,0.25).
    - Stats khớp mock: grid 4 columns gap 18 margin-bottom 24, card 126px border #dfe7f1 radius 15 shadow soft, icon 62px radius 13; blue icon phải là document/request icon như mock, orange clock, green check circle, red warning triangle.
    - Toolbar khớp mock: `.toolbar-card` white border radius 15 shadow soft padding 20 margin-bottom 20; search width 330px, height 44px; buttons height 44px, gap/padding/font/border giống `layout/admin-request.html`; workspace control luôn hiện như mock khi có workspace list từ API, không phụ thuộc hardcoded workspace.
    - Table khớp mock: `.table-card` white border #dfe7f1 radius 15 shadow `0 18px 42px rgba(15,23,42,0.06)`, 7-column grid, head min-height 54 gradient, rows min-height 68, borders/padding/text colors đúng mock, code icon 38x38 radius 11, customer avatar 34x34, status badge 28px with dot, action link teal.
    - Loading/error/empty states không phá template spacing và không thêm dữ liệu hardcode; floating issue button giữ vị trí fixed right 22 bottom 20, red gradient, yellow border, text từ `stats.highPriority` API.
  </behavior>
  <action>So sánh trực tiếp implementation hiện tại với `src/legacy/[locale]/admin/requests/page.tsx` và CSS/DOM trong `layout/admin-request.html`, rồi chỉnh chỉ các file component Admin Requests cần thiết. Giữ `src/app/[locale]/admin/requests/page.tsx` là wrapper `<AdminRequestsClient />` nếu không cần sửa. Không dùng Ant Table cho screen này nếu nó làm lệch mock; giữ custom grid từ `AdminRequestsTable.tsx`. Không đưa row/stat sample vào production code; toàn bộ `requests`, `stats`, `workspaces` phải tiếp tục đến từ `/api/admin/requests`. Không refactor unrelated admin components ngoài 4 file nêu trên. Nếu phát hiện component dùng chung cho màn khác, chỉ thay đổi theo hướng tương thích hoặc localize style trong Admin Requests component.</action>
  <verify>
    <automated>npm exec vitest run tests/admin-requests/admin-requests-layout.spec.tsx --coverage</automated>
    <automated>npm exec playwright test e2e/admin-requests-layout-fix.spec.ts</automated>
    <automated>npm run typecheck</automated>
  </verify>
  <done>Trang `/vi/admin/requests` render layout/style khớp legacy/mock về header, stats, toolbar, table, pagination/floating issue; tất cả data hiển thị lấy từ API response; không có regression typecheck/test.</done>
</task>

<task type="auto">
  <name>Task 3: Kiểm tra parity cuối cùng và cập nhật quick summary</name>
  <files>.planning/quick/260613-ofl-trang-http-localhost-3000-vi-admin-reque/260613-ofl-SUMMARY.md</files>
  <action>Chạy lại test tự động, rồi tạo summary theo template execute-plan. Trong summary ghi rõ các nguồn đã đối chiếu: `src/legacy/[locale]/admin/requests/page.tsx` và `layout/admin-request.html`; liệt kê test coverage gồm whitebox, blackbox, abnormal, error và e2e. Không commit nếu không được yêu cầu bởi orchestrator hiện tại; chỉ tạo SUMMARY theo quy ước quick execution.</action>
  <verify>
    <automated>npm exec vitest run tests/admin-requests/admin-requests-layout.spec.tsx --coverage</automated>
    <automated>npm exec playwright test e2e/admin-requests-layout-fix.spec.ts</automated>
    <automated>npm run typecheck</automated>
  </verify>
  <done>`260613-ofl-SUMMARY.md` tồn tại, ghi rõ file đã sửa, test đã chạy, kết quả parity, và còn/không còn vấn đề cần follow-up.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| browser -> /api/admin/requests | Untrusted query params/search/filter từ UI đi vào API; plan này không đổi API nhưng không được bypass backend-owned workflow/status. |
| /api/admin/requests -> AdminRequestsClient | API data render ra UI; phải tránh hardcode production data và không dùng HTML injection. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-260613-OFL-01 | Tampering | AdminRequestsClient filters/search | accept | Plan chỉ sửa layout/style; tiếp tục gửi filter qua URLSearchParams hiện có, không thêm state machine/status mutation ở frontend. |
| T-260613-OFL-02 | Information Disclosure | AdminRequestsTable row rendering | mitigate | Render text qua React interpolation từ API response, không dùng dangerouslySetInnerHTML, không hardcode sensitive sample rows. |
| T-260613-OFL-03 | Denial of Service | AdminRequestsClient fetch/error/loading | mitigate | Giữ error/loading/empty states để API lỗi không làm crash page; retry button gọi lại fetchData hiện có. |
| T-260613-OFL-SC | Tampering | npm installs | accept | Không cài package mới; dùng Vitest/Playwright/Testing Library đã có trong package.json. |
</threat_model>

<verification>
- `npm exec vitest run tests/admin-requests/admin-requests-layout.spec.tsx --coverage`
- `npm exec playwright test e2e/admin-requests-layout-fix.spec.ts`
- `npm run typecheck`
- Manual optional: mở `http://localhost:3000/vi/admin/requests` và so sánh trực quan với `layout/admin-request.html` về spacing, màu, shadow, table grid, toolbar và floating issue button.
</verification>

<success_criteria>
- Trang Admin Requests hiện tại khớp legacy/mock ở các vùng page header, stat cards, toolbar, table, pagination và floating issue indicator.
- Không có production row/stat/workspace data hardcode trong component; dữ liệu lấy từ `/api/admin/requests`.
- Có đủ test whitebox, blackbox, abnormal, error và e2e testcase cho UI layout/style bug fix.
- Typecheck, component tests và e2e regression pass.
</success_criteria>

<output>
Tạo `D:/PhapChe/.planning/quick/260613-ofl-trang-http-localhost-3000-vi-admin-reque/260613-ofl-SUMMARY.md` khi thực thi xong.
</output>
