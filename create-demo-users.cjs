const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function main() {
  try {
    const workspace = await db.workspace.findFirst();
    if (!workspace) { console.log('No workspace'); return; }
    console.log('Workspace:', workspace.id);

    const users = [
      { email: 'admin.demo@example.test', name: 'Admin Demo', role: 'super_admin' },
      { email: 'customer.demo@example.test', name: 'Customer Demo', role: 'customer' },
      { email: 'specialist.demo@example.test', name: 'Specialist Demo', role: 'specialist' },
      { email: 'reviewer.demo@example.test', name: 'Reviewer Demo', role: 'reviewer' },
    ];

    for (const u of users) {
      let user = await db.user.findUnique({ where: { email: u.email } });
      if (user) {
        console.log('Exists:', u.email, user.id);
      } else {
        const newUser = await db.user.create({
          data: {
            email: u.email,
            name: u.name,
            isActive: true,
            emailVerified: true,
            memberships: {
              create: { workspaceId: workspace.id, role: u.role, isActive: true }
            }
          }
        });
        await db.account.create({
          data: {
            userId: newUser.id,
            accountId: u.email,
            providerId: 'credential',
            password: 'Demo@123456',
          }
        });
        console.log('Created:', u.email, newUser.id, 'role:', u.role);
      }
    }
    console.log('Done!');
  } catch(e) {
    console.error('Error:', e.message);
  } finally {
    await db.$disconnect();
  }
}

main();
