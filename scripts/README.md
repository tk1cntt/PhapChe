# Database Migration Scripts

## Order of Operations

1. Run `npx prisma db push` - Update schema
2. Run `tsx scripts/migrate-existing-data.ts` - Copy existing data
3. Verify with `npx prisma studio` - Check data

## Rollback

If migration fails:
1. Restore database from backup
2. Re-run migrations
