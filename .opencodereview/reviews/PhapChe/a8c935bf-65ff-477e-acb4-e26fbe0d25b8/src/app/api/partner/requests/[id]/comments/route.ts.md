# Review: `src/app/api/partner/requests/[id]/comments/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 4

---

## 🟠 High (1)

**🐛 Bug** · line 129

**Bug: `isInternal` flag is accepted but never persisted.** The POST endpoint extracts `isInternal` from the request body (line 129) but only stores it in the `auditEvent.metadataSummary` — it is never saved to the `Message` model. The GET endpoint hardcodes `isInternal: false` for every comment (line 89). This means the internal comment feature is effectively non-functional.

Either:
- Add an `isInternal` field to the `Message` model and persist it in POST, **and** filter it out in GET for partners (so internal comments are not leaked), or
- Remove the `isInternal` field from the API contract if it's not yet implemented.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // TODO: Add isInternal field to Message model and persist it.
  // The GET endpoint must also filter out isInternal: true for partners.
  const { content } = body;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const { content, isInternal } = body;
```
</details>


## 🟡 Medium (2)

**⚡ Performance** · lines 69-72

**Performance: No pagination on GET endpoint.** `findMany` is called without `take` or `skip`, which will fetch all messages for a request in a single query. For requests with many comments (hundreds or thousands), this can cause significant memory pressure and slow response times.

Consider adding `take` and `skip` parameters (or cursor-based pagination) with sensible defaults (e.g., `take: 50`).

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const url = new URL(req.url);
  const take = Math.min(Number(url.searchParams.get('limit')) || 50, 100);
  const skip = Number(url.searchParams.get('offset')) || 0;

  const messages = await prisma.message.findMany({
    where: { legalRequestId: id },
    orderBy: { createdAt: 'asc' },
    take,
    skip,
  });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const messages = await prisma.message.findMany({
    where: { legalRequestId: id },
    orderBy: { createdAt: 'asc' },
  });
```
</details>

---

**🔒 Security** · lines 83-91

**Security: Potential data leak if `isInternal` is ever added to the Message model.** The GET endpoint currently hardcodes `isInternal: false` (line 89), which means it does not filter by visibility. If `isInternal` is later added to the `Message` model, the GET endpoint would serve internal-only comments to partner users without any filtering.

If the `isInternal` field is implemented, add a `where` clause to exclude internal messages for partner-facing endpoints.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // If isInternal is added to the Message model, filter it:
  // where: { legalRequestId: id, isInternal: false }
  const comments = messages.map((msg) => ({
    id: msg.id,
    requestId: msg.legalRequestId,
    content: msg.content,
    authorId: msg.senderId,
    author: senderMap.get(msg.senderId) || { id: msg.senderId, name: 'Unknown', email: '' },
    isInternal: false, // Ensure partners never see internal comments
    createdAt: msg.createdAt,
  }));
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const comments = messages.map((msg) => ({
    id: msg.id,
    requestId: msg.legalRequestId,
    content: msg.content,
    authorId: msg.senderId,
    author: senderMap.get(msg.senderId) || { id: msg.senderId, name: 'Unknown', email: '' },
    isInternal: false,
    createdAt: msg.createdAt,
  }));
```
</details>


## 🔵 Low (1)

**🐛 Bug** · lines 139-146

**Validation inconsistency: `content.length` checked before `trim()`.** The length validation on line 142 checks `content.length > 10000` on the raw input, but the stored value uses `content.trim()` (line 144). A user could bypass the 10,000-character limit by padding with whitespace: the raw `content` would be under the limit, but the trimmed content could still be very long. The check should be on the trimmed value.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const trimmedContent = content.trim();

  if (trimmedContent.length > 10000) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', detail: 'Content exceeds maximum length of 10000 characters', field: 'content' },
      { status: 400 }
    );
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  if (content.length > 10000) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', detail: 'Content exceeds maximum length of 10000 characters', field: 'content' },
      { status: 400 }
    );
  }

  const trimmedContent = content.trim();
```
</details>


