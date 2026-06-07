require('dotenv').config({ path: 'D:/PhapChe/.env.local' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function test() {
  const db = new PrismaClient();

  // Check admin account
  const account = await db.account.findFirst({
    where: { providerId: 'credential', accountId: 'admin.demo@example.test' },
    include: { user: { select: { email: true, id: true } } }
  });

  console.log('Account:', account ? 'FOUND' : 'NOT FOUND');
  if (account) {
    console.log('  accountId:', account.accountId);
    console.log('  userId:', account.userId);
    console.log('  user email:', account.user.email);
    console.log('  has password:', !!account.password);

    if (account.password) {
      const ok = await bcrypt.compare('Demo@123456', account.password);
      console.log('  bcrypt match:', ok);
    }

    const user = await db.user.findUnique({
      where: { id: account.userId },
      select: { id: true, email: true, role: true }
    });
    console.log('  User role:', user?.role);
  }

  // Check what fields are indexed
  const indexes = await db.$queryRaw`
    SELECT indexname, indexdef FROM pg_indexes
    WHERE tablename = 'Account' AND schemaname = 'public'
  `;
  console.log('\nIndexes on Account:');
  for (const idx of indexes) {
    console.log(' ', idx.indexname, '-', idx.indexdef);
  }

  await db.$disconnect();
}

test().catch(e => { console.error('ERR:', e.message); process.exit(1); });
