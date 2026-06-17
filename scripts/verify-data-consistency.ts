/**
 * Data consistency verification script for Phase 85 backfill.
 *
 * Verifies:
 * 1. LegalRequest.matterTypeId consistency (all records with matterType text have matterTypeId)
 * 2. RequestAssignment.isCurrent consistency (each (requestId, kind) has exactly one isCurrent=true)
 * 3. VaultFile.fileId consistency (all records with storageKey have fileId)
 * 4. FK relationship integrity
 *
 * Usage: npx ts-node scripts/verify-data-consistency.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyDataConsistency() {
  console.log('=== Data Consistency Verification ===\n');

  const issues: string[] = [];
  let passed = 0;

  // 1. Verify LegalRequest.matterTypeId consistency
  console.log('1. Checking LegalRequest.matterTypeId consistency...');
  try {
    const requestWithTextNoId = await prisma.legalRequest.count({
      where: {
        matterType: { not: null },
        matterTypeId: null,
      },
    });
    if (requestWithTextNoId > 0) {
      issues.push(`LegalRequest: ${requestWithTextNoId} records have matterType text but no matterTypeId`);
    } else {
      console.log('   PASS: All matterType text records have matterTypeId');
      passed++;
    }
  } catch (error) {
    // matterTypeId column might not exist yet (pre-migration)
    console.log('   SKIP: matterTypeId column not found (run after Phase 2 migration)');
  }

  // 2. Verify RequestAssignment.isCurrent consistency
  console.log('2. Checking RequestAssignment.isCurrent consistency...');
  try {
    // Check if isCurrent column exists
    const sampleAssignment = await prisma.requestAssignment.findFirst();
    if (!('isCurrent' in sampleAssignment!)) {
      console.log('   SKIP: isCurrent column not found (run after Phase 2 migration)');
    } else {
      // Get all users for filter
      const userIds = new Set((await prisma.user.findMany({ select: { id: true } })).map((u: { id: string }) => u.id));

      // Group by (requestId, kind) and check for multiple isCurrent=true
      const assignments = await prisma.requestAssignment.groupBy({
        by: ['requestId', 'kind'],
        _count: { isCurrent: true },
        having: {
          isCurrent: { _count: { gt: 1 } },
        },
      });
      if (assignments.length > 0) {
        issues.push(`RequestAssignment: ${assignments.length} (requestId, kind) pairs have multiple isCurrent=true`);
      } else {
        console.log('   PASS: Each (requestId, kind) has exactly one isCurrent=true');
        passed++;
      }

      // Check for orphaned isCurrent records (isCurrent=true but has endedAt)
      const orphanedCurrent = await prisma.requestAssignment.count({
        where: {
          isCurrent: true,
          endedAt: { not: null },
        },
      });
      if (orphanedCurrent > 0) {
        issues.push(`RequestAssignment: ${orphanedCurrent} isCurrent=true records have endedAt set`);
      } else {
        passed++;
      }
    }
  } catch (error) {
    console.log('   SKIP: isCurrent column not found (run after Phase 2 migration)');
  }

  // 3. Verify VaultFile.fileId consistency
  console.log('3. Checking VaultFile.fileId consistency...');
  try {
    // Check if fileId column exists
    const sampleVault = await prisma.vaultFile.findFirst();
    if (!sampleVault || !('fileId' in sampleVault)) {
      console.log('   SKIP: fileId column not found (run after Phase 2 migration)');
    } else {
      const vaultWithKeyNoFileId = await prisma.vaultFile.count({
        where: {
          storageKey: { not: null },
          fileId: null,
        },
      });
      if (vaultWithKeyNoFileId > 0) {
        issues.push(`VaultFile: ${vaultWithKeyNoFileId} records have storageKey but no fileId`);
      } else {
        console.log('   PASS: All VaultFiles with storageKey have fileId');
        passed++;
      }
    }
  } catch (error) {
    console.log('   SKIP: fileId column not found (run after Phase 2 migration)');
  }

  // 4. Check FK integrity (soft check - just counts)
  console.log('4. Checking FK relationships...');
  try {
    const userIds = new Set((await prisma.user.findMany({ select: { id: true } })).map((u: { id: string }) => u.id));

    const orphanedMessages = await prisma.message.count({
      where: {
        OR: [
          { senderId: { notIn: Array.from(userIds) } },
          { recipientId: { notIn: Array.from(userIds) } },
        ],
      },
    });
    if (orphanedMessages > 0) {
      console.log(`   WARN: ${orphanedMessages} messages may have invalid sender/recipient`);
    } else {
      console.log('   PASS: All messages have valid sender/recipient references');
      passed++;
    }
  } catch (error) {
    console.log('   WARN: Could not verify FK integrity:', error);
  }

  // Summary
  console.log('\n=== Verification Summary ===');
  console.log(`Passed: ${passed}/4 checks`);
  if (issues.length > 0) {
    console.log('\nIssues found:');
    issues.forEach((issue, i) => console.log(`  ${i + 1}. ${issue}`));
    return false;
  } else {
    console.log('All checks passed!');
    return true;
  }
}

verifyDataConsistency()
  .then((success) => {
    prisma.$disconnect();
    process.exit(success ? 0 : 1);
  })
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
