const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  const hash = await bcrypt.hash('Demo@123456', 10);
  const result = await prisma.account.updateMany({
    where: { providerId: 'credential' },
    data: { password: hash },
  });
  console.log('Updated', result.count, 'accounts with new hash');
  await prisma.$disconnect();
}

main().catch(console.error);
