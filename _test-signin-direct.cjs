require('dotenv').config({ path: 'D:/PhapChe/.env.local' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  const db = new PrismaClient();

  // Simulate better-auth's signIn.email lookup
  // better-auth looks for Account where:
  //   providerId = 'credential'
  //   accountId = email
  const email = 'admin.demo@example.test';
  const password = 'Demo@123456';

  const account = await db.account.findFirst({
    where: {
      providerId: 'credential',
      accountId: email,
    },
  });

  if (!account) {
    console.log('No account found for:', email);
  } else {
    console.log('Account found');
    console.log('  accountId:', account.accountId);
    console.log('  has password:', !!account.password);

    if (account.password) {
      const match = await bcrypt.compare(password, account.password);
      console.log('  bcrypt match:', match);

      if (match) {
        // Simulate what better-auth would do after password match
        // It creates a session and returns session token
        console.log('\n  >> Password verified! Auth should succeed.');

        // Get user
        const user = await db.user.findUnique({
          where: { id: account.userId },
          select: { id: true, email: true }
        });
        console.log('  >> User:', JSON.stringify(user));

        // Check sessions table
        const sessions = await db.session.findMany({
          where: { userId: account.userId },
          select: { id: true, token: true, expiresAt: true }
        });
        console.log('  >> Sessions:', sessions.length);
      }
    } else {
      console.log('  NO PASSWORD in DB!');
    }
  }

  await db.$disconnect();
}

main().catch(e => { console.error('ERR:', e.message); process.exit(1); });
