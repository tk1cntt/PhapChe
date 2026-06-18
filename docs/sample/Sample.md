Đúng, 2 câu hỏi này rất quan trọng. Nhiều người nghe workshop xong dễ hiểu nhầm rằng “cứ nhét thật nhiều data vào DOM là tốt”. **Không phải vậy.** Data contract trong DOM chỉ là một lớp hỗ trợ verification, không thay thế visual testing / CSS/layout review.

Workshop demo việc component publish state như `data-verify-unit`, `total`, `done`, `active` để agent đọc thay vì scrape DOM; sau đó có schema, fixture, invariant, probe để verify. Nhưng chính workshop cũng tách rõ: frontend lệch layout thì nên dùng screenshot/vision, còn DOM contract chủ yếu giúp agent kiểm tra state/logic/interaction. 

---

# 1. Làm sao biết chỗ nào cần gắn data nào?

Nguyên tắc là:

> **Chỉ gắn data cho những gì cần verify ổn định, có ý nghĩa nghiệp vụ hoặc là điểm neo cho automation. Không đưa toàn bộ data vào DOM.**

Bạn nên chia data trong DOM thành 4 loại.

---

## Loại 1: Component identity

Dùng để agent/test biết đang kiểm tra component nào.

Ví dụ:

```html
<section
  data-verify-unit="user-management-page"
  data-contract-version="1"
>
```

Cái này nên có ở các component/màn hình quan trọng:

```text
User Management
Legal Request Dashboard
Document Review
Partner Detail
Organization Activity
User Activity
```

Không cần gắn cho mọi `div`.

---

## Loại 2: Business state tổng hợp

Đây là các số liệu/rule mà UI đang hiển thị và có thể sai.

Ví dụ màn User Management:

```html
<main
  data-verify-unit="user-management"
  data-total-users="25"
  data-active-users="21"
  data-inactive-users="4"
  data-selected-role="specialist"
>
```

Những data nên expose:

```text
totalUsers
activeUsers
inactiveUsers
roleCounts
selectedFilter
currentPage
pageSize
sortBy
sortDirection
```

Vì đây là các giá trị mà agent có thể verify:

```text
activeUsers + inactiveUsers = totalUsers
sum(roleCounts) = totalUsers
row count trên trang <= pageSize
filter role specialist thì mọi row phải là specialist
```

---

## Loại 3: Row/item identity và trạng thái quan trọng

Ví dụ table user:

```html
<tr
  data-row-type="user"
  data-user-id="usr_123"
  data-role="specialist"
  data-status="active"
  data-workspace-count="3"
>
```

Bạn không cần đưa toàn bộ user object vào DOM:

```json
{
  "email": "...",
  "phone": "...",
  "address": "...",
  "createdAt": "...",
  "permissions": [...]
}
```

Chỉ cần đưa những field phục vụ verify hoặc thao tác.

Với hệ thống của bạn, nên gắn:

```text
id
type
status
role
priority
requestId
documentId
version
isActive
isSelected
```

Không nên gắn:

```text
toàn bộ description dài
PII không cần thiết
token
permission raw
nội dung document
thông tin nhạy cảm
```

---

## Loại 4: Action hooks

Dùng để agent/test thao tác UI ổn định mà không phụ thuộc text hoặc CSS class.

Ví dụ:

```html
<button data-action="create-user">Create User</button>
<button data-action="assign-workspace">Assign Workspace</button>
<button data-action="deactivate-user">Deactivate</button>
```

Cái này cực kỳ hữu ích, vì text có thể đổi từ tiếng Anh sang tiếng Việt, class có thể đổi theo CSS, nhưng `data-action` giữ ổn định.

---

# 2. Có nên cho nhiều data hết vào DOM không?

Không.

Bạn nên dùng rule này:

> **DOM contract chỉ nên chứa “public verification state”, không chứa “application database state”.**

Nói cách khác, DOM không phải nơi mirror database.

Ví dụ xấu:

```html
<tr
  data-user='{
    "id":"usr_123",
    "email":"a@b.com",
    "phone":"...",
    "permissions":["..."],
    "workspaceIds":["..."],
    "lastLoginIp":"..."
  }'
>
```

Vấn đề:

```text
DOM phình to
Dễ lộ data nhạy cảm
Khó maintain
Dễ lệch với UI
Agent bị nhiễu vì quá nhiều data
```

Ví dụ tốt hơn:

```html
<tr
  data-row-type="user"
  data-user-id="usr_123"
  data-role="specialist"
  data-status="active"
>
```

Nếu cần state tổng hợp thì để ở root:

```html
<main
  data-verify-unit="user-management"
  data-state='{
    "total": 25,
    "active": 21,
    "inactive": 4,
    "roleCounts": {
      "customer": 10,
      "specialist": 5,
      "reviewer": 4,
      "coordinator_admin": 3,
      "super_admin": 3
    }
  }'
>
```

Nhưng cũng chỉ nên để state đã chọn lọc.

---

# 3. Cách quyết định data nào cần gắn

Bạn đi ngược từ verification question.

Đừng hỏi:

```text
Component này có data gì?
```

Hãy hỏi:

```text
Mình muốn chắc chắn điều gì luôn đúng?
Agent cần đọc gì để kiểm tra điều đó?
Agent cần click/chọn ở đâu?
```

Ví dụ với User Management:

## Câu hỏi cần verify

```text
1. Tổng user hiển thị có đúng không?
2. Filter role có đúng không?
3. User inactive có bị disable action không?
4. User role badge có khớp role thật không?
5. Empty state có hiện khi không có data không?
```

## Data cần gắn

```html
<main
  data-verify-unit="user-management"
  data-total-users="25"
  data-active-users="21"
  data-inactive-users="4"
  data-selected-role="specialist"
>
```

```html
<tr
  data-row-type="user"
  data-user-id="usr_123"
  data-role="specialist"
  data-status="active"
>
```

```html
<button data-action="deactivate-user" data-user-id="usr_123">
```

Chỉ vậy là đủ.

---

# 4. Checklist chọn data contract

Mỗi field muốn đưa vào DOM nên qua checklist này:

```text
[ ] Field này có dùng để verify rule không?
[ ] Field này có giúp agent thao tác ổn định hơn không?
[ ] Field này có phải state mà user đang thấy hoặc ảnh hưởng UI không?
[ ] Field này có an toàn nếu user mở DevTools xem không?
[ ] Field này có ổn định qua nhiều lần đổi layout/CSS không?
```

Nếu câu trả lời là “không” cho phần lớn các câu trên, đừng đưa vào DOM.

---

# 5. Câu hỏi 2: UI chủ yếu là layout và CSS, vậy DOM data có verify hiển thị được không?

Bạn nói đúng.

**Data trong DOM không xác thực được toàn bộ phần hiển thị.**

Nó chỉ verify tốt các thứ này:

```text
State
Logic
Interaction
Routing
Filter
Sorting
Pagination
Empty state
Permission behavior
Business invariant
```

Nhưng nó verify kém hoặc không đủ với:

```text
Layout đẹp hay xấu
Spacing có lệch không
Button có đúng màu không
Text có bị tràn không
Card có bị vỡ grid không
Responsive có ổn không
Visual hierarchy có tốt không
```

Vì vậy cần tách thành 2 lớp verification.

---

# 6. Lớp A — DOM contract verification

Dùng cho “cái gì đúng về mặt logic”.

Ví dụ:

```text
Filter role specialist thì tất cả row có data-role="specialist"
Total = active + inactive
Click deactivate thì status đổi sang inactive
Completed request không còn action assign
User không có quyền thì không thấy nút delete
```

Test bằng DOM contract:

```js
const root = page.locator('[data-verify-unit="user-management"]');

const total = Number(await root.getAttribute("data-total-users"));
const active = Number(await root.getAttribute("data-active-users"));
const inactive = Number(await root.getAttribute("data-inactive-users"));

expect(total).toBe(active + inactive);
```

---

# 7. Lớp B — Visual/layout verification

Dùng cho “cái gì đúng về mặt nhìn”.

Có 4 cách làm.

---

## Cách 1: Screenshot comparison

Dùng Playwright screenshot:

```ts
await expect(page).toHaveScreenshot("user-management-desktop.png", {
  fullPage: true,
});
```

Hoặc từng component:

```ts
await expect(
  page.locator('[data-verify-unit="user-management"]')
).toHaveScreenshot("user-management-card.png");
```

Cách này bắt được:

```text
layout lệch
spacing đổi
font size đổi
button sai vị trí
card bị vỡ
màu khác
```

Nhưng có nhược điểm là dễ flaky nếu font/rendering khác môi trường.

---

## Cách 2: Visual probes bằng bounding box

Dùng Playwright đo vị trí/kích thước.

Ví dụ kiểm tra sidebar nằm bên trái, content nằm bên phải:

```ts
const sidebar = await page.locator('[data-region="sidebar"]').boundingBox();
const content = await page.locator('[data-region="main-content"]').boundingBox();

expect(sidebar.x).toBeLessThan(content.x);
expect(sidebar.width).toBeGreaterThan(160);
expect(content.width).toBeGreaterThan(800);
```

Kiểm tra table không tràn ngang:

```ts
const table = await page.locator('[data-table="users"]').boundingBox();
const viewport = page.viewportSize();

expect(table.width).toBeLessThanOrEqual(viewport.width);
```

Kiểm tra button chính nằm góc phải:

```ts
const header = await page.locator('[data-region="page-header"]').boundingBox();
const button = await page.locator('[data-action="create-user"]').boundingBox();

expect(button.x).toBeGreaterThan(header.x + header.width / 2);
```

Cách này không kiểm tra “đẹp”, nhưng kiểm tra layout rule khá tốt.

---

## Cách 3: Accessibility snapshot

Nhiều lỗi UI không chỉ là CSS mà là cấu trúc semantic.

Ví dụ:

```ts
await expect(page.getByRole("heading", { name: "User Management" })).toBeVisible();
await expect(page.getByRole("button", { name: "Create User" })).toBeVisible();
await expect(page.getByRole("table")).toBeVisible();
```

Cái này giúp verify:

```text
heading đúng
button có accessible name
table có role đúng
form label đúng
screen reader đọc được
```

---

## Cách 4: AI/Vision review bằng screenshot

Đây là ý trong workshop: với frontend, nhiều lỗi rất khó diễn tả bằng chữ, nên screenshot giúp Claude/vision model phát hiện tốt hơn. Workshop khuyến nghị dùng screenshot để feedback khi làm frontend, vì các vấn đề kiểu lệch nhẹ/misalignment thường khó mô tả bằng text. 

Bạn có thể dùng prompt kiểu:

```text
Đây là screenshot của trang User Management.
Hãy kiểm tra:
1. Layout có giống spec không?
2. Có chỗ nào lệch spacing/grid không?
3. Có text nào tràn không?
4. Visual hierarchy có rõ không?
5. Empty state có nằm đúng giữa không?
6. Button chính có đủ nổi bật không?
Trả về danh sách lỗi theo mức độ nghiêm trọng.
```

---

# 8. Vậy data contract và visual test nên phối hợp thế nào?

Cách đúng là:

```text
DOM contract = kiểm logic/state/action
Screenshot/visual = kiểm layout/CSS/presentation
Accessibility = kiểm semantic/usable
```

Không nên bắt DOM contract làm hết.

Ví dụ một màn User Management nên có verification như sau:

| Cần kiểm                        | Cách kiểm                  |
| ------------------------------- | -------------------------- |
| Tổng user đúng                  | DOM contract               |
| Role count đúng                 | DOM contract               |
| Filter đúng                     | DOM contract + probe       |
| Click create mở modal           | Probe                      |
| Button có hiện đúng quyền       | DOM contract/probe         |
| Layout sidebar/content đúng     | Bounding box               |
| UI giống design                 | Screenshot comparison      |
| Mobile responsive không vỡ      | Screenshot viewport mobile |
| Heading/button/table accessible | Accessibility query        |

---

# 9. Ví dụ verification đầy đủ cho một UI

Giả sử trang User Management.

## HTML/React gắn contract tối thiểu

```html
<main
  data-verify-unit="user-management"
  data-contract-version="1"
  data-total-users="3"
  data-active-users="2"
  data-inactive-users="1"
  data-selected-role="all"
>
  <aside data-region="sidebar"></aside>

  <section data-region="main-content">
    <header data-region="page-header">
      <h1>User Management</h1>
      <button data-action="create-user">Create User</button>
    </header>

    <table data-table="users">
      <tr
        data-row-type="user"
        data-user-id="usr_1"
        data-role="customer"
        data-status="active"
      ></tr>

      <tr
        data-row-type="user"
        data-user-id="usr_2"
        data-role="specialist"
        data-status="active"
      ></tr>

      <tr
        data-row-type="user"
        data-user-id="usr_3"
        data-role="reviewer"
        data-status="inactive"
      ></tr>
    </table>
  </section>
</main>
```

## DOM verification

```ts
test("user totals are consistent", async ({ page }) => {
  await page.goto("/admin/users");

  const root = page.locator('[data-verify-unit="user-management"]');

  const total = Number(await root.getAttribute("data-total-users"));
  const active = Number(await root.getAttribute("data-active-users"));
  const inactive = Number(await root.getAttribute("data-inactive-users"));

  expect(total).toBe(active + inactive);

  const rowCount = await page.locator('[data-row-type="user"]').count();
  expect(rowCount).toBe(total);
});
```

## Layout verification bằng bounding box

```ts
test("sidebar and main layout are positioned correctly", async ({ page }) => {
  await page.goto("/admin/users");

  const sidebar = await page.locator('[data-region="sidebar"]').boundingBox();
  const main = await page.locator('[data-region="main-content"]').boundingBox();

  expect(sidebar).not.toBeNull();
  expect(main).not.toBeNull();

  expect(sidebar!.x).toBeLessThan(main!.x);
  expect(sidebar!.width).toBeGreaterThanOrEqual(160);
});
```

## Screenshot verification

```ts
test("user management visual snapshot", async ({ page }) => {
  await page.goto("/admin/users");

  await expect(page).toHaveScreenshot("user-management-desktop.png", {
    fullPage: true,
  });
});
```

## Responsive screenshot

```ts
test("user management mobile visual snapshot", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/admin/users");

  await expect(page).toHaveScreenshot("user-management-mobile.png", {
    fullPage: true,
  });
});
```

---

# 10. Với UI thuần layout/CSS thì nên gắn data gì?

Với các component thuần layout, không cần nhiều business state. Chỉ cần gắn **region anchors**.

Ví dụ:

```html
<div data-verify-unit="admin-layout">
  <aside data-region="sidebar"></aside>
  <header data-region="topbar"></header>
  <main data-region="content"></main>
</div>
```

Nếu là card grid:

```html
<section data-verify-unit="dashboard-grid">
  <article data-card="summary"></article>
  <article data-card="activity"></article>
  <article data-card="documents"></article>
</section>
```

Nếu là table:

```html
<table data-table="users"></table>
```

Mục đích không phải expose data, mà để Playwright/Claude có điểm neo ổn định khi đo layout hoặc chụp screenshot từng phần.

---

# 11. Khi nào không nên gắn data contract?

Không cần gắn cho:

```text
div chỉ để spacing
wrapper trang trí
icon decoration
border/background
text tĩnh không quan trọng
component không có state/action
```

Ví dụ không cần:

```html
<div data-verify-unit="rounded-shadow-wrapper">
```

Không có ý nghĩa.

---

# 12. Cách nghĩ đúng

Bạn có thể hình dung mỗi màn hình có 3 lớp:

```text
1. Data contract
   “Màn hình này đang ở trạng thái gì?”

2. Interaction contract
   “Người dùng/agent có thể làm gì ở đây?”

3. Visual contract
   “Màn hình này có nhìn đúng như mong muốn không?”
```

Trong đó:

```text
Data contract nằm trong DOM attributes.
Interaction contract nằm ở data-action, role, label.
Visual contract nằm ở screenshot, bounding box, CSS regression, vision review.
```

---

# 13. Công thức áp dụng thực tế

Với mỗi màn hình, làm như sau:

```text
Bước 1:
Liệt kê 5-10 điều quan trọng nhất cần đúng.

Bước 2:
Phân loại:
- Logic/state → DOM contract
- Action/flow → data-action + probe
- Layout/CSS → screenshot/bounding box
- Accessibility → role/name/label

Bước 3:
Chỉ gắn data-* tối thiểu để kiểm được những điều trên.

Bước 4:
Không đưa full object, không đưa dữ liệu nhạy cảm, không mirror DB.
```

Ví dụ với trang `User Activity` của bạn:

```text
Điều cần đúng:
1. User đang active/inactive đúng
2. User đang làm việc với org nào
3. Có bao nhiêu document đang xử lý
4. Có bao nhiêu partner liên quan
5. Timeline sắp xếp đúng thời gian
6. Layout activity feed không vỡ
```

Gắn DOM contract:

```html
<main
  data-verify-unit="user-activity"
  data-user-id="usr_123"
  data-status="active"
  data-org-count="2"
  data-document-count="8"
  data-partner-count="3"
  data-activity-count="15"
>
```

Gắn row timeline:

```html
<li
  data-row-type="activity"
  data-activity-id="act_001"
  data-activity-type="document_review"
  data-created-at="2026-06-18T10:00:00Z"
>
```

Gắn action:

```html
<button data-action="filter-activity">Filter</button>
<button data-action="open-document">Open Document</button>
```

Visual thì dùng screenshot/bounding box, không dùng data contract để đo “đẹp hay xấu”.

---

# Kết luận

Bạn hiểu rất đúng:

> **DOM data không đủ để xác thực UI hiển thị.**

Nó chỉ là một phần của verification.

Cách đúng là:

```text
Không nhét hết data vào DOM.
Chỉ expose state/action tối thiểu, có mục đích verify.
Dùng DOM contract để verify logic.
Dùng screenshot/bounding box/vision để verify layout và CSS.
```

Với project thật, mình khuyên bắt đầu nhỏ: mỗi màn hình chỉ gắn `data-verify-unit`, `data-region`, `data-action`, một vài count/status quan trọng. Khi invariant/probe cần thêm gì thì mới bổ sung data đó.
