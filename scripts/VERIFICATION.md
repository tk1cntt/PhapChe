# Migration Verification

## Checklist

- [ ] MatterType: label_vi column exists, NOT NULL
- [ ] DocumentTemplate: label_vi column exists, NOT NULL
- [ ] Folder: name_vi column exists, NOT NULL
- [ ] Tag: label_vi column exists, NOT NULL
- [ ] All _en/_zh/_ja columns are NULLABLE
- [ ] Prisma client generated successfully
- [ ] TypeScript compiles without errors

## Manual Verification

1. Open Prisma Studio: npx prisma studio
2. Check each table for new columns
3. Verify NULL constraints
