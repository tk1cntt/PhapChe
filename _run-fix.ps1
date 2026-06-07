# Test script
Set-Location D:\PhapChe
node -e "@
const {PrismaClient} = require('@prisma/client');
const db = new PrismaClient();
db.account.findMany({where:{providerId:'credential'}}).then(a => {
  console.log('accounts:', a.length);
  a.forEach(acc => console.log(' -', acc.accountId, 'userId:', acc.userId));
  db.\$disconnect();
}).catch(e => { console.error('ERR:', e.message); process.exit(1); });
@"
