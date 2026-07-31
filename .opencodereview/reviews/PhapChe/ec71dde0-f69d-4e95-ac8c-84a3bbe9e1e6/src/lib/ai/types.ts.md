# Review: `src/lib/ai/types.ts`

**Project:** PhapChe | **Review:** `ec71dde0-f69d-4e95-ac8c-84a3bbe9e1e6`

**Comments:** 3

---

## 🟡 Medium (2)

**🔧 Maintainability** · lines 189-191

The 'document-issue-analyzer' skill is defined in the AgentSkill union type (under the Generic section) but is NOT included in DOMAIN_SKILL_MAP for any domain. Since this skill is used as a default/fallback skill throughout the codebase (e.g., domain-resolver.ts, ai-review route), it should either be added to relevant domains or a comment should explain why it is intentionally excluded from the domain map.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  'legal-builder-hub': ['general-legal-researcher', 'commercial-contract-drafter'],
  'external-plugins': ['general-legal-researcher'],
  // Note: 'document-issue-analyzer' is intentionally omitted from DOMAIN_SKILL_MAP
  // as it is a generic fallback skill used when no domain-specific skill matches.
};
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  'legal-builder-hub': ['general-legal-researcher', 'commercial-contract-drafter'],
  'external-plugins': ['general-legal-researcher'],
};
```
</details>

---

**🔧 Maintainability** · line 182

The 'commercial-contract-reviewer' skill is listed under the 'product-legal' domain. This appears to be a copy-paste error — a commercial contract reviewer is a commercial-legal skill, not a product-legal one. Product-legal currently only has 'tos-generator' defined as its own skill, so 'commercial-contract-reviewer' seems misplaced here.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  'product-legal': ['tos-generator', 'regulatory-gap-analyzer'],
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  'product-legal': ['tos-generator', 'commercial-contract-reviewer', 'regulatory-gap-analyzer'],
```
</details>


## 🔵 Low (1)

**🔧 Maintainability** · line 156

The 'cease-desist-drafter' skill name uses 'cease-desist' as a hyphenated abbreviation of the standard legal term 'cease-and-desist'. While this is used consistently across the codebase and is intentional, it is an unusual/ambiguous abbreviation. Consider using the standard form 'cease-and-desist-drafter' for clarity, or add a comment noting the intentional abbreviation.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  | 'cease-and-desist-drafter'  // or document the intentional abbreviation
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  | 'cease-desist-drafter'
```
</details>


