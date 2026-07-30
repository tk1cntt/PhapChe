const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  const password = process.env.RESET_PASSWORD;
  if (!password) { console.error('RESET_PASSWORD env var required'); process.exit(1); }
  const hash = await bcrypt.hash(password, 10);
  const result = await prisma.account.updateMany({
    where: { providerId: 'credential' },
    data: { password: hash },
  });
  console.log('Updated', result.count, 'accounts with new hash');
  await prisma.$disconnect();
}

main().catch(console.error);
