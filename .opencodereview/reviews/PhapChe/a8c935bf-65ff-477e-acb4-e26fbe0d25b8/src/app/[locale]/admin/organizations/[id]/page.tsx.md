# Review: `src/app/[locale]/admin/organizations/[id]/page.tsx`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 6

---

## 🟠 High (1)

**🐛 Bug** · lines 54-65

No error handling for the async data fetching in Promise.all. If any Prisma query fails (network error, DB issue, etc.), the entire page will throw an unhandled rejection, resulting in a 500 error page with no user-friendly message. Wrap the data fetching in a try/catch and surface meaningful error feedback.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  let openRequests, inProgressRequests, slaRiskRequests, vaultFilesCount,
    recentAuditLogs, recentRequests, recentVaultFiles,
    engagements, workspaceMembers, workspaceStats;

  try {
    [
      openRequests,
      inProgressRequests,
      slaRiskRequests,
      vaultFilesCount,
      recentAuditLogs,
      recentRequests,
      recentVaultFiles,
      engagements,
      workspaceMembers,
      workspaceStats,
    ] = await Promise.all([
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const [
    openRequests,
    inProgressRequests,
    slaRiskRequests,
    vaultFilesCount,
    recentAuditLogs,
    recentRequests,
    recentVaultFiles,
    engagements,
    workspaceMembers,
    workspaceStats,
  ] = await Promise.all([
```
</details>


## 🟡 Medium (4)

**🐛 Bug** · lines 171-175

Dead code: the initial value of `badge` (`{ label: m.role, variant: 'green' }`) is always overwritten. The if/else-if/else chain covers every possible case (including the final else), so the initial assignment is never used.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    let badge: { label: string; variant: BadgeVariant };
    if (m.role === 'owner') badge = { label: 'Customer admin', variant: 'green' };
    else if (m.role === 'reviewer') badge = { label: 'Reviewer', variant: 'purple' };
    else if (m.role === 'specialist') badge = { label: 'Specialist', variant: 'blue' };
    else badge = { label: m.role, variant: 'gray' };
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    let badge: { label: string; variant: BadgeVariant } = { label: m.role, variant: 'green' };
    if (m.role === 'owner') badge = { label: 'Customer admin', variant: 'green' };
    else if (m.role === 'reviewer') badge = { label: 'Reviewer', variant: 'purple' };
    else if (m.role === 'specialist') badge = { label: 'Specialist', variant: 'blue' };
    else badge = { label: m.role, variant: 'gray' };
```
</details>

---

**⚡ Performance** · lines 285-287

`statusMap` is defined inside the `recentRequests.map()` callback and recreated on every iteration. Move it outside the map to avoid redundant object allocations.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const statusMap: Record<string, { variant: string; text: string }> = {
    draft_intake: { variant: 'gray', text: 'Nháp' },
    assigned: { variant: 'purple', text: 'Đã phân công' },
    in_progress: { variant: 'orange', text: 'Đang xử lý' },
    pending_review: { variant: 'purple', text: 'Chờ phê duyệt' },
    approved: { variant: 'green', text: 'Đã phê duyệt' },
    delivered: { variant: 'green', text: 'Đã giao' },
    closed: { variant: 'gray', text: 'Đã đóng' },
    cancelled: { variant: 'gray', text: 'Đã hủy' },
  };

  const requestRows = recentRequests.map((req) => {
    const sla = getSlaStatus(req.slaDeadline);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const requestRows = recentRequests.map((req) => {
    const sla = getSlaStatus(req.slaDeadline);
    const statusMap: Record<string, { variant: string; text: string }> = {
```
</details>

---

**⚡ Performance** · lines 305-315

`serviceTypeMap` is defined inside the `recentRequests.map()` callback and recreated on every iteration. Move it outside the map to avoid redundant object allocations.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    return {
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Get service type from matterType field or default
    const serviceTypeMap: Record<string, string> = {
      'trademark': 'Đăng ký nhãn hiệu',
      'tax': 'Tư vấn thuế',
      'contract': 'Rà soát hợp đồng',
      'labor': 'Tư vấn lao động',
      'corporate': 'Thành lập doanh nghiệp',
      'ip': 'Sở hữu trí tuệ',
    };

    return {
```
</details>

---

**🔧 Maintainability** · line 413

Hardcoded magic number `89` for `healthScore`. This appears to be a placeholder value. If this is a real health score calculation, it should be computed from actual data; if it's a placeholder, add a comment to clarify.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
        // TODO: Compute actual health score from org metrics
        healthScore: 89,
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
        healthScore: 89,
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · lines 210-215

The `parseMetadata` function uses `for...in` to iterate over the parsed object without a `hasOwnProperty` check. While parsed JSON objects are plain objects, this is fragile and could produce unexpected results if the prototype chain is polluted. Use `Object.entries()` or `Object.values()` instead.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      for (const val of Object.values(obj)) {
        if (typeof val === 'string' && val.length > 0 && val.length < 200) {
          return val;
        }
      }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      for (const key of Object.keys(obj)) {
        const val = obj[key];
        if (typeof val === 'string' && val.length > 0 && val.length < 200) {
          return val;
        }
      }
```
</details>


