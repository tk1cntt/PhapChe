const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function main() {
  const user = await db.user.findUnique({ where: { email: 'admin.demo@example.test' } });
  if (!user) {
    console.log('admin not found');
    await db.$disconnect();
    return;
  }
  console.log('User:', user.email, user.id, 'isActive:', user.isActive);

  const account = await db.account.findFirst({ where: { userId: user.id } });
  console.log('Account:', JSON.stringify(account));

  await db.$disconnect();
}

main().catch(e => { console.error(e.message.split('\n')[0]); process.exit(1); });
