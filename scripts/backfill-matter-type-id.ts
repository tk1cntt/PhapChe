/**
 * Backfill LegalRequest.matterTypeId from existing matterType text field.
 *
 * This script:
 * 1. Finds all LegalRequests with matterType text but no matterTypeId
 * 2. For each request, finds matching MatterType by key in the same workspace
 * 3. Falls back to global MatterTypes (workspaceId is null)
 * 4. Updates matterTypeId
 *
 * Usage: npx ts-node scripts/backfill-matter-type-id.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function backfillMatterTypeId() {
  console.log('Starting matterTypeId backfill...');

  // Get all legal requests with matterType text but no matterTypeId
  const requests = await prisma.legalRequest.findMany({
    where: {
      matterType: { not: null },
      matterTypeId: null,
    },
    include: {
      workspace: true,
    },
  });

  console.log(`Found ${requests.length} requests to backfill`);

  let updated = 0;
  let errors = 0;
  let skipped = 0;

  for (const request of requests) {
    try {
      // Skip if matterType is null (should not happen due to query filter, but safety check)
      if (!request.matterType) {
        skipped++;
        continue;
      }

      // Find matching MatterType by key in the same workspace
      const matterType = await prisma.matterType.findFirst({
        where: {
          key: request.matterType,
          workspaceId: request.workspaceId,
        },
      });

      if (matterType) {
        await prisma.legalRequest.update({
          where: { id: request.id },
          data: { matterTypeId: matterType.id },
        });
        updated++;
      } else if (request.matterType) {
        // Try global matter types (workspaceId is null)
        const globalMatterType = await prisma.matterType.findFirst({
          where: {
            key: request.matterType,
            workspaceId: null,
          },
        });

        if (globalMatterType) {
          await prisma.legalRequest.update({
            where: { id: request.id },
            data: { matterTypeId: globalMatterType.id },
          });
          updated++;
        } else {
          console.warn(`No MatterType found for key '${request.matterType}' in request ${request.id}`);
          skipped++;
        }
      }
    } catch (error) {
      console.error(`Error updating request ${request.id}:`, error);
      errors++;
    }
  }

  console.log(`\nBackfill complete: ${updated} updated, ${skipped} skipped, ${errors} errors`);
  return { updated, skipped, errors };
}

backfillMatterTypeId()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
