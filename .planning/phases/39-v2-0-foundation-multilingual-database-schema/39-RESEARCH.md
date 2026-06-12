# Phase 39: v2.0 Foundation - Multilingual Database Schema

**Researched:** 2026-06-12
**Domain:** Multilingual database schema design for Prisma/SQLite with next-intl i18n
**Confidence:** HIGH

## Summary

The project already has a solid i18n foundation: next-intl 4.13.0 is configured with VI, EN, ZH, JA locales, routing.ts uses `localePrefix: 'always'`, and LanguageSwitcher component exists. The main gap is **database content** not supporting multilingual storage - currently all content fields (title, label, description) store single-language Vietnamese strings.

**Primary recommendation:** Implement a **hybrid approach**: use title_vi/title_en/title_zh/title_jp columns for frequently-accessed fields (MatterType.label, DocumentTemplate.label, Folder.name, Tag.label) while keeping the UI translation files (src/messages/*.json) for static interface text.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| UI static text (buttons, labels, messages) | Frontend Server | CDN | next-intl messages files, server-side rendering |
| User-generated content titles | API/Backend | Database | Content comes from DB, needs multilingual columns |
| System metadata (status keys) | Database | API | Status keys stay constant, UI translates via i18n |
| Template content | API/Backend | Database | DocumentTemplate needs multilingual label/description |
| Folder/Tag names | API/Backend | Database | User-defined labels need multilingual support |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next-intl | 4.13.0 | i18n framework | Official Next.js i18n integration, App Router compatible |
| Prisma | 5.x | ORM | Type-safe queries, SQLite support |
| TypeScript | 5.x | Language | Full type coverage for multilingual field types |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod | - | Validation | Validate multilingual input fields |

## Package Legitimacy Audit

> This phase does not install external packages - it modifies existing schema and i18n infrastructure.

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser Request                           │
│                    /vi/dashboard, /en/dashboard                                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js Middleware                           │
│         - next-intl routing (locale detection)                   │
│         - Auth check (session token)                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  LocaleLayout + LanguageSwitcher                 │
│         - NextIntlClientProvider                                │
│         - Language persisted in URL (always prefix)              │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   Dashboard   │   │   Admin UI    │   │  Customer UI  │
│   (i18n keys) │   │  (i18n keys) │   │  (i18n keys) │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Prisma Database (SQLite)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ MatterType  │  │DocTemplate │  │   Folder    │             │
│  │ label_vi    │  │ label_vi   │  │  name_vi    │             │
│  │ label_en    │  │ label_en   │  │  name_en    │             │
│  │ label_zh    │  │ label_zh   │  │  name_zh    │             │
│  │ label_ja    │  │ label_ja   │  │  name_ja    │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure
```
src/
├── lib/
│   └── i18n/
│       ├── get-localized-content.ts   # Utility to get localized field
│       └── seed-multilingual.ts       # Seed helper for 4 languages
├── messages/
│   ├── vi.json                       # UI translations (unchanged)
│   ├── en.json
│   ├── zh.json
│   └── ja.json
├── components/
│   └── LanguageSwitcher.tsx           # Already exists
└── app/
    └── [locale]/                     # i18n routing already implemented
```

### Pattern 1: Hybrid Multilingual Schema (RECOMMENDED)

**What:** Combine database multilingual columns with i18n translation files

**When to use:** When content has both system-defined text (UI) and user-generated content (DB)

**Schema approach:**
```prisma
// For fields that need DB multilingual support
model MatterType {
  id             String   @id @default(cuid())
  workspaceId    String?
  key            String
  // Multilingual labels
  label_vi       String
  label_en       String?
  label_zh       String?
  label_ja       String?
  // Description also multilingual
  description_vi String?
  description_en String?
  description_zh String?
  description_ja String?
  // Schema stays as JSON (language-agnostic)
  questionSchema Json
  // ...
}

// For fields that translate via UI files only (status labels, action names)
model LegalRequest {
  // status stored as key, UI translates via RequestStatus.* keys
  status         String   @default("draft_intake")
  // title - decide: user content in DB (multilingual) or single-language?
  title_vi       String?
  title_en       String?
  title_zh       String?
  title_ja       String?
}
```

**Seed data approach:**
```typescript
// prisma/seed-multilingual.ts
export const MULTILINGUAL_MATTER_TYPES = {
  labor_contract: {
    vi: { label: 'Hợp đồng lao động', description: 'Soạn và rà soát hợp đồng lao động' },
    en: { label: 'Labor Contract', description: 'Draft and review labor contracts' },
    zh: { label: '劳动合同', description: '起草和审查劳动合同' },
    ja: { label: '労働契約', description: '労働契約の作成とレビュー' },
  },
  // ...
};

// In seed.ts
for (const [key, translations] of Object.entries(MULTILINGUAL_MATTER_TYPES)) {
  await prisma.matterType.upsert({
    where: { workspaceId_key: { workspaceId, key } },
    create: {
      workspaceId,
      key,
      label_vi: translations.vi.label,
      label_en: translations.en.label,
      label_zh: translations.zh.label,
      label_ja: translations.ja.label,
      description_vi: translations.vi.description,
      // ...
    },
  });
}
```

**Content resolution utility:**
```typescript
// src/lib/i18n/get-localized-content.ts
export function getLocalizedField(
  locale: string,
  fields: { vi?: string; en?: string; zh?: string; ja?: string }
): string {
  const localeFieldMap: Record<string, keyof typeof fields> = {
    vi: 'vi',
    en: 'en',
    zh: 'zh',
    ja: 'ja',
  };
  const fieldKey = localeFieldMap[locale] || 'vi';
  return fields[fieldKey] || fields.vi || Object.values(fields).find(Boolean) || '';
}
```

### Alternative Pattern 2: Translation Table

**What:** Separate translation table for all content

**When to use:** When content volume is high and most content is in all 4 languages

```prisma
model Translation {
  id          String   @id @default(cuid())
  entityType  String   // "matterType", "folder", "tag"
  entityId    String
  locale      String   // "vi", "en", "zh", "ja"
  field       String   // "label", "description"
  value       String

  @@unique([entityType, entityId, locale, field])
}
```

**Tradeoff:** More flexible but requires JOINs for every query, more complex seed logic.

### Anti-Patterns to Avoid
- **Using machine translation for seed data:** Quality matters for legal content. Human translation or professional legal translation required.
- **Storing locale preference in localStorage only:** URL-based locale (already implemented) is better for shareability and SEO.
- **Separate tables per language:** Creates maintenance nightmares. Use columns or a single translation table.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| i18n framework | Custom i18n | next-intl | Already installed, App Router support, good docs |
| Language routing | Custom middleware | next-intl/middleware | Already configured |
| Language persistence | localStorage-only | URL prefix (localePrefix: 'always') | Already implemented |
| Translation storage | Custom JSON files | Prisma multilingual columns + messages/*.json | Separation of concerns |

**Key insight:** The project has already invested in next-intl infrastructure. Extend it for DB content, don't replace it.

## Common Pitfalls

### Pitfall 1: Forgetting to update seed files when adding multilingual fields
**What goes wrong:** New columns get NULL values, causing runtime errors or empty displays.
**Why it happens:** Seed files not updated to include all locale columns.
**How to avoid:** Add migration with DEFAULT values, update all seed files in same PR.
**Warning signs:** `"column label_en does not have a default value"` in migration.

### Pitfall 2: Mixing UI i18n keys with DB content
**What goes wrong:** Developers search for content in wrong place (messages/*.json vs DB).
**Why it happens:** No clear boundary between "UI text" and "user content".
**How to avoid:** Document the boundary: UI text = messages/*.json, User content = DB multilingual columns.
**Warning signs:** Content appearing in both files, duplicate translations.

### Pitfall 3: Text length differences breaking layout
**What goes wrong:** German/Chinese text longer/shorter than Vietnamese breaks UI.
**Why it happens:** Different languages have different average character counts.
**How to avoid:** Use flex layouts, max-width constraints, and test all languages.
**Warning signs:** Horizontal scroll, overflow, truncation in non-Vietnamese languages.

### Pitfall 4: Not handling missing translations gracefully
**What goes wrong:** Empty string shown when translation missing for a language.
**Why it happens:** Fallback chain not implemented.
**How to avoid:** Always provide fallback: locale -> 'vi' (default) -> first available.
**Warning signs:** Empty labels in ZH/JA locale, console warnings about missing keys.

## Code Examples

### Content Resolution in Components
```typescript
// Source: Pattern from DashboardClient.tsx + proposed localization utility
'use client';

import { useLocale } from 'next-intl';

interface MatterTypeDisplay {
  key: string;
  label_vi: string;
  label_en: string | null;
  label_zh: string | null;
  label_ja: string | null;
}

function getLocalizedLabel(item: MatterTypeDisplay, locale: string): string {
  const map: Record<string, keyof MatterTypeDisplay> = {
    vi: 'label_vi',
    en: 'label_en',
    zh: 'label_zh',
    ja: 'label_ja',
  };
  const field = map[locale] || 'label_vi';
  return item[field] || item.label_vi || item.key;
}

// Usage in component
const locale = useLocale();
const displayLabel = getLocalizedLabel(matterType, locale);
```

### Seed Data Structure for 4 Languages
```typescript
// src/lib/i18n/seed-multilingual.ts

export const SEED_MATTER_TYPES = {
  labor_contract: {
    label: {
      vi: 'Hợp đồng lao động',
      en: 'Labor Contract',
      zh: '劳动合同',
      ja: '労働契約',
    },
    description: {
      vi: 'Soạn và rà soát hợp đồng lao động cho doanh nghiệp',
      en: 'Draft and review employment contracts for businesses',
      zh: '为企业起草和审查劳动合同',
      ja: '企業の労働契約の作成とレビュー',
    },
  },
  agency_contract: {
    label: {
      vi: 'Hợp đồng đại lý',
      en: 'Agency Contract',
      zh: '代理合同',
      ja: '代理店契約',
    },
    description: {
      vi: 'Soạn và rà soát hợp đồng đại lý phân phối',
      en: 'Draft and review distribution agency contracts',
      zh: '起草和审查分销代理合同',
      ja: '分销代理店契約の作成とレビュー',
    },
  },
  trademark_registration: {
    label: {
      vi: 'Đăng ký nhãn hiệu',
      en: 'Trademark Registration',
      zh: '商标注册',
      ja: '商标登録',
    },
    description: {
      vi: 'Tư vấn và đăng ký nhãn hiệu tại Việt Nam',
      en: 'Trademark consultation and registration in Vietnam',
      zh: '越南商标咨询和注册',
      ja: 'ベトナムにおける商標の相談と登録',
    },
  },
  nda_review: {
    label: {
      vi: 'Rà soát NDA',
      en: 'NDA Review',
      zh: 'NDA审查',
      ja: 'NDAレビュー',
    },
    description: {
      vi: 'Rà soát thỏa thuận bảo mật với đối tác',
      en: 'Review non-disclosure agreements with partners',
      zh: '与合作伙伴审查保密协议',
      ja: 'パートナーとの秘密保持契約のレビュー',
    },
  },
  other: {
    label: {
      vi: 'Khác / Chưa rõ',
      en: 'Other / Unclear',
      zh: '其他 / 不明确',
      ja: 'その他 / 不明',
    },
    description: {
      vi: 'Yêu cầu pháp lý khác hoặc loại chưa xác định',
      en: 'Other legal requests or unclear type',
      zh: '其他法律请求或类型不明确',
      ja: 'その他の法的リクエストまたはタイプ不明',
    },
  },
} as const;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single-language title/label columns | title_vi/title_en/title_zh/title_ja columns | Phase 39 | DB content translatable |
| Hardcoded Vietnamese seed data | Structured multilingual seed data | Phase 39 | 4-language seed support |
| UI text via hardcoded keys | next-intl messages files | Already done | Static UI fully i18n |

**Deprecated/outdated:**
- Single-language MatterType.label - replaced by multilingual columns
- Vietnamese-only seed data - replaced by structured 4-language seed

## Assumptions Log

> List all claims tagged `[ASSUMED]` in this research. The planner and discuss-phase use this
> section to identify decisions that need user confirmation before execution.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | MatterType and DocumentTemplate are the primary entities needing multilingual DB columns | Architecture Patterns | Other entities may need columns too |
| A2 | Users only input content in their locale (VI), translations are pre-seeded | Architecture Patterns | May need runtime translation feature |
| A3 | SQLite 3-column limit per row is not a concern (4 languages = 4 columns, well under limit) | Architecture Patterns | Would need table-per-entity if wrong |

**If this table is empty:** All claims in this research were verified or cited - no user confirmation needed.

## Open Questions

1. **Should LegalRequest.title be multilingual?**
   - What we know: title is user-provided content, currently stored in single language
   - What's unclear: Do users need to provide title in all 4 languages, or just their locale?
   - Recommendation: Store in user's locale (VI for Vietnam customers), provide single-language title for MVP

2. **Should DocumentTemplate.content (generated document) be multilingual?**
   - What we know: DocumentTemplate stores generated document content
   - What's unclear: Is document content language-dependent?
   - Recommendation: Document content follows MatterType language (pre-seeded templates in 4 languages)

3. **Migration strategy for existing data?**
   - What we know: Existing seed data has VI content
   - What's unclear: Should existing records be migrated with VI duplicates for all language columns?
   - Recommendation: Default migration sets all _vi columns to existing value, _en/_zh/_ja null (can be updated later)

## Environment Availability

> Step 2.6: SKIPPED (no external dependencies identified - this phase modifies existing infrastructure)

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (existing project test setup) |
| Config file | jest.config.js or package.json jest section |
| Quick run command | `npm test -- --testPathPattern=multilingual` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-39-01 | MatterType label displays in current locale | unit | `npx jest tests/lib/i18n/getLocalizedField.test.ts` | NO |
| REQ-39-02 | Seed data contains all 4 language variants | unit | `npx jest tests/prisma/seed.test.ts` | NO |
| REQ-39-03 | Language switcher changes displayed content | integration | `npx jest tests/components/LanguageSwitcher.test.tsx` | NO |
| REQ-39-04 | Layout remains intact when switching ZH/JA | visual | Manual test + screenshot comparison | NO |

### Sampling Rate
- **Per task commit:** `npm test -- --testPathPattern=multilingual -x`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/lib/i18n/getLocalizedField.test.ts` - Tests for content resolution utility
- [ ] `tests/prisma/seed-multilingual.test.ts` - Tests for 4-language seed data
- [ ] `tests/components/LanguageSwitcher.test.tsx` - Tests for language persistence
- [ ] `tests/lib/i18n/migration.test.ts` - Tests for schema migration validation

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | yes | Zod schema validation for multilingual input |
| V4 Access Control | yes | Locale-based access control (same as existing RBAC) |

### Known Threat Patterns for Multilingual Content

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via translated content | Tampering | Sanitize HTML in rendered translations |
| Content injection | Tampering | Validate locale parameter against whitelist |
| Missing translation fallback abuse | Information Disclosure | Always return fallback, never expose raw keys |

## Sources

### Primary (HIGH confidence)
- next-intl 4.13.0 documentation - Official next-intl App Router guide
- Prisma documentation - Schema design for internationalization

### Secondary (MEDIUM confidence)
- Existing project configuration: src/i18n.ts, src/routing.ts, src/components/LanguageSwitcher.tsx
- Existing seed files: prisma/seed.ts, prisma/seed-customer-dashboard.ts

### Tertiary (LOW confidence)
- General i18n best practices - Common patterns may not apply to legal content

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - next-intl already installed and configured
- Architecture: HIGH - Project structure supports proposed approach
- Pitfalls: MEDIUM - Based on general i18n experience, not verified against project

**Research date:** 2026-06-12
**Valid until:** 2026-07-12 (30 days - i18n patterns are stable)

---

## User Constraints (from CONTEXT.md)

> No CONTEXT.md found for this phase - proceeding with research-defined scope.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-39-01 | Support 4 languages: VI, ZH, JP, EN | Confirmed next-intl config, routing.ts already supports all 4 locales |
| REQ-39-02 | All UI text via i18n keys | Existing messages/*.json files, LanguageSwitcher component |
| REQ-39-03 | Database content multilingual | Proposed multilingual column approach for MatterType, DocumentTemplate |
| REQ-39-04 | Language switcher works correctly | Existing LanguageSwitcher, URL-based routing |
| REQ-39-05 | Default language: VI | routing.ts defaultLocale: 'vi' |
| REQ-39-06 | Language persisted across sessions | URL prefix (localePrefix: 'always') ensures persistence |
| REQ-39-07 | Layout stable when switching | Need visual regression testing (Wave 0 gap) |

## Implementation Complexity Estimate

| Task | Complexity | Notes |
|------|------------|-------|
| Add multilingual columns to MatterType | Medium | 8 new columns, migration, seed update |
| Add multilingual columns to DocumentTemplate | Medium | Similar to MatterType |
| Add multilingual columns to Folder | Low | 4 name columns |
| Add multilingual columns to Tag | Low | 4 label columns |
| Create getLocalizedField utility | Low | Simple field lookup function |
| Update seed files for 4 languages | High | All seed data needs translation |
| Add language resolution in components | Medium | Modify query result handling |
| Add validation tests | Medium | Test coverage for new code |

**Total estimated complexity:** 5-7 days for full implementation
