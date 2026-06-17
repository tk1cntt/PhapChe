/**
 * Backfill RequestAssignment.isCurrent and endedAt flags.
 *
 * This script:
 * 1. Groups assignments by (requestId, kind)
 * 2. For each group, sorts by createdAt descending
 * 3. Sets most recent record to isCurrent: true, endedAt: null
 * 4. Sets older records to isCurrent: false, endedAt: when current was created
 *
 * Usage: npx ts-node scripts/backfill-request-assignment.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function backfillAssignmentFlags() {
  console.log('Starting RequestAssignment isCurrent/endedAt backfill...');

  // Get all requests with assignments
  const requestIds = await prisma.requestAssignment.findMany({
    select: { requestId: true },
    distinct: ['requestId'],
  });

  console.log(`Found ${requestIds.length} requests with assignments`);

  let updated = 0;
  let errors = 0;
  let skipped = 0;

  for (const { requestId } of requestIds) {
    try {
      // Get all assignments for this request, ordered by createdAt desc
      const assignments = await prisma.requestAssignment.findMany({
        where: { requestId },
        orderBy: { createdAt: 'desc' },
      });

      if (assignments.length === 0) {
        skipped++;
        continue;
      }

      // Group by kind
      const byKind = new Map<string, typeof assignments>();
      for (const assignment of assignments) {
        const existing = byKind.get(assignment.kind) || [];
        existing.push(assignment);
        byKind.set(assignment.kind, existing);
      }

      // Process each kind group
      for (const [kind, kindAssignments] of byKind) {
        // First record (most recent) = isCurrent: true
        // All others = isCurrent: false, endedAt = when first was created
        const mostRecent = kindAssignments[0];
        const endedAt = mostRecent.createdAt;

        for (let i = 0; i < kindAssignments.length; i++) {
          const assignment = kindAssignments[i];
          const isCurrent = i === 0;

          await prisma.requestAssignment.update({
            where: { id: assignment.id },
            data: {
              isCurrent,
              endedAt: isCurrent ? null : endedAt,
            },
          });
          updated++;
        }
      }
    } catch (error) {
      console.error(`Error processing request ${requestId}:`, error);
      errors++;
    }
  }

  console.log(`\nBackfill complete: ${updated} assignments updated, ${skipped} skipped, ${errors} errors`);
  return { updated, skipped, errors };
}

backfillAssignmentFlags()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
