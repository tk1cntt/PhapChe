import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

async function main() {
  const email = 'customer.demo@example.test';
  const password = 'Demo@123456';

  const hashedPassword = hashPassword(password);
  console.log('Hashed password created');

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log('User not found');
    return;
  }

  // Delete existing credential account
  const existing = await prisma.account.findFirst({
    where: { userId: user.id, providerId: 'credential' }
  });
  if (existing) {
    await prisma.account.delete({ where: { id: existing.id } });
    console.log('Deleted existing account');
  }

  // Create new account
  await prisma.account.create({
    data: {
      userId: user.id,
      accountId: email,
      providerId: 'credential',
      password: hashedPassword,
    }
  });

  console.log('Account created for:', email);
  console.log('Password set to:', password);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
