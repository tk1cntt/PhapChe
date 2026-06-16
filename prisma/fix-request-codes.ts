/**
 * Fix duplicate request codes
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixDuplicateCodes() {
  console.log('=== Fixing Duplicate Request Codes ===\n');

  const reqs = await prisma.legalRequest.findMany({
    where: { code: { not: null } },
    orderBy: { createdAt: 'asc' }
  });

  const byCode = new Map<string, typeof reqs>();
  reqs.forEach(r => {
    if (r.code) {
      const list = byCode.get(r.code) || [];
      list.push(r);
      byCode.set(r.code, list);
    }
  });

  let count = 0;
  for (const [code, list] of byCode.entries()) {
    if (list.length > 1) {
      for (let i = 1; i < list.length; i++) {
        const newCode = code + '-' + String.fromCharCode(97 + i); // -b, -c, etc.
        await prisma.legalRequest.update({
          where: { id: list[i].id },
          data: { code: newCode }
        });
        console.log(`  ${code} -> ${newCode}`);
        count++;
      }
    }
  }

  console.log(`\nFixed ${count} duplicate codes`);
}

fixDuplicateCodes()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
