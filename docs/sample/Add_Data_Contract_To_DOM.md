Có. Trong workshop họ có hướng dẫn ở mức concept: dùng **data emissions / attributes** để component publish state ra DOM, rồi định nghĩa **schemas, fixtures, invariants, probes** để human dashboard, agent hoặc CI cùng verify được. Transcript nói rõ component sẽ emit các state như `data-verify-unit`, `total`, `done`, `active` ra DOM để agent đọc thay vì phải scrape UI; mỗi component có schema, fixture, invariant và probe để chạy verification. 

Dưới đây là cách làm thực tế, áp dụng cho React/Next.js hoặc HTML thường.

---

# Bước 8 — Gắn data contracts vào DOM

## 1. Data contract là gì?

Data contract là “hợp đồng dữ liệu” mà UI expose ra DOM để agent/test đọc được.

Thay vì agent phải đoán từ giao diện:

```html
<p>3 active, 2 done</p>
```

ta expose rõ ràng:

```html
<section
  data-verify-unit="todo-app"
  data-total="5"
  data-active="3"
  data-done="2"
  data-state='{"total":5,"active":3,"done":2}'
>
</section>
```

Như vậy Claude/Playwright/test có thể đọc chính xác:

```js
const state = await page.locator('[data-verify-unit="todo-app"]').getAttribute('data-state')
```

Trong workshop, mục tiêu là làm cho state “viewable to an agent”, để agent có thể chạy verification end-to-end từ browser/DOM contract. 

---

## 2. Nguyên tắc gắn data contract

Bạn nên expose các thông tin sau:

```text
data-verify-unit      Tên component / module cần verify
data-contract-version Version của contract
data-state            JSON state quan trọng
data-status           Trạng thái nghiệp vụ chính
data-error            Error nếu có
data-count-*          Các số liệu dễ kiểm tra
data-action-*         Các nút/action quan trọng
```

Ví dụ naming ổn:

```html
<div data-verify-unit="legal-request-list">
<button data-action="create-request">
<tr data-row-type="request" data-request-id="REQ-001">
```

Không nên dùng selector phụ thuộc UI dễ đổi như:

```css
.card > div:nth-child(2) > button
```

Vì agent/test rất dễ vỡ khi layout đổi.

---

## 3. Ví dụ với app Legal Request của bạn

Giả sử bạn có trang quản lý request pháp lý.

### React component

```jsx
function LegalRequestDashboard({ requests }) {
  const total = requests.length;
  const draft = requests.filter(r => r.status === "draft_intake").length;
  const submitted = requests.filter(r => r.status === "submitted").length;
  const assigned = requests.filter(r => r.status === "assigned").length;
  const completed = requests.filter(r => r.status === "completed").length;

  const contractState = {
    total,
    byStatus: {
      draft_intake: draft,
      submitted,
      assigned,
      completed,
    },
    requestIds: requests.map(r => r.id),
  };

  return (
    <main
      data-verify-unit="legal-request-dashboard"
      data-contract-version="1"
      data-total={total}
      data-draft={draft}
      data-submitted={submitted}
      data-assigned={assigned}
      data-completed={completed}
      data-state={JSON.stringify(contractState)}
    >
      <header>
        <h1>Legal Requests</h1>
        <button data-action="create-request">
          Create Request
        </button>
      </header>

      <section data-region="request-summary">
        <div data-metric="total">{total}</div>
        <div data-metric="draft">{draft}</div>
        <div data-metric="submitted">{submitted}</div>
        <div data-metric="assigned">{assigned}</div>
        <div data-metric="completed">{completed}</div>
      </section>

      <table data-table="legal-requests">
        <thead>
          <tr>
            <th>Code</th>
            <th>Title</th>
            <th>Status</th>
            <th>Assignee</th>
          </tr>
        </thead>

        <tbody>
          {requests.map(request => (
            <tr
              key={request.id}
              data-row-type="legal-request"
              data-request-id={request.id}
              data-status={request.status}
              data-priority={request.priority || "normal"}
            >
              <td>{request.code}</td>
              <td>{request.title}</td>
              <td>{request.status}</td>
              <td>{request.assigneeName || "Unassigned"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
```

Điểm quan trọng là UI vẫn hiển thị bình thường, nhưng có thêm lớp dữ liệu cho agent/test đọc.

---

## 4. Ví dụ HTML thuần

```html
<main
  data-verify-unit="legal-request-dashboard"
  data-contract-version="1"
  data-total="3"
  data-submitted="1"
  data-assigned="1"
  data-completed="1"
  data-state='{
    "total": 3,
    "byStatus": {
      "submitted": 1,
      "assigned": 1,
      "completed": 1
    },
    "requestIds": ["REQ-001", "REQ-002", "REQ-003"]
  }'
>
  <button data-action="create-request">Create Request</button>

  <table data-table="legal-requests">
    <tbody>
      <tr
        data-row-type="legal-request"
        data-request-id="REQ-001"
        data-status="submitted"
        data-priority="high"
      >
        <td>REQ-001</td>
        <td>Review NDA</td>
        <td>submitted</td>
        <td>Unassigned</td>
      </tr>

      <tr
        data-row-type="legal-request"
        data-request-id="REQ-002"
        data-status="assigned"
        data-priority="normal"
      >
        <td>REQ-002</td>
        <td>Employment contract</td>
        <td>assigned</td>
        <td>Minh Nguyen</td>
      </tr>
    </tbody>
  </table>
</main>
```

---

# Bước 9 — Định nghĩa schema, fixture, invariant, probe

Workshop nói mỗi component sẽ có các phần như **schemas, fixtures, known states, invariants**, và dùng **probes** để test cả happy path lẫn các tình huống ngoài happy path. 

Có thể hiểu đơn giản như sau:

| Thành phần | Dùng để làm gì                                     |
| ---------- | -------------------------------------------------- |
| Schema     | Định nghĩa state DOM contract phải có hình dạng gì |
| Fixture    | Tạo dữ liệu mẫu / trạng thái mẫu                   |
| Invariant  | Điều kiện luôn phải đúng                           |
| Probe      | Hành động kiểm tra UI/flow                         |

---

# 1. Schema

Schema trả lời câu hỏi:

> Data contract này phải có field nào, kiểu gì, giá trị hợp lệ ra sao?

Ví dụ dùng `zod`:

```ts
// verification/legal-request-dashboard.schema.ts
import { z } from "zod";

export const LegalRequestDashboardSchema = z.object({
  total: z.number().int().min(0),

  byStatus: z.object({
    draft_intake: z.number().int().min(0).optional(),
    submitted: z.number().int().min(0).optional(),
    assigned: z.number().int().min(0).optional(),
    in_review: z.number().int().min(0).optional(),
    completed: z.number().int().min(0).optional(),
    cancelled: z.number().int().min(0).optional(),
  }),

  requestIds: z.array(z.string()),
});

export type LegalRequestDashboardState = z.infer<
  typeof LegalRequestDashboardSchema
>;
```

Nếu không dùng TypeScript/Zod, có thể viết schema dạng JSON:

```js
export const legalRequestDashboardSchema = {
  unit: "legal-request-dashboard",
  version: 1,
  required: ["total", "byStatus", "requestIds"],
  fields: {
    total: "number",
    byStatus: "object",
    requestIds: "string[]",
  },
};
```

---

# 2. Fixture

Fixture là dữ liệu mẫu để đưa component vào trạng thái đã biết.

Ví dụ:

```ts
// verification/legal-request-dashboard.fixtures.ts

export const legalRequestDashboardFixtures = {
  empty: {
    name: "Empty request list",
    requests: [],
  },

  mixedStatuses: {
    name: "Mixed request statuses",
    requests: [
      {
        id: "REQ-001",
        code: "REQ-001",
        title: "Review NDA",
        status: "submitted",
        priority: "high",
        assigneeName: null,
      },
      {
        id: "REQ-002",
        code: "REQ-002",
        title: "Employment contract",
        status: "assigned",
        priority: "normal",
        assigneeName: "Minh Nguyen",
      },
      {
        id: "REQ-003",
        code: "REQ-003",
        title: "Vendor agreement",
        status: "completed",
        priority: "low",
        assigneeName: "Linh Tran",
      },
    ],
  },

  allCompleted: {
    name: "All requests completed",
    requests: [
      {
        id: "REQ-004",
        code: "REQ-004",
        title: "DPA review",
        status: "completed",
        priority: "normal",
        assigneeName: "An Pham",
      },
    ],
  },
};
```

Nếu dùng Storybook, mỗi fixture có thể trở thành một story:

```tsx
export const Empty = {
  args: legalRequestDashboardFixtures.empty,
};

export const MixedStatuses = {
  args: legalRequestDashboardFixtures.mixedStatuses,
};

export const AllCompleted = {
  args: legalRequestDashboardFixtures.allCompleted,
};
```

Trong workshop, họ nhắc tới Storybook fixtures, testing library, data emissions/attributes và Playwright MCP để agent đọc DOM contract và chạy verification. 

---

# 3. Invariant

Invariant là rule luôn đúng, bất kể UI đang ở fixture nào.

Ví dụ với legal request dashboard:

```text
total phải bằng tổng số request rows
total phải bằng tổng các status count
mỗi row phải có request id
status của row phải nằm trong danh sách hợp lệ
request completed không nên còn assignee rỗng nếu business yêu cầu
```

Code:

```ts
// verification/legal-request-dashboard.invariants.ts

const allowedStatuses = [
  "draft_intake",
  "submitted",
  "assigned",
  "in_review",
  "completed",
  "cancelled",
];

export const legalRequestDashboardInvariants = [
  {
    id: "total-equals-status-sum",
    description: "Total must equal sum of status counts",
    check(state) {
      const statusSum = Object.values(state.byStatus).reduce(
        (sum, value) => sum + Number(value || 0),
        0
      );

      return {
        pass: state.total === statusSum,
        expected: state.total,
        actual: statusSum,
      };
    },
  },

  {
    id: "total-equals-request-id-count",
    description: "Total must equal number of request IDs",
    check(state) {
      return {
        pass: state.total === state.requestIds.length,
        expected: state.total,
        actual: state.requestIds.length,
      };
    },
  },

  {
    id: "request-ids-are-unique",
    description: "Request IDs must be unique",
    check(state) {
      const uniqueCount = new Set(state.requestIds).size;

      return {
        pass: uniqueCount === state.requestIds.length,
        expected: state.requestIds.length,
        actual: uniqueCount,
      };
    },
  },
];
```

---

# 4. Probe

Probe là hành động thực tế để kiểm tra UI.

Invariant kiểm tra “điều luôn đúng”.
Probe kiểm tra “khi làm hành động X thì UI/state phải đổi đúng”.

Ví dụ:

```text
Click Create Request
Filter status = submitted
Assign specialist
Mark request as completed
Search by code
```

Code Playwright:

```ts
// verification/legal-request-dashboard.probes.ts

export const legalRequestDashboardProbes = [
  {
    id: "create-request-button-visible",
    description: "Create request button should be visible",
    async run(page) {
      const button = page.locator('[data-action="create-request"]');

      return {
        pass: await button.isVisible(),
      };
    },
  },

  {
    id: "request-row-count-matches-contract",
    description: "Rendered request rows must match data-total",
    async run(page) {
      const root = page.locator('[data-verify-unit="legal-request-dashboard"]');

      const total = Number(await root.getAttribute("data-total"));
      const rowCount = await page
        .locator('[data-row-type="legal-request"]')
        .count();

      return {
        pass: total === rowCount,
        expected: total,
        actual: rowCount,
      };
    },
  },

  {
    id: "filter-submitted-requests",
    description: "Filtering submitted requests should show only submitted rows",
    async run(page) {
      await page.locator('[data-filter-status="submitted"]').click();

      const rows = page.locator('[data-row-type="legal-request"]');
      const count = await rows.count();

      for (let i = 0; i < count; i++) {
        const status = await rows.nth(i).getAttribute("data-status");

        if (status !== "submitted") {
          return {
            pass: false,
            expected: "submitted",
            actual: status,
          };
        }
      }

      return {
        pass: true,
      };
    },
  },
];
```

---

# 5. Hàm đọc state từ DOM contract

Đây là phần trung gian cực quan trọng.

```ts
// verification/readDomContract.ts

export async function readDomContract(page, unitName) {
  const root = page.locator(`[data-verify-unit="${unitName}"]`);

  const exists = await root.count();

  if (!exists) {
    throw new Error(`Missing data-verify-unit="${unitName}"`);
  }

  const rawState = await root.first().getAttribute("data-state");

  if (!rawState) {
    throw new Error(`Missing data-state for unit "${unitName}"`);
  }

  return JSON.parse(rawState);
}
```

Dùng:

```ts
const state = await readDomContract(page, "legal-request-dashboard");
```

---

# 6. Hàm chạy verification tổng hợp

```ts
// verification/runLegalRequestDashboardVerification.ts

import { LegalRequestDashboardSchema } from "./legal-request-dashboard.schema";
import { legalRequestDashboardInvariants } from "./legal-request-dashboard.invariants";
import { legalRequestDashboardProbes } from "./legal-request-dashboard.probes";
import { readDomContract } from "./readDomContract";

export async function runLegalRequestDashboardVerification(page) {
  const results = [];

  const state = await readDomContract(page, "legal-request-dashboard");

  const schemaResult = LegalRequestDashboardSchema.safeParse(state);

  results.push({
    type: "schema",
    id: "legal-request-dashboard-schema",
    pass: schemaResult.success,
    error: schemaResult.success ? null : schemaResult.error.format(),
  });

  if (!schemaResult.success) {
    return results;
  }

  for (const invariant of legalRequestDashboardInvariants) {
    const result = invariant.check(schemaResult.data);

    results.push({
      type: "invariant",
      id: invariant.id,
      description: invariant.description,
      ...result,
    });
  }

  for (const probe of legalRequestDashboardProbes) {
    const result = await probe.run(page);

    results.push({
      type: "probe",
      id: probe.id,
      description: probe.description,
      ...result,
    });
  }

  return results;
}
```

---

# 7. File Playwright test hoàn chỉnh

```ts
// tests/legal-request-dashboard.verify.spec.ts

import { test, expect } from "@playwright/test";
import { runLegalRequestDashboardVerification } from "../verification/runLegalRequestDashboardVerification";

test("legal request dashboard verification", async ({ page }) => {
  await page.goto("/admin/legal-requests");

  const results = await runLegalRequestDashboardVerification(page);

  const failed = results.filter(result => !result.pass);

  if (failed.length > 0) {
    console.table(failed);
  }

  expect(failed).toEqual([]);
});
```

Chạy:

```bash
npx playwright test tests/legal-request-dashboard.verify.spec.ts
```

---

# 8. Manifest cho agent đọc

Trong workshop, họ có nhắc việc manifest verification steps nằm như state trong DOM để agent inspect và chạy được. 

Bạn có thể expose manifest như sau:

```html
<script
  type="application/json"
  data-verification-manifest="legal-request-dashboard"
>
{
  "unit": "legal-request-dashboard",
  "version": 1,
  "schema": "LegalRequestDashboardSchema",
  "fixtures": [
    "empty",
    "mixedStatuses",
    "allCompleted"
  ],
  "invariants": [
    "total-equals-status-sum",
    "total-equals-request-id-count",
    "request-ids-are-unique"
  ],
  "probes": [
    "create-request-button-visible",
    "request-row-count-matches-contract",
    "filter-submitted-requests"
  ]
}
</script>
```

Agent có thể đọc:

```js
const manifest = await page
  .locator('[data-verification-manifest="legal-request-dashboard"]')
  .textContent();

console.log(JSON.parse(manifest));
```

---

# 9. Cấu trúc thư mục nên dùng

```text
src/
  components/
    LegalRequestDashboard.tsx

  verification/
    readDomContract.ts

    legal-request-dashboard/
      schema.ts
      fixtures.ts
      invariants.ts
      probes.ts
      manifest.ts
      run.ts

tests/
  legal-request-dashboard.verify.spec.ts
```

Hoặc nếu muốn module rõ hơn:

```text
features/
  legal-requests/
    components/
      LegalRequestDashboard.tsx

    verification/
      schema.ts
      fixtures.ts
      invariants.ts
      probes.ts
      run.ts
```

---

# 10. Cách áp dụng cho dự án của bạn

Với hệ thống legal platform của bạn, mình khuyên bắt đầu với 3 màn hình trước:

## 1. User Management

Contract nên expose:

```text
totalUsers
activeUsers
inactiveUsers
roleCounts
workspaceCounts
selectedUserId
```

Invariant:

```text
totalUsers = activeUsers + inactiveUsers
sum(roleCounts) = totalUsers
mỗi user row có userId
role nằm trong danh sách hợp lệ
```

Probe:

```text
search user
filter by role
deactivate user
assign workspace
change role
```

## 2. Legal Request Dashboard

Contract nên expose:

```text
totalRequests
statusCounts
priorityCounts
assignedCount
unassignedCount
overdueCount
```

Invariant:

```text
sum(statusCounts) = totalRequests
assignedCount + unassignedCount = totalRequests
overdue request phải có slaDeadline < now
completed request không được status khác completed
```

Probe:

```text
create request
filter status
assign specialist
change priority
open request detail
```

## 3. Document Review

Contract nên expose:

```text
documentId
versionNumber
reviewStatus
checklistTotal
checklistPassed
checklistFailed
decision
```

Invariant:

```text
checklistPassed + checklistFailed <= checklistTotal
completed review phải có decision
approved review không được có critical failed item
documentVersionId phải tồn tại
```

Probe:

```text
submit review
approve
request changes
add comment
switch document version
```

---

# 11. Template nhanh để bạn copy cho mỗi component

```ts
export const verificationUnit = {
  unit: "your-component-name",
  version: 1,

  schema: {
    required: ["total", "items"],
  },

  fixtures: {
    empty: {},
    normal: {},
    edgeCase: {},
  },

  invariants: [
    {
      id: "some-rule-always-true",
      check(state) {
        return {
          pass: true,
        };
      },
    },
  ],

  probes: [
    {
      id: "some-user-action",
      async run(page) {
        return {
          pass: true,
        };
      },
    },
  ],
};
```

---

# Kết luận

Hai bước này làm theo thứ tự như sau:

```text
Bước 8:
Component expose state ra DOM bằng data-* attributes
→ agent/test đọc được trạng thái thật của UI

Bước 9:
Viết schema để validate shape
Viết fixture để tạo known states
Viết invariant để kiểm tra rule luôn đúng
Viết probe để kiểm tra hành động thực tế
```

Cách làm này biến UI từ “thứ chỉ con người nhìn được” thành “artifact mà human, Claude agent và CI đều verify được”.
