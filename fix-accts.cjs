'use strict';
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  const db = new PrismaClient();
  const accounts = await db.account.findMany({ where: { providerId: 'credential' } });
  console.log('Total credential accounts:', accounts.length);

  for (const account of accounts) {
    const user = await db.user.findUnique({ where: { id: account.userId } });
    if (!user) { console.log('No user for account', account.id); continue; }

    if (account.accountId !== user.email) {
      const existing = await db.account.findFirst({
        where: { accountId: user.email, providerId: 'credential' }
      });

      if (existing) {
        if (account.password && !existing.password) {
          await db.account.update({ where: { id: existing.id }, data: { password: account.password } });
          console.log('Merged pwd: ' + user.email + ' <- ' + account.accountId);
        }
        await db.account.delete({ where: { id: account.id } });
        console.log('Deleted duplicate: ' + account.accountId);
      } else {
        await db.account.update({ where: { id: account.id }, data: { accountId: user.email } });
        console.log('Fixed accountId: ' + user.email);
      }
    } else {
      console.log('OK: ' + user.email + ' accountId correct');
    }
  }

  const test = await db.account.findFirst({ where: { accountId: 'admin.demo@example.test' } });
  if (test?.password) {
    const match = await bcrypt.compare('Demo@123456', test.password);
    console.log('\nBcrypt test: ' + (match ? 'PASS' : 'FAIL'));
  }

  await db.$disconnect();
  console.log('Done!');
}

main().catch(e => { console.error(e.message.split('\n')[0]); process.exit(1); });
