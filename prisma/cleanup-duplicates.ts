/**
 * Cleanup duplicate data in database
 * Removes duplicate workspaces and requests, keeps unique data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDuplicates() {
  console.log('=== Cleanup Duplicate Data ===\n');

  // 1. Find duplicate workspaces
  const workspaces = await prisma.workspace.findMany({
    orderBy: { createdAt: 'desc' }
  });

  const wsNameCount = new Map<string, typeof workspaces>();
  workspaces.forEach(w => {
    const existing = wsNameCount.get(w.name) || [];
    existing.push(w);
    wsNameCount.set(w.name, existing);
  });

  console.log('--- Cleaning up duplicate workspaces ---');
  for (const [name, wsList] of wsNameCount.entries()) {
    if (wsList.length > 1) {
      // Keep the first (most recent), delete others
      const [keep, ...deleteList] = wsList;
      console.log(`Duplicate: "${name}" - keeping ${keep.id}, deleting ${deleteList.map(w => w.id).join(', ')}`);
      for (const ws of deleteList) {
        await prisma.workspace.delete({ where: { id: ws.id } }).catch(() => {});
      }
    }
  }

  // 2. Find duplicate requests
  const requests = await prisma.legalRequest.findMany({
    where: { code: { not: null } },
    orderBy: { createdAt: 'desc' }
  });

  const reqCodeCount = new Map<string, typeof requests>();
  requests.forEach(r => {
    if (r.code) {
      const existing = reqCodeCount.get(r.code) || [];
      existing.push(r);
      reqCodeCount.set(r.code, existing);
    }
  });

  console.log('\n--- Cleaning up duplicate requests ---');
  for (const [code, reqList] of reqCodeCount.entries()) {
    if (reqList.length > 1) {
      // Keep the first (most recent), delete others
      const [keep, ...deleteList] = reqList;
      console.log(`Duplicate: "${code}" - keeping ${keep.id}, deleting ${deleteList.map(r => r.id).join(', ')}`);
      for (const req of deleteList) {
        await prisma.legalRequest.delete({ where: { id: req.id } }).catch(() => {});
      }
    }
  }

  // 3. Generate new unique codes for remaining requests if needed
  console.log('\n--- Generating unique request codes ---');
  const allRequests = await prisma.legalRequest.findMany({
    where: { code: null },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  let codeCounter = 90; // Start from higher number to avoid conflicts
  for (const req of allRequests) {
    let newCode = `REQ-2026-${String(codeCounter).padStart(3, '0')}`;
    await prisma.legalRequest.update({
      where: { id: req.id },
      data: { code: newCode }
    });
    console.log(`  ${req.id.slice(0, 10)} -> ${newCode}`);
    codeCounter--;
  }

  console.log('\n=== Cleanup Complete ===\n');

  // Summary
  console.log('Final counts:');
  console.log(`  Organizations: ${await prisma.organization.count()}`);
  console.log(`  Workspaces: ${await prisma.workspace.count()}`);
  console.log(`  Legal Requests: ${await prisma.legalRequest.count()}`);
  console.log(`  Users: ${await prisma.user.count()}`);
}

cleanupDuplicates()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
