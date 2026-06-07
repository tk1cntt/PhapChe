require('dotenv').config({ path: 'D:/PhapChe/.env.local' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  const db = new PrismaClient();
  const password = 'Demo@123456';

  console.log('Regenerating all credential account passwords...\n');

  // Verify new hash is valid
  const testHash = await bcrypt.hash(password, 10);
  const testOk = await bcrypt.compare(password, testHash);
  console.log('New bcrypt test:', testOk ? 'OK' : 'FAIL');
  console.log('New hash length:', testHash.length);
  console.log('New hash:', testHash);
  console.log();

  const accounts = await db.account.findMany({ where: { providerId: 'credential' } });
  console.log('Updating', accounts.length, 'accounts...');

  for (const acc of accounts) {
    const newHash = await bcrypt.hash(password, 10);
    await db.account.update({
      where: { id: acc.id },
      data: { password: newHash }
    });
    console.log(`Updated: ${acc.accountId} (new hash len=${newHash.length})`);

    // Verify immediately
    const verify = await bcrypt.compare(password, newHash);
    console.log(`  Verify: ${verify ? 'OK' : 'FAIL'}`);
  }

  await db.$disconnect();
  console.log('\nDone!');
}

main().catch(e => { console.error('ERR:', e.message); process.exit(1); });
