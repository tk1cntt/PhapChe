# Seed Scripts

## seed-coverage.ts

Check translation coverage for seed data.

```bash
npx ts-node scripts/seed-coverage.ts
```

This script reports the percentage of translations filled for each locale (VI, EN, ZH, JA) across MatterTypes, Folders, and Tags.

## migrate-existing-data.ts

Copy existing single-language data to multilingual columns.

```bash
# 1. Run schema migration first
npx prisma db push

# 2. Run migration script
npx ts-node scripts/migrate-existing-data.ts

# 3. Check coverage
npx ts-node scripts/seed-coverage.ts
```
