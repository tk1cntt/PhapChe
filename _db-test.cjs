require('dotenv').config({ path: 'D:/PhapChe/.env.local' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const db = new PrismaClient();

async function main() {
  const accounts = await db.account.findMany({
    where: { providerId: 'credential' },
    include: { user: { select: { email: true } } }
  });

  console.log('Credential accounts:');
  for (const acc of accounts) {
    const pwdSet = !!acc.password;
    let bcryptOk = false;
    if (acc.password) {
      bcryptOk = await bcrypt.compare('Demo@123456', acc.password);
    }
    console.log(`  ${acc.user.email} | pwd: ${pwdSet ? 'YES' : 'NO'} | bcrypt: ${bcryptOk ? 'PASS' : '---'}`);
  }

  await db.$disconnect();
}

main().catch(e => { console.error('ERR:', JSON.stringify(e)); process.exit(1); });
