# Review: `src/lib/types/review.ts`

**Project:** PhapChe | **Review:** `ec71dde0-f69d-4e95-ac8c-84a3bbe9e1e6`

**Comments:** 4

---

## 🟠 High (1)

**🐛 Bug** · lines 115-122

DocumentReviewHistory is missing a documentId or reviewId field. Without a document identifier, it's impossible to trace a history entry back to the specific document or review it belongs to. This interface is likely used in API responses where the caller needs to know which document the history relates to.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export interface DocumentReviewHistory {
  documentId: string;
  version: number;
  status: DocumentVersionStatus;
  reviewDecision?: ReviewDecision;
  reviewerName?: string;
  decidedAt?: Date;
  comments: number;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export interface DocumentReviewHistory {
  version: number;
  status: DocumentVersionStatus;
  reviewDecision?: ReviewDecision;
  reviewerName?: string;
  decidedAt?: Date;
  comments: number;
}
```
</details>


## 🟡 Medium (3)

**🔧 Maintainability** · lines 16-18

The `decision` and `decidedAt` fields are both optional, but they are semantically coupled: when a decision is made, `decidedAt` should always be set. The current type allows a state where `decision` is set but `decidedAt` is undefined, which can lead to data inconsistency bugs at runtime. Consider using a discriminated union or at least documenting this invariant.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  /**
   * When decision is set, decidedAt MUST also be set.
   * These two fields are semantically coupled.
   */
  decision?: ReviewDecision;
  comments?: ReviewComment[];
  decidedAt?: Date;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  decision?: ReviewDecision;
  comments?: ReviewComment[];
  decidedAt?: Date;
```
</details>

---

**🔧 Maintainability** · lines 70-71

The `reviewId` and `review` fields are both optional but semantically linked: if `reviewId` is populated, `review` should typically be populated as well (and vice versa). The current type allows inconsistent states where one is set without the other, which can cause runtime errors when code assumes the review object is available.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  /**
   * When reviewId is set, the review relationship should also be populated.
   * These two fields are semantically linked.
   */
  reviewId?: string;
  review?: Review;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  reviewId?: string;
  review?: Review;
```
</details>

---

**🔧 Maintainability** · lines 96-100

Naming confusion: `ReviewDecisionInput.comments` is a `string` (likely a single decision rationale), but `Review.comments` is `ReviewComment[]` (an array of structured comment objects). Using the same name `comments` for two semantically different types (string vs. object array) in the same module is misleading. Consider renaming `ReviewDecisionInput.comments` to `reason` or `note` to avoid confusion.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export interface ReviewDecisionInput {
  reviewId: string;
  decision: ReviewDecision;
  reason?: string;
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export interface ReviewDecisionInput {
  reviewId: string;
  decision: ReviewDecision;
  comments?: string;
}
```
</details>


