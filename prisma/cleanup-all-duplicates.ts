/**
 * Full cleanup - remove ALL duplicates
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fullCleanup() {
  console.log('=== Full Cleanup ===\n');

  // 1. Workspaces
  console.log('--- Workspaces ---');
  const workspaces = await prisma.workspace.findMany({ orderBy: { createdAt: 'desc' } });
  const wsByName = new Map<string, typeof workspaces>();
  workspaces.forEach(w => {
    const list = wsByName.get(w.name) || [];
    list.push(w);
    wsByName.set(w.name, list);
  });

  let wsDeleted = 0;
  for (const [name, list] of wsByName.entries()) {
    if (list.length > 1) {
      const [keep, ...remove] = list;
      for (const w of remove) {
        await prisma.workspace.delete({ where: { id: w.id } }).catch(() => {});
        wsDeleted++;
      }
      console.log(`  "${name}": kept ${keep.id}, deleted ${remove.length}`);
    }
  }
  console.log(`  Deleted ${wsDeleted} duplicate workspaces`);

  // 2. Requests - keep unique by code
  console.log('\n--- Requests by code ---');
  const requests = await prisma.legalRequest.findMany({
    where: { code: { not: null } },
    orderBy: { createdAt: 'desc' }
  });
  const reqByCode = new Map<string, typeof requests>();
  requests.forEach(r => {
    if (r.code) {
      const list = reqByCode.get(r.code) || [];
      list.push(r);
      reqByCode.set(r.code, list);
    }
  });

  let reqDeleted = 0;
  for (const [code, list] of reqByCode.entries()) {
    if (list.length > 1) {
      const [keep, ...remove] = list;
      for (const r of remove) {
        await prisma.legalRequest.delete({ where: { id: r.id } }).catch(() => {});
        reqDeleted++;
      }
      console.log(`  "${code}": kept ${keep.id.slice(0, 15)}, deleted ${remove.length}`);
    }
  }
  console.log(`  Deleted ${reqDeleted} duplicate requests`);

  // 3. Update null codes
  console.log('\n--- Assigning codes to requests without codes ---');
  const nullCodeReqs = await prisma.legalRequest.findMany({
    where: { code: null },
    orderBy: { createdAt: 'asc' }
  });

  let nextCode = 200; // Start from high number to avoid conflicts
  for (const req of nullCodeReqs) {
    const newCode = `REQ-2026-${String(nextCode).padStart(3, '0')}`;
    await prisma.legalRequest.update({
      where: { id: req.id },
      data: { code: newCode }
    });
    nextCode++;
  }
  console.log(`  Assigned ${nullCodeReqs.length} new codes`);

  // Final counts
  console.log('\n=== Final Counts ===');
  console.log(`  Organizations: ${await prisma.organization.count()}`);
  console.log(`  Workspaces: ${await prisma.workspace.count()}`);
  console.log(`  Legal Requests: ${await prisma.legalRequest.count()}`);
  console.log(`  Vault Files: ${await prisma.vaultFile.count()}`);
  console.log(`  Audit Events: ${await prisma.auditEvent.count()}`);
}

fullCleanup().catch(console.error).finally(() => prisma.$disconnect());
