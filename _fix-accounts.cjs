require('dotenv').config({ path: 'D:/PhapChe/.env.local' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const db = new PrismaClient();

async function main() {
  const accounts = await db.account.findMany({
    where: { providerId: 'credential' },
    include: { user: { select: { email: true } } }
  });

  console.log('Fixing', accounts.length, 'credential accounts...\n');

  for (const acc of accounts) {
    const email = acc.user.email;
    const current = acc.accountId;

    if (current !== email) {
      // Check if there's already a correct account for this email
      const existing = await db.account.findFirst({
        where: { providerId: 'credential', accountId: email }
      });

      if (existing) {
        // Merge: copy password if needed, delete the old one
        if (acc.password && !existing.password) {
          await db.account.update({
            where: { id: existing.id },
            data: { password: acc.password }
          });
          console.log(`MERGED: password from "${current}" -> "${email}"`);
        } else {
          console.log(`MERGED: "${current}" -> "${email}" (password already set)`);
        }
        await db.account.delete({ where: { id: acc.id } });
        console.log(`  DELETED old account ${acc.id}`);
      } else {
        // Just rename the accountId
        await db.account.update({
          where: { id: acc.id },
          data: { accountId: email }
        });
        console.log(`RENAMED: "${current}" -> "${email}"`);
      }
    } else {
      console.log(`OK: "${email}" already correct`);
    }
  }

  // Verify
  console.log('\n--- Verification ---');
  const remaining = await db.account.findMany({ where: { providerId: 'credential' } });
  console.log('Remaining credential accounts:', remaining.length);
  for (const a of remaining) {
    const match = a.accountId === a.user.email ? 'OK' : 'MISMATCH';
    console.log(`  [${match}] ${a.accountId}`);
  }

  // Bcrypt test
  const adminAcc = await db.account.findFirst({ where: { accountId: 'admin.demo@example.test' } });
  if (adminAcc?.password) {
    const ok = await bcrypt.compare('Demo@123456', adminAcc.password);
    console.log('\nBcrypt test admin.demo@example.test:', ok ? 'PASS' : 'FAIL');
  }

  await db.$disconnect();
  console.log('\nDone!');
}

main().catch(e => { console.error('ERR:', JSON.stringify(e)); process.exit(1); });
