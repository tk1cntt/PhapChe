# Review: `src/app/api/admin/requests/[id]/report/route.ts`

**Project:** PhapChe | **Review:** `a8c935bf-65ff-477e-acb4-e26fbe0d25b8`

**Comments:** 5

---

## 🟠 High (2)

**🐛 Bug** · lines 53-57

Summary statistics are computed from the unfiltered `annotations` array, ignoring the `includeResolved` flag. The `filteredAnnotations` variable is correctly used for content generation, but `totalAnnotations`, `criticalIssues`, `warnings`, `suggestions`, and `questions` all count resolved annotations even when `includeResolved` is false. This means the summary will show inflated/inconsistent numbers compared to the actual report content.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  const filteredAnnotations = includeResolved
    ? annotations
    : annotations.filter((a) => a.status === 'open');

  const totalAnnotations = filteredAnnotations.length;
  const criticalIssues = filteredAnnotations.filter((a) => a.severity === 'critical').length;
  const warnings = filteredAnnotations.filter((a) => a.severity === 'warning').length;
  const suggestions = filteredAnnotations.filter((a) => a.category === 'suggestion').length;
  const questions = filteredAnnotations.filter((a) => a.category === 'question').length;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  const totalAnnotations = annotations.length;
  const criticalIssues = annotations.filter((a) => a.severity === 'critical').length;
  const warnings = annotations.filter((a) => a.severity === 'warning').length;
  const suggestions = annotations.filter((a) => a.category === 'suggestion').length;
  const questions = annotations.filter((a) => a.category === 'question').length;
```
</details>

---

**🔒 Security** · lines 125-131

Authorization only checks global roles (`ALLOWED_ROLES`) but does not verify whether the user is authorized to access this specific `requestId`. A user with an allowed role could access reports for requests belonging to other departments, clients, or users, leading to horizontal privilege escalation.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const session = await requireAppSession();
    const hasRole = ALLOWED_ROLES.some((r) => (session.roles as string[]).includes(r));
    if (!hasRole) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const { id: requestId } = await params;

    // Verify the user has access to this specific request
    const legalRequest = await prisma.legalRequest.findUnique({
      where: { id: requestId },
      select: { title: true, ownerId: true, departmentId: true },
    });
    if (!legalRequest) {
      return NextResponse.json({ error: 'REQUEST_NOT_FOUND' }, { status: 404 });
    }
    // Add request-level access check here (e.g., verify department membership or ownership)
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const session = await requireAppSession();
    const hasRole = ALLOWED_ROLES.some((r) => (session.roles as string[]).includes(r));
    if (!hasRole) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const { id: requestId } = await params;
```
</details>


## 🟡 Medium (2)

**🐛 Bug** · lines 160-163

The `documentReviewStatus` query filters by `reviewerId: session.userId`, which means the status map only reflects the current user's review statuses. In multi-reviewer workflows, files reviewed by other users will show as `'pending'`, producing an incorrect report that misrepresents the overall review progress.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    const reviewStatuses = await prisma.documentReviewStatus.findMany({
      where: { requestId },
      select: { fileKey: true, status: true, reviewerId: true },
    });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    const reviewStatuses = await prisma.documentReviewStatus.findMany({
      where: { requestId, reviewerId: session.userId },
      select: { fileKey: true, status: true },
    });
```
</details>

---

**🔒 Security** · lines 227-235

Raw annotation content is injected directly into the LLM prompt without sanitization. An attacker who can create annotations with crafted content (e.g., containing instructions like 'Ignore previous instructions and...') could manipulate the LLM output, alter the generated report, or potentially leak data from the system prompt.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
        // Sanitize annotation content to prevent prompt injection
        const sanitizeForPrompt = (text: string) => text.replace(/[\{\}\[\]`]/g, '\\$&');
        const annotationsText = annotations
          .filter((a) => includeResolved || a.status === 'open')
          .map((a) => `[${a.severity}][${a.category}] ${sanitizeForPrompt(a.content)} (file: ${sanitizeForPrompt(a.fileKey)}, by: ${sanitizeForPrompt(a.authorName)})`)
          .join('\n');

        const userPrompt = `Hãy tạo báo cáo review cho yêu cầu pháp lý: "${legalRequest.title}"

## Danh sách tài liệu:
${filesText}

## Ghi chú review:
${annotationsText || 'Không có ghi chú nào.'}

Hãy tạo báo cáo bằng tiếng Việt, định dạng Markdown.`;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
        const userPrompt = `Hãy tạo báo cáo review cho yêu cầu pháp lý: "${legalRequest.title}"

## Danh sách tài liệu:
${filesText}

## Ghi chú review:
${annotationsText || 'Không có ghi chú nào.'}

Hãy tạo báo cáo bằng tiếng Việt, định dạng Markdown.`;
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · lines 262-267

The LLM error is silently swallowed; the catch block falls back to the template without logging the original error. This makes it difficult to detect and diagnose persistent LLM failures (e.g., misconfiguration, rate-limiting, API key issues), which may go unnoticed in production.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
      } catch (llmError) {
        console.error('[Report API] LLM generation failed, falling back to template:', llmError);
        // Fallback to template on LLM error
        const report = buildTemplateReport(legalRequest.title, files, annotations, includeResolved);
        content = report.content;
        summary = report.summary;
      }
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
      } catch {
        // Fallback to template on LLM error
        const report = buildTemplateReport(legalRequest.title, files, annotations, includeResolved);
        content = report.content;
        summary = report.summary;
      }
```
</details>


