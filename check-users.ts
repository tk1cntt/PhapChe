import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const count = await prisma.user.count();
  console.log('Total users:', count);

  const users = await prisma.user.findMany({
    where: { email: { contains: 'demo' } },
    take: 10
  });
  console.log('Demo users found:', users.length);
  users.forEach(u => console.log('-', u.email));

  // Also check Account table for better-auth
  const accounts = await prisma.account.findMany({ take: 5 });
  console.log('Accounts:', accounts.length);

  await prisma.$disconnect();
}

check().catch(console.error);
