# i18n Types

## Null Semantics

| Value | Meaning | Behavior |
|-------|---------|----------|
| `null` in _vi | Required, not set | Error / fallback failed |
| `null` in _en/_zh/_ja | Optional, not translated | Fallback to _vi |
| `""` | Empty string | Display empty |

## Migration Notes

When migrating existing data:
1. Copy `label` → `label_vi`
2. Set other locales to NULL
3. Run verification script
