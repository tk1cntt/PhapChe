const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  const db = new PrismaClient();

  const accounts = await db.account.findMany({
    where: { providerId: 'credential' },
    include: { user: { select: { email: true } }
  });

  console.log('Found', accounts.length, 'credential accounts\n');

  for (const acc of accounts) {
    const email = acc.user.email;
    console.log('Account:', email, '| current accountId:', acc.accountId, '| userId:', acc.userId);

    if (acc.accountId !== email) {
      const existing = await db.account.findFirst({
        where: { providerId: 'credential', accountId: email }
      });

      if (existing) {
        console.log('  -> Email account EXISTS, merging...');
        if (acc.password && !existing.password) {
          await db.account.update({
            where: { id: existing.id },
            data: { password: acc.password }
          });
          console.log('  -> Password copied to email account');
        }
        await db.account.delete({ where: { id: acc.id } });
        console.log('  -> Old account deleted');
      } else {
        await db.account.update({
          where: { id: acc.id },
          data: { accountId: email }
        });
        console.log('  -> Fixed accountId to email');
      }
    } else {
      console.log('  -> OK (accountId = email)');
    }
  }

  const test = await db.account.findFirst({ where: { accountId: 'admin.demo@example.test' } });
  if (test && test.password) {
    const match = await bcrypt.compare('Demo@123456', test.password);
    console.log('\nBcrypt test admin:', match ? 'PASS' : 'FAIL');
  }

  await db.$disconnect();
  console.log('Done!');
}

main().catch(e => { console.error(e.message); process.exit(1); });
