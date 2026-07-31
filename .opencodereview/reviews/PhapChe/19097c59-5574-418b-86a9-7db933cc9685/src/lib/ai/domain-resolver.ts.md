# Review: `src/lib/ai/domain-resolver.ts`

**Project:** PhapChe | **Review:** `19097c59-5574-418b-86a9-7db933cc9685`

**Comments:** 3

---

## 🟡 Medium (3)

**🐛 Bug** · line 21

Possible typo in matter type key: 'mnd' may be an abbreviation error for 'mou' (Memorandum of Understanding) or simply a duplicate intended for 'nda'. If this is intentional, it should be documented with a comment; otherwise, matter types submitted with the correct abbreviation (e.g., 'mou') will not be mapped to any domain and will silently fall back to 'commercial-legal'.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // If this is meant to be 'Memorandum of Understanding', use 'mou'
  mou: 'commercial-legal',
  // Or if 'Mutual Non-Disclosure', consider renaming to 'mutual_nda' for clarity
  mutual_nda: 'commercial-legal',
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  mnd: 'commercial-legal',
```
</details>

---

**🔧 Maintainability** · lines 90-94

Hardcoded fallback strings ('commercial-legal', 'general-legal-researcher', 'document-issue-analyzer') are repeated across three functions. If any of these defaults need to change, multiple locations must be updated, risking inconsistency. Extract them as named constants.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
const DEFAULT_DOMAIN: LegalDomain = 'commercial-legal';
const DEFAULT_SKILLS: AgentSkill[] = ['general-legal-researcher'];
const DEFAULT_PRIMARY_SKILL: AgentSkill = 'document-issue-analyzer';

export function suggestSkills(matterTypeKey: string | null | undefined): AgentSkill[] {
  if (!matterTypeKey) return DEFAULT_SKILLS;

  const domain = MATTER_DOMAIN_MAP[matterTypeKey] ?? DEFAULT_DOMAIN;
  const domainSkills = DOMAIN_SKILL_MAP[domain] ?? DEFAULT_SKILLS;
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
export function suggestSkills(matterTypeKey: string | null | undefined): AgentSkill[] {
  if (!matterTypeKey) return ['general-legal-researcher'];

  const domain = MATTER_DOMAIN_MAP[matterTypeKey] ?? 'commercial-legal';
  const domainSkills = DOMAIN_SKILL_MAP[domain] ?? ['general-legal-researcher'];
```
</details>

---

**🔧 Maintainability** · lines 114-118

The skill selection heuristic in getPrimarySkill uses substring matching on magic strings ('review', 'analyzer', 'check'). This is fragile: renaming a skill (e.g., 'ip-patent-analyzer' → 'ip-patent-searcher') would silently break the filter. For domains like 'litigation-legal' and 'ai-governance-legal', no skills match the filter at all, so it always falls back to skills[0] — making the filter dead code for those domains. Consider a declarative approach: either assign a 'primary' flag per skill in DOMAIN_SKILL_MAP, or define an explicit Domain → PrimarySkill mapping.

<details>
<summary>:bulb: Suggestion</summary>

```typescript
  // Prefer the first skill in the domain's skill list (ordered by relevance)
  return skills[0] ?? 'document-issue-analyzer';
```
</details>

<details>
<summary>:clipboard: Existing Code</summary>

```typescript
  // For document review, prefer skill names that suggest review/analysis
  const reviewSkills = skills.filter((s) =>
    s.includes('review') || s.includes('analyzer') || s.includes('check'),
  );
  return reviewSkills[0] ?? skills[0] ?? 'document-issue-analyzer';
```
</details>


