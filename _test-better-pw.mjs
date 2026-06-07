import { hashPassword, verifyPassword } from '@better-auth/utils/password';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
require('dotenv').config({ path: 'D:/PhapChe/.env.local' });
const { PrismaClient } = require('@prisma/client');

async function main() {
  const db = new PrismaClient();
  const account = await db.account.findFirst({
    where: { providerId: 'credential', accountId: 'admin.demo@example.test' }
  });

  if (!account) { console.log('No account'); await db.$disconnect(); return; }

  const hash = account.password;
  const password = 'Demo@123456';
  const [saltHex, keyHex] = hash.split(':');

  console.log('=== Analysis ===');
  console.log('Hash len:', hash.length);
  console.log('Salt hex:', saltHex, '(len=' + saltHex.length + ')');
  console.log('Key hex:', keyHex, '(len=' + keyHex.length + ')');
  console.log('Key hex (last 20):', keyHex.slice(-20));
  console.log('Key hex is lowercase?', keyHex === keyHex.toLowerCase());
  console.log('Salt hex is lowercase?', saltHex === saltHex.toLowerCase());

  // Try generating with lowercase salt
  const newHash = await hashPassword(password);
  const [newSalt, newKey] = newHash.split(':');
  console.log('\nNew hash salt:', newSalt, '(len=' + newSalt.length + ')');
  console.log('New hash key:', newKey, '(len=' + newKey.length + ')');
  console.log('New salt is lowercase?', newSalt === newSalt.toLowerCase());
  console.log('New key is lowercase?', newKey === newKey.toLowerCase());

  // Test: can we verify our own new hash?
  const ok1 = await verifyPassword(newHash, password);
  console.log('\nVerify own new hash:', ok1);

  // Test: verify the DB hash
  const ok2 = await verifyPassword(hash, password);
  console.log('Verify DB hash:', ok2);

  // Is the key actually 64 bytes?
  console.log('\nKey bytes:', Buffer.from(keyHex, 'hex').length, 'expected 64');

  // What if we generate and immediately verify the same hash?
  const h = await hashPassword('Demo@123456');
  const v = await verifyPassword(h, 'Demo@123456');
  console.log('Generate then verify same pwd:', v);

  await db.$disconnect();
}

main().catch(e => { console.error('ERR:', e.message); process.exit(1); });
