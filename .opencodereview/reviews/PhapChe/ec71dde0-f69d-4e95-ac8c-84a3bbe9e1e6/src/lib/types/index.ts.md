# Review: `src/lib/types/index.ts`

**Project:** PhapChe | **Review:** `ec71dde0-f69d-4e95-ac8c-84a3bbe9e1e6`

**Comments:** 3

---

## 🟠 High (1)

**🐛 Bug** · lines 24-34

**Circular dependency risk**: The import `@/lib/types` on lines 24-36 and 41-47 is ambiguous. Both `src/lib/types.ts` and `src/lib/types/index.ts` exist, and depending on the bundler's module resolution order, `@/lib/types` could resolve to `src/lib/types/index.ts` — making `index.ts` import from itself, creating a circular dependency. This can cause runtime errors (e.g., `undefined` exports at module initialization time) or bundler warnings.

**Fix**: Since `src/lib/types.ts` already exports all these constants and types, `index.ts` should re-export them from the relative path `../types` (which unambiguously resolves to `src/lib/types.ts`) instead of the `@/lib/types` alias.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export {
  REQUEST_STATUS,
  ROLE,
  ASSIGNMENT_KIND,
  AUDIT_TARGET_TYPE,
  TEMPLATE_STATUS,
  DOCUMENT_VERSION_STATUS,
  REVIEW_STATUS,
  REVIEW_DECISION,
  VERSION_STATUS,
} from '@/lib/types';
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export {
  REQUEST_STATUS,
  ROLE,
  ASSIGNMENT_KIND,
  AUDIT_TARGET_TYPE,
  TEMPLATE_STATUS,
  DOCUMENT_VERSION_STATUS,
  REVIEW_STATUS,
  REVIEW_DECISION,
  VERSION_STATUS,
} from '@/lib/types';
```
</details>


## 🟡 Medium (1)

**🔧 Maintainability** · lines 37-48

**Ambiguous module resolution**: The `@/lib/types` path alias is ambiguous when both `src/lib/types.ts` and `src/lib/types/index.ts` coexist. This is a fragile pattern that can break silently when upgrading bundlers or changing module resolution settings. Use the explicit relative path `../types` to make the import target unambiguous.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export type {
  RequestStatus,
  Role,
  AssignmentKind,
  AuditTargetType,
  TemplateStatus,
  DocumentVersionStatus,
  ReviewStatus,
  ReviewDecision,
  VersionStatus,
  AppRole,
} from '../types';
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export type {
  RequestStatus,
  Role,
  AssignmentKind,
  AuditTargetType,
  TemplateStatus,
  DocumentVersionStatus,
  ReviewStatus,
  ReviewDecision,
  VersionStatus,
  AppRole,
} from '@/lib/types';
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · lines 53-54

**Duplicate re-export of activity module**: `./activity` is exported from both `src/lib/types/index.ts` (line 62) and `src/lib/types.ts` (lines 125-127). This creates two export paths for the same symbols, which can cause "ambiguous re-export" warnings in some bundlers and makes the module graph harder to understand. Consider consolidating the activity re-exports into a single location.

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
// Re-export activity types
export * from './activity';
```
</details>


