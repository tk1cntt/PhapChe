# Review: `src/lib/intake/catalog.ts`

**Project:** PhapChe | **Review:** `19097c59-5574-418b-86a9-7db933cc9685`

**Comments:** 3

---

## 🟡 Medium (2)

**🔧 Maintainability**

Type assertion `as readonly MatterCatalogItem[]` suppresses type-checking between the mapped seed data and the `MatterCatalogItem` type. If the seed data shape ever diverges (e.g., new optional fields, changed question types), the mismatch would go undetected at compile time. Consider using `satisfies` instead to validate the shape while preserving the narrower inferred type.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  }) satisfies readonly MatterCatalogItem[];
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  }) as readonly MatterCatalogItem[];
```
</details>

---

**🐛 Bug** · line 42

Shallow copy via spread (`{ ...question }`) shares the `label` object between the returned items and the original catalog. If a consumer mutates `question.label.en = '...'`, the original `MATTER_CATALOG` is silently corrupted. Consider deep-copying the `label` object as well.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  return matterType
    ? {
        ...matterType,
        questions: matterType.questions.map((question) => ({
          ...question,
          label: { ...question.label },
        })),
      }
    : null;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  return matterType ? { ...matterType, questions: matterType.questions.map((question) => ({ ...question })) } : null;
```
</details>


## 🔵 Low (1)

**⚡ Performance** · lines 45-47

`getMatterQuestions` calls `getMatterType` which already performs a defensive copy of questions, then maps over the result to create yet another copy. This double-copy is redundant. Either call `getMatterType` and return its questions directly, or inline the lookup without the extra map.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export function getMatterQuestions(matterTypeKey: string): IntakeQuestion[] {
  return getMatterType(matterTypeKey)?.questions.slice() ?? [];
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export function getMatterQuestions(matterTypeKey: string): IntakeQuestion[] {
  return getMatterType(matterTypeKey)?.questions.map((question) => ({ ...question })) ?? [];
}
```
</details>


