# Review: `src/lib/audit/audit-service.ts`

**Project:** PhapChe | **Review:** `a5e1ec0d-5ea1-415f-a92e-75934d9a2c3f`

**Comments:** 6

---

## 🟠 High (1)

**🐛 Bug** · lines 73-78

Missing error handling in `getAuditEvents` and `getAuditStats`: Both functions perform database queries without try-catch blocks. If the database is unavailable or a query fails (e.g., constraint violation, connection timeout), the error propagates directly to the caller, potentially causing unhandled promise rejections or 500 errors at the API layer without user-friendly messages. Wrap the database operations in try-catch and throw a meaningful error (or return a structured error result).

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export async function getAuditEvents(filters: AuditEventFilters): Promise<GetAuditEventsResult> {
  try {
    const page = Math.max(1, parseInt(String(filters.page ?? '1'), 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(String(filters.pageSize ?? '10'), 10) || 10));
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export async function getAuditEvents(filters: AuditEventFilters): Promise<GetAuditEventsResult> {
  const page = Math.max(1, parseInt(String(filters.page ?? '1'), 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(String(filters.pageSize ?? '10'), 10) || 10));
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};
```
</details>


## 🟡 Medium (3)

**🐛 Bug** · lines 97-105

Search case-sensitivity mismatch: `filters.search` is lowercased with `.toLowerCase()`, but Prisma's `contains` filter is case-sensitive (especially on PostgreSQL). This means searching for 'John' will not match stored values like 'John' or 'JOHN' — only rows where the stored value is already all-lowercase will match. Consider using a case-insensitive collation or the database's `ILIKE` equivalent (e.g., `mode: 'insensitive'` if your Prisma version supports it).

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    where.OR = [
      { actor: { email: { contains: searchLower, mode: 'insensitive' } } },
      { workspace: { name: { contains: searchLower, mode: 'insensitive' } } },
      { correlationId: { contains: searchLower, mode: 'insensitive' } },
      { metadataSummary: { contains: searchLower, mode: 'insensitive' } },
    ];
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    where.OR = [
      { actor: { email: { contains: searchLower } } },
      { workspace: { name: { contains: searchLower } } },
      { correlationId: { contains: searchLower } },
      { metadataSummary: { contains: searchLower } },
    ];
  }
```
</details>

---

**🐛 Bug** · lines 17-19

Missing input validation in `recordFileAccessLog`: `fileId` is not validated for being non-empty, and `action` is not validated against the allowed enum values (`'upload' | 'download' | 'view' | 'delete' | 'share'`). This can allow invalid or malformed records to be inserted into the database, compromising audit data integrity. Add validation at the start of the function and throw (or return early) for invalid inputs.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export async function recordFileAccessLog(input: FileAccessLogInput): Promise<void> {
  const VALID_ACTIONS = ['upload', 'download', 'view', 'delete', 'share'] as const;
  if (!input.fileId || typeof input.fileId !== 'string' || input.fileId.trim().length === 0) {
    console.error('Invalid fileId for audit log:', input);
    return;
  }
  if (!VALID_ACTIONS.includes(input.action)) {
    console.error('Invalid action for audit log:', input);
    return;
  }
  try {
    await prisma.fileAccessLog.create({
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export async function recordFileAccessLog(input: FileAccessLogInput): Promise<void> {
  try {
    await prisma.fileAccessLog.create({
```
</details>

---

**🔧 Maintainability** · lines 28-31

Fire-and-forget logging silently drops audit records: `recordFileAccessLog` catches all errors and only logs to `console.error`. If the database is temporarily unavailable, audit records are permanently lost with no retry mechanism, dead-letter queue, or alerting. This may violate compliance requirements for audit trails. Consider implementing a retry mechanism with exponential backoff, or at minimum, logging to a fallback persistent store (e.g., file-based log) so records can be replayed later.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  } catch (error) {
    // Log error but don't throw - audit logging should not block operations
    // TODO: Consider implementing a retry queue or fallback persistent storage
    // to prevent permanent audit record loss during transient DB outages.
    console.error('Failed to record file access log:', error);
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  } catch (error) {
    // Log error but don't throw - audit logging should not block operations
    console.error('Failed to record file access log:', error);
  }
```
</details>


## 🔵 Low (2)

**🐛 Bug** · lines 189-191

Misleading `completeAuditPercent` when no events exist: When `totalEvents` is 0, the function returns `completeAuditPercent: 100`, which gives a false sense of audit completeness. A dashboard displaying this would show 100% complete even when there are no events at all. Consider returning 0 or `null` to indicate that completeness cannot be meaningfully calculated with no data.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const completeAuditPercent = totalEvents > 0
    ? Math.round((completeEvents / totalEvents) * 100)
    : 0;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const completeAuditPercent = totalEvents > 0
    ? Math.round((completeEvents / totalEvents) * 100)
    : 100;
```
</details>

---

**🔧 Maintainability** · lines 164-169

Hardcoded critical action strings: `'access_denied'` and `'unauthorized_access_attempt'` are hardcoded in `getAuditStats`. If these action names change or new critical actions are added, this code must be updated manually. Consider extracting them to a named constant or configuration array (e.g., `CRITICAL_ACTIONS`) and referencing it from both the stats query and any other code that classifies critical events.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
const CRITICAL_ACTIONS = ['access_denied', 'unauthorized_access_attempt'] as const;

// ... in getAuditStats:
    prisma.auditEvent.count({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        action: { in: CRITICAL_ACTIONS },
      },
    }),
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    prisma.auditEvent.count({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        action: { in: ['access_denied', 'unauthorized_access_attempt'] },
      },
    }),
```
</details>


