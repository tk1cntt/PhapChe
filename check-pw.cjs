const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

db.account.findFirst({ where: { providerId: 'credential' } }).then(a => {
  console.log('Hash prefix:', a.password.slice(0, 20));
  const pwd = process.env.TEST_PASSWORD || 'Demo@123456';
  bcrypt.compare(pwd, a.password).then(m => {
    console.log('Match:', m);
    db.$disconnect();
  });
}).catch(e => { console.error(e); process.exit(1); });
