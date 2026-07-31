# Review: `src/app/api/admin/requests/[id]/chat/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 15

---

## 🟠 High (2)

**🔒 Security** · lines 282-285

Workspace isolation bypass: When `session.activeWorkspaceId` is falsy (undefined/null/empty string), the workspace membership check is skipped entirely. A user with one of the allowed roles but no active workspace set can access any request across all workspaces. This is a privilege escalation vulnerability.

Fix: Remove the conditional and always enforce workspace membership. If `activeWorkspaceId` is required, reject the request when it is missing.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Workspace-level auth: user must be member of this request's workspace
    if (!session.activeWorkspaceId || legalRequest.workspaceId !== session.activeWorkspaceId) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Workspace-level auth: user must be member of this request's workspace
    if (session.activeWorkspaceId && legalRequest.workspaceId !== session.activeWorkspaceId) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }
```
</details>

---

**🔒 Security** · lines 282-285

Same workspace isolation bypass as in GET handler: When `session.activeWorkspaceId` is falsy, the check is skipped. This allows cross-workspace access for POST operations as well.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Workspace-level auth: user must be member of this request's workspace
    if (!session.activeWorkspaceId || legalRequest.workspaceId !== session.activeWorkspaceId) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Workspace-level auth: user must be member of this request's workspace
    if (session.activeWorkspaceId && legalRequest.workspaceId !== session.activeWorkspaceId) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }
```
</details>


## 🟡 Medium (7)

**🐛 Bug** · lines 479-485

LLM context overflow risk: The system prompt can be up to MAX_CONTEXT_CHARS (12,000 chars) and up to 20 prior messages are appended without any overall token limit check. Depending on the model, this can easily exceed the context window (e.g., 4K–8K tokens), causing truncated completions, wasted API calls, and degraded response quality despite the retry logic.

Fix: Estimate token count of the combined messages and trim or reduce `take` dynamically to stay within the model's context limit.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const chatMessages: ChatMessage[] = [
      { role: 'system', content: buildSystemPrompt(skill, requestContext) },
      ...validPriorMessages.map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      })),
    ];

    // Truncate messages to fit within model context window (approximate: 1 token ≈ 4 chars)
    const MAX_CONTEXT_TOKENS = (modelConfig.maxTokens ?? 4096) * 0.7; // reserve 30% for response
    let totalChars = chatMessages.reduce((sum, m) => sum + m.content.length, 0);
    while (totalChars > MAX_CONTEXT_TOKENS * 4 && chatMessages.length > 2) {
      const removed = chatMessages.splice(1, 2); // remove oldest user+assistant pair
      totalChars -= removed.reduce((s, m) => s + m.content.length, 0);
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const chatMessages: ChatMessage[] = [
      { role: 'system', content: buildSystemPrompt(skill, requestContext) },
      ...validPriorMessages.map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      })),
    ];
```
</details>

---

**🐛 Bug** · lines 100-103

Overly broad tool-call detection regex causes false positives: The pattern `read_file`, `search_file`, `write_to_file`, `replace_in_file`, `insert_file`, `delete_file`, `preview_url` are common English words that can legitimately appear in legal AI responses (e.g., "You should read_file X", "the contract may reference a search_file procedure"). This leads to valid responses being rejected, triggering unnecessary retries, wasting API credits, and degrading user experience.

Fix: Make the regex more specific, e.g., match only when these appear as function-call syntax (with parentheses, brackets, or as standalone commands).

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // Detect tool-call format: [调用...], function call patterns with arguments
  if (/\[调用|\b(read_file|search_file|execute_command|list_files|write_to_file|replace_in_file|insert_file|delete_file|preview_url)\s*\(/.test(text)) {
    return { valid: false, reason: 'tool_call_format' };
  }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  // Detect tool-call format: [调用...], read_file, search_file, write_to_file, etc.
  if (/\[调用|read_file|search_file|execute_command|list_files|write_to_file|replace_in_file|insert_file|delete_file|preview_url/.test(text)) {
    return { valid: false, reason: 'tool_call_format' };
  }
```
</details>

---

**🐛 Bug** · line 492

Missing `attempt` variable scope: The variable `attempt` is declared in the `for` loop but used outside the loop in the metadata JSON (line 399). However, currently the metadata uses a different expression. If the fix above is applied to use `attempt`, note that `let` is block-scoped to the `for` loop body. In the current code, the metadata is inside the `for` block where `attempt` is accessible, but the `assistantMessage` creation and audit trail are also inside the loop after the `break`. This is fragile — if the loop is refactored, `attempt` could become inaccessible.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    let attempt = 0;
    for (; attempt < MAX_LLM_RETRIES; attempt++) {
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    for (let attempt = 0; attempt < MAX_LLM_RETRIES; attempt++) {
```
</details>

---

**🐛 Bug** · line 255

TypeScript `as` cast on `session.roles` bypasses type safety: `session.roles as string[]` assumes the type without validation. If `session.roles` is actually `undefined`, `null`, or not an array, the `.includes()` call will throw a runtime error. This pattern appears in both GET and POST handlers.

Fix: Add a runtime guard: `Array.isArray(session.roles) && session.roles.includes(r)` or define a proper type for the session.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const roles = Array.isArray(session.roles) ? session.roles : [];
    const hasRole = ALLOWED_ROLES.some((r) => roles.includes(r));
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const hasRole = ALLOWED_ROLES.some((r) => (session.roles as string[]).includes(r));
```
</details>

---

**🐛 Bug** · line 255

Same unsafe `as string[]` cast on `session.roles` in the POST handler.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const roles = Array.isArray(session.roles) ? session.roles : [];
    const hasRole = ALLOWED_ROLES.some((r) => roles.includes(r));
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const hasRole = ALLOWED_ROLES.some((r) => (session.roles as string[]).includes(r));
```
</details>

---

**🐛 Bug** · lines 518-524

`chatMessages` array is mutated inside the retry loop: each failed attempt pushes a system-level instruction message, and the same array is passed to `llmComplete` on the next attempt. While this is intentional to nudge the LLM, the accumulation of system messages (especially with the already-large context from documents + 20 prior messages) exacerbates the context overflow risk. After 3 retries, the array has grown by up to 2 extra system messages.

Fix: Consider using a fresh copy of the messages array for each retry, or reset the mutation after each attempt.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
        if (attempt < MAX_LLM_RETRIES - 1) {
          // Thêm instruction nhắc LLM trả lời trực tiếp — use a fresh copy to avoid accumulation
          chatMessages = [
            ...chatMessages,
            {
              role: 'system' as const,
              content: 'Hệ thống: Bạn đang chat trực tiếp với người dùng. KHÔNG gọi hàm. Chỉ trả lời bằng tiếng Việt trực tiếp vào nội dung câu hỏi pháp lý.',
            },
          ];
        }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
        if (attempt < MAX_LLM_RETRIES - 1) {
          // Thêm instruction nhắc LLM trả lời trực tiếp
          chatMessages.push({
            role: 'system' as const,
            content: 'Hệ thống: Bạn đang chat trực tiếp với người dùng. KHÔNG gọi hàm. Chỉ trả lời bằng tiếng Việt trực tiếp vào nội dung câu hỏi pháp lý.',
          });
        }
```
</details>

---

**🐛 Bug** · lines 354-360

Missing CSRF protection: The POST handler accepts JSON body and performs state-changing operations (creating messages, calling LLM, writing audit events) without any CSRF token validation. Next.js App Router API routes are not automatically protected against CSRF for same-origin requests. Consider adding CSRF protection or using SameSite cookie attributes.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // CSRF protection
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    if (!origin || !host || new URL(origin).host !== host) {
      return NextResponse.json({ error: 'CSRF_INVALID' }, { status: 403 });
    }

    // Auth
    const session = await requireAppSession();
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Auth
    const session = await requireAppSession();
```
</details>


## 🔵 Low (6)

**🐛 Bug** · lines 550-555

Confusing `attempts` metadata field: The ternary expression `llmResponse.usage?.totalTokens ?? 0 > 0 ? 'success' : 'retry'` is misleading. Due to operator precedence, `0 > 0` evaluates to `false` first, then `??` applies. The field is named `attempts` but stores `'success'` or `'retry'` strings instead of the actual number of attempts. This appears to be a copy-paste error — the field likely intended to track the real attempt count but was overwritten with a disconnected expression.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const metadataJson = JSON.stringify({
      model: llmResponse.model,
      tokens: llmResponse.usage?.totalTokens ?? 0,
      latencyMs: llmResponse.latencyMs,
      attempts: attempt + 1,
    });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const metadataJson = JSON.stringify({
      model: llmResponse.model,
      tokens: llmResponse.usage?.totalTokens ?? 0,
      latencyMs: llmResponse.latencyMs,
      attempts: llmResponse.usage?.totalTokens ?? 0 > 0 ? 'success' : 'retry',
    });
```
</details>

---

**🐛 Bug** · line 320

Unsafe `as` cast on `intakeSubmission.answers`: `(legalRequest.intakeSubmission?.answers as Record<string, unknown>)` assumes the type without runtime validation. If Prisma returns a different shape, the destructured `Object.entries()` call downstream could throw at runtime.

Fix: Guard with a type check or use a safer default.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      intakeAnswers: (legalRequest.intakeSubmission?.answers && typeof legalRequest.intakeSubmission.answers === 'object'
        ? (legalRequest.intakeSubmission.answers as Record<string, unknown>)
        : null),
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      intakeAnswers: (legalRequest.intakeSubmission?.answers as Record<string, unknown>) ?? null,
```
</details>

---

**🔧 Maintainability** · line 320

Duplicate `as Record<string, unknown>` cast in GET handler (line 230). Same issue as above.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      intakeAnswers: (legalRequest.intakeSubmission?.answers && typeof legalRequest.intakeSubmission.answers === 'object'
        ? (legalRequest.intakeSubmission.answers as Record<string, unknown>)
        : null),
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      intakeAnswers: (legalRequest.intakeSubmission?.answers as Record<string, unknown>) ?? null,
```
</details>

---

**🔧 Maintainability**

Duplicate code: The request context building logic (fetching legalRequest, documents, building RequestContext) is duplicated between GET and POST handlers. Consider extracting into a shared helper function `buildRequestContext(requestId)` to reduce duplication and ensure consistency.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Use shared helper
    const requestContext = await buildRequestContext(requestId, session);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Fetch request with workspace info + intake
    const legalRequest = await prisma.legalRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        workspaceId: true,
        title: true,
        description: true,
        intakeSubmission: {
          select: { matterTypeKey: true, answers: true },
        },
      },
    });

    if (!legalRequest) {
      return NextResponse.json({ error: 'REQUEST_NOT_FOUND' }, { status: 404 });
    }

    // Workspace-level auth: user must be member of this request's workspace
    if (!session.activeWorkspaceId || legalRequest.workspaceId !== session.activeWorkspaceId) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    // Fetch documents attached to this request (latest version only)
    const documents = await prisma.document.findMany({
      where: { requestId, deletedAt: null },
      include: {
        documentVersions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { generatedContent: true, status: true },
        },
      },
    });

    // Build request context cho LLM
    const requestContext: RequestContext = {
      title: legalRequest.title,
      description: legalRequest.description,
      matterTypeKey: legalRequest.intakeSubmission?.matterTypeKey ?? null,
      intakeAnswers: (legalRequest.intakeSubmission?.answers as Record<string, unknown>) ?? null,
      documents: documents
        .map((d) => {
          const latestVersion = d.documentVersions[0];
          if (!latestVersion || !latestVersion.generatedContent) return null;
          const normalized = normalizeMarkdown(latestVersion.generatedContent, {
            detectArticles: true,
            detectSections: true,
            detectSubItems: true,
          });
          return { title: d.title, content: normalized.content };
        })
        .filter((d): d is { title: string; content: string } => d !== null),
    };
```
</details>

---

**⚡ Performance** · lines 385-408

Sequential DB queries: `legalRequest` and `documents` are fetched sequentially in the POST handler. Since they are independent, they could be fetched in parallel with `Promise.all` to reduce latency.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const [legalRequest, documents] = await Promise.all([
      prisma.legalRequest.findUnique({
        where: { id: requestId },
        select: {
          id: true,
          workspaceId: true,
          title: true,
          description: true,
          intakeSubmission: {
            select: { matterTypeKey: true, answers: true },
          },
        },
      }),
      prisma.document.findMany({
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const legalRequest = await prisma.legalRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        workspaceId: true,
        title: true,
        description: true,
        intakeSubmission: {
          select: { matterTypeKey: true, answers: true },
        },
      },
    });

    if (!legalRequest) {
      return NextResponse.json({ error: 'REQUEST_NOT_FOUND' }, { status: 404 });
    }

    // Workspace-level auth: user must be member of this request's workspace
    if (session.activeWorkspaceId && legalRequest.workspaceId !== session.activeWorkspaceId) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    // Fetch documents attached to this request (latest version only)
    const documents = await prisma.document.findMany({
```
</details>

---

**🐛 Bug** · line 20

`DEFAULT_MODEL_KEY = 'startup-model'` may not exist in `DEFAULT_MODELS`. If the key is missing, `modelConfig` will be `undefined`, causing `llmComplete` to fail with a cryptic error on every POST request. Verify that the key exists or add a runtime guard.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
const DEFAULT_MODEL_KEY = 'startup-model';

// Validate at module load
if (!DEFAULT_MODELS[DEFAULT_MODEL_KEY]) {
  console.error(`[AI Chat] DEFAULT_MODEL_KEY "${DEFAULT_MODEL_KEY}" not found in DEFAULT_MODELS`);
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
const DEFAULT_MODEL_KEY = 'startup-model';
```
</details>


