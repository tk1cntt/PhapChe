# Review: `src/lib/types/audit.ts`

**Project:** PhapChe | **Review:** `3acfb256-d60c-412f-8676-c87b281e8e86`

**Comments:** 3

---

## 🟡 Medium (2)

**🐛 Bug** · line 12

The `action` field is typed as `string` instead of the derived `AuditAction` union type. Since `AUDIT_ACTIONS` defines a closed set of valid action strings and `AuditAction` is already derived on line 91, using `string` undermines type safety and allows arbitrary action strings to pass type checking undetected.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  action: AuditAction;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  action: string;
```
</details>

---

**🔧 Maintainability** · line 19

Structural mismatch between `AuditLog.metadata` and the actual audit implementation. In `src/lib/audit/audit.ts`, audit events are stored with a `metadataSummary` field (string, max 500 chars via validation at line 65), but the `AuditLog` interface declares `metadata` as `Record<string, unknown>` — two different field names and incompatible types. Consumers of `AuditLog` expecting a rich metadata object will get nothing (or the wrong field), while the actual stored data is a truncated summary string they won't know to access.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  metadata?: Record<string, unknown>;
  metadataSummary?: string;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  metadata?: Record<string, unknown>;
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · lines 65-70

The `AUDIT_ACTIONS` constant is missing action strings for several target types defined in the system: `MEMBERSHIP`, `MATTER_TYPE`, `INTAKE_SUBMISSION`, `ASSIGNMENT`, `VAULT_FILE`, and `WORKFLOW_TRANSITION`. Additionally, the `workspace.member_invited` and `workspace.member_removed` actions use a `workspace.` prefix but logically belong to the `MEMBERSHIP` target type — this discrepancy could lead to incorrect filtering/querying when correlating actions with target types.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // Workspace actions
  WORKSPACE_CREATED: 'workspace.created',
  WORKSPACE_UPDATED: 'workspace.updated',
  WORKSPACE_DELETED: 'workspace.deleted',

  // Membership actions
  MEMBER_INVITED: 'membership.invited',
  MEMBER_REMOVED: 'membership.removed',

  // Intake submission actions
  INTAKE_CREATED: 'intake_submission.created',
  INTAKE_UPDATED: 'intake_submission.updated',

  // Assignment actions
  ASSIGNMENT_CREATED: 'assignment.created',
  ASSIGNMENT_REASSIGNED: 'assignment.reassigned',

  // Vault file actions
  VAULT_FILE_UPLOADED: 'vault_file.uploaded',
  VAULT_FILE_DOWNLOADED: 'vault_file.downloaded',
  VAULT_FILE_DELETED: 'vault_file.deleted',

  // Workflow transition actions
  WORKFLOW_TRANSITION_EXECUTED: 'workflow_transition.executed',
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  // Workspace actions
  WORKSPACE_CREATED: 'workspace.created',
  WORKSPACE_UPDATED: 'workspace.updated',
  WORKSPACE_DELETED: 'workspace.deleted',
  MEMBER_INVITED: 'workspace.member_invited',
  MEMBER_REMOVED: 'workspace.member_removed',
```
</details>


