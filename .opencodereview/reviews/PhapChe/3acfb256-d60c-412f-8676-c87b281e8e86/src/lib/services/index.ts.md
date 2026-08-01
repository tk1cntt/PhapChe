# Review: `src/lib/services/index.ts`

**Project:** PhapChe | **Review:** `3acfb256-d60c-412f-8676-c87b281e8e86`

**Comments:** 1

---

## 🟡 Medium (1)

**🔧 Maintainability** · lines 5-9

This barrel export is missing two service modules that exist in the same directory and are actively used across the codebase: `partner-auth-service` (used in 5+ files) and `partner-invite-service` (used in 3+ files). Consumers are bypassing this barrel file and importing directly from `@/lib/services/partner-auth-service` and `@/lib/services/partner-invite-service`, defeating the purpose of a centralized barrel export. Add the missing exports to maintain consistency.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export * from './request-context-builder';
export * from './permission-service';
export * from './request-service';
export * from './assignment-service';
export * from './vault-service';
export * from './partner-auth-service';
export * from './partner-invite-service';
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export * from './request-context-builder';
export * from './permission-service';
export * from './request-service';
export * from './assignment-service';
export * from './vault-service';
```
</details>


