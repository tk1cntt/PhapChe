# Review: `src/app/api/vault/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 3

---

## 🟠 High (1)

**🐛 Bug** · lines 13-19

All-or-nothing failure: `Promise.all` rejects if *any* of the three service calls fails, causing the entire request to return 500 and discarding data from the other two successful calls. A single flaky service (e.g., `listTags`) prevents the user from seeing any vault data. Consider using `Promise.allSettled` and returning partial results so that one failing service doesn't break the whole endpoint.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const results = await Promise.allSettled([
      listFolders(session, workspaceId),
      listTags(session, workspaceId),
      listFileClassifications(session, workspaceId),
    ]);

    const [folders, tags, classifications] = results.map((r) =>
      r.status === 'fulfilled' ? r.value : []
    );

    return NextResponse.json({ folders, tags, classifications });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const [folders, tags, classifications] = await Promise.all([
      listFolders(session, workspaceId),
      listTags(session, workspaceId),
      listFileClassifications(session, workspaceId),
    ]);

    return NextResponse.json({ folders, tags, classifications });
```
</details>


## 🟡 Medium (1)

**🔒 Security** · line 21

Logging the raw `error.message` in production may expose internal details (database schemas, table/column names, stack traces, connection strings) to log sinks, aiding attackers in reconnaissance. Use a sanitized or generic log message in production, and consider logging the full error only in development.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    if (process.env.NODE_ENV === 'development') {
      console.error('Vault API error:', error instanceof Error ? error.message : String(error));
    } else {
      console.error('Vault API error: failed to fetch vault data');
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    console.error('Vault API error:', error instanceof Error ? error.message : String(error));
```
</details>


## 🔵 Low (1)

**🐛 Bug** · lines 8-11

Only checks truthiness of `workspaceId` (e.g., `undefined`, `null`, `''`), but does not validate that the value actually belongs to the session or exists in the database. A malformed or stale session token could carry a fabricated `activeWorkspaceId`, potentially leaking data from another workspace if the downstream services do not perform their own authorization checks.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const workspaceId = session.activeWorkspaceId;
    if (!workspaceId || typeof workspaceId !== 'string') {
      return NextResponse.json({ folders: [], tags: [], classifications: [] });
    }
    // Consider validating workspaceId against the session's authorized workspaces
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const workspaceId = session.activeWorkspaceId;
    if (!workspaceId) {
      return NextResponse.json({ folders: [], tags: [], classifications: [] });
    }
```
</details>


