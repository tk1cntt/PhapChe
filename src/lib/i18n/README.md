# i18n — Key-based translations

This project uses **key-based i18n** via `next-intl`. Translation strings live in `src/messages/{locale}.json`. The database stores only the **key** — not multilingual text.

## Architecture

| Entity | DB column | Type | Translation |
|--------|-----------|------|-------------|
| MatterType | `key` | `String` | `MatterTypes.{key}` in messages |
| MatterType description | — | — | `MatterTypeDescriptions.{key}` in messages |
| DocumentTemplate | `label` | `String?` | Admin-typed, workspace primary language |
| Folder | `name` | `String` | Admin-typed |
| Tag | `label` | `String?` | Admin-typed |

## Read Pattern

**Server components** — use `getTranslations` from `next-intl/server`:

```tsx
import { getTranslations } from 'next-intl/server';
const t = await getTranslations('MatterTypes');
const label = matterTypeKey ? t(matterTypeKey as any) : fallback;
```

**Client components** — use `useTranslations` from `next-intl`:

```tsx
import { useTranslations } from 'next-intl';
const t = useTranslations('MatterTypes');
const label = matterTypeKey ? t(matterTypeKey as any) : fallback;
```

## Adding a new MatterType

1. Add key + translations to `src/lib/i18n/seed-legal-domains.ts` (`SEED_MATTER_TYPES`)
2. Run `npx tsx scripts/generate-messages.ts` to sync `src/messages/` files
3. DB seeding creates/updates the `MatterType` row with just the key

## Seed folders/tags

Seed folder names use `Folders.{key}` namespace in messages. Seed tag labels use `Tags.{key}` namespace. Admin-created folders/tags use plain strings stored directly in the DB.
