# Review: `src/lib/types/review.ts`

**Project:** PhapChe | **Review:** `a2736937-db71-4beb-86ac-fff7eae35f18`

**Comments:** 2

---

## 🟡 Medium (1)

**🔧 Maintainability** · lines 10-21

Naming collision: `Review.comments` is typed as `ReviewComment[]` (an array of structured comment objects), while `ReviewDecisionInput.comments` (line 100) is typed as `string`. The same property name `comments` carries entirely different types and semantics across these two interfaces, which can easily cause confusion and bugs when developers pass data between these types. Consider renaming `ReviewDecisionInput.comments` to something like `decisionNote` or `decisionComment` to disambiguate.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export interface ReviewDecisionInput {
  reviewId: string;
  decision: ReviewDecision;
  decisionNote?: string;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export interface Review {
  id: string;
  documentVersionId: string;
  reviewerId: string;
  reviewerName?: string;
  status: ReviewStatus;
  decision?: ReviewDecision;
  comments?: ReviewComment[];
  decidedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · line 5

Potential circular dependency: This file is located at `src/lib/types/review.ts` but imports from `@/lib/types`. If the barrel file at `src/lib/types/index.ts` re-exports from this file, it creates a circular import. Verify that the barrel file does not re-export from `review.ts`, or consider importing these enum/type definitions directly from their source files to avoid the risk.

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
import type { ReviewStatus, ReviewDecision, DocumentVersionStatus } from '@/lib/types';
```
</details>


