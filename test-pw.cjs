const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const db = new PrismaClient();

  // Check accounts
  const accounts = await db.account.findMany({ where: { providerId: 'credential' } });
  console.log('Accounts found:', accounts.length);
  for (const a of accounts) {
    console.log(' -', a.accountId, 'userId:', a.userId, 'pwd length:', a.password?.length);
  }

  // Check users
  const users = await db.user.findMany({ take: 3 });
  console.log('\nUsers found:', users.length);
  for (const u of users) {
    console.log(' -', u.email);
  }

  // Test bcrypt
  if (accounts.length > 0 && accounts[0].password) {
    const match = await bcrypt.compare('Demo@123456', accounts[0].password);
    console.log('\nBcrypt compare result:', match);
  }

  await db.$disconnect();
}

main().catch(e => { console.error(e.message.split('\n')[0]); process.exit(1); });
