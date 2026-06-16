/**
 * Force cleanup - delete specific duplicate records
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function forceCleanup() {
  console.log('=== Force Cleanup ===\n');

  // Find duplicate workspaces by name
  const workspaces = await prisma.workspace.findMany();
  const wsByName = new Map<string, typeof workspaces>();
  workspaces.forEach(w => {
    const list = wsByName.get(w.name) || [];
    list.push(w);
    wsByName.set(w.name, list);
  });

  console.log('Duplicate workspaces:');
  for (const [name, list] of wsByName.entries()) {
    if (list.length > 1) {
      console.log(`  "${name}":`);
      list.forEach((w, i) => console.log(`    ${i + 1}. ${w.id}`));
    }
  }

  // Force delete duplicate workspaces (keep first)
  let deleted = 0;
  for (const [name, list] of wsByName.entries()) {
    if (list.length > 1) {
      for (let i = 1; i < list.length; i++) {
        try {
          await prisma.workspace.delete({ where: { id: list[i].id } });
          deleted++;
          console.log(`  Deleted: ${list[i].id}`);
        } catch (e) {
          console.log(`  Failed to delete ${list[i].id}: ${(e as Error).message}`);
        }
      }
    }
  }
  console.log(`Deleted ${deleted} duplicate workspaces`);

  // Find duplicate requests by code
  const requests = await prisma.legalRequest.findMany({ where: { code: { not: null } } });
  const reqByCode = new Map<string, typeof requests>();
  requests.forEach(r => {
    if (r.code) {
      const list = reqByCode.get(r.code) || [];
      list.push(r);
      reqByCode.set(r.code, list);
    }
  });

  console.log('\nDuplicate requests:');
  for (const [code, list] of reqByCode.entries()) {
    if (list.length > 1) {
      console.log(`  "${code}":`);
      list.forEach((r, i) => console.log(`    ${i + 1}. ${r.id.slice(0, 20)}`));
    }
  }

  // Force delete duplicate requests (keep first by createdAt desc)
  deleted = 0;
  for (const [code, list] of reqByCode.entries()) {
    if (list.length > 1) {
      // Sort by createdAt descending, keep first
      list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      for (let i = 1; i < list.length; i++) {
        try {
          await prisma.legalRequest.delete({ where: { id: list[i].id } });
          deleted++;
          console.log(`  Deleted: ${list[i].id.slice(0, 20)}`);
        } catch (e) {
          console.log(`  Failed to delete ${list[i].id.slice(0, 20)}: ${(e as Error).message}`);
        }
      }
    }
  }
  console.log(`Deleted ${deleted} duplicate requests`);

  console.log('\n=== Done ===');
  console.log(`Organizations: ${await prisma.organization.count()}`);
  console.log(`Workspaces: ${await prisma.workspace.count()}`);
  console.log(`Requests: ${await prisma.legalRequest.count()}`);
}

forceCleanup().catch(console.error).finally(() => prisma.$disconnect());
