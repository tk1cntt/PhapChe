# Review: `src/app/api/ai/analyze/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 7

---

## 🔴 Critical (1)

**🔒 Security** · lines 58-73

Missing resource-level authorization: The code only checks whether the user has one of the allowed roles (line 33-35), but never verifies whether the user is actually authorized to access the specific `legalRequest` identified by `requestId`. Any authenticated user with a valid role can analyze any legal request, regardless of ownership or assignment. This could lead to unauthorized data access across the organization. Consider adding a check such as verifying that the request belongs to the user's organization, is assigned to them, or is within their scope of access.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Fetch request data
    const legalRequest = await prisma.legalRequest.findUnique({
      where: { id: requestId },
      include: {
        intakeSubmission: {
          select: {
            matterTypeKey: true,
            answers: true,
          },
        },
      },
    });

    if (!legalRequest) {
      return NextResponse.json({ error: 'REQUEST_NOT_FOUND' }, { status: 404 });
    }

    // Verify resource-level access (e.g., ownership, assignment, or org scope)
    if (legalRequest.assignedToId !== session.userId && legalRequest.createdById !== session.userId) {
      return NextResponse.json({ error: 'FORBIDDEN: Not authorized to access this request' }, { status: 403 });
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Fetch request data
    const legalRequest = await prisma.legalRequest.findUnique({
      where: { id: requestId },
      include: {
        intakeSubmission: {
          select: {
            matterTypeKey: true,
            answers: true,
          },
        },
      },
    });

    if (!legalRequest) {
      return NextResponse.json({ error: 'REQUEST_NOT_FOUND' }, { status: 404 });
    }
```
</details>


## 🟠 High (2)

**🐛 Bug** · lines 125-152

Authentication errors are swallowed by the generic catch block: `requireAppSession()` (line 33) throws when the session is invalid or missing, but the catch block (line 116) returns a generic `AI_EXECUTION_FAILED` error with status 500. This leaks internal implementation details and returns an incorrect HTTP status code. An unauthenticated client should receive a 401 Unauthorized, not a 500 Internal Server Error. Consider catching session errors before the generic handler, or re-throwing them as a known error type.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    // Handle authentication/session errors explicitly
    if (message === 'UNAUTHORIZED' || message.includes('SESSION')) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', detail: 'Invalid or expired session.' },
        { status: 401 },
      );
    }

    if (message === 'LLM_API_KEY_MISSING' || message.includes('LLM_API_KEY_MISSING')) {
      return NextResponse.json(
        {
          error: 'AI_NOT_CONFIGURED',
          detail: 'Chưa cấu hình API key cho LLM. Thêm OPENAI_API_KEY vào .env.',
        },
        { status: 503 },
      );
    }

    if (message === 'LLM_RATE_LIMIT') {
      return NextResponse.json(
        { error: 'RATE_LIMITED', detail: 'Quá nhiều yêu cầu. Thử lại sau 1 phút.' },
        { status: 429 },
      );
    }

    console.error('[AI Analyze Error]', error);
    return NextResponse.json(
      {
        error: 'AI_EXECUTION_FAILED',
        detail: message,
      },
      { status: 500 },
    );
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message === 'LLM_API_KEY_MISSING' || message.includes('LLM_API_KEY_MISSING')) {
      return NextResponse.json(
        {
          error: 'AI_NOT_CONFIGURED',
          detail: 'Chưa cấu hình API key cho LLM. Thêm OPENAI_API_KEY vào .env.',
        },
        { status: 503 },
      );
    }

    if (message === 'LLM_RATE_LIMIT') {
      return NextResponse.json(
        { error: 'RATE_LIMITED', detail: 'Quá nhiều yêu cầu. Thử lại sau 1 phút.' },
        { status: 429 },
      );
    }

    console.error('[AI Analyze Error]', error);
    return NextResponse.json(
      {
        error: 'AI_EXECUTION_FAILED',
        detail: message,
      },
      { status: 500 },
    );
```
</details>

---

**🐛 Bug** · lines 114-115

Fire-and-forget audit recording: `executor.recordSuggestion()` is called without `await` and its returned Promise is not handled. If the recording operation fails (e.g., database error, network issue), the audit trail is silently lost while the HTTP response still returns `success: true`. This compromises audit integrity — there will be no record that the AI analysis was performed. Either `await` the call and handle errors, or use `.catch()` to log failures.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Record suggestion for audit
    try {
      await executor.recordSuggestion(requestId, skill, result, session.userId);
    } catch (auditError) {
      console.error('[AI Audit Error] Failed to record suggestion:', auditError);
      // Decide whether to fail the request or continue; at minimum log the failure
    }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Record suggestion for audit
    executor.recordSuggestion(requestId, skill, result, session.userId);
```
</details>


## 🟡 Medium (3)

**🔧 Maintainability** · line 122

Accessing private/internal config via bracket notation: `executor['config'].defaultModel` bypasses TypeScript's `private` access modifier, which is a code smell. If `config` is intentionally part of the public API, it should be exposed through a proper getter. Otherwise, this may break if the internal implementation changes and could unintentionally expose sensitive configuration values (e.g., API keys) in the response.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
        model: executor.getModelName?.() ?? 'unknown',
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
        model: executor['config'].defaultModel,
```
</details>

---

**🔧 Maintainability** · lines 20-26

Type assertion `as never` on `session.roles.includes(r as never)` is a workaround for a type mismatch between `ALLOWED_ROLES` (string array) and `session.roles` (likely a narrower union type). This suppresses a real type-checking issue. Consider using a type-safe alternative such as `(ALLOWED_ROLES as readonly string[]).includes(r)` or casting the array instead of each element, or properly typing `ALLOWED_ROLES` to match the session role type.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
const ALLOWED_ROLES = ['super_admin', 'coordinator_admin', 'specialist', 'reviewer'] as const;

export async function POST(request: Request) {
  try {
    // Auth
    const session = await requireAppSession();
    const hasRole = ALLOWED_ROLES.some((r) => session.roles.includes(r));
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
const ALLOWED_ROLES = ['super_admin', 'coordinator_admin', 'specialist', 'reviewer'];

export async function POST(request: Request) {
  try {
    // Auth
    const session = await requireAppSession();
    const hasRole = ALLOWED_ROLES.some((r) => session.roles.includes(r as never));
```
</details>

---

**🔧 Maintainability** · lines 97-99

Dead code: `promptTpl` is assigned the result of `getSystemPrompt(skill)` but is never used anywhere in the function. This appears to be leftover code; either it should be passed into the `SkillContext` or the executor, or it should be removed. The call to `getSystemPrompt()` may also have side effects or performance costs that are wasted.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    // Build context
    const context: SkillContext = {
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    // Build context
    const promptTpl = getSystemPrompt(skill);
    const context: SkillContext = {
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · line 15

Unused import: `renderSystemPrompt` is imported but never referenced in this file. This is dead code that adds unnecessary dependency and may confuse readers.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
import { getSystemPrompt } from '@/lib/ai/system-prompts';
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
import { getSystemPrompt, renderSystemPrompt } from '@/lib/ai/system-prompts';
```
</details>


