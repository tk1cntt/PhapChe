# Review: `src/lib/intake/intake-service.ts`

**Project:** PhapChe | **Review:** `3acfb256-d60c-412f-8676-c87b281e8e86`

**Comments:** 6

---

## 🔴 Critical (2)

**🐛 Bug** · lines 215-252

**Critical Bug: Double status transition to 'triage' for unsupported matter type.**

The function unconditionally transitions to `'triage'` at line 155, then for the `'unsupported'` matter type it transitions again to `'triage'` at line 187. This means the request undergoes two transitions to the same status. The second transition may fail (since the request is already in `'triage'`), or worse, it may silently succeed and create duplicate workflow events. The second transition appears to be an attempt to assign the coordinator as the actor, but the status should likely be something like `'pending_triage'` or `'coordinator_review'` rather than `'triage'` again.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // For unsupported matter type, assign to coordinator instead of auto-triaging
  if (submission.matterTypeKey === 'unsupported') {
    await transitionRequestStatus({
      requestId: input.requestId,
      actorId: coordinator!.userId,
      toStatus: 'triage',
      reason: 'unsupported intake requires human triage',
      correlationId: input.correlationId,
    });
  } else {
    await transitionRequestStatus({
      requestId: input.requestId,
      actorId: input.session.userId,
      toStatus: 'triage',
      reason: 'intake submitted via wizard',
      correlationId: input.correlationId,
    });
  }

  await prisma.$transaction(async (tx) => {
    await tx.intakeSubmission.update({
      where: { id: submission.id },
      data: { submittedAt: new Date() },
    });

    await recordAuditEvent(
      {
        actorId: input.session.userId,
        workspaceId: submission.request.workspaceId,
        action: 'intake.submitted',
        targetType: 'INTAKE_SUBMISSION',
        targetId: submission.id,
        requestId: input.requestId,
        correlationId: input.correlationId,
        metadataSummary: `matterType=${submission.matterTypeKey}; answerCount=${Object.keys(answers).length}`,
      },
      tx,
    );
  });

  return { id: input.requestId, status: 'triage' as const };
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  await transitionRequestStatus({
    requestId: input.requestId,
    actorId: input.session.userId,
    toStatus: 'triage',
    reason: 'intake submitted via wizard',
    correlationId: input.correlationId,
  });

  await prisma.$transaction(async (tx) => {
    await tx.intakeSubmission.update({
      where: { id: submission.id },
      data: { submittedAt: new Date() },
    });

    await recordAuditEvent(
      {
        actorId: input.session.userId,
        workspaceId: submission.request.workspaceId,
        action: 'intake.submitted',
        targetType: 'INTAKE_SUBMISSION',
        targetId: submission.id,
        requestId: input.requestId,
        correlationId: input.correlationId,
        metadataSummary: `matterType=${submission.matterTypeKey}; answerCount=${Object.keys(answers).length}`,
      },
      tx,
    );
  });

  if (submission.matterTypeKey === 'unsupported') {
    return transitionRequestStatus({
      requestId: input.requestId,
      actorId: coordinator!.userId,
      toStatus: 'triage',
      reason: 'unsupported intake requires human triage',
      correlationId: input.correlationId,
    });
  }
```
</details>

---

**🐛 Bug** · lines 215-242

**Critical Bug: `transitionRequestStatus` called outside the transaction, causing data inconsistency.**

The first `transitionRequestStatus` (line 155) executes outside the `prisma.$transaction` block. If the transaction that updates `submittedAt` and records the audit event fails, the request status will already be `'triage'` but the submission will not be marked as submitted and no audit log will exist. This leaves the system in an inconsistent state. The status transition and the submission update should be atomic.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  await prisma.$transaction(async (tx) => {
    await transitionRequestStatus({
      requestId: input.requestId,
      actorId: input.session.userId,
      toStatus: 'triage',
      reason: 'intake submitted via wizard',
      correlationId: input.correlationId,
    }, tx);

    await tx.intakeSubmission.update({
      where: { id: submission.id },
      data: { submittedAt: new Date() },
    });

    await recordAuditEvent(
      {
        actorId: input.session.userId,
        workspaceId: submission.request.workspaceId,
        action: 'intake.submitted',
        targetType: 'INTAKE_SUBMISSION',
        targetId: submission.id,
        requestId: input.requestId,
        correlationId: input.correlationId,
        metadataSummary: `matterType=${submission.matterTypeKey}; answerCount=${Object.keys(answers).length}`,
      },
      tx,
    );
  });
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  await transitionRequestStatus({
    requestId: input.requestId,
    actorId: input.session.userId,
    toStatus: 'triage',
    reason: 'intake submitted via wizard',
    correlationId: input.correlationId,
  });

  await prisma.$transaction(async (tx) => {
    await tx.intakeSubmission.update({
      where: { id: submission.id },
      data: { submittedAt: new Date() },
    });

    await recordAuditEvent(
      {
        actorId: input.session.userId,
        workspaceId: submission.request.workspaceId,
        action: 'intake.submitted',
        targetType: 'INTAKE_SUBMISSION',
        targetId: submission.id,
        requestId: input.requestId,
        correlationId: input.correlationId,
        metadataSummary: `matterType=${submission.matterTypeKey}; answerCount=${Object.keys(answers).length}`,
      },
      tx,
    );
  });
```
</details>


## 🟠 High (1)

**🔧 Maintainability** · lines 208-209

**Hardcoded role string `'coordinator_admin'` should be extracted as a named constant.**

Hardcoding role strings makes the codebase fragile: if the role name changes in the database, this lookup silently breaks. It also creates inconsistency if the same role is referenced elsewhere under a different string. Extract to a shared constant (e.g., `ROLE_COORDINATOR_ADMIN`).

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    coordinator = await prisma.workspaceMembership.findFirst({
      where: { workspaceId: submission.request.workspaceId, role: ROLE_COORDINATOR_ADMIN, isActive: true, user: { isActive: true } },
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    coordinator = await prisma.workspaceMembership.findFirst({
      where: { workspaceId: submission.request.workspaceId, role: 'coordinator_admin', isActive: true, user: { isActive: true } },
```
</details>


## 🟡 Medium (2)

**🎨 Style** · line 52

**Loose equality `!= null` used; strict equality required per project standards.**

The checklist explicitly prohibits `==` and `!=`. Use `!== null && !== undefined` or, if the intent is to check for any falsy value, use a simple truthy check. The `!= null` pattern, while idiomatic in JavaScript, violates the project's strict equality rules.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
    .filter((question) => answers[question.key] !== null && answers[question.key] !== undefined)
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
    .filter((question) => answers[question.key] != null)
```
</details>

---

**🐛 Bug** · lines 43-45

**`cleanAnswers` may throw at runtime if any answer value is `null` or `undefined`.**

Although `IntakeAnswers` is typed as `Record<string, string>`, runtime data (e.g., from JSON parsing or partial form submissions) can contain `null` or `undefined` values. Calling `.trim()` on such values will throw a `TypeError`. Add a guard to safely handle non-string values.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
function cleanAnswers(answers: IntakeAnswers) {
  return Object.fromEntries(
    Object.entries(answers).map(([key, value]) => [key, value?.trim() ?? ''])
  );
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
function cleanAnswers(answers: IntakeAnswers) {
  return Object.fromEntries(Object.entries(answers).map(([key, value]) => [key, value.trim()]));
}
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · line 154

**`validateAnswers` return value is silently ignored in `saveIntakeAnswers`.**

The call on this line only benefits from the side-effect of throwing on unknown keys. The `{ ok, missingRequired }` result is discarded, meaning required-field validation is not enforced during save. This may be intentional (allowing drafts with missing fields), but the unused return value is misleading. Consider either using the result or explicitly ignoring it with a void expression or comment.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // Only validate known keys during save; required-field enforcement happens at submit.
  void validateAnswers(submission.matterTypeKey, answers);
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  validateAnswers(submission.matterTypeKey, answers);
```
</details>


