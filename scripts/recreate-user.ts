import { auth } from '../src/auth';
import { prisma } from '../src/lib/prisma';

async function main() {
  const email = 'customer.demo@example.test';

  // Delete only the credential account (keep user and other data)
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    // Delete only credential account
    await prisma.account.deleteMany({
      where: { userId: user.id, providerId: 'credential' }
    });
    console.log('Deleted credential account for', email);

    // Now use better-auth to create new account with correct hash
    try {
      const result = await auth.api.signUpEmail({
        body: { email, name: 'Customer Demo', password: 'Demo@123456' }
      });
      console.log('✅ Account recreated successfully');
    } catch (e: any) {
      console.error('signUpEmail error:', e.message);
    }
  } else {
    console.log('User not found - need to create via seed');
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
