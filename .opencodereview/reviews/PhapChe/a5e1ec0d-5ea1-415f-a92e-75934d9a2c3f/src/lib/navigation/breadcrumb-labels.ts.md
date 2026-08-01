# Review: `src/lib/navigation/breadcrumb-labels.ts`

**Project:** PhapChe | **Review:** `a5e1ec0d-5ea1-415f-a92e-75934d9a2c3f`

**Comments:** 1

---

## 🟡 Medium (1)

**🔧 Maintainability** · lines 1-15

Hardcoded route path keys (e.g., 'admin', 'users', 'workspaces') create a maintenance risk: if route definitions change, these labels must be manually kept in sync, with no compile-time safety net. Consider defining route path constants in a shared module (e.g., an enum or const object) and using those as keys instead of raw string literals.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
// Example: define route path constants in a shared module, then use them here.
// import { ROUTE_PATHS } from '@/lib/navigation/route-paths';
//
// export const breadcrumbLabels: Record<string, string> = {
//   [ROUTE_PATHS.admin]: "Quản trị",
//   [ROUTE_PATHS.users]: "Người dùng",
//   ...
// };
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export const breadcrumbLabels: Record<string, string> = {
  admin: "Quản trị",
  users: "Người dùng",
  workspaces: "Workspace",
  requests: "Hồ sơ yêu cầu",
  ops: "Vận hành",
  audit: "Audit",
  vault: "Phân loại vault",
  specialist: "Chuyên viên",
  reviewer: "Người duyệt",
  customer: "Khách hàng",
  delivery: "Bàn giao",
  templates: "Mẫu văn bản",
  review: "Duyệt",
};
```
</details>


