/**
 * Backfill VaultFile.fileId from File lookup by matching storageKey/objectKey.
 *
 * This script:
 * 1. Finds all VaultFiles with storageKey but no fileId
 * 2. For each, finds matching File by objectKey in the same workspace
 * 3. Updates fileId
 *
 * Note: Some vault files may not have matching files (e.g., old records, external files).
 * These will need manual review or can be cleaned up later.
 *
 * Usage: npx ts-node scripts/backfill-vault-item-file-id.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function backfillVaultItemFileId() {
  console.log('Starting VaultFile.fileId backfill...');

  // Get all vault files without fileId but with storageKey
  const vaultFiles = await prisma.vaultFile.findMany({
    where: {
      fileId: null,
      storageKey: { not: null },
    },
  });

  console.log(`Found ${vaultFiles.length} vault files to backfill`);

  let updated = 0;
  let errors = 0;
  let notFound = 0;

  for (const vaultFile of vaultFiles) {
    try {
      if (!vaultFile.storageKey) {
        notFound++;
        continue;
      }

      // Find matching File by objectKey
      const file = await prisma.file.findFirst({
        where: {
          objectKey: vaultFile.storageKey,
          workspaceId: vaultFile.workspaceId,
        },
      });

      if (file) {
        await prisma.vaultFile.update({
          where: { id: vaultFile.id },
          data: { fileId: file.id },
        });
        updated++;
      } else {
        console.warn(`No File found for storageKey '${vaultFile.storageKey}' in vault file ${vaultFile.id}`);
        notFound++;
      }
    } catch (error) {
      console.error(`Error processing vault file ${vaultFile.id}:`, error);
      errors++;
    }
  }

  console.log(`\nBackfill complete: ${updated} updated, ${notFound} not found, ${errors} errors`);
  return { updated, notFound, errors };
}

backfillVaultItemFileId()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
