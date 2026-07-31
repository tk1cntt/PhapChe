# Review: `src/lib/ai/legal-knowledge/types.ts`

**Project:** PhapChe | **Review:** `19097c59-5574-418b-86a9-7db933cc9685`

**Comments:** 1

---

## 🟡 Medium (1)

**🔧 Maintainability** · lines 25-36

The `LegalKnowledgeDoc` schema forces all articles to be nested inside `chapters`, but many legal documents (e.g., Vietnamese laws) contain articles outside chapters — such as preambles, general provisions, appendices, or final provisions. This rigid structure can cause data loss when ingesting such documents. Consider adding optional top-level fields (e.g., `preamble?: string`, `appendices?: LegalArticle[]`, or a flat `articles?: LegalArticle[]`) to handle these cases.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
export interface LegalKnowledgeDoc {
  /** Unique document identifier */
  id: string;
  /** Source law name */
  source: string;
  /** Legal domains this document covers */
  domainTags: LegalDomain[];
  /** Law version/edition */
  version: string;
  /** Optional preamble text (not part of any chapter) */
  preamble?: string;
  /** Chapters containing articles */
  chapters: LegalChapter[];
  /** Articles that are not part of any chapter (e.g., appendices, final provisions) */
  standaloneArticles?: LegalArticle[];
}
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export interface LegalKnowledgeDoc {
  /** Unique document identifier */
  id: string;
  /** Source law name */
  source: string;
  /** Legal domains this document covers */
  domainTags: LegalDomain[];
  /** Law version/edition */
  version: string;
  /** Chapters containing articles */
  chapters: LegalChapter[];
}
```
</details>


