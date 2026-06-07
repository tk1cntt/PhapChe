const bcrypt = require('bcryptjs');

const passwords = [
  { email: 'admin.demo@example.test', password: 'Demo@123456' },
  { email: 'specialist.demo@example.test', password: 'Demo@123456' },
  { email: 'reviewer.demo@example.test', password: 'Demo@123456' },
  { email: 'customer.demo@example.test', password: 'Demo@123456' },
];

async function main() {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  for (const { email, password } of passwords) {
    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log(`User not found: ${email}`);
      continue;
    }

    await prisma.account.upsert({
      where: {
        providerId_accountId: {
          providerId: 'credential',
          accountId: email,
        },
      },
      update: { password: hash },
      create: {
        userId: user.id,
        accountId: email,
        providerId: 'credential',
        password: hash,
      },
    });
    console.log(`Updated password for: ${email}`);
  }

  await prisma.$disconnect();
  console.log('Done!');
}

main().catch(e => { console.error(e); process.exit(1); });
